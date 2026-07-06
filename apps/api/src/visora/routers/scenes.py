import os
import logging
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from visora_db import get_supabase_admin_client
from visora_schemas import SceneOut
from visora_tools import call_nim_model
from visora_workers import render_scene_task
from visora.dependencies import get_current_user

logger = logging.getLogger("uvicorn")

router = APIRouter(tags=["Scenes"])

@router.get("/projects/{project_id}/scenes", response_model=List[SceneOut])
async def list_scenes(project_id: UUID, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    supabase = get_supabase_admin_client()
    
    try:
        # Verify ownership of the project first
        project_res = supabase.table("projects").select("user_id").eq("id", str(project_id)).execute()
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        if project_res.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        # Get scenes
        scenes_res = supabase.table("scenes").select("*").eq("project_id", str(project_id)).order("scene_index").execute()
        
        # Prepare scenes response
        results = []
        for row in scenes_res.data:
            # Fetch latest checkpoint details
            checkpoint_res = supabase.table("scene_checkpoints").select("clip_url, generated_code, final_code").eq("scene_id", row["id"]).order("created_at", desc=True).limit(1).execute()
            if checkpoint_res.data:
                row["clip_url"] = checkpoint_res.data[0].get("clip_url")
                row["code"] = checkpoint_res.data[0].get("final_code") or checkpoint_res.data[0].get("generated_code") or ""
            else:
                row["clip_url"] = None
                row["code"] = ""
            results.append(row)
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/scenes/{scene_id}/generate")
async def generate_scene_code(scene_id: UUID, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    supabase = get_supabase_admin_client()
    
    # 1. Fetch scene details
    try:
        scene_res = supabase.table("scenes").select("*").eq("id", str(scene_id)).execute()
        if not scene_res.data:
            raise HTTPException(status_code=404, detail="Scene not found")
        scene = scene_res.data[0]
        project_id = scene["project_id"]
        scene_index = scene["scene_index"]
        visual_description = scene["visual_description"]
        title = scene["title"]
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    # 2. Verify project ownership
    try:
        project_res = supabase.table("projects").select("user_id").eq("id", project_id).execute()
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        if project_res.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 3. Call Forge via NIM
    model_name = os.getenv("NVIDIA_MODEL_FORGE", "nvidia/llama-3.3-nemotron-super-49b-v1.5")
    system_prompt = (
        "You are Forge, the Manim code generator for Visora. "
        "Generate executable Python code using the Manim library to animate the requested scene.\n"
        "Important Rules:\n"
        "1. Output ONLY valid, executable Python code.\n"
        "2. The code should define a Manim Scene class.\n"
        "3. Do not include markdown code block formatting (like ```python) or any explanation. Start directly with imports (e.g. from manim import *)."
    )
    api_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Scene Title: {title}\nDescription: {visual_description}"}
    ]
    
    try:
        response_text = await call_nim_model(model_name=model_name, messages=api_messages)
        clean_code = response_text.strip()
        if clean_code.startswith("```"):
            lines = clean_code.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_code = "\n".join(lines).strip()
    except Exception as e:
        logger.error(f"Failed to generate Manim code via Forge: {e}")
        clean_code = (
            "from manim import *\n\n"
            "class GeneratedScene(Scene):\n"
            "    def construct(self):\n"
            "        text = Text('Calculus Integration')\n"
            "        self.play(Write(text))\n"
            "        self.wait(2)\n"
        )

    # 4. Insert/update scene_checkpoints table
    try:
        existing = supabase.table("scene_checkpoints").select("id").eq("scene_id", str(scene_id)).execute()
        
        checkpoint_data = {
            "scene_id": str(scene_id),
            "project_id": project_id,
            "scene_index": scene_index,
            "attempt_number": 1,
            "generated_code": clean_code,
            "final_code": clean_code,
            "render_status": "pending"
        }
        
        if existing.data:
            res = supabase.table("scene_checkpoints").update(checkpoint_data).eq("id", existing.data[0]["id"]).execute()
        else:
            res = supabase.table("scene_checkpoints").insert(checkpoint_data).execute()
            
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save scene checkpoint")
            
        # Update scene status to generating
        supabase.table("scenes").update({"status": "generating"}).eq("id", str(scene_id)).execute()
        
        # Trigger Celery task
        checkpoint_id = res.data[0]["id"]
        render_scene_task.delay(str(checkpoint_id))
        
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
