import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function requireOrganizer() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/admin?error=Supabase%20is%20not%20configured");
  }

  const db = await createSupabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/admin?error=Please%20sign%20in%20again");
  return { db, user };
}
