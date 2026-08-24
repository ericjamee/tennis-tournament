import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase-env";

export async function createSupabaseServer() {
  const store = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();

  if (!url || !key) throw new Error("Supabase is not configured");

  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {}
      },
    },
  });
}
