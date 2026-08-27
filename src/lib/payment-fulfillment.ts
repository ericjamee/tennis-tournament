import type Stripe from "stripe";
import { sendRegistrationEmail } from "@/lib/email";
import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase-env";
import { getStripe } from "@/lib/stripe";
import { ENTRY_FEE, VENUE_NAME } from "@/lib/tournament-details";

type Registration = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: "registered" | "confirmed";
};

type Tournament = {
  id: string;
  name: string;
  date: string;
  venue_name: string | null;
  venue_address: string | null;
};

export type FulfillmentResult = {
  registration: Registration;
  tournament: Tournament;
  newlyRegistered: boolean;
};

export async function fulfillCheckoutSession(
  sessionId: string,
  suppliedSession?: Stripe.Checkout.Session,
): Promise<FulfillmentResult> {
  const session = suppliedSession ?? await getStripe().checkout.sessions.retrieve(sessionId);
  const registrationId = session.metadata?.registration_id;
  const tournamentId = session.metadata?.tournament_id;

  if (
    session.payment_status !== "paid" ||
    session.amount_total !== ENTRY_FEE * 100 ||
    session.currency !== "usd" ||
    !registrationId ||
    !tournamentId
  ) {
    throw new Error("Checkout session is not eligible for fulfillment");
  }

  const url = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();
  if (!url || !secretKey) throw new Error("Supabase is not configured");

  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, secretKey);
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  const { data: newlyRegistered, error: fulfillmentError } = await db.rpc("complete_registration_payment", {
    p_registration_id: registrationId,
    p_tournament_id: tournamentId,
    p_checkout_session_id: session.id,
    p_payment_intent_id: paymentIntentId ?? null,
    p_amount_paid: session.amount_total,
  });
  if (fulfillmentError) throw fulfillmentError;

  const [{ data: registration, error: registrationError }, { data: tournament, error: tournamentError }] = await Promise.all([
    db.from("registrations").select("id,first_name,last_name,email,status").eq("id", registrationId).single(),
    db.from("tournaments").select("id,name,date,venue_name,venue_address").eq("id", tournamentId).single(),
  ]);
  if (registrationError || tournamentError || !registration || !tournament) {
    throw registrationError ?? tournamentError ?? new Error("Paid registration could not be loaded");
  }

  if (newlyRegistered) {
    try {
      await sendRegistrationEmail({
        to: registration.email,
        name: `${registration.first_name} ${registration.last_name}`,
        status: "registered",
        registrationId: registration.id,
        tournamentName: tournament.name,
        date: new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${tournament.date}T12:00:00Z`)),
        venue: tournament.venue_name || tournament.venue_address || VENUE_NAME,
        paymentReceived: true,
      });
    } catch (emailError) {
      console.error("Paid registration email failed", emailError);
    }
  }

  return {
    registration: registration as Registration,
    tournament: tournament as Tournament,
    newlyRegistered: Boolean(newlyRegistered),
  };
}
