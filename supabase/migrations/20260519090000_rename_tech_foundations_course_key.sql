update public.courses
set course_key = '12-week-tech-foundations-accelerator',
    updated_at = now()
where course_key = 'programming-zero-to-hero';

update public.modules
set metadata = jsonb_set(
    coalesce(metadata, '{}'::jsonb),
    '{course_key}',
    to_jsonb('12-week-tech-foundations-accelerator'::text),
    true
  ),
  updated_at = now()
where metadata->>'course_key' = 'programming-zero-to-hero';
