create or replace function public.register_for_tournament(p_tournament_id uuid, p_registration jsonb)
returns table(id uuid, status text, waitlist_position int)
language plpgsql security definer set search_path = public as $$
declare
  t public.tournaments;
  registered_count int;
  new_status text;
  new_id uuid;
  new_position int;
begin
  select * into t from public.tournaments where tournaments.id = p_tournament_id for update;
  if not found then raise exception 'tournament_not_found'; end if;

  update public.registrations as r
  set status = 'withdrawn'
  where r.tournament_id = p_tournament_id
    and r.status = 'pending_payment'
    and r.created_at <= now() - interval '30 minutes';

  if exists(
    select 1 from public.registrations r
    where r.tournament_id = p_tournament_id
      and lower(r.email) = lower(p_registration->>'email')
      and r.status <> 'withdrawn'
  ) then raise exception 'duplicate_registration'; end if;

  select count(*) into registered_count from public.registrations r
  where r.tournament_id = p_tournament_id
    and (
      r.status in ('registered', 'confirmed')
      or (r.status = 'pending_payment' and r.created_at > now() - interval '30 minutes')
    );

  if t.registration_open and registered_count < t.capacity then
    new_status := case when t.payment_method = 'stripe' then 'pending_payment' else 'registered' end;
    new_position := null;
  else
    new_status := 'waitlisted';
    select count(*) + 1 into new_position from public.registrations r
    where r.tournament_id = p_tournament_id and r.status = 'waitlisted';
  end if;

  insert into public.registrations(
    tournament_id, first_name, last_name, email, phone, age, self_rating, ntrp, utr,
    years_playing, experience, preferred_division, notes, status, waitlist_position,
    waiver_accepted, rules_accepted, checkout_cancel_token
  ) values (
    p_tournament_id, p_registration->>'first_name', p_registration->>'last_name',
    lower(p_registration->>'email'), p_registration->>'phone', (p_registration->>'age')::int,
    p_registration->>'self_rating', nullif(p_registration->>'ntrp',''), nullif(p_registration->>'utr',''),
    nullif(p_registration->>'years_playing','')::int, nullif(p_registration->>'experience',''),
    nullif(p_registration->>'preferred_division',''), nullif(p_registration->>'notes',''),
    new_status, new_position, true, true, nullif(p_registration->>'checkout_cancel_token','')
  ) returning registrations.id into new_id;

  return query select new_id, new_status, new_position;
end
$$;

revoke all on function public.register_for_tournament(uuid, jsonb) from public;
grant execute on function public.register_for_tournament(uuid, jsonb) to service_role;
