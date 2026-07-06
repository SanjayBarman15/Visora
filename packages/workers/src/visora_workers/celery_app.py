import os
import ssl
from celery import Celery
from dotenv import load_dotenv

# Load env variables
load_dotenv()

broker_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
result_backend = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

app = Celery(
    "visora_workers",
    broker=broker_url,
    backend=result_backend,
    include=["visora_workers.tasks"]
)

# Configuration options
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    # Configure task routing
    task_routes={
        "visora_workers.tasks.*": {"queue": "render"}
    },
    # Configure SSL
    broker_use_ssl={
        "ssl_cert_reqs": ssl.CERT_NONE
    },
    redis_backend_use_ssl={
        "ssl_cert_reqs": ssl.CERT_NONE
    }
)
