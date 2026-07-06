import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from visora.routers.projects import router as projects_router
from visora.routers.messages import router as messages_router
from visora.routers.scenes import router as scenes_router

# ---------------------------
# ENV
# ---------------------------
load_dotenv(override=True)

logger = logging.getLogger("uvicorn")


# ---------------------------
# HELPERS
# ---------------------------
def get_required_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return value


def is_production() -> bool:
    return os.getenv("APP_ENV", "development").lower() == "production"


API_PREFIX = os.getenv("API_PREFIX", "/api/v1").rstrip("/")


# ---------------------------
# STARTUP VALIDATION
# ---------------------------
async def startup_validation():
    required_envs = [
        "SUPABASE_PROJECT_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "NVIDIA_NIM_API_KEY",
        "ELEVENLABS_API_KEY",
    ]

    missing = [env for env in required_envs if not os.getenv(env)]
    if missing:
        # We warning log instead of raise to keep dev environment flexible
        logger.warning(f"⚠️ Missing environment variables: {missing}")
    else:
        logger.info("🔑 All required environment variables are present.")

    host = os.getenv("HOST", "127.0.0.1")
    port = os.getenv("PORT", "8000")
    version = os.getenv("VERSION", "0.1.0")

    logger.info("===================================")
    logger.info("🚀 Visora API Backend Running")
    logger.info(f"Environment : {os.getenv('APP_ENV', 'development')}")
    logger.info(f"Version     : {version}")
    logger.info(f"API Prefix  : {API_PREFIX}")
    logger.info(f"URL         : http://{host}:{port}")
    logger.info("===================================")


# ---------------------------
# LIFESPAN
# ---------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    await startup_validation()
    logger.info("✅ Startup validation complete")
    yield
    logger.info("🛑 Shutting down Visora API...")


# ---------------------------
# FASTAPI APP
# ---------------------------
app = FastAPI(
    title="Visora AI Backend",
    description="""
    AI-powered animation platform that turns text prompts into fully narrated, code-generated explainer animations.
    """,
    version=os.getenv("VERSION", "0.1.0"),
    lifespan=lifespan,
    docs_url=None if is_production() else "/docs",
    redoc_url=None if is_production() else "/redoc",
    openapi_url=None if is_production() else "/openapi.json",
)

# ---------------------------
# MIDDLEWARE
# ---------------------------
origins = os.getenv("CORS_ORIGINS", "").split(",")
origins = [o.strip() for o in origins if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# ROUTERS
# ---------------------------
app.include_router(projects_router, prefix=API_PREFIX)
app.include_router(messages_router, prefix=API_PREFIX)
app.include_router(scenes_router, prefix=API_PREFIX)


# ---------------------------
# HEALTH ROUTES
# ---------------------------
@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": "Visora API Backend",
        "version": os.getenv("VERSION", "0.1.0"),
    }


@app.get(f"{API_PREFIX}/", tags=["Health"])
async def api_root():
    return {
        "status": "ok",
        "message": "Visora API v1",
        "version": os.getenv("VERSION", "0.1.0"),
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}


@app.get("/ready", tags=["Health"])
async def readiness():
    return {
        "status": "ready",
        "environment": os.getenv("APP_ENV", "development"),
    }


# ---------------------------
# ERROR HANDLERS
# ---------------------------
@app.exception_handler(RequestValidationError)
async def validation_error(request: Request, exc: RequestValidationError):
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


@app.exception_handler(Exception)
async def global_error(request: Request, exc: Exception):
    status_code = getattr(exc, "status_code", 500)
    logger.exception(f"Global server error: {exc}")

    if not is_production():
        return JSONResponse(
            status_code=status_code,
            content={"detail": str(exc)},
        )

    return JSONResponse(
        status_code=status_code,
        content={"detail": "Internal Server Error"},
    )
