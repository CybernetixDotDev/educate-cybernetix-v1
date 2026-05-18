alter table public.lessons
  add column if not exists lesson_key text;

update public.lessons
set lesson_key = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
where lesson_key is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lessons_module_lesson_key_unique'
      and conrelid = 'public.lessons'::regclass
  ) then
    alter table public.lessons
      add constraint lessons_module_lesson_key_unique
      unique (module_id, lesson_key);
  end if;
end $$;

create index if not exists lessons_lesson_key_idx on public.lessons(lesson_key);
