import { createInterface } from "node:readline/promises";

import { type Payload, strictObject, z } from "payload";
import { defineCLICommand } from "payload/cli";
import type { ConnectStepResult } from "@/lib/bordfeed/connect/service";
import {
  pasteKey,
  resetToSample,
  startConnect,
  submitCode,
  syncNow,
} from "@/lib/bordfeed/connect/service";
import type { ConnectionRecord } from "@/lib/bordfeed/connection-machine";
import { readConnection } from "@/lib/bordfeed/connection-store";
import { adminEmails, resetPassword } from "@/lib/install/reset-password";

const REFRESH_LINE = "The board refreshes within 5 minutes.";

interface PublicStatus {
  feedId: string | null;
  keyHint: string | null;
  lastSyncAt: string | null;
  message: string | null;
  state: ConnectionRecord["state"];
}

function publicStatus(
  record: ConnectionRecord,
  message: string | null = null
): PublicStatus {
  return {
    feedId: record.feedId,
    keyHint: record.keyHint,
    lastSyncAt: record.lastSyncAt,
    message,
    state: record.state,
  };
}

function statusLines(record: ConnectionRecord): string[] {
  return [
    `state: ${record.state}`,
    `key: ${record.keyHint ?? "none"}`,
    `feed: ${record.feedId ?? "none"}`,
    `lastSync: ${record.lastSyncAt ?? "none"}`,
  ];
}

function finish<T>(
  isJSON: boolean,
  exitCode: number,
  result: T,
  lines: string[]
): number | { exitCode: number; result: T } {
  if (isJSON) {
    return { exitCode, result };
  }

  for (const line of lines) {
    console.log(line);
  }

  return exitCode;
}

async function promptLine(
  label: string,
  isJSON: boolean
): Promise<string | null> {
  const rl = createInterface({
    input: process.stdin,
    output: isJSON ? process.stderr : process.stdout,
  });
  try {
    const answer = (await rl.question(label)).trim();
    return answer.length > 0 ? answer : null;
  } finally {
    rl.close();
  }
}

async function stdinLine(): Promise<string | null> {
  const rl = createInterface({ input: process.stdin });
  try {
    for await (const line of rl) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    return null;
  } finally {
    rl.close();
  }
}

function readCode(
  given: string | undefined,
  isJSON: boolean
): Promise<string | null> {
  if (given && given.trim().length > 0) {
    return Promise.resolve(given.trim());
  }

  if (process.stdin.isTTY) {
    return promptLine("Enter the 6-digit code: ", isJSON);
  }

  return stdinLine();
}

function envKey(): string | undefined {
  const value = process.env.BORDFEED_API_KEY?.trim();
  return value ? value : undefined;
}

function connectedLines(
  result: ConnectStepResult,
  record: ConnectionRecord
): string[] {
  const lines = [result.message];
  if (record.keyHint) {
    lines.push(`key: ${record.keyHint}`);
  }

  if (record.keyHint || result.state === "connected") {
    lines.push(REFRESH_LINE);
  }

  return lines;
}

async function chooseWorkspace(
  payload: Payload,
  input: { boardName: string; email: string; workspace?: string },
  result: ConnectStepResult,
  isJSON: boolean
): Promise<
  ConnectStepResult | number | { exitCode: number; result: PublicStatus }
> {
  const slugs = (result.workspaces ?? []).map((item) => item.slug);
  if (!process.stdin.isTTY) {
    const record = await readConnection(payload);
    return finish(isJSON, 1, publicStatus(record, result.message), [
      result.message,
      ...slugs,
    ]);
  }

  const slug = await promptLine("Workspace slug: ", isJSON);
  if (!slug) {
    const record = await readConnection(payload);
    return finish(isJSON, 1, publicStatus(record, result.message), [
      result.message,
      ...slugs,
    ]);
  }

  return startConnect(payload, { ...input, medium: "cli", workspace: slug });
}

async function connectWithCode(
  payload: Payload,
  input: { boardName: string; email: string; workspace?: string },
  code: string | undefined,
  isJSON: boolean
): Promise<number | { exitCode: number; result: PublicStatus }> {
  let result = await startConnect(payload, { ...input, medium: "cli" });
  if (result.workspaces && result.workspaces.length > 0) {
    const next = await chooseWorkspace(payload, input, result, isJSON);
    if (typeof next === "number" || "exitCode" in next) {
      return next;
    }

    result = next;
  }

  if (result.state !== "awaiting_code") {
    const record = await readConnection(payload);
    const exitCode = result.state === "connected" ? 0 : 1;
    return finish(
      isJSON,
      exitCode,
      publicStatus(record, result.message),
      connectedLines(result, record)
    );
  }

  const entered = await readCode(code, isJSON);
  if (!entered) {
    const record = await readConnection(payload);
    return finish(isJSON, 2, publicStatus(record, result.message), [
      result.message,
      "Waiting for a 6-digit code. Pass --code or pipe the code on stdin.",
    ]);
  }

  result = await submitCode(payload, { code: entered });
  if (result.workspaces && result.workspaces.length > 0) {
    const next = await chooseWorkspace(payload, input, result, isJSON);
    if (typeof next === "number" || "exitCode" in next) {
      return next;
    }

    const again = await readCode(undefined, isJSON);
    if (!again) {
      const record = await readConnection(payload);
      return finish(isJSON, 2, publicStatus(record, next.message), [
        next.message,
        "Waiting for a 6-digit code. Pass --code or pipe the code on stdin.",
      ]);
    }

    result = await submitCode(payload, { code: again });
  }

  const record = await readConnection(payload);
  const exitCode = result.state === "connected" ? 0 : 1;
  return finish(
    isJSON,
    exitCode,
    publicStatus(record, result.message),
    connectedLines(result, record)
  );
}

async function runConnect(
  payload: Payload,
  args: {
    boardName?: string;
    code?: string;
    email?: string;
    key?: string;
    workspace?: string;
  },
  isJSON: boolean
): Promise<number | { exitCode: number; result: PublicStatus }> {
  const key = args.key?.trim() || (args.email ? undefined : envKey());
  if (key) {
    const result = await pasteKey(payload, { apiKey: key });
    const record = await readConnection(payload);
    const exitCode = result.state === "connected" ? 0 : 1;
    return finish(
      isJSON,
      exitCode,
      publicStatus(record, result.message),
      connectedLines(result, record)
    );
  }

  if (!(args.email && args.boardName)) {
    const record = await readConnection(payload);
    const message =
      'Email and board name are required. Example: bordful connect --email owner@example.com --board-name "Example Board"';
    return finish(isJSON, 1, publicStatus(record, message), [message]);
  }

  return connectWithCode(
    payload,
    {
      boardName: args.boardName,
      email: args.email,
      workspace: args.workspace,
    },
    args.code,
    isJSON
  );
}

async function runResetPassword(
  payload: Payload,
  email: string | undefined,
  isJSON: boolean
): Promise<number | { exitCode: number; result: unknown }> {
  const password = email ? await resetPassword(payload, email) : null;
  if (!password) {
    const admins = await adminEmails(payload);
    const message = email
      ? `No user has the email ${email}.`
      : "Email is required. Example: bordful reset-password --email owner@example.com";
    return finish(isJSON, 1, { admins, message }, [
      message,
      `Admins: ${admins.join(", ") || "none"}`,
    ]);
  }

  return finish(isJSON, 0, { email, password }, [
    `New password for ${email}: ${password}`,
    "It is shown only once. Sign in at /admin, then change it in Users.",
  ]);
}

export const bordfulCommand = defineCLICommand({
  cli: { action: "argument", json: false },
  description:
    "Bordfeed and admin commands for this board. Positional [action] is connect, sample, sync, status, or reset-password. Options from the input schema: --email <email>, --board-name <boardName>, --workspace <workspace>, --code <code>, --key <key>. Prefer BORDFEED_API_KEY over --key so the key stays out of shell history. Payload reserves --json for one JSON response on stdout.",
  examples: [
    'bordful connect --email owner@example.com --board-name "Example Board"',
    "BORDFEED_API_KEY=... bun run bordful connect",
    "bordful sample",
    "bordful sync",
    "bordful status",
    "bordful reset-password --email owner@example.com",
  ],
  handler: async ({ args, getPayload, isJSON }) => {
    const payload = await getPayload();
    if (args.action === "reset-password") {
      return runResetPassword(payload, args.email, isJSON);
    }

    if (args.action === "status") {
      const record = await readConnection(payload);
      return finish(isJSON, 0, publicStatus(record), statusLines(record));
    }

    if (args.action === "sample") {
      const result = await resetToSample(payload);
      const record = await readConnection(payload);
      return finish(
        isJSON,
        result.state === "error" ? 1 : 0,
        publicStatus(record, result.message),
        [result.message]
      );
    }

    if (args.action === "sync") {
      const result = await syncNow(payload);
      const record = await readConnection(payload);
      const lines = [result.message, ...statusLines(record)];
      return finish(
        isJSON,
        result.state === "error" ? 1 : 0,
        publicStatus(record, result.message),
        lines
      );
    }

    return runConnect(payload, args, isJSON);
  },
  input: strictObject({
    action: z.enum(["connect", "reset-password", "sample", "sync", "status"]),
    boardName: z.optional(z.string()),
    code: z.optional(z.string()),
    email: z.optional(z.string()),
    json: z.optional(z.boolean()),
    key: z.optional(z.string()),
    workspace: z.optional(z.string()),
  }),
});
