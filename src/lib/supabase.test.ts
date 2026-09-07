import { describe, expect, it } from "vitest";
import { resolveDevelopmentServiceUrl } from "./supabase";

describe("endereço local do Supabase", () => {
  it("usa o endereço do computador quando a aplicação é aberta pela rede", () => {
    expect(resolveDevelopmentServiceUrl("http://127.0.0.1:54321", "192.168.1.6", true)).toBe(
      "http://192.168.1.6:54321",
    );
  });

  it("preserva o endereço de loopback no navegador local", () => {
    expect(resolveDevelopmentServiceUrl("http://127.0.0.1:54321", "localhost", true)).toBe(
      "http://127.0.0.1:54321",
    );
  });

  it("não altera a URL configurada em produção", () => {
    expect(
      resolveDevelopmentServiceUrl("https://dados.medcare.example", "app.medcare.example", false),
    ).toBe("https://dados.medcare.example");
  });
});
