export type Permission = "medications" | "history" | "adherence" | "alerts" | "record" | "manage";
export interface Profile {
  id: string;
  name: string;
  timezone: string;
  text_size: "standard" | "large" | "extra";
  high_contrast: boolean;
  reduced_motion: boolean;
  state_labels: boolean;
  reminders: boolean;
  caregiver_alerts: boolean;
  alert_delay_minutes: number;
  created_at: string;
  updated_at: string;
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
