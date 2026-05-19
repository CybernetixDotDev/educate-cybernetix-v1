create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_key text not null unique,
  title text not null,
  description text,
  category text not null default 'programming',
  target_audience text not null default 'teens',
  duration_weeks integer,
  difficulty_level text not null default 'beginner',
  thumbnail_url text,
  is_published boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.modules
  add column if not exists course_id uuid references public.courses(id) on delete set null,
  add column if not exists module_key text unique,
  add column if not exists week_number integer,
  add column if not exists is_published boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists courses_order_index_idx on public.courses(order_index);
create index if not exists courses_category_idx on public.courses(category);
create index if not exists modules_course_order_idx on public.modules(course_id, order_index);
create index if not exists modules_module_key_idx on public.modules(module_key);

alter table public.courses enable row level security;

grant select, insert, update, delete on public.courses to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'courses' and policyname = 'Admins can manage courses') then
    create policy "Admins can manage courses"
      on public.courses
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'courses' and policyname = 'Authenticated users can read published courses') then
    create policy "Authenticated users can read published courses"
      on public.courses
      for select
      to authenticated
      using (is_published = true or app_private.is_admin());
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'modules' and policyname = 'Authenticated users can read published course modules') then
    create policy "Authenticated users can read published course modules"
      on public.modules
      for select
      to authenticated
      using (
        app_private.is_admin()
        or (
          is_published = true
          and exists (
            select 1
            from public.courses
            where courses.id = modules.course_id
              and courses.is_published = true
          )
        )
      );
  end if;
end $$;

insert into public.courses (
  id,
  course_key,
  title,
  description,
  category,
  target_audience,
  duration_weeks,
  difficulty_level,
  is_published,
  metadata,
  order_index
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '12-week-tech-foundations-accelerator',
    '12-Week Tech-Foundations Accelerator',
    'A 12-week teen-friendly path from web foundations to a deployed project presentation.',
    'programming',
    'teens',
    12,
    'beginner',
    true,
    '{"skills":["html","css","javascript","nextjs","apis","supabase","threejs","project_management"],"course_type":"core"}'::jsonb,
    1
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'blockchain-foundations',
    'Blockchain Foundations',
    'A future course for understanding wallets, smart contracts, tokens, and responsible Web3 building.',
    'blockchain',
    'teens',
    8,
    'beginner',
    false,
    '{"course_type":"future"}'::jsonb,
    2
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    'trading-investing-basics',
    'Trading and Investing Basics',
    'A future course for financial literacy, risk, long-term investing, and market basics.',
    'finance',
    'teens',
    8,
    'beginner',
    false,
    '{"course_type":"future"}'::jsonb,
    3
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    'content-creation-studio',
    'Content Creation Studio',
    'A future course for planning, producing, editing, and publishing useful digital content.',
    'content_creation',
    'teens',
    8,
    'beginner',
    false,
    '{"course_type":"future"}'::jsonb,
    4
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5',
    'marketing-for-young-builders',
    'Marketing for Young Builders',
    'A future course for positioning, audience research, campaigns, and ethical growth.',
    'marketing',
    'teens',
    8,
    'beginner',
    false,
    '{"course_type":"future"}'::jsonb,
    5
  )
on conflict (course_key) do update
set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  target_audience = excluded.target_audience,
  duration_weeks = excluded.duration_weeks,
  difficulty_level = excluded.difficulty_level,
  metadata = excluded.metadata,
  order_index = excluded.order_index,
  updated_at = now();

insert into public.modules (module_key, course_id, title, description, order_index, week_number, is_published, metadata)
values
  ('week1-internet-html-css', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Internet, HTML, and CSS', 'Foundations of the web: networks, pages, HTML structure, and CSS styling.', 1, 1, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week2-tailwind-uiux', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Tailwind and UI/UX', 'Design clean responsive interfaces with utility CSS and user-centered thinking.', 2, 2, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week3-git-github-terminal', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Git, GitHub, and Terminal', 'Use professional developer workflows for version control and command-line work.', 3, 3, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week4-javascript-fundamentals', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'JavaScript Fundamentals', 'Learn variables, functions, arrays, objects, events, and problem-solving patterns.', 4, 4, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week5-nextjs-fundamentals', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Next.js Fundamentals', 'Build modern React apps with routes, components, rendering, and data flow.', 5, 5, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week6-apis-datafetching', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'APIs and Data Fetching', 'Connect apps to external data and handle loading, errors, and response shapes.', 6, 6, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week7-supabase-database-auth', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Supabase Database and Auth', 'Add database-backed features, authentication, and secure user data.', 7, 7, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week8-threejs-fundamentals', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Three.js Fundamentals', 'Create interactive 3D scenes and visual product experiences.', 8, 8, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week9-project-planning', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Project Planning', 'Choose an MVP, define user stories, plan milestones, and prepare a build strategy.', 9, 9, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week10-build-phase-1', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Build Phase 1', 'Start implementation, wire core features, and build a usable first version.', 10, 10, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week11-build-phase-2', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Build Phase 2', 'Improve quality, fix bugs, polish UX, and prepare the project for demo.', 11, 11, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb),
  ('week12-deploy-present', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Deploy and Present', 'Deploy the finished project and prepare a confident presentation.', 12, 12, true, '{"course_key":"12-week-tech-foundations-accelerator"}'::jsonb)
on conflict (module_key) do update
set
  course_id = excluded.course_id,
  title = excluded.title,
  description = excluded.description,
  order_index = excluded.order_index,
  week_number = excluded.week_number,
  is_published = excluded.is_published,
  metadata = excluded.metadata,
  updated_at = now();
