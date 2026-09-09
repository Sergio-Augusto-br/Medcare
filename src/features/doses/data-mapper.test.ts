import { describe, expect, it } from "vitest";
import { mapDoseEventRows, mapDoseRow, mapDoseRows } from "./data-mapper";

export const doseRowFixture = {
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
    instructions: "Após o café",
    medication_version: 2,
    schedule_version: 3,
  },
  status: "pending",
  taken_at: null,
  reason: "",
  recorded_by: null,
  recorded_at: null,
  snoozed_until: null,
  version: 1,
  created_at: "2026-09-09T10:00:00Z",
} as const;

describe("DoseDataMapper", () => {
  it("valida o DTO e converte snake_case para o modelo da aplicação", () => {
    const dose = mapDoseRow(doseRowFixture);

    expect(dose).toMatchObject({
      id: "dose-1",
      patientId: "patient-1",
      scheduledAt: "2026-09-09T11:00:00Z",
      scheduledTime: "08:00:00",
      medication: {
        name: "Medicamento teste",
        medicationVersion: 2,
        scheduleVersion: 3,
      },
    });
    expect(dose).not.toHaveProperty("patient_id");
    expect(dose.medication).not.toHaveProperty("medication_version");
  });

  it("rejeita uma lista que não atende ao contrato do banco", () => {
    expect(() => mapDoseRows([{ ...doseRowFixture, version: 0 }])).toThrow(
      "O servidor retornou dados de dose inválidos.",
    );
  });

  it("converte os eventos de auditoria", () => {
    expect(
      mapDoseEventRows([
        {
          id: "event-1",
          previous_status: "pending",
          status: "taken",
          taken_at: "2026-09-09T11:05:00Z",
          reason: "",
          actor_id: null,
          actor_name: "Conta removida",
          created_at: "2026-09-09T11:06:00Z",
        },
      ]),
    ).toEqual([
      {
        id: "event-1",
        previousStatus: "pending",
        status: "taken",
        takenAt: "2026-09-09T11:05:00Z",
        reason: "",
        actorId: null,
        actorName: "Conta removida",
        createdAt: "2026-09-09T11:06:00Z",
      },
    ]);
  });
});
