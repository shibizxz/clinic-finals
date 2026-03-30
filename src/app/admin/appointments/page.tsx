import { approveAppointmentAction, rejectAppointmentAction } from "@/app/actions";
import { AppointmentCard } from "@/components/appointment-card";
import { SubmitButton } from "@/components/submit-button";
import { requireAdmin } from "@/lib/auth";
import { listAdminAppointments } from "@/lib/data";

const notices: Record<string, string> = {
  approved: "Booking approved and token assigned.",
  rejected: "Booking rejected and client notification logged.",
};

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin("/admin/appointments");
  const params = await searchParams;
  const queue = await listAdminAppointments();

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--ink-soft)]">
          Approval queue
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--ink)]">
          Approve, reject, and monitor client requests
        </h1>
      </section>

      {params.notice && notices[params.notice] ? (
        <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-950">
          {notices[params.notice]}
        </div>
      ) : null}

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold text-[var(--ink)]">Pending requests</h2>
        {queue.pending.length === 0 ? (
          <p className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-6 text-sm text-[var(--ink-soft)]">
            No requests waiting for approval.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {queue.pending.map((appointment) => (
              <div key={appointment.id} className="space-y-4">
                <AppointmentCard appointment={appointment} />
                <div className="grid gap-3 rounded-[24px] border border-[var(--line)] bg-white/80 p-4">
                  <form action={approveAppointmentAction} className="grid gap-3">
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <input
                      name="note"
                      placeholder="Approval note"
                      className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                    />
                    <SubmitButton
                      label="Approve and assign token"
                      pendingLabel="Approving..."
                      className="w-full"
                    />
                  </form>
                  <form action={rejectAppointmentAction} className="grid gap-3">
                    <input type="hidden" name="appointmentId" value={appointment.id} />
                    <input
                      name="note"
                      placeholder="Reason for rejection"
                      className="rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm outline-none focus:border-rose-400"
                    />
                    <SubmitButton
                      label="Reject booking"
                      pendingLabel="Rejecting..."
                      className="w-full bg-rose-600 hover:bg-rose-700"
                    />
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold text-[var(--ink)]">Confirmed today and upcoming</h2>
        {queue.active.length === 0 ? (
          <p className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-6 text-sm text-[var(--ink-soft)]">
            No confirmed appointments yet.
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {queue.active.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
