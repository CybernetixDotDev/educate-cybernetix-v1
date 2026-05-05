create table if not exists public.presentation_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  project_id uuid not null references public.student_projects(id) on delete cascade,
  presentation_plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint presentation_plans_student_project_unique unique (student_id, project_id)
);

create index if not exists presentation_plans_student_id_idx on public.presentation_plans(student_id);
create index if not exists presentation_plans_project_id_idx on public.presentation_plans(project_id);

alter table public.presentation_plans enable row level security;

grant select, insert, update on public.presentation_plans to authenticated;

create policy "Students can create their own presentation plans"
  on public.presentation_plans
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.students
      where students.id = presentation_plans.student_id
        and students.user_id = auth.uid()
    )
  );

create policy "Students can update their own presentation plans"
  on public.presentation_plans
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.students
      where students.id = presentation_plans.student_id
        and students.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.students
      where students.id = presentation_plans.student_id
        and students.user_id = auth.uid()
    )
  );

create policy "Students parents and admins can read presentation plans"
  on public.presentation_plans
  for select
  to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1
      from public.students
      where students.id = presentation_plans.student_id
        and students.user_id = auth.uid()
    )
    or app_private.is_parent_of(student_id)
  );
