import { requireSupabase } from "@/lib/supabase";

export interface NotificationRow {
  id: string;
  recipient_id: string;
  patient_id: string | null;
  dose_id: string | null;
  kind: "reminder" | "alert" | "invite";
  title: string;
  body: string;
  read_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export async function fetchNotifications() {
  const { data, error } = await requireSupabase()
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function refreshNotifications(patientId: string) {
  const { data, error } = await requireSupabase().rpc("refresh_patient_notifications", {
    p_patient_id: patientId,
  });
  if (error) throw error;
  return data as number;
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await requireSupabase()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw error;
}

export async function snoozeReminder(doseId: string, minutes: number) {
  const { data, error } = await requireSupabase().rpc("snooze_dose_reminder", {
    p_dose_id: doseId,
    p_minutes: minutes,
  });
  if (error) throw error;
  return data as string;
}
