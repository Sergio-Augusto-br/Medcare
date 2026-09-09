import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { SupabaseDoseAdapter } from "./SupabaseDoseAdapter";

const doseRow = {
  id: "dose-1",
  patient_id: "patient-1",
  medication_id: "medication-1",
  schedule_id: "schedule-1",
  scheduled_at: "2026-09-09T11:00:00Z",
  local_date: "2026-09-09",
  scheduled_time: "08:00:00",
  timezone: "America/Manaus",
  medication_snapshot: {
    name: "Medicamento teste",
    strength: "10",
    unit: "mg",
    form: "Comprimido",
    quantity: "1 comprimido",
    instructions: "",
    medication_version: 1,
    schedule_version: 1,
  },
  status: "taken",
  taken_at: "2026-09-09T11:01:00Z",
  reason: "",
  recorded_by: "user-1",
  recorded_at: "2026-09-09T11:02:00Z",
  snoozed_until: null,
  version: 2,
  created_at: "2026-09-09T10:00:00Z",
};

describe("SupabaseDoseAdapter", () => {
  it("traduz o comando de registro para os parâmetros da RPC", async () => {
    const rpc = vi.fn(async () => ({ data: doseRow, error: null }));
    const adapter = new SupabaseDoseAdapter({ rpc } as unknown as SupabaseClient);

    const result = await adapter.record({
      doseId: "dose-1",
      status: "taken",
      takenAt: "2026-09-09T11:01:00Z",
      reason: "",
      expectedVersion: 1,
      requestId: "request-1",
    });

    expect(rpc).toHaveBeenCalledWith("record_dose", {
      p_dose_id: "dose-1",
      p_status: "taken",
      p_taken_at: "2026-09-09T11:01:00Z",
      p_reason: "",
      p_expected_version: 1,
      p_request_id: "request-1",
    });
    expect(result).toMatchObject({ id: "dose-1", patientId: "patient-1", version: 2 });
  });

  it("propaga um erro devolvido pelo fornecedor", async () => {
    const supplierError = new Error("rpc unavailable");
    const rpc = vi.fn(async () => ({ data: null, error: supplierError }));
    const adapter = new SupabaseDoseAdapter({ rpc } as unknown as SupabaseClient);

    await expect(adapter.refreshOccurrences("patient-1", "2026-09-09", "2026-09-10")).rejects.toBe(
      supplierError,
    );
  });
});
