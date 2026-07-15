from pydantic import BaseModel, Field

class ForgeCode(BaseModel):
    """Forge's contract — validated python string, not just raw text."""
    code: str
    scene_class_name: str = Field(default="GeneratedScene", description="The class name of the generated Manim Scene.")
