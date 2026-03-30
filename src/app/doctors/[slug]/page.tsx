import Link from "next/link";
import { notFound } from "next/navigation";
import { getDoctorBySlug, getSuggestedBookingDates, listAvailability } from "@/lib/data";
import { formatShortDate } from "@/lib/utils";

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doctor = await getDoctorBySlug(slug);

  if (!doctor) {
    notFound();
  }

  const dates = (await getSuggestedBookingDates()).slice(0, 4);
  const availabilityByDate = await Promise.all(
    dates.map(async (date) => ({
      date,
      slots: await listAvailability(doctor.id, date),
    })),
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-6 rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
              {doctor.specialty}
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--ink)]">
              {doctor.name}
            </h1>
            <p className="mt-2 text-base text-[var(--ink-soft)]">{doctor.title}</p>
          </div>
          <div
            className="h-18 w-18 rounded-[28px]"
            style={{ background: `linear-gradient(145deg, ${doctor.accentColor}, rgba(255,255,255,0.96))` }}
          />
        </div>

        <p className="text-base leading-8 text-[var(--ink-soft)]">{doctor.bio}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] bg-white/80 p-5 ring-1 ring-[var(--line)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
              Focus areas
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink)]">
              {doctor.focusAreas.map((focus) => (
                <li key={focus}>{focus}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-[24px] bg-white/80 p-5 ring-1 ring-[var(--line)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
              Consultation setup
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--ink)]">
              <li>{doctor.durationMinutes} minute appointments</li>
              <li>{doctor.yearsExperience}+ years of experience</li>
              <li>{doctor.roomLabel}</li>
            </ul>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
            Languages
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {doctor.languages.map((language) => (
              <span
                key={language}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--ink-soft)] ring-1 ring-[var(--line)]"
              >
                {language}
              </span>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4 rounded-[32px] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,252,247,0.95),rgba(255,255,255,0.92))] p-6 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Next available days
        </p>
        {availabilityByDate.map(({ date, slots }) => {
          const openCount = slots.filter((slot) => slot.isOpen).length;
          return (
            <div
              key={date}
              className="rounded-[24px] border border-[var(--line)] bg-white/80 px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--ink)]">{formatShortDate(date)}</p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {openCount > 0 ? `${openCount} slots open` : "No slots available"}
                  </p>
                </div>
                <span className="text-sm font-semibold text-[var(--brand)]">
                  {slots[0]?.label ?? "Closed"}
                </span>
              </div>
            </div>
          );
        })}

        <Link
          href={`/book/${doctor.id}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
        >
          Book consultation token
        </Link>
      </aside>
    </div>
  );
}
