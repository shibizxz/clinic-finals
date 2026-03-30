import Link from "next/link";
import { listDoctors } from "@/lib/data";

export default async function DoctorsPage() {
  const doctors = await listDoctors();

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Doctor directory
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--ink)]">
          Specialists ready for online token booking
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-8 text-[var(--ink-soft)]">
          Each doctor card links to a profile page where clients can review specialty details and move into the booking flow.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        {doctors.map((doctor) => (
          <article
            key={doctor.id}
            className="rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                  {doctor.specialty}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                  {doctor.name}
                </h2>
                <p className="text-sm text-[var(--ink-soft)]">{doctor.title}</p>
              </div>
              <div
                className="h-14 w-14 rounded-2xl"
                style={{ background: `linear-gradient(135deg, ${doctor.accentColor}, rgba(255,255,255,0.92))` }}
              />
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{doctor.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {doctor.languages.map((language) => (
                <span
                  key={language}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--line)]"
                >
                  {language}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-[var(--ink-soft)]">
              <span>{doctor.durationMinutes} min slots</span>
              <Link
                href={`/doctors/${doctor.slug}`}
                className="font-semibold text-[var(--brand)] transition hover:text-[var(--brand-strong)]"
              >
                Open profile
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
