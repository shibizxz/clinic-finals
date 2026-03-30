import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] px-8 py-16 text-center shadow-[var(--shadow)]">
      <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
        Page not found
      </p>
      <h1 className="font-display text-4xl font-semibold text-[var(--ink)]">
        This route is not part of the clinic workflow yet.
      </h1>
      <p className="max-w-xl text-sm leading-7 text-[var(--ink-soft)]">
        Try returning to the doctor list or the homepage.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
        >
          Go home
        </Link>
        <Link
          href="/doctors"
          className="rounded-full border border-[var(--line-strong)] bg-white px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
        >
          Browse doctors
        </Link>
      </div>
    </div>
  );
}
