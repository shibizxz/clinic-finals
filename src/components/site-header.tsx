import Link from "next/link";
import { getViewerSession } from "@/lib/auth";
import { getClinicSettings } from "@/lib/data";

export async function SiteHeader() {
  const [clinic, session] = await Promise.all([
    getClinicSettings(),
    getViewerSession(),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-[rgba(247,243,234,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand)] text-lg font-bold text-white shadow-lg shadow-emerald-900/20">
              W
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-[var(--ink)]">
                {clinic.name}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                Appointment Tokens
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-soft)] md:flex">
          <Link href="/doctors" className="transition hover:text-[var(--brand)]">
            Doctors
          </Link>
          <Link href="/dashboard" className="transition hover:text-[var(--brand)]">
            Dashboard
          </Link>
          <Link href="/admin" className="transition hover:text-[var(--brand)]">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {session.user ? (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-[var(--ink)]">
                {session.user.displayName}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                {session.user.role === "admin" ? "Clinic Admin" : "Client Portal"}
              </p>
            </div>
          ) : null}
          <Link
            href={session.user ? (session.user.role === "admin" ? "/admin" : "/dashboard") : "/login"}
            className="rounded-full border border-[var(--line-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            {session.user ? "Open app" : "Login"}
          </Link>
        </div>
      </div>
    </header>
  );
}
