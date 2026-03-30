import { createDoctorAction, toggleDoctorActiveAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { listDoctors } from "@/lib/data";

export default async function AdminDoctorsPage() {
  await requireAdmin("/admin/doctors");
  const doctors = await listDoctors({ includeInactive: true });

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Doctor management
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--ink)]">
          Add specialists and control visibility
        </h1>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form action={createDoctorAction} className="grid gap-4 rounded-[30px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Create doctor</h2>
          <input name="name" placeholder="Doctor name" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="title" placeholder="Title (e.g. MBBS, MD Cardiology)" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="specialty" placeholder="Specialty" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="durationMinutes" type="number" min={10} max={60} placeholder="Slot duration in minutes" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="roomLabel" placeholder="Room label" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <textarea name="bio" rows={4} placeholder="Doctor profile bio" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="focusAreas" placeholder="Focus areas, comma separated" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <input name="languages" placeholder="Languages, comma separated" className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]" />
          <SubmitButton label="Add doctor" pendingLabel="Creating..." className="w-full" />
        </form>

        <div className="space-y-4">
          {doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
                    {doctor.specialty}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
                    {doctor.name}
                  </h2>
                  <p className="text-sm text-[var(--ink-soft)]">{doctor.title}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    doctor.active
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {doctor.active ? "Visible" : "Hidden"}
                </span>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{doctor.bio}</p>
              <form action={toggleDoctorActiveAction} className="mt-4">
                <input type="hidden" name="doctorId" value={doctor.id} />
                <SubmitButton
                  label={doctor.active ? "Hide from booking" : "Show in booking"}
                  pendingLabel="Updating..."
                  className="bg-white text-[var(--ink)] ring-1 ring-[var(--line-strong)] hover:bg-slate-50 hover:text-[var(--brand)]"
                />
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
