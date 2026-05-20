create table if not exists public.lesson_storyboards (
  id uuid primary key default gen_random_uuid(),
  generated_lesson_id uuid references public.generated_lessons(id) on delete set null,
  storyboard_json jsonb not null,
  status text not null default 'generated',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_storyboards_generated_lesson_id_idx on public.lesson_storyboards(generated_lesson_id);
create index if not exists lesson_storyboards_created_at_idx on public.lesson_storyboards(created_at desc);

alter table public.lesson_storyboards enable row level security;

grant select, insert, update, delete on public.lesson_storyboards to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_storyboards'
      and policyname = 'Admins can manage lesson storyboards'
  ) then
    create policy "Admins can manage lesson storyboards"
      on public.lesson_storyboards
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;
end $$;
