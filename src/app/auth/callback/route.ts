import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next") ?? "/dashboard";

  if (code && isSupabaseConfigured()) {
    try {
      const supabase = await getSupabaseServerClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      return NextResponse.redirect(new URL("/login?notice=auth-error", url.origin));
    }
  }

  return NextResponse.redirect(new URL(nextPath, url.origin));
}
