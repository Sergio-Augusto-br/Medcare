import { requireSupabase } from "@/lib/supabase";
import type { DoseOccurrenceRow, DoseStatus } from "@/types";

export interface DoseEventRow {
  id: string;
  previous_status: DoseStatus;
  status: DoseStatus;
  taken_at: string | null;
  reason: string;
  actor_id: string | null;
  actor_name: string;
  created_at: string;
}

export async function refreshOccurrences(patientId: string, startDate: string, endDate: string) {
  const { data, error } = await requireSupabase().rpc("refresh_dose_occurrences", {
    p_patient_id: patientId,
    p_range_start: startDate,
    p_range_end: endDate,
  });
  if (error) throw error;
  return data as number;
}

export async function fetchDoses(patientId: string, startDate: string, endDate = startDate) {
  const { data, error } = await requireSupabase()
    .from("dose_occurrences")
    .select("*")
    .eq("patient_id", patientId)
    .gte("local_date", startDate)
    .lte("local_date", endDate)
    .order("scheduled_at");
  if (error) throw error;
  return (data ?? []) as DoseOccurrenceRow[];
}

export async function fetchDose(doseId: string) {
  const { data, error } = await requireSupabase()
    .from("dose_occurrences")
    .select("*")
    .eq("id", doseId)
    .single();
  if (error) throw error;
  return data as DoseOccurrenceRow;
}

export async function fetchDoseEvents(doseId: string) {
  const { data, error } = await requireSupabase().rpc("list_dose_events", {
    p_dose_id: doseId,
  });
  if (error) throw error;
  return (data ?? []) as DoseEventRow[];
}

export async function recordDose(
  doseId: string,
  status: DoseStatus,
  takenAt: string | null,
  reason: string,
  expectedVersion: number,
  requestId: string,
) {
  const { data, error } = await requireSupabase().rpc("record_dose", {
    p_dose_id: doseId,
    p_status: status,
    p_taken_at: takenAt,
    p_reason: reason,
    p_expected_version: expectedVersion,
    p_request_id: requestId,
  });
  if (error) throw error;
  return data as DoseOccurrenceRow;
}
