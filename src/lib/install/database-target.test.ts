import { expect, test } from "vitest";

import { checkDatabaseTarget } from "./database-target";

const URL_A =
  "postgresql://user:hunter2x@ep-example-123.us-east-1.aws.neon.tech/neondb?sslmode=require";
const TARGET_A = "ep-example-123.us-east-1.aws.neon.tech:5432/neondb";

function failure(databaseUrl: string, confirmed: string | undefined) {
  const result = checkDatabaseTarget(databaseUrl, confirmed);
  if (result.ok) {
    throw new Error("Expected the check to fail.");
  }

  return result;
}

test("stops on an empty DATABASE_URL", () => {
  for (const value of [undefined, "", "   "]) {
    expect(checkDatabaseTarget(value, TARGET_A)).toMatchObject({
      ok: false,
      target: null,
    });
  }
});

test("stops on a URL with no host", () => {
  expect(checkDatabaseTarget("not a url", "localhost")).toMatchObject({
    ok: false,
    target: null,
  });
});

test("names host, port and database and asks for them when not confirmed", () => {
  const result = failure(URL_A, undefined);
  expect(result.target).toBe(TARGET_A);
  expect(result.message).toContain(`--database-host ${TARGET_A}`);
  expect(result.message).not.toContain("hunter2x");
});

test("passes with host, port and database, ignoring host case and spaces", () => {
  expect(checkDatabaseTarget(URL_A, TARGET_A)).toEqual({
    ok: true,
    target: TARGET_A,
  });
  expect(
    checkDatabaseTarget(
      URL_A,
      " EP-EXAMPLE-123.us-east-1.aws.neon.tech:5432/neondb "
    )
  ).toEqual({ ok: true, target: TARGET_A });
});

test("stops when only the host is confirmed", () => {
  const result = failure(URL_A, "ep-example-123.us-east-1.aws.neon.tech");
  expect(result.message).toContain("Nothing was changed");
  expect(result.message).not.toContain("hunter2x");
});

test("stops when the confirmed host is a different server", () => {
  expect(
    failure(URL_A, "ep-other-456.us-east-1.aws.neon.tech:5432/neondb").ok
  ).toBe(false);
});

test("stops on a different database on the same host", () => {
  expect(
    failure(
      "postgres://u:hunter2x@localhost:5432/otherboard",
      "localhost:5432/board"
    ).target
  ).toBe("localhost:5432/otherboard");
});

test("keeps database names case sensitive", () => {
  expect(
    failure("postgres://u:p@localhost:5432/Board", "localhost:5432/board").ok
  ).toBe(false);
});

test("stops on a different port", () => {
  const result = failure(
    "postgres://u:p@localhost:6543/board",
    "localhost:5432/board"
  );
  expect(result.target).toBe("localhost:6543/board");
});

test("prints the port pg will use when ?port= overrides the URL", () => {
  expect(
    failure("postgres://u:p@localhost:5432/board?port=6543", undefined).target
  ).toBe("localhost:6543/board");
});

test("stops when ?host= points somewhere other than the URL host", () => {
  const result = failure(
    "postgres://u:hunter2x@localhost/board?host=db.example.com",
    "localhost:5432/board"
  );
  expect(result.target).toBeNull();
  expect(result.message).not.toContain("hunter2x");
});

test("stops on a socket ?host=", () => {
  for (const socket of ["/cloudsql/proj:region:inst", "/var/run/postgresql"]) {
    expect(
      failure(
        `postgres://u:p@localhost/board?host=${socket}`,
        "localhost:5432/board"
      ).target
    ).toBeNull();
  }
});

test("stops when there is no URL host to confirm", () => {
  expect(
    failure("postgres:///board", "localhost:5432/board").target
  ).toBeNull();
});
