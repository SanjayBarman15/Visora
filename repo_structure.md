```
mova/
├── .env.example
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── apps/
│   ├── api/
│   │   ├── pyproject.toml
│   │   └── src/
│   │       └── mova/
│   │           ├── __init__.py
│   │           ├── __pycache__/
│   │           │   ├── __init__.cpython-311.pyc
│   │           │   └── main.cpython-311.pyc
│   │           └── main.py
│   └── web/
│       ├── .gitignore
│       ├── .prettierignore
│       ├── .prettierrc
│       ├── AGENTS.md
│       ├── app/
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── .gitkeep
│       │   ├── theme-provider.tsx
│       │   └── ui/
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       └── goey-toaster.tsx
│       ├── components.json
│       ├── eslint.config.mjs
│       ├── hooks/
│       │   └── .gitkeep
│       ├── lib/
│       │   ├── .gitkeep
│       │   └── utils.ts
│       ├── next.config.ts
│       ├── package.json
│       ├── postcss.config.mjs
│       ├── public/
│       │   └── .gitkeep
│       ├── README.md
│       └── tsconfig.json
├── bun.lock
├── Makefile
├── mova.code-workspace
├── package.json
├── packages/
│   ├── agents/
│   │   ├── pyproject.toml
│   │   └── src/
│   │       └── mova_agents/
│   │           └── __init__.py
│   ├── db/
│   │   ├── pyproject.toml
│   │   └── src/
│   │       └── mova_db/
│   │           └── __init__.py
│   ├── mcp/
│   │   ├── pyproject.toml
│   │   └── src/
│   │       └── mova_mcp/
│   │           └── __init__.py
│   ├── rag/
│   │   ├── pyproject.toml
│   │   └── src/
│   │       └── mova_rag/
│   │           └── __init__.py
│   ├── schemas/
│   │   ├── pyproject.toml
│   │   └── src/
│   │       └── mova_schemas/
│   │           └── __init__.py
│   ├── tools/
│   │   ├── pyproject.toml
│   │   └── src/
│   │       └── mova_tools/
│   │           └── __init__.py
│   └── workers/
│       ├── pyproject.toml
│       └── src/
│           └── mova_workers/
│               └── __init__.py
├── projectInfo/
│   ├── mova_entire_schema.sql
│   ├── mova.md
│   └── running_supabase_schema.sql
├── pyproject.toml
├── README.md
├── turbo.json
└── uv.lock
```