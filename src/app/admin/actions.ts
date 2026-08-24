"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOrganizer } from "@/lib/admin";
import { createSupabaseServer } from "@/lib/supabase-server";

const tournamentSchema = z.object({
  id: z.uuid(), name: z.string().trim().min(3).max(160), subtitle: z.string().trim().max(240),
  description: z.string().trim().max(2000), date: z.iso.date(), start_time: z.string().regex(/^\d{2}:\d{2}$/),
  venue_name: z.string().trim().max(160), venue_address: z.string().trim().max(300), contact_email: z.email(),
  capacity: z.coerce.number().int().min(2).max(256), entry_fee: z.string().trim(),
  prize_description: z.string().trim().max(1000), rain_policy: z.string().trim().max(2000),
  refund_policy: z.string().trim().max(2000), rules: z.string().max(5000), schedule: z.string().max(5000), faq: z.string().max(10000),
});

function lines(value: string) { return value.split("\n").map((line) => line.trim()).filter(Boolean); }
function pairs(value: string, first: string, second: string) {
  return lines(value).map((line) => {
    const separator = line.indexOf("|");
    if (separator < 1 || separator === line.length - 1) throw new Error("Each paired line needs a | separator");
    return { [first]: line.slice(0, separator).trim(), [second]: line.slice(separator + 1).trim() };
  });
}
function adminRedirect(message: string, kind: "message" | "error" = "message"): never { redirect(`/admin?${kind}=${encodeURIComponent(message)}`); }

export async function login(formData: FormData) {
  const db = await createSupabaseServer();
  const { error } = await db.auth.signInWithPassword({ email: String(formData.get("email")), password: String(formData.get("password")) });
  if (error) adminRedirect("Email or password is incorrect", "error");
  redirect("/admin");
}

export async function logout() { const db = await createSupabaseServer(); await db.auth.signOut(); redirect("/admin"); }

export async function updateTournament(formData: FormData) {
  const { db } = await requireOrganizer();
  const parsed = tournamentSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) adminRedirect(parsed.error.issues[0]?.message ?? "Check the tournament settings", "error");
  try {
    const schedule = pairs(parsed.data.schedule, "time", "label");
    const faq = pairs(parsed.data.faq, "question", "answer");
    const entryFee = parsed.data.entry_fee === "" ? null : Number(parsed.data.entry_fee);
    if (entryFee !== null && (!Number.isFinite(entryFee) || entryFee < 0)) throw new Error("Entry fee must be a positive number");
    const registrationOpen = formData.getAll("registration_open").includes("true");
    const { error } = await db.from("tournaments").update({
      name: parsed.data.name, subtitle: parsed.data.subtitle, description: parsed.data.description,
      date: parsed.data.date, start_time: parsed.data.start_time, venue_name: parsed.data.venue_name || null,
      venue_address: parsed.data.venue_address || null, venue_confirmed: formData.getAll("venue_confirmed").includes("true"),
      contact_email: parsed.data.contact_email, capacity: parsed.data.capacity, entry_fee: entryFee,
      registration_open: registrationOpen, schedule_finalized: formData.getAll("schedule_finalized").includes("true"),
      prize_description: parsed.data.prize_description || null, rain_policy: parsed.data.rain_policy || null,
      refund_policy: parsed.data.refund_policy || null, rules: lines(parsed.data.rules), schedule, faq,
      status: registrationOpen ? "registration_open" : "registration_closed",
    }).eq("id", parsed.data.id);
    if (error) throw error;
  } catch (error) { adminRedirect(error instanceof Error ? error.message : "Could not save tournament settings", "error"); }
  revalidatePath("/"); revalidatePath("/register"); revalidatePath("/admin");
  adminRedirect("Tournament settings saved");
}

export async function updateRegistration(formData: FormData) {
  const { db } = await requireOrganizer();
  const id = z.uuid().parse(formData.get("id"));
  const tournamentId = z.uuid().parse(formData.get("tournament_id"));
  const intent = z.enum(["save_seed", "confirm", "withdraw", "restore", "mark_registered", "promote"]).parse(formData.get("intent"));
  let error: { message: string } | null = null;
  if (intent === "promote") ({ error } = await db.rpc("promote_waitlisted_registration", { p_registration_id: id }));
  else if (intent === "restore") ({ error } = await db.rpc("restore_withdrawn_registration", { p_registration_id: id }));
  else if (intent === "save_seed") {
    const rawSeed = String(formData.get("seed") ?? "").trim();
    const seed = rawSeed ? z.coerce.number().int().min(1).max(256).parse(rawSeed) : null;
    ({ error } = await db.from("registrations").update({ seed }).eq("id", id));
  } else {
    const status = intent === "confirm" ? "confirmed" : intent === "withdraw" ? "withdrawn" : "registered";
    ({ error } = await db.from("registrations").update({ status, waitlist_position: null }).eq("id", id));
    if (!error) await db.rpc("resequence_waitlist", { p_tournament_id: tournamentId });
  }
  if (error) adminRedirect(error.message.includes("tournament_full") ? "The field is full. Increase capacity before promoting this player." : "Could not update the player", "error");
  revalidatePath("/"); revalidatePath("/admin"); adminRedirect("Player updated");
}

export async function deleteRegistration(formData: FormData) {
  const { db } = await requireOrganizer();
  const id = z.uuid().parse(formData.get("id"));
  const tournamentId = z.uuid().parse(formData.get("tournament_id"));
  const { error } = await db.from("registrations").delete().eq("id", id);
  if (error) adminRedirect("Could not delete the player", "error");
  await db.rpc("resequence_waitlist", { p_tournament_id: tournamentId });
  revalidatePath("/"); revalidatePath("/admin"); adminRedirect("Player deleted");
}
