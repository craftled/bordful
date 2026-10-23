import type { BordfeedConnection, SafeError } from "./types";

export interface ConnectionRecord {
  apiKeyEncrypted: string | null;
  feedId: string | null;
  filters: unknown;
  keyHint: string | null;
  lastError: SafeError | null;
  lastSyncAt: string | null;
  lastSyncSummary: unknown;
  previousState: "connected" | "sample" | null;
  registrationExpiresAt: string | null;
  registrationId: string | null;
  showAttribution: boolean;
  state: "awaiting_code" | "connected" | "error" | "sample";
  templateId: string;
}

export type ConnectionEvent =
  | { expiresAt: string; registrationId: string; type: "registered" }
  | { apiKeyEncrypted: string; keyHint: string; type: "key_stored" }
  | { feedId: string; type: "feed_ready" }
  | { at: string; summary: unknown; type: "sync_succeeded" }
  | { error: SafeError; type: "sync_failed" }
  | { error: SafeError; type: "connect_failed" }
  | { type: "registration_expired" }
  | { type: "reset" }
  | { show: boolean; type: "attribution_set" };

export type ConnectionResult =
  | { next: ConnectionRecord; ok: true }
  | { ok: false; reason: string };

function reject(reason: string): ConnectionResult {
  return { ok: false, reason };
}

function accept(next: ConnectionRecord): ConnectionResult {
  return { next, ok: true };
}

function hasKey(record: ConnectionRecord): boolean {
  return Boolean(record.apiKeyEncrypted);
}

function canStartConnect(record: ConnectionRecord): boolean {
  return (
    record.state === "sample" ||
    record.state === "awaiting_code" ||
    (record.state === "error" && record.previousState === "sample")
  );
}

function registrationIsExpired(record: ConnectionRecord, now: Date): boolean {
  if (!record.registrationExpiresAt) {
    return false;
  }

  const expires = new Date(record.registrationExpiresAt).getTime();
  return !Number.isNaN(expires) && expires <= now.getTime();
}

function rememberSync(
  record: ConnectionRecord,
  event: Extract<ConnectionEvent, { type: "sync_succeeded" }>
): ConnectionRecord {
  return {
    ...record,
    lastError: null,
    lastSyncAt: event.at,
    lastSyncSummary: event.summary,
  };
}

function applyRegistered(
  record: ConnectionRecord,
  event: Extract<ConnectionEvent, { type: "registered" }>
): ConnectionResult {
  if (!canStartConnect(record)) {
    return reject("registered is not allowed from this state");
  }

  return accept({
    ...record,
    lastError: null,
    registrationExpiresAt: event.expiresAt,
    registrationId: event.registrationId,
    state: "awaiting_code",
  });
}

function applyKeyStored(
  record: ConnectionRecord,
  event: Extract<ConnectionEvent, { type: "key_stored" }>
): ConnectionResult {
  if (!canStartConnect(record)) {
    return reject("key_stored is not allowed from this state");
  }

  return accept({
    ...record,
    apiKeyEncrypted: event.apiKeyEncrypted,
    keyHint: event.keyHint,
  });
}

function applyFeedReady(
  record: ConnectionRecord,
  event: Extract<ConnectionEvent, { type: "feed_ready" }>
): ConnectionResult {
  if (!(canStartConnect(record) && hasKey(record))) {
    return reject("feed_ready requires a stored key in a connectable state");
  }

  return accept({
    ...record,
    feedId: event.feedId,
    lastError: null,
    lastSyncAt: null,
    previousState: null,
    registrationExpiresAt: null,
    registrationId: null,
    showAttribution: true,
    state: "connected",
  });
}

function applySyncSucceeded(
  record: ConnectionRecord,
  event: Extract<ConnectionEvent, { type: "sync_succeeded" }>
): ConnectionResult {
  if (record.state === "error" && record.previousState === "connected") {
    return accept({
      ...rememberSync(record, event),
      previousState: null,
      state: "connected",
    });
  }

  if (record.state === "error" && record.previousState === "sample") {
    return accept({
      ...rememberSync(record, event),
      previousState: null,
      state: "sample",
    });
  }

  if (
    record.state === "sample" ||
    record.state === "awaiting_code" ||
    record.state === "connected"
  ) {
    return accept(rememberSync(record, event));
  }

  return reject("sync_succeeded is not allowed from this state");
}

function applySyncFailed(
  record: ConnectionRecord,
  event: Extract<ConnectionEvent, { type: "sync_failed" }>
): ConnectionResult {
  if (record.state === "connected") {
    return accept({
      ...record,
      lastError: event.error,
      previousState: "connected",
      state: "error",
    });
  }

  if (record.state === "sample") {
    return accept({
      ...record,
      lastError: event.error,
      previousState: "sample",
      state: "error",
    });
  }

  if (record.state === "awaiting_code" || record.state === "error") {
    return accept({ ...record, lastError: event.error });
  }

  return reject("sync_failed is not allowed from this state");
}

function applyConnectFailed(
  record: ConnectionRecord,
  event: Extract<ConnectionEvent, { type: "connect_failed" }>
): ConnectionResult {
  if (!canStartConnect(record)) {
    return reject("connect_failed is not allowed from this state");
  }

  return accept({ ...record, lastError: event.error });
}

function applyRegistrationExpired(
  record: ConnectionRecord,
  now: Date
): ConnectionResult {
  if (record.state !== "awaiting_code" || !registrationIsExpired(record, now)) {
    return reject("registration_expired is not allowed yet");
  }

  return accept({
    ...record,
    registrationExpiresAt: null,
    registrationId: null,
    state: "sample",
  });
}

function applyReset(record: ConnectionRecord): ConnectionResult {
  return accept({
    ...record,
    apiKeyEncrypted: null,
    feedId: null,
    keyHint: null,
    lastError: null,
    lastSyncAt: null,
    previousState: null,
    registrationExpiresAt: null,
    registrationId: null,
    showAttribution: true,
    state: "sample",
  });
}

function applyAttribution(
  record: ConnectionRecord,
  event: Extract<ConnectionEvent, { type: "attribution_set" }>
): ConnectionResult {
  if (event.show === false && record.state !== "connected") {
    return reject("attribution can be hidden only while connected");
  }

  return accept({ ...record, showAttribution: event.show });
}

export function applyConnectionEvent(
  record: ConnectionRecord,
  event: ConnectionEvent,
  now: Date
): ConnectionResult {
  switch (event.type) {
    case "registered": {
      return applyRegistered(record, event);
    }
    case "key_stored": {
      return applyKeyStored(record, event);
    }
    case "feed_ready": {
      return applyFeedReady(record, event);
    }
    case "sync_succeeded": {
      return applySyncSucceeded(record, event);
    }
    case "sync_failed": {
      return applySyncFailed(record, event);
    }
    case "connect_failed": {
      return applyConnectFailed(record, event);
    }
    case "registration_expired": {
      return applyRegistrationExpired(record, now);
    }
    case "reset": {
      return applyReset(record);
    }
    default: {
      return applyAttribution(record, event);
    }
  }
}

export function toConnectionUnion(
  record: ConnectionRecord
): BordfeedConnection {
  if (record.state === "sample") {
    return { state: "sample", templateId: record.templateId };
  }

  if (record.state === "awaiting_code") {
    return {
      registrationExpiresAt: record.registrationExpiresAt ?? "",
      registrationId: record.registrationId ?? "",
      state: "awaiting_code",
      templateId: record.templateId,
    };
  }

  if (record.state === "connected") {
    return {
      apiKeyEncrypted: record.apiKeyEncrypted ?? "",
      feedId: record.feedId ?? "",
      keyHint: record.keyHint ?? "",
      lastSyncAt: record.lastSyncAt,
      showAttribution: record.showAttribution,
      state: "connected",
      templateId: record.templateId,
    };
  }

  return {
    lastError: record.lastError ?? {
      at: "1970-01-01T00:00:00.000Z",
      code: "unknown",
      message: "The Bordfeed request failed.",
    },
    previous: record.previousState === "connected" ? "connected" : "sample",
    state: "error",
  };
}
