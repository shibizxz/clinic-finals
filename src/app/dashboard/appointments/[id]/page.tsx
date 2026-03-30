import { notFound } from "next/navigation";
import { requestRescheduleAction } from "@/app/actions";
import { AppointmentCard } from "@/components/appointment-card";
import { SubmitButton } from "@/components/submit-button";
import { requireClient } from "@/lib/auth";
import {
  getAppointmentForUser,
  getSuggestedBookingDates,
  listAvailability,
} from "@/lib/data";
import { formatShortDate } from "@/lib/utils";

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string; time?: string }>;
}) {
  const session = await requireClient("/dashboard");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const appointment = await getAppointmentForUser(id, session.user.id);

  if (!appointment) {
    notFound();
  }

  const dates = await getSuggestedBookingDates();
  const selectedDate = query.date && dates.includes(query.date) ? query.date : dates[0];
  const slots = await listAvailability(appointment.doctor.id, selectedDate);
  const selectedTime =
    query.time && slots.some((slot) => slot.time === query.time && slot.isOpen)
      ? query.time
      : slots.find((slot) => slot.isOpen)?.time ?? "";

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="space-y-6">
        <AppointmentCard appointment={appointment} />
      </section>

      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Reschedule request
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-[var(--ink)]">
          Ask the clinic for a new slot
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
          Your current appointment remains active until the admin approves the new request.
        </p>

        <form method="get" className="mt-6 grid gap-4 rounded-[24px] bg-white/80 p-5 ring-1 ring-[var(--line)]">
          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Choose new date
            <select
              name="date"
              defaultValue={selectedDate}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            >
              {dates.map((date) => (
                <option key={date} value={date}>
                  {formatShortDate(date)}
                </option>
              ))}
            </select>
          </label>
          <input type="hidden" name="time" value="" />
          <button
            type="submit"
            className="inline-flex justify-center rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
          >
            Refresh slots
          </button>
        </form>

        <div className="mt-6 flex flex-wrap gap-3">
          {slots.map((slot) => (
            <a
              key={slot.time}
              href={`?date=${selectedDate}&time=${slot.time}`}
              className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                slot.isOpen
                  ? slot.time === selectedTime
                    ? "bg-[var(--brand)] text-white ring-[var(--brand)]"
                    : "bg-white text-[var(--ink)] ring-[var(--line-strong)] hover:ring-[var(--brand)] hover:text-[var(--brand)]"
                  : "cursor-not-allowed bg-slate-100 text-slate-400 ring-slate-200"
              }`}
            >
              {slot.label}
            </a>
          ))}
        </div>

        <form action={requestRescheduleAction} className="mt-6 grid gap-4 rounded-[24px] bg-white/80 p-5 ring-1 ring-[var(--line)]">
          <input type="hidden" name="appointmentId" value={appointment.id} />
          <input type="hidden" name="requestedDate" value={selectedDate} />
          <input type="hidden" name="requestedTime" value={selectedTime} />

          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Reason for reschedule
            <input
              name="reason"
              placeholder="Explain why you need a new time"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Notes
            <textarea
              name="notes"
              rows={4}
              placeholder="Optional clinic note"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>

          <SubmitButton
            label={selectedTime ? "Submit reschedule request" : "Choose a time first"}
            pendingLabel="Sending request..."
            className="w-full disabled:bg-slate-300"
            disabled={!selectedTime}
          />
        </form>
      </section>
    </div>
  );
}
