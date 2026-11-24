// biome-ignore lint/correctness/noUndeclaredDependencies: pg-connection-string is the parser pg uses for DATABASE_URL, so this checks what the adapter will see.
import { parse } from "pg-connection-string";
import { expect, test, vi } from "vitest";

import { pgConnectionString } from "./connection-string";

const neon =
  "postgresql://user:p%40ss@ep-example-123-pooler.us-east-1.aws.neon.tech/neondb";

test("the verify-full aliases become verify-full", () => {
  for (const mode of ["prefer", "require", "verify-ca"]) {
    const out = new URL(pgConnectionString(`${neon}?sslmode=${mode}`));
    expect(out.searchParams.get("sslmode")).toBe("verify-full");
    expect(out.hostname).toBe("ep-example-123-pooler.us-east-1.aws.neon.tech");
    expect(out.password).toBe("p%40ss");
    expect(out.pathname).toBe("/neondb");
  }
});

test("other query parameters survive", () => {
  const out = new URL(
    pgConnectionString(`${neon}?sslmode=require&channel_binding=require`)
  );
  expect(out.searchParams.get("channel_binding")).toBe("require");
  expect(out.searchParams.get("sslmode")).toBe("verify-full");
});

test("strings that need no change are returned as-is", () => {
  for (const input of [
    neon,
    `${neon}?sslmode=verify-full`,
    `${neon}?sslmode=disable`,
    `${neon}?sslmode=no-verify`,
    `${neon}?uselibpqcompat=true&sslmode=require`,
    "postgres://tomaslau@localhost:5432/bordful",
    "",
    "host=localhost dbname=bordful",
  ]) {
    expect(pgConnectionString(input)).toBe(input);
  }
});

test("pg parses the result without the sslmode warning", () => {
  const emit = vi
    .spyOn(process, "emitWarning")
    .mockImplementation(() => undefined);
  const config = parse(pgConnectionString(`${neon}?sslmode=require`));
  expect(config.ssl).toBeTruthy();
  expect(emit).not.toHaveBeenCalled();
  emit.mockRestore();
});
