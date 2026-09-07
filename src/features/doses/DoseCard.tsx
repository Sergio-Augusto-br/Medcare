import { format } from "date-fns";
import { Link } from "react-router-dom";
import type { DoseOccurrenceRow } from "@/types";
import { doseDisplayStatus, doseStatusLabels } from "./utils";

export default function DoseCard({
  dose,
  showDate = false,
  canRecord = true,
}: {
  dose: DoseOccurrenceRow;
  showDate?: boolean;
  canRecord?: boolean;
}) {
  const status = doseDisplayStatus(dose);
  const snapshot = dose.medication_snapshot;
  return (
    <article className={`dose-live-card dose-live-${status}`}>
      <div className="dose-live-time">
        <strong>{dose.scheduled_time.slice(0, 5)}</strong>
        {showDate && <small>{format(new Date(`${dose.local_date}T12:00:00`), "dd/MM")}</small>}
      </div>
      <div className="dose-live-content">
        <span className={`dose-live-status ${status}`}>{doseStatusLabels[status]}</span>
        <h2>
          {snapshot.name}{" "}
          <small>
            {snapshot.strength} {snapshot.unit}
          </small>
        </h2>
        <p>{snapshot.quantity}</p>
        {dose.status === "taken" && dose.taken_at && (
          <small>Registrada às {format(new Date(dose.taken_at), "HH:mm")}</small>
        )}
        {dose.status === "not_taken" && dose.reason && <small>Motivo: {dose.reason}</small>}
      </div>
      <Link className="account-button secondary dose-live-action" to={`/app/doses/${dose.id}`}>
        {dose.status === "pending" && canRecord ? "Registrar" : "Detalhes"}
      </Link>
    </article>
  );
}
