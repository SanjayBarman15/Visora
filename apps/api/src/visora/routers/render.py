"""
render.py — FastAPI router for the Manim render pipeline.

Endpoints:
  POST /api/render/submit   — Queue a render job, return checkpoint_id immediately
  GET  /api/render/status/{checkpoint_id} — Fallback polling for render status
"""

import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client

# Import the Celery task from the workers package
from visora_workers.tasks.render_scene import render_manim_scene

load_dotenv()

router = APIRouter(prefix="/api/render", tags=["render"])


def _get_supabase():
    url = os.environ["SUPABASE_PROJECT_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


# ── Request / Response models ──────────────────────────────────────────────────

class RenderSubmitRequest(BaseModel):
    project_id: str
    code: str
    scene_class_name: str
    scene_title: Optional[str] = "Scene"
    scene_description: Optional[str] = ""
    duration_seconds: Optional[float] = 30.0


class RenderSubmitResponse(BaseModel):
    checkpoint_id: str
    scene_id: str
    message: str


class RenderStatusResponse(BaseModel):
    checkpoint_id: str
    render_status: str
    clip_url: Optional[str] = None
    render_error: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/submit", response_model=RenderSubmitResponse)
def submit_render(payload: RenderSubmitRequest):
    """
    Queue a Manim render job.

    1. Creates a `scenes` row (scene_index=0, single-scene flow for now)
    2. Creates a `scene_checkpoints` row with render_status='pending'
    3. Dispatches the Celery task
    4. Returns checkpoint_id immediately — frontend polls or uses Realtime
    """
    supabase = _get_supabase()

    # ── Create or get the scenes row ──────────────────────────────────────
    existing_scene = supabase.table("scenes").select("id").eq("project_id", payload.project_id).eq("scene_index", 0).execute()
    
    if existing_scene.data:
        scene_id = existing_scene.data[0]["id"]
        supabase.table("scenes").update({
            "title": payload.scene_title or "Scene",
            "visual_description": payload.scene_description or "",
            "approximate_duration_seconds": payload.duration_seconds or 30.0,
            "status": "pending",
        }).eq("id", scene_id).execute()
    else:
        scene_resp = supabase.table("scenes").insert({
            "project_id": payload.project_id,
            "scene_index": 0,
            "title": payload.scene_title or "Scene",
            "visual_description": payload.scene_description or "",
            "approximate_duration_seconds": payload.duration_seconds or 30.0,
            "status": "pending",
            "complexity": "medium",
        }).select("id").execute()

        if not scene_resp.data:
            raise HTTPException(status_code=500, detail="Failed to create scene record")

        scene_id = scene_resp.data[0]["id"]

    # ── Calculate next attempt_number for checkpoint ───────────────────────
    checkpoints_resp = supabase.table("scene_checkpoints").select("attempt_number").eq("scene_id", scene_id).order("attempt_number", desc=True).limit(1).execute()
    attempt_number = 1
    if checkpoints_resp.data:
        attempt_number = checkpoints_resp.data[0]["attempt_number"] + 1

    # ── Create the scene_checkpoints row ──────────────────────────────────
    checkpoint_resp = supabase.table("scene_checkpoints").insert({
        "scene_id": scene_id,
        "project_id": payload.project_id,
        "scene_index": 0,
        "generated_code": payload.code,
        "render_status": "pending",
        "attempt_number": attempt_number,
    }).select("id").execute()

    if not checkpoint_resp.data:
        raise HTTPException(status_code=500, detail="Failed to create checkpoint record")

    checkpoint_id = checkpoint_resp.data[0]["id"]

    # ── Dispatch the Celery task (non-blocking) ────────────────────────────
    task = render_manim_scene.delay(
        checkpoint_id=checkpoint_id,
        code=payload.code,
        scene_class_name=payload.scene_class_name,
        project_id=payload.project_id,
        scene_id=scene_id,
    )

    # Save the Celery task ID to the checkpoint for tracking
    supabase.table("scene_checkpoints").update(
        {"celery_task_id": task.id}
    ).eq("id", checkpoint_id).execute()

    return RenderSubmitResponse(
        checkpoint_id=checkpoint_id,
        scene_id=scene_id,
        message="Render queued successfully",
    )


@router.get("/status/{checkpoint_id}", response_model=RenderStatusResponse)
def get_render_status(checkpoint_id: str):
    """
    Fallback polling endpoint — returns current render status and clip_url.
    The frontend primarily uses Supabase Realtime, but this is available as backup.
    """
    supabase = _get_supabase()

    resp = supabase.table("scene_checkpoints").select(
        "id, render_status, clip_url, render_error"
    ).eq("id", checkpoint_id).execute()

    if not resp.data:
        raise HTTPException(status_code=404, detail="Checkpoint not found")

    data = resp.data[0]
    return RenderStatusResponse(
        checkpoint_id=data["id"],
        render_status=data["render_status"],
        clip_url=data.get("clip_url"),
        render_error=data.get("render_error"),
    )
