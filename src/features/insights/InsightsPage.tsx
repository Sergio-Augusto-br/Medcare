import { useQuery } from "@tanstack/react-query";
import { format, parseISO, subDays } from "date-fns";
import { useState } from "react";
import { usePatient } from "@/features/care/usePatient";
import { userMessage } from "@/lib/errors";
import { dateInTimezone } from "@/features/doses/utils";
import { fetchMetrics } from "./api";

function MetricBars({
  groups,
}: {
  groups: { label: string; total: number; taken: number; percentage: number | null }[];
}) {
  return (
    <div className="insight-bars">
      {groups.map((group) => (
        <div className="insight-bar" key={group.label}>
          <div>
            <strong>{group.label}</strong>
            <span>
              {group.taken} de {group.total} · {group.percentage ?? 0}%
            </span>
          </div>
          <div className="insight-track" aria-label={`${group.label}: ${group.percentage ?? 0}%`}>
            <span style={{ width: `${group.percentage ?? 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const { patient, can, isPending: patientPending } = usePatient();
  const [period, setPeriod] = useState(30);
  const allowed = can("adherence") || can("history") || can("manage");
  const endDate = patient ? dateInTimezone(new Date(), patient.timezone) : "";
  const startDate = endDate ? format(subDays(parseISO(endDate), period - 1), "yyyy-MM-dd") : "";
  const metrics = useQuery({
    queryKey: ["metrics", patient?.id, period, endDate],
    enabled: Boolean(patient && allowed && endDate),
    queryFn: () => fetchMetrics(patient!.id, startDate, endDate),
  });
  return (
    <div className="account-page insight-page">
      <header>
        <p className="account-eyebrow">INDICADORES</p>
        <h1>Acompanhamento da rotina</h1>
        <p className="account-muted">
          O percentual representa doses marcadas como tomadas entre todas as doses previstas no
          período.
        </p>
      </header>
      <div className="account-tabs dose-period-tabs">
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
      {!allowed && !patientPending && (
        <p className="account-notice warning">
          Você não possui permissão para consultar estes indicadores.
        </p>
      )}
      {(patientPending || metrics.isPending) && (
        <p className="account-notice">Calculando indicadores…</p>
      )}
      {metrics.isError && <p className="account-notice error">{userMessage(metrics.error)}</p>}
      {metrics.data && (
        <>
          <section className="account-card insight-hero">
            <div>
              <strong>
                {metrics.data.percentage === null ? "—" : `${metrics.data.percentage}%`}
              </strong>
              <span>doses tomadas</span>
            </div>
            <div className="insight-totals">
              <span>
                <b>{metrics.data.scheduled}</b> previstas
              </span>
              <span>
                <b>{metrics.data.taken}</b> tomadas
              </span>
              <span>
                <b>{metrics.data.notTaken}</b> não tomadas
              </span>
              <span>
                <b>{metrics.data.pending}</b> sem registro
              </span>
            </div>
          </section>
          <section className="account-card">
            <h2>Por período do dia</h2>
            {metrics.data.byPeriod.length ? (
              <MetricBars groups={metrics.data.byPeriod} />
            ) : (
              <p className="account-muted">Sem doses previstas no período.</p>
            )}
          </section>
          <section className="account-card">
            <h2>Evolução semanal</h2>
            {metrics.data.byWeek.length ? (
              <MetricBars
                groups={metrics.data.byWeek.map((week) => ({
                  ...week,
                  label: format(parseISO(week.label), "dd/MM"),
                }))}
              />
            ) : (
              <p className="account-muted">Sem dados semanais.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
