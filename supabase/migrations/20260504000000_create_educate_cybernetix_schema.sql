create extension if not exists "pgcrypto";

create table if not exists public.ai_config (
  id uuid primary key default gen_random_uuid(),
  config_key text not null unique,
  provider text not null,
  model text not null,
  temperature numeric(3,2) not null default 0.70,
  max_tokens integer,
  system_prompt text,
  safety_rules text[] not null default '{}'::text[],
  settings jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_module_context (
  id uuid primary key default gen_random_uuid(),
  ai_config_id uuid references public.ai_config(id) on delete cascade,
  module_key text not null unique,
  module_title text not null,
  module_description text,
  grade_levels text[] not null default '{}'::text[],
  learning_objectives text[] not null default '{}'::text[],
  context jsonb not null default '{}'::jsonb,
  prompt_overrides jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  display_name text not null,
  email text,
  date_of_birth date,
  grade_level text,
  avatar_url text,
  parent_name text,
  parent_email text,
  learning_goals text[] not null default '{}'::text[],
  accessibility_preferences jsonb not null default '{}'::jsonb,
  profile_metadata jsonb not null default '{}'::jsonb,
  enrolled_at timestamptz not null default now(),
  last_active_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_user_id_unique unique (user_id)
);

create table if not exists public.ai_interactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  ai_config_id uuid references public.ai_config(id) on delete set null,
  ai_module_context_id uuid references public.ai_module_context(id) on delete set null,
  interaction_type text not null,
  prompt text not null,
  response text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  moderation_flags text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  module_key text not null,
  lesson_key text not null,
  lesson_title text,
  status text not null default 'not_started',
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  time_spent_seconds integer not null default 0,
  completed_steps text[] not null default '{}'::text[],
  score numeric(5,2),
  started_at timestamptz default now(),
  completed_at timestamptz default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_progress_student_lesson_unique unique (student_id, module_key, lesson_key)
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  module_key text,
  lesson_key text,
  quiz_key text not null,
  quiz_title text,
  score numeric(5,2) not null default 0,
  max_score numeric(5,2) not null default 100,
  passed boolean not null default false,
  attempt_number integer not null default 1,
  answers jsonb not null default '{}'::jsonb,
  feedback jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_started_at timestamptz not null default now(),
  session_ended_at timestamptz default now(),
  duration_seconds integer not null default 0,
  device_type text,
  browser text,
  ip_address inet,
  activities text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  template_id uuid,
  title text not null,
  description text,
  status text not null default 'draft',
  difficulty_level text,
  technologies text[] not null default '{}'::text[],
  repository_url text,
  demo_url text,
  project_data jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  student_project_id uuid not null references public.student_projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  position integer not null default 0,
  required_skills text[] not null default '{}'::text[],
  evidence jsonb not null default '{}'::jsonb,
  due_at timestamptz default now(),
  completed_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  achievement_key text not null unique,
  title text not null,
  description text,
  category text not null,
  badge_url text,
  points integer not null default 0,
  requirements jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  award_reason text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_achievements_unique unique (student_id, achievement_id)
);

create table if not exists public.streaks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  streak_type text not null default 'daily_learning',
  current_count integer not null default 0,
  longest_count integer not null default 0,
  last_activity_date date,
  started_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint streaks_student_type_unique unique (student_id, streak_type)
);

create table if not exists public.parent_weekly_summaries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  week_start_date date not null,
  week_end_date date not null,
  lessons_completed integer not null default 0,
  quizzes_completed integer not null default 0,
  average_quiz_score numeric(5,2),
  time_spent_seconds integer not null default 0,
  achievements_awarded text[] not null default '{}'::text[],
  highlights text[] not null default '{}'::text[],
  concerns text[] not null default '{}'::text[],
  summary jsonb not null default '{}'::jsonb,
  sent_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_weekly_summaries_student_week_unique unique (student_id, week_start_date)
);

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  snapshot_type text not null,
  period_start timestamptz not null default now(),
  period_end timestamptz not null default now(),
  metrics jsonb not null default '{}'::jsonb,
  dimensions jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  title text not null,
  description text,
  difficulty_level text,
  estimated_duration_minutes integer,
  technologies text[] not null default '{}'::text[],
  learning_objectives text[] not null default '{}'::text[],
  task_blueprint jsonb not null default '[]'::jsonb,
  starter_files jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'student_projects_template_id_fkey'
      and conrelid = 'public.student_projects'::regclass
  ) then
    alter table public.student_projects
      add constraint student_projects_template_id_fkey
      foreign key (template_id)
      references public.project_templates(id)
      on delete set null;
  end if;
end $$;

create index if not exists lesson_progress_student_id_idx on public.lesson_progress(student_id);
create index if not exists quiz_results_student_id_idx on public.quiz_results(student_id);
create index if not exists session_logs_student_id_idx on public.session_logs(student_id);
create index if not exists student_projects_student_id_idx on public.student_projects(student_id);
create index if not exists project_tasks_student_project_id_idx on public.project_tasks(student_project_id);
create index if not exists parent_weekly_summaries_student_id_idx on public.parent_weekly_summaries(student_id);

alter table public.ai_config enable row level security;
alter table public.ai_module_context enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.students enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_results enable row level security;
alter table public.session_logs enable row level security;
alter table public.student_projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.streaks enable row level security;
alter table public.parent_weekly_summaries enable row level security;
alter table public.analytics_snapshots enable row level security;
alter table public.project_templates enable row level security;
