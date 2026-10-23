import type { Payload } from "payload";
import { expect, test } from "vitest";

import { EMPTY_JOB_ALERT_QUERY } from "@/lib/domain/job-vocab";

import type { AlertSender } from "./sender";
import {
  SUBSCRIBE_OK_MESSAGE,
  SUBSCRIBE_SEND_FAILED_MESSAGE,
  subscribeToAlerts,
} from "./subscribe";

interface Row {
  confirmTokenHash?: string | null;
  email: string;
  frequency: string;
  id: number;
  query: unknown;
  status: string;
  unsubscribeTokenHash?: string | null;
  updatedAt: string;
}

function matches(
  row: Row,
  where: {
    and?: Record<string, { equals: unknown }>[];
    [key: string]: { equals: unknown } | unknown;
  }
): boolean {
  if (Array.isArray(where.and)) {
    return where.and.every((clause) =>
      matches(row, clause as { [key: string]: { equals: unknown } })
    );
  }

  for (const [field, condition] of Object.entries(where)) {
    if (
      field === "and" ||
      condition === null ||
      typeof condition !== "object"
    ) {
      continue;
    }
    if ("equals" in condition && row[field as keyof Row] !== condition.equals) {
      return false;
    }
  }
  return true;
}

function memoryPayload(seed: Row[]): Payload & { rows: Row[] } {
  const rows = seed.map((row) => ({ ...row }));
  let nextId = rows.reduce((highest, row) => Math.max(highest, row.id), 0) + 1;
  const payload = {
    create(args: { data: Omit<Row, "id" | "updatedAt"> }) {
      const row: Row = {
        ...args.data,
        id: nextId,
        updatedAt: new Date().toISOString(),
      };
      nextId += 1;
      rows.push(row);
      return Promise.resolve(row);
    },
    delete(args: { id: number }) {
      const index = rows.findIndex((row) => row.id === args.id);
      if (index >= 0) {
        rows.splice(index, 1);
      }
      return Promise.resolve(args);
    },
    find(args: { where: { [key: string]: { equals: unknown } } }) {
      const docs = rows.filter((row) => matches(row, args.where));
      return Promise.resolve({ docs, totalDocs: docs.length });
    },
    logger: {
      error: () => undefined,
      fatal: () => undefined,
    },
    rows,
    update(args: { data: Partial<Row>; id: number }) {
      const row = rows.find((item) => item.id === args.id);
      if (!row) {
        return Promise.reject(new Error("missing subscriber"));
      }
      Object.assign(row, args.data, { updatedAt: new Date().toISOString() });
      return Promise.resolve(row);
    },
  };
  return payload as unknown as Payload & { rows: Row[] };
}

function deps(sender: AlertSender) {
  return {
    fromEmail: "alerts@board.example",
    fromName: "Example Board",
    secret: "example-payload-secret-0123456789abcdef",
    sender,
    siteName: "Example Board",
    siteUrl: "https://board.example",
  };
}

const input = {
  email: "ada@example.com",
  frequency: "weekly" as const,
  now: new Date("2026-10-23T08:00:00.000Z"),
  query: EMPTY_JOB_ALERT_QUERY,
};

test("a failed confirmation does not cool down the retry", async () => {
  const payload = memoryPayload([
    {
      email: "ada@example.com",
      frequency: "weekly",
      id: 7,
      query: EMPTY_JOB_ALERT_QUERY,
      status: "pending",
      updatedAt: new Date(input.now.getTime() - 11 * 60 * 1000).toISOString(),
    },
  ]);
  let calls = 0;
  const sender: AlertSender = {
    send() {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(new Error("down"));
      }
      return Promise.resolve();
    },
  };

  const first = await subscribeToAlerts(payload, input, deps(sender));
  expect(first).toEqual({
    message: SUBSCRIBE_SEND_FAILED_MESSAGE,
    ok: false,
  });
  expect(payload.rows[0]?.status).toBe("pending");
  expect(payload.rows[0]?.updatedAt).toBe(
    new Date(input.now.getTime() - 11 * 60 * 1000).toISOString()
  );

  const second = await subscribeToAlerts(payload, input, deps(sender));
  expect(second).toEqual({ message: SUBSCRIBE_OK_MESSAGE, ok: true });
  expect(calls).toBe(2);
  expect(payload.rows[0]?.status).toBe("pending");
});

test("resubscribe after unsubscribe sends within the cooldown window", async () => {
  const payload = memoryPayload([
    {
      email: "ada@example.com",
      frequency: "weekly",
      id: 7,
      query: EMPTY_JOB_ALERT_QUERY,
      status: "unsubscribed",
      updatedAt: input.now.toISOString(),
    },
  ]);
  let calls = 0;
  const sender: AlertSender = {
    send() {
      calls += 1;
      return Promise.resolve();
    },
  };

  const result = await subscribeToAlerts(payload, input, deps(sender));
  expect(result).toEqual({ message: SUBSCRIBE_OK_MESSAGE, ok: true });
  expect(calls).toBe(1);
  expect(payload.rows[0]?.status).toBe("pending");
});

test("a failed first send removes the new pending row", async () => {
  const payload = memoryPayload([]);
  let calls = 0;
  const sender: AlertSender = {
    send() {
      calls += 1;
      if (calls === 1) {
        return Promise.reject(new Error("down"));
      }
      return Promise.resolve();
    },
  };

  const first = await subscribeToAlerts(payload, input, deps(sender));
  expect(first.ok).toBe(false);
  expect(payload.rows).toHaveLength(0);

  const second = await subscribeToAlerts(payload, input, deps(sender));
  expect(second.ok).toBe(true);
  expect(calls).toBe(2);
  expect(payload.rows).toHaveLength(1);
});
