import type { Payload, Where } from "payload";
import { expect, test } from "vitest";

import { computeValidThrough, expireJobs, expireJobsTask } from "./expire-job";

function runHandler(
  input: unknown,
  payload: Payload
): Promise<{ output: unknown }> {
  if (typeof expireJobsTask.handler !== "function") {
    throw new Error("expireJobsTask.handler must be a function");
  }

  return expireJobsTask.handler({
    input,
    req: { payload },
  } as never) as Promise<{ output: unknown }>;
}

const publishedAt = "2026-10-20T09:00:00.000Z";

test("paid listings last durationDays from publishedAt", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "paid",
      publishedAt,
      validThrough: null,
    })
  ).toBe("2026-11-19T09:00:00.000Z");
  expect(
    computeValidThrough({
      durationDays: 1,
      origin: "paid",
      publishedAt,
      validThrough: null,
    })
  ).toBe("2026-10-21T09:00:00.000Z");
  expect(
    computeValidThrough({
      durationDays: 365,
      origin: "paid",
      publishedAt,
      validThrough: null,
    })
  ).toBe("2027-10-20T09:00:00.000Z");
});

test("an owner-set validThrough is kept for paid listings", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "paid",
      publishedAt,
      validThrough: "2026-12-01T00:00:00.000Z",
    })
  ).toBe("2026-12-01T00:00:00.000Z");
});

test("a paid draft without publishedAt has no validThrough", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "paid",
      publishedAt: null,
      validThrough: null,
    })
  ).toBeNull();
});

test("non-paid origins keep the given validThrough", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "manual",
      publishedAt,
      validThrough: null,
    })
  ).toBeNull();
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "bordfeed",
      publishedAt,
      validThrough: "2026-11-01T00:00:00.000Z",
    })
  ).toBe("2026-11-01T00:00:00.000Z");
});

test("an invalid publishedAt leaves validThrough unchanged", () => {
  expect(
    computeValidThrough({
      durationDays: 30,
      origin: "paid",
      publishedAt: "not-a-date",
      validThrough: null,
    })
  ).toBeNull();
});

test("expireJobsTask rejects an invalid now", async () => {
  await expect(
    runHandler({ now: "not-a-date" }, {} as Payload)
  ).rejects.toThrow();
});

test("expireJobsTask queries the parsed now and falls back to the current time", async () => {
  const queried: string[] = [];
  const payload = {
    find: (args: { where: Where }) => {
      const clauses = args.where.and;
      const validThrough = Array.isArray(clauses) ? clauses[1] : undefined;
      if (
        validThrough &&
        typeof validThrough === "object" &&
        "validThrough" in validThrough &&
        validThrough.validThrough &&
        typeof validThrough.validThrough === "object" &&
        "less_than_equal" in validThrough.validThrough
      ) {
        queried.push(String(validThrough.validThrough.less_than_equal));
      }
      return { docs: [], totalDocs: 0 };
    },
  } as unknown as Payload;

  await expect(
    runHandler({ now: "2098-06-01T09:00:01.000Z" }, payload)
  ).resolves.toEqual({
    output: { failed: 0, failedIds: [], ids: [], unpublished: 0 },
  });
  expect(queried[0]).toBe("2098-06-01T09:00:01.000Z");

  const before = Date.now();
  await runHandler({}, payload);
  const after = Date.now();
  const fallback = new Date(queried[1] ?? "").getTime();
  expect(fallback).toBeGreaterThanOrEqual(before);
  expect(fallback).toBeLessThanOrEqual(after);
});

test("one failed unpublish does not stop the sweep", async () => {
  const queries: Where[] = [];
  const logged: Array<{ id?: number; message?: string }> = [];
  let findCount = 0;
  const payload = {
    find: (args: { where: Where }) => {
      queries.push(args.where);
      findCount += 1;
      if (findCount === 1) {
        return { docs: [{ id: 11 }, { id: 12 }], totalDocs: 2 };
      }
      return { docs: [], totalDocs: 0 };
    },
    logger: {
      error(entry: { id?: number }, message?: string) {
        logged.push({ id: entry.id, message });
      },
    },
    update(args: { id: number }) {
      if (args.id === 11) {
        throw new Error("row failed validation");
      }
      return { id: args.id };
    },
  } as unknown as Payload;

  await expect(
    expireJobs(payload, new Date("2098-06-01T09:00:01.000Z"))
  ).resolves.toEqual({
    failed: 1,
    failedIds: ["11"],
    ids: ["12"],
    unpublished: 1,
  });
  expect(queries[1]).toEqual({
    and: [
      { _status: { equals: "published" } },
      { validThrough: { less_than_equal: "2098-06-01T09:00:01.000Z" } },
      { id: { not_in: [11] } },
    ],
  });
  expect(logged).toEqual([{ id: 11, message: "expire job update failed" }]);
});
