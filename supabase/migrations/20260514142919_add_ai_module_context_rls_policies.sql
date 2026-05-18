grant select, insert, update, delete on public.ai_module_context to authenticated;
grant select, insert, update, delete on public.ai_config to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_module_context'
      and policyname = 'Admins can manage AI module context'
  ) then
    create policy "Admins can manage AI module context"
      on public.ai_module_context
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_module_context'
      and policyname = 'Authenticated users can read active AI module context'
  ) then
    create policy "Authenticated users can read active AI module context"
      on public.ai_module_context
      for select
      to authenticated
      using (is_active = true or app_private.is_admin());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_config'
      and policyname = 'Admins can manage AI config'
  ) then
    create policy "Admins can manage AI config"
      on public.ai_config
      for all
      to authenticated
      using (app_private.is_admin())
      with check (app_private.is_admin());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ai_config'
      and policyname = 'Authenticated users can read active AI config'
  ) then
    create policy "Authenticated users can read active AI config"
      on public.ai_config
      for select
      to authenticated
      using (is_active = true or app_private.is_admin());
  end if;
end $$;
