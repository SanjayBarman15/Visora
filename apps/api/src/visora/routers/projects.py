import os
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from visora_db import get_supabase_admin_client
from visora_schemas import ProjectCreate, ProjectOut, SceneOut
from visora.dependencies import get_current_user
from visora_tools import call_nim_model

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/projects", tags=["Projects"])

def ensure_user_profile(user_id: str, email: str):
    """
    Ensures that a profile exists in the profiles table for the given user_id.
    This helps prevent foreign key violation errors, especially during local development/mocking.
    """
    supabase = get_supabase_admin_client()
    try:
        res = supabase.table("profiles").select("id").eq("id", user_id).execute()
        if not res.data:
            supabase.table("profiles").insert({
                "id": user_id,
                "email": email,
                "display_name": email.split("@")[0],
                "subscription_tier": "free"
            }).execute()
    except Exception as e:
        # Log error or pass if it's due to auth.users constraint
        pass

@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    email = current_user.get("email", "unknown@visora.ai")
    ensure_user_profile(user_id, email)
    
    supabase = get_supabase_admin_client()
    try:
        res = supabase.table("projects").insert({
            "user_id": user_id,
            "title": project_data.title,
            "has_voiceover": project_data.has_voiceover,
            "has_background_music": project_data.has_background_music
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create project")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("", response_model=List[ProjectOut])
async def list_projects(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    supabase = get_supabase_admin_client()
    try:
        res = supabase.table("projects").select("*").eq("user_id", user_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: UUID, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    supabase = get_supabase_admin_client()
    try:
        res = supabase.table("projects").select("*").eq("id", str(project_id)).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        project = res.data[0]
        if project["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        return project
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{project_id}/plan", response_model=List[SceneOut])
async def generate_project_plan(project_id: UUID, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    supabase = get_supabase_admin_client()
    
    # 1. Verify project ownership
    try:
        project_res = supabase.table("projects").select("*").eq("id", str(project_id)).execute()
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        project = project_res.data[0]
        if project["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
    # 2. Get prompt history
    try:
        history_res = supabase.table("prompt_history").select("raw_prompt").eq("project_id", str(project_id)).order("created_at", desc=True).limit(1).execute()
        if not history_res.data:
            raise HTTPException(status_code=400, detail="No prompt history found for this project")
        prompt = history_res.data[0]["raw_prompt"]
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 3. Call Orion via NIM
    model_name = os.getenv("NVIDIA_MODEL_ORION", "nvidia/nemotron-3-ultra-550b-a55b")
    system_prompt = (
        "You are Orion, the animation planner agent for Visora. "
        "Generate exactly one scene plan for the animation topic in JSON format. "
        "The output must be a single JSON object with keys:\n"
        '- "title": A short visual title.\n'
        '- "visual_description": A detailed description of what is drawn on screen (suitable for Manim generation).\n'
        '- "approximate_duration_seconds": A float representing duration in seconds.\n\n'
        "Return ONLY the raw JSON object. Do not include markdown tags like ```json or any conversational filler."
    )
    api_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Topic: {prompt}"}
    ]
    
    try:
        response_text = await call_nim_model(model_name=model_name, messages=api_messages)
        # Parse JSON from response
        clean_text = response_text.strip()
        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_text = "\n".join(lines).strip()
            
        scene_data = json.loads(clean_text)
    except Exception as e:
        logger.error(f"Failed to generate plan via Orion: {e}")
        scene_data = {
            "title": "Introduction to " + project["title"],
            "visual_description": f"Draw grid, write equation text for topic: {prompt}.",
            "approximate_duration_seconds": 5.0
        }

    # 4. Insert into scenes table
    try:
        existing = supabase.table("scenes").select("id").eq("project_id", str(project_id)).eq("scene_index", 1).execute()
        if existing.data:
            res = supabase.table("scenes").update({
                "title": scene_data.get("title", "Introduction"),
                "visual_description": scene_data.get("visual_description", ""),
                "approximate_duration_seconds": float(scene_data.get("approximate_duration_seconds", 5.0)),
                "expected_animation_types": [],
                "dependency_scene_indexes": []
            }).eq("id", existing.data[0]["id"]).execute()
        else:
            res = supabase.table("scenes").insert({
                "project_id": str(project_id),
                "scene_index": 1,
                "title": scene_data.get("title", "Introduction"),
                "visual_description": scene_data.get("visual_description", ""),
                "approximate_duration_seconds": float(scene_data.get("approximate_duration_seconds", 5.0)),
                "expected_animation_types": [],
                "dependency_scene_indexes": [],
                "complexity": "medium",
                "status": "pending"
            }).execute()
            
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to persist scene plan")
            
        # Update project status to plan_review
        supabase.table("projects").update({"status": "plan_review"}).eq("id", str(project_id)).execute()
        
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
