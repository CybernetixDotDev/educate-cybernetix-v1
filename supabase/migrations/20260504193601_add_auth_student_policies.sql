grant select, insert, update on public.students to authenticated;

create policy "Students can read their own profile"
  on public.students
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Students can create their own profile"
  on public.students
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Students can update their own profile"
  on public.students
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
