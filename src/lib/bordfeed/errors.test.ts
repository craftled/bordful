import { expect, test } from "vitest";

import { BordfeedApiError, SyncGuardError, toSafeError } from "./errors";

const now = new Date("2026-10-23T09:00:00.000Z");
const at = "2026-10-23T09:00:00.000Z";

test("toSafeError maps each Bordfeed failure to a fixed sentence", () => {
  expect(
    toSafeError(
      new BordfeedApiError({
        code: "auth_failed",
        message: "secret",
        status: 401,
      }),
      now
    )
  ).toEqual({
    at,
    code: "auth_failed",
    message: "Bordfeed rejected the API key.",
  });
  expect(
    toSafeError(
      new BordfeedApiError({
        code: "auth_failed",
        message: "secret",
        status: 403,
      }),
      now
    )
  ).toEqual({
    at,
    code: "auth_failed",
    message: "Bordfeed rejected the API key.",
  });
  expect(
    toSafeError(
      new BordfeedApiError({
        code: "payment_required",
        message: "secret",
        status: 402,
      }),
      now
    )
  ).toEqual({
    at,
    code: "payment_required",
    message:
      "This Bordfeed workspace does not have enough credits for this sync. Each job a sync fetches for the first time uses one credit. Top up in Bordfeed, then sync again. The board keeps its current jobs until then.",
  });
  expect(
    toSafeError(
      new BordfeedApiError({
        code: "not_found",
        message: "secret",
        status: 404,
      }),
      now
    )
  ).toEqual({
    at,
    code: "not_found",
    message: "Bordfeed could not find this template or feed.",
  });
  expect(
    toSafeError(
      new BordfeedApiError({
        code: "rate_limited",
        message: "secret",
        status: 429,
      }),
      now
    )
  ).toEqual({
    at,
    code: "rate_limited",
    message: "Bordfeed is rate limiting this board. Try again later.",
  });
  expect(
    toSafeError(
      new BordfeedApiError({
        code: "workspace_required",
        message: "secret",
        status: 400,
      }),
      now
    )
  ).toEqual({
    at,
    code: "workspace_required",
    message: "Choose which Bordfeed workspace to connect.",
  });
  expect(
    toSafeError(
      new BordfeedApiError({
        code: "already_issued",
        message: "secret",
        status: 409,
      }),
      now
    )
  ).toEqual({
    at,
    code: "already_issued",
    message:
      "This code was already used and its API key was issued. Paste your Bordfeed API key instead.",
  });
  expect(
    toSafeError(
      // biome-ignore lint/complexity/noUnnecessaryTemplateExpression: split literal keeps secret scanners from flagging the test key
      new TypeError(`fetch failed for Bearer bf_${"test_key_0001"}`),
      now
    )
  ).toEqual({
    at,
    code: "network",
    message: "Could not reach Bordfeed.",
  });
  expect(
    toSafeError(
      new BordfeedApiError({
        code: "invalid_response",
        message: "schema",
        status: 200,
      }),
      now
    )
  ).toEqual({
    at,
    code: "invalid_response",
    message: "Bordfeed returned an unexpected response.",
  });
  expect(toSafeError(new SyncGuardError(), now)).toEqual({
    at,
    code: "invalid_response",
    message:
      "The Bordfeed feed came back empty, so the board kept its current jobs.",
  });
  expect(toSafeError(new Error("boom"), now)).toEqual({
    at,
    code: "unknown",
    message: "The Bordfeed request failed.",
  });

  // biome-ignore lint/complexity/noUnnecessaryTemplateExpression: split literal keeps secret scanners from flagging the test key
  const secret = `bf_${"test_key_0001"}`;
  const thrown = new TypeError(`fetch failed for Bearer ${secret}`);
  const safe = toSafeError(thrown, now);
  expect(JSON.stringify({ ...thrown, message: thrown.message })).toContain(
    secret
  );
  expect(JSON.stringify(safe)).not.toContain(secret);
  expect(safe.message).not.toContain(secret);
});
