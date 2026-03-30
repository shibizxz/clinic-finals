import { addScheduleOverrideAction, upsertScheduleRuleAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { getDoctorSchedules, listDoctors } from "@/lib/data";

const weekdayOptions = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
  { label: "Saturday", value: 6 },
];

export default async function AdminSchedulesPage() {
  await requireAdmin("/admin/schedules");
  const [doctors, schedules] = await Promise.all([
    listDoctors({ includeInactive: true }),
    getDoctorSchedules(),
  ]);

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Schedule rules
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--ink)]">
          Configure weekly timings and one-day overrides
        </h1>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <form action={upsertScheduleRuleAction} className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Weekly rule</h2>
          <select name="doctorId" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]">
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
          <select name="weekday" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]">
            {weekdayOptions.map((weekday) => (
              <option key={weekday.value} value={weekday.value}>
                {weekday.label}
              </option>
            ))}
          </select>
          <input name="startTime" type="time" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="endTime" type="time" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="slotDurationMinutes" type="number" min={10} max={60} placeholder="Slot duration" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="dailyTokenLimit" type="number" min={1} max={40} placeholder="Daily token limit" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <SubmitButton label="Save weekly rule" pendingLabel="Saving..." className="w-full" />
        </form>

        <form action={addScheduleOverrideAction} className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Date override</h2>
          <select name="doctorId" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]">
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
          <input name="date" type="date" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <select name="closed" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]">
            <option value="no">Open with custom hours</option>
            <option value="yes">Closed for the day</option>
          </select>
          <input name="startTime" type="time" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="endTime" type="time" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="slotDurationMinutes" type="number" min={10} max={60} placeholder="Slot duration override" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="dailyTokenLimit" type="number" min={1} max={40} placeholder="Daily token limit override" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="note" placeholder="Reason or note" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <SubmitButton label="Save override" pendingLabel="Saving..." className="w-full" />
        </form>
      </section>

      <section className="space-y-5">
        {schedules.map(({ doctor, rules, overrides }) => (
          <article
            key={doctor.id}
            className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
          >
            <h2 className="text-2xl font-semibold text-[var(--ink)]">{doctor.name}</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{doctor.title}</p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                  Weekly rules
                </p>
                <div className="mt-3 space-y-2">
                  {rules.map((rule) => (
                    <div key={rule.id} className="rounded-[20px] bg-white/80 px-4 py-3 text-sm text-[var(--ink-soft)] ring-1 ring-[var(--line)]">
                      {weekdayOptions.find((item) => item.value === rule.weekday)?.label}:{" "}
                      {rule.startTime} - {rule.endTime}, {rule.slotDurationMinutes} min, {rule.dailyTokenLimit} tokens
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--ink-soft)]">
                  Overrides
                </p>
                <div className="mt-3 space-y-2">
                  {overrides.length === 0 ? (
                    <div className="rounded-[20px] bg-white/80 px-4 py-3 text-sm text-[var(--ink-soft)] ring-1 ring-[var(--line)]">
                      No overrides yet.
                    </div>
                  ) : (
                    overrides.map((override) => (
                      <div key={override.id} className="rounded-[20px] bg-white/80 px-4 py-3 text-sm text-[var(--ink-soft)] ring-1 ring-[var(--line)]">
                        {override.date}:{" "}
                        {override.closed
                          ? "Closed"
                          : `${override.startTime} - ${override.endTime}, ${override.dailyTokenLimit ?? "base"} tokens`}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
