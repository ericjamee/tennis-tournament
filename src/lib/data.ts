export type Tournament = {
  id: string; slug: string; name: string; subtitle: string; description: string;
  date: string; start_time: string; venue_name: string | null; venue_address: string | null;
  venue_confirmed: boolean; entry_fee: number | null; capacity: number;
  registration_open: boolean; rules: string[]; schedule: { time: string; label: string }[];
  schedule_finalized: boolean; prize_description: string | null; contact_email: string;
  payment_method: "free" | "pay_later" | "external" | "stripe"; payment_instructions: string | null;
  faq: { question: string; answer: string }[];
};
export const fallbackTournament: Tournament = {
  id: "00000000-0000-0000-0000-000000000001", slug: "provo-labor-day-2026",
  name: "Provo Labor Day Tennis Tournament", subtitle: "Fast matches. Competitive tennis. A great day on the courts.",
  description: "Fast-paced community tennis is coming to Provo. We’re starting small with 16 players, a fun competitive format, scheduled matches, and a great day of tennis.",
  date: "2026-09-07", start_time: "08:00", venue_name: null, venue_address: "Provo, Utah", venue_confirmed: false,
  entry_fee: null, capacity: 16, registration_open: true,
  rules: ["Singles", "16-player field", "Fast timed matches", "Four short quarters", "One serve", "Every point counts", "First player to win three quarters wins the match", "Sudden-death deciding quarter when necessary"],
  schedule: [{ time: "8:00 AM", label: "Tournament begins" }, { time: "Morning", label: "Opening matches" }, { time: "Afternoon", label: "Knockout rounds" }, { time: "Late afternoon", label: "Championship" }],
  schedule_finalized: false, prize_description: null, contact_email: "hello@provotennis.com", payment_method: "pay_later",
  payment_instructions: "Payment instructions will be sent once tournament details are finalized.",
  faq: [
    { question: "Who can play?", answer: "Recreational through competitive adult players are welcome. This first event is intentionally small and community-focused." },
    { question: "What level should I be?", answer: "If you can serve, rally, and keep score, you’ll fit in. Share your level when registering so we can seed thoughtfully." },
    { question: "What is the match format?", answer: "Fast, timed matches in four short quarters. Every point counts and one serve keeps play moving." },
    { question: "What happens if it rains?", answer: "We’ll communicate a reschedule or refund plan by email if weather makes play unsafe." },
    { question: "What should I bring?", answer: "A racquet, water, court shoes, sunscreen, and your competitive spirit. We’ll provide fresh balls." },
    { question: "Can I get a refund?", answer: "The final refund policy will be shared before payment is collected." },
    { question: "How will I receive my match time?", answer: "Match times and final event details will be sent to your registration email." },
    { question: "Is this an official UTS event?", answer: "No. This tournament is inspired by the UTS format and is not affiliated with UTS." },
  ],
};
export async function getTournament(): Promise<{ tournament: Tournament; registered: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return { tournament: fallbackTournament, registered: 5 };
  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data } = await db.from("tournaments").select("*").eq("slug", fallbackTournament.slug).single();
  const tournament = (data as Tournament) ?? fallbackTournament;
  const { count } = await db.from("registrations").select("id", { count: "exact", head: true }).eq("tournament_id", tournament.id).in("status", ["registered", "confirmed"]);
  return { tournament, registered: count ?? 0 };
}
