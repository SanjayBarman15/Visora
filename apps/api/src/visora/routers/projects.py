from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from visora_db import get_supabase_admin_client
from visora_schemas import ProjectCreate, ProjectOut
from visora.dependencies import get_current_user

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
