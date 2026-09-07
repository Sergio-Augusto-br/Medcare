import { describe, expect, it } from "vitest";
import { medicationRoutineSchema, sortedRoutineValues } from "./schemas";

const validRoutine = {
  name: "Metformina",
  strength: "500",
  unit: "mg",
  form: "Comprimido",
  quantity: "1 comprimido",
  instructions: "Tomar após a refeição",
  times: [{ value: "20:00" }, { value: "08:00" }],
  weekdays: [6, 0, 1],
  startDate: "2026-09-06",
  endDate: "",
  timezone: "America/Manaus",
};

describe("validação da rotina de medicamento", () => {
  it("ordena horários e dias antes do envio", () => {
    const values = medicationRoutineSchema.parse(validRoutine);
    expect(sortedRoutineValues(values).times.map((time) => time.value)).toEqual(["08:00", "20:00"]);
    expect(sortedRoutineValues(values).weekdays).toEqual([0, 1, 6]);
  });

  it("recusa horários repetidos", () => {
    const result = medicationRoutineSchema.safeParse({
      ...validRoutine,
      times: [{ value: "08:00" }, { value: "08:00" }],
    });
    expect(result.success).toBe(false);
  });

  it("recusa período invertido", () => {
    const result = medicationRoutineSchema.safeParse({
      ...validRoutine,
      startDate: "2026-09-10",
      endDate: "2026-09-09",
    });
    expect(result.success).toBe(false);
  });
});
