create table if not exists public.student_certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  project_id uuid references public.student_projects(id) on delete set null,
  certificate_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_certificates_student_project_unique unique (student_id, project_id)
);

create index if not exists student_certificates_student_id_idx on public.student_certificates(student_id);
create index if not exists student_certificates_project_id_idx on public.student_certificates(project_id);

alter table public.student_certificates enable row level security;

grant select, insert, update on public.student_certificates to authenticated;

create policy "Students can read their own certificates"
  on public.student_certificates
  for select
  to authenticated
  using (
    app_private.is_admin()
    or exists (
      select 1
      from public.students
      where students.id = student_certificates.student_id
        and students.user_id = auth.uid()
    )
    or app_private.is_parent_of(student_id)
  );

create policy "Admins can create certificates"
  on public.student_certificates
  for insert
  to authenticated
  with check (app_private.is_admin());

create policy "Admins can update certificates"
  on public.student_certificates
  for update
  to authenticated
  using (app_private.is_admin())
  with check (app_private.is_admin());
