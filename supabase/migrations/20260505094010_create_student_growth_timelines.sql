create table if not exists public.student_growth_timelines (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  timeline_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_growth_timelines_student_unique unique (student_id)
);

create index if not exists student_growth_timelines_student_id_idx on public.student_growth_timelines(student_id);

alter table public.student_growth_timelines enable row level security;

grant select, insert, update on public.student_growth_timelines to authenticated;

create policy "Admins can create growth timelines"
  on public.student_growth_timelines
  for insert
  to authenticated
  with check (app_private.is_admin());

create policy "Admins can update growth timelines"
  on public.student_growth_timelines
  for update
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

create policy "Students parents and admins can read growth timelines"
  on public.student_growth_timelines
  for select
  to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1
      from public.students
      where students.id = student_growth_timelines.student_id
        and students.user_id = auth.uid()
    )
    or app_private.is_parent_of(student_id)
  );
