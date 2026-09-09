import type { DoseStatus } from "@/types";
import type { DoseEvent, DoseOccurrence } from "./model";

export interface RecordDoseInput {
  doseId: string;
  status: DoseStatus;
  takenAt: string | null;
  reason: string;
  expectedVersion: number;
  requestId: string;
}

export interface DoseRepository {
  refreshOccurrences(patientId: string, startDate: string, endDate: string): Promise<number>;
  findByPeriod(patientId: string, startDate: string, endDate: string): Promise<DoseOccurrence[]>;
  findById(doseId: string): Promise<DoseOccurrence>;
  findEvents(doseId: string): Promise<DoseEvent[]>;
  record(input: RecordDoseInput): Promise<DoseOccurrence>;
}
