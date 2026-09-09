import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { usePatient } from "@/features/care/usePatient";
import { userMessage } from "@/lib/errors";
import DoseCard from "./DoseCard";
import { dailyRoutineFacade } from "./DailyRoutineFacade";
import { dateInTimezone } from "./utils";

export default function AgendaPage() {
  const { patient, isPending: patientPending, error: patientError, can } = usePatient();
  const [selectedDate, setSelectedDate] = useState("");
  const canRead = can("history") || can("record") || can("manage");
  const canRecord = can("record") || can("manage");
  const today = patient ? dateInTimezone(new Date(), patient.timezone) : "";
  const date = selectedDate || today;
  const doses = useQuery({
    queryKey: ["doses", patient?.id, date],
    enabled: Boolean(patient && date && canRead),
    queryFn: () => dailyRoutineFacade.loadDate(patient!.id, date, today, can("manage")),
  });
  const queryError = patientError ?? doses.error;

  return (
    <div className="account-page dose-page">
      <header>
        <p className="account-eyebrow">AGENDA</p>
        <h1>Doses por dia</h1>
        <p className="account-muted">Escolha uma data para consultar as ocorrências programadas.</p>
      </header>
      <label className="account-card dose-date-picker" htmlFor="agenda-date">
        Data da agenda
        <input
          id="agenda-date"
          type="date"
          value={date}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
      </label>
      {queryError && <p className="account-notice error">{userMessage(queryError)}</p>}
      {(patientPending || doses.isPending) && <p className="account-notice">Carregando agenda…</p>}
      {!canRead && !patientPending && (
        <p className="account-notice warning">
          Você não possui permissão para consultar esta agenda.
        </p>
      )}
      {!doses.isPending && doses.data?.length === 0 && (
        <section className="account-card medication-empty">
          <h2>Nenhuma dose nesta data</h2>
          <p className="account-muted">
            Não encontramos ocorrências programadas para o dia escolhido.
          </p>
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
