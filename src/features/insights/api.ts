import { requireSupabase } from "@/lib/supabase";
import type { Metrics } from "@/types";

export async function fetchMetrics(patientId: string, startDate: string, endDate: string) {
  const { data, error } = await requireSupabase().rpc("get_adherence_metrics", {
    p_patient_id: patientId,
    p_range_start: startDate,
    p_range_end: endDate,
  });
  if (error) throw error;
  return data as Metrics;
}
