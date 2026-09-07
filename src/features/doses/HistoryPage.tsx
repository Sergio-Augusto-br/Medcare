import { useQuery } from "@tanstack/react-query";
import { subDays, format, parseISO } from "date-fns";
import { useState } from "react";
import { usePatient } from "@/features/care/usePatient";
import { userMessage } from "@/lib/errors";
import DoseCard from "./DoseCard";
import { fetchDoses } from "./api";
import { adherenceSummary, dateInTimezone } from "./utils";

export default function HistoryPage() {
  const { patient, isPending: patientPending, error: patientError, can } = usePatient();
  const [period, setPeriod] = useState(30);
  const canRead = can("history") || can("manage");
  const canRecord = can("record") || can("manage");
  const endDate = patient ? dateInTimezone(new Date(), patient.timezone) : "";
  const startDate = endDate ? format(subDays(parseISO(endDate), period - 1), "yyyy-MM-dd") : "";
  const doses = useQuery({
    queryKey: ["dose-history", patient?.id, period, endDate],
    enabled: Boolean(patient && endDate && canRead),
    queryFn: () => fetchDoses(patient!.id, startDate, endDate),
  });
  const summary = adherenceSummary(doses.data ?? []);
  const queryError = patientError ?? doses.error;

  return (
    <div className="account-page dose-page">
      <header>
        <p className="account-eyebrow">HISTÓRICO</p>
        <h1>Seus registros</h1>
        <p className="account-muted">
          Indicadores calculados a partir das doses previstas no período.
        </p>
      </header>
      <div className="account-tabs dose-period-tabs" aria-label="Período do histórico">
        {[7, 30, 90].map((days) => (
          <button
            type="button"
            key={days}
            aria-pressed={period === days}
            onClick={() => setPeriod(days)}
          >
            {days} dias
          </button>
        ))}
      </div>
      {queryError && <p className="account-notice error">{userMessage(queryError)}</p>}
      {(patientPending || doses.isPending) && (
        <p className="account-notice">Carregando histórico…</p>
      )}
      {!canRead && !patientPending && (
        <p className="account-notice warning">
          Você não possui permissão para consultar este histórico.
        </p>
      )}
      {!doses.isPending && !queryError && canRead && (
        <section className="dose-history-summary account-card">
          <div>
            <strong>{summary.percentage === null ? "—" : `${summary.percentage}%`}</strong>
            <span>doses tomadas</span>
          </div>
          <p>
            {summary.taken} tomadas · {summary.notTaken} não tomadas · {summary.pending} sem
            registro
          </p>
        </section>
      )}
      {!doses.isPending && doses.data?.length === 0 && (
        <section className="account-card medication-empty">
          <h2>Sem ocorrências no período</h2>
          <p className="account-muted">O histórico aparecerá depois que uma rotina gerar doses.</p>
        </section>
      )}
      <div className="dose-live-list">
        {doses.data
          ?.slice()
          .reverse()
          .map((dose) => (
            <DoseCard dose={dose} showDate canRecord={canRecord} key={dose.id} />
          ))}
      </div>
    </div>
  );
}
