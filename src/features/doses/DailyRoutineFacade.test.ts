import { describe, expect, it, vi } from "vitest";
import { DailyRoutineFacade, type DailyRoutineServices } from "./DailyRoutineFacade";

function services(order: string[]) {
  return {
    refreshOccurrences: vi.fn(async () => {
      order.push("occurrences");
      return 1;
    }),
    refreshNotifications: vi.fn(async () => {
      order.push("notifications");
      return 1;
    }),
    fetchDoses: vi.fn(async () => {
      order.push("doses");
      return [];
    }),
  } satisfies DailyRoutineServices;
}

describe("DailyRoutineFacade", () => {
  it("coordena ocorrências, notificações e doses na ordem necessária", async () => {
    const order: string[] = [];
    const dependencies = services(order);
    const facade = new DailyRoutineFacade(dependencies);

    await facade.loadToday("patient-1", "2026-09-09", true);

    expect(order).toEqual(["occurrences", "notifications", "doses"]);
    expect(dependencies.refreshOccurrences).toHaveBeenCalledWith(
      "patient-1",
      "2026-09-09",
      "2026-12-08",
    );
  });

  it("somente consulta quando a pessoa não pode gerenciar a rotina", async () => {
    const order: string[] = [];
    const dependencies = services(order);

    await new DailyRoutineFacade(dependencies).loadToday("patient-1", "2026-09-09", false);

    expect(order).toEqual(["doses"]);
    expect(dependencies.refreshOccurrences).not.toHaveBeenCalled();
  });

  it("não gera ocorrências ao consultar uma data passada", async () => {
    const order: string[] = [];
    const dependencies = services(order);

    await new DailyRoutineFacade(dependencies).loadDate(
      "patient-1",
      "2026-09-08",
      "2026-09-09",
      true,
    );

    expect(order).toEqual(["doses"]);
  });
});
