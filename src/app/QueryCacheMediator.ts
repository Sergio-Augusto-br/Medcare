import type { QueryClient } from "@tanstack/react-query";

export class QueryCacheMediator {
  constructor(private readonly queryClient: QueryClient) {}

  async doseChanged(patientId: string, doseId: string) {
    await Promise.all([
      this.queryClient.invalidateQueries({ queryKey: ["doses", patientId] }),
      this.queryClient.invalidateQueries({ queryKey: ["dose-history", patientId] }),
      this.queryClient.invalidateQueries({ queryKey: ["dose", doseId] }),
      this.queryClient.invalidateQueries({ queryKey: ["dose-events", doseId] }),
      this.queryClient.invalidateQueries({ queryKey: ["metrics", patientId] }),
      this.queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
  }

  async medicationChanged(patientId: string, medicationId?: string) {
    const invalidations = [
      this.queryClient.invalidateQueries({ queryKey: ["medications", patientId] }),
      this.queryClient.invalidateQueries({ queryKey: ["doses", patientId] }),
      this.queryClient.invalidateQueries({ queryKey: ["dose-history", patientId] }),
      this.queryClient.invalidateQueries({ queryKey: ["metrics", patientId] }),
      this.queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ];
    if (medicationId) {
      invalidations.push(
        this.queryClient.invalidateQueries({ queryKey: ["medication", medicationId] }),
      );
    }
    await Promise.all(invalidations);
  }

  sessionEnded() {
    this.queryClient.clear();
  }
}
