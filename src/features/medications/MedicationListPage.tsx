import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { QueryCacheMediator } from "@/app/QueryCacheMediator";
import { FormNotice } from "@/features/auth/AuthLayout";
import { usePatient } from "@/features/care/usePatient";
import { userMessage } from "@/lib/errors";
import type { MedicationRoutineRow } from "@/types";
import { archiveMedicationRoutine, currentSchedule, fetchMedicationRoutines } from "./api";

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function scheduleDescription(medication: MedicationRoutineRow) {
  const schedule = currentSchedule(medication);
  if (!schedule) return "Programação indisponível";
  const times = schedule.times.map((time) => time.slice(0, 5)).join(" · ");
  const days =
    schedule.weekdays.length === 7
      ? "Todos os dias"
      : schedule.weekdays.map((day) => weekdayLabels[day]).join(", ");
  return `${times} — ${days}`;
}

export default function MedicationListPage() {
  const { patient, isPending: patientPending, error: patientError, can } = usePatient();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string>();
  const archived = searchParams.get("status") === "arquivados";
  const notice = (location.state as { message?: string } | null)?.message;

  const canRead = can("medications") || can("manage");
  const canManage = can("manage");
  const medications = useQuery({
    queryKey: ["medications", patient?.id, archived],
    enabled: Boolean(patient && canRead),
    queryFn: () => fetchMedicationRoutines(patient!.id, archived),
  });

  const visibleMedications = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedSearch) return medications.data ?? [];
    return (medications.data ?? []).filter((medication) =>
      `${medication.name} ${medication.strength} ${medication.unit}`
        .toLocaleLowerCase("pt-BR")
        .includes(normalizedSearch),
    );
  }, [medications.data, search]);

  const archiveMutation = useMutation({
    mutationFn: (medication: MedicationRoutineRow) =>
      archiveMedicationRoutine(medication.id, medication.version),
    onSuccess: async (medicationId) => {
      setError(undefined);
      if (patient) {
        await new QueryCacheMediator(queryClient).medicationChanged(patient.id, medicationId);
      }
    },
    onError: (mutationError) => setError(userMessage(mutationError)),
  });

  function requestArchive(medication: MedicationRoutineRow) {
    if (
      window.confirm(
        `Arquivar ${medication.name}? As doses futuras pendentes serão removidas e o histórico será preservado.`,
      )
    ) {
      archiveMutation.mutate(medication);
    }
  }

  const isPending = patientPending || medications.isPending;
  const queryError = patientError ?? medications.error;

  return (
    <div className="account-page medication-page">
      <header className="medication-page-header">
        <div>
          <p className="account-eyebrow">MINHA ROTINA</p>
          <h1>Medicamentos</h1>
          <p className="account-muted">Cadastre o que usa e defina quando cada dose é esperada.</p>
        </div>
        {!archived && canManage && (
          <Link className="account-button" to="/app/medicamentos/novo">
            + Adicionar medicamento
          </Link>
        )}
      </header>

      <FormNotice tone="success" message={notice} />
      <FormNotice message={error ?? (queryError ? userMessage(queryError) : undefined)} />
      {!canRead && !patientPending && (
        <p className="account-notice warning">
          Você não possui permissão para consultar estes medicamentos.
        </p>
      )}

      <div className="medication-toolbar">
        <label className="medication-search" htmlFor="medication-search">
          <span>Buscar medicamento</span>
          <input
            id="medication-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ex.: Metformina"
          />
        </label>
        <div className="account-tabs" aria-label="Situação dos medicamentos">
          <button type="button" aria-pressed={!archived} onClick={() => setSearchParams({})}>
            Ativos
          </button>
          <button
            type="button"
            aria-pressed={archived}
            onClick={() => setSearchParams({ status: "arquivados" })}
          >
            Arquivados
          </button>
        </div>
      </div>

      {isPending && (
        <p className="account-notice" role="status">
          Carregando medicamentos…
        </p>
      )}

      {!isPending && !queryError && visibleMedications.length === 0 && (
        <section className="account-card medication-empty">
          <span className="medication-empty-icon" aria-hidden="true">
            +
          </span>
          <h2>
            {search
              ? "Nenhum resultado"
              : archived
                ? "Nenhum medicamento arquivado"
                : "Sua lista está vazia"}
          </h2>
          <p className="account-muted">
            {search
              ? "Tente outro nome ou concentração."
              : archived
                ? "Os medicamentos arquivados aparecerão aqui."
                : "Adicione seu primeiro medicamento para montar a rotina."}
          </p>
          {!search && !archived && canManage && (
            <Link className="account-button" to="/app/medicamentos/novo">
              Adicionar medicamento
            </Link>
          )}
        </section>
      )}

      <div className="medication-list">
        {visibleMedications.map((medication) => (
          <article className="account-card medication-card" key={medication.id}>
            <div className="medication-card-main">
              <span className={`account-badge${archived ? " pending" : ""}`}>
                {archived ? "Arquivado" : medication.form}
              </span>
              <h2>
                {medication.name}{" "}
                <small>
                  {medication.strength} {medication.unit}
                </small>
              </h2>
              <p className="medication-schedule">{scheduleDescription(medication)}</p>
              <p className="account-muted">{medication.quantity}</p>
              {medication.instructions && <p>{medication.instructions}</p>}
            </div>
            {!archived && canManage && (
              <div className="account-actions medication-card-actions">
                <Link
                  className="account-button secondary"
                  to={`/app/medicamentos/${medication.id}/editar`}
                >
                  Editar
                </Link>
                <button
                  className="account-link medication-archive-action"
                  type="button"
                  disabled={archiveMutation.isPending}
                  onClick={() => requestArchive(medication)}
                >
                  Arquivar
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
