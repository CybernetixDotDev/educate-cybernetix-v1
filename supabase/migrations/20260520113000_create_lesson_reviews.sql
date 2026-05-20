create table if not exists public.lesson_reviews (
  id uuid primary key default gen_random_uuid(),
  generated_lesson_id uuid references public.generated_lessons(id) on delete cascade,
  storyboard_id uuid references public.lesson_storyboards(id) on delete set null,
  render_id uuid references public.lesson_renders(id) on delete set null,
  status text not null,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lesson_reviews_generated_lesson_id_idx on public.lesson_reviews(generated_lesson_id);
create index if not exists lesson_reviews_status_idx on public.lesson_reviews(status);
create index if not exists lesson_reviews_created_at_idx on public.lesson_reviews(created_at desc);

alter table public.lesson_reviews enable row level security;

grant select, insert, delete on public.lesson_reviews to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_reviews'
      and policyname = 'Admins can manage lesson reviews'
  ) then
    create policy "Admins can manage lesson reviews"
      on public.lesson_reviews
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;
end $$;
