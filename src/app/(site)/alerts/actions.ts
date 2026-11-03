"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";
import { z } from "zod";

import { resolvePayloadSecret } from "@/config/payload-secret";
import { resolveServerUrl } from "@/config/server-url";
import type { AlertsActionState } from "@/lib/alerts/action-state";
import { alertsReady } from "@/lib/alerts/config";
import {
  firstSearchValue,
  parseAlertQueryFromFormData,
} from "@/lib/alerts/query";
import { allowSubscribeIp, clientIp } from "@/lib/alerts/rate-limit";
import { resendSender } from "@/lib/alerts/sender";
import {
  confirmSubscription,
  SUBSCRIBE_OK_MESSAGE,
  SUBSCRIBE_UNAVAILABLE_MESSAGE,
  subscribeToAlerts,
  unsubscribeByToken,
} from "@/lib/alerts/subscribe";
import type { AlertFrequency } from "@/lib/domain/job-vocab";
import { ALERT_FREQUENCIES } from "@/lib/domain/job-vocab";
import { querySiteSettings } from "@/lib/read/queries";

const emailSchema = z.email().max(254);
const frequencySchema = z.enum(ALERT_FREQUENCIES);

function parseEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const parsed = emailSchema.safeParse(value.trim().toLowerCase());
  return parsed.success ? parsed.data : null;
}

function parseFrequency(
  value: FormDataEntryValue | null,
  fallback: AlertFrequency
): AlertFrequency | null {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }
  const parsed = frequencySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function subscribeAction(
  _prev: AlertsActionState | null,
  formData: FormData
): Promise<AlertsActionState> {
  const payload = await getPayload({ config });
  const settings = await querySiteSettings(payload);
  const readiness = alertsReady(settings);
  if (!readiness.ready || settings.alerts.fromEmail === null) {
    return { message: SUBSCRIBE_UNAVAILABLE_MESSAGE, ok: false };
  }

  const email = parseEmail(formData.get("email"));
  if (!email) {
    return { message: "Enter a valid email address.", ok: false };
  }

  const frequency = parseFrequency(
    formData.get("frequency"),
    settings.alerts.defaultFrequency
  );
  if (!frequency) {
    return { message: "Choose weekly or daily.", ok: false };
  }

  const headerList = await headers();
  if (!allowSubscribeIp(clientIp(headerList.get("x-forwarded-for")))) {
    return { message: SUBSCRIBE_OK_MESSAGE, ok: true };
  }

  return subscribeToAlerts(
    payload,
    {
      email,
      frequency,
      now: new Date(),
      query: parseAlertQueryFromFormData(formData),
    },
    {
      fromEmail: settings.alerts.fromEmail,
      fromName: settings.alerts.fromName,
      secret: resolvePayloadSecret(),
      sender: resendSender(process.env.RESEND_API_KEY ?? ""),
      siteName: settings.name,
      siteUrl: resolveServerUrl(),
    }
  );
}

function readToken(formData: FormData): string | null {
  const value = formData.get("token");
  if (typeof value !== "string") {
    return null;
  }
  return firstSearchValue(value);
}

export async function confirmAction(
  _prev: AlertsActionState | null,
  formData: FormData
): Promise<AlertsActionState> {
  const token = readToken(formData);
  if (!token) {
    return { message: "This confirmation link is not valid.", ok: false };
  }

  const payload = await getPayload({ config });
  const confirmed = await confirmSubscription(payload, token, new Date());
  if (!confirmed) {
    return { message: "This confirmation link is not valid.", ok: false };
  }

  return { message: "Your job alerts are confirmed.", ok: true };
}

export async function unsubscribeAction(
  _prev: AlertsActionState | null,
  formData: FormData
): Promise<AlertsActionState> {
  const token = readToken(formData);
  if (!token) {
    return { message: "This unsubscribe link is not valid.", ok: false };
  }

  const payload = await getPayload({ config });
  const removed = await unsubscribeByToken(payload, token);
  if (!removed) {
    return { message: "This unsubscribe link is not valid.", ok: false };
  }

  return { message: "You are unsubscribed from job alerts.", ok: true };
}
