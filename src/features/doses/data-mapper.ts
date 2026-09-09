import { z } from "zod";
import type { DoseEvent, DoseOccurrence } from "./model";

const nullableString = z.string().nullable();
const doseStatus = z.enum(["pending", "taken", "not_taken"]);

const doseRowSchema = z.object({
  id: z.string().min(1),
  patient_id: z.string().min(1),
  medication_id: z.string().min(1),
  schedule_id: z.string().min(1),
  scheduled_at: z.string().min(1),
  local_date: z.string().min(1),
  scheduled_time: z.string().min(1),
  timezone: z.string().min(1),
  medication_snapshot: z.object({
    name: z.string(),
    strength: z.string(),
    unit: z.string(),
    form: z.string(),
    quantity: z.string(),
    instructions: z.string(),
    medication_version: z.number().int().positive(),
    schedule_version: z.number().int().positive(),
  }),
  status: doseStatus,
  taken_at: nullableString,
  reason: z.string(),
  recorded_by: nullableString,
  recorded_at: nullableString,
  snoozed_until: nullableString,
  version: z.number().int().positive(),
  created_at: z.string().min(1),
});

const doseEventRowSchema = z.object({
  id: z.string().min(1),
  previous_status: doseStatus,
  status: doseStatus,
  taken_at: nullableString,
  reason: z.string(),
  actor_id: nullableString,
  actor_name: z.string(),
  created_at: z.string().min(1),
});

type DoseRow = z.infer<typeof doseRowSchema>;
type DoseEventRow = z.infer<typeof doseEventRowSchema>;

function toDose(row: DoseRow): DoseOccurrence {
  return {
    id: row.id,
    patientId: row.patient_id,
    medicationId: row.medication_id,
    scheduleId: row.schedule_id,
    scheduledAt: row.scheduled_at,
    localDate: row.local_date,
    scheduledTime: row.scheduled_time,
    timezone: row.timezone,
    medication: {
      name: row.medication_snapshot.name,
      strength: row.medication_snapshot.strength,
      unit: row.medication_snapshot.unit,
      form: row.medication_snapshot.form,
      quantity: row.medication_snapshot.quantity,
      instructions: row.medication_snapshot.instructions,
      medicationVersion: row.medication_snapshot.medication_version,
      scheduleVersion: row.medication_snapshot.schedule_version,
    },
    status: row.status,
    takenAt: row.taken_at,
    reason: row.reason,
    recordedBy: row.recorded_by,
    recordedAt: row.recorded_at,
    snoozedUntil: row.snoozed_until,
    version: row.version,
    createdAt: row.created_at,
  };
}

function toDoseEvent(row: DoseEventRow): DoseEvent {
  return {
    id: row.id,
    previousStatus: row.previous_status,
    status: row.status,
    takenAt: row.taken_at,
    reason: row.reason,
    actorId: row.actor_id,
    actorName: row.actor_name,
    createdAt: row.created_at,
  };
}

export function mapDoseRow(value: unknown) {
  return parseData(() => toDose(doseRowSchema.parse(value)));
}

export function mapDoseRows(value: unknown) {
  return parseData(() => z.array(doseRowSchema).parse(value).map(toDose));
}

export function mapDoseEventRows(value: unknown) {
  return parseData(() => z.array(doseEventRowSchema).parse(value).map(toDoseEvent));
}

function parseData<T>(parse: () => T) {
  try {
    return parse();
  } catch (cause) {
    throw new Error("O servidor retornou dados de dose inválidos.", { cause });
  }
}
