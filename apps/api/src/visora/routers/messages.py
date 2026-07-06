import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from visora_db import get_supabase_admin_client
from visora_schemas import MessageCreate, MessageOut
from visora.dependencies import get_current_user
from visora_tools import call_nim_model

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/messages", tags=["Messages"])

def ensure_session(session_id: str, user_id: str, project_id: str):
    supabase = get_supabase_admin_client()
    try:
        res = supabase.table("sessions").select("id").eq("id", session_id).execute()
        if not res.data:
            supabase.table("sessions").insert({
                "id": session_id,
                "user_id": user_id,
                "project_id": project_id
            }).execute()
    except Exception:
        pass

@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_message(msg: MessageCreate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    supabase = get_supabase_admin_client()
    
    # 1. Verify project ownership
    project_res = supabase.table("projects").select("user_id").eq("id", str(msg.project_id)).execute()
    if not project_res.data:
        raise HTTPException(status_code=404, detail="Project not found")
    if project_res.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # 2. Ensure session exists
    if msg.session_id:
        ensure_session(msg.session_id, user_id, str(msg.project_id))
        
    # 3. Call NIM API
    model_name = os.getenv("NVIDIA_MODEL_SCOUT", "meta/llama-3.2-3b-instruct")
    system_prompt = (
        "You are Scout, the requirements elicitation agent for Visora. "
        "Your goal is to gather requirements for a Manim educational animation project. "
        "Respond to the user's prompt by asking one clear, focused clarifying question to help detail the animation."
    )
    api_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": msg.raw_prompt}
    ]
    
    try:
        response_text = await call_nim_model(model_name=model_name, messages=api_messages)
    except Exception as e:
        logger.error(f"Failed to call NIM model: {e}")
        response_text = "I encountered an error connecting to the AI models, but I am ready to design your animation. What specific visual elements should we include?"

    elicitation_turns = [
        {"role": "user", "content": msg.raw_prompt},
        {"role": "assistant", "content": response_text}
    ]
        
    # 4. Create prompt history entry
    try:
        res = supabase.table("prompt_history").insert({
            "project_id": str(msg.project_id),
            "user_id": user_id,
            "session_id": msg.session_id,
            "raw_prompt": msg.raw_prompt,
            "elicitation_turns": elicitation_turns,
            "requirements": {}
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create message")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/project/{project_id}", response_model=List[MessageOut])
async def list_messages(project_id: UUID, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    supabase = get_supabase_admin_client()
    
    try:
        # Verify ownership
        project_res = supabase.table("projects").select("user_id").eq("id", str(project_id)).execute()
        if not project_res.data:
            raise HTTPException(status_code=404, detail="Project not found")
        if project_res.data[0]["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
            
        res = supabase.table("prompt_history").select("*").eq("project_id", str(project_id)).order("created_at").execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
