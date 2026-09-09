import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link, useLocation } from "react-router-dom";
import { FormNotice } from "@/features/auth/AuthLayout";
import { usePatient } from "@/features/care/usePatient";
import { userMessage } from "@/lib/errors";
import DoseCard from "./DoseCard";
import { dailyRoutineFacade } from "./DailyRoutineFacade";
import { adherenceSummary, dateInTimezone } from "./utils";

export default function TodayPage() {
  const { patient, isPending: patientPending, error: patientError, can } = usePatient();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;
  const canRead = can("history") || can("record") || can("manage");
  const canRecord = can("record") || can("manage");
  const canManage = can("manage");
  const localDate = patient ? dateInTimezone(new Date(), patient.timezone) : "";
  const doses = useQuery({
    queryKey: ["doses", patient?.id, localDate],
    enabled: Boolean(patient && localDate && canRead),
    queryFn: () => dailyRoutineFacade.loadToday(patient!.id, localDate, canManage),
  });
  const summary = adherenceSummary(doses.data ?? []);
  const queryError = patientError ?? doses.error;

  return (
    <div className="account-page dose-page">
      <header className="dose-page-heading">
        <div>
          <p className="account-eyebrow">HOJE</p>
          <h1>{patient?.name ? `Rotina de ${patient.name}` : "Sua rotina de hoje"}</h1>
          {localDate && (
            <p className="account-muted">
              {format(parseISO(localDate), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          )}
        </div>
        <Link className="account-button secondary" to="/app/agenda">
          Abrir agenda
        </Link>
      </header>

      <FormNotice message={successMessage} tone="success" />
      {queryError && <p className="account-notice error">{userMessage(queryError)}</p>}
      {(patientPending || doses.isPending) && (
        <p className="account-notice" role="status">
          Carregando doses…
        </p>
      )}

      {!canRead && !patientPending && (
        <p className="account-notice warning">
          Você não possui permissão para consultar as doses desta rotina.
        </p>
      )}

      {!doses.isPending && !queryError && canRead && (
        <section className="dose-summary account-card">
          <div>
            <strong>{summary.taken}</strong>
            <span>tomadas</span>
          </div>
          <div>
            <strong>{summary.pending}</strong>
            <span>pendentes</span>
          </div>
          <div>
            <strong>{summary.notTaken}</strong>
            <span>não tomadas</span>
          </div>
          <div>
            <strong>{summary.total}</strong>
            <span>previstas</span>
          </div>
        </section>
      )}

      {doses.data?.length === 0 && (
        <section className="account-card medication-empty">
          <span className="medication-empty-icon" aria-hidden="true">
            +
          </span>
          <h2>Nenhuma dose prevista hoje</h2>
          <p className="account-muted">
            Adicione um medicamento ou aproveite um dia sem registros.
          </p>
          {canManage && (
            <Link className="account-button" to="/app/medicamentos/novo">
              Adicionar medicamento
            </Link>
          )}
        </section>
      )}

      <div className="dose-live-list">
        {doses.data?.map((dose) => (
          <DoseCard dose={dose} canRecord={canRecord} key={dose.id} />
        ))}
      </div>
    </div>
  );
}
