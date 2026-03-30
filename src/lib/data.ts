import {
  Appointment,
  AppointmentWithDoctor,
  AvailabilitySlot,
  ClinicSettings,
  DashboardStats,
  Doctor,
  DoctorScheduleOverride,
  DoctorScheduleRule,
} from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  addDays,
  appointmentDateTimeValue,
  formatTimeLabel,
  getTimeSlots,
  slugify,
  toDateKey,
} from "@/lib/utils";

const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
  name: "Webappzz Clinic",
  address: "14 Park View Road, Chennai",
  timezone: "Asia/Calcutta",
  bookingHorizonDays: 30,
  supportPhone: "+91 90000 80000",
  whatsappDisplayNumber: "+91 90000 80000",
  notificationProvider: "meta-cloud",
};

type ClinicSettingsRow = {
  name: string;
  address: string;
  timezone: string;
  booking_horizon_days: number;
  support_phone: string | null;
  whatsapp_display_number: string | null;
  notification_provider: string;
};

type DoctorRow = {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  focus_areas: string[] | null;
  languages: string[] | null;
  years_experience: number;
  duration_minutes: number;
  room_label: string;
  accent_color: string;
  active: boolean;
};

type DoctorScheduleRuleRow = {
  id: string;
  doctor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  daily_token_limit: number;
};

type DoctorScheduleOverrideRow = {
  id: string;
  doctor_id: string;
  date: string;
  closed: boolean;
  start_time: string | null;
  end_time: string | null;
  slot_duration_minutes: number | null;
  daily_token_limit: number | null;
  note: string | null;
};

type AppointmentRow = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  phone: string;
  doctor_id: string;
  requested_date: string;
  requested_time: string;
  requested_at: string;
  reason: string;
  notes: string;
  admin_note: string | null;
  status: Appointment["status"];
  token_number: number | null;
  linked_appointment_id: string | null;
  doctor?: DoctorRow | DoctorRow[] | null;
};

function trimTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "";
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

function assertConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add your Supabase environment variables before using booking actions.",
    );
  }
}

async function getReadClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return getSupabaseServerClient();
}

function mapClinicSettings(row: ClinicSettingsRow | null | undefined): ClinicSettings {
  if (!row) {
    return DEFAULT_CLINIC_SETTINGS;
  }

  return {
    name: row.name,
    address: row.address,
    timezone: row.timezone,
    bookingHorizonDays: row.booking_horizon_days,
    supportPhone: row.support_phone ?? "",
    whatsappDisplayNumber: row.whatsapp_display_number ?? "",
    notificationProvider: "meta-cloud",
  };
}

function mapDoctor(row: DoctorRow): Doctor {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    specialty: row.specialty,
    bio: row.bio,
    focusAreas: row.focus_areas ?? [],
    languages: row.languages ?? [],
    yearsExperience: row.years_experience,
    durationMinutes: row.duration_minutes,
    roomLabel: row.room_label,
    accentColor: row.accent_color,
    active: row.active,
  };
}

function mapScheduleRule(row: DoctorScheduleRuleRow): DoctorScheduleRule {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    weekday: row.weekday,
    startTime: trimTime(row.start_time),
    endTime: trimTime(row.end_time),
    slotDurationMinutes: row.slot_duration_minutes,
    dailyTokenLimit: row.daily_token_limit,
  };
}

function mapScheduleOverride(row: DoctorScheduleOverrideRow): DoctorScheduleOverride {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    date: row.date,
    closed: row.closed,
    startTime: trimTime(row.start_time) || null,
    endTime: trimTime(row.end_time) || null,
    slotDurationMinutes: row.slot_duration_minutes,
    dailyTokenLimit: row.daily_token_limit,
    note: row.note,
  };
}

function mapAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    phone: row.phone,
    doctorId: row.doctor_id,
    requestedDate: row.requested_date,
    requestedTime: trimTime(row.requested_time),
    requestedAt: row.requested_at,
    reason: row.reason,
    notes: row.notes,
    adminNote: row.admin_note,
    status: row.status,
    tokenNumber: row.token_number,
    linkedAppointmentId: row.linked_appointment_id,
  };
}

function mapAppointmentWithDoctor(row: AppointmentRow): AppointmentWithDoctor | null {
  const doctorRow = Array.isArray(row.doctor) ? row.doctor[0] : row.doctor;

  if (!doctorRow) {
    return null;
  }

  return {
    ...mapAppointment(row),
    doctor: mapDoctor(doctorRow),
  };
}

async function getScheduleSnapshot(doctorId: string, date: string) {
  const supabase = await getReadClient();

  if (!supabase) {
    return null;
  }

  const weekday = new Date(`${date}T00:00:00`).getDay();

  const [{ data: ruleData, error: ruleError }, { data: overrideData, error: overrideError }] =
    await Promise.all([
      supabase
        .from("doctor_schedule_rules")
        .select(
          "id, doctor_id, weekday, start_time, end_time, slot_duration_minutes, daily_token_limit",
        )
        .eq("doctor_id", doctorId)
        .eq("weekday", weekday)
        .maybeSingle(),
      supabase
        .from("doctor_schedule_overrides")
        .select(
          "id, doctor_id, date, closed, start_time, end_time, slot_duration_minutes, daily_token_limit, note",
        )
        .eq("doctor_id", doctorId)
        .eq("date", date)
        .maybeSingle(),
    ]);

  throwIfError(ruleError);
  throwIfError(overrideError);

  const baseRule = ruleData ? mapScheduleRule(ruleData as DoctorScheduleRuleRow) : null;
  const override = overrideData
    ? mapScheduleOverride(overrideData as DoctorScheduleOverrideRow)
    : null;

  if (!baseRule || override?.closed) {
    return null;
  }

  return {
    startTime: override?.startTime ?? baseRule.startTime,
    endTime: override?.endTime ?? baseRule.endTime,
    slotDurationMinutes:
      override?.slotDurationMinutes ?? baseRule.slotDurationMinutes,
    dailyTokenLimit: override?.dailyTokenLimit ?? baseRule.dailyTokenLimit,
  };
}

export async function getClinicSettings() {
  const supabase = await getReadClient();

  if (!supabase) {
    return DEFAULT_CLINIC_SETTINGS;
  }

  const { data, error } = await supabase
    .from("clinic_settings")
    .select(
      "name, address, timezone, booking_horizon_days, support_phone, whatsapp_display_number, notification_provider",
    )
    .limit(1)
    .maybeSingle();

  throwIfError(error);
  return mapClinicSettings(data as ClinicSettingsRow | null);
}

export async function listDoctors(options?: { includeInactive?: boolean }) {
  const supabase = await getReadClient();

  if (!supabase) {
    return [] as Doctor[];
  }

  let query = supabase
    .from("doctors")
    .select(
      "id, slug, name, title, specialty, bio, focus_areas, languages, years_experience, duration_minutes, room_label, accent_color, active",
    )
    .order("name", { ascending: true });

  if (!options?.includeInactive) {
    query = query.eq("active", true);
  }

  const { data, error } = await query;
  throwIfError(error);

  return (data ?? []).map((row) => mapDoctor(row as DoctorRow));
}

export async function getDoctorById(doctorId: string) {
  const supabase = await getReadClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("doctors")
    .select(
      "id, slug, name, title, specialty, bio, focus_areas, languages, years_experience, duration_minutes, room_label, accent_color, active",
    )
    .eq("id", doctorId)
    .maybeSingle();

  throwIfError(error);
  return data ? mapDoctor(data as DoctorRow) : null;
}

export async function getDoctorBySlug(slug: string) {
  const supabase = await getReadClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("doctors")
    .select(
      "id, slug, name, title, specialty, bio, focus_areas, languages, years_experience, duration_minutes, room_label, accent_color, active",
    )
    .eq("slug", slug)
    .maybeSingle();

  throwIfError(error);
  return data ? mapDoctor(data as DoctorRow) : null;
}

export async function getHomepageStats(): Promise<DashboardStats> {
  const supabase = await getReadClient();

  if (!supabase) {
    return {
      totalDoctors: 0,
      pendingApprovals: 0,
      confirmedToday: 0,
      averageWaitMinutes: 12,
    };
  }

  const todayKey = toDateKey(new Date());
  const [
    { count: doctorCount, error: doctorError },
    { count: pendingCount, error: pendingError },
    { count: confirmedCount, error: confirmedError },
  ] = await Promise.all([
    supabase
      .from("doctors")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
      .eq("requested_date", todayKey),
  ]);

  throwIfError(doctorError);
  throwIfError(pendingError);
  throwIfError(confirmedError);

  return {
    totalDoctors: doctorCount ?? 0,
    pendingApprovals: pendingCount ?? 0,
    confirmedToday: confirmedCount ?? 0,
    averageWaitMinutes: 12,
  };
}

export async function getSuggestedBookingDates() {
  const clinic = await getClinicSettings();

  return Array.from({ length: Math.min(clinic.bookingHorizonDays, 7) }, (_, index) =>
    toDateKey(addDays(new Date(), index + 1)),
  );
}

export async function listAvailability(
  doctorId: string,
  date: string,
): Promise<AvailabilitySlot[]> {
  const supabase = await getReadClient();

  if (!supabase) {
    return [];
  }

  const schedule = await getScheduleSnapshot(doctorId, date);

  if (!schedule) {
    return [];
  }

  const { data, error } = await supabase
    .from("appointments")
    .select("requested_time")
    .eq("doctor_id", doctorId)
    .eq("requested_date", date)
    .in("status", ["pending", "confirmed"]);

  throwIfError(error);

  const bookedTimes = new Map<string, number>();
  const activeAppointmentCount = (data ?? []).length;

  for (const row of data ?? []) {
    const time = trimTime((row as { requested_time: string }).requested_time);
    bookedTimes.set(time, (bookedTimes.get(time) ?? 0) + 1);
  }

  const remainingDailyTokens = Math.max(
    schedule.dailyTokenLimit - activeAppointmentCount,
    0,
  );

  return getTimeSlots(
    schedule.startTime,
    schedule.endTime,
    schedule.slotDurationMinutes,
  ).map((time) => {
    const bookedCount = bookedTimes.get(time) ?? 0;

    return {
      time,
      label: formatTimeLabel(time),
      remainingDailyTokens,
      bookedCount,
      isOpen: bookedCount === 0 && remainingDailyTokens > 0,
    };
  });
}

export async function listAppointmentsForUser(userId: string) {
  const supabase = await getReadClient();

  if (!supabase) {
    return [] as AppointmentWithDoctor[];
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, user_id, user_name, user_email, phone, doctor_id, requested_date, requested_time, requested_at, reason, notes, admin_note, status, token_number, linked_appointment_id, doctor:doctors(id, slug, name, title, specialty, bio, focus_areas, languages, years_experience, duration_minutes, room_label, accent_color, active)",
    )
    .eq("user_id", userId)
    .order("requested_date", { ascending: false })
    .order("requested_time", { ascending: false });

  throwIfError(error);

  return (data ?? [])
    .map((row) => mapAppointmentWithDoctor(row as AppointmentRow))
    .filter(Boolean)
    .sort((left, right) => {
      const leftValue = appointmentDateTimeValue(
        left!.requestedDate,
        left!.requestedTime,
      ).getTime();
      const rightValue = appointmentDateTimeValue(
        right!.requestedDate,
        right!.requestedTime,
      ).getTime();

      return rightValue - leftValue;
    }) as AppointmentWithDoctor[];
}

export async function getAppointmentForUser(appointmentId: string, userId: string) {
  const supabase = await getReadClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, user_id, user_name, user_email, phone, doctor_id, requested_date, requested_time, requested_at, reason, notes, admin_note, status, token_number, linked_appointment_id, doctor:doctors(id, slug, name, title, specialty, bio, focus_areas, languages, years_experience, duration_minutes, room_label, accent_color, active)",
    )
    .eq("id", appointmentId)
    .eq("user_id", userId)
    .maybeSingle();

  throwIfError(error);
  return data ? mapAppointmentWithDoctor(data as AppointmentRow) : null;
}

export async function listAdminAppointments() {
  const supabase = await getReadClient();

  if (!supabase) {
    return {
      pending: [] as AppointmentWithDoctor[],
      active: [] as AppointmentWithDoctor[],
      archive: [] as AppointmentWithDoctor[],
    };
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, user_id, user_name, user_email, phone, doctor_id, requested_date, requested_time, requested_at, reason, notes, admin_note, status, token_number, linked_appointment_id, doctor:doctors(id, slug, name, title, specialty, bio, focus_areas, languages, years_experience, duration_minutes, room_label, accent_color, active)",
    )
    .order("requested_date", { ascending: true })
    .order("requested_time", { ascending: true });

  throwIfError(error);

  const appointments = (data ?? [])
    .map((row) => mapAppointmentWithDoctor(row as AppointmentRow))
    .filter(Boolean) as AppointmentWithDoctor[];

  return {
    pending: appointments.filter((appointment) => appointment.status === "pending"),
    active: appointments.filter((appointment) => appointment.status === "confirmed"),
    archive: appointments.filter(
      (appointment) =>
        appointment.status !== "pending" && appointment.status !== "confirmed",
    ),
  };
}

export async function getAdminMetrics() {
  const supabase = await getReadClient();

  if (!supabase) {
    return {
      totalBookings: 0,
      notificationsSent: 0,
      activeDoctors: 0,
      pendingApprovals: 0,
    };
  }

  const [
    { count: bookingCount, error: bookingError },
    { count: notificationCount, error: notificationError },
    { count: doctorCount, error: doctorError },
    { count: pendingCount, error: pendingError },
  ] = await Promise.all([
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("notification_logs").select("*", { count: "exact", head: true }),
    supabase
      .from("doctors")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  throwIfError(bookingError);
  throwIfError(notificationError);
  throwIfError(doctorError);
  throwIfError(pendingError);

  return {
    totalBookings: bookingCount ?? 0,
    notificationsSent: notificationCount ?? 0,
    activeDoctors: doctorCount ?? 0,
    pendingApprovals: pendingCount ?? 0,
  };
}

export async function getDoctorSchedules() {
  const supabase = await getReadClient();

  if (!supabase) {
    return [] as Array<{
      doctor: Doctor;
      rules: DoctorScheduleRule[];
      overrides: DoctorScheduleOverride[];
    }>;
  }

  const [doctors, rules, overrides] = await Promise.all([
    listDoctors({ includeInactive: true }),
    supabase
      .from("doctor_schedule_rules")
      .select(
        "id, doctor_id, weekday, start_time, end_time, slot_duration_minutes, daily_token_limit",
      )
      .order("weekday", { ascending: true }),
    supabase
      .from("doctor_schedule_overrides")
      .select(
        "id, doctor_id, date, closed, start_time, end_time, slot_duration_minutes, daily_token_limit, note",
      )
      .order("date", { ascending: true }),
  ]);

  throwIfError(rules.error);
  throwIfError(overrides.error);

  const mappedRules = (rules.data ?? []).map((row) =>
    mapScheduleRule(row as DoctorScheduleRuleRow),
  );
  const mappedOverrides = (overrides.data ?? []).map((row) =>
    mapScheduleOverride(row as DoctorScheduleOverrideRow),
  );

  return doctors.map((doctor) => ({
    doctor,
    rules: mappedRules.filter((rule) => rule.doctorId === doctor.id),
    overrides: mappedOverrides.filter((override) => override.doctorId === doctor.id),
  }));
}

export async function updateProfilePhone(profileId: string, phone: string) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ phone })
    .eq("id", profileId);

  throwIfError(error);
}

export async function submitBooking(input: {
  doctorId: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  notes: string;
  phone: string;
}) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_appointment_request", {
    p_doctor_id: input.doctorId,
    p_requested_date: input.requestedDate,
    p_requested_time: input.requestedTime,
    p_reason: input.reason,
    p_notes: input.notes,
    p_phone: input.phone,
  });

  throwIfError(error);
  return data ? mapAppointment(data as AppointmentRow) : null;
}

export async function cancelAppointment(appointmentId: string) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("cancel_appointment_request", {
    p_appointment_id: appointmentId,
  });

  throwIfError(error);
  return data ? mapAppointment(data as AppointmentRow) : null;
}

export async function requestReschedule(input: {
  appointmentId: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  notes: string;
}) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("request_appointment_reschedule", {
    p_appointment_id: input.appointmentId,
    p_requested_date: input.requestedDate,
    p_requested_time: input.requestedTime,
    p_reason: input.reason,
    p_notes: input.notes,
  });

  throwIfError(error);
  return data ? mapAppointment(data as AppointmentRow) : null;
}

export async function approveAppointment(appointmentId: string, note: string) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("approve_appointment_request", {
    p_appointment_id: appointmentId,
    p_admin_note: note || null,
  });

  throwIfError(error);
  return data ? mapAppointment(data as AppointmentRow) : null;
}

export async function rejectAppointment(appointmentId: string, note: string) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("reject_appointment_request", {
    p_appointment_id: appointmentId,
    p_admin_note: note || null,
  });

  throwIfError(error);
  return data ? mapAppointment(data as AppointmentRow) : null;
}

export async function createDoctor(input: {
  name: string;
  title: string;
  specialty: string;
  durationMinutes: number;
  roomLabel: string;
  bio: string;
  focusAreas: string;
  languages: string;
}) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("doctors")
    .insert({
      slug: slugify(input.name),
      name: input.name,
      title: input.title,
      specialty: input.specialty,
      duration_minutes: input.durationMinutes,
      room_label: input.roomLabel,
      bio: input.bio,
      focus_areas: input.focusAreas
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      languages: input.languages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      years_experience: 5,
      accent_color: "#0f766e",
      active: true,
    })
    .select(
      "id, slug, name, title, specialty, bio, focus_areas, languages, years_experience, duration_minutes, room_label, accent_color, active",
    )
    .single();

  throwIfError(error);
  return mapDoctor(data as DoctorRow);
}

export async function toggleDoctorActive(doctorId: string) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const existingDoctor = await getDoctorById(doctorId);

  if (!existingDoctor) {
    throw new Error("Doctor not found.");
  }

  const { data, error } = await supabase
    .from("doctors")
    .update({ active: !existingDoctor.active })
    .eq("id", doctorId)
    .select(
      "id, slug, name, title, specialty, bio, focus_areas, languages, years_experience, duration_minutes, room_label, accent_color, active",
    )
    .single();

  throwIfError(error);
  return mapDoctor(data as DoctorRow);
}

export async function upsertScheduleRule(input: {
  doctorId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  dailyTokenLimit: number;
}) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("doctor_schedule_rules")
    .upsert(
      {
        doctor_id: input.doctorId,
        weekday: input.weekday,
        start_time: input.startTime,
        end_time: input.endTime,
        slot_duration_minutes: input.slotDurationMinutes,
        daily_token_limit: input.dailyTokenLimit,
      },
      { onConflict: "doctor_id,weekday" },
    )
    .select(
      "id, doctor_id, weekday, start_time, end_time, slot_duration_minutes, daily_token_limit",
    )
    .single();

  throwIfError(error);
  return mapScheduleRule(data as DoctorScheduleRuleRow);
}

export async function addScheduleOverride(input: {
  doctorId: string;
  date: string;
  closed: boolean;
  startTime?: string;
  endTime?: string;
  slotDurationMinutes?: number;
  dailyTokenLimit?: number;
  note?: string;
}) {
  assertConfigured();
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("doctor_schedule_overrides")
    .upsert(
      {
        doctor_id: input.doctorId,
        date: input.date,
        closed: input.closed,
        start_time: input.startTime || null,
        end_time: input.endTime || null,
        slot_duration_minutes: input.slotDurationMinutes ?? null,
        daily_token_limit: input.dailyTokenLimit ?? null,
        note: input.note ?? null,
      },
      { onConflict: "doctor_id,date" },
    )
    .select(
      "id, doctor_id, date, closed, start_time, end_time, slot_duration_minutes, daily_token_limit, note",
    )
    .single();

  throwIfError(error);
  return mapScheduleOverride(data as DoctorScheduleOverrideRow);
}
