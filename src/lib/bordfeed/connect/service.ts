import type { Payload } from "payload";
import { z } from "zod";

import { bordfulConfig } from "@/config";
import { ensureInstallId } from "@/lib/install/install-id";
import { querySiteSettings } from "@/lib/read/queries";

import { resolveBordfeedBaseUrl } from "../base-url";
import { type BordfeedClient, createBordfeedClient } from "../client";
import { bordfeedClientFor } from "../client-factory";
import { bordfeedClientHeaders } from "../client-header";
import {
  applyConnectionEvent,
  type ConnectionRecord,
  canStartConnect,
  hasStoredKey,
  holdsConnection,
  registrationIsExpired,
} from "../connection-machine";
import { dispatchConnectionEvent, readConnection } from "../connection-store";
import { BordfeedApiError, toSafeError } from "../errors";
import { sealApiKey } from "../key";
import {
  runBordfeedSync,
  runFeedSync,
  runSampleSync,
  type SyncSummary,
} from "../sync";
import type {
  BordfeedConnectionState,
  BordfeedWorkspace,
  CreateFeedRequest,
  SuggestedFeed,
} from "../types";

import {
  ALREADY_CONNECTED_MESSAGE,
  ALREADY_ISSUED_MESSAGE,
  ATTRIBUTION_CONNECTED_ONLY_MESSAGE,
  CREDIT_HIDDEN_MESSAGE,
  CREDIT_SHOWN_MESSAGE,
  connectedMessage,
  connectedSyncFailedMessage,
  INVALID_KEY_MESSAGE,
  INVALID_START_MESSAGE,
  NEED_CODE_MESSAGE,
  REGISTER_RATE_LIMIT_MESSAGE,
  REGISTRATION_EXPIRED_MESSAGE,
  RESET_MESSAGE,
  registeredMessage,
  skippedSyncMessage,
  syncedMessage,
  WORKSPACE_REQUIRED_MESSAGE,
  WRONG_CODE_MESSAGE,
} from "./messages";
import { buildRegisterBody } from "./register-body";

export interface ConnectDeps {
  client?: BordfeedClient;
  now?: () => Date;
}

export interface ConnectStepResult {
  fallback?: "paste_key";
  message: string;
  state: BordfeedConnectionState;
  summary?: SyncSummary;
  workspaces?: BordfeedWorkspace[];
}

const startSchema = z.strictObject({
  boardName: z.string().trim().min(1).max(100),
  email: z.email(),
  medium: z.enum(["admin", "cli"]),
  workspace: z.string().trim().min(1).max(100).optional(),
});

const codeSchema = z.string().regex(/^\d{6}$/u);
const keySchema = z.string().trim().min(10).max(200);

function clock(deps?: ConnectDeps): () => Date {
  return deps?.now ?? (() => new Date());
}

function step(
  record: ConnectionRecord,
  message: string,
  extra?: Pick<ConnectStepResult, "fallback" | "summary" | "workspaces">
): ConnectStepResult {
  return { message, state: record.state, ...extra };
}

function syncedCount(summary: SyncSummary): number {
  return summary.created + summary.updated;
}

function countFromStored(value: unknown): number {
  if (!value || typeof value !== "object") {
    return 0;
  }

  const row = value as Record<string, unknown>;
  const created = typeof row.created === "number" ? row.created : 0;
  const updated = typeof row.updated === "number" ? row.updated : 0;
  return created + updated;
}

function clientFor(
  payload: Payload,
  record: ConnectionRecord,
  deps?: ConnectDeps
): Promise<BordfeedClient> {
  if (deps?.client) {
    return Promise.resolve(deps.client);
  }

  return bordfeedClientFor(payload, record);
}

function plainKeyClient(
  apiKey: string,
  deps?: ConnectDeps
): Promise<BordfeedClient> {
  if (deps?.client) {
    return Promise.resolve(deps.client);
  }

  return Promise.resolve(
    createBordfeedClient({
      apiKey,
      baseUrl: resolveBordfeedBaseUrl(),
      clientHeaders: bordfeedClientHeaders(bordfulConfig),
    })
  );
}

// Site settings ship with this name. A board that never renamed itself gets
// a feed named after its template instead.
const DEFAULT_SITE_NAME = "Job Board";
const FEED_NAME_MAX = 100;
// auth.md: the code lasts 10 minutes. Used when register sends no expiry.
const DEFAULT_CODE_TTL_SECONDS = 600;

async function siteName(payload: Payload): Promise<string | null> {
  const settings = await querySiteSettings(payload);
  const name = settings.name.trim();
  return name.length > 0 && name !== DEFAULT_SITE_NAME
    ? name.slice(0, FEED_NAME_MAX)
    : null;
}

export function registrationExpiry(
  registered: { expires_at?: string; expires_in?: number },
  now: Date
): string {
  const ttl = registered.expires_in;
  if (typeof ttl === "number" && Number.isFinite(ttl) && ttl > 0) {
    return new Date(now.getTime() + ttl * 1000).toISOString();
  }

  const at = registered.expires_at
    ? new Date(registered.expires_at).getTime()
    : Number.NaN;
  if (!Number.isNaN(at)) {
    return new Date(at).toISOString();
  }

  return new Date(
    now.getTime() + DEFAULT_CODE_TTL_SECONDS * 1000
  ).toISOString();
}

function trimmed(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  return text.length > 0 ? text : null;
}

async function templateDisplayName(
  client: BordfeedClient,
  templateId: string
): Promise<string | null> {
  try {
    const templates = await client.listTemplates();
    const match = templates.data.find((item) => item.id === templateId);
    return trimmed(match?.name);
  } catch {
    return null;
  }
}

// Builds POST /api/v1/feeds: Bordfeed's suggested body when verify sent one,
// named after the site, else the template display name, else the template id.
export async function buildFeedRequest(input: {
  client: BordfeedClient;
  payload: Payload;
  suggested: SuggestedFeed | null | undefined;
  templateId: string;
}): Promise<CreateFeedRequest> {
  const body = input.suggested?.body;
  const templateId =
    trimmed(body?.template_id) ??
    trimmed(input.suggested?.template_id) ??
    input.templateId;
  const filters =
    body?.filters && typeof body.filters === "object" ? body.filters : {};
  const name =
    (await siteName(input.payload)) ??
    trimmed(body?.name) ??
    (await templateDisplayName(input.client, templateId)) ??
    templateId;
  return {
    filters,
    name: name.slice(0, FEED_NAME_MAX),
    template_id: templateId,
  };
}

function isRateLimited(error: unknown): boolean {
  return (
    error instanceof BordfeedApiError &&
    (error.status === 429 ||
      error.code === "rate_limited" ||
      error.code === "rate_limit_exceeded")
  );
}

function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof BordfeedApiError &&
    (error.status === 401 || error.code === "auth_failed")
  );
}

// A racing submit or a new register can move the record first; then the
// stored record is already the answer.
async function endRegistration(
  payload: Payload,
  now: Date
): Promise<ConnectionRecord> {
  try {
    return await dispatchConnectionEvent(
      payload,
      { gone: true, type: "registration_expired" },
      now
    );
  } catch {
    return readConnection(payload);
  }
}

async function rememberFailure(
  payload: Payload,
  error: unknown,
  now: Date
): Promise<ConnectionRecord> {
  try {
    return await dispatchConnectionEvent(
      payload,
      { error: toSafeError(error, now), type: "connect_failed" },
      now
    );
  } catch {
    return readConnection(payload);
  }
}

async function syncFeed(
  payload: Payload,
  deps: ConnectDeps | undefined,
  now: () => Date
): Promise<ConnectStepResult> {
  try {
    const summary = await runFeedSync(payload, {
      client: deps?.client,
      now,
    });
    const record = await readConnection(payload);
    const skipped = skippedSyncMessage(summary.fetch);
    const message = skipped
      ? `Connected. ${skipped}`
      : connectedMessage(syncedCount(summary));
    return step(record, message, { summary });
  } catch (error) {
    const record = await readConnection(payload);
    const safe = toSafeError(error, now());
    return step(record, connectedSyncFailedMessage(safe.message));
  }
}

async function publishFeed(
  payload: Payload,
  record: ConnectionRecord,
  suggested: SuggestedFeed | null | undefined,
  deps: ConnectDeps | undefined,
  now: () => Date
): Promise<ConnectStepResult> {
  let current = record;
  if (!current.feedId) {
    const client = await clientFor(payload, current, deps);
    try {
      const created = await client.createFeed(
        await buildFeedRequest({
          client,
          payload,
          suggested,
          templateId: current.templateId,
        })
      );
      current = await dispatchConnectionEvent(
        payload,
        { feedId: created.id, type: "feed_ready" },
        now()
      );
    } catch (error) {
      const failed = await rememberFailure(payload, error, now());
      return step(failed, toSafeError(error, now()).message);
    }
  }

  return syncFeed(payload, deps, now);
}

export async function startConnect(
  payload: Payload,
  input: {
    boardName: string;
    email: string;
    medium: "admin" | "cli";
    workspace?: string;
  },
  deps?: ConnectDeps
): Promise<ConnectStepResult> {
  const now = clock(deps);
  const record = await readConnection(payload);
  if (!canStartConnect(record)) {
    return step(record, ALREADY_CONNECTED_MESSAGE);
  }

  const parsed = startSchema.safeParse(input);
  if (!parsed.success) {
    return step(record, INVALID_START_MESSAGE);
  }

  const installId = await ensureInstallId(payload);
  let body: ReturnType<typeof buildRegisterBody>;
  try {
    body = buildRegisterBody({
      boardName: parsed.data.boardName,
      email: parsed.data.email,
      installId,
      medium: parsed.data.medium,
      telemetry: bordfulConfig.telemetry.clientHeader,
      templateId: record.templateId,
      workspace: parsed.data.workspace,
    });
  } catch {
    return step(record, INVALID_START_MESSAGE);
  }

  const client = await clientFor(payload, record, deps);

  try {
    const registered = await client.register(body);
    // `registered` keeps apiKeyEncrypted. Clear that key before the new
    // registration is saved, or the next code connects the previous account.
    if (hasStoredKey(record)) {
      await dispatchConnectionEvent(payload, { type: "reset" }, now());
    }

    const next = await dispatchConnectionEvent(
      payload,
      {
        expiresAt: registrationExpiry(registered, now()),
        registrationId: registered.registration_id,
        type: "registered",
      },
      now()
    );
    return step(next, registeredMessage(parsed.data.email));
  } catch (error) {
    if (
      error instanceof BordfeedApiError &&
      error.code === "workspace_required"
    ) {
      return step(record, WORKSPACE_REQUIRED_MESSAGE, {
        workspaces: error.workspaces,
      });
    }

    const failed = await rememberFailure(payload, error, now());
    if (isRateLimited(error)) {
      return step(failed, REGISTER_RATE_LIMIT_MESSAGE, {
        fallback: "paste_key",
      });
    }

    return step(failed, toSafeError(error, now()).message);
  }
}

// auth.md: code_expired (410), locked (423) and invalid_registration (404)
// all mean this registration cannot be verified. Register again.
const REGISTRATION_GONE_CODES = new Set([
  "code_expired",
  "invalid_registration",
  "locked",
]);

function registrationGone(error: unknown): boolean {
  return (
    error instanceof BordfeedApiError && REGISTRATION_GONE_CODES.has(error.code)
  );
}

function verifyFailure(
  record: ConnectionRecord,
  error: unknown
): ConnectStepResult | null {
  if (!(error instanceof BordfeedApiError)) {
    return null;
  }

  // workspace_not_found carries the same list, so both show the picker.
  if (
    error.code === "workspace_required" ||
    error.code === "workspace_not_found"
  ) {
    return step(record, WORKSPACE_REQUIRED_MESSAGE, {
      workspaces: error.workspaces,
    });
  }

  if (error.code === "already_issued" && !hasStoredKey(record)) {
    return step(record, ALREADY_ISSUED_MESSAGE, { fallback: "paste_key" });
  }

  if (error.status === 400 || error.code === "invalid_code") {
    return step(record, WRONG_CODE_MESSAGE);
  }

  return null;
}

export async function submitCode(
  payload: Payload,
  input: { code: string },
  deps?: ConnectDeps
): Promise<ConnectStepResult> {
  const now = clock(deps);
  let record = await readConnection(payload);

  if (record.state === "connected") {
    return step(
      record,
      connectedMessage(countFromStored(record.lastSyncSummary))
    );
  }

  if (holdsConnection(record) && record.feedId && hasStoredKey(record)) {
    return syncFeed(payload, deps, now);
  }

  // Verify already stored the key. Finish the feed even when the code
  // expired or this retry does not include the original digits.
  if (record.state === "awaiting_code" && hasStoredKey(record)) {
    return publishFeed(payload, record, undefined, deps, now);
  }

  if (record.state !== "awaiting_code") {
    return step(record, NEED_CODE_MESSAGE);
  }

  if (registrationIsExpired(record, now())) {
    const next = await dispatchConnectionEvent(
      payload,
      { type: "registration_expired" },
      now()
    );
    return step(next, REGISTRATION_EXPIRED_MESSAGE);
  }

  if (!codeSchema.safeParse(input.code).success) {
    return step(record, WRONG_CODE_MESSAGE);
  }

  if (!record.registrationId) {
    return step(record, REGISTRATION_EXPIRED_MESSAGE);
  }

  const client = await clientFor(payload, record, deps);
  let suggested: SuggestedFeed | null | undefined;
  try {
    const verified = await client.verify({
      code: input.code,
      registration_id: record.registrationId,
    });
    suggested = verified.suggested_feed;
    const sealed = sealApiKey(payload, verified.api_key);
    record = await dispatchConnectionEvent(
      payload,
      {
        apiKeyEncrypted: sealed.apiKeyEncrypted,
        keyHint: sealed.keyHint,
        type: "key_stored",
      },
      now()
    );
  } catch (error) {
    const known = verifyFailure(record, error);
    if (known) {
      return known;
    }

    // Bordfeed already ended this registration, so clear it now rather
    // than letting retries hit the same error until the local expiry.
    if (registrationGone(error)) {
      return step(
        await endRegistration(payload, now()),
        REGISTRATION_EXPIRED_MESSAGE
      );
    }

    const failed = await rememberFailure(payload, error, now());
    return step(failed, toSafeError(error, now()).message);
  }

  return publishFeed(payload, record, suggested, deps, now);
}

export async function pasteKey(
  payload: Payload,
  input: { apiKey: string },
  deps?: ConnectDeps
): Promise<ConnectStepResult> {
  const now = clock(deps);
  const record = await readConnection(payload);
  if (!canStartConnect(record)) {
    return step(record, ALREADY_CONNECTED_MESSAGE);
  }

  const parsed = keySchema.safeParse(input.apiKey);
  if (!parsed.success) {
    return step(record, INVALID_KEY_MESSAGE);
  }

  const client = await plainKeyClient(parsed.data, deps);
  let feedId: string;
  try {
    const created = await client.createFeed(
      await buildFeedRequest({
        client,
        payload,
        suggested: null,
        templateId: record.templateId,
      })
    );
    feedId = created.id;
  } catch (error) {
    if (isUnauthorized(error)) {
      return step(record, toSafeError(error, now()).message);
    }

    const failed = await rememberFailure(payload, error, now());
    return step(failed, toSafeError(error, now()).message);
  }

  const sealed = sealApiKey(payload, parsed.data);
  await dispatchConnectionEvent(
    payload,
    {
      apiKeyEncrypted: sealed.apiKeyEncrypted,
      keyHint: sealed.keyHint,
      type: "key_stored",
    },
    now()
  );
  await dispatchConnectionEvent(payload, { feedId, type: "feed_ready" }, now());
  return syncFeed(payload, deps, now);
}

async function unpublishFeedJobs(payload: Payload): Promise<void> {
  await payload.update({
    collection: "jobs",
    data: { _status: "draft" },
    depth: 0,
    overrideAccess: true,
    where: {
      _status: { equals: "published" },
      origin: { equals: "bordfeed" },
    },
  });
}

export async function resetToSample(
  payload: Payload,
  deps?: ConnectDeps
): Promise<ConnectStepResult> {
  const now = clock(deps);
  await unpublishFeedJobs(payload);
  await dispatchConnectionEvent(payload, { type: "reset" }, now());

  try {
    await runSampleSync(payload, { client: deps?.client, now });
  } catch {
    const record = await readConnection(payload);
    return step(record, RESET_MESSAGE);
  }

  const record = await readConnection(payload);
  return step(record, RESET_MESSAGE);
}

export async function setShowAttribution(
  payload: Payload,
  show: boolean,
  deps?: ConnectDeps
): Promise<ConnectStepResult> {
  const now = clock(deps);
  const record = await readConnection(payload);
  const applied = applyConnectionEvent(
    record,
    { show, type: "attribution_set" },
    now()
  );
  if (!applied.ok) {
    return step(record, ATTRIBUTION_CONNECTED_ONLY_MESSAGE);
  }

  const next = await dispatchConnectionEvent(
    payload,
    { show, type: "attribution_set" },
    now()
  );
  return step(next, show ? CREDIT_SHOWN_MESSAGE : CREDIT_HIDDEN_MESSAGE);
}

export async function syncNow(
  payload: Payload,
  deps?: ConnectDeps
): Promise<ConnectStepResult> {
  const now = clock(deps);
  try {
    const summary = await runBordfeedSync(payload, {
      client: deps?.client,
      now,
    });
    const record = await readConnection(payload);
    const message =
      skippedSyncMessage(summary.fetch) ?? syncedMessage(syncedCount(summary));
    return step(record, message, { summary });
  } catch (error) {
    const record = await readConnection(payload);
    return step(record, toSafeError(error, now()).message);
  }
}
