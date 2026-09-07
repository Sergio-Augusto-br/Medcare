import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/useAuth";
import { fetchAccessiblePatients } from "./api";
import { PatientContext, type PatientContextValue } from "./patient-context";

export function PatientProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const storageKey = `medcare.selectedPatient.${user?.id ?? "anonymous"}`;
  const [requestedPatientId, setRequestedPatientId] = useState(() =>
    localStorage.getItem(storageKey),
  );
  const query = useQuery({
    queryKey: ["accessible-patients", user?.id],
    enabled: Boolean(user),
    queryFn: fetchAccessiblePatients,
  });
  const patients = useMemo(() => query.data ?? [], [query.data]);
  const patient =
    patients.find((item) => item.id === requestedPatientId) ??
    patients.find((item) => item.is_owner) ??
    patients[0] ??
    null;

  useEffect(() => {
    if (patient) localStorage.setItem(storageKey, patient.id);
  }, [patient, storageKey]);

  const value = useMemo<PatientContextValue>(
    () => ({
      patient,
      patients,
      isPending: query.isPending,
      error: query.error,
      selectPatient: setRequestedPatientId,
      can: (permission) => Boolean(patient?.is_owner || patient?.permissions.includes(permission)),
    }),
    [patient, patients, query.error, query.isPending],
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}
