import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { getViewerSession } from "@/lib/auth";
import { getClinicSettings, getHomepageStats, listDoctors } from "@/lib/data";

export default async function HomePage() {
  const [clinic, stats, doctorList, session] = await Promise.all([
    getClinicSettings(),
    getHomepageStats(),
    listDoctors(),
    getViewerSession(),
  ]);
  const doctors = doctorList.slice(0, 3);

  return (
    <div className="space-y-10 pb-6">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-900">
            Multi-doctor online token booking
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl font-display text-5xl font-semibold leading-tight text-[var(--ink)] sm:text-6xl">
              Book the right doctor, request your token online, and let admin approval keep the queue clean.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              {clinic.name} gives clients a polished booking flow while your front desk keeps full control over doctor timings, token limits, and approvals.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={session.user ? "/dashboard" : "/login"}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              {session.user ? "Open dashboard" : "Start booking"}
            </Link>
            <Link
              href="/doctors"
              className="inline-flex items-center justify-center rounded-full border border-[var(--line-strong)] bg-white px-6 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              View doctor list
            </Link>
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
              <dt className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                Active doctors
              </dt>
              <dd className="mt-2 text-3xl font-semibold text-[var(--ink)]">{stats.totalDoctors}</dd>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
              <dt className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                Pending approvals
              </dt>
              <dd className="mt-2 text-3xl font-semibold text-[var(--ink)]">{stats.pendingApprovals}</dd>
            </div>
            <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]">
              <dt className="text-xs uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                Avg. wait time
              </dt>
              <dd className="mt-2 text-3xl font-semibold text-[var(--ink)]">{stats.averageWaitMinutes}m</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[36px] border border-[var(--line)] bg-[linear-gradient(160deg,rgba(15,118,110,0.95),rgba(20,37,45,0.95))] p-6 text-white shadow-[var(--shadow)]">
          <div className="rounded-[28px] border border-white/15 bg-white/8 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-100">
              Clinic command view
            </p>
            <h2 className="mt-3 font-display text-3xl">Approval-first scheduling</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Request arrives</p>
                    <p className="text-sm text-emerald-50/80">
                      Client picks doctor, day, and time online.
                    </p>
                  </div>
                  <StatusPill status="pending" />
                </div>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Admin confirms slot</p>
                    <p className="text-sm text-emerald-50/80">
                      Token numbers are assigned per doctor per day.
                    </p>
                  </div>
                  <StatusPill status="confirmed" />
                </div>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-sm font-semibold">WhatsApp updates</p>
                <p className="mt-1 text-sm text-emerald-50/80">
                  Every approval or rejection is ready to flow through Meta WhatsApp templates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <article
            key={doctor.id}
            className="rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]"
          >
            <div
              className="mb-4 h-2 w-24 rounded-full"
              style={{ backgroundColor: doctor.accentColor }}
            />
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
              {doctor.specialty}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">{doctor.name}</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{doctor.title}</p>
            <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{doctor.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {doctor.focusAreas.map((focus) => (
                <span
                  key={focus}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--line)]"
                >
                  {focus}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between text-sm text-[var(--ink-soft)]">
              <span>{doctor.yearsExperience}+ years</span>
              <Link
                href={`/doctors/${doctor.slug}`}
                className="font-semibold text-[var(--brand)] transition hover:text-[var(--brand-strong)]"
              >
                View profile
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 rounded-[36px] border border-[var(--line)] bg-[rgba(255,252,247,0.75)] p-6 shadow-[var(--shadow)] md:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Step 1
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">Choose a doctor</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Browse specialties like MBBS, Ortho, Heart, and General before picking a consultation slot.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Step 2
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">Submit booking request</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            Clients enter the date, time, reason for visit, and phone number for WhatsApp updates.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Step 3
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--ink)]">Admin approves and sends token</h3>
          <p className="mt-2 text-sm leading-7 text-[var(--ink-soft)]">
            The clinic confirms availability, assigns a token, and the client sees the update immediately in the dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}
