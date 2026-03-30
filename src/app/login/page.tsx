import { GoogleLoginButton } from "@/components/google-login-button";
import { SubmitButton } from "@/components/submit-button";
import { logoutAction } from "@/app/actions";
import { getViewerSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

const notices: Record<string, string> = {
  "auth-error": "Google sign-in could not complete. Please check your Supabase auth callback settings.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";
  const session = await getViewerSession();

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[32px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(15,118,110,0.96),rgba(24,36,45,0.96))] p-7 text-white shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-100">
          Access portal
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold">
          Sign in with Google
        </h1>
        <p className="mt-4 text-sm leading-7 text-emerald-50/85">
          Webappzz Clinic now uses the real Supabase auth flow. Clients and admins sign in with Google, then role access is controlled from Supabase profiles.
        </p>
      </section>

      <section className="space-y-6 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        {params.notice && notices[params.notice] ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-sm text-rose-950">
            {notices[params.notice]}
          </div>
        ) : null}

        {session.user ? (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-950">
              Signed in as {session.user.displayName}
            </p>
            <p className="mt-1 text-sm text-emerald-900/80">
              Role: {session.user.role === "admin" ? "Clinic admin" : "Client"}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <form action={logoutAction}>
                <SubmitButton label="Logout" pendingLabel="Logging out..." />
              </form>
            </div>
          </div>
        ) : null}

        {isSupabaseConfigured() ? (
          <div className="space-y-3 rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm font-semibold text-[var(--ink)]">Google sign-in</p>
            <p className="text-sm text-[var(--ink-soft)]">
              Recommended for production. Clients are asked for a phone number after sign-in so WhatsApp confirmations can be sent.
            </p>
            <GoogleLoginButton next={nextPath} />
          </div>
        ) : (
          <div className="space-y-3 rounded-[24px] border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-950">
              Supabase setup required
            </p>
            <p className="text-sm text-amber-900/80">
              Add your Supabase URL and publishable key in `.env.local`, then restart the app. Demo login has been removed so local and production auth behave the same way.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
