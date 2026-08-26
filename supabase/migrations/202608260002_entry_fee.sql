update public.tournaments
set
  entry_fee = 35,
  faq = (
    select coalesce(jsonb_agg(item), '[]'::jsonb)
    from jsonb_array_elements(faq) as item
    where item->>'question' <> 'What does the $35 entry fee cover?'
  ) || jsonb_build_array(
    jsonb_build_object(
      'question', 'What does the $35 entry fee cover?',
      'answer', 'The $35 fee helps players commit to showing up and covers event costs; it is not intended to make a profit. The tournament is budgeted at roughly $600: about $200 for court rental, plus required event insurance, fresh tennis balls, prizes, and basic supplies. Even a full 16-player field brings in only $560.'
    )
  ),
  updated_at = now()
where slug = 'provo-labor-day-2026';
