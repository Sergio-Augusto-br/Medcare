import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QueryCacheMediator } from "@/app/QueryCacheMediator";
import { FieldError, FormNotice } from "@/features/auth/AuthLayout";
import { PatientPermissionSpecification } from "@/features/care/PatientPermissionSpecification";
import { usePatient } from "@/features/care/usePatient";
import { userMessage } from "@/lib/errors";
import type { MedicationRoutineRow } from "@/types";
import {
  archiveMedicationRoutine,
  createMedicationRoutine,
  currentSchedule,
  fetchMedicationRoutine,
  updateMedicationRoutine,
} from "./api";
import { medicationRoutineSchema, type MedicationRoutineValues } from "./schemas";
import { routineDateStrategy } from "./RoutineDateStrategy";

const weekdays = [
  { value: 0, short: "D", label: "Domingo" },
  { value: 1, short: "S", label: "Segunda-feira" },
  { value: 2, short: "T", label: "Terça-feira" },
  { value: 3, short: "Q", label: "Quarta-feira" },
  { value: 4, short: "Q", label: "Quinta-feira" },
  { value: 5, short: "S", label: "Sexta-feira" },
  { value: 6, short: "S", label: "Sábado" },
];

function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Manaus";
}

function initialValues(timezone = browserTimezone()): MedicationRoutineValues {
  return {
    name: "",
    strength: "",
    unit: "mg",
    form: "Comprimido",
    quantity: "1 comprimido",
    instructions: "",
    times: [{ value: "08:00" }],
    weekdays: [0, 1, 2, 3, 4, 5, 6],
    startDate: routineDateStrategy.today(timezone),
    endDate: "",
    timezone,
  };
}

function medicationToValues(medication: MedicationRoutineRow): MedicationRoutineValues {
  const schedule = currentSchedule(medication);
  return {
    name: medication.name,
    strength: medication.strength,
    unit: medication.unit,
    form: medication.form,
    quantity: medication.quantity,
    instructions: medication.instructions,
    times: schedule.times.map((time) => ({ value: time.slice(0, 5) })),
    weekdays: schedule.weekdays,
    startDate: routineDateStrategy.today(schedule.timezone),
    endDate:
      schedule.end_date && schedule.end_date >= routineDateStrategy.today(schedule.timezone)
        ? schedule.end_date
        : "",
    timezone: schedule.timezone,
  };
}

export default function MedicationFormPage() {
  const { medicationId } = useParams();
  const editing = Boolean(medicationId);
  const {
    patient,
    patients,
    isPending: patientPending,
    error: patientError,
    selectPatient,
  } = usePatient();
  const permission = useMemo(() => new PatientPermissionSpecification(patients), [patients]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const form = useForm<MedicationRoutineValues>({
    resolver: zodResolver(medicationRoutineSchema),
    defaultValues: initialValues(),
  });
  const times = useFieldArray({ control: form.control, name: "times" });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const minimumDate = routineDateStrategy.today(patient?.timezone ?? browserTimezone());

  const medication = useQuery({
    queryKey: ["medication", medicationId],
    enabled: editing,
    queryFn: () => fetchMedicationRoutine(medicationId!),
  });

  useEffect(() => {
    if (medication.data) form.reset(medicationToValues(medication.data));
  }, [form, medication.data]);

  useEffect(() => {
    if (!editing && patient && !form.formState.isDirty) {
      form.reset(initialValues(patient.timezone));
    }
  }, [editing, form, patient]);

  useEffect(() => {
    if (medication.data && medication.data.patient_id !== patient?.id) {
      selectPatient(medication.data.patient_id);
    }
  }, [medication.data, patient?.id, selectPatient]);

  const saveMutation = useMutation({
    mutationFn: async (values: MedicationRoutineValues) => {
      if (!patient) throw new Error("A rotina ainda não foi carregada.");
      if (medication.data) {
        return updateMedicationRoutine(medication.data.id, medication.data.version, values);
      }
      return createMedicationRoutine(patient.id, {
        ...values,
        timezone: patient.timezone,
      });
    },
    onSuccess: async (medicationId) => {
      const patientId = medication.data?.patient_id ?? patient?.id;
      if (patientId) {
        await new QueryCacheMediator(queryClient).medicationChanged(patientId, medicationId);
      }
      navigate("/app/medicamentos", {
        replace: true,
        state: {
          message: editing
            ? "Medicamento e rotina atualizados."
            : "Medicamento adicionado à rotina.",
        },
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      if (!medication.data) throw new Error("Medicamento não encontrado.");
      return archiveMedicationRoutine(medication.data.id, medication.data.version);
    },
    onSuccess: async (medicationId) => {
      const patientId = medication.data?.patient_id ?? patient?.id;
      if (patientId) {
        await new QueryCacheMediator(queryClient).medicationChanged(patientId, medicationId);
      }
      navigate("/app/medicamentos", {
        replace: true,
        state: { message: "Medicamento arquivado. O histórico foi preservado." },
      });
    },
  });

  function requestArchive() {
    if (
      medication.data &&
      window.confirm(
        `Arquivar ${medication.data.name}? As doses futuras pendentes serão removidas.`,
      )
    ) {
      archiveMutation.mutate();
    }
  }

  const loading = patientPending || (editing && medication.isPending);
  const queryError = patientError ?? medication.error;
  const mutationError = saveMutation.error ?? archiveMutation.error;
  const resourcePatientId = medication.data?.patient_id ?? patient?.id;
  const canManage = Boolean(
    resourcePatientId && permission.isSatisfiedBy(resourcePatientId, "manage"),
  );

  if (loading)
    return (
      <p className="account-notice" role="status">
        Carregando rotina…
      </p>
    );

  if (!canManage)
    return (
      <p className="account-notice warning">Você não possui permissão para alterar esta rotina.</p>
    );

  return (
    <div className="account-page medication-page">
      <header>
        <Link className="account-link" to="/app/medicamentos">
          ← Voltar para medicamentos
        </Link>
        <p className="account-eyebrow">{editing ? "EDITAR ROTINA" : "NOVA ROTINA"}</p>
        <h1>{editing ? "Atualizar medicamento" : "Adicionar medicamento"}</h1>
        <p className="account-muted">
          {editing
            ? "A alteração valerá a partir de hoje. Doses já registradas continuam no histórico."
            : "Cadastre as informações exatamente como deseja consultá-las na rotina."}
        </p>
      </header>

      <FormNotice
        message={
          queryError
            ? userMessage(queryError)
            : mutationError
              ? userMessage(mutationError)
              : undefined
        }
      />

      {!queryError && (
        <form
          className="medication-form"
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          noValidate
        >
          <section className="account-card account-form">
            <div className="medication-section-heading">
              <span>1</span>
              <div>
                <h2>Medicamento</h2>
                <p className="account-muted">Nome e apresentação que aparecerão na agenda.</p>
              </div>
            </div>

            <label htmlFor="medication-name">
              Nome do medicamento
              <input
                id="medication-name"
                autoComplete="off"
                placeholder="Ex.: Metformina"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </label>

            <div className="account-columns">
              <label htmlFor="medication-strength">
                Concentração
                <input
                  id="medication-strength"
                  inputMode="decimal"
                  placeholder="Ex.: 500"
                  {...form.register("strength")}
                />
                <FieldError message={form.formState.errors.strength?.message} />
              </label>
              <label htmlFor="medication-unit">
                Unidade
                <select id="medication-unit" {...form.register("unit")}>
                  <option value="mg">mg</option>
                  <option value="mcg">mcg</option>
                  <option value="g">g</option>
                  <option value="ml">ml</option>
                  <option value="UI">UI</option>
                  <option value="dose">dose</option>
                </select>
              </label>
            </div>

            <div className="account-columns">
              <label htmlFor="medication-form">
                Forma
                <select id="medication-form" {...form.register("form")}>
                  <option>Comprimido</option>
                  <option>Cápsula</option>
                  <option>Solução</option>
                  <option>Gotas</option>
                  <option>Injeção</option>
                  <option>Inalador</option>
                  <option>Pomada</option>
                  <option>Outro</option>
                </select>
              </label>
              <label htmlFor="medication-quantity">
                Quantidade por horário
                <input
                  id="medication-quantity"
                  placeholder="Ex.: 1 comprimido"
                  {...form.register("quantity")}
                />
                <FieldError message={form.formState.errors.quantity?.message} />
              </label>
            </div>

            <label htmlFor="medication-instructions">
              Orientações adicionais <span className="account-help">(opcional)</span>
              <textarea
                id="medication-instructions"
                rows={3}
                placeholder="Ex.: Tomar após a refeição"
                {...form.register("instructions")}
              />
              <FieldError message={form.formState.errors.instructions?.message} />
            </label>
          </section>

          <section className="account-card account-form">
            <div className="medication-section-heading">
              <span>2</span>
              <div>
                <h2>Horários</h2>
                <p className="account-muted">Cada horário gera uma dose separada na agenda.</p>
              </div>
            </div>

            <div className="medication-time-list">
              {times.fields.map((field, index) => (
                <div className="medication-time-row" key={field.id}>
                  <label htmlFor={`medication-time-${index}`}>
                    Horário {index + 1}
                    <input
                      id={`medication-time-${index}`}
                      type="time"
                      aria-invalid={Boolean(form.formState.errors.times?.[index]?.value)}
                      {...form.register(`times.${index}.value`)}
                    />
                  </label>
                  {times.fields.length > 1 && (
                    <button
                      className="account-link medication-remove-time"
                      type="button"
                      onClick={() => times.remove(index)}
                    >
                      Remover
                    </button>
                  )}
                  <FieldError message={form.formState.errors.times?.[index]?.value?.message} />
                </div>
              ))}
            </div>
            <FieldError
              message={
                form.formState.errors.times?.root?.message ?? form.formState.errors.times?.message
              }
            />
            <button
              className="account-button secondary medication-add-time"
              type="button"
              disabled={times.fields.length >= 24}
              onClick={() => times.append({ value: "12:00" })}
            >
              + Adicionar horário
            </button>
          </section>

          <section className="account-card account-form">
            <div className="medication-section-heading">
              <span>3</span>
              <div>
                <h2>Dias e vigência</h2>
                <p className="account-muted">
                  Escolha os dias e por quanto tempo a rotina será usada.
                </p>
              </div>
            </div>

            <fieldset className="medication-weekdays">
              <legend>Dias da semana</legend>
              <Controller
                control={form.control}
                name="weekdays"
                render={({ field }) => (
                  <div className="medication-weekday-options">
                    {weekdays.map((weekday) => {
                      const selected = field.value.includes(weekday.value);
                      return (
                        <label key={weekday.value} title={weekday.label}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() =>
                              field.onChange(
                                selected
                                  ? field.value.filter((value) => value !== weekday.value)
                                  : [...field.value, weekday.value].sort(),
                              )
                            }
                          />
                          <span aria-hidden="true">{weekday.short}</span>
                          <span className="medication-sr-only">{weekday.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              <FieldError message={form.formState.errors.weekdays?.message} />
            </fieldset>

            <div className="account-columns">
              <label htmlFor="medication-start-date">
                Início
                <input
                  id="medication-start-date"
                  type="date"
                  min={minimumDate}
                  {...form.register("startDate")}
                />
                <FieldError message={form.formState.errors.startDate?.message} />
              </label>
              <label htmlFor="medication-end-date">
                Término <span className="account-help">(opcional)</span>
                <input
                  id="medication-end-date"
                  type="date"
                  min={startDate || minimumDate}
                  {...form.register("endDate")}
                />
                <FieldError message={form.formState.errors.endDate?.message} />
              </label>
            </div>
            <input type="hidden" {...form.register("timezone")} />
            <p className="account-help">
              Fuso horário da rotina: {patient?.timezone ?? browserTimezone()}
            </p>
          </section>

          <div className="medication-form-actions">
            <Link className="account-button secondary" to="/app/medicamentos">
              Cancelar
            </Link>
            <button className="account-button" type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Salvando…"
                : editing
                  ? "Salvar alterações"
                  : "Adicionar à rotina"}
            </button>
          </div>

          {editing && medication.data && (
            <section className="account-card account-danger">
              <h2>Arquivar medicamento</h2>
              <p className="account-muted">
                Remove doses futuras pendentes e mantém registros anteriores no histórico.
              </p>
              <button
                className="account-button danger"
                type="button"
                disabled={archiveMutation.isPending}
                onClick={requestArchive}
              >
                {archiveMutation.isPending ? "Arquivando…" : "Arquivar medicamento"}
              </button>
            </section>
          )}
        </form>
      )}
    </div>
  );
}
