import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FormNotice } from "@/features/auth/AuthLayout";
import { usePatient } from "@/features/care/usePatient";
import { userMessage } from "@/lib/errors";
import type { DoseOccurrenceRow, DoseStatus } from "@/types";
import { fetchDose, fetchDoseEvents, recordDose, type DoseEventRow } from "./api";
import { doseDisplayStatus, doseStatusLabels } from "./utils";

function localDateTime(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function DoseEditor({
  dose,
  events,
  canRecord,
}: {
  dose: DoseOccurrenceRow;
  events: DoseEventRow[];
  canRecord: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DoseStatus>(
    dose.status === "pending" ? "taken" : dose.status,
  );
  const [takenAt, setTakenAt] = useState(
    localDateTime(dose.taken_at ? new Date(dose.taken_at) : new Date()),
  );
  const [reason, setReason] = useState(dose.reason);
  const requestId = useRef(crypto.randomUUID());
  const mutation = useMutation({
    mutationFn: () =>
      recordDose(
        dose.id,
        status,
        status === "taken" ? new Date(takenAt).toISOString() : null,
        reason,
        dose.version,
        requestId.current,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["doses", dose.patient_id] });
      await queryClient.invalidateQueries({ queryKey: ["dose-history", dose.patient_id] });
      navigate("/app", { replace: true, state: { message: "Dose registrada com sucesso." } });
    },
  });
  const displayStatus = doseDisplayStatus(dose);

  return (
    <div className="account-page dose-page">
      <header>
        <Link className="account-link" to="/app">
          ← Voltar para hoje
        </Link>
        <span className={`dose-live-status ${displayStatus}`}>
          {doseStatusLabels[displayStatus]}
        </span>
        <h1>{dose.medication_snapshot.name}</h1>
        <p className="account-muted">
          {dose.medication_snapshot.strength} {dose.medication_snapshot.unit} ·{" "}
          {dose.medication_snapshot.quantity}
        </p>
      </header>
      <section className="account-card dose-details-summary">
        <div>
          <span>Data prevista</span>
          <strong>{format(new Date(`${dose.local_date}T12:00:00`), "dd/MM/yyyy")}</strong>
        </div>
        <div>
          <span>Horário previsto</span>
          <strong>{dose.scheduled_time.slice(0, 5)}</strong>
        </div>
        <div>
          <span>Fuso</span>
          <strong>{dose.timezone}</strong>
        </div>
      </section>
      {dose.medication_snapshot.instructions && (
        <p className="account-notice">{dose.medication_snapshot.instructions}</p>
      )}
      <FormNotice message={mutation.error ? userMessage(mutation.error) : undefined} />
      {canRecord ? (
        <form
          className="account-card account-form"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <h2>{dose.status === "pending" ? "Registrar dose" : "Corrigir registro"}</h2>
          <div className="dose-status-options">
            <label>
              <input
                type="radio"
                name="dose-status"
                checked={status === "taken"}
                onChange={() => setStatus("taken")}
              />
              <span>✓ Tomei</span>
            </label>
            <label>
              <input
                type="radio"
                name="dose-status"
                checked={status === "not_taken"}
                onChange={() => setStatus("not_taken")}
              />
              <span>Não tomei</span>
            </label>
            {dose.status !== "pending" && (
              <label>
                <input
                  type="radio"
                  name="dose-status"
                  checked={status === "pending"}
                  onChange={() => setStatus("pending")}
                />
                <span>Remover registro</span>
              </label>
            )}
          </div>
          {status === "taken" && (
            <label htmlFor="dose-taken-at">
              Horário em que tomou
              <input
                id="dose-taken-at"
                type="datetime-local"
                required
                value={takenAt}
                onChange={(event) => setTakenAt(event.target.value)}
              />
            </label>
          )}
          {status === "not_taken" && (
            <label htmlFor="dose-reason">
              Motivo <span className="account-help">(opcional)</span>
              <textarea
                id="dose-reason"
                rows={3}
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Ex.: esqueci, estava fora de casa"
              />
            </label>
          )}
          <button className="account-button" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Salvando…" : "Salvar registro"}
          </button>
        </form>
      ) : (
        <p className="account-notice warning">
          Você pode consultar esta dose, mas não possui permissão para registrar ou corrigir.
        </p>
      )}
      <section className="account-card dose-audit">
        <h2>Histórico de alterações</h2>
        {events.length === 0 && (
          <p className="account-muted">Esta dose ainda não possui registros.</p>
        )}
        {events.map((event) => (
          <article key={event.id}>
            <span className={`dose-live-status ${event.status}`}>
              {doseStatusLabels[event.status]}
            </span>
            <div>
              <strong>{event.actor_name}</strong>
              <small>{format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm")}</small>
              {event.reason && <p>Motivo: {event.reason}</p>}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default function DoseDetailsPage() {
  const { doseId } = useParams();
  const { can } = usePatient();
  const dose = useQuery({
    queryKey: ["dose", doseId],
    enabled: Boolean(doseId),
    queryFn: () => fetchDose(doseId!),
  });
  const events = useQuery({
    queryKey: ["dose-events", doseId],
    enabled: Boolean(doseId),
    queryFn: () => fetchDoseEvents(doseId!),
  });
  if (dose.isPending || events.isPending) return <p className="account-notice">Carregando dose…</p>;
  if (dose.isError || events.isError)
    return <FormNotice message={userMessage(dose.error ?? events.error)} />;
  return (
    <DoseEditor dose={dose.data} events={events.data} canRecord={can("record") || can("manage")} />
  );
}
