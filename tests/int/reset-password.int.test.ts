import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

import type { TypeWithID } from "payload";
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest";
import { adminEmails, resetPassword } from "@/lib/install/reset-password";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_TEST is required for test:int");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//u, "");
if (!(databaseName.endsWith("_int") || databaseName.endsWith("_test"))) {
  throw new Error(
    `DATABASE_URL_TEST database must end with _int or _test (${databaseName})`
  );
}

process.env.DATABASE_URL = databaseUrl;

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");

const payload = await getPayload({ config });

const OWNER = "owner@example.com";
const OLD_PASSWORD = "Example-Passw0rd-123";
const API_KEY = "example-user-api-key";

type OwnerRow = TypeWithID & Record<string, unknown>;

function login(password: string) {
  return payload.login({
    collection: "users",
    data: { email: OWNER, password },
  });
}

async function storedOwner() {
  const found = await payload.db.findOne<OwnerRow>({
    collection: "users",
    where: { email: { equals: OWNER } },
  });
  if (!found) {
    throw new Error("Owner is missing.");
  }

  return found;
}

async function lockOwner(): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    // biome-ignore lint/performance/noAwaitInLoops: each failed attempt must land before the next.
    await login("wrong-password").catch(() => undefined);
  }

  await expect(login(OLD_PASSWORD)).rejects.toThrow();
}

function runBordful(args: string[], env: Record<string, string>) {
  return spawnSync("bun", ["run", "bordful", ...args, "--json"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, ...env },
    timeout: 120_000,
  });
}

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
});

beforeEach(async () => {
  await payload.delete({
    collection: "users",
    overrideAccess: true,
    where: { id: { exists: true } },
  });
  await payload.create({
    collection: "users",
    data: {
      apiKey: API_KEY,
      email: OWNER,
      password: OLD_PASSWORD,
      roles: ["admin"],
    },
    overrideAccess: true,
  });
});

afterAll(async () => {
  await payload.destroy();
});

test("a locked-out owner signs in with the new password and the old one stops working", async () => {
  await lockOwner();
  const password = await resetPassword(payload, ` ${OWNER.toUpperCase()} `);

  expect(password?.length).toBeGreaterThanOrEqual(24);
  await expect(login(password ?? "")).resolves.toMatchObject({
    user: { email: OWNER },
  });
  await expect(login(OLD_PASSWORD)).rejects.toThrow();
});

test("a reset ends existing sessions", async () => {
  const before = await login(OLD_PASSWORD);
  const decoded = JSON.parse(
    Buffer.from(before.token?.split(".")[1] ?? "", "base64url").toString()
  ) as { sid: string };

  await resetPassword(payload, OWNER);

  const sessions = (await storedOwner()).sessions as { id: string }[];
  expect(sessions.map((session) => session.id)).not.toContain(decoded.sid);
});

test("an unknown email changes nothing and admins can still be listed", async () => {
  await expect(resetPassword(payload, "other@example.com")).resolves.toBeNull();
  await expect(login(OLD_PASSWORD)).resolves.toMatchObject({
    user: { email: OWNER },
  });
  await expect(adminEmails(payload)).resolves.toEqual([OWNER]);
});

test("the CLI resets a password without the deployment's PAYLOAD_SECRET", async () => {
  const before = await storedOwner();
  await lockOwner();

  const run = runBordful(["reset-password", "--email", OWNER], {
    PAYLOAD_SECRET: "a-different-throwaway-value",
  });
  expect(run.status, run.stderr).toBe(0);
  const output = JSON.parse(run.stdout) as {
    result: { email: string; password: string };
  };
  expect(output.result.email).toBe(OWNER);

  await expect(login(output.result.password)).resolves.toMatchObject({
    user: { email: OWNER },
  });

  const after = await storedOwner();
  expect(after.apiKey).toBe(before.apiKey);
  expect(after.apiKeyIndex).toBe(before.apiKeyIndex);
  expect(payload.decrypt(after.apiKey as string)).toBe(API_KEY);
});

test("the CLI names the admins when the email is missing or wrong", () => {
  for (const args of [
    ["reset-password"],
    ["reset-password", "--email", "other@example.com"],
  ]) {
    const run = runBordful(args, {});
    expect(run.status).toBe(1);
    const output = JSON.parse(run.stdout) as { result: { admins: string[] } };
    expect(output.result.admins).toEqual([OWNER]);
  }
});
