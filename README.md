# visora

visora is an AI-powered animation platform that turns a topic or concept into a complete educational video — Manim animations, voiceover narration, and background music — entirely automatically.

---

## What it does

You describe what you want to explain. visora's AI pipeline decomposes it into scenes, generates Manim animation code for each scene, writes a narration script, converts it to speech, mixes audio, and delivers a   finished video.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python |
| Task Queue | Celery + Upstash Redis |
| Database | Supabase PostgreSQL + pgvector |
| File Storage | Supabase Storage |
| AI Models | NVIDIA NIM free tier APIs |
| TTS | ElevenLabs |
| Video | Manim, ffmpeg |
| Observability | LangSmith |
| Monorepo | Bun workspaces + Turborepo (JS), uv workspaces (Python) |

---

## AI Models

| Name | Model | Role |
|---|---|---|
| Scout | meta/llama-3.2-3b-instruct | Conversational requirements gathering |
| Orion | nvidia/nemotron-3-ultra-550b-a55b | Scene planning and code review |
| Forge | nvidia/llama-3.3-nemotron-super-49b-v1.5 | Manim code generation and fixing |
| Narrator | nvidia/llama-3.3-nemotron-super-49b-v1.5 | Voiceover script writing |
| Guardian | nvidia/llama-3.1-nemotron-safety-guard-8b-v3 | Safety checks |
| Reranker | nvidia/rerank-qa-mistral-4b | RAG result reranking |
| Lens-Text | nvidia/nv-embed-v1 | Natural language embeddings |
| Lens-Code | nvidia/nv-embedcode-7b-v1 | Code embeddings |
| Arbiter | mistralai/mistral-large-3-675b-instruct-2512 | Nightly quality scoring |

---

## Project Structure

```
visora/
├── apps/
│   ├── web/               # Next.js frontend
│   └── api/               # FastAPI backend
├── packages/
│   ├── visora-schemas/      # Shared Pydantic + Zod types
│   ├── visora-agents/       # LangGraph agent pipeline
│   ├── visora-rag/          # Hybrid retrieval system
│   ├── visora-workers/      # Celery task workers
│   ├── visora-db/           # Supabase database clients
│   ├── visora-tools/        # External tool integrations
│   └── visora-mcp/          # MCP server layer
├── infra/                 # render.yaml, deployment config
├── docs/                  # Project documentation
├── evals/                 # Offline evaluation suite
├── scripts/               # Dev helper scripts
├── turbo.json
├── package.json
└── pyproject.toml
```

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- [uv](https://docs.astral.sh/uv/) v0.4+
- [Python](https://python.org) 3.11+
- [Node.js](https://nodejs.org) 18+
- A [Supabase](https://supabase.com) project
- An [Upstash Redis](https://upstash.com) database
- An [NVIDIA NIM](https://build.nvidia.com) API key
- An [ElevenLabs](https://elevenlabs.io) API key
- A [LangSmith](https://smith.langchain.com) account

### 1. Clone the repo

```bash
git clone https://github.com/yourname/visora.git
cd visora
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in all values in `.env`. See `.env.example` for the full list.

### 3. Set up the database

Open your Supabase project, go to the SQL Editor, paste the contents of `schema.sql`, and run it.

Then make yourself a super admin by running this separately with your real auth user UUID:

```sql
insert into public.admin_users (id, email, role)
values ('<your-uuid>', '<your-email>', 'super_admin');
```

### 4. Install JavaScript dependencies

```bash
bun install
```

### 5. Install Python dependencies

```bash
uv sync --all-packages
```

### 6. Run the development environment

```bash
# Start frontend and backend together
bun run dev

# Or individually:
cd apps/web && bun dev          # Next.js on http://localhost:3000
cd apps/api && uv run uvicorn main:app --reload  # FastAPI on http://localhost:8000

# Start Celery worker (all queues, for local dev)
cd apps/api && uv run celery -A visora_workers worker -Q fast,render,audio,merge,voiceover --concurrency=4
```

---

## Celery Queues

| Queue | Purpose | Concurrency |
|---|---|---|
| fast | Scout, Orion, Guardian, review agents | 4 |
| render | Manim scene rendering | 2 |
| audio | ElevenLabs TTS | 1 |
| merge | ffmpeg final video merge | 2 |
| voiceover | Dedicated ElevenLabs calls | 1 |

---

## Rate Limits

All NVIDIA NIM calls are capped at 30 RPM total across all models, enforced via per-model token buckets in Upstash Redis. When capacity is unavailable, requests are queued rather than rejected.

---

## Deployment

- **Frontend** — Vercel (auto-detected Bun + Turborepo remote cache)
- **Backend + Workers** — Render (configured in `infra/render.yaml`)

---

## Admin Panel

An admin panel is available for managing the RAG document library, monitoring pipeline performance, viewing system logs, and resolving dead letter queue tasks. Access requires an `admin_users` row linked to your Supabase auth account.

---

## License

MIT