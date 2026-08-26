import type Stripe from "stripe";
import { fulfillCheckoutSession } from "@/lib/payment-fulfillment";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return Response.json({ error: "Webhook is not configured" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      await fulfillCheckoutSession(event.data.object.id, event.data.object);
    } catch (error) {
      console.error("Stripe fulfillment failed", error);
      return Response.json({ error: "Fulfillment failed" }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
