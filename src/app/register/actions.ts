"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { sendRegistrationEmail } from "@/lib/email";
import { getSupabaseSecretKey, getSupabaseUrl, TOURNAMENT_SLUG } from "@/lib/supabase-env";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import { ENTRY_FEE } from "@/lib/tournament-details";

const schema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  email: z.email("Enter a valid email").transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30),
  age: z.coerce.number().int().min(18, "Players must be 18 or older").max(100),
  self_rating: z.enum(["Beginner", "Intermediate", "Intermediate/Advanced", "Advanced"]),
  ntrp: z.string().max(10).optional(),
  utr: z.string().max(10).optional(),
  years_playing: z.coerce.number().int().min(0).max(80).optional(),
  experience: z.string().max(1000).optional(),
  preferred_division: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  rules_accepted: z.literal("on", { error: "Accept the tournament rules" }),
  waiver_accepted: z.literal("on", { error: "Accept the liability waiver" }),
});

export type FormState = { error?: string; fields?: Record<string, string> };

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Check the form and try again",
      fields: Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, String(value)])),
    };
  }

  const url = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();
  if (!url || !secretKey) return { error: "Registration is temporarily unavailable. Please try again soon." };

  const { createClient } = await import("@supabase/supabase-js");
  const db = createClient(url, secretKey);
  const { data: tournament, error: tournamentError } = await db.from("tournaments")
    .select("id,name,date,venue_name,venue_address,entry_fee,payment_method")
    .eq("slug", TOURNAMENT_SLUG)
    .single();
  if (tournamentError || !tournament) return { error: "Registration is temporarily unavailable. Please try again soon." };

  const cancelToken = randomUUID();
  const { data, error } = await db.rpc("register_for_tournament", {
    p_tournament_id: tournament.id,
    p_registration: { ...parsed.data, rules_accepted: true, waiver_accepted: true, checkout_cancel_token: cancelToken },
  });
  if (error) {
    console.error("Tournament registration RPC failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      tournamentId: tournament.id,
    });
    if (error.message.includes("duplicate")) return { error: "You already have an active registration or checkout with that email." };
    return { error: "We couldn’t save your registration. Please try again." };
  }

  const result = (Array.isArray(data) ? data[0] : data) as {
    id: string;
    status: "pending_payment" | "registered" | "waitlisted";
    waitlist_position?: number | null;
  };

  if (result.status === "pending_payment") {
    let checkoutUrl: string | null = null;
    try {
      const stripe = getStripe();
      const siteUrl = getSiteUrl();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: parsed.data.email,
        client_reference_id: result.id,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: ENTRY_FEE * 100,
            product_data: {
              name: tournament.name,
              description: "Singles tournament entry · Monday, September 7, 2026",
            },
          },
        }],
        metadata: { registration_id: result.id, tournament_id: tournament.id },
        payment_intent_data: { metadata: { registration_id: result.id, tournament_id: tournament.id } },
        success_url: `${siteUrl}/register/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/register/cancel?registration=${encodeURIComponent(result.id)}&token=${encodeURIComponent(cancelToken)}`,
        custom_text: { submit: { message: "Your tournament spot is confirmed as soon as payment succeeds." } },
      });
      const { error: updateError } = await db.from("registrations").update({ stripe_checkout_session_id: session.id })
        .eq("id", result.id)
        .eq("status", "pending_payment");
      if (updateError) {
        await stripe.checkout.sessions.expire(session.id);
        throw updateError;
      }
      checkoutUrl = session.url;
    } catch (checkoutError) {
      console.error("Stripe Checkout creation failed", checkoutError);
      await db.from("registrations").update({ status: "withdrawn" }).eq("id", result.id).eq("status", "pending_payment");
      return { error: "We couldn’t start secure payment. Your card was not charged—please try again." };
    }
    if (!checkoutUrl) return { error: "We couldn’t start secure payment. Please try again." };
    redirect(checkoutUrl);
  }

  if (result.status !== "registered" && result.status !== "waitlisted") {
    return { error: "Registration could not be completed. Please try again." };
  }
  const emailStatus: "registered" | "waitlisted" = result.status;

  after(async () => {
    try {
      await sendRegistrationEmail({
        to: parsed.data.email,
        name: `${parsed.data.first_name} ${parsed.data.last_name}`,
        status: emailStatus,
        waitlistPosition: result.waitlist_position,
        registrationId: result.id,
        tournamentName: tournament.name,
        date: new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeZone: "UTC" }).format(new Date(`${tournament.date}T12:00:00Z`)),
        venue: tournament.venue_name || tournament.venue_address || "Riverview Park (planned; reservation pending)",
      });
    } catch (emailError) {
      console.error("Registration email failed", emailError);
    }
  });

  const position = result.waitlist_position ? `&position=${result.waitlist_position}` : "";
  redirect(`/register/confirmation?id=${result.id}&name=${encodeURIComponent(`${parsed.data.first_name} ${parsed.data.last_name}`)}&status=${result.status}${position}`);
}
