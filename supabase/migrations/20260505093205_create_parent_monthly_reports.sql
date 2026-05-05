create table if not exists public.parent_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  report_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_monthly_reports_student_month_unique unique (student_id, month)
);

create index if not exists parent_monthly_reports_student_id_idx on public.parent_monthly_reports(student_id);
create index if not exists parent_monthly_reports_month_idx on public.parent_monthly_reports(month);

alter table public.parent_monthly_reports enable row level security;

grant select, insert, update on public.parent_monthly_reports to authenticated;

create policy "Admins can create parent monthly reports"
  on public.parent_monthly_reports
  for insert
  to authenticated
  with check (app_private.is_admin());

create policy "Admins can update parent monthly reports"
  on public.parent_monthly_reports
  for update
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());

create policy "Parents students and admins can read parent monthly reports"
  on public.parent_monthly_reports
  for select
  to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1
      from public.students
      where students.id = parent_monthly_reports.student_id
        and students.user_id = auth.uid()
    )
    or app_private.is_parent_of(student_id)
  );
