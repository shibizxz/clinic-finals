import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseBrowserKey } from "@/lib/env";

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const browserKey = getSupabaseBrowserKey();

  if (!url || !browserKey) {
    throw new Error("Supabase browser client is not configured.");
  }

  return createBrowserClient(url, browserKey);
}
