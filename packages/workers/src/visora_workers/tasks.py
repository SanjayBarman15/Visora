import os
import ast
import tempfile
import subprocess
import shutil
import logging
from pathlib import Path
from visora_workers.celery_app import app
from visora_db import get_supabase_admin_client

logger = logging.getLogger("uvicorn")

def find_scene_class(code_str: str) -> str:
    """
    Parses the Python code using AST to find the first class inheriting from a Manim Scene class.
    """
    try:
        tree = ast.parse(code_str)
        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                for base in node.bases:
                    # Match bases like Scene, MovingCameraScene, etc.
                    if (isinstance(base, ast.Name) and base.id in ("Scene", "VectorScene", "MovingCameraScene", "LinearTransformationScene")) or \
                       (isinstance(base, ast.Attribute) and base.attr in ("Scene", "VectorScene", "MovingCameraScene")):
                        return node.name
        return "GeneratedScene"
    except Exception:
        return "GeneratedScene"

def run_manim_render(temp_dir: str, file_name: str, class_name: str) -> Path:
    """
    Executes the Manim rendering command.
    Attempts to run inside a Docker container first. If Docker is unavailable,
    falls back to running the local manim command.
    """
    # 1. Check if Docker is available and daemon is accessible
    has_docker = False
    try:
        res = subprocess.run(["docker", "info"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if res.returncode == 0:
            has_docker = True
    except Exception:
        pass

    # 2. Setup output folder structure
    # Manim writes files under media/videos/<filename>/<quality>/<classname>.mp4
    # We output to a distinct dir inside temp_dir
    media_dir = Path(temp_dir) / "media"
    media_dir.mkdir(exist_ok=True)
    
    if has_docker:
        logger.info("🐳 Running Manim in sandboxed Docker container...")
        cmd = [
            "docker", "run", "--rm",
            "-v", f"{temp_dir}:/manim",
            "manimcommunity/manim:stable",
            "manim", "-qm",
            "--media_dir", "/manim/media",
            f"/manim/{file_name}", class_name
        ]
    else:
        logger.info("💻 Docker not found. Falling back to local Manim execution...")
        cmd = [
            "manim", "-qm",
            "--media_dir", str(media_dir),
            str(Path(temp_dir) / file_name), class_name
        ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if result.returncode != 0:
        logger.error(f"Manim render failed! code: {result.returncode}\nStdout: {result.stdout}\nStderr: {result.stderr}")
        raise RuntimeError(f"Manim render failed: {result.stderr}")

    # 3. Locate the output .mp4 file
    # Look recursively under media_dir for the class_name.mp4 file
    video_files = list(media_dir.glob(f"**/{class_name}.mp4"))
    if not video_files:
        # Check for any .mp4 file
        video_files = list(media_dir.glob("**/*.mp4"))
        
    if not video_files:
        raise FileNotFoundError("Could not find generated video file in Manim media directory")

    return video_files[0]

@app.task(name="visora_workers.tasks.render_scene_task")
def render_scene_task(checkpoint_id: str):
    logger.info(f"Starting render task for checkpoint: {checkpoint_id}")
    supabase = get_supabase_admin_client()

    # 1. Fetch checkpoint
    res = supabase.table("scene_checkpoints").select("*").eq("id", checkpoint_id).execute()
    if not res.data:
        logger.error(f"Checkpoint {checkpoint_id} not found in DB")
        return f"Checkpoint {checkpoint_id} not found"

    checkpoint = res.data[0]
    scene_id = checkpoint["scene_id"]
    project_id = checkpoint["project_id"]
    scene_index = checkpoint["scene_index"]
    code_str = checkpoint["final_code"] or checkpoint["generated_code"]

    if not code_str:
        logger.error("No code content in checkpoint")
        return "No code to render"

    # Update checkpoint status to rendering
    supabase.table("scene_checkpoints").update({"render_status": "rendering"}).eq("id", checkpoint_id).execute()
    supabase.table("scenes").update({"status": "rendering"}).eq("id", scene_id).execute()

    # 2. Setup temp directory
    temp_dir = tempfile.mkdtemp()
    file_name = "scene.py"
    temp_file_path = Path(temp_dir) / file_name

    try:
        # Write Manim code to temp file
        with open(temp_file_path, "w") as f:
            f.write(code_str)

        # Parse ClassName
        class_name = find_scene_class(code_str)
        logger.info(f"Found Manim scene class name: {class_name}")

        # 3. Render
        video_path = run_manim_render(temp_dir, file_name, class_name)
        logger.info(f"Manim render completed. Video path: {video_path}")

        # 4. Upload to Supabase Storage
        bucket_name = os.getenv("SUPABASE_BUCKET")
        if not bucket_name:
            bucket_name = "clips"
        remote_path = f"{project_id}/scene_{scene_index}_{checkpoint_id}.mp4"

        # Ensure bucket exists or create it
        try:
            supabase.storage.get_bucket(bucket_name)
        except Exception:
            try:
                logger.info(f"Bucket {bucket_name} not found. Attempting to create it...")
                supabase.storage.create_bucket(bucket_name, options={"public": True})
            except Exception as create_err:
                logger.warning(f"Could not create bucket programmatically: {create_err}")

        with open(video_path, "rb") as f:
            file_data = f.read()

        # Try uploading (will upsert if already exists)
        # SUPABASE python client storage client syntax
        storage_res = supabase.storage.from_(bucket_name).upload(
            path=remote_path,
            file=file_data,
            file_options={"content-type": "video/mp4", "x-upsert": "true"}
        )

        public_url = supabase.storage.from_(bucket_name).get_public_url(remote_path)
        logger.info(f"Video uploaded successfully. Public URL: {public_url}")

        # 5. Update database checkpoint and scene
        supabase.table("scene_checkpoints").update({
            "render_status": "done",
            "clip_url": public_url,
            "dry_run_passed": True
        }).eq("id", checkpoint_id).execute()

        supabase.table("scenes").update({
            "status": "done"
        }).eq("id", scene_id).execute()

        return f"Successfully rendered and uploaded scene {scene_index} for project {project_id}"

    except Exception as e:
        logger.exception(f"Error rendering scene: {str(e)}")
        # Update status to error
        supabase.table("scene_checkpoints").update({
            "render_status": "error",
            "render_error": str(e),
            "dry_run_passed": False
        }).eq("id", checkpoint_id).execute()

        supabase.table("scenes").update({
            "status": "error"
        }).eq("id", scene_id).execute()

        raise

    finally:
        # Clean up temp folder
        shutil.rmtree(temp_dir, ignore_errors=True)
