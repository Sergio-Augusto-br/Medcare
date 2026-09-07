export type Permission = "medications" | "history" | "adherence" | "alerts" | "record" | "manage";
export interface Preferences {
  textSize: "standard" | "large" | "extra";
  highContrast: boolean;
  reducedMotion: boolean;
  stateLabels: boolean;
  timezone: string;
  reminders: boolean;
  caregiverAlerts: boolean;
  alertDelayMinutes: number;
}
export interface Profile {
  id: string;
  name: string;
  timezone: string;
  text_size: Preferences["textSize"];
  high_contrast: boolean;
  reduced_motion: boolean;
  state_labels: boolean;
  reminders: boolean;
  caregiver_alerts: boolean;
  alert_delay_minutes: number;
  created_at: string;
  updated_at: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  pendingEmail?: string | null;
  preferences: Preferences;
}
export interface Patient {
  id: string;
  name: string;
  ownerId: string;
  timezone: string;
  permissions: Permission[];
}
export interface Schedule {
  times: string[];
  weekdays: number[];
  startDate: string;
  endDate: string | null;
  timezone: string;
}
export interface Medication {
  id: string;
  patientId: string;
  name: string;
  strength: string;
  unit: string;
  form: string;
  quantity: string;
  instructions: string;
  archived: boolean;
  schedule: Schedule;
  version: number;
}

export interface PatientRow {
  id: string;
  owner_id: string;
  name: string;
  timezone: string;
  kind: "self" | "assisted";
  created_at: string;
  updated_at: string;
}

export interface AccessiblePatient {
  id: string;
  name: string;
  timezone: string;
  kind: "self" | "assisted";
  is_owner: boolean;
  permissions: Permission[];
}

export interface MedicationScheduleRow {
  id: string;
  medication_id: string;
  times: string[];
  weekdays: number[];
  start_date: string;
  end_date: string | null;
  timezone: string;
  valid_from: string;
  valid_until: string | null;
  version: number;
  created_at: string;
}

export interface MedicationRoutineRow {
  id: string;
  patient_id: string;
  name: string;
  strength: string;
  unit: string;
  form: string;
  quantity: string;
  instructions: string;
  version: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  medication_schedules: MedicationScheduleRow[];
}
export type DoseStatus = "pending" | "taken" | "not_taken";
export interface DoseEvent {
  id: string;
  status: DoseStatus;
  previousStatus: DoseStatus;
  takenAt: string | null;
  reason: string;
  actorId: string;
  actorName: string;
  recordedAt: string;
}
export interface Dose {
  id: string;
  patientId: string;
  medicationId: string;
  name: string;
  strength: string;
  unit: string;
  form: string;
  quantity: string;
  instructions: string;
  scheduledAt: string;
  localDate: string;
  time: string;
  timezone: string;
  status: DoseStatus;
  takenAt: string | null;
  reason: string;
  actorName: string | null;
  recordedAt: string | null;
  version: number;
  events?: DoseEvent[];
}

export interface DoseOccurrenceRow {
  id: string;
  patient_id: string;
  medication_id: string;
  schedule_id: string;
  scheduled_at: string;
  local_date: string;
  scheduled_time: string;
  timezone: string;
  medication_snapshot: {
    name: string;
    strength: string;
    unit: string;
    form: string;
    quantity: string;
    instructions: string;
    medication_version: number;
    schedule_version: number;
  };
  status: DoseStatus;
  taken_at: string | null;
  reason: string;
  recorded_by: string | null;
  recorded_at: string | null;
  snoozed_until: string | null;
  version: number;
  created_at: string;
}
export interface DoseRecord {
  status: DoseStatus;
  takenAt: string | null;
  reason: string;
  expectedVersion: number;
  requestId: string;
}
export interface MetricGroup {
  label: string;
  total: number;
  taken: number;
  percentage: number | null;
}
export interface Metrics {
  scheduled: number;
  taken: number;
  notTaken: number;
  pending: number;
  percentage: number | null;
  byPeriod: MetricGroup[];
  byWeek: MetricGroup[];
}
export type InviteStatus = "pending" | "accepted" | "rejected" | "expired" | "cancelled";
export interface Invitation {
  id: string;
  patientId: string;
  patientName: string;
  email: string;
  relation: string;
  permissions: Permission[];
  status: InviteStatus;
  createdAt: string;
  expiresAt: string;
}
export interface Membership {
  id: string;
  patientId: string;
  userId: string;
  name: string;
  email: string;
  relation: string;
  permissions: Permission[];
  createdAt: string;
}
export interface Session {
  id: string;
  current: boolean;
  device: string;
  createdAt: string;
  lastSeenAt: string;
}
export interface AppNotification {
  id: string;
  patientId: string;
  patientName: string;
  doseId: string | null;
  title: string;
  body: string;
  kind: "reminder" | "alert" | "invite";
  createdAt: string;
  resolvedAt: string | null;
  read: boolean;
}
