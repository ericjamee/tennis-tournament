import { getSupabasePublicKey, getSupabaseUrl, TOURNAMENT_SLUG } from "@/lib/supabase-env";

export type Tournament = {
  id: string; slug: string; name: string; subtitle: string; description: string;
  date: string; start_time: string; venue_name: string | null; venue_address: string | null;
  venue_confirmed: boolean; entry_fee: number | null; capacity: number;
  registration_open: boolean; rules: string[]; schedule: { time: string; label: string }[];
  schedule_finalized: boolean; prize_description: string | null; contact_email: string;
  payment_method: "free" | "pay_later" | "external" | "stripe"; payment_instructions: string | null;
  faq: { question: string; answer: string }[];
};

export async function getTournament(): Promise<{ tournament: Tournament; registered: number }> {
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();
  if (!url || !key) throw new Error("Supabase is not configured");

  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, key);
  const { data, error } = await db.from("tournaments").select("*").eq("slug", TOURNAMENT_SLUG).single();
  if (error || !data) throw new Error(`Tournament could not be loaded: ${error?.message ?? "not found"}`);

  const tournament = data as Tournament;
  const { data: count, error: countError } = await db.rpc("get_tournament_registration_count", {
    p_tournament_id: tournament.id,
  });
  if (countError) throw new Error(`Registration count could not be loaded: ${countError.message}`);

  return { tournament, registered: typeof count === "number" ? count : 0 };
}
