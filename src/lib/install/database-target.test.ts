import { expect, test } from "vitest";

import { checkDatabaseTarget } from "./database-target";

const URL_A =
  "postgresql://user:hunter2x@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require";

test("stops on an empty DATABASE_URL", () => {
  for (const value of [undefined, "", "   "]) {
    const result = checkDatabaseTarget(
      value,
      "ep-example-123.us-east-1.aws.neon.tech"
    );
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ host: null });
  }
});

test("stops on a URL with no host", () => {
  expect(checkDatabaseTarget("not a url", "localhost")).toMatchObject({
    host: null,
    ok: false,
  });
});

test("names the host and asks for it when not confirmed", () => {
  const result = checkDatabaseTarget(URL_A, undefined);
  expect(result).toMatchObject({
    host: "ep-example-123.us-east-1.aws.neon.tech",
    ok: false,
  });
  if (!result.ok) {
    expect(result.message).toContain(
      "--database-host ep-example-123.us-east-1.aws.neon.tech"
    );
    expect(result.message).not.toContain("hunter2x");
  }
});

test("stops when the confirmed host is a different database", () => {
  const result = checkDatabaseTarget(
    URL_A,
    "ep-other-456.us-east-1.aws.neon.tech"
  );
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.message).toContain("Nothing was changed");
    expect(result.message).not.toContain("hunter2x");
  }
});

test("passes when the confirmed host matches, ignoring case and spaces", () => {
  expect(
    checkDatabaseTarget(URL_A, " EP-EXAMPLE-123.us-east-1.aws.neon.tech ")
  ).toEqual({ host: "ep-example-123.us-east-1.aws.neon.tech", ok: true });
});
