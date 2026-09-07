import { requireSupabase } from "@/lib/supabase";
import type { MedicationRoutineRow, PatientRow } from "@/types";
import type { MedicationRoutineValues } from "./schemas";
import { sortedRoutineValues } from "./schemas";

export async function fetchOwnPatient(userId: string) {
  const { data, error } = await requireSupabase()
    .from("patients")
    .select("*")
    .eq("owner_id", userId)
    .eq("kind", "self")
    .single();
  if (error) throw error;
  return data as PatientRow;
}

export async function fetchMedicationRoutines(patientId: string, archived: boolean) {
  let query = requireSupabase()
    .from("medications")
    .select("*,medication_schedules(*)")
    .eq("patient_id", patientId)
    .order("name");

  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MedicationRoutineRow[];
}

export async function fetchMedicationRoutine(medicationId: string) {
  const { data, error } = await requireSupabase()
    .from("medications")
    .select("*,medication_schedules(*)")
    .eq("id", medicationId)
    .is("archived_at", null)
    .single();
  if (error) throw error;
  return data as MedicationRoutineRow;
}

function routineParameters(values: MedicationRoutineValues) {
  const normalized = sortedRoutineValues(values);
  return {
    p_name: normalized.name,
    p_strength: normalized.strength,
    p_unit: normalized.unit,
    p_form: normalized.form,
    p_quantity: normalized.quantity,
    p_instructions: normalized.instructions,
    p_times: normalized.times.map((time) => time.value),
    p_weekdays: normalized.weekdays,
    p_start_date: normalized.startDate,
    p_end_date: normalized.endDate || null,
    p_timezone: normalized.timezone,
  };
}

export async function createMedicationRoutine(patientId: string, values: MedicationRoutineValues) {
  const { data, error } = await requireSupabase().rpc("create_medication_routine", {
    p_patient_id: patientId,
    ...routineParameters(values),
  });
  if (error) throw error;
  return data as string;
}

export async function updateMedicationRoutine(
  medicationId: string,
  expectedVersion: number,
  values: MedicationRoutineValues,
) {
  const { data, error } = await requireSupabase().rpc("update_medication_routine", {
    p_medication_id: medicationId,
    p_expected_version: expectedVersion,
    ...routineParameters(values),
  });
  if (error) throw error;
  return data as string;
}

export async function archiveMedicationRoutine(medicationId: string, expectedVersion: number) {
  const { data, error } = await requireSupabase().rpc("archive_medication_routine", {
    p_medication_id: medicationId,
    p_expected_version: expectedVersion,
  });
  if (error) throw error;
  return data as string;
}

export function currentSchedule(medication: MedicationRoutineRow) {
  return [...medication.medication_schedules].sort(
    (left, right) => right.version - left.version,
  )[0];
}
