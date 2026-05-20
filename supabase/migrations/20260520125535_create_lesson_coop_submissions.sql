create table if not exists public.lesson_task_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  module_key text not null,
  lesson_key text not null,
  task_id text not null,
  checkpoint_type text not null check (checkpoint_type in ('screenshot', 'file', 'link', 'text')),
  submission_json jsonb not null default '{}'::jsonb,
  verification_json jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('submitted', 'pass', 'needs_revision')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_task_submissions_unique unique (student_id, module_key, lesson_key, task_id)
);

create table if not exists public.lesson_final_submissions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  module_key text not null,
  lesson_key text not null,
  task_checkpoint_ids text[] not null default '{}'::text[],
  project_submission_json jsonb not null default '{}'::jsonb,
  micro_survey_json jsonb not null default '{}'::jsonb,
  mentor_review_json jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('submitted', 'pass', 'needs_revision')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_final_submissions_unique unique (student_id, module_key, lesson_key)
);

create index if not exists lesson_task_submissions_student_idx
  on public.lesson_task_submissions(student_id);

create index if not exists lesson_task_submissions_lesson_idx
  on public.lesson_task_submissions(module_key, lesson_key);

create index if not exists lesson_final_submissions_student_idx
  on public.lesson_final_submissions(student_id);

create index if not exists lesson_final_submissions_lesson_idx
  on public.lesson_final_submissions(module_key, lesson_key);

alter table public.lesson_task_submissions enable row level security;
alter table public.lesson_final_submissions enable row level security;

grant select, insert, update on public.lesson_task_submissions to authenticated;
grant select, insert, update on public.lesson_final_submissions to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;

insert into storage.buckets (id, name, public)
values ('lesson-submissions', 'lesson-submissions', false)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_task_submissions'
      and policyname = 'Students parents and admins can read task submissions'
  ) then
    create policy "Students parents and admins can read task submissions"
      on public.lesson_task_submissions
      for select
      to authenticated
      using (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_task_submissions.student_id
            and students.user_id = auth.uid()
        )
        or app_private.is_parent_of(student_id)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_task_submissions'
      and policyname = 'Students can upsert own task submissions'
  ) then
    create policy "Students can upsert own task submissions"
      on public.lesson_task_submissions
      for insert
      to authenticated
      with check (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_task_submissions.student_id
            and students.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_task_submissions'
      and policyname = 'Students can update own task submissions'
  ) then
    create policy "Students can update own task submissions"
      on public.lesson_task_submissions
      for update
      to authenticated
      using (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_task_submissions.student_id
            and students.user_id = auth.uid()
        )
      )
      with check (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_task_submissions.student_id
            and students.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_final_submissions'
      and policyname = 'Students parents and admins can read final submissions'
  ) then
    create policy "Students parents and admins can read final submissions"
      on public.lesson_final_submissions
      for select
      to authenticated
      using (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_final_submissions.student_id
            and students.user_id = auth.uid()
        )
        or app_private.is_parent_of(student_id)
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_final_submissions'
      and policyname = 'Students can upsert own final submissions'
  ) then
    create policy "Students can upsert own final submissions"
      on public.lesson_final_submissions
      for insert
      to authenticated
      with check (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_final_submissions.student_id
            and students.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_final_submissions'
      and policyname = 'Students can update own final submissions'
  ) then
    create policy "Students can update own final submissions"
      on public.lesson_final_submissions
      for update
      to authenticated
      using (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_final_submissions.student_id
            and students.user_id = auth.uid()
        )
      )
      with check (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_final_submissions.student_id
            and students.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_progress'
      and policyname = 'Students can upsert own lesson progress'
  ) then
    create policy "Students can upsert own lesson progress"
      on public.lesson_progress
      for insert
      to authenticated
      with check (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_progress.student_id
            and students.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_progress'
      and policyname = 'Students can update own lesson progress'
  ) then
    create policy "Students can update own lesson progress"
      on public.lesson_progress
      for update
      to authenticated
      using (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_progress.student_id
            and students.user_id = auth.uid()
        )
      )
      with check (
        app_private.is_admin()
        or exists (
          select 1 from public.students
          where students.id = lesson_progress.student_id
            and students.user_id = auth.uid()
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Students can upload lesson submission files'
  ) then
    create policy "Students can upload lesson submission files"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'lesson-submissions'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Students can read lesson submission files'
  ) then
    create policy "Students can read lesson submission files"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'lesson-submissions'
        and ((storage.foldername(name))[1] = auth.uid()::text or app_private.is_admin())
      );
  end if;
end $$;
