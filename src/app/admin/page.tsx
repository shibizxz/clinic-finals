import Link from "next/link";
import { AppointmentCard } from "@/components/appointment-card";
import { requireAdmin } from "@/lib/auth";
import { getAdminMetrics, listAdminAppointments } from "@/lib/data";

export default async function AdminDashboardPage() {
  await requireAdmin("/admin");
  const [metrics, queue] = await Promise.all([
    getAdminMetrics(),
    listAdminAppointments(),
  ]);
  const pending = queue.pending.slice(0, 2);

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(15,118,110,0.94),rgba(20,37,45,0.96))] p-7 text-white shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.24em] text-emerald-100">
          Admin control center
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold">
          Manage approvals, doctors, and schedule rules
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-emerald-50/85">
          This area is intentionally operational: approve pending bookings, adjust token limits, and keep doctors visible only when they should be bookable.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-4">
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            Pending
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">
            {metrics.pendingApprovals}
          </p>
        </div>
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            Doctors
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">
            {metrics.activeDoctors}
          </p>
        </div>
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            Bookings
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">
            {metrics.totalBookings}
          </p>
        </div>
        <div className="rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            WhatsApp logs
          </p>
          <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">
            {metrics.notificationsSent}
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Quick links
          </p>
          <div className="mt-4 grid gap-3">
            <Link
              href="/admin/appointments"
              className="rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              Review pending appointments
            </Link>
            <Link
              href="/admin/doctors"
              className="rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              Add or toggle doctors
            </Link>
            <Link
              href="/admin/schedules"
              className="rounded-[22px] border border-[var(--line)] bg-white/80 px-4 py-4 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              Edit weekly timings and overrides
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold text-[var(--ink)]">Pending now</h2>
            <Link
              href="/admin/appointments"
              className="text-sm font-semibold text-[var(--brand)] transition hover:text-[var(--brand-strong)]"
            >
              Open full queue
            </Link>
          </div>
          {pending.length === 0 ? (
            <p className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-6 text-sm text-[var(--ink-soft)]">
              No pending approvals right now.
            </p>
          ) : (
            pending.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
