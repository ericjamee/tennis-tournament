import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { hasSupabasePublicConfig } from "@/lib/supabase-env";

export async function requireOrganizer() {
  if (!hasSupabasePublicConfig()) {
    redirect("/admin?error=Supabase%20is%20not%20configured");
  }

  const db = await createSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/admin?error=Please%20sign%20in%20again");
  return { db, user };
}
