-- current running schema in supbase db
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.model_roles (
  role text NOT NULL,
  model_name text NOT NULL,
  rpm_limit integer NOT NULL DEFAULT 0,
  description text,
  is_batch_only boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT model_roles_pkey PRIMARY KEY (role)
);
CREATE TABLE public.sessions (
  id text NOT NULL,
  user_id uuid,
  project_id uuid,
  started_at timestamp with time zone DEFAULT now(),
  last_active_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT sessions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  subscription_tier text DEFAULT 'free'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  status text DEFAULT 'draft'::text,
  total_scenes integer DEFAULT 0,
  completed_scenes integer DEFAULT 0,
  final_video_url text,
  final_video_duration_seconds double precision,
  has_voiceover boolean DEFAULT false,
  has_background_music boolean DEFAULT false,
  voiceover_status text DEFAULT 'none'::text,
  audio_mix_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.prompt_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  model_role text NOT NULL,
  version text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prompt_versions_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_versions_model_role_fkey FOREIGN KEY (model_role) REFERENCES public.model_roles(role)
);
CREATE TABLE public.prompt_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  session_id text,
  raw_prompt text NOT NULL,
  enriched_prompt text,
  elicitation_turns jsonb DEFAULT '[]'::jsonb,
  requirements jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prompt_history_pkey PRIMARY KEY (id),
  CONSTRAINT prompt_history_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT prompt_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT prompt_history_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
CREATE TABLE public.scenes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  scene_index integer NOT NULL,
  title text NOT NULL,
  visual_description text,
  expected_animation_types ARRAY,
  approximate_duration_seconds double precision,
  transition_type text,
  dependency_scene_indexes ARRAY DEFAULT '{}'::integer[],
  complexity text DEFAULT 'medium'::text,
  complexity_score double precision DEFAULT 0.5,
  status text DEFAULT 'pending'::text,
  is_dirty boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scenes_pkey PRIMARY KEY (id),
  CONSTRAINT scenes_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.scene_checkpoints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  scene_id uuid NOT NULL,
  project_id uuid NOT NULL,
  scene_index integer NOT NULL,
  attempt_number integer DEFAULT 1,
  celery_task_id text UNIQUE,
  retrieved_context jsonb,
  generated_code text,
  review_issues jsonb,
  fix_attempts integer DEFAULT 0,
  final_code text,
  ast_parse_passed boolean,
  dry_run_passed boolean,
  dry_run_error text,
  dry_run_attempts integer DEFAULT 0,
  render_status text DEFAULT 'pending'::text,
  clip_url text,
  render_duration_seconds double precision,
  render_error text,
  extracted_color_palette jsonb,
  extracted_coordinate_systems jsonb,
  extracted_manim_objects jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scene_checkpoints_pkey PRIMARY KEY (id),
  CONSTRAINT scene_checkpoints_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.scenes(id),
  CONSTRAINT scene_checkpoints_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.narrator_scripts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  full_script text NOT NULL,
  segments jsonb NOT NULL CHECK (jsonb_typeof(segments) = 'array'::text),
  voice_id text,
  voiceover_tone text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT narrator_scripts_pkey PRIMARY KEY (id),
  CONSTRAINT narrator_scripts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.audio_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  scene_id uuid,
  audio_type text NOT NULL,
  file_url text NOT NULL,
  duration_seconds double precision,
  volume_level double precision DEFAULT 1.0,
  is_temporary boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT audio_files_pkey PRIMARY KEY (id),
  CONSTRAINT audio_files_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT audio_files_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.scenes(id)
);
CREATE TABLE public.music_library (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  mood text NOT NULL,
  energy_level text NOT NULL,
  duration_seconds double precision NOT NULL,
  file_url text NOT NULL,
  license text NOT NULL DEFAULT 'royalty_free_cc0'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT music_library_pkey PRIMARY KEY (id)
);
CREATE TABLE public.agent_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  scene_id uuid,
  session_id text,
  model_role text NOT NULL,
  agent_name text NOT NULL,
  langsmith_trace_id text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  status text DEFAULT 'running'::text,
  error_message text,
  attempt_number integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT agent_runs_pkey PRIMARY KEY (id),
  CONSTRAINT agent_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT agent_runs_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.scenes(id),
  CONSTRAINT agent_runs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT agent_runs_model_role_fkey FOREIGN KEY (model_role) REFERENCES public.model_roles(role)
);
CREATE TABLE public.feedback_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  scene_id uuid,
  user_id uuid NOT NULL,
  session_id text,
  retrieval_log_id uuid,
  affected_document_ids ARRAY DEFAULT '{}'::uuid[],
  event_type text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedback_events_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT feedback_events_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.scenes(id),
  CONSTRAINT feedback_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT feedback_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT feedback_retrieval_log_fkey FOREIGN KEY (retrieval_log_id) REFERENCES public.rag_retrieval_logs(id)
);
CREATE TABLE public.user_memory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  fact_type text,
  fact_text text NOT NULL,
  embedding USER-DEFINED,
  embedding_model text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_memory_pkey PRIMARY KEY (id),
  CONSTRAINT user_memory_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_memory_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.memory_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  node_type text NOT NULL,
  label text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT memory_nodes_pkey PRIMARY KEY (id),
  CONSTRAINT memory_nodes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.memory_edges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_node_id uuid NOT NULL,
  target_node_id uuid NOT NULL,
  relationship_type text NOT NULL,
  weight double precision DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT memory_edges_pkey PRIMARY KEY (id),
  CONSTRAINT memory_edges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT memory_edges_source_node_id_fkey FOREIGN KEY (source_node_id) REFERENCES public.memory_nodes(id),
  CONSTRAINT memory_edges_target_node_id_fkey FOREIGN KEY (target_node_id) REFERENCES public.memory_nodes(id)
);
CREATE TABLE public.rag_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text NOT NULL,
  content_type text NOT NULL,
  source_type text NOT NULL,
  animation_category text,
  manim_version text,
  is_candidate boolean DEFAULT false,
  is_stale boolean DEFAULT false,
  is_promoted boolean DEFAULT false,
  quality_score double precision DEFAULT 0.5,
  retrieval_count integer DEFAULT 0,
  retrieval_success_rate double precision DEFAULT 0.0,
  embedding_model text,
  tags ARRAY DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  ttl_expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rag_documents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rag_retrieval_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text,
  project_id uuid,
  scene_id uuid,
  query_text text NOT NULL,
  retrieved_document_ids ARRAY DEFAULT '{}'::uuid[],
  similarity_scores ARRAY DEFAULT '{}'::double precision[],
  reranked_document_ids ARRAY DEFAULT '{}'::uuid[],
  retrieval_source text DEFAULT 'pinecone'::text,
  cache_hit boolean DEFAULT false,
  retrieval_latency_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rag_retrieval_logs_pkey PRIMARY KEY (id),
  CONSTRAINT rag_retrieval_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT rag_retrieval_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT rag_retrieval_logs_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.scenes(id)
);
CREATE TABLE public.pageindex_indexes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  manim_version text NOT NULL UNIQUE,
  storage_path text NOT NULL,
  node_count integer,
  build_status text DEFAULT 'pending'::text,
  built_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pageindex_indexes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.turbovec_indexes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  document_count integer,
  min_quality_score double precision DEFAULT 0.65,
  build_status text DEFAULT 'pending'::text,
  built_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT turbovec_indexes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.api_changes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  manim_version text NOT NULL,
  change_description text,
  affected_apis ARRAY DEFAULT '{}'::text[],
  released_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT api_changes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.rate_limit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text,
  project_id uuid,
  model_role text NOT NULL,
  event_type text NOT NULL,
  queue_position integer,
  wait_time_ms integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rate_limit_events_pkey PRIMARY KEY (id),
  CONSTRAINT rate_limit_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT rate_limit_events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT rate_limit_events_model_role_fkey FOREIGN KEY (model_role) REFERENCES public.model_roles(role)
);
CREATE TABLE public.admin_users (
  id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'admin'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.admin_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT admin_audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id)
);
CREATE TABLE public.document_ingestion_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  job_type text NOT NULL,
  status text DEFAULT 'pending'::text,
  source_url text,
  source_type text,
  manim_version text,
  total_documents integer DEFAULT 0,
  processed_documents integer DEFAULT 0,
  failed_documents integer DEFAULT 0,
  skipped_duplicates integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_ingestion_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT document_ingestion_jobs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(id)
);
CREATE TABLE public.document_review_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  ingestion_job_id uuid,
  review_status text DEFAULT 'pending'::text,
  reviewed_by uuid,
  review_notes text,
  arbiter_score double precision,
  arbiter_reasoning text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_review_queue_pkey PRIMARY KEY (id),
  CONSTRAINT document_review_queue_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.rag_documents(id),
  CONSTRAINT document_review_queue_ingestion_job_id_fkey FOREIGN KEY (ingestion_job_id) REFERENCES public.document_ingestion_jobs(id),
  CONSTRAINT document_review_queue_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin_users(id)
);
CREATE TABLE public.pipeline_performance_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  total_projects_created integer DEFAULT 0,
  total_scenes_generated integer DEFAULT 0,
  first_pass_render_success_rate double precision,
  average_fix_attempts_per_scene double precision,
  average_scene_generation_latency_ms integer,
  average_full_pipeline_latency_ms integer,
  model_call_counts jsonb DEFAULT '{}'::jsonb,
  model_token_usage jsonb DEFAULT '{}'::jsonb,
  model_error_rates jsonb DEFAULT '{}'::jsonb,
  retrieval_cache_hit_rate double precision,
  average_retrieval_latency_ms integer,
  retrieval_mrr double precision,
  top_animation_categories jsonb DEFAULT '[]'::jsonb,
  rate_limit_hit_count integer DEFAULT 0,
  average_queue_wait_ms integer,
  peak_queue_depth integer,
  total_videos_completed integer DEFAULT 0,
  total_videos_failed integer DEFAULT 0,
  average_video_duration_seconds double precision,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pipeline_performance_snapshots_pkey PRIMARY KEY (id)
);
CREATE TABLE public.model_daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stat_date date NOT NULL,
  model_role text NOT NULL,
  total_calls integer DEFAULT 0,
  successful_calls integer DEFAULT 0,
  failed_calls integer DEFAULT 0,
  retried_calls integer DEFAULT 0,
  total_input_tokens integer DEFAULT 0,
  total_output_tokens integer DEFAULT 0,
  average_latency_ms integer,
  p95_latency_ms integer,
  p99_latency_ms integer,
  rate_limit_hits integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT model_daily_stats_pkey PRIMARY KEY (id),
  CONSTRAINT model_daily_stats_model_role_fkey FOREIGN KEY (model_role) REFERENCES public.model_roles(role)
);
CREATE TABLE public.rag_document_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  stat_date date NOT NULL,
  retrieval_count integer DEFAULT 0,
  used_in_generation_count integer DEFAULT 0,
  positive_feedback_count integer DEFAULT 0,
  negative_feedback_count integer DEFAULT 0,
  render_success_when_used integer DEFAULT 0,
  render_fail_when_used integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rag_document_stats_pkey PRIMARY KEY (id),
  CONSTRAINT rag_document_stats_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.rag_documents(id)
);
CREATE TABLE public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_level text NOT NULL,
  service text NOT NULL,
  event_type text NOT NULL,
  message text NOT NULL,
  project_id uuid,
  scene_id uuid,
  session_id text,
  celery_task_id text,
  correlation_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  stack_trace text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_logs_pkey PRIMARY KEY (id),
  CONSTRAINT system_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT system_logs_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.scenes(id),
  CONSTRAINT system_logs_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
CREATE TABLE public.dead_letter_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  celery_task_id text NOT NULL,
  task_name text NOT NULL,
  queue_name text NOT NULL,
  project_id uuid,
  scene_id uuid,
  attempt_count integer NOT NULL,
  last_error text,
  last_traceback text,
  task_args jsonb,
  task_kwargs jsonb,
  first_failed_at timestamp with time zone NOT NULL,
  last_failed_at timestamp with time zone NOT NULL,
  resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT dead_letter_queue_pkey PRIMARY KEY (id),
  CONSTRAINT dead_letter_queue_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT dead_letter_queue_scene_id_fkey FOREIGN KEY (scene_id) REFERENCES public.scenes(id),
  CONSTRAINT dead_letter_queue_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.admin_users(id)
);
CREATE TABLE public.system_config (
  key text NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_config_pkey PRIMARY KEY (key),
  CONSTRAINT system_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin_users(id)
);