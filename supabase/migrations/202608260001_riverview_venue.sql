update public.tournaments
set
  venue_name = 'Riverview Park',
  venue_address = '4620 N 300 W, Provo, UT 84604',
  venue_confirmed = false,
  schedule = '[
    {"time":"8:00 AM","label":"Check-in and short warm-up"},
    {"time":"8:30 AM","label":"Championship opening round begins"},
    {"time":"10:50 AM","label":"Championship and consolation quarterfinals"},
    {"time":"1:10 PM","label":"Championship and consolation semifinals"},
    {"time":"3:00 PM","label":"Championship and consolation finals"}
  ]'::jsonb,
  updated_at = now()
where slug = 'provo-labor-day-2026';
