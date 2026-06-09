-- =================================================================
-- MOVA DATABASE SCHEMA
-- =================================================================

-- EXTENSIONS
create extension if not exists vector;

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

-- =================================================================
-- ELICITATION & PROMPTS
-- =================================================================

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  model_role text not null,
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
  model_role text not null,
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
  retrieval_log_id uuid,
  -- set after rag_retrieval_logs exists, added as fk in migration
  affected_document_ids uuid[] default '{}',
  event_type text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- =================================================================
-- PROJECT MEMORY
-- =================================================================

create table public.project_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  preferred_visual_style text,
  preferred_voice_id text,
  animation_complexity_preference text,
  color_palettes jsonb default '[]',
  successful_animation_types text[] default '{}',
  updated_at timestamptz default now(),
  unique(user_id)
);

-- =================================================================
-- RAG DOCUMENTS
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
  quality_score float default 0.5,
  -- denormalized cache updated by nightly Arbiter job only
  -- source of truth is rag_retrieval_logs + feedback_events
  retrieval_count int default 0,
  retrieval_success_rate float default 0.0,
  embedding vector(1536),
  embedding_model text,
  tags text[] default '{}',
  metadata jsonb default '{}',
  ttl_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =================================================================
-- RAG RETRIEVAL LOGS
-- =================================================================

create table public.rag_retrieval_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  project_id uuid references public.projects(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete set null,
  query_text text not null,
  query_embedding vector(1536),
  retrieved_document_ids uuid[] default '{}',
  similarity_scores float[] default '{}',
  reranked_document_ids uuid[] default '{}',
  cache_hit boolean default false,
  retrieval_latency_ms int,
  created_at timestamptz default now()
);

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
  session_id text not null,
  project_id uuid references public.projects(id) on delete cascade,
  model_role text not null,
  event_type text not null,
  queue_position int,
  wait_time_ms int,
  created_at timestamptz default now()
);

-- =================================================================
-- INDEXES
-- =================================================================

create index idx_profiles_email on public.profiles(email);
create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_status on public.projects(status);
create index idx_prompt_versions_model_role on public.prompt_versions(model_role, is_active);
create index idx_prompt_history_project_id on public.prompt_history(project_id);
create index idx_prompt_history_user_id on public.prompt_history(user_id);
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
create index idx_feedback_events_project_id on public.feedback_events(project_id);
create index idx_feedback_events_user_id on public.feedback_events(user_id);
create index idx_project_memory_user_id on public.project_memory(user_id);
create index idx_rag_embedding on public.rag_documents
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
create index idx_rag_version_candidate_stale on public.rag_documents
  using btree (manim_version, is_candidate, is_stale);
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
create index idx_rate_limit_events_session on public.rate_limit_events(session_id);
create index idx_rate_limit_events_model_role on public.rate_limit_events(model_role, created_at);

-- =================================================================
-- ROW LEVEL SECURITY
-- =================================================================

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.prompt_history enable row level security;
alter table public.scenes enable row level security;
alter table public.scene_checkpoints enable row level security;
alter table public.narrator_scripts enable row level security;
alter table public.audio_files enable row level security;
alter table public.music_library enable row level security;
alter table public.agent_runs enable row level security;
alter table public.feedback_events enable row level security;
alter table public.project_memory enable row level security;
alter table public.rag_documents enable row level security;
alter table public.rag_retrieval_logs enable row level security;
alter table public.pageindex_indexes enable row level security;
alter table public.api_changes enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.rate_limit_events enable row level security;

create policy "users manage own profile"
  on public.profiles for all using (auth.uid() = id);

create policy "users manage own projects"
  on public.projects for all using (auth.uid() = user_id);

create policy "users see own prompt history"
  on public.prompt_history for all using (auth.uid() = user_id);

create policy "users see own scenes"
  on public.scenes for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "users see own checkpoints"
  on public.scene_checkpoints for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "users see own narrator scripts"
  on public.narrator_scripts for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "users see own audio files"
  on public.audio_files for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "authenticated users read music library"
  on public.music_library for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "users see own agent runs"
  on public.agent_runs for all using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "users see own feedback"
  on public.feedback_events for all using (auth.uid() = user_id);

create policy "users see own memory"
  on public.project_memory for all using (auth.uid() = user_id);

create policy "authenticated users read rag"
  on public.rag_documents for select
  using (auth.role() = 'authenticated');

create policy "users see own retrieval logs"
  on public.rag_retrieval_logs for select using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

create policy "authenticated users read pageindex"
  on public.pageindex_indexes for select
  using (auth.role() = 'authenticated');

create policy "authenticated users read api changes"
  on public.api_changes for select
  using (auth.role() = 'authenticated');

create policy "authenticated users read prompt versions"
  on public.prompt_versions for select
  using (auth.role() = 'authenticated');

create policy "users see own rate limit events"
  on public.rate_limit_events for select using (
    project_id in (select id from public.projects where user_id = auth.uid())
  );

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

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.project_memory (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();