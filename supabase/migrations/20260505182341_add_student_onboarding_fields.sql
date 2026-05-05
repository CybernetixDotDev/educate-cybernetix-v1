alter table public.students
  add column if not exists project_preference text,
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

create index if not exists students_onboarding_complete_idx
  on public.students(onboarding_complete);
