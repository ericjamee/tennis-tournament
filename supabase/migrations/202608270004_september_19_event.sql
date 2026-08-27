update public.tournaments
set
  name = 'Provo Tennis Tournament',
  date = '2026-09-19',
  updated_at = now()
where slug = 'provo-labor-day-2026';
