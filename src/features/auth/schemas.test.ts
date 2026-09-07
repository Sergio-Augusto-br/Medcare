import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "./schemas";

describe("validação de contas", () => {
  it("normaliza o e-mail de login", () => {
    const result = loginSchema.parse({
      email: "  MARIA@EXEMPLO.COM ",
      password: "segredo",
    });
    expect(result.email).toBe("maria@exemplo.com");
  });

  it("recusa senhas fracas no cadastro", () => {
    const result = signupSchema.safeParse({
      name: "Maria",
      email: "maria@exemplo.com",
      password: "123456",
      passwordConfirmation: "123456",
      timezone: "America/Manaus",
    });
    expect(result.success).toBe(false);
  });

  it("recusa confirmação de senha diferente", () => {
    const result = signupSchema.safeParse({
      name: "Maria",
      email: "maria@exemplo.com",
      password: "MinhaSenha123",
      passwordConfirmation: "OutraSenha123",
      timezone: "America/Manaus",
    });
    expect(result.success).toBe(false);
  });
});
