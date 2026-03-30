import Link from "next/link";
import { cancelBookingAction, completeProfileAction, logoutAction } from "@/app/actions";
import { AppointmentCard } from "@/components/appointment-card";
import { SubmitButton } from "@/components/submit-button";
import { requireClient } from "@/lib/auth";
import { listAppointmentsForUser } from "@/lib/data";
import { isFutureAppointment } from "@/lib/utils";

const notices: Record<string, string> = {
  "request-created": "Your booking request has been submitted for admin approval.",
  "booking-cancelled": "The booking was cancelled successfully.",
  "reschedule-requested": "Your reschedule request is now pending approval.",
  "profile-updated": "Your phone number has been updated.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const session = await requireClient("/dashboard");
  const params = await searchParams;
  const appointments = await listAppointmentsForUser(session.user.id);
  const upcoming = appointments.filter((appointment) =>
    ["pending", "confirmed"].includes(appointment.status),
  );
  const history = appointments.filter(
    (appointment) => !["pending", "confirmed"].includes(appointment.status),
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)] md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
            Client dashboard
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--ink)]">
            Welcome back, {session.user.displayName}
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Track token requests, cancellations, and reschedule requests in one place.
          </p>
        </div>
        <form action={logoutAction}>
          <SubmitButton label="Logout" pendingLabel="Logging out..." />
        </form>
      </section>

      {params.notice && notices[params.notice] ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-950">
          {notices[params.notice]}
        </div>
      ) : null}

      {session.needsPhone || !session.user.phone ? (
        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-6 shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-amber-950">Complete your profile</h2>
          <p className="mt-2 text-sm text-amber-900/80">
            Add a phone number so the clinic can send WhatsApp booking updates.
          </p>
          <form action={completeProfileAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input type="hidden" name="returnTo" value="/dashboard" />
            <input
              name="phone"
              defaultValue={session.user.phone ?? ""}
              placeholder="+91 98765 43210"
              className="min-w-0 flex-1 rounded-full border border-amber-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400"
            />
            <SubmitButton label="Save phone" pendingLabel="Saving..." />
          </form>
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Upcoming appointments</h2>
          <Link
            href="/doctors"
            className="text-sm font-semibold text-[var(--brand)] transition hover:text-[var(--brand-strong)]"
          >
            Book another doctor
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-6 text-sm text-[var(--ink-soft)]">
            No active bookings yet. Choose a doctor to start.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {upcoming.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                href={`/dashboard/appointments/${appointment.id}`}
                footer={
                  isFutureAppointment(
                    appointment.requestedDate,
                    appointment.requestedTime,
                  ) ? (
                    <form action={cancelBookingAction}>
                      <input type="hidden" name="appointmentId" value={appointment.id} />
                      <SubmitButton
                        label="Cancel booking"
                        pendingLabel="Cancelling..."
                        className="w-full bg-white text-[var(--ink)] ring-1 ring-[var(--line-strong)] hover:bg-slate-50 hover:text-[var(--brand)]"
                      />
                    </form>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold text-[var(--ink)]">Past activity</h2>
        {history.length === 0 ? (
          <p className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-6 text-sm text-[var(--ink-soft)]">
            Cancelled or rejected bookings will appear here.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {history.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
