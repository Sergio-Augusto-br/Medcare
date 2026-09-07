import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { userMessage } from "@/lib/errors";
import { configurationError, redirectUrl, requireSupabase } from "@/lib/supabase";
import AuthLayout, { FieldError, FormNotice } from "./AuthLayout";
import { forgotSchema, type ForgotValues } from "./schemas";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setSubmitError(undefined);
    try {
      const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl("/redefinir-senha"),
      });
      if (error) throw error;
      setMessage("Se existir uma conta com esse e-mail, enviaremos as instruções de recuperação.");
    } catch (error) {
      setSubmitError(userMessage(error));
    }
  });

  return (
    <AuthLayout>
      <section className="account-card">
        <h1>Recuperar acesso</h1>
        <p className="account-muted">Informe seu e-mail para receber um link temporário.</p>
        <FormNotice message={configurationError ?? submitError} />
        <FormNotice tone="success" message={message} />
        <form className="account-form" onSubmit={onSubmit} noValidate>
          <label htmlFor="forgot-email">
            E-mail
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </label>
          <button
            className="account-button full"
            disabled={isSubmitting || Boolean(configurationError)}
            type="submit"
          >
            {isSubmitting ? "Enviando…" : "Enviar instruções"}
          </button>
        </form>
        <p className="account-auth-footer">
          <Link to="/login">Voltar para entrar</Link>
        </p>
      </section>
    </AuthLayout>
  );
}
