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
  SuggestedFeed,
} from "../types";

import {
  ALREADY_CONNECTED_MESSAGE,
  ALREADY_ISSUED_MESSAGE,
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

const codeSchema = z.string().regex(/^\d{6}$/);
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

function holdsConnection(record: ConnectionRecord): boolean {
  return (
    record.state === "connected" ||
    (record.state === "error" && record.previousState === "connected")
  );
}

function canStart(record: ConnectionRecord): boolean {
  return (
    record.state === "sample" ||
    record.state === "awaiting_code" ||
    (record.state === "error" && record.previousState === "sample")
  );
}

function hasStoredKey(record: ConnectionRecord): boolean {
  return Boolean(record.apiKeyEncrypted);
}

function registrationExpired(record: ConnectionRecord, now: Date): boolean {
  if (record.state !== "awaiting_code" || !record.registrationExpiresAt) {
    return false;
  }

  const expires = new Date(record.registrationExpiresAt).getTime();
  return !Number.isNaN(expires) && expires <= now.getTime();
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

async function boardName(payload: Payload): Promise<string> {
  const settings = await querySiteSettings(payload);
  const name = settings.name.trim();
  return name.length > 0 ? name.slice(0, 100) : "Job Board";
}

function feedTemplate(
  suggested: SuggestedFeed | null | undefined,
  fallback: string
): string {
  const templateId = suggested?.template_id?.trim();
  return templateId ? templateId : fallback;
}

function feedName(
  suggested: SuggestedFeed | null | undefined,
  fallback: string
): string {
  const name = suggested?.name?.trim();
  return name ? name.slice(0, 100) : fallback;
}

function isRateLimited(error: unknown): boolean {
  return (
    error instanceof BordfeedApiError &&
    (error.status === 429 || error.code === "rate_limited")
  );
}

function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof BordfeedApiError &&
    (error.status === 401 || error.code === "auth_failed")
  );
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
    return step(record, connectedMessage(syncedCount(summary)), { summary });
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
    const name = await boardName(payload);
    try {
      const created = await client.createFeed({
        name: feedName(suggested, name),
        template_id: feedTemplate(suggested, current.templateId),
      });
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
  if (holdsConnection(record) || !canStart(record)) {
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
    const next = await dispatchConnectionEvent(
      payload,
      {
        expiresAt: registered.expires_at,
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

function verifyFailure(
  record: ConnectionRecord,
  error: unknown
): ConnectStepResult | null {
  if (!(error instanceof BordfeedApiError)) {
    return null;
  }

  if (error.code === "workspace_required") {
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

  if (record.state !== "awaiting_code") {
    return step(record, NEED_CODE_MESSAGE);
  }

  if (registrationExpired(record, now())) {
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

  let suggested: SuggestedFeed | null | undefined;
  if (!hasStoredKey(record)) {
    if (!record.registrationId) {
      return step(record, REGISTRATION_EXPIRED_MESSAGE);
    }

    const client = await clientFor(payload, record, deps);
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

      const failed = await rememberFailure(payload, error, now());
      return step(failed, toSafeError(error, now()).message);
    }
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
  if (holdsConnection(record) || !canStart(record)) {
    return step(record, ALREADY_CONNECTED_MESSAGE);
  }

  const parsed = keySchema.safeParse(input.apiKey);
  if (!parsed.success) {
    return step(record, INVALID_KEY_MESSAGE);
  }

  const client = await plainKeyClient(parsed.data, deps);
  let feedId: string;
  try {
    const created = await client.createFeed({
      name: await boardName(payload),
      template_id: record.templateId,
    });
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

async function unpublishIds(payload: Payload, ids: number[]): Promise<void> {
  const [id, ...rest] = ids;
  if (id === undefined) {
    return;
  }

  await payload.update({
    collection: "jobs",
    data: { _status: "draft" },
    depth: 0,
    id,
    overrideAccess: true,
  });
  await unpublishIds(payload, rest);
}

async function unpublishFeedJobs(payload: Payload, guard = 0): Promise<void> {
  if (guard > 40) {
    return;
  }

  const found = await payload.find({
    collection: "jobs",
    depth: 0,
    draft: false,
    limit: 50,
    overrideAccess: true,
    page: 1,
    where: {
      and: [
        { _status: { equals: "published" } },
        { origin: { equals: "bordfeed" } },
      ],
    },
  });
  if (found.docs.length === 0) {
    return;
  }

  await unpublishIds(
    payload,
    found.docs.map((job) => job.id)
  );
  await unpublishFeedJobs(payload, guard + 1);
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
    return step(record, applied.reason);
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
    return step(record, syncedMessage(syncedCount(summary)), { summary });
  } catch (error) {
    const record = await readConnection(payload);
    return step(record, toSafeError(error, now()).message);
  }
}
