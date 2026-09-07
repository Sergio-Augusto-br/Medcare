import { createContext } from "react";
import type { AccessiblePatient, Permission } from "@/types";

export interface PatientContextValue {
  patient: AccessiblePatient | null;
  patients: AccessiblePatient[];
  isPending: boolean;
  error: unknown;
  selectPatient: (patientId: string) => void;
  can: (permission: Permission) => boolean;
}

export const PatientContext = createContext<PatientContextValue | null>(null);
