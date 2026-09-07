import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { FormNotice } from "@/features/auth/AuthLayout";
import { userMessage } from "@/lib/errors";
import { fetchMyInvitations, respondToInvitation } from "./api";
import { permissionOptions } from "./permissions";

export default function InvitationsPage() {
  const queryClient = useQueryClient();
  const invitations = useQuery({ queryKey: ["my-invitations"], queryFn: fetchMyInvitations });
  const response = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      respondToInvitation(id, accept),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-invitations"] }),
        queryClient.invalidateQueries({ queryKey: ["accessible-patients"] }),
      ]);
    },
  });
  return (
    <div className="account-page care-page">
      <header>
        <p className="account-eyebrow">CONVITES</p>
        <h1>Convites recebidos</h1>
        <p className="account-muted">O acesso só começa depois que você aceitar.</p>
      </header>
      <FormNotice
        message={
          invitations.error || response.error
            ? userMessage(invitations.error ?? response.error)
            : undefined
        }
      />
      {invitations.isPending && <p className="account-notice">Carregando convites…</p>}
      {!invitations.isPending && invitations.data?.length === 0 && (
        <section className="account-card medication-empty">
          <h2>Nenhum convite pendente</h2>
          <p className="account-muted">
            Novos convites enviados ao e-mail desta conta aparecerão aqui.
          </p>
        </section>
      )}
      <div className="care-list">
        {invitations.data?.map((invitation) => (
          <article className="account-card care-person-card" key={invitation.id}>
            <div>
              <span className="account-badge">{invitation.relation}</span>
              <h2>{invitation.patients?.name ?? "Rotina compartilhada"}</h2>
              <p className="account-muted">
                Expira em {format(new Date(invitation.expires_at), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            </div>
            <div className="care-permission-tags">
              {invitation.permissions.map((permission) => (
                <span key={permission}>
                  {permissionOptions.find((item) => item.value === permission)?.label}
                </span>
              ))}
            </div>
            <div className="account-actions">
              <button
                className="account-button"
                type="button"
                disabled={response.isPending}
                onClick={() => response.mutate({ id: invitation.id, accept: true })}
              >
                Aceitar
              </button>
              <button
                className="account-button secondary"
                type="button"
                disabled={response.isPending}
                onClick={() => response.mutate({ id: invitation.id, accept: false })}
              >
                Recusar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
