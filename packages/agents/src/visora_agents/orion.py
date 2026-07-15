import os
import json
from typing import List, Dict, Tuple
from openai import OpenAI
from visora_schemas import ScenePlan

def get_orion_client() -> Tuple[OpenAI, str]:
    """Returns the OpenAI client pointing to NVIDIA NIM and the Orion model name."""
    base_url = os.environ.get("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
    api_key = os.environ.get("NVIDIA_NIM_ORION_API_KEY") or os.environ.get("NVIDIA_NIM_COMMON_API_KEY")
    model = os.environ.get("NVIDIA_MODEL_ORION", "nvidia/nemotron-3-ultra-550b-a55b")
    
    if not api_key:
        raise ValueError("Missing NVIDIA NIM API key in environment variables (NVIDIA_NIM_ORION_API_KEY or NVIDIA_NIM_COMMON_API_KEY)")
        
    client = OpenAI(base_url=base_url, api_key=api_key)
    return client, model

def run_orion_planner(messages: List[Dict[str, str]]) -> ScenePlan:
    """
    Decomposes the elicitation requirements / conversation history into exactly ONE scene plan.
    
    Args:
        messages: The elicitation conversation history.
        
    Returns:
        The validated ScenePlan.
    """
    client, model = get_orion_client()
    
    orion_prompt = (
        "Based on this conversation, produce exactly ONE scene plan as a JSON "
        "object with keys: title, description, duration_seconds, key_visuals "
        "(list of strings). Return ONLY the JSON object, no markdown fences, "
        "no explanation, no reasoning text before or after it.\n\n"
        "Conversation:\n" +
        "\n".join(f"{m['role']}: {m['content']}" for m in messages if m["role"] != "system")
    )
    
    chat_completion = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": orion_prompt}],
        temperature=0.4,
        max_tokens=2048
    )
    
    raw_response = chat_completion.choices[0].message.content or ""
    
    # Clean output to ensure we parse JSON correctly (strip code fences if any)
    raw_response = raw_response.strip()
    if raw_response.startswith("```"):
        lines = raw_response.split("\n")
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines[-1].startswith("```"):
            lines = lines[:-1]
        raw_response = "\n".join(lines).strip()
        
    # Attempt to extract json object between curly braces if extra text leaked
    start, end = raw_response.find("{"), raw_response.rfind("}")
    if start != -1 and end != -1 and end > start:
        raw_response = raw_response[start:end + 1]

    try:
        scene_data = json.loads(raw_response)
        return ScenePlan.model_validate(scene_data)
    except Exception as e:
        raise ValueError(f"Orion model response failed to parse as valid ScenePlan. Error: {e}. Raw content: {raw_response}")
