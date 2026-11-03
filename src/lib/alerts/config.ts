import type { SiteSettingsView } from "@/lib/read/types";

export type AlertsReadiness =
  | { ready: true }
  | { ready: false; reason: string };

export function alertsReady(
  settings: SiteSettingsView,
  env: Partial<NodeJS.ProcessEnv> = process.env
): AlertsReadiness {
  if (!settings.alerts.enabled) {
    return {
      ready: false,
      reason: "Alerts are turned off in Site settings.",
    };
  }

  if (!env.RESEND_API_KEY || env.RESEND_API_KEY.trim().length === 0) {
    return {
      ready: false,
      reason: "Add RESEND_API_KEY to the environment.",
    };
  }

  if (settings.alerts.fromEmail === null) {
    return {
      ready: false,
      reason: "Add a sender email in Site settings, Alerts.",
    };
  }

  return { ready: true };
}
