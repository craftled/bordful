import { existsSync } from "node:fs";

import { expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const { GET } = await import("./route");

test("expire cron rejects a request without the bearer secret", async () => {
  const response = await GET(new Request("http://x/api/cron/expire"));
  expect(response.status).toBe(401);
});
