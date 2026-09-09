import { describe, expect, it } from "vitest";
import type { AccessiblePatient } from "@/types";
import { PatientPermissionSpecification } from "./PatientPermissionSpecification";

const patients: AccessiblePatient[] = [
  {
    id: "owned",
    name: "Pessoa titular",
    timezone: "America/Manaus",
    kind: "self",
    is_owner: true,
    permissions: [],
  },
  {
    id: "shared",
    name: "Pessoa acompanhada",
    timezone: "America/Sao_Paulo",
    kind: "assisted",
    is_owner: false,
    permissions: ["history", "record"],
  },
];

describe("PatientPermissionSpecification", () => {
  const specification = new PatientPermissionSpecification(patients);

  it("concede todas as operações ao titular da rotina", () => {
    expect(specification.isSatisfiedBy("owned", "manage")).toBe(true);
  });

  it("considera as permissões do paciente do recurso", () => {
    expect(specification.isSatisfiedBy("shared", "record")).toBe(true);
    expect(specification.isSatisfiedBy("shared", "manage")).toBe(false);
  });

  it("nega acesso quando a rotina não está entre as acessíveis", () => {
    expect(specification.isSatisfiedBy("unknown", "history")).toBe(false);
  });
});
