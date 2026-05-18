grant select on public.lessons to authenticated;
grant select on public.lesson_versions to authenticated;
grant select on public.quizzes to authenticated;
grant select on public.quiz_versions to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lessons'
      and policyname = 'Authenticated users can read published lessons'
  ) then
    create policy "Authenticated users can read published lessons"
      on public.lessons
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.modules
          join public.courses on courses.id = modules.course_id
          where modules.id = lessons.module_id
            and modules.is_published = true
            and courses.is_published = true
        )
        or app_private.is_admin()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_versions'
      and policyname = 'Authenticated users can read published lesson versions'
  ) then
    create policy "Authenticated users can read published lesson versions"
      on public.lesson_versions
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.lessons
          join public.modules on modules.id = lessons.module_id
          join public.courses on courses.id = modules.course_id
          where lessons.id = lesson_versions.lesson_id
            and lessons.current_version_id = lesson_versions.id
            and modules.is_published = true
            and courses.is_published = true
        )
        or app_private.is_admin()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quizzes'
      and policyname = 'Authenticated users can read published quizzes'
  ) then
    create policy "Authenticated users can read published quizzes"
      on public.quizzes
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.lessons
          join public.modules on modules.id = lessons.module_id
          join public.courses on courses.id = modules.course_id
          where lessons.id = quizzes.lesson_id
            and modules.is_published = true
            and courses.is_published = true
        )
        or app_private.is_admin()
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'quiz_versions'
      and policyname = 'Authenticated users can read published quiz versions'
  ) then
    create policy "Authenticated users can read published quiz versions"
      on public.quiz_versions
      for select
      to authenticated
      using (
        exists (
          select 1
          from public.quizzes
          join public.lessons on lessons.id = quizzes.lesson_id
          join public.modules on modules.id = lessons.module_id
          join public.courses on courses.id = modules.course_id
          where quizzes.id = quiz_versions.quiz_id
            and quizzes.current_version_id = quiz_versions.id
            and modules.is_published = true
            and courses.is_published = true
        )
        or app_private.is_admin()
      );
  end if;
end $$;
