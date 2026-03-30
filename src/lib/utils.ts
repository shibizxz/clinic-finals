import { AppointmentStatus } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function formatDateLong(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateKey}T00:00:00`));
}

export function formatShortDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateKey}T00:00:00`));
}

export function formatTimeLabel(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTime(dateKey: string, time: string) {
  return `${formatDateLong(dateKey)} at ${formatTimeLabel(time)}`;
}

export function getTimeSlots(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number,
) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  const slots: string[] = [];

  let cursorMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (cursorMinutes + slotDurationMinutes <= endMinutes) {
    const hour = Math.floor(cursorMinutes / 60)
      .toString()
      .padStart(2, "0");
    const minute = (cursorMinutes % 60).toString().padStart(2, "0");
    slots.push(`${hour}:${minute}`);
    cursorMinutes += slotDurationMinutes;
  }

  return slots;
}

export function getStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "pending":
      return "Pending approval";
    case "confirmed":
      return "Confirmed";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    case "rescheduled":
      return "Rescheduled";
    default:
      return status;
  }
}

export function getStatusClasses(status: AppointmentStatus) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "pending":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "rejected":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    case "cancelled":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    case "rescheduled":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    default:
      return "bg-white text-slate-800 ring-slate-200";
  }
}

export function appointmentDateTimeValue(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00`);
}

export function isFutureAppointment(dateKey: string, time: string) {
  return appointmentDateTimeValue(dateKey, time).getTime() > Date.now();
}
