create table if not exists public.lesson_renders (
  id uuid primary key default gen_random_uuid(),
  storyboard_id uuid references public.lesson_storyboards(id) on delete set null,
  generated_lesson_id uuid references public.generated_lessons(id) on delete set null,
  status text not null default 'queued',
  render_json jsonb not null default '{}'::jsonb,
  mp4_url text,
  thumbnail_url text,
  captions_vtt_url text,
  captions_srt_url text,
  transcript_url text,
  manifest_url text,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lesson_renders_storyboard_id_idx on public.lesson_renders(storyboard_id);
create index if not exists lesson_renders_generated_lesson_id_idx on public.lesson_renders(generated_lesson_id);
create index if not exists lesson_renders_status_idx on public.lesson_renders(status);
create index if not exists lesson_renders_created_at_idx on public.lesson_renders(created_at desc);

alter table public.lesson_renders enable row level security;

grant select, insert, update, delete on public.lesson_renders to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-renders',
  'lesson-renders',
  true,
  524288000,
  array[
    'application/json',
    'text/plain',
    'text/vtt',
    'image/svg+xml',
    'image/png',
    'image/jpeg',
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'video/mp4'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'lesson_renders'
      and policyname = 'Admins can manage lesson renders'
  ) then
    create policy "Admins can manage lesson renders"
      on public.lesson_renders
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read lesson render assets'
  ) then
    create policy "Public can read lesson render assets"
      on storage.objects
      for select
      to anon, authenticated
      using (bucket_id = 'lesson-renders');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can insert lesson render assets'
  ) then
    create policy "Admins can insert lesson render assets"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'lesson-renders' and app_private.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can update lesson render assets'
  ) then
    create policy "Admins can update lesson render assets"
      on storage.objects
      for update
      to authenticated
      using (bucket_id = 'lesson-renders' and app_private.is_admin())
      with check (bucket_id = 'lesson-renders' and app_private.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Admins can delete lesson render assets'
  ) then
    create policy "Admins can delete lesson render assets"
      on storage.objects
      for delete
      to authenticated
      using (bucket_id = 'lesson-renders' and app_private.is_admin());
  end if;
end $$;
