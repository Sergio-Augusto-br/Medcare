import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { QueryCacheMediator } from "./QueryCacheMediator";

describe("QueryCacheMediator", () => {
  it("invalida todas as visões afetadas por uma alteração de dose", async () => {
    const client = new QueryClient();
    const affectedKeys = [
      ["doses", "patient-1", "2026-09-09"],
      ["dose-history", "patient-1", 30],
      ["dose", "dose-1"],
      ["dose-events", "dose-1"],
      ["metrics", "patient-1", 30],
      ["notifications", "user-1"],
    ];
    for (const key of affectedKeys) client.setQueryData(key, { cached: true });
    client.setQueryData(["profile", "user-1"], { cached: true });

    await new QueryCacheMediator(client).doseChanged("patient-1", "dose-1");

    for (const key of affectedKeys) {
      expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    }
    expect(client.getQueryState(["profile", "user-1"])?.isInvalidated).toBe(false);
  });

  it("remove todo o cache quando a sessão termina", () => {
    const client = new QueryClient();
    client.setQueryData(["notifications", "user-1"], [{ id: "private-data" }]);

    new QueryCacheMediator(client).sessionEnded();

    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });
});
