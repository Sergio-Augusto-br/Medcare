import type { DoseStatus } from "@/types";

export interface MedicationSnapshot {
  name: string;
  strength: string;
  unit: string;
  form: string;
  quantity: string;
  instructions: string;
  medicationVersion: number;
  scheduleVersion: number;
}

export interface DoseOccurrence {
  id: string;
  patientId: string;
  medicationId: string;
  scheduleId: string;
  scheduledAt: string;
  localDate: string;
  scheduledTime: string;
  timezone: string;
  medication: MedicationSnapshot;
  status: DoseStatus;
  takenAt: string | null;
  reason: string;
  recordedBy: string | null;
  recordedAt: string | null;
  snoozedUntil: string | null;
  version: number;
  createdAt: string;
}

export interface DoseEvent {
  id: string;
  previousStatus: DoseStatus;
  status: DoseStatus;
  takenAt: string | null;
  reason: string;
  actorId: string | null;
  actorName: string;
  createdAt: string;
}
