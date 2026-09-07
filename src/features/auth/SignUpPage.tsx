import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { userMessage } from "@/lib/errors";
import { configurationError, redirectUrl, requireSupabase } from "@/lib/supabase";
import AuthLayout, { FieldError, FormNotice, PasswordField } from "./AuthLayout";
import { signupSchema, type SignupValues } from "./schemas";

function browserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Manaus";
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
      timezone: browserTimezone(),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(undefined);
    try {
      const { data, error } = await requireSupabase().auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { name: values.name, timezone: values.timezone },
          emailRedirectTo: redirectUrl("/auth/callback"),
        },
      });
      if (error) throw error;
      if (data.session) navigate("/app", { replace: true });
      else setSuccess(true);
    } catch (error) {
      setSubmitError(userMessage(error));
    }
  });

  return (
    <AuthLayout>
      <section className="account-card">
        <p className="account-eyebrow">CRIAR CONTA</p>
        <h1>Vamos começar</h1>
        <p className="account-muted">
          Sua conta poderá ter uma rotina própria e acompanhar outras pessoas.
        </p>
        <FormNotice message={configurationError ?? submitError} />
        {success ? (
          <div className="account-form">
            <FormNotice
              tone="success"
              message="Conta criada. Abra o e-mail de confirmação para ativar o acesso."
            />
            <Link className="account-button" to="/login">
              Voltar para entrar
            </Link>
          </div>
        ) : (
          <form className="account-form" onSubmit={onSubmit} noValidate>
            <label htmlFor="signup-name">
              Nome
              <input
                id="signup-name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </label>
            <label htmlFor="signup-email">
              E-mail
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </label>
            <PasswordField
              id="signup-password"
              label="Senha"
              autoComplete="new-password"
              error={errors.password?.message}
              registration={register("password")}
            />
            <PasswordField
              id="signup-password-confirmation"
              label="Confirmar senha"
              autoComplete="new-password"
              error={errors.passwordConfirmation?.message}
              registration={register("passwordConfirmation")}
            />
            <input type="hidden" {...register("timezone")} />
            <p className="account-help">
              Use pelo menos 10 caracteres, com letras maiúsculas, minúsculas e um número.
            </p>
            <button
              className="account-button full"
              disabled={isSubmitting || Boolean(configurationError)}
              type="submit"
            >
              {isSubmitting ? "Criando conta…" : "Criar conta"}
            </button>
          </form>
        )}
        <p className="account-auth-footer">
          Já possui conta? <Link to="/login">Entrar</Link>
        </p>
      </section>
    </AuthLayout>
  );
}
