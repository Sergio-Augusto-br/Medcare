import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import "../account.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="account-auth">
      <section className="account-auth-brand" aria-label="Apresentação do MedCare">
        <Link className="account-wordmark" to="/">
          <span className="account-brand-icon" aria-hidden="true">
            +
          </span>
          MedCare
        </Link>
        <h2>Sua rotina de medicamentos com mais clareza.</h2>
        <p>
          Organize horários, registre doses e compartilhe o acompanhamento com pessoas de confiança.
        </p>
        <ul className="account-benefits">
          <li>
            <span aria-hidden="true">✓</span> Uma conta para sua rotina e para quem você acompanha
          </li>
          <li>
            <span aria-hidden="true">✓</span> Permissões definidas por paciente
          </li>
          <li>
            <span aria-hidden="true">✓</span> Histórico construído a partir de registros reais
          </li>
        </ul>
      </section>
      {children}
    </main>
  );
}

export function FormNotice({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: "error" | "success" | "warning";
}) {
  if (!message) return null;
  return (
    <p className={`account-notice ${tone}`} role={tone === "error" ? "alert" : "status"}>
      {message}
    </p>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <small className="account-field-error">{message}</small>;
}

export function PasswordField({
  id,
  label,
  error,
  registration,
  autoComplete,
}: {
  id: string;
  label: string;
  error?: string;
  registration: object;
  autoComplete: string;
}) {
  return (
    <label htmlFor={id}>
      {label}
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        {...registration}
      />
      <span id={`${id}-error`}>
        <FieldError message={error} />
      </span>
    </label>
  );
}
