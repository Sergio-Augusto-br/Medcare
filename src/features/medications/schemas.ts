import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const medicationRoutineSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome do medicamento.").max(160),
    strength: z.string().trim().min(1, "Informe a concentração.").max(40),
    unit: z.string().trim().min(1, "Informe a unidade.").max(30),
    form: z.string().trim().min(1, "Informe a forma farmacêutica.").max(50),
    quantity: z.string().trim().min(1, "Informe a quantidade por horário.").max(60),
    instructions: z.string().trim().max(500, "Use até 500 caracteres."),
    times: z
      .array(z.object({ value: z.string().regex(timePattern, "Informe um horário válido.") }))
      .min(1, "Informe ao menos um horário.")
      .max(24, "Use até 24 horários."),
    weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Selecione ao menos um dia da semana."),
    startDate: z.string().regex(datePattern, "Informe a data inicial."),
    endDate: z.union([z.literal(""), z.string().regex(datePattern, "Informe uma data válida.")]),
    timezone: z.string().trim().min(3, "Informe o fuso horário."),
  })
  .superRefine((values, context) => {
    const uniqueTimes = new Set(values.times.map((time) => time.value));
    if (uniqueTimes.size !== values.times.length) {
      context.addIssue({
        code: "custom",
        path: ["times"],
        message: "Não repita o mesmo horário.",
      });
    }
    if (values.endDate && values.endDate < values.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "A data final deve ser igual ou posterior à inicial.",
      });
    }
  });

export type MedicationRoutineValues = z.infer<typeof medicationRoutineSchema>;

export function sortedRoutineValues(values: MedicationRoutineValues) {
  return {
    ...values,
    times: [...values.times].sort((left, right) => left.value.localeCompare(right.value)),
    weekdays: [...new Set(values.weekdays)].sort((left, right) => left - right),
  };
}
