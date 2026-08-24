create table if not exists public.organizers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.organizers enable row level security;

drop policy if exists "organizers see themselves" on public.organizers;
create policy "organizers see themselves" on public.organizers
for select to authenticated using (user_id = auth.uid());

drop policy if exists "admins manage tournaments" on public.tournaments;
create policy "organizers manage tournaments" on public.tournaments
for all to authenticated
using (exists(select 1 from public.organizers where user_id = auth.uid()))
with check (exists(select 1 from public.organizers where user_id = auth.uid()));

drop policy if exists "admins read registrations" on public.registrations;
drop policy if exists "admins manage registrations" on public.registrations;
create policy "organizers read registrations" on public.registrations
for select to authenticated
using (exists(select 1 from public.organizers where user_id = auth.uid()));
create policy "organizers manage registrations" on public.registrations
for all to authenticated
using (exists(select 1 from public.organizers where user_id = auth.uid()))
with check (exists(select 1 from public.organizers where user_id = auth.uid()));

create or replace function public.is_organizer()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organizers where user_id = auth.uid());
$$;
revoke all on function public.is_organizer() from public;
grant execute on function public.is_organizer() to authenticated;

create or replace function public.resequence_waitlist(p_tournament_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_organizer() then raise exception 'unauthorized'; end if;
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
  if not public.is_organizer() then raise exception 'unauthorized'; end if;
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
  if not public.is_organizer() then raise exception 'unauthorized'; end if;
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
