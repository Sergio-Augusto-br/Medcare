import { Link } from "react-router-dom";
import { configurationError } from "@/lib/supabase";

export default function LandingPage() {
  return (
    <main className="medcare-landing">
      <section>
        <div className="account-wordmark">
          <span className="account-brand-icon" aria-hidden="true">
            +
          </span>
          MedCare
        </div>
        <p className="account-eyebrow">ROTINA CLARA, CUIDADO COMPARTILHADO</p>
        <h1>Medicamentos organizados para você e para quem cuida com você.</h1>
        <p>
          Consulte horários, registre doses e compartilhe somente o que cada pessoa está autorizada
          a acompanhar.
        </p>
        {configurationError && (
          <p className="account-notice warning">
            O ambiente de dados ainda precisa ser configurado. O protótipo visual continua
            disponível.
          </p>
        )}
        <div className="account-actions">
          <Link className="account-button" to="/cadastro">
            Criar conta
          </Link>
          <Link className="account-button secondary" to="/login">
            Entrar
          </Link>
          <Link className="account-link" to="/prototipo">
            Explorar protótipo
          </Link>
        </div>
      </section>
    </main>
  );
}

export function ConfigurationPage() {
  return (
    <main className="medcare-centered">
      <section className="account-card medcare-config-card">
        <p className="account-eyebrow">CONFIGURAÇÃO LOCAL</p>
        <h1>Conecte o banco do MedCare</h1>
        <p className="account-muted">
          Copie <code>.env.example</code> para <code>.env.local</code> e informe a URL e a chave
          publicável exibidas pelo Supabase.
        </p>
        <ol>
          <li>
            Execute <code>pnpm supabase:start</code>.
          </li>
          <li>Copie a API URL e a publishable key.</li>
          <li>Reinicie a prévia após salvar o arquivo.</li>
        </ol>
        <div className="account-actions">
          <Link className="account-button secondary" to="/">
            Voltar
          </Link>
          <Link className="account-link" to="/prototipo">
            Abrir protótipo visual
          </Link>
        </div>
      </section>
    </main>
  );
}
