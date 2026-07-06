from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class ProjectBase(BaseModel):
    title: str
    has_voiceover: bool = False
    has_background_music: bool = False

class ProjectCreate(ProjectBase):
    pass

class ProjectOut(ProjectBase):
    id: UUID
    user_id: UUID
    status: str
    total_scenes: int
    completed_scenes: int
    final_video_url: Optional[str] = None
    final_video_duration_seconds: Optional[float] = None
    voiceover_status: str
    audio_mix_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
