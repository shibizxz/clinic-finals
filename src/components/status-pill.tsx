import { AppointmentStatus } from "@/lib/types";
import { cn, getStatusClasses, getStatusLabel } from "@/lib/utils";

export function StatusPill({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        getStatusClasses(status),
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}
