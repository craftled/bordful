import type { Payload } from "payload";
import { afterEach, expect, test } from "vitest";

import { runAlertDigests } from "./digest";
import type { AlertSender } from "./sender";

const previousKey = process.env.RESEND_API_KEY;
const previousSecret = process.env.PAYLOAD_SECRET;

afterEach(() => {
  if (previousKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = previousKey;
  }
  if (previousSecret === undefined) {
    delete process.env.PAYLOAD_SECRET;
  } else {
    process.env.PAYLOAD_SECRET = previousSecret;
  }
});

function readyPayload(update: Payload["update"]): Payload {
  let subscriberReads = 0;
  return {
    find: (args: { collection: string }) => {
      if (args.collection === "jobs") {
        return {
          docs: [
            {
              companyName: "Example Co",
              id: "job-1",
              origin: "manual",
              publishedAt: "2026-10-20T09:00:00.000Z",
              slug: "example-role",
              title: "Example Role",
            },
          ],
          page: 1,
          totalDocs: 1,
          totalPages: 1,
        };
      }

      subscriberReads += 1;
      if (subscriberReads > 1) {
        return { docs: [], totalDocs: 0, totalPages: 0 };
      }
      return {
        docs: [
          {
            confirmedAt: "2026-10-01T00:00:00.000Z",
            email: "ada@example.com",
            frequency: "weekly",
            id: 42,
            lastSentAt: null,
            query: {},
            status: "active",
            watermark: "2026-10-01T00:00:00.000Z",
          },
        ],
        totalDocs: 1,
        totalPages: 1,
      };
    },
    findGlobal: () => ({
      alerts: {
        defaultFrequency: "weekly",
        enabled: true,
        fromEmail: "alerts@board.example",
        fromName: "Example Board",
      },
      name: "Example Board",
    }),
    logger: {
      error: () => undefined,
      fatal: () => undefined,
    },
    update,
  } as unknown as Payload;
}

test("markSent retries once after the digest email is sent", async () => {
  process.env.RESEND_API_KEY = "re_test_fake";
  process.env.PAYLOAD_SECRET = "example-payload-secret-0123456789abcdef";
  let updates = 0;
  let sends = 0;
  const sender: AlertSender = {
    send() {
      sends += 1;
      return Promise.resolve();
    },
  };
  const payload = readyPayload((() => {
    updates += 1;
    if (updates === 1) {
      return Promise.reject(new Error("db"));
    }
    return Promise.resolve({});
  }) as unknown as Payload["update"]);

  const result = await runAlertDigests(payload, {
    now: new Date("2026-10-23T08:00:00.000Z"),
    sender,
  });

  expect(sends).toBe(1);
  expect(updates).toBe(2);
  expect(result).toMatchObject({ failed: 0, sent: 1 });
});
