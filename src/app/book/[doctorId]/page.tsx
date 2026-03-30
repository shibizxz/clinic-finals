import { notFound } from "next/navigation";
import { createBookingAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { requireClient } from "@/lib/auth";
import { getDoctorById, getSuggestedBookingDates, listAvailability } from "@/lib/data";
import { formatShortDate } from "@/lib/utils";

export default async function BookDoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ doctorId: string }>;
  searchParams: Promise<{ date?: string; time?: string }>;
}) {
  const [{ doctorId }, query] = await Promise.all([params, searchParams]);
  const session = await requireClient(`/book/${doctorId}`);
  const doctor = await getDoctorById(doctorId);

  if (!doctor) {
    notFound();
  }

  const suggestedDates = await getSuggestedBookingDates();
  const selectedDate = query.date && suggestedDates.includes(query.date)
    ? query.date
    : suggestedDates[0];
  const slots = await listAvailability(doctor.id, selectedDate);
  const selectedTime =
    query.time && slots.some((slot) => slot.time === query.time && slot.isOpen)
      ? query.time
      : slots.find((slot) => slot.isOpen)?.time ?? "";

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Booking request
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--ink)]">
          Request a token with {doctor.name}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">
          Bookings stay pending until the clinic admin approves the slot. Once approved, the token number appears in your dashboard and can be sent by WhatsApp.
        </p>

        <div className="mt-6 space-y-3 rounded-[24px] bg-white/80 p-5 ring-1 ring-[var(--line)]">
          <p className="text-sm font-semibold text-[var(--ink)]">{doctor.title}</p>
          <p className="text-sm text-[var(--ink-soft)]">{doctor.roomLabel}</p>
          <div className="flex flex-wrap gap-2">
            {doctor.focusAreas.map((focus) => (
              <span
                key={focus}
                className="rounded-full bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--line)]"
              >
                {focus}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <form method="get" className="grid gap-4 rounded-[24px] bg-white/80 p-5 ring-1 ring-[var(--line)]">
          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Choose a date
            <select
              name="date"
              defaultValue={selectedDate}
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            >
              {suggestedDates.map((date) => (
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

        <div className="mt-6">
          <p className="text-sm font-semibold text-[var(--ink)]">Available times</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {slots.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">
                No availability for the selected day.
              </p>
            ) : (
              slots.map((slot) => (
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
              ))
            )}
          </div>
        </div>

        <form action={createBookingAction} className="mt-6 grid gap-4 rounded-[24px] bg-white/80 p-5 ring-1 ring-[var(--line)]">
          <input type="hidden" name="doctorId" value={doctor.id} />
          <input type="hidden" name="requestedDate" value={selectedDate} />
          <input type="hidden" name="requestedTime" value={selectedTime} />

          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Phone number
            <input
              name="phone"
              defaultValue={session.user.phone ?? ""}
              placeholder="+91 98765 43210"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Reason for visit
            <input
              name="reason"
              placeholder="Describe the issue briefly"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-[var(--ink)]">
            Notes
            <textarea
              name="notes"
              rows={4}
              placeholder="Anything the clinic should know?"
              className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
            />
          </label>

          <SubmitButton
            label={selectedTime ? "Submit booking request" : "Choose a time first"}
            pendingLabel="Sending request..."
            className="w-full disabled:bg-slate-300"
            disabled={!selectedTime}
          />
        </form>
      </section>
    </div>
  );
}
