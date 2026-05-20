create table if not exists public.lesson_blueprints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brief_json jsonb not null,
  status text not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_lessons (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid references public.lesson_blueprints(id) on delete set null,
  generated_json jsonb not null,
  status text not null default 'generated',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_blueprints_created_by_idx on public.lesson_blueprints(created_by);
create index if not exists lesson_blueprints_updated_at_idx on public.lesson_blueprints(updated_at desc);
create index if not exists generated_lessons_blueprint_id_idx on public.generated_lessons(blueprint_id);
create index if not exists generated_lessons_created_at_idx on public.generated_lessons(created_at desc);

alter table public.lesson_blueprints enable row level security;
alter table public.generated_lessons enable row level security;

grant select, insert, update, delete on public.lesson_blueprints to authenticated;
grant select, insert, update, delete on public.generated_lessons to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_blueprints'
      and policyname = 'Admins can manage lesson blueprints'
  ) then
    create policy "Admins can manage lesson blueprints"
      on public.lesson_blueprints
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'generated_lessons'
      and policyname = 'Admins can manage generated lessons'
  ) then
    create policy "Admins can manage generated lessons"
      on public.generated_lessons
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;
end $$;
