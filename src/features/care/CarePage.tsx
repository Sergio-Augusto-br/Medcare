import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { FormNotice } from "@/features/auth/AuthLayout";
import { userMessage } from "@/lib/errors";
import type { Permission } from "@/types";
import {
  cancelInvitation,
  createInvitation,
  fetchMemberships,
  fetchPatientInvitations,
  type MembershipRow,
  updateMembership,
} from "./api";
import { permissionOptions } from "./permissions";
import PermissionOptions from "./PermissionOptions";
import { usePatient } from "./usePatient";

function MembershipCard({ membership }: { membership: MembershipRow }) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState(membership.permissions);
  const mutation = useMutation({
    mutationFn: (revoke: boolean) => updateMembership(membership.id, permissions, revoke),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["memberships", membership.patient_id] });
    },
  });
  return (
    <article className="account-card care-person-card">
      <div>
        <span className="account-badge">{membership.relation}</span>
        <h2>{membership.member_name}</h2>
        <p className="account-muted">{membership.member_email}</p>
      </div>
      <PermissionOptions
        value={permissions}
        onChange={setPermissions}
        disabled={mutation.isPending}
      />
      <FormNotice message={mutation.error ? userMessage(mutation.error) : undefined} />
      <div className="account-actions">
        <button
          className="account-button secondary"
          type="button"
          disabled={mutation.isPending || permissions.length === 0}
          onClick={() => mutation.mutate(false)}
        >
          Salvar permissões
        </button>
        <button
          className="account-button danger"
          type="button"
          disabled={mutation.isPending}
          onClick={() => {
            if (window.confirm(`Revogar o acesso de ${membership.member_name}?`))
              mutation.mutate(true);
          }}
        >
          Revogar acesso
        </button>
      </div>
    </article>
  );
}

export default function CarePage() {
  const { patient } = usePatient();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState("Familiar");
  const [permissions, setPermissions] = useState<Permission[]>([
    "medications",
    "history",
    "adherence",
    "alerts",
  ]);
  const [success, setSuccess] = useState<string>();
  const memberships = useQuery({
    queryKey: ["memberships", patient?.id],
    enabled: Boolean(patient?.is_owner),
    queryFn: () => fetchMemberships(patient!.id),
  });
  const invitations = useQuery({
    queryKey: ["patient-invitations", patient?.id],
    enabled: Boolean(patient?.is_owner),
    queryFn: () => fetchPatientInvitations(patient!.id),
  });
  const invite = useMutation({
    mutationFn: () => createInvitation(patient!.id, email, relation, permissions),
    onSuccess: async () => {
      setEmail("");
      setSuccess("Convite criado. A pessoa poderá aceitá-lo ao entrar com esse e-mail.");
      await queryClient.invalidateQueries({ queryKey: ["patient-invitations", patient?.id] });
    },
  });
  const cancel = useMutation({
    mutationFn: cancelInvitation,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["patient-invitations", patient?.id] }),
  });

  if (!patient) return <p className="account-notice">Carregando rotina…</p>;
  if (!patient.is_owner) {
    return (
      <div className="account-page">
        <header>
          <p className="account-eyebrow">ACOMPANHAMENTO</p>
          <h1>{patient.name}</h1>
          <p className="account-muted">Seu acesso é controlado pelo responsável desta rotina.</p>
        </header>
        <section className="account-card">
          <h2>Suas permissões</h2>
          <div className="care-permission-tags">
            {patient.permissions.map((permission) => (
              <span className="account-badge" key={permission}>
                {permissionOptions.find((item) => item.value === permission)?.label ?? permission}
              </span>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const activeInvitations =
    invitations.data?.filter(
      (item) => item.status === "pending" && new Date(item.expires_at) > new Date(),
    ) ?? [];
  const queryError = memberships.error ?? invitations.error;
  return (
    <div className="account-page care-page">
      <header>
        <p className="account-eyebrow">CUIDADO COMPARTILHADO</p>
        <h1>Pessoas de confiança</h1>
        <p className="account-muted">
          Convide alguém para acompanhar {patient.name} e escolha exatamente o que essa pessoa
          poderá fazer.
        </p>
      </header>
      <FormNotice tone="success" message={success} />
      <FormNotice
        message={
          invite.error || cancel.error
            ? userMessage(invite.error ?? cancel.error)
            : queryError
              ? userMessage(queryError)
              : undefined
        }
      />
      <form
        className="account-card account-form"
        onSubmit={(event) => {
          event.preventDefault();
          invite.mutate();
        }}
      >
        <h2>Novo convite</h2>
        <div className="account-columns">
          <label htmlFor="care-email">
            E-mail da pessoa
            <input
              id="care-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="pessoa@exemplo.com"
            />
          </label>
          <label htmlFor="care-relation">
            Relação
            <input
              id="care-relation"
              required
              minLength={2}
              maxLength={80}
              value={relation}
              onChange={(event) => setRelation(event.target.value)}
              placeholder="Ex.: filha, cuidador"
            />
          </label>
        </div>
        <PermissionOptions
          value={permissions}
          onChange={setPermissions}
          disabled={invite.isPending}
        />
        <button
          className="account-button"
          type="submit"
          disabled={invite.isPending || permissions.length === 0}
        >
          {invite.isPending ? "Criando convite…" : "Criar convite"}
        </button>
      </form>
      <section>
        <h2>Acessos ativos</h2>
        {memberships.isPending && <p className="account-notice">Carregando acessos…</p>}
        {memberships.data?.length === 0 && (
          <p className="account-card account-muted">Nenhuma pessoa acompanha esta rotina.</p>
        )}
        <div className="care-list">
          {memberships.data?.map((membership) => (
            <MembershipCard membership={membership} key={membership.id} />
          ))}
        </div>
      </section>
      <section>
        <h2>Convites pendentes</h2>
        {activeInvitations.length === 0 && (
          <p className="account-card account-muted">Nenhum convite pendente.</p>
        )}
        <div className="care-list">
          {activeInvitations.map((invitation) => (
            <article className="account-card care-invite-card" key={invitation.id}>
              <div>
                <strong>{invitation.invited_email}</strong>
                <p className="account-muted">
                  {invitation.relation} · válido até{" "}
                  {format(new Date(invitation.expires_at), "dd/MM/yyyy")}
                </p>
              </div>
              <button
                className="account-link"
                type="button"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate(invitation.id)}
              >
                Cancelar
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
