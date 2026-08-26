alter table public.registrations drop constraint if exists registrations_status_check;
alter table public.registrations add constraint registrations_status_check
  check (status in ('pending_payment', 'registered', 'waitlisted', 'withdrawn', 'confirmed'));

alter table public.registrations add column if not exists stripe_checkout_session_id text;
alter table public.registrations add column if not exists stripe_payment_intent_id text;
alter table public.registrations add column if not exists checkout_cancel_token text;
alter table public.registrations add column if not exists amount_paid int;
alter table public.registrations add column if not exists paid_at timestamptz;

create unique index if not exists registrations_stripe_checkout_session_unique
  on public.registrations(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create or replace function public.get_tournament_registration_count(p_tournament_id uuid)
returns int language sql stable security definer set search_path = public as $$
  select count(*)::int from public.registrations
  where tournament_id = p_tournament_id
    and status in ('registered', 'confirmed');
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

create or replace function public.complete_registration_payment(
  p_registration_id uuid,
  p_tournament_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_amount_paid int
) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  target public.registrations;
begin
  select * into target from public.registrations where id = p_registration_id for update;
  if not found then raise exception 'registration_not_found'; end if;
  if target.tournament_id <> p_tournament_id then raise exception 'tournament_mismatch'; end if;
  if p_amount_paid <> 3500 then raise exception 'amount_mismatch'; end if;

  if target.status in ('registered', 'confirmed')
    and target.stripe_checkout_session_id = p_checkout_session_id
    and target.paid_at is not null then
    return false;
  end if;

  if target.status <> 'pending_payment' then raise exception 'registration_not_pending'; end if;
  if target.stripe_checkout_session_id <> p_checkout_session_id then raise exception 'checkout_session_mismatch'; end if;

  update public.registrations set
    status = 'registered',
    stripe_payment_intent_id = p_payment_intent_id,
    amount_paid = p_amount_paid,
    paid_at = now(),
    checkout_cancel_token = null
  where id = p_registration_id;
  return true;
end
$$;
revoke all on function public.complete_registration_payment(uuid, uuid, text, text, int) from public;
grant execute on function public.complete_registration_payment(uuid, uuid, text, text, int) to service_role;

update public.tournaments set
  entry_fee = 35,
  payment_method = 'stripe',
  payment_instructions = 'Registration is confirmed after secure payment through Stripe.',
  refund_policy = 'Entry fees are refundable if the tournament is canceled. Contact the organizer about player cancellations; refunds may depend on whether the spot can be filled.',
  faq = (
    select jsonb_agg(
      case when item->>'question' = 'Can I get a refund?'
        then jsonb_build_object(
          'question', 'Can I get a refund?',
          'answer', 'If the tournament is canceled, entry fees will be refunded. If you need to withdraw, contact the organizer as soon as possible; a refund may depend on whether your spot can be filled from the waitlist.'
        )
        else item end
    )
    from jsonb_array_elements(faq) as item
  ),
  updated_at = now()
where slug = 'provo-labor-day-2026';
