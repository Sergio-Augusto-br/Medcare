import { createClient } from "@supabase/supabase-js";

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export function resolveDevelopmentServiceUrl(
  value: string | undefined,
  pageHostname: string,
  isDevelopment: boolean,
) {
  if (!value || !isDevelopment) return value;

  const url = new URL(value);
  const apiUsesLoopback = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const pageUsesLoopback = pageHostname === "127.0.0.1" || pageHostname === "localhost";

  if (apiUsesLoopback && !pageUsesLoopback && pageHostname) {
    url.hostname = pageHostname;
  }

  return url.toString().replace(/\/$/, "");
}

const supabaseUrl = resolveDevelopmentServiceUrl(
  configuredSupabaseUrl,
  window.location.hostname,
  import.meta.env.DEV,
);

export const configurationError =
  !supabaseUrl || !publishableKey
    ? "Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para conectar o MedCare."
    : null;

export const supabase =
  supabaseUrl && publishableKey
    ? createClient(supabaseUrl, publishableKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

export function requireSupabase() {
  if (!supabase) throw new Error(configurationError ?? "Supabase indisponível.");
  return supabase;
}

export function redirectUrl(path: string) {
  return new URL(path, window.location.origin).toString();
}
