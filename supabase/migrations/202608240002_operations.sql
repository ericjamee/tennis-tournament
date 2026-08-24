alter table public.registrations add column if not exists waitlist_position int;

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end
$$;

drop trigger if exists tournaments_set_updated_at on public.tournaments;
create trigger tournaments_set_updated_at before update on public.tournaments
for each row execute function public.set_updated_at();
drop trigger if exists registrations_set_updated_at on public.registrations;
create trigger registrations_set_updated_at before update on public.registrations
for each row execute function public.set_updated_at();

create or replace function public.get_tournament_registration_count(p_tournament_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.registrations
  where tournament_id = p_tournament_id and status in ('registered', 'confirmed');
$$;
revoke all on function public.get_tournament_registration_count(uuid) from public;
grant execute on function public.get_tournament_registration_count(uuid) to anon, authenticated;

drop function if exists public.register_for_tournament(uuid, jsonb);
create function public.register_for_tournament(p_tournament_id uuid, p_registration jsonb)
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

  if exists(select 1 from public.registrations r where r.tournament_id = p_tournament_id and lower(r.email) = lower(p_registration->>'email') and r.status <> 'withdrawn') then
    raise exception 'duplicate_registration';
  end if;

  select count(*) into registered_count from public.registrations r
  where r.tournament_id = p_tournament_id and r.status in ('registered', 'confirmed');

  if t.registration_open and registered_count < t.capacity then
    new_status := 'registered';
    new_position := null;
  else
    new_status := 'waitlisted';
    select count(*) + 1 into new_position from public.registrations r
    where r.tournament_id = p_tournament_id and r.status = 'waitlisted';
  end if;

  insert into public.registrations(
    tournament_id, first_name, last_name, email, phone, age, self_rating, ntrp, utr,
    years_playing, experience, preferred_division, notes, status, waitlist_position,
    waiver_accepted, rules_accepted
  ) values (
    p_tournament_id, p_registration->>'first_name', p_registration->>'last_name',
    lower(p_registration->>'email'), p_registration->>'phone', (p_registration->>'age')::int,
    p_registration->>'self_rating', nullif(p_registration->>'ntrp',''), nullif(p_registration->>'utr',''),
    nullif(p_registration->>'years_playing','')::int, nullif(p_registration->>'experience',''),
    nullif(p_registration->>'preferred_division',''), nullif(p_registration->>'notes',''),
    new_status, new_position, true, true
  ) returning registrations.id into new_id;

  return query select new_id, new_status, new_position;
end
$$;
revoke all on function public.register_for_tournament(uuid, jsonb) from public;
grant execute on function public.register_for_tournament(uuid, jsonb) to service_role;

create or replace function public.resequence_waitlist(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  with ranked as (
    select id, row_number() over(order by created_at, id)::int as position
    from public.registrations
    where tournament_id = p_tournament_id and status = 'waitlisted'
  )
  update public.registrations r set waitlist_position = ranked.position
  from ranked where r.id = ranked.id;
end
$$;
revoke all on function public.resequence_waitlist(uuid) from public;
grant execute on function public.resequence_waitlist(uuid) to authenticated;

create or replace function public.promote_waitlisted_registration(p_registration_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  target public.registrations;
  t public.tournaments;
  registered_count int;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select * into target from public.registrations where id = p_registration_id for update;
  if not found or target.status <> 'waitlisted' then raise exception 'registration_not_waitlisted'; end if;
  select * into t from public.tournaments where id = target.tournament_id for update;
  select count(*) into registered_count from public.registrations
  where tournament_id = target.tournament_id and status in ('registered', 'confirmed');
  if registered_count >= t.capacity then raise exception 'tournament_full'; end if;

  update public.registrations set status = 'registered', waitlist_position = null where id = target.id;
  perform public.resequence_waitlist(target.tournament_id);
end
$$;
revoke all on function public.promote_waitlisted_registration(uuid) from public;
grant execute on function public.promote_waitlisted_registration(uuid) to authenticated;

create or replace function public.restore_withdrawn_registration(p_registration_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  target public.registrations;
  t public.tournaments;
  registered_count int;
  restored_status text;
  restored_position int;
begin
  if auth.uid() is null then raise exception 'unauthorized'; end if;
  select * into target from public.registrations where id = p_registration_id for update;
  if not found or target.status <> 'withdrawn' then raise exception 'registration_not_withdrawn'; end if;
  select * into t from public.tournaments where id = target.tournament_id for update;
  select count(*) into registered_count from public.registrations
  where tournament_id = target.tournament_id and status in ('registered', 'confirmed');
  if t.registration_open and registered_count < t.capacity then
    restored_status := 'registered'; restored_position := null;
  else
    restored_status := 'waitlisted';
    select count(*) + 1 into restored_position from public.registrations
    where tournament_id = target.tournament_id and status = 'waitlisted';
  end if;
  update public.registrations set status = restored_status, waitlist_position = restored_position where id = target.id;
  return restored_status;
end
$$;
revoke all on function public.restore_withdrawn_registration(uuid) from public;
grant execute on function public.restore_withdrawn_registration(uuid) to authenticated;

with ranked as (
  select id, row_number() over(partition by tournament_id order by created_at, id)::int as position
  from public.registrations where status = 'waitlisted'
)
update public.registrations r set waitlist_position = ranked.position from ranked where r.id = ranked.id;

update public.tournaments set
  rain_policy = coalesce(rain_policy, 'If weather makes play unsafe, the organizer will email a delay, reschedule, or cancellation plan.'),
  refund_policy = coalesce(refund_policy, 'The final refund policy will be shared before payment is collected.'),
  faq = case when jsonb_array_length(faq) = 0 then '[
    {"question":"Who can play?","answer":"Recreational through competitive adult players are welcome. This first event is intentionally small and community-focused."},
    {"question":"What level should I be?","answer":"If you can serve, rally, and keep score, you’ll fit in. Share your level when registering so we can seed thoughtfully."},
    {"question":"What is the match format?","answer":"Fast, timed matches in four short quarters. Every point counts and one serve keeps play moving."},
    {"question":"What happens if it rains?","answer":"We’ll communicate a reschedule or refund plan by email if weather makes play unsafe."},
    {"question":"What should I bring?","answer":"A racquet, water, court shoes, sunscreen, and your competitive spirit. We’ll provide fresh balls."},
    {"question":"Can I get a refund?","answer":"The final refund policy will be shared before payment is collected."},
    {"question":"How will I receive my match time?","answer":"Match times and final event details will be sent to your registration email."},
    {"question":"Is this an official UTS event?","answer":"No. This tournament is inspired by the UTS format and is not affiliated with UTS."}
  ]'::jsonb else faq end
where slug = 'provo-labor-day-2026';
