import os
from typing import Tuple
from openai import OpenAI
from visora_schemas import ScenePlan, ForgeCode

def get_forge_client() -> Tuple[OpenAI, str]:
    """Returns the OpenAI client pointing to NVIDIA NIM and the Forge model name."""
    base_url = os.environ.get("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
    api_key = os.environ.get("NVIDIA_NIM_FORGE_API_KEY") or os.environ.get("NVIDIA_NIM_COMMON_API_KEY")
    model = os.environ.get("NVIDIA_MODEL_FORGE", "z-ai/glm-5.2")
    
    if not api_key:
        raise ValueError("Missing NVIDIA NIM API key in environment variables (NVIDIA_NIM_FORGE_API_KEY or NVIDIA_NIM_COMMON_API_KEY)")
        
    client = OpenAI(base_url=base_url, api_key=api_key)
    return client, model

def run_forge_generator(scene_plan: ScenePlan) -> ForgeCode:
    """
    Generates a complete, runnable Manim Python script based on a ScenePlan.
    
    Args:
        scene_plan: The approved ScenePlan.
        
    Returns:
        The validated ForgeCode.
    """
    client, model = get_forge_client()
    
    forge_system_prompt = (
        "You are Forge, an expert developer writing Manim scripts.\n"
        "Layout rules you must follow:\n"
        "- Never set config.frame_width or config.frame_height unless you explicitly\n"
        "  calculate both together to match the target pixel aspect ratio. If unsure,\n"
        "  do not override either — use Manim's defaults.\n"
        "- Before applying any .shift(), .move_to(), .scale(), or .to_edge() call meant\n"
        "  to reposition a composite drawing, first group EVERY mobject that is part of\n"
        "  that drawing into a single VGroup, then apply the transform once to the\n"
        "  whole group. Never shift or move a subset of related mobjects while leaving\n"
        "  others in their original coordinates.\n"
        "- After building a diagram, call .move_to(ORIGIN) and, if needed, .scale() on\n"
        "  the top-level VGroup to guarantee the entire diagram fits within a safe\n"
        "  margin of the frame edges before playing any animation.\n"
        "- When multiple distinct visual groups (a diagram, an equation, a step list)\n"
        "  appear in the same scene, assign each one a fixed, non-overlapping region of\n"
        "  the frame — e.g. left half vs. right half — rather than positioning elements\n"
        "  relative to each other without checking total accumulated size."
    )
    
    forge_prompt = (
        "Write a complete, runnable Manim Community Edition Python script for "
        "the following scene. Include all imports. The scene class must be "
        "named GeneratedScene. Return ONLY the Python code in a single "
        "```python fenced block, nothing else.\n\n"
        f"Scene plan:\n{scene_plan.model_dump_json(indent=2)}"
    )
    
    chat_completion = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": forge_system_prompt},
            {"role": "user", "content": forge_prompt}
        ],
        temperature=0.2,
        max_tokens=4096
    )
    
    raw_response = chat_completion.choices[0].message.content or ""
    
    # Extract Python code between markdown code blocks
    code_content = raw_response.strip()
    if "```python" in code_content:
        start_idx = code_content.find("```python") + len("```python")
        end_idx = code_content.rfind("```")
        if end_idx > start_idx:
            code_content = code_content[start_idx:end_idx].strip()
    elif "```" in code_content:
        start_idx = code_content.find("```") + len("```")
        end_idx = code_content.rfind("```")
        if end_idx > start_idx:
            code_content = code_content[start_idx:end_idx].strip()
            
    # Clean up backticks if any remained
    code_content = code_content.replace("`", "").strip()

    return ForgeCode(
        code=code_content,
        scene_class_name="GeneratedScene"
    )
