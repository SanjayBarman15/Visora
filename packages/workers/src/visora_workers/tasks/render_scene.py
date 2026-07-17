"""
render_scene.py — Celery task that:
  1. Writes the Manim code to a temp .py file
  2. Runs `manim render` as a subprocess
  3. Uploads the resulting .mp4 to Supabase Storage (visora-bucket)
  4. Updates scene_checkpoints.clip_url and render_status in Supabase
"""

import os
import subprocess
import tempfile
import traceback
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client, Client

from visora_workers.celery_app import celery_app

load_dotenv()


def _get_supabase() -> Client:
    """Return a Supabase client using the service role key (needed for storage uploads)."""
    url = os.environ["SUPABASE_PROJECT_URL"]
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    return create_client(url, key)


def _update_checkpoint(supabase: Client, checkpoint_id: str, **fields) -> None:
    """Patch a scene_checkpoints row."""
    supabase.table("scene_checkpoints").update(fields).eq("id", checkpoint_id).execute()


@celery_app.task(bind=True, name="visora_workers.tasks.render_scene.render_manim_scene", max_retries=0)
def render_manim_scene(
    self,
    checkpoint_id: str,
    code: str,
    scene_class_name: str,
    project_id: str,
    scene_id: str,
) -> dict:
    """
    Execute a Manim scene and upload the output video to Supabase Storage.

    Returns a dict with render_status and clip_url.
    """
    supabase = _get_supabase()
    bucket = os.environ.get("SUPABASE_BUCKET", "visora-bucket")

    # ── Mark as rendering ──────────────────────────────────────────────────
    _update_checkpoint(supabase, checkpoint_id, render_status="rendering")

    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir_path = Path(tmpdir)

        # ── Write code to temp file ────────────────────────────────────────
        scene_file = tmpdir_path / f"{scene_class_name}.py"
        scene_file.write_text(code, encoding="utf-8")

        output_dir = tmpdir_path / "output"
        output_dir.mkdir()

        # ── Run Manim ─────────────────────────────────────────────────────
        cmd = [
            "manim",
            "render",
            str(scene_file),
            scene_class_name,
            "--format=mp4",
            "--media_dir", str(output_dir),
            "--disable_caching",
            "-q", "m",          # medium quality — fast enough for web preview
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,        # 5 minute hard limit per scene
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or "Unknown Manim error"
            _update_checkpoint(
                supabase,
                checkpoint_id,
                render_status="failed",
                render_error=error_msg[:2000],  # truncate for DB storage
            )
            raise RuntimeError(f"Manim render failed: {error_msg}")

        # ── Find the output .mp4 ──────────────────────────────────────────
        mp4_files = list(output_dir.rglob("*.mp4"))
        if not mp4_files:
            error_msg = "Manim ran successfully but no .mp4 file was produced"
            _update_checkpoint(
                supabase, checkpoint_id, render_status="failed", render_error=error_msg
            )
            raise FileNotFoundError(error_msg)

        mp4_path = mp4_files[0]

        # ── Upload to Supabase Storage ────────────────────────────────────
        storage_path = f"renders/{project_id}/{checkpoint_id}.mp4"

        with open(mp4_path, "rb") as f:
            video_bytes = f.read()

        supabase.storage.from_(bucket).upload(
            path=storage_path,
            file=video_bytes,
            file_options={"content-type": "video/mp4", "upsert": "true"},
        )

        # Build the public URL
        project_url = os.environ["SUPABASE_PROJECT_URL"]
        clip_url = f"{project_url}/storage/v1/object/public/{bucket}/{storage_path}"

        # ── Update checkpoint as completed ────────────────────────────────
        _update_checkpoint(
            supabase,
            checkpoint_id,
            render_status="completed",
            clip_url=clip_url,
            final_code=code,
        )

        # Also update the project's final_video_url for convenience
        supabase.table("projects").update(
            {"final_video_url": clip_url}
        ).eq("id", project_id).execute()

        return {"render_status": "completed", "clip_url": clip_url}
