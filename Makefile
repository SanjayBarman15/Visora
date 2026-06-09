.PHONY: dev-web dev-api dev-worker install install-py gen-types eval ingest-docs
	
install:
	bun install
	uv sync --all-packages

dev-web:
	cd apps/web && bun dev

dev-api:
	uv run uvicorn mova.main:app --reload --app-dir apps/api/src

dev-worker-fast:
	uv run celery -A mova_workers.celery_app worker -Q fast --loglevel=info

dev-worker-render:
	uv run celery -A mova_workers.celery_app worker -Q render --loglevel=info

gen-types:
	uv run python scripts/generate_ts_types.py

ingest-docs:
	uv run python scripts/ingest_manim_docs.py

eval:
	uv run python evals/runners/run_eval.py

lint:
	uv run ruff check .
	cd apps/web && bun run lint

format:
	uv run ruff format .
