import Link from "next/link";
import { StatusPill } from "@/components/status-pill";
import { AppointmentWithDoctor } from "@/lib/types";
import { formatDateLong, formatTimeLabel } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: AppointmentWithDoctor;
  href?: string;
  footer?: React.ReactNode;
}

export function AppointmentCard({
  appointment,
  href,
  footer,
}: AppointmentCardProps) {
  const content = (
    <div className="rounded-[28px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--ink-soft)]">
            {appointment.doctor.specialty}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--ink)]">
            {appointment.doctor.name}
          </h3>
          <p className="text-sm text-[var(--ink-soft)]">{appointment.doctor.title}</p>
        </div>
        <StatusPill status={appointment.status} />
      </div>
      <div className="mt-5 grid gap-3 text-sm text-[var(--ink-soft)] sm:grid-cols-2">
        <div>
          <p className="font-medium text-[var(--ink)]">{formatDateLong(appointment.requestedDate)}</p>
          <p>{formatTimeLabel(appointment.requestedTime)}</p>
        </div>
        <div>
          <p className="font-medium text-[var(--ink)]">
            {appointment.tokenNumber ? `Token ${appointment.tokenNumber}` : "Token pending"}
          </p>
          <p>{appointment.doctor.roomLabel}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--ink)]">{appointment.reason}</p>
      {appointment.adminNote ? (
        <p className="mt-3 rounded-2xl bg-white/80 px-3 py-2 text-sm text-[var(--ink-soft)]">
          Admin note: {appointment.adminNote}
        </p>
      ) : null}
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block transition hover:-translate-y-0.5">
      {content}
    </Link>
  );
}
