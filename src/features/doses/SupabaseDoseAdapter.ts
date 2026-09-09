import type { SupabaseClient } from "@supabase/supabase-js";
import { mapDoseEventRows, mapDoseRow, mapDoseRows } from "./data-mapper";
import type { DoseRepository, RecordDoseInput } from "./repository";

export class SupabaseDoseAdapter implements DoseRepository {
  constructor(private readonly client: SupabaseClient) {}

  async refreshOccurrences(patientId: string, startDate: string, endDate: string) {
    const { data, error } = await this.client.rpc("refresh_dose_occurrences", {
      p_patient_id: patientId,
      p_range_start: startDate,
      p_range_end: endDate,
    });
    if (error) throw error;
    if (typeof data !== "number" || !Number.isFinite(data)) {
      throw new Error("O servidor retornou uma quantidade de doses inválida.");
    }
    return data;
  }

  async findByPeriod(patientId: string, startDate: string, endDate: string) {
    const { data, error } = await this.client
      .from("dose_occurrences")
      .select("*")
      .eq("patient_id", patientId)
      .gte("local_date", startDate)
      .lte("local_date", endDate)
      .order("scheduled_at");
    if (error) throw error;
    return mapDoseRows(data ?? []);
  }

  async findById(doseId: string) {
    const { data, error } = await this.client
      .from("dose_occurrences")
      .select("*")
      .eq("id", doseId)
      .single();
    if (error) throw error;
    return mapDoseRow(data);
  }

  async findEvents(doseId: string) {
    const { data, error } = await this.client.rpc("list_dose_events", {
      p_dose_id: doseId,
    });
    if (error) throw error;
    return mapDoseEventRows(data ?? []);
  }

  async record(input: RecordDoseInput) {
    const { data, error } = await this.client.rpc("record_dose", {
      p_dose_id: input.doseId,
      p_status: input.status,
      p_taken_at: input.takenAt,
      p_reason: input.reason,
      p_expected_version: input.expectedVersion,
      p_request_id: input.requestId,
    });
    if (error) throw error;
    return mapDoseRow(data);
  }
}
