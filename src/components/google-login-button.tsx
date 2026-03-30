"use client";

import { startTransition, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

interface GoogleLoginButtonProps {
  next?: string;
  className?: string;
}

export function GoogleLoginButton({
  next = "/dashboard",
  className,
}: GoogleLoginButtonProps) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          setPending(true);
          try {
            const supabase = getSupabaseBrowserClient();
            const callbackUrl = new URL("/auth/callback", window.location.origin);
            callbackUrl.searchParams.set("next", next);

            await supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: callbackUrl.toString(),
              },
            });
          } finally {
            setPending(false);
          }
        });
      }}
    >
      {pending ? "Redirecting..." : "Continue with Google"}
    </button>
  );
}
