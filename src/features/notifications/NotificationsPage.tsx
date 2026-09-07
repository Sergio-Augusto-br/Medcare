import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { usePatient } from "@/features/care/usePatient";
import { FormNotice } from "@/features/auth/AuthLayout";
import { userMessage } from "@/lib/errors";
import {
  fetchNotifications,
  markNotificationRead,
  refreshNotifications,
  snoozeReminder,
} from "./api";

export default function NotificationsPage() {
  const { patient, can } = usePatient();
  const queryClient = useQueryClient();
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (patient && can("manage")) await refreshNotifications(patient.id);
      return fetchNotifications();
    },
    refetchInterval: 60_000,
  });
  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const snooze = useMutation({
    mutationFn: ({ doseId, minutes }: { doseId: string; minutes: number }) =>
      snoozeReminder(doseId, minutes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    for (const notification of notifications.data ?? []) {
      if (notification.resolved_at || notification.read_at) continue;
      const storageKey = `medcare.browserNotification.${notification.id}`;
      if (localStorage.getItem(storageKey)) continue;
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: "/medcare-icon.svg",
        tag: notification.id,
      });
      browserNotification.onclick = () => {
        window.focus();
        window.location.assign(
          notification.dose_id
            ? `/app/doses/${notification.dose_id}`
            : notification.kind === "invite"
              ? "/app/convites"
              : "/app/notificacoes",
        );
      };
      localStorage.setItem(storageKey, new Date().toISOString());
    }
  }, [notifications.data]);
  async function enableBrowserNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted")
      new Notification("MedCare", {
        body: "Avisos ativados neste navegador.",
        icon: "/medcare-icon.svg",
      });
  }
  const error = notifications.error ?? markRead.error ?? snooze.error;
  return (
    <div className="account-page notifications-page">
      <header className="notification-heading">
        <div>
          <p className="account-eyebrow">AVISOS</p>
          <h1>Notificações</h1>
          <p className="account-muted">
            Lembretes e alertas são resolvidos quando a dose recebe um registro.
          </p>
        </div>
        {"Notification" in window && Notification.permission !== "granted" && (
          <button
            className="account-button secondary"
            type="button"
            onClick={() => void enableBrowserNotifications()}
          >
            Ativar no navegador
          </button>
        )}
      </header>
      <FormNotice message={error ? userMessage(error) : undefined} />
      {notifications.isPending && <p className="account-notice">Atualizando notificações…</p>}
      {!notifications.isPending && notifications.data?.length === 0 && (
        <section className="account-card medication-empty">
          <h2>Nenhum aviso</h2>
          <p className="account-muted">Lembretes e convites aparecerão aqui.</p>
        </section>
      )}
      <div className="notification-list">
        {notifications.data?.map((notification) => (
          <article
            className={`account-card notification-card ${notification.resolved_at ? "resolved" : ""}`}
            key={notification.id}
          >
            <div className="notification-card-main">
              <span className={`account-badge ${notification.kind === "alert" ? "pending" : ""}`}>
                {notification.kind === "reminder"
                  ? "Lembrete"
                  : notification.kind === "alert"
                    ? "Alerta"
                    : "Convite"}
              </span>
              <h2>{notification.title}</h2>
              <p>{notification.body}</p>
              <small>
                {format(new Date(notification.created_at), "dd/MM/yyyy 'às' HH:mm")}
                {notification.resolved_at ? " · resolvido" : ""}
              </small>
            </div>
            <div className="account-actions">
              {notification.dose_id && (
                <Link
                  className="account-button secondary"
                  to={`/app/doses/${notification.dose_id}`}
                  onClick={() => markRead.mutate(notification.id)}
                >
                  Abrir dose
                </Link>
              )}
              {notification.kind === "invite" && (
                <Link
                  className="account-button secondary"
                  to="/app/convites"
                  onClick={() => markRead.mutate(notification.id)}
                >
                  Abrir convite
                </Link>
              )}
              {!notification.read_at && (
                <button
                  className="account-link"
                  type="button"
                  onClick={() => markRead.mutate(notification.id)}
                >
                  Marcar como lida
                </button>
              )}
              {notification.kind === "reminder" &&
                notification.dose_id &&
                !notification.resolved_at && (
                  <button
                    className="account-link"
                    type="button"
                    onClick={() => snooze.mutate({ doseId: notification.dose_id!, minutes: 10 })}
                  >
                    Lembrar em 10 min
                  </button>
                )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
