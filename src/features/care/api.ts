import { requireSupabase } from "@/lib/supabase";
import type { AccessiblePatient, InviteStatus, Permission } from "@/types";

export interface InvitationRow {
  id: string;
  patient_id: string;
  invited_email: string;
  relation: string;
  permissions: Permission[];
  status: InviteStatus;
  expires_at: string;
  created_at: string;
  patients?: { name: string } | null;
}

export interface MembershipRow {
  id: string;
  patient_id: string;
  user_id: string;
  member_name: string;
  member_email: string;
  relation: string;
  permissions: Permission[];
  created_at: string;
  revoked_at: string | null;
}

export async function fetchAccessiblePatients() {
  const { data, error } = await requireSupabase().rpc("list_accessible_patients");
  if (error) throw error;
  return (data ?? []) as AccessiblePatient[];
}

export async function fetchPatientInvitations(patientId: string) {
  const { data, error } = await requireSupabase()
    .from("invitations")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InvitationRow[];
}

export async function fetchMyInvitations() {
  const { data, error } = await requireSupabase()
    .from("invitations")
    .select("*,patients(name)")
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InvitationRow[];
}

export async function fetchMemberships(patientId: string) {
  const { data, error } = await requireSupabase()
    .from("patient_memberships")
    .select("*")
    .eq("patient_id", patientId)
    .is("revoked_at", null)
    .order("member_name");
  if (error) throw error;
  return (data ?? []) as MembershipRow[];
}

export async function createInvitation(
  patientId: string,
  email: string,
  relation: string,
  permissions: Permission[],
) {
  const { data, error } = await requireSupabase().rpc("create_invitation", {
    p_patient_id: patientId,
    p_invited_email: email,
    p_relation: relation,
    p_permissions: permissions,
  });
  if (error) throw error;
  return data as string;
}

export async function respondToInvitation(invitationId: string, accept: boolean) {
  const { data, error } = await requireSupabase().rpc("respond_to_invitation", {
    p_invitation_id: invitationId,
    p_accept: accept,
  });
  if (error) throw error;
  return data as string | null;
}

export async function updateMembership(
  membershipId: string,
  permissions: Permission[],
  revoke = false,
) {
  const { data, error } = await requireSupabase().rpc("update_membership_access", {
    p_membership_id: membershipId,
    p_permissions: permissions,
    p_revoke: revoke,
  });
  if (error) throw error;
  return data as string;
}

export async function cancelInvitation(invitationId: string) {
  const { data, error } = await requireSupabase().rpc("cancel_invitation", {
    p_invitation_id: invitationId,
  });
  if (error) throw error;
  return data as string;
}
