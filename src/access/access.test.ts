import type { FieldAccessArgs, PayloadRequest } from "payload";
import { expect, test } from "vitest";

import { jobsRead, publishedAndUnexpiredWhere } from "./jobs";
import { hasRole } from "./roles";
import { syncOwnedFieldUpdate } from "./sync-owned";

const adminRequest = {
  user: { id: 1, roles: ["admin"] },
} as unknown as PayloadRequest;

const editorRequest = {
  user: { id: 2, roles: ["editor"] },
} as unknown as PayloadRequest;

const anonymousRequest = {} as unknown as PayloadRequest;

function fieldArgs(req: PayloadRequest, origin: string): FieldAccessArgs {
  return {
    doc: { id: 1, origin },
    id: 1,
    req,
  } as unknown as FieldAccessArgs;
}

test("publishedAndUnexpiredWhere matches the public read shape", () => {
  expect(
    publishedAndUnexpiredWhere(new Date("2026-10-23T12:00:00.000Z"))
  ).toEqual({
    and: [
      { _status: { equals: "published" } },
      {
        or: [
          { validThrough: { exists: false } },
          { validThrough: { greater_than: "2026-10-23T12:00:00.000Z" } },
        ],
      },
    ],
  });
});

test("hasRole requires the named role", () => {
  expect(hasRole({ roles: ["editor"] }, "admin")).toBe(false);
});

test("syncOwnedFieldUpdate locks bordfeed rows and allows staff otherwise", () => {
  expect(syncOwnedFieldUpdate(fieldArgs(editorRequest, "bordfeed"))).toBe(
    false
  );
  expect(
    syncOwnedFieldUpdate(fieldArgs(editorRequest, "bordfeed_sample"))
  ).toBe(false);
  expect(syncOwnedFieldUpdate(fieldArgs(editorRequest, "manual"))).toBe(true);
  expect(syncOwnedFieldUpdate(fieldArgs(editorRequest, "paid"))).toBe(true);
  expect(syncOwnedFieldUpdate(fieldArgs(anonymousRequest, "manual"))).toBe(
    false
  );
});

test("jobsRead allows an admin through", () => {
  expect(jobsRead({ req: adminRequest, slug: "jobs" })).toBe(true);
});
