import type { AccessiblePatient, Permission } from "@/types";

export class PatientPermissionSpecification {
  constructor(private readonly patients: AccessiblePatient[]) {}

  isSatisfiedBy(patientId: string, permission: Permission) {
    const patient = this.patients.find((candidate) => candidate.id === patientId);
    return Boolean(patient?.is_owner || patient?.permissions.includes(permission));
  }
}
