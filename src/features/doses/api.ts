import { requireSupabase } from "@/lib/supabase";
import type { DoseStatus } from "@/types";
import { SupabaseDoseAdapter } from "./SupabaseDoseAdapter";

function repository() {
  return new SupabaseDoseAdapter(requireSupabase());
}

export async function refreshOccurrences(patientId: string, startDate: string, endDate: string) {
  return repository().refreshOccurrences(patientId, startDate, endDate);
}

export async function fetchDoses(patientId: string, startDate: string, endDate = startDate) {
  return repository().findByPeriod(patientId, startDate, endDate);
}

export async function fetchDose(doseId: string) {
  return repository().findById(doseId);
}

export async function fetchDoseEvents(doseId: string) {
  return repository().findEvents(doseId);
}

export async function recordDose(
  doseId: string,
  status: DoseStatus,
  takenAt: string | null,
  reason: string,
  expectedVersion: number,
  requestId: string,
) {
  return repository().record({
    doseId,
    status,
    takenAt,
    reason,
    expectedVersion,
    requestId,
  });
}
