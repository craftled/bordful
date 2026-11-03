import { expect, test } from "vitest";

import { docId, docString } from "../e2e/support/seed";

test("docId accepts a finite number or a non-empty string", () => {
  expect(docId({ id: 42 })).toBe("42");
  expect(docId({ id: 0 })).toBe("0");
  expect(docId({ id: "job_1" })).toBe("job_1");
});

test("docId rejects values that are not an id", () => {
  expect(() => docId({})).toThrow("missing id");
  expect(() => docId({ id: "" })).toThrow("missing id");
  expect(() => docId({ id: Number.NaN })).toThrow("missing id");
  expect(() => docId({ id: Number.POSITIVE_INFINITY })).toThrow("missing id");
  expect(() => docId({ id: null })).toThrow("missing id");
});

test("docString still requires a non-empty string", () => {
  expect(docString({ slug: "e3zq" }, "slug")).toBe("e3zq");
  expect(() => docString({ id: 7 }, "id")).toThrow("missing id");
});
