import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { userMessage } from "@/lib/errors";
import { configurationError, requireSupabase } from "@/lib/supabase";
import AuthLayout, { FormNotice, PasswordField } from "./AuthLayout";
import { resetSchema, type ResetValues } from "./schemas";

export default function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    setSubmitError(undefined);
    try {
      const { error } = await requireSupabase().auth.updateUser({ password });
      if (error) throw error;
      navigate("/app/perfil", {
        replace: true,
        state: { message: "Senha atualizada com sucesso." },
      });
    } catch (error) {
      setSubmitError(userMessage(error));
    }
  });

  return (
    <AuthLayout>
      <section className="account-card">
        <h1>Criar nova senha</h1>
        <p className="account-muted">O link de recuperação deve estar aberto neste navegador.</p>
        <FormNotice message={configurationError ?? submitError} />
        {!loading && !user ? (
          <FormNotice
            tone="warning"
            message="Este link é inválido ou expirou. Solicite uma nova recuperação."
          />
        ) : (
          <form className="account-form" onSubmit={onSubmit} noValidate>
            <PasswordField
              id="reset-password"
              label="Nova senha"
              autoComplete="new-password"
              error={errors.password?.message}
              registration={register("password")}
            />
            <PasswordField
              id="reset-confirmation"
              label="Confirmar nova senha"
              autoComplete="new-password"
              error={errors.passwordConfirmation?.message}
              registration={register("passwordConfirmation")}
            />
            <button
              className="account-button full"
              disabled={loading || isSubmitting || Boolean(configurationError)}
              type="submit"
            >
              {isSubmitting ? "Atualizando…" : "Atualizar senha"}
            </button>
          </form>
        )}
        <p className="account-auth-footer">
          <Link to="/recuperar-senha">Solicitar outro link</Link>
        </p>
      </section>
    </AuthLayout>
  );
}
