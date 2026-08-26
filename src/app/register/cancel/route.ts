import { getSupabaseSecretKey, getSupabaseUrl } from "@/lib/supabase-env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const registrationId = url.searchParams.get("registration");
  const token = url.searchParams.get("token");
  const siteUrl = new URL("/register?payment=cancelled", request.url);
  if (!registrationId || !token) return Response.redirect(siteUrl);

  const supabaseUrl = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();
  if (supabaseUrl && secretKey) {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(supabaseUrl, secretKey);
    await db.from("registrations").update({ status: "withdrawn" })
      .eq("id", registrationId)
      .eq("status", "pending_payment")
      .eq("checkout_cancel_token", token);
  }
  return Response.redirect(siteUrl);
}
