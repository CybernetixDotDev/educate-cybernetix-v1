create table if not exists public.code_review_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  project_id uuid references public.student_projects(id) on delete set null,
  code text not null,
  review jsonb not null default '{}'::jsonb,
  fix jsonb not null default '{}'::jsonb,
  patch_diff text,
  created_at timestamptz not null default now()
);

create index if not exists code_review_sessions_student_id_idx on public.code_review_sessions(student_id);
create index if not exists code_review_sessions_project_id_idx on public.code_review_sessions(project_id);
create index if not exists code_review_sessions_created_at_idx on public.code_review_sessions(created_at desc);

alter table public.code_review_sessions enable row level security;

grant select, insert on public.code_review_sessions to authenticated;

create policy "Students can create their own code review sessions"
  on public.code_review_sessions
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.students
      where students.id = code_review_sessions.student_id
        and students.user_id = auth.uid()
    )
  );

create policy "Students parents and admins can read code review sessions"
  on public.code_review_sessions
  for select
  to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1
      from public.students
      where students.id = code_review_sessions.student_id
        and students.user_id = auth.uid()
    )
    or app_private.is_parent_of(student_id)
  );
