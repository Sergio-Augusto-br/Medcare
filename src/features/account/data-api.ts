import { requireSupabase } from "@/lib/supabase";

export async function exportMyData() {
  const { data, error } = await requireSupabase().rpc("export_my_data");
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function deleteMyAccount() {
  const { data, error } = await requireSupabase().rpc("delete_my_account");
  if (error) throw error;
  return data as boolean;
}
