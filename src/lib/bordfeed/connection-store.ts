import type { Payload } from "payload";

import {
  applyConnectionEvent,
  type ConnectionEvent,
  type ConnectionRecord,
} from "./connection-machine";
import { IllegalTransitionError } from "./errors";
import type { SafeError } from "./types";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asSafeError(value: unknown): SafeError | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.at !== "string" ||
    typeof record.code !== "string" ||
    typeof record.message !== "string"
  ) {
    return null;
  }

  return {
    at: record.at,
    code: record.code as SafeError["code"],
    message: record.message,
  };
}

function asState(value: unknown): ConnectionRecord["state"] {
  if (
    value === "sample" ||
    value === "awaiting_code" ||
    value === "connected" ||
    value === "error"
  ) {
    return value;
  }

  return "sample";
}

function jsonValue(
  value: unknown
):
  | { [key: string]: unknown }
  | unknown[]
  | string
  | number
  | boolean
  | null
  | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value as unknown[];
  }

  if (typeof value === "object") {
    return value as { [key: string]: unknown };
  }

  return null;
}

function asPrevious(value: unknown): ConnectionRecord["previousState"] {
  if (value === "sample" || value === "connected") {
    return value;
  }

  return null;
}

export async function readConnection(
  payload: Payload
): Promise<ConnectionRecord> {
  const doc = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    slug: "bordfeed-connection",
  });

  return {
    apiKeyEncrypted: asString(doc.apiKeyEncrypted),
    feedId: asString(doc.feedId),
    filters: doc.filters ?? null,
    keyHint: asString(doc.keyHint),
    lastError: asSafeError(doc.lastError),
    lastSyncAt: asString(doc.lastSyncAt),
    lastSyncSummary: doc.lastSyncSummary ?? null,
    previousState: asPrevious(doc.previousState),
    registrationExpiresAt: asString(doc.registrationExpiresAt),
    registrationId: asString(doc.registrationId),
    showAttribution: doc.showAttribution !== false,
    state: asState(doc.state),
    templateId: asString(doc.templateId) ?? "engineering-it",
  };
}

export async function dispatchConnectionEvent(
  payload: Payload,
  event: ConnectionEvent,
  now = new Date()
): Promise<ConnectionRecord> {
  const current = await readConnection(payload);
  const result = applyConnectionEvent(current, event, now);
  if (!result.ok) {
    throw new IllegalTransitionError(result.reason);
  }

  const { next } = result;
  await payload.updateGlobal({
    data: {
      apiKeyEncrypted: next.apiKeyEncrypted,
      feedId: next.feedId,
      filters: jsonValue(next.filters),
      keyHint: next.keyHint,
      lastError: jsonValue(next.lastError),
      lastSyncAt: next.lastSyncAt,
      lastSyncSummary: jsonValue(next.lastSyncSummary),
      previousState: next.previousState,
      registrationExpiresAt: next.registrationExpiresAt,
      registrationId: next.registrationId,
      showAttribution: next.showAttribution,
      state: next.state,
      templateId: next.templateId,
    },
    depth: 0,
    overrideAccess: true,
    slug: "bordfeed-connection",
  });

  return next;
}
