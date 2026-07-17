import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()


def _append_ssl_cert_reqs(url: str) -> str:
    """
    Celery requires ssl_cert_reqs as a URL query parameter for rediss:// URLs.
    Appends ?ssl_cert_reqs=CERT_NONE if not already present.
    """
    if url.startswith("rediss://") and "ssl_cert_reqs" not in url:
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}ssl_cert_reqs=CERT_NONE"
    return url


_raw_broker = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
_raw_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

broker_url = _append_ssl_cert_reqs(_raw_broker)
result_backend = _append_ssl_cert_reqs(_raw_backend)

celery_app = Celery(
    "visora_workers",
    broker=broker_url,
    backend=result_backend,
    include=["visora_workers.tasks.render_scene"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Task reliability settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
)
