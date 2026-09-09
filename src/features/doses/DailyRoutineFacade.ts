import { addDays, format, parseISO } from "date-fns";
import { refreshNotifications } from "@/features/notifications/api";
import { fetchDoses, refreshOccurrences } from "./api";
import type { DoseOccurrence } from "./model";

export interface DailyRoutineServices {
  fetchDoses(patientId: string, startDate: string, endDate?: string): Promise<DoseOccurrence[]>;
  refreshOccurrences(patientId: string, startDate: string, endDate: string): Promise<number>;
  refreshNotifications(patientId: string): Promise<number>;
}

export class DailyRoutineFacade {
  constructor(private readonly services: DailyRoutineServices) {}

  async loadToday(patientId: string, localDate: string, canManage: boolean) {
    if (canManage) {
      const endDate = format(addDays(parseISO(localDate), 90), "yyyy-MM-dd");
      await this.services.refreshOccurrences(patientId, localDate, endDate);
      await this.services.refreshNotifications(patientId);
    }
    return this.services.fetchDoses(patientId, localDate);
  }

  async loadDate(patientId: string, date: string, today: string, canManage: boolean) {
    if (canManage && date >= today) {
      await this.services.refreshOccurrences(patientId, date, date);
    }
    return this.services.fetchDoses(patientId, date);
  }
}

export const dailyRoutineFacade = new DailyRoutineFacade({
  fetchDoses,
  refreshOccurrences,
  refreshNotifications,
});
