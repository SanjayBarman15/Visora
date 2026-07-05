-- =================================================================
-- MOVA DATABASE SCHEMA — v2
-- Paste this entire file into Supabase SQL Editor and run once.
--
-- CHANGES FROM v1 (mova_entire_schema.sql):
-- 1. Dropped `project_memory` (flat table) — replaced by `memory_nodes`
--    + `memory_edges` (preference graph, per MemGraphRAG design).
-- 2. Added `user_memory` — personal ChatGPT-style fact store, pgvector.
-- 3. Removed `embedding` column + HNSW index from `rag_documents` —
--    shared-corpus vectors now live in Pinecone, not Postgres.
--    `rag_documents.id` is used directly as the Pinecone vector ID.
-- 4. Added `turbovec_indexes` — tracks turbovec hot-tier rebuilds,
--    mirroring the existing `pageindex_indexes` pattern.
-- 5. `handle_new_user()` no longer seeds a `project_memory` row
--    (user_memory/memory_nodes are populated organically, not seeded).
--
-- This script is idempotent — safe to run against a fresh database
-- or to drop-and-rerun against an existing one.
-- =================================================================


-- =================================================================
-- DROP EXISTING OBJECTS (safe re-run)
-- =================================================================

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.dead_letter_queue cascade;
drop table if exists public.system_logs cascade;
drop table if exists public.rag_document_stats cascade;
drop table if exists public.model_daily_stats cascade;
drop table if exists public.pipeline_performance_snapshots cascade;
drop table if exists public.document_review_queue cascade;
drop table if exists public.document_ingestion_jobs cascade;
drop table if exists public.admin_audit_logs cascade;
drop table if exists public.admin_users cascade;
drop table if exists public.rate_limit_events cascade;
drop table if exists public.api_changes cascade;
drop table if exists public.turbovec_indexes cascade;
drop table if exists public.pageindex_indexes cascade;
drop table if exists public.rag_retrieval_logs cascade;
drop table if exists public.rag_documents cascade;
drop table if exists public.memory_edges cascade;
drop table if exists public.memory_nodes cascade;
drop table if exists public.user_memory cascade;
drop table if exists public.project_memory cascade;
drop table if exists public.feedback_events cascade;
drop table if exists public.agent_runs cascade;
drop table if exists public.music_library cascade;
drop table if exists public.audio_files cascade;
drop table if exists public.narrator_scripts cascade;
drop table if exists public.scene_checkpoints cascade;
drop table if exists public.scenes cascade;
drop table if exists public.prompt_history cascade;
drop table if exists public.prompt_versions cascade;
drop table if exists public.projects cascade;
drop table if exists public.profiles cascade;
drop table if exists public.sessions cascade;
drop table if exists public.system_config cascade;
drop table if exists public.model_roles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_updated_at() cascade;
drop function if exists public.is_admin() cascade;


-- =================================================================
-- EXTENSIONS
-- =================================================================

create extension if not exists vector;


-- =================================================================
-- LOOKUP TABLES (create first, everything references these)
-- =================================================================

-- Model roles — single source of truth for all 9 models
create table public.model_roles (
  role text primary key,
  model_name text not null,
  rpm_limit int not null default 0,
  -- 0 = batch only (Arbiter), not subject to real-time rate limiting
  description text,
  is_batch_only boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);

insert into public.model_roles (role, model_name, rpm_limit, description, is_batch_only) values
  ('scout',     'meta/llama-3.2-3b-instruct',                       3,  'Conversational elicitation agent',            false),
  ('orion',     'nvidia/nemotron-3-ultra-550b-a55b',                 10, 'Primary reasoning, planning and review',      false),
  ('forge',     'nvidia/llama-3.3-nemotron-super-49b-v1.5',         8,  'Code generation and fixing',                  false),
  ('narrator',  'nvidia/llama-3.3-nemotron-super-49b-v1.5',         3,  'Script writing for voiceover',                false),
  ('guardian',  'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',     2,  'Safety checks on inputs and outputs',         false),
  ('reranker',  'nvidia/rerank-qa-mistral-4b',                      2,  'Reranks RAG candidates by relevance',         false),
  ('lens_text', 'nvidia/nv-embed-v1',                               1,  'Embeddings for natural language content',     false),
  ('lens_code', 'nvidia/nv-embedcode-7b-v1',                        1,  'Embeddings for code content',                 false),
  ('arbiter',   'mistralai/mistral-large-3-675b-instruct-2512',     0,  'Batch quality scoring and promotion',         true);


-- =================================================================
-- SESSIONS TABLE
-- =================================================================

create table public.sessions (
  id text primary key,
  user_id uuid,
  project_id uuid,
  started_at timestamptz default now(),
  last_active_at timestamptz default now(),
  ended_at timestamptz,
  metadata jsonb default '{}'
);


-- =================================================================
-- USERS & PROJECTS
-- =================================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  subscription_tier text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sessions
  add constraint sessions_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  status text default 'draft',
  total_scenes int default 0,
  completed_scenes int default 0,
  final_video_url text,
  final_video_duration_seconds float,
  has_voiceover boolean default false,
  has_background_music boolean default false,
  voiceover_status text default 'none',
  audio_mix_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sessions
  add constraint sessions_project_id_fkey
  foreign key (project_id) references public.projects(id) on delete set null;


-- =================================================================
-- ELICITATION & PROMPTS
-- =================================================================

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  model_role text references public.model_roles(role) not null,
  version text not null,
  content text not null,
  is_active boolean default false,
  created_at timestamptz default now(),
  constraint unique_model_version unique(model_role, version)
);

create table public.prompt_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id text references public.sessions(id) on delete set null,
  raw_prompt text not null,
  enriched_prompt text,
  elicitation_turns jsonb default '[]',
  requirements jsonb,
  created_at timestamptz default now()
);


-- =================================================================
-- SCENE PLAN & CHECKPOINTS
-- =================================================================

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  scene_index int not null,
  title text not null,
  visual_description text,
  expected_animation_types text[],
  approximate_duration_seconds float,
  transition_type text,
  dependency_scene_indexes int[] default '{}',
  complexity text default 'medium',
  complexity_score float default 0.5,
  status text default 'pending',
  is_dirty boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, scene_index)
);

create table public.scene_checkpoints (
  id uuid primary key default gen_random_uuid(),
  scene_id uuid references public.scenes(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete cascade not null,
  scene_index int not null,
  attempt_number int default 1,
  celery_task_id text unique,
  retrieved_context jsonb,
  generated_code text,
  review_issues jsonb,
  fix_attempts int default 0,
  final_code text,
  ast_parse_passed boolean,
  dry_run_passed boolean,
  dry_run_error text,
  dry_run_attempts int default 0,
  render_status text default 'pending',
  clip_url text,
  render_duration_seconds float,
  render_error text,
  extracted_color_palette jsonb,
  extracted_coordinate_systems jsonb,
  extracted_manim_objects jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, scene_index, attempt_number)
);


-- =================================================================
-- NARRATOR & AUDIO
-- =================================================================

create table public.narrator_scripts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  full_script text not null,
  segments jsonb not null,
  voice_id text,
  voiceover_tone text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint segments_is_array check (jsonb_typeof(segments) = 'array')
);

create table public.audio_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  scene_id uuid references public.scenes(id) on delete set null,
  audio_type text not null,
  file_url text not null,
  duration_seconds float,
  volume_level float default 1.0,
  is_temporary boolean default false,
  created_at timestamptz default now()
);

create table public.music_library (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  mood text not null,
  energy_level text not null,
  duration_seconds float not null,
  file_url text not null,
  license text not null default 'royalty_free_cc0',
  is_active boolean default true,
  created_at timestamptz default now()
);


-- =================================================================
-- AGENT RUNS & OBSERVABILITY
-- =================================================================

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  scene_id uuid references public.scenes(id) on delete set null,
  session_id text references public.sessions(id) on delete set null,
  model_role text references public.model_roles(role) not null,
  agent_name text not null,
  langsmith_trace_id text,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  status text default 'running',
  error_message text,
  attempt_number int default 1,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create table public.feedback_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  scene_id uuid references public.scenes(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id text references public.sessions(id) on delete set null,
  retrieval_log_id uuid,
  affected_document_ids uuid[] default '{}',
  event_type text not null,
  metadata jsonb,
  created_at timestamptz default now()
);


-- =================================================================
-- PERSONAL USER MEMORY (replaces flat project_memory)
-- Layer 3: ChatGPT-style extracted facts, one row per fact.
-- =================================================================

create table public.user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  -- nullable: which project (if any) this fact was extracted from
  fact_type text,
  -- e.g. 'style', 'audience_level', 'tone', 'color_preference', 'complexity'
  fact_text text not null,
  -- short natural language description, e.g. "prefers dark color palettes"
  -- halfvec, not vector: pgvector's HNSW index caps the plain `vector`
  -- type at 2000 dimensions. nv-embed-v1 outputs 4096, which only
  -- fits if stored as halfvec (16-bit), indexable up to 4096 dims.
  embedding halfvec(4096),
  embedding_model text,
  created_at timestamptz default now()
);


-- =================================================================
-- PREFERENCE GRAPH (replaces flat project_memory)
-- Layer 4: MemGraphRAG-style nodes and edges, per-user scope.
-- =================================================================

create table public.memory_nodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  node_type text not null,
  -- e.g. 'color_palette', 'animation_style', 'topic', 'audience_type', 'project'
  label text not null,
  -- human-readable value, e.g. "blue and orange palette"
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  unique(user_id, node_type, label)
);

create table public.memory_edges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  -- denormalized from the nodes for simpler RLS and faster filtering
  source_node_id uuid references public.memory_nodes(id) on delete cascade not null,
  target_node_id uuid references public.memory_nodes(id) on delete cascade not null,
  relationship_type text not null,
  -- e.g. 'used-in', 'succeeded-with', 'similar-to'
  weight float default 1.0,
  -- strengthened on repeated co-occurrence
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(source_node_id, target_node_id, relationship_type)
);


-- =================================================================
-- RAG DOCUMENTS (shared Manim knowledge corpus)
-- Embeddings now live in Pinecone, not Postgres — this row's `id`
-- is used directly as the Pinecone vector ID. This table holds
-- everything Arbiter needs to score/filter/promote candidates.
-- =================================================================

create table public.rag_documents (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  content_type text not null,
  source_type text not null,
  animation_category text,
  manim_version text,
  is_candidate boolean default false,
  is_stale boolean default false,
  is_promoted boolean default false,
  -- true once Arbiter's weekly job includes this doc in the turbovec hot tier
  quality_score float default 0.5,
  retrieval_count int default 0,
  retrieval_success_rate float default 0.0,
  embedding_model text,
  -- records which model generated the vector stored in Pinecone for this doc
  tags text[] default '{}',
  metadata jsonb default '{}',
  ttl_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- =================================================================
-- RAG RETRIEVAL LOGS
-- query_embedding removed — queries are embedded and searched
-- directly against Pinecone/turbovec, not logged as vectors here.
-- =================================================================

create table public.rag_retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.sessions(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete set null,
  query_text text not null,
  retrieved_document_ids uuid[] default '{}',
  similarity_scores float[] default '{}',
  reranked_document_ids uuid[] default '{}',
  retrieval_source text default 'pinecone',
  -- 'turbovec' | 'pinecone' | 'pageindex' | 'cache' — which path served this query
  cache_hit boolean default false,
  retrieval_latency_ms int,
  created_at timestamptz default now()
);

alter table public.feedback_events
  add constraint feedback_retrieval_log_fkey
  foreign key (retrieval_log_id) references public.rag_retrieval_logs(id)
  on delete set null;


-- =================================================================
-- PAGEINDEX METADATA
-- =================================================================

create table public.pageindex_indexes (
  id uuid primary key default gen_random_uuid(),
  manim_version text not null unique,
  storage_path text not null,
  node_count int,
  build_status text default 'pending',
  built_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- =================================================================
-- TURBOVEC METADATA
-- Tracks the in-process hot-tier index rebuilt after each of
-- Arbiter's weekly promotion runs.
-- =================================================================

create table public.turbovec_indexes (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  document_count int,
  min_quality_score float default 0.65,
  build_status text default 'pending',
  built_at timestamptz,
  created_at timestamptz default now()
);


-- =================================================================
-- API CHANGES
-- =================================================================

create table public.api_changes (
  id uuid primary key default gen_random_uuid(),
  manim_version text not null,
  change_description text,
  affected_apis text[] default '{}',
  released_at timestamptz,
  created_at timestamptz default now()
);


-- =================================================================
-- RATE LIMIT EVENTS
-- =================================================================

create table public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.sessions(id) on delete set null,
  project_id uuid references public.projects(id) on delete cascade,
  model_role text references public.model_roles(role) not null,
  event_type text not null,
  queue_position int,
  wait_time_ms int,
  created_at timestamptz default now()
);


-- =================================================================
-- ADMIN SYSTEM
-- =================================================================

create table public.admin_users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null default 'admin',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_users(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  created_at timestamptz default now()
);


-- =================================================================
-- DOCUMENT MANAGEMENT
-- =================================================================

create table public.document_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_users(id) on delete set null,
  job_type text not null,
  status text default 'pending',
  source_url text,
  source_type text,
  manim_version text,
  total_documents int default 0,
  processed_documents int default 0,
  failed_documents int default 0,
  skipped_duplicates int default 0,
  error_log jsonb default '[]',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table public.document_review_queue (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.rag_documents(id) on delete cascade not null,
  ingestion_job_id uuid references public.document_ingestion_jobs(id) on delete set null,
  review_status text default 'pending',
  reviewed_by uuid references public.admin_users(id) on delete set null,
  review_notes text,
  arbiter_score float,
  arbiter_reasoning text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);


-- =================================================================
-- PIPELINE PERFORMANCE
-- =================================================================

create table public.pipeline_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  total_projects_created int default 0,
  total_scenes_generated int default 0,
  first_pass_render_success_rate float,
  average_fix_attempts_per_scene float,
  average_scene_generation_latency_ms int,
  average_full_pipeline_latency_ms int,
  model_call_counts jsonb default '{}',
  model_token_usage jsonb default '{}',
  model_error_rates jsonb default '{}',
  retrieval_cache_hit_rate float,
  average_retrieval_latency_ms int,
  retrieval_mrr float,
  top_animation_categories jsonb default '[]',
  rate_limit_hit_count int default 0,
  average_queue_wait_ms int,
  peak_queue_depth int,
  total_videos_completed int default 0,
  total_videos_failed int default 0,
  average_video_duration_seconds float,
  created_at timestamptz default now()
);

create table public.model_daily_stats (
  id uuid primary key default gen_random_uuid(),
  stat_date date not null,
  model_role text references public.model_roles(role) not null,
  total_calls int default 0,
  successful_calls int default 0,
  failed_calls int default 0,
  retried_calls int default 0,
  total_input_tokens int default 0,
  total_output_tokens int default 0,
  average_latency_ms int,
  p95_latency_ms int,
  p99_latency_ms int,
  rate_limit_hits int default 0,
  created_at timestamptz default now(),
  unique(stat_date, model_role)
);

create table public.rag_document_stats (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.rag_documents(id) on delete cascade not null,
  stat_date date not null,
  retrieval_count int default 0,
  used_in_generation_count int default 0,
  positive_feedback_count int default 0,
  negative_feedback_count int default 0,
  render_success_when_used int default 0,
  render_fail_when_used int default 0,
  created_at timestamptz default now(),
  unique(document_id, stat_date)
);


-- =================================================================
-- SYSTEM LOGS
-- =================================================================

create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  log_level text not null,
  service text not null,
  event_type text not null,
  message text not null,
  project_id uuid references public.projects(id) on delete set null,
  scene_id uuid references public.scenes(id) on delete set null,
  session_id text references public.sessions(id) on delete set null,
  celery_task_id text,
  correlation_id text,
  metadata jsonb default '{}',
  stack_trace text,
  created_at timestamptz default now()
);

create table public.dead_letter_queue (
  id uuid primary key default gen_random_uuid(),
  celery_task_id text not null,
  task_name text not null,
  queue_name text not null,
  project_id uuid references public.projects(id) on delete set null,
  scene_id uuid references public.scenes(id) on delete set null,
  attempt_count int not null,
  last_error text,
  last_traceback text,
  task_args jsonb,
  task_kwargs jsonb,
  first_failed_at timestamptz not null,
  last_failed_at timestamptz not null,
  resolved boolean default false,
  resolved_by uuid references public.admin_users(id) on delete set null,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz default now()
);


-- =================================================================
-- SYSTEM CONFIG
-- =================================================================

create table public.system_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.admin_users(id) on delete set null,
  updated_at timestamptz default now()
);

insert into public.system_config (key, value, description) values
  ('rag_candidate_quality_threshold',  '0.65',  'Minimum quality score for Arbiter weekly promotion'),
  ('rag_candidate_min_retrievals',     '5',     'Minimum retrieval events before candidate is eligible'),
  ('rag_semantic_cache_threshold',     '0.95',  'Cosine similarity threshold for semantic cache hits'),
  ('rag_duplicate_threshold',          '0.92',  'Cosine similarity threshold for near-duplicate detection'),
  ('max_fix_iterations',               '3',     'Maximum Forge fix attempts per scene before best-effort return'),
  ('manim_dry_run_timeout_seconds',    '30',    'Hard timeout for Manim dry-run sandboxed subprocess'),
  ('elevenlabs_concurrency',           '1',     'Max concurrent ElevenLabs TTS requests (free tier limit)'),
  ('music_duck_under_voiceover',       '0.30',  'Background music volume under voiceover segments'),
  ('music_duck_in_gaps',               '0.60',  'Background music volume in silent gaps'),
  ('graph_traversal_max_hops',         '3',     'Max hops for memory_nodes/memory_edges recursive CTE traversal'),
  ('maintenance_mode',                 'false', 'Puts entire system in read-only maintenance mode');


-- =================================================================
-- INDEXES
-- =================================================================

create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_project_id on public.sessions(project_id);
create index idx_sessions_started_at on public.sessions(started_at);
create index idx_profiles_email on public.profiles(email);
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_status on public.projects(status);
create index idx_prompt_versions_model_role on public.prompt_versions(model_role, is_active);
create index idx_prompt_history_project_id on public.prompt_history(project_id);
create index idx_prompt_history_user_id on public.prompt_history(user_id);
create index idx_prompt_history_session_id on public.prompt_history(session_id);
create index idx_scenes_project_id on public.scenes(project_id);
create index idx_scenes_project_scene on public.scenes(project_id, scene_index);
create index idx_scenes_status on public.scenes(status);
create index idx_scene_checkpoints_scene_id on public.scene_checkpoints(scene_id);
create index idx_scene_checkpoints_project_scene on public.scene_checkpoints(project_id, scene_index, attempt_number);
create index idx_scene_checkpoints_celery_task on public.scene_checkpoints(celery_task_id);
create index idx_narrator_scripts_project_id on public.narrator_scripts(project_id);
create index idx_audio_files_project_id on public.audio_files(project_id);
create index idx_audio_files_scene_id on public.audio_files(scene_id);
create index idx_music_library_mood on public.music_library(mood, energy_level);
create index idx_agent_runs_project_id on public.agent_runs(project_id);
create index idx_agent_runs_model_role on public.agent_runs(model_role);
create index idx_agent_runs_langsmith on public.agent_runs(langsmith_trace_id);
create index idx_agent_runs_session_id on public.agent_runs(session_id);
create index idx_feedback_events_project_id on public.feedback_events(project_id);
create index idx_feedback_events_user_id on public.feedback_events(user_id);
create index idx_feedback_events_session_id on public.feedback_events(session_id);

-- user_memory (personal facts, pgvector)
create index idx_user_memory_user_id on public.user_memory(user_id);
create index idx_user_memory_embedding on public.user_memory
  using hnsw (embedding halfvec_cosine_ops) with (m = 16, ef_construction = 64);

-- memory_nodes / memory_edges (preference graph, recursive CTE traversal)
create index idx_memory_nodes_user_id on public.memory_nodes(user_id, node_type);
create index idx_memory_edges_user_id on public.memory_edges(user_id);
create index idx_memory_edges_source on public.memory_edges(source_node_id);
create index idx_memory_edges_target on public.memory_edges(target_node_id);

-- rag_documents (no embedding column — vectors live in Pinecone)
create index idx_rag_version_candidate_stale on public.rag_documents
  using btree (manim_version, is_candidate, is_stale);
create index idx_rag_promoted on public.rag_documents(is_promoted) where is_promoted = true;
create index idx_rag_animation_category on public.rag_documents(animation_category);
create index idx_rag_source_type on public.rag_documents(source_type);
create index idx_rag_metadata on public.rag_documents using gin (metadata);
create index idx_rag_tags on public.rag_documents using gin (tags);
create index idx_rag_ttl on public.rag_documents(ttl_expires_at)
  where ttl_expires_at is not null;

create index idx_rag_retrieval_logs_project_id on public.rag_retrieval_logs(project_id);
create index idx_rag_retrieval_logs_session_id on public.rag_retrieval_logs(session_id);
create index idx_rag_retrieval_logs_created_at on public.rag_retrieval_logs(created_at);
create index idx_pageindex_version on public.pageindex_indexes(manim_version);
create index idx_turbovec_built_at on public.turbovec_indexes(built_at desc);
create index idx_rate_limit_events_session on public.rate_limit_events(session_id);
create index idx_rate_limit_events_model_role on public.rate_limit_events(model_role, created_at);
create index idx_admin_audit_logs_admin_id on public.admin_audit_logs(admin_id);
create index idx_admin_audit_logs_created_at on public.admin_audit_logs(created_at);
create index idx_admin_audit_logs_target on public.admin_audit_logs(target_table, target_id);
create index idx_ingestion_jobs_status on public.document_ingestion_jobs(status);
create index idx_ingestion_jobs_created_at on public.document_ingestion_jobs(created_at);
create index idx_review_queue_document_id on public.document_review_queue(document_id);
create index idx_review_queue_status on public.document_review_queue(review_status);
create index idx_pipeline_snapshots_date on public.pipeline_performance_snapshots(snapshot_date);
create index idx_model_daily_stats_date on public.model_daily_stats(stat_date);
create index idx_model_daily_stats_role on public.model_daily_stats(model_role, stat_date);
create index idx_rag_doc_stats_document on public.rag_document_stats(document_id);
create index idx_rag_doc_stats_date on public.rag_document_stats(stat_date);
create index idx_system_logs_level on public.system_logs(log_level, created_at);
create index idx_system_logs_service on public.system_logs(service, created_at);
create index idx_system_logs_project_id on public.system_logs(project_id);
create index idx_system_logs_correlation on public.system_logs(correlation_id);
create index idx_system_logs_session_id on public.system_logs(session_id);
create index idx_system_logs_created_at on public.system_logs(created_at);
create index idx_dlq_project_id on public.dead_letter_queue(project_id);
create index idx_dlq_resolved on public.dead_letter_queue(resolved, created_at);
create index idx_dlq_task_name on public.dead_letter_queue(task_name);


-- =================================================================
-- ROW LEVEL SECURITY
-- =================================================================

alter table public.model_roles enable row level security;
alter table public.sessions enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.prompt_history enable row level security;
alter table public.scenes enable row level security;
alter table public.scene_checkpoints enable row level security;
alter table public.narrator_scripts enable row level security;
alter table public.audio_files enable row level security;
alter table public.music_library enable row level security;
alter table public.agent_runs enable row level security;
alter table public.feedback_events enable row level security;
alter table public.user_memory enable row level security;
alter table public.memory_nodes enable row level security;
alter table public.memory_edges enable row level security;
alter table public.rag_documents enable row level security;
alter table public.rag_retrieval_logs enable row level security;
alter table public.pageindex_indexes enable row level security;
alter table public.turbovec_indexes enable row level security;
alter table public.api_changes enable row level security;
alter table public.rate_limit_events enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.document_ingestion_jobs enable row level security;
alter table public.document_review_queue enable row level security;
alter table public.pipeline_performance_snapshots enable row level security;
alter table public.model_daily_stats enable row level security;
alter table public.rag_document_stats enable row level security;
alter table public.system_logs enable row level security;
alter table public.dead_letter_queue enable row level security;
alter table public.system_config enable row level security;


-- Helper: check if the calling user is an active admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_active = true
  );
end;
$$ language plpgsql security definer;


-- model_roles: all authenticated users can read
create policy "authenticated read model roles"
  on public.model_roles for select
  using (auth.role() = 'authenticated');

-- sessions
create policy "users manage own sessions"
  on public.sessions for all
  using (auth.uid() = user_id);

-- profiles
create policy "users manage own profile"
  on public.profiles for all
  using (auth.uid() = id);

-- projects
create policy "users manage own projects"
  on public.projects for all
  using (auth.uid() = user_id);

-- prompt versions
create policy "authenticated read prompt versions"
  on public.prompt_versions for select
  using (auth.role() = 'authenticated');

-- prompt history
create policy "users see own prompt history"
  on public.prompt_history for all
  using (auth.uid() = user_id);

-- scenes
create policy "users see own scenes"
  on public.scenes for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- scene checkpoints
create policy "users see own checkpoints"
  on public.scene_checkpoints for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- narrator scripts
create policy "users see own narrator scripts"
  on public.narrator_scripts for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- audio files
create policy "users see own audio files"
  on public.audio_files for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- music library
create policy "authenticated read music library"
  on public.music_library for select
  using (auth.role() = 'authenticated' and is_active = true);

-- agent runs
create policy "users see own agent runs"
  on public.agent_runs for all
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- feedback events
create policy "users see own feedback"
  on public.feedback_events for all
  using (auth.uid() = user_id);

-- user memory
create policy "users manage own memory facts"
  on public.user_memory for all
  using (auth.uid() = user_id);

-- memory graph
create policy "users manage own memory nodes"
  on public.memory_nodes for all
  using (auth.uid() = user_id);
create policy "users manage own memory edges"
  on public.memory_edges for all
  using (auth.uid() = user_id);

-- rag documents
create policy "authenticated read rag"
  on public.rag_documents for select
  using (auth.role() = 'authenticated');
create policy "service role manages rag"
  on public.rag_documents for all
  using (auth.role() = 'service_role');

-- rag retrieval logs
create policy "users see own retrieval logs"
  on public.rag_retrieval_logs for select
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- pageindex
create policy "authenticated read pageindex"
  on public.pageindex_indexes for select
  using (auth.role() = 'authenticated');

-- turbovec
create policy "authenticated read turbovec"
  on public.turbovec_indexes for select
  using (auth.role() = 'authenticated');

-- api changes
create policy "authenticated read api changes"
  on public.api_changes for select
  using (auth.role() = 'authenticated');

-- rate limit events
create policy "users see own rate limit events"
  on public.rate_limit_events for select
  using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

-- all admin tables
create policy "admins only" on public.admin_users
  for all using (public.is_admin());
create policy "admins only" on public.admin_audit_logs
  for all using (public.is_admin());
create policy "admins only" on public.document_ingestion_jobs
  for all using (public.is_admin());
create policy "admins only" on public.document_review_queue
  for all using (public.is_admin());
create policy "admins only" on public.pipeline_performance_snapshots
  for all using (public.is_admin());
create policy "admins only" on public.model_daily_stats
  for all using (public.is_admin());
create policy "admins only" on public.rag_document_stats
  for all using (public.is_admin());
create policy "admins only" on public.system_logs
  for all using (public.is_admin());
create policy "admins only" on public.dead_letter_queue
  for all using (public.is_admin());
create policy "admins only" on public.system_config
  for all using (public.is_admin());


-- =================================================================
-- TRIGGERS
-- =================================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.scenes
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.scene_checkpoints
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.narrator_scripts
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.rag_documents
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.pageindex_indexes
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.memory_edges
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.admin_users
  for each row execute function public.handle_updated_at();
create trigger handle_updated_at before update on public.system_config
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup.
-- (No more seeded project_memory row — user_memory and memory_nodes
-- populate organically as the user creates projects.)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =================================================================
-- MAKE YOURSELF SUPER ADMIN
-- After running this entire file, run this separately with your
-- real Supabase auth user UUID:
--
-- insert into public.admin_users (id, email, role)
-- values ('<your-auth-user-uuid>', '<your-email>', 'super_admin');
-- =================================================================