"""
Visora pipeline smoke test — Scout -> Orion -> Forge, in a terminal, no backend.

Purpose: isolate whether bugs are in the model calls themselves, or in the
FastAPI/Celery/frontend layers around them. This script talks to NVIDIA NIM
directly and prints the RAW response at every step before doing anything else
with it, so truncation / unstripped reasoning-trace bugs are visible immediately.

Setup:
    pip install openai python-dotenv

Create a .env file next to this script:
    SCOUT_API_KEY=nvapi-xxxx
    ORION_API_KEY=nvapi-yyyy
    FORGE_API_KEY=nvapi-zzzz
"""

import os
import sys
from openai import OpenAI
from dotenv import load_dotenv
from respose import RawModelResponse, parse_response, ScenePlan, ForgeCode

load_dotenv()

NIM_BASE_URL = "https://integrate.api.nvidia.com/v1"

SCOUT_MODEL = "meta/llama-3.1-8b-instruct"
ORION_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"
FORGE_MODEL = "z-ai/glm-5.2"

SCOUT_KEY = os.environ.get("SCOUT_API_KEY")
ORION_KEY = os.environ.get("ORION_API_KEY")
FORGE_KEY = os.environ.get("FORGE_API_KEY")

for name, key in [("SCOUT_API_KEY", SCOUT_KEY), ("ORION_API_KEY", ORION_KEY), ("FORGE_API_KEY", FORGE_KEY)]:
    if not key:
        print(f"Missing {name} in your .env file. Aborting.")
        sys.exit(1)

scout_client = OpenAI(base_url=NIM_BASE_URL, api_key=SCOUT_KEY)
orion_client = OpenAI(base_url=NIM_BASE_URL, api_key=ORION_KEY)
forge_client = OpenAI(base_url=NIM_BASE_URL, api_key=FORGE_KEY)


def call_model(client, model, messages, max_tokens=4096, label="MODEL") -> RawModelResponse:
    """
    Calls a NIM chat completion, non-streaming, and prints the raw response
    object before returning a RawModelResponse wrapper.
    """
    print(f"\n--- calling {label} ({model}) ---")
    try:
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.4,
            max_tokens=max_tokens,
        )
    except Exception as e:
        print(f"[{label}] API call raised an exception: {e}")
        return None

    raw_message = response.choices[0].message
    finish_reason = response.choices[0].finish_reason

    print(f"[{label}] finish_reason: {finish_reason}")
    if finish_reason == "length":
        print(f"[{label}] *** TRUNCATED: hit max_tokens ({max_tokens}). "
              f"Raise max_tokens or shorten the prompt. ***")

    reasoning = getattr(raw_message, "reasoning_content", None)
    if reasoning:
        print(f"[{label}] --- reasoning_content (separate field, not the answer) ---")
        print(reasoning[:1000])
        print(f"[{label}] --- end reasoning_content ---")

    content = raw_message.content or ""
    print(f"[{label}] --- raw content field ---")
    print(content)
    print(f"[{label}] --- end raw content ---")

    return RawModelResponse(
        content=content,
        reasoning_content=reasoning,
        finish_reason=finish_reason,
        model=model
    )


def main():
    print("=" * 60)
    print("Visora pipeline smoke test: Scout -> Orion -> Forge")
    print("Type 'plan' once you've described what you want, to move to Orion.")
    print("=" * 60)

    scout_messages = [
        {"role": "system", "content": (
            "You are Scout, a chatbot that gathers requirements for an "
            "educational animation. Ask short clarifying questions about "
            "topic, audience level, duration, and tone. Keep replies brief. "
            "Once you have gathered the topic, audience, duration, and tone, "
            "ask the user to confirm and suggest typing 'plan' to move to the planning stage."
        )}
    ]

    # --- Scout loop ---
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() == "plan":
            break
        scout_messages.append({"role": "user", "content": user_input})
        raw_resp = call_model(scout_client, SCOUT_MODEL, scout_messages, max_tokens=512, label="SCOUT")
        if raw_resp is None:
            print("Scout call failed — fix this before continuing.")
            continue
        
        result = parse_response("scout", raw_resp)
        if not result.ok:
            print(f"Scout parsing failed: {result.error}")
            continue

        scout_messages.append({"role": "assistant", "content": result.data})
        print(f"\nScout: {result.data}")

    # --- Orion: single scene plan ---
    orion_prompt = (
        "Based on this conversation, produce exactly ONE scene plan as a JSON "
        "object with keys: title, description, duration_seconds, key_visuals "
        "(list of strings). Return ONLY the JSON object, no markdown fences, "
        "no explanation, no reasoning text before or after it.\n\n"
        "Conversation:\n" +
        "\n".join(f"{m['role']}: {m['content']}" for m in scout_messages if m["role"] != "system")
    )
    raw_resp = call_model(
        orion_client, ORION_MODEL,
        [{"role": "user", "content": orion_prompt}],
        max_tokens=2048, label="ORION"
    )
    if raw_resp is None:
        print("Orion call failed. Stopping here.")
        return

    result = parse_response("orion", raw_resp)
    if not result.ok:
        print(f"Could not get a usable scene plan: {result.error}")
        return

    scene_plan = result.data  # This is a validated ScenePlan Pydantic object
    print("\n--- Parsed scene plan ---")
    print(scene_plan.model_dump_json(indent=2))

    proceed = input("\nType y to send this to Forge for code generation: ").strip().lower()
    if proceed != "y":
        print("Stopping before Forge.")
        return

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
    raw_resp = call_model(
        forge_client, FORGE_MODEL,
        [
            {"role": "system", "content": forge_system_prompt},
            {"role": "user", "content": forge_prompt}
        ],
        max_tokens=4096, label="FORGE"
    )
    if raw_resp is None:
        print("Forge call failed. Stopping here.")
        return

    result = parse_response("forge", raw_resp)
    if not result.ok:
        print(f"Could not get usable code: {result.error}")
        return

    forge_code = result.data  # This is a validated ForgeCode object
    out_path = "generated_scene.py"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(forge_code.code)

    print(f"\nSaved generated code to {out_path}")
    print("Copy it into an online Manim compiler, or run locally with:")
    print(f"    manim -pql {out_path} {forge_code.scene_class_name}")


if __name__ == "__main__":
    main()