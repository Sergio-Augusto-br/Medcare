import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import AuthLayout, { FormNotice } from "./AuthLayout";

export default function AuthCallbackPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/app", { replace: true });
  }, [loading, navigate, user]);

  return (
    <AuthLayout>
      <section className="account-card">
        <h1>Confirmando seu acesso</h1>
        {loading || user ? (
          <p className="account-muted account-pulse" role="status">
            Aguarde um instante…
          </p>
        ) : (
          <>
            <FormNotice message="Não foi possível confirmar este link. Ele pode ter expirado." />
            <Link className="account-button" to="/login">
              Voltar para entrar
            </Link>
          </>
        )}
      </section>
    </AuthLayout>
  );
}
