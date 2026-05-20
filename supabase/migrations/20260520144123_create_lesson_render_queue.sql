create table if not exists public.lesson_render_queue (
  id uuid primary key default gen_random_uuid(),
  render_id uuid not null references public.lesson_renders(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  started_at timestamptz,
  completed_at timestamptz,
  last_error text,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists lesson_render_queue_active_render_unique
  on public.lesson_render_queue(render_id)
  where status in ('pending', 'processing');

create index if not exists lesson_render_queue_pending_idx
  on public.lesson_render_queue(status, run_after, created_at);

create index if not exists lesson_render_queue_render_id_idx
  on public.lesson_render_queue(render_id);

alter table public.lesson_render_queue enable row level security;

grant select, insert, update, delete on public.lesson_render_queue to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_render_queue'
      and policyname = 'Admins can manage lesson render queue'
  ) then
    create policy "Admins can manage lesson render queue"
      on public.lesson_render_queue
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;
end $$;
