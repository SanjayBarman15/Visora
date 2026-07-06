from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID
from visora_db import get_supabase_admin_client
from visora_schemas import SceneOut
from visora.dependencies import get_current_user

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
        # To avoid schema typing issues with pgvector or special array formats, mapping DB representation to schema:
        results = []
        for row in scenes_res.data:
            results.append(row)
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
