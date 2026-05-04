create table if not exists public.student_coaching_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  week_number integer not null check (week_number >= 1 and week_number <= 53),
  coaching_plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_coaching_plans_student_week_unique unique (student_id, week_number)
);

create index if not exists student_coaching_plans_student_id_idx
  on public.student_coaching_plans(student_id);

alter table public.student_coaching_plans enable row level security;

grant select, insert, update, delete on public.student_coaching_plans to authenticated;

create policy "Authenticated users can manage student coaching plans"
  on public.student_coaching_plans
  for all
  to authenticated
  using (true)
  with check (true);
