import { useContext } from "react";
import { PatientContext } from "./patient-context";

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) throw new Error("O contexto da pessoa acompanhada não está disponível.");
  return context;
}
