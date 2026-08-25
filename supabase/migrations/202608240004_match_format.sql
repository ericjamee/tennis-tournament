update public.tournaments
set
  rules = '[
    "Singles",
    "16-player championship draw with a first-round consolation draw",
    "Every player is scheduled for at least two matches, barring weather or withdrawals",
    "Four 6-minute quarters",
    "Every rally counts as one point",
    "One serve per point; players alternate serving every two points",
    "Finish the point underway when time expires; the leader wins the quarter",
    "If the quarter is tied at the buzzer, one deciding point determines the quarter",
    "First player to win three quarters wins the match",
    "At 2–2, the first player to win two consecutive points wins sudden death",
    "After a player''s second loss, their tournament is complete"
  ]'::jsonb,
  schedule = '[
    {"time":"8:00 AM","label":"Check-in and short warm-up"},
    {"time":"Morning","label":"Championship opening round"},
    {"time":"Midday","label":"Championship and consolation rounds"},
    {"time":"Afternoon","label":"Semifinals and placement matches"},
    {"time":"Late afternoon","label":"Championship and consolation finals"}
  ]'::jsonb,
  faq = '[
    {"question":"Who can play?","answer":"Recreational through competitive adult players are welcome. This first event is intentionally small and community-focused."},
    {"question":"What level should I be?","answer":"If you can serve, rally, and keep score, you’ll fit in. Share your level when registering so we can seed thoughtfully."},
    {"question":"How does a match work?","answer":"Each match has four 6-minute quarters. Every rally is one point, you get one serve, and players alternate serving every two points. Win three quarters to win the match."},
    {"question":"What happens when a quarter ends?","answer":"Finish the point underway when the timer expires. The leader wins the quarter. If the score is tied, play one deciding point."},
    {"question":"What happens at 2–2?","answer":"The match goes to sudden death. The first player to win two consecutive points wins the match."},
    {"question":"Am I guaranteed more than one match?","answer":"Yes. Every player is scheduled for at least two matches, barring weather or withdrawals. A first-round loss moves you into the consolation draw; after your second loss, your tournament is complete."},
    {"question":"How long will the tournament take?","answer":"Plan for a full day. The format includes 22 matches and is designed around two courts. Exact player start times and the order of play will be sent after the venue is confirmed."},
    {"question":"What happens if it rains?","answer":"We’ll communicate a reschedule or refund plan by email if weather makes play unsafe."},
    {"question":"What should I bring?","answer":"A racquet, water, court shoes, sunscreen, and your competitive spirit. We’ll provide fresh balls."},
    {"question":"Can I get a refund?","answer":"The final refund policy will be shared before payment is collected."},
    {"question":"How will I receive my match time?","answer":"Match times and final event details will be sent to your registration email."},
    {"question":"Is this an official UTS event?","answer":"No. This tournament uses a simplified, UTS-inspired format and is not affiliated with UTS."}
  ]'::jsonb,
  updated_at = now()
where slug = 'provo-labor-day-2026';
