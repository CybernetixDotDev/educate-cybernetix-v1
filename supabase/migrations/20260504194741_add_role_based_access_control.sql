do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role' and typnamespace = 'public'::regnamespace) then
    create type public.app_role as enum ('student', 'parent', 'admin');
  end if;
end $$;

create schema if not exists app_private;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parent_students (
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_user_id, student_id)
);

create index if not exists user_roles_role_idx on public.user_roles(role);
create index if not exists parent_students_student_id_idx on public.parent_students(student_id);

alter table public.user_roles enable row level security;
alter table public.parent_students enable row level security;

grant usage on schema app_private to authenticated;
grant select, insert on public.user_roles to authenticated;
grant select on public.parent_students to authenticated;

create or replace function app_private.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.user_roles where user_id = auth.uid()),
    'student'::public.app_role
  );
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.current_user_role() = 'admin'::public.app_role;
$$;

create or replace function app_private.is_parent_of(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parent_students
    where parent_user_id = auth.uid()
      and student_id = target_student_id
  );
$$;

grant execute on function app_private.current_user_role() to authenticated;
grant execute on function app_private.is_admin() to authenticated;
grant execute on function app_private.is_parent_of(uuid) to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Users can read their own role') then
    create policy "Users can read their own role"
      on public.user_roles
      for select
      to authenticated
      using (user_id = auth.uid() or app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_roles' and policyname = 'Users can create their default student role') then
    create policy "Users can create their default student role"
      on public.user_roles
      for insert
      to authenticated
      with check (user_id = auth.uid() and role = 'student'::public.app_role);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'parent_students' and policyname = 'Parents can read their linked students') then
    create policy "Parents can read their linked students"
      on public.parent_students
      for select
      to authenticated
      using (parent_user_id = auth.uid() or app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'students' and policyname = 'Admins can manage student profiles') then
    create policy "Admins can manage student profiles"
      on public.students
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'students' and policyname = 'Parents can read linked student profiles') then
    create policy "Parents can read linked student profiles"
      on public.students
      for select
      to authenticated
      using (app_private.is_parent_of(id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lesson_progress' and policyname = 'Students parents and admins can read lesson progress') then
    create policy "Students parents and admins can read lesson progress"
      on public.lesson_progress
      for select
      to authenticated
      using (
        app_private.is_admin()
        or exists (select 1 from public.students where id = lesson_progress.student_id and user_id = auth.uid())
        or app_private.is_parent_of(student_id)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_results' and policyname = 'Students parents and admins can read quiz results') then
    create policy "Students parents and admins can read quiz results"
      on public.quiz_results
      for select
      to authenticated
      using (
        app_private.is_admin()
        or exists (select 1 from public.students where id = quiz_results.student_id and user_id = auth.uid())
        or app_private.is_parent_of(student_id)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'session_logs' and policyname = 'Students parents and admins can read session logs') then
    create policy "Students parents and admins can read session logs"
      on public.session_logs
      for select
      to authenticated
      using (
        app_private.is_admin()
        or exists (select 1 from public.students where id = session_logs.student_id and user_id = auth.uid())
        or app_private.is_parent_of(student_id)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'student_projects' and policyname = 'Students parents and admins can read projects') then
    create policy "Students parents and admins can read projects"
      on public.student_projects
      for select
      to authenticated
      using (
        app_private.is_admin()
        or exists (select 1 from public.students where id = student_projects.student_id and user_id = auth.uid())
        or app_private.is_parent_of(student_id)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_tasks' and policyname = 'Students parents and admins can read project tasks') then
    create policy "Students parents and admins can read project tasks"
      on public.project_tasks
      for select
      to authenticated
      using (
        app_private.is_admin()
        or exists (
          select 1
          from public.student_projects sp
          join public.students s on s.id = sp.student_id
          where sp.id = project_tasks.student_project_id
            and (s.user_id = auth.uid() or app_private.is_parent_of(s.id))
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'parent_weekly_summaries' and policyname = 'Parents students and admins can read weekly summaries') then
    create policy "Parents students and admins can read weekly summaries"
      on public.parent_weekly_summaries
      for select
      to authenticated
      using (
        app_private.is_admin()
        or exists (select 1 from public.students where id = parent_weekly_summaries.student_id and user_id = auth.uid())
        or app_private.is_parent_of(student_id)
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'analytics_snapshots' and policyname = 'Parents students and admins can read analytics snapshots') then
    create policy "Parents students and admins can read analytics snapshots"
      on public.analytics_snapshots
      for select
      to authenticated
      using (
        app_private.is_admin()
        or student_id is null
        or exists (select 1 from public.students where id = analytics_snapshots.student_id and user_id = auth.uid())
        or app_private.is_parent_of(student_id)
      );
  end if;
end $$;
