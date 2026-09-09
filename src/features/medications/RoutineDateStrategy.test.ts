import { describe, expect, it } from "vitest";
import { PatientTimezoneDateStrategy } from "./RoutineDateStrategy";

describe("PatientTimezoneDateStrategy", () => {
  it("calcula a data no fuso do paciente, mesmo perto da meia-noite", () => {
    const strategy = new PatientTimezoneDateStrategy();
    const instant = new Date("2026-09-09T02:30:00Z");

    expect(strategy.today("America/Manaus", instant)).toBe("2026-09-08");
    expect(strategy.today("Asia/Tokyo", instant)).toBe("2026-09-09");
  });
});
