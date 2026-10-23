"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload, type Payload } from "payload";
import { z } from "zod";
import { connectAdminDenial } from "@/lib/bordfeed/connect/admin";
import {
  allowConnectAttempt,
  allowVerifyAttempt,
} from "@/lib/bordfeed/connect/limiter";
import {
  ADMIN_ONLY_MESSAGE,
  CONNECT_LIMIT_MESSAGE,
  INVALID_KEY_MESSAGE,
  INVALID_START_MESSAGE,
  VERIFY_LIMIT_MESSAGE,
  WRONG_CODE_MESSAGE,
} from "@/lib/bordfeed/connect/messages";
import {
  type ConnectStepResult,
  pasteKey,
  resetToSample,
  setShowAttribution,
  startConnect,
  submitCode,
  syncNow,
} from "@/lib/bordfeed/connect/service";
import { readConnection } from "@/lib/bordfeed/connection-store";

const connectFields = z.strictObject({
  boardName: z.string().trim().min(1).max(100),
  email: z.email(),
  workspace: z.string().trim().min(1).max(100).optional(),
});

const codeFields = z.strictObject({
  code: z.string().regex(/^\d{6}$/),
});

const keyFields = z.strictObject({
  apiKey: z.string().trim().min(10).max(200),
});

const showFields = z.strictObject({
  show: z.enum(["false", "true"]),
});

function emptyForm(formData: FormData): boolean {
  return z.object({}).safeParse(Object.fromEntries(formData.entries())).success;
}

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function optionalField(formData: FormData, key: string): string | undefined {
  const value = field(formData, key).trim();
  return value.length > 0 ? value : undefined;
}

async function denied(
  payload: Payload,
  message: string,
  extra?: Pick<ConnectStepResult, "fallback">
): Promise<ConnectStepResult> {
  const record = await readConnection(payload);
  return { message, state: record.state, ...extra };
}

async function sessionUser(payload: Payload, user: unknown): Promise<unknown> {
  if (!user || typeof user !== "object" || !("id" in user)) {
    return user;
  }

  if (!connectAdminDenial(user)) {
    return user;
  }

  const { id } = user;
  if (typeof id !== "number" && typeof id !== "string") {
    return user;
  }

  // payload.auth can omit hasMany fields that saveToJWT stores.
  return await payload.findByID({
    collection: "users",
    depth: 0,
    id,
    overrideAccess: true,
  });
}

async function withAdmin(
  run: (payload: Payload, userId: string) => Promise<ConnectStepResult>
): Promise<ConnectStepResult> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  const acting = await sessionUser(payload, user);
  const message = connectAdminDenial(acting);
  if (
    message ||
    !acting ||
    typeof acting !== "object" ||
    !("id" in acting) ||
    (typeof acting.id !== "number" && typeof acting.id !== "string")
  ) {
    return denied(payload, message ?? ADMIN_ONLY_MESSAGE);
  }

  return run(payload, String(acting.id));
}

export async function connectAction(
  _prev: ConnectStepResult | null,
  formData: FormData
): Promise<ConnectStepResult> {
  return await withAdmin((payload, userId) => {
    const parsed = connectFields.safeParse({
      boardName: field(formData, "boardName"),
      email: field(formData, "email"),
      workspace: optionalField(formData, "workspace"),
    });
    if (!parsed.success) {
      return denied(payload, INVALID_START_MESSAGE);
    }

    if (!allowConnectAttempt(userId)) {
      return denied(payload, CONNECT_LIMIT_MESSAGE, { fallback: "paste_key" });
    }

    return startConnect(payload, { ...parsed.data, medium: "admin" });
  });
}

export async function verifyCodeAction(
  _prev: ConnectStepResult | null,
  formData: FormData
): Promise<ConnectStepResult> {
  return await withAdmin(async (payload, userId) => {
    const parsed = codeFields.safeParse({
      code: field(formData, "code").trim(),
    });
    if (!parsed.success) {
      return denied(payload, WRONG_CODE_MESSAGE);
    }

    const record = await readConnection(payload);
    const registrationId = record.registrationId ?? `user:${userId}`;
    if (!allowVerifyAttempt(registrationId)) {
      return denied(payload, VERIFY_LIMIT_MESSAGE, { fallback: "paste_key" });
    }

    return submitCode(payload, { code: parsed.data.code });
  });
}

export async function pasteKeyAction(
  _prev: ConnectStepResult | null,
  formData: FormData
): Promise<ConnectStepResult> {
  return await withAdmin((payload) => {
    const parsed = keyFields.safeParse({ apiKey: field(formData, "apiKey") });
    if (!parsed.success) {
      return denied(payload, INVALID_KEY_MESSAGE);
    }

    return pasteKey(payload, { apiKey: parsed.data.apiKey });
  });
}

export async function resetAction(
  _prev: ConnectStepResult | null,
  formData: FormData
): Promise<ConnectStepResult> {
  return await withAdmin((payload) => {
    if (!emptyForm(formData)) {
      return denied(payload, ADMIN_ONLY_MESSAGE);
    }

    return resetToSample(payload);
  });
}

export async function syncNowAction(
  _prev: ConnectStepResult | null,
  formData: FormData
): Promise<ConnectStepResult> {
  return await withAdmin((payload) => {
    if (!emptyForm(formData)) {
      return denied(payload, ADMIN_ONLY_MESSAGE);
    }

    return syncNow(payload);
  });
}

export async function setAttributionAction(
  _prev: ConnectStepResult | null,
  formData: FormData
): Promise<ConnectStepResult> {
  return await withAdmin((payload) => {
    const parsed = showFields.safeParse({ show: field(formData, "show") });
    if (!parsed.success) {
      return denied(
        payload,
        "Choose whether to show the Jobs by Bordfeed credit."
      );
    }

    return setShowAttribution(payload, parsed.data.show === "true");
  });
}
