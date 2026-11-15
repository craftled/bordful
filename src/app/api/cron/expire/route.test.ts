import { existsSync } from "node:fs";

import { expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

// The route imports the Payload config, which needs a secret at load time.
// CI sets one; a local run without .env gets a throwaway value.
process.env.PAYLOAD_SECRET ||= "unit-test-only-payload-secret-placeholder";

const { GET } = await import("./route");

test("expire cron rejects a request without the bearer secret", async () => {
  const response = await GET(new Request("http://x/api/cron/expire"));
  expect(response.status).toBe(401);
});
