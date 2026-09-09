export interface RoutineDateStrategy {
  today(timezone: string, now?: Date): string;
}

export class PatientTimezoneDateStrategy implements RoutineDateStrategy {
  today(timezone: string, now = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    return `${value("year")}-${value("month")}-${value("day")}`;
  }
}

export const routineDateStrategy = new PatientTimezoneDateStrategy();
