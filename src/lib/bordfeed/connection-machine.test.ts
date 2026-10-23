import { expect, test } from "vitest";

import {
  applyConnectionEvent,
  type ConnectionEvent,
  type ConnectionRecord,
} from "./connection-machine";
import type { SafeError } from "./types";

const now = new Date("2026-10-23T12:00:00.000Z");
const error: SafeError = {
  at: "2026-10-23T09:00:00.000Z",
  code: "network",
  message: "Could not reach Bordfeed.",
};
const summary = { created: 1, mode: "sample" };

function record(patch: Partial<ConnectionRecord> = {}): ConnectionRecord {
  return {
    apiKeyEncrypted: null,
    feedId: null,
    filters: { category: ["engineering"] },
    keyHint: null,
    lastError: null,
    lastSyncAt: null,
    lastSyncSummary: null,
    previousState: null,
    registrationExpiresAt: null,
    registrationId: null,
    showAttribution: true,
    state: "sample",
    templateId: "engineering-it",
    ...patch,
  };
}

function next(
  start: ConnectionRecord,
  event: ConnectionEvent
): ConnectionRecord {
  const result = applyConnectionEvent(start, event, now);
  if (!result.ok) {
    throw new Error(result.reason);
  }

  return result.next;
}

test("legal connection transitions produce the next record", () => {
  const key = {
    apiKeyEncrypted: "v1:0123456789abcdef:aa:bb:cc",
    keyHint: "bf_...0001",
  };
  expect(
    next(record(), {
      expiresAt: "2026-10-23T12:15:00.000Z",
      registrationId: "reg_1",
      type: "registered",
    })
  ).toEqual(
    record({
      registrationExpiresAt: "2026-10-23T12:15:00.000Z",
      registrationId: "reg_1",
      state: "awaiting_code",
    })
  );
  expect(
    next(
      record({
        registrationExpiresAt: "2026-10-23T12:15:00.000Z",
        registrationId: "old",
        state: "awaiting_code",
      }),
      {
        expiresAt: "2026-10-23T12:20:00.000Z",
        registrationId: "reg_2",
        type: "registered",
      }
    ).registrationId
  ).toBe("reg_2");
  expect(
    next(
      record({ lastError: error, previousState: "sample", state: "error" }),
      {
        expiresAt: "2026-10-23T12:20:00.000Z",
        registrationId: "reg_3",
        type: "registered",
      }
    )
  ).toMatchObject({ lastError: null, state: "awaiting_code" });

  expect(next(record(), { ...key, type: "key_stored" })).toMatchObject(key);
  expect(
    next(record({ state: "awaiting_code" }), { ...key, type: "key_stored" })
      .state
  ).toBe("awaiting_code");
  expect(
    next(record({ previousState: "sample", state: "error" }), {
      ...key,
      type: "key_stored",
    }).state
  ).toBe("error");

  expect(next(record(key), { feedId: "feed_1", type: "feed_ready" })).toEqual(
    record({
      ...key,
      feedId: "feed_1",
      showAttribution: true,
      state: "connected",
    })
  );
  expect(
    next(
      record({
        ...key,
        lastError: error,
        previousState: "sample",
        registrationExpiresAt: "2026-10-23T12:15:00.000Z",
        registrationId: "reg_1",
        state: "error",
      }),
      { feedId: "feed_1", type: "feed_ready" }
    )
  ).toEqual(
    record({
      ...key,
      feedId: "feed_1",
      showAttribution: true,
      state: "connected",
    })
  );

  expect(
    next(record(), {
      at: "2026-10-23T12:00:00.000Z",
      summary,
      type: "sync_succeeded",
    })
  ).toMatchObject({
    lastSyncAt: "2026-10-23T12:00:00.000Z",
    lastSyncSummary: summary,
    state: "sample",
  });
  expect(
    next(record({ state: "awaiting_code" }), {
      at: "2026-10-23T12:00:00.000Z",
      summary,
      type: "sync_succeeded",
    }).state
  ).toBe("awaiting_code");
  expect(
    next(record({ ...key, feedId: "feed_1", state: "connected" }), {
      at: "2026-10-23T12:00:00.000Z",
      summary,
      type: "sync_succeeded",
    }).state
  ).toBe("connected");
  expect(
    next(
      record({
        ...key,
        feedId: "feed_1",
        lastError: error,
        previousState: "connected",
        state: "error",
      }),
      { at: "2026-10-23T12:00:00.000Z", summary, type: "sync_succeeded" }
    )
  ).toMatchObject({ lastError: null, previousState: null, state: "connected" });
  expect(
    next(
      record({ lastError: error, previousState: "sample", state: "error" }),
      {
        at: "2026-10-23T12:00:00.000Z",
        summary,
        type: "sync_succeeded",
      }
    )
  ).toMatchObject({ previousState: null, state: "sample" });

  expect(
    next(record({ ...key, feedId: "feed_1", state: "connected" }), {
      error,
      type: "sync_failed",
    })
  ).toMatchObject({
    lastError: error,
    previousState: "connected",
    state: "error",
  });
  expect(next(record(), { error, type: "sync_failed" })).toMatchObject({
    previousState: "sample",
    state: "error",
  });
  expect(
    next(record({ state: "awaiting_code" }), { error, type: "sync_failed" })
  ).toMatchObject({ lastError: error, state: "awaiting_code" });
  expect(
    next(
      record({ lastError: error, previousState: "connected", state: "error" }),
      {
        error: { ...error, code: "unknown" },
        type: "sync_failed",
      }
    )
  ).toMatchObject({
    lastError: { code: "unknown" },
    previousState: "connected",
    state: "error",
  });

  expect(next(record(), { error, type: "connect_failed" }).lastError).toEqual(
    error
  );
  expect(
    next(record({ state: "awaiting_code" }), { error, type: "connect_failed" })
      .state
  ).toBe("awaiting_code");
  expect(
    next(record({ previousState: "sample", state: "error" }), {
      error,
      type: "connect_failed",
    }).state
  ).toBe("error");

  expect(
    next(
      record({
        registrationExpiresAt: "2026-10-23T11:00:00.000Z",
        registrationId: "reg_1",
        state: "awaiting_code",
      }),
      { type: "registration_expired" }
    )
  ).toEqual(record());

  expect(
    next(
      record({
        ...key,
        feedId: "feed_1",
        lastError: error,
        lastSyncAt: "2026-10-23T11:00:00.000Z",
        previousState: "connected",
        registrationId: "reg_1",
        showAttribution: false,
        state: "connected",
      }),
      { type: "reset" }
    )
  ).toEqual(
    record({
      lastSyncSummary: null,
      showAttribution: true,
    })
  );

  expect(
    next(record(), { show: true, type: "attribution_set" }).showAttribution
  ).toBe(true);
  expect(
    next(record({ ...key, feedId: "feed_1", state: "connected" }), {
      show: false,
      type: "attribution_set",
    }).showAttribution
  ).toBe(false);
});

test("illegal connection transitions are rejected", () => {
  const cases: [ConnectionRecord, ConnectionEvent][] = [
    [
      record({ feedId: "feed_1", state: "connected" }),
      { expiresAt: "x", registrationId: "r", type: "registered" },
    ],
    [record(), { feedId: "feed_1", type: "feed_ready" }],
    [
      record({
        registrationExpiresAt: "2026-10-23T13:00:00.000Z",
        registrationId: "reg_1",
        state: "awaiting_code",
      }),
      { type: "registration_expired" },
    ],
    [record(), { show: false, type: "attribution_set" }],
    [
      record({ feedId: "feed_1", state: "connected" }),
      {
        apiKeyEncrypted: "v1:0123456789abcdef:aa:bb:cc",
        keyHint: "bf_...0001",
        type: "key_stored",
      },
    ],
  ];

  for (const [start, event] of cases) {
    expect(applyConnectionEvent(start, event, now).ok).toBe(false);
  }
});
