import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/auth/useAuth";
import { userMessage } from "@/lib/errors";
import { redirectUrl, requireSupabase } from "@/lib/supabase";
import type { Profile } from "@/types";
import { FieldError, FormNotice, PasswordField } from "@/features/auth/AuthLayout";
import { deleteMyAccount, exportMyData } from "./data-api";
import "../account.css";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  timezone: z.string().trim().min(3, "Informe o fuso horário."),
  text_size: z.enum(["standard", "large", "extra"]),
  high_contrast: z.boolean(),
  reduced_motion: z.boolean(),
  state_labels: z.boolean(),
  reminders: z.boolean(),
  caregiver_alerts: z.boolean(),
  alert_delay_minutes: z.number().int().min(0).max(1440),
});

const emailSchema = z.object({ email: z.email("Informe um e-mail válido.") });
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    newPassword: z
      .string()
      .min(10, "Use pelo menos 10 caracteres.")
      .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
      .regex(/[a-z]/, "Inclua uma letra minúscula.")
      .regex(/[0-9]/, "Inclua um número."),
    confirmation: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmation, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmation"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

function profileToValues(profile: Profile): ProfileValues {
  return {
    name: profile.name,
    timezone: profile.timezone,
    text_size: profile.text_size,
    high_contrast: profile.high_contrast,
    reduced_motion: profile.reduced_motion,
    state_labels: profile.state_labels,
    reminders: profile.reminders,
    caregiver_alerts: profile.caregiver_alerts,
    alert_delay_minutes: profile.alert_delay_minutes,
  };
}

export default function AccountPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | undefined>(
    (location.state as { message?: string } | null)?.message,
  );
  const [error, setError] = useState<string>();
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error: queryError } = await requireSupabase()
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (queryError) throw queryError;
      return data as Profile;
    },
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });
  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: user?.email ?? "" },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (profileQuery.data) profileForm.reset(profileToValues(profileQuery.data));
  }, [profileForm, profileQuery.data]);

  const saveProfile = useMutation({
    mutationFn: async (values: ProfileValues) => {
      const { data, error: updateError } = await requireSupabase()
        .from("profiles")
        .update(values)
        .eq("id", user!.id)
        .select("*")
        .single();
      if (updateError) throw updateError;
      return data as Profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile", user?.id], profile);
      document.documentElement.dataset.textSize = profile.text_size;
      document.documentElement.dataset.contrast = profile.high_contrast ? "high" : "standard";
      document.documentElement.dataset.motion = profile.reduced_motion ? "reduced" : "standard";
      setError(undefined);
      setNotice("Perfil e preferências salvos.");
    },
    onError: (mutationError) => setError(userMessage(mutationError)),
  });

  const updateEmail = emailForm.handleSubmit(async ({ email }) => {
    setError(undefined);
    setNotice(undefined);
    try {
      const { error: updateError } = await requireSupabase().auth.updateUser(
        { email },
        { emailRedirectTo: redirectUrl("/auth/callback") },
      );
      if (updateError) throw updateError;
      setNotice("Enviamos confirmações para concluir a alteração do e-mail.");
    } catch (updateError) {
      setError(userMessage(updateError));
    }
  });

  const updatePassword = passwordForm.handleSubmit(async ({ currentPassword, newPassword }) => {
    setError(undefined);
    setNotice(undefined);
    try {
      if (!user?.email) throw new Error("A conta não possui e-mail disponível.");
      const client = requireSupabase();
      const { error: reauthError } = await client.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) throw new Error("A senha atual está incorreta.");
      const { error: updateError } = await client.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      passwordForm.reset();
      setNotice("Senha atualizada com sucesso.");
    } catch (updateError) {
      setError(userMessage(updateError));
    }
  });

  async function resendConfirmation() {
    if (!user?.email) return;
    setError(undefined);
    const { error: resendError } = await requireSupabase().auth.resend({
      type: "signup",
      email: user.email,
      options: { emailRedirectTo: redirectUrl("/auth/callback") },
    });
    if (resendError) setError(userMessage(resendError));
    else setNotice("Novo e-mail de confirmação enviado.");
  }

  async function downloadExport() {
    setError(undefined);
    setNotice(undefined);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medcare-dados-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice("Arquivo de dados gerado.");
    } catch (exportError) {
      setError(userMessage(exportError));
    }
  }

  async function closeOtherSessions() {
    setError(undefined);
    const { error: signOutError } = await requireSupabase().auth.signOut({ scope: "others" });
    if (signOutError) setError(userMessage(signOutError));
    else setNotice("As outras sessões da conta foram encerradas.");
  }

  async function closeAccount(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    if (!user?.email || deleteConfirmation !== "EXCLUIR") return;
    try {
      const { error: reauthError } = await requireSupabase().auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });
      if (reauthError) throw new Error("A senha atual está incorreta.");
      await deleteMyAccount();
      await requireSupabase().auth.signOut({ scope: "local" });
      navigate("/", { replace: true });
    } catch (deleteError) {
      setError(userMessage(deleteError));
    }
  }

  if (profileQuery.isPending)
    return (
      <p className="account-notice" role="status">
        Carregando perfil…
      </p>
    );
  if (profileQuery.isError) return <FormNotice message={userMessage(profileQuery.error)} />;

  return (
    <div className="account-page">
      <header>
        <p className="account-eyebrow">CONTA</p>
        <h1>Perfil e preferências</h1>
        <p className="account-muted">
          Estas escolhas acompanham sua conta neste dispositivo e nos próximos acessos.
        </p>
      </header>
      <FormNotice message={error} />
      <FormNotice tone="success" message={notice} />

      {!user?.email_confirmed_at && (
        <section className="account-notice warning">
          <strong>Confirme seu e-mail.</strong> Convites e alterações sensíveis dependerão dessa
          confirmação.{" "}
          <button className="account-link" type="button" onClick={() => void resendConfirmation()}>
            Reenviar
          </button>
        </section>
      )}

      <form
        className="account-card account-form"
        onSubmit={profileForm.handleSubmit((values) => saveProfile.mutate(values))}
        noValidate
      >
        <h2>Dados pessoais</h2>
        <label htmlFor="profile-name">
          Nome
          <input
            id="profile-name"
            autoComplete="name"
            aria-invalid={Boolean(profileForm.formState.errors.name)}
            {...profileForm.register("name")}
          />
          <FieldError message={profileForm.formState.errors.name?.message} />
        </label>
        <label htmlFor="profile-timezone">
          Fuso horário
          <input id="profile-timezone" list="timezones" {...profileForm.register("timezone")} />
          <datalist id="timezones">
            <option value="America/Manaus" />
            <option value="America/Sao_Paulo" />
            <option value="America/Rio_Branco" />
            <option value="America/Belem" />
            <option value="America/Fortaleza" />
          </datalist>
          <span className="account-help">
            O fuso das rotinas existentes não será alterado automaticamente.
          </span>
        </label>

        <h2>Acessibilidade</h2>
        <label htmlFor="profile-text-size">
          Tamanho do texto
          <select id="profile-text-size" {...profileForm.register("text_size")}>
            <option value="standard">Padrão</option>
            <option value="large">Grande</option>
            <option value="extra">Muito grande</option>
          </select>
        </label>
        <label className="account-check">
          <input type="checkbox" {...profileForm.register("high_contrast")} />
          <span>
            <strong>Aumentar contraste</strong>
            <small className="account-help">
              Reforça a distinção entre texto, bordas e fundos.
            </small>
          </span>
        </label>
        <label className="account-check">
          <input type="checkbox" {...profileForm.register("reduced_motion")} />
          <span>
            <strong>Reduzir animações</strong>
            <small className="account-help">Também respeitamos a preferência do sistema.</small>
          </span>
        </label>
        <label className="account-check">
          <input type="checkbox" {...profileForm.register("state_labels")} />
          <span>
            <strong>Usar texto nos estados</strong>
            <small className="account-help">Mantém rótulos junto aos ícones de situação.</small>
          </span>
        </label>

        <h2>Lembretes</h2>
        <label className="account-check">
          <input type="checkbox" {...profileForm.register("reminders")} />
          <span>
            <strong>Lembretes da minha rotina</strong>
          </span>
        </label>
        <label className="account-check">
          <input type="checkbox" {...profileForm.register("caregiver_alerts")} />
          <span>
            <strong>Alertas das pessoas que acompanho</strong>
          </span>
        </label>
        <label htmlFor="alert-delay">
          Alertar após quantos minutos sem registro
          <input
            id="alert-delay"
            type="number"
            min="0"
            max="1440"
            {...profileForm.register("alert_delay_minutes", {
              valueAsNumber: true,
            })}
          />
          <FieldError message={profileForm.formState.errors.alert_delay_minutes?.message} />
        </label>
        <button
          className="account-button"
          type="submit"
          disabled={saveProfile.isPending || !profileForm.formState.isDirty}
        >
          {saveProfile.isPending ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>

      <section className="account-card">
        <h2>E-mail</h2>
        <p className="account-muted">Atual: {user?.email}</p>
        <form className="account-form" onSubmit={updateEmail} noValidate>
          <label htmlFor="new-email">
            Novo e-mail
            <input
              id="new-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(emailForm.formState.errors.email)}
              {...emailForm.register("email")}
            />
            <FieldError message={emailForm.formState.errors.email?.message} />
          </label>
          <button
            className="account-button secondary"
            disabled={emailForm.formState.isSubmitting}
            type="submit"
          >
            Alterar e-mail
          </button>
        </form>
      </section>

      <section className="account-card account-data-actions">
        <h2>Dados e sessões</h2>
        <p className="account-muted">
          Baixe um arquivo JSON com seu perfil, rotina própria, registros, vínculos e notificações.
        </p>
        <div className="account-actions">
          <button
            className="account-button secondary"
            type="button"
            onClick={() => void downloadExport()}
          >
            Exportar meus dados
          </button>
          <button
            className="account-button secondary"
            type="button"
            onClick={() => void closeOtherSessions()}
          >
            Encerrar outras sessões
          </button>
        </div>
        <p className="account-help">
          Sessão atual iniciada em{" "}
          {user?.last_sign_in_at
            ? new Date(user.last_sign_in_at).toLocaleString("pt-BR")
            : "data indisponível"}
          .
        </p>
      </section>

      <section className="account-card account-danger">
        <h2>Encerrar conta</h2>
        <p className="account-muted">
          A rotina própria, medicamentos, programações e registros serão excluídos. A autoria
          mantida em rotinas de outras pessoas será anonimizada.
        </p>
        <form className="account-form" onSubmit={(event) => void closeAccount(event)}>
          <label htmlFor="delete-password">
            Senha atual
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              required
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
            />
          </label>
          <label htmlFor="delete-confirmation">
            Digite EXCLUIR para confirmar
            <input
              id="delete-confirmation"
              autoComplete="off"
              required
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
            />
          </label>
          <button
            className="account-button danger"
            type="submit"
            disabled={!deletePassword || deleteConfirmation !== "EXCLUIR"}
          >
            Excluir conta permanentemente
          </button>
        </form>
      </section>

      <section className="account-card">
        <h2>Senha</h2>
        <form className="account-form" onSubmit={updatePassword} noValidate>
          <PasswordField
            id="current-password"
            label="Senha atual"
            autoComplete="current-password"
            error={passwordForm.formState.errors.currentPassword?.message}
            registration={passwordForm.register("currentPassword")}
          />
          <PasswordField
            id="new-password"
            label="Nova senha"
            autoComplete="new-password"
            error={passwordForm.formState.errors.newPassword?.message}
            registration={passwordForm.register("newPassword")}
          />
          <PasswordField
            id="new-password-confirmation"
            label="Confirmar nova senha"
            autoComplete="new-password"
            error={passwordForm.formState.errors.confirmation?.message}
            registration={passwordForm.register("confirmation")}
          />
          <button
            className="account-button secondary"
            disabled={passwordForm.formState.isSubmitting}
            type="submit"
          >
            Atualizar senha
          </button>
        </form>
      </section>
    </div>
  );
}
