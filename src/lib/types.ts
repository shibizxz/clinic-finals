export type UserRole = "client" | "admin";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "rescheduled";

export type NotificationTemplate =
  | "request_received"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "reschedule_approved";

export interface ClinicSettings {
  name: string;
  address: string;
  timezone: string;
  bookingHorizonDays: number;
  supportPhone: string;
  whatsappDisplayNumber: string;
  notificationProvider: "meta-cloud";
}

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  phone: string | null;
  role: UserRole;
  avatarUrl?: string | null;
}

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  focusAreas: string[];
  languages: string[];
  yearsExperience: number;
  durationMinutes: number;
  roomLabel: string;
  accentColor: string;
  active: boolean;
}

export interface DoctorScheduleRule {
  id: string;
  doctorId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  dailyTokenLimit: number;
}

export interface DoctorScheduleOverride {
  id: string;
  doctorId: string;
  date: string;
  closed: boolean;
  startTime?: string | null;
  endTime?: string | null;
  slotDurationMinutes?: number | null;
  dailyTokenLimit?: number | null;
  note?: string | null;
}

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  phone: string;
  doctorId: string;
  requestedDate: string;
  requestedTime: string;
  requestedAt: string;
  reason: string;
  notes: string;
  adminNote: string | null;
  status: AppointmentStatus;
  tokenNumber: number | null;
  linkedAppointmentId: string | null;
}

export interface AppointmentHistoryEntry {
  id: string;
  appointmentId: string;
  actorId: string | null;
  actorRole: UserRole | "system";
  fromStatus: AppointmentStatus | null;
  toStatus: AppointmentStatus;
  note: string;
  createdAt: string;
}

export interface NotificationLogEntry {
  id: string;
  appointmentId: string;
  channel: "whatsapp";
  template: NotificationTemplate;
  status: "queued" | "sent" | "failed";
  recipient: string;
  provider: "meta-cloud";
  message: string;
  createdAt: string;
  failureReason?: string | null;
}

export interface AvailabilitySlot {
  time: string;
  label: string;
  remainingDailyTokens: number;
  bookedCount: number;
  isOpen: boolean;
}

export interface AppointmentWithDoctor extends Appointment {
  doctor: Doctor;
}

export interface DemoState {
  clinic: ClinicSettings;
  profiles: Profile[];
  doctors: Doctor[];
  scheduleRules: DoctorScheduleRule[];
  scheduleOverrides: DoctorScheduleOverride[];
  appointments: Appointment[];
  history: AppointmentHistoryEntry[];
  notifications: NotificationLogEntry[];
}

export interface DashboardStats {
  totalDoctors: number;
  pendingApprovals: number;
  confirmedToday: number;
  averageWaitMinutes: number;
}

export interface ViewerSession {
  mode: "anonymous" | "supabase";
  user: Profile | null;
  needsPhone: boolean;
}
