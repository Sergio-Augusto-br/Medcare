import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { userMessage } from "@/lib/errors";
import { configurationError, requireSupabase } from "@/lib/supabase";
import AuthLayout, { FieldError, FormNotice, PasswordField } from "./AuthLayout";
import { loginSchema, type LoginValues } from "./schemas";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string>();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!loading && user) return <Navigate to="/app" replace />;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(undefined);
    try {
      const { error } = await requireSupabase().auth.signInWithPassword(values);
      if (error) throw error;
      const next = (location.state as { from?: string } | null)?.from ?? "/app";
      navigate(next, { replace: true });
    } catch (error) {
      setSubmitError(userMessage(error));
    }
  });

  return (
    <AuthLayout>
      <section className="account-card">
        <p className="account-eyebrow">ACESSAR CONTA</p>
        <h1>Que bom ver você</h1>
        <p className="account-muted">Entre para consultar suas rotinas.</p>
        <FormNotice message={configurationError ?? submitError} />
        <form className="account-form" onSubmit={onSubmit} noValidate>
          <label htmlFor="login-email">
            E-mail
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </label>
          <PasswordField
            id="login-password"
            label="Senha"
            autoComplete="current-password"
            error={errors.password?.message}
            registration={register("password")}
          />
          <div className="account-actions account-actions-between">
            <Link className="account-link" to="/recuperar-senha">
              Esqueci minha senha
            </Link>
          </div>
          <button
            className="account-button full"
            disabled={isSubmitting || Boolean(configurationError)}
            type="submit"
          >
            {isSubmitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="account-auth-footer">
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </section>
    </AuthLayout>
  );
}
