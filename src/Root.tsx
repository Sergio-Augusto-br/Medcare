import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import AccountPage from "./features/account/AccountPage";
import AuthCallbackPage from "./features/auth/AuthCallbackPage";
import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import LoginPage from "./features/auth/LoginPage";
import ResetPasswordPage from "./features/auth/ResetPasswordPage";
import SignUpPage from "./features/auth/SignUpPage";
import AppShell from "./app/AppShell";
import LandingPage, { ConfigurationPage } from "./app/LandingPage";
import ProtectedRoute from "./app/ProtectedRoute";
import { PatientProvider } from "./features/care/PatientContext";
import "./features/account.css";

const PrototypeApp = lazy(() => import("./PrototypeApp"));
const MedicationListPage = lazy(() => import("./features/medications/MedicationListPage"));
const MedicationFormPage = lazy(() => import("./features/medications/MedicationFormPage"));
const TodayPage = lazy(() => import("./features/doses/TodayPage"));
const AgendaPage = lazy(() => import("./features/doses/AgendaPage"));
const HistoryPage = lazy(() => import("./features/doses/HistoryPage"));
const DoseDetailsPage = lazy(() => import("./features/doses/DoseDetailsPage"));
const CarePage = lazy(() => import("./features/care/CarePage"));
const InvitationsPage = lazy(() => import("./features/care/InvitationsPage"));
const InsightsPage = lazy(() => import("./features/insights/InsightsPage"));
const NotificationsPage = lazy(() => import("./features/notifications/NotificationsPage"));

function RouteFallback() {
  return (
    <p className="account-notice" role="status">
      Carregando…
    </p>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: 0 },
  },
});

const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/cadastro", element: <SignUpPage /> },
  { path: "/recuperar-senha", element: <ForgotPasswordPage /> },
  { path: "/redefinir-senha", element: <ResetPasswordPage /> },
  { path: "/auth/callback", element: <AuthCallbackPage /> },
  { path: "/configuracao", element: <ConfigurationPage /> },
  {
    path: "/prototipo",
    element: (
      <Suspense fallback={<p className="account-notice">Carregando protótipo…</p>}>
        <PrototypeApp />
      </Suspense>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/app",
        element: (
          <PatientProvider>
            <AppShell />
          </PatientProvider>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<RouteFallback />}>
                <TodayPage />
              </Suspense>
            ),
          },
          {
            path: "agenda",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <AgendaPage />
              </Suspense>
            ),
          },
          {
            path: "historico",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <HistoryPage />
              </Suspense>
            ),
          },
          {
            path: "doses/:doseId",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <DoseDetailsPage />
              </Suspense>
            ),
          },
          {
            path: "medicamentos",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <MedicationListPage />
              </Suspense>
            ),
          },
          {
            path: "medicamentos/novo",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <MedicationFormPage />
              </Suspense>
            ),
          },
          {
            path: "medicamentos/:medicationId/editar",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <MedicationFormPage />
              </Suspense>
            ),
          },
          { path: "perfil", element: <AccountPage /> },
          {
            path: "cuidados",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <CarePage />
              </Suspense>
            ),
          },
          {
            path: "convites",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <InvitationsPage />
              </Suspense>
            ),
          },
          {
            path: "indicadores",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <InsightsPage />
              </Suspense>
            ),
          },
          {
            path: "notificacoes",
            element: (
              <Suspense fallback={<RouteFallback />}>
                <NotificationsPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}
