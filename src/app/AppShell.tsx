import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { usePatient } from "@/features/care/usePatient";
import { userMessage } from "@/lib/errors";
import { requireSupabase } from "@/lib/supabase";
import type { Profile } from "@/types";
import { useInstallPrompt } from "./useInstallPrompt";

export default function AppShell() {
  const { user } = useAuth();
  const { patient, patients, selectPatient, can } = usePatient();
  const navigate = useNavigate();
  const { standalone, canInstall, install } = useInstallPrompt();
  const [online, setOnline] = useState(navigator.onLine);
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await requireSupabase()
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });

  useEffect(() => {
    if (!profile.data) return;
    document.documentElement.dataset.textSize = profile.data.text_size;
    document.documentElement.dataset.contrast = profile.data.high_contrast ? "high" : "standard";
    document.documentElement.dataset.motion = profile.data.reduced_motion ? "reduced" : "standard";
  }, [profile.data]);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  async function logout() {
    await requireSupabase().auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="medcare-app-shell">
      <header className="medcare-app-header">
        <NavLink className="account-wordmark" to="/app">
          <span className="account-brand-icon" aria-hidden="true">
            +
          </span>
          MedCare
        </NavLink>
        <div className="medcare-user-menu">
          {patients.length > 1 && (
            <label className="medcare-patient-picker">
              <span>Acompanhando</span>
              <select
                value={patient?.id ?? ""}
                onChange={(event) => selectPatient(event.target.value)}
              >
                {patients.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                    {item.is_owner ? " (eu)" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span>{profile.data?.name ?? user?.email}</span>
          {canInstall && (
            <button className="account-link" type="button" onClick={() => void install()}>
              {standalone ? "Instalado" : "Instalar"}
            </button>
          )}
          <button className="account-link" type="button" onClick={() => void logout()}>
            Sair
          </button>
        </div>
      </header>
      <div className="medcare-app-body">
        <nav className="medcare-app-nav" aria-label="Navegação principal">
          {(can("history") || can("record") || can("manage")) && (
            <NavLink end to="/app">
              Hoje
            </NavLink>
          )}
          {(can("history") || can("record") || can("manage")) && (
            <NavLink to="/app/agenda">Agenda</NavLink>
          )}
          {(can("history") || can("manage")) && <NavLink to="/app/historico">Histórico</NavLink>}
          {(can("adherence") || can("history") || can("manage")) && (
            <NavLink to="/app/indicadores">Indicadores</NavLink>
          )}
          {(can("medications") || can("manage")) && (
            <NavLink to="/app/medicamentos">Medicamentos</NavLink>
          )}
          <NavLink to="/app/cuidados">Cuidados</NavLink>
          <NavLink to="/app/convites">Convites</NavLink>
          <NavLink to="/app/notificacoes">Avisos</NavLink>
          <NavLink to="/app/perfil">Perfil</NavLink>
        </nav>
        <main id="main-content" className="medcare-app-content">
          {!online && (
            <p className="account-notice warning medcare-offline" role="status">
              Você está sem conexão. As telas já abertas continuam visíveis, e novas gravações
              precisarão de internet.
            </p>
          )}
          {profile.isError ? (
            <p className="account-notice error" role="alert">
              {userMessage(profile.error)}
            </p>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
