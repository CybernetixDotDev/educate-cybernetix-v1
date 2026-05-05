create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  order_index integer not null default 0,
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  version_number integer not null,
  content_json jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint lesson_versions_lesson_version_unique unique (lesson_id, version_number)
);

alter table public.lessons
  add constraint lessons_current_version_id_fkey
  foreign key (current_version_id)
  references public.lesson_versions(id)
  on delete set null;

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quizzes_lesson_id_unique unique (lesson_id)
);

create table if not exists public.quiz_versions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  version_number integer not null,
  content_json jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint quiz_versions_quiz_version_unique unique (quiz_id, version_number)
);

alter table public.quizzes
  add constraint quizzes_current_version_id_fkey
  foreign key (current_version_id)
  references public.quiz_versions(id)
  on delete set null;

create index if not exists modules_order_index_idx on public.modules(order_index);
create index if not exists lessons_module_order_idx on public.lessons(module_id, order_index);
create index if not exists lesson_versions_lesson_id_idx on public.lesson_versions(lesson_id);
create index if not exists quizzes_lesson_id_idx on public.quizzes(lesson_id);
create index if not exists quiz_versions_quiz_id_idx on public.quiz_versions(quiz_id);

alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_versions enable row level security;

grant select, insert, update, delete on public.modules to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert on public.lesson_versions to authenticated;
grant select, insert, update, delete on public.quizzes to authenticated;
grant select, insert on public.quiz_versions to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'modules' and policyname = 'Admins can manage modules') then
    create policy "Admins can manage modules"
      on public.modules
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lessons' and policyname = 'Admins can manage lessons') then
    create policy "Admins can manage lessons"
      on public.lessons
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lesson_versions' and policyname = 'Admins can read and create lesson versions') then
    create policy "Admins can read and create lesson versions"
      on public.lesson_versions
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quizzes' and policyname = 'Admins can manage quizzes') then
    create policy "Admins can manage quizzes"
      on public.quizzes
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_versions' and policyname = 'Admins can read and create quiz versions') then
    create policy "Admins can read and create quiz versions"
      on public.quiz_versions
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;
end $$;
