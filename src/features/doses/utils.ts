import type { DoseOccurrenceRow, DoseStatus } from "@/types";

export function dateInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function doseDisplayStatus(dose: DoseOccurrenceRow, now = new Date()) {
  if (dose.status === "taken") return "taken";
  if (dose.status === "not_taken") return "not_taken";
  return new Date(dose.scheduled_at) < now ? "late" : "pending";
}

export const doseStatusLabels: Record<DoseStatus | "late", string> = {
  pending: "Programada",
  late: "Atrasada",
  taken: "Tomada",
  not_taken: "Não tomada",
};

export function adherenceSummary(doses: DoseOccurrenceRow[]) {
  const taken = doses.filter((dose) => dose.status === "taken").length;
  const notTaken = doses.filter((dose) => dose.status === "not_taken").length;
  const pending = doses.filter((dose) => dose.status === "pending").length;
  return {
    total: doses.length,
    taken,
    notTaken,
    pending,
    percentage: doses.length ? Math.round((taken / doses.length) * 100) : null,
  };
}
