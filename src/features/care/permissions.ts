import type { Permission } from "@/types";

export const permissionOptions: { value: Permission; label: string; description: string }[] = [
  { value: "medications", label: "Ver medicamentos", description: "Consulta nomes e horários." },
  {
    value: "history",
    label: "Ver histórico",
    description: "Consulta doses e registros anteriores.",
  },
  {
    value: "adherence",
    label: "Ver indicadores",
    description: "Consulta contagens e percentuais.",
  },
  {
    value: "alerts",
    label: "Receber alertas",
    description: "Recebe avisos autorizados desta rotina.",
  },
  {
    value: "record",
    label: "Registrar doses",
    description: "Registra e corrige doses com autoria.",
  },
  { value: "manage", label: "Gerenciar rotina", description: "Edita medicamentos e horários." },
];
