from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class SceneBase(BaseModel):
    title: str
    visual_description: Optional[str] = None
    approximate_duration_seconds: Optional[float] = None
    transition_type: Optional[str] = None
    complexity: str = "medium"

class SceneCreate(SceneBase):
    project_id: UUID
    scene_index: int

class SceneOut(SceneBase):
    id: UUID
    project_id: UUID
    scene_index: int
    complexity_score: float
    status: str
    is_dirty: bool
    clip_url: Optional[str] = None
    code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
