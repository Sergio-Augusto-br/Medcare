import { describe, expect, it } from "vitest";
import type { DoseOccurrence } from "./model";
import { adherenceSummary, dateInTimezone, doseDisplayStatus } from "./utils";

function dose(status: DoseOccurrence["status"], scheduledAt = "2026-09-06T12:00:00Z") {
  return { status, scheduledAt } as DoseOccurrence;
}

describe("estado e indicadores de doses", () => {
  it("distingue pendência futura de atraso", () => {
    expect(doseDisplayStatus(dose("pending"), new Date("2026-09-06T11:00:00Z"))).toBe("pending");
    expect(doseDisplayStatus(dose("pending"), new Date("2026-09-06T13:00:00Z"))).toBe("late");
  });

  it("calcula adesão a partir das ocorrências", () => {
    expect(
      adherenceSummary([dose("taken"), dose("taken"), dose("not_taken"), dose("pending")]),
    ).toEqual({
      total: 4,
      taken: 2,
      notTaken: 1,
      pending: 1,
      percentage: 50,
    });
  });

  it("calcula a data no fuso da rotina", () => {
    expect(dateInTimezone(new Date("2026-09-07T02:00:00Z"), "America/Manaus")).toBe("2026-09-06");
  });
});
