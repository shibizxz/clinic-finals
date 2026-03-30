"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireClient } from "@/lib/auth";
import {
  addScheduleOverride,
  approveAppointment,
  cancelAppointment,
  createDoctor,
  rejectAppointment,
  requestReschedule,
  submitBooking,
  toggleDoctorActive,
  updateProfilePhone,
  upsertScheduleRule,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const phoneSchema = z
  .string()
  .trim()
  .min(10, "Enter a valid phone number.")
  .max(20, "Enter a valid phone number.");

function refreshCoreRoutes() {
  revalidatePath("/");
  revalidatePath("/doctors");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/appointments");
  revalidatePath("/admin/doctors");
  revalidatePath("/admin/schedules");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  refreshCoreRoutes();
  redirect("/");
}

export async function completeProfileAction(formData: FormData) {
  const session = await requireClient("/dashboard");
  const phone = phoneSchema.parse(formData.get("phone"));
  const returnTo =
    typeof formData.get("returnTo") === "string"
      ? String(formData.get("returnTo"))
      : "/dashboard";

  await updateProfilePhone(session.user.id, phone);

  refreshCoreRoutes();
  redirect(`${returnTo}?notice=profile-updated`);
}

export async function createBookingAction(formData: FormData) {
  const session = await requireClient(
    `/book/${String(formData.get("doctorId") ?? "")}`,
  );

  const bookingSchema = z.object({
    doctorId: z.string().min(1),
    requestedDate: z.string().min(1),
    requestedTime: z.string().min(1),
    reason: z.string().trim().min(6).max(180),
    notes: z.string().trim().max(240).optional().default(""),
    phone: phoneSchema,
  });

  const values = bookingSchema.parse({
    doctorId: formData.get("doctorId"),
    requestedDate: formData.get("requestedDate"),
    requestedTime: formData.get("requestedTime"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
    phone: formData.get("phone"),
  });

  if (session.needsPhone || session.user.phone !== values.phone) {
    await updateProfilePhone(session.user.id, values.phone);
  }

  await submitBooking({
    phone: values.phone,
    doctorId: values.doctorId,
    requestedDate: values.requestedDate,
    requestedTime: values.requestedTime,
    reason: values.reason,
    notes: values.notes,
  });

  refreshCoreRoutes();
  redirect("/dashboard?notice=request-created");
}

export async function cancelBookingAction(formData: FormData) {
  await requireClient("/dashboard");
  const appointmentId = String(formData.get("appointmentId"));
  await cancelAppointment(appointmentId);
  refreshCoreRoutes();
  redirect("/dashboard?notice=booking-cancelled");
}

export async function requestRescheduleAction(formData: FormData) {
  await requireClient("/dashboard");
  const schema = z.object({
    appointmentId: z.string().min(1),
    requestedDate: z.string().min(1),
    requestedTime: z.string().min(1),
    reason: z.string().trim().min(6).max(180),
    notes: z.string().trim().max(240).optional().default(""),
  });

  const values = schema.parse({
    appointmentId: formData.get("appointmentId"),
    requestedDate: formData.get("requestedDate"),
    requestedTime: formData.get("requestedTime"),
    reason: formData.get("reason"),
    notes: formData.get("notes"),
  });

  await requestReschedule({
    appointmentId: values.appointmentId,
    requestedDate: values.requestedDate,
    requestedTime: values.requestedTime,
    reason: values.reason,
    notes: values.notes,
  });

  refreshCoreRoutes();
  redirect("/dashboard?notice=reschedule-requested");
}

export async function approveAppointmentAction(formData: FormData) {
  await requireAdmin("/admin/appointments");
  await approveAppointment(
    String(formData.get("appointmentId")),
    String(formData.get("note") ?? ""),
  );
  refreshCoreRoutes();
  redirect("/admin/appointments?notice=approved");
}

export async function rejectAppointmentAction(formData: FormData) {
  await requireAdmin("/admin/appointments");
  await rejectAppointment(
    String(formData.get("appointmentId")),
    String(formData.get("note") ?? ""),
  );
  refreshCoreRoutes();
  redirect("/admin/appointments?notice=rejected");
}

export async function createDoctorAction(formData: FormData) {
  await requireAdmin("/admin/doctors");
  const schema = z.object({
    name: z.string().trim().min(3),
    title: z.string().trim().min(3),
    specialty: z.string().trim().min(3),
    durationMinutes: z.coerce.number().int().min(10).max(60),
    roomLabel: z.string().trim().min(2),
    bio: z.string().trim().min(20).max(500),
    focusAreas: z.string().trim().min(3),
    languages: z.string().trim().min(2),
  });

  await createDoctor(
    schema.parse({
      name: formData.get("name"),
      title: formData.get("title"),
      specialty: formData.get("specialty"),
      durationMinutes: formData.get("durationMinutes"),
      roomLabel: formData.get("roomLabel"),
      bio: formData.get("bio"),
      focusAreas: formData.get("focusAreas"),
      languages: formData.get("languages"),
    }),
  );

  refreshCoreRoutes();
  redirect("/admin/doctors?notice=doctor-created");
}

export async function toggleDoctorActiveAction(formData: FormData) {
  await requireAdmin("/admin/doctors");
  await toggleDoctorActive(String(formData.get("doctorId")));
  refreshCoreRoutes();
  redirect("/admin/doctors?notice=doctor-updated");
}

export async function upsertScheduleRuleAction(formData: FormData) {
  await requireAdmin("/admin/schedules");
  const schema = z.object({
    doctorId: z.string().min(1),
    weekday: z.coerce.number().int().min(0).max(6),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    slotDurationMinutes: z.coerce.number().int().min(10).max(60),
    dailyTokenLimit: z.coerce.number().int().min(1).max(40),
  });

  await upsertScheduleRule(
    schema.parse({
      doctorId: formData.get("doctorId"),
      weekday: formData.get("weekday"),
      startTime: formData.get("startTime"),
      endTime: formData.get("endTime"),
      slotDurationMinutes: formData.get("slotDurationMinutes"),
      dailyTokenLimit: formData.get("dailyTokenLimit"),
    }),
  );

  refreshCoreRoutes();
  redirect("/admin/schedules?notice=rule-saved");
}

export async function addScheduleOverrideAction(formData: FormData) {
  await requireAdmin("/admin/schedules");
  const schema = z.object({
    doctorId: z.string().min(1),
    date: z.string().min(1),
    closed: z.enum(["yes", "no"]),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    slotDurationMinutes: z.coerce.number().int().min(10).max(60).optional(),
    dailyTokenLimit: z.coerce.number().int().min(1).max(40).optional(),
    note: z.string().trim().max(160).optional(),
  });

  const values = schema.parse({
    doctorId: formData.get("doctorId"),
    date: formData.get("date"),
    closed: formData.get("closed"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    slotDurationMinutes: formData.get("slotDurationMinutes") || undefined,
    dailyTokenLimit: formData.get("dailyTokenLimit") || undefined,
    note: formData.get("note") || undefined,
  });

  await addScheduleOverride({
    doctorId: values.doctorId,
    date: values.date,
    closed: values.closed === "yes",
    startTime: values.startTime,
    endTime: values.endTime,
    slotDurationMinutes: values.slotDurationMinutes,
    dailyTokenLimit: values.dailyTokenLimit,
    note: values.note,
  });

  refreshCoreRoutes();
  redirect("/admin/schedules?notice=override-saved");
}
