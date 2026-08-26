import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured");
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function getSiteUrl() {
  if (process.env.NODE_ENV === "production") return "https://tennisprovo.com";
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
