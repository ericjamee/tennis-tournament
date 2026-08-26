create or replace function public.get_tournament_registration_count(p_tournament_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.registrations
  where tournament_id = p_tournament_id
    and status in ('registered', 'confirmed');
$$;

revoke all on function public.get_tournament_registration_count(uuid) from public;
grant execute on function public.get_tournament_registration_count(uuid) to anon, authenticated;
