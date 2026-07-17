import os
import ssl
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.environ.get("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

is_rediss = broker_url.startswith("rediss://")

celery_app = Celery(
    "visora_workers",
    broker=broker_url,
    backend=result_backend,
    include=["visora_workers.tasks.render_scene"],
)

_ssl_config = {
    "ssl_cert_reqs": ssl.CERT_NONE,
} if is_rediss else {}

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    broker_use_ssl=_ssl_config if is_rediss else None,
    redis_backend_use_ssl=_ssl_config if is_rediss else None,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
)
