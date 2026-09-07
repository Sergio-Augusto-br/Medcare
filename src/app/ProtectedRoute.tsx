import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { configurationError } from "@/lib/supabase";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (configurationError) return <Navigate to="/configuracao" replace />;
  if (loading)
    return (
      <main className="medcare-centered">
        <p className="account-notice account-pulse" role="status">
          Carregando sua conta…
        </p>
      </main>
    );
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
