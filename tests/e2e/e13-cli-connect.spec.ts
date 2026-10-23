import { spawnSync } from "node:child_process";

import { expect, test } from "@playwright/test";

import { ensureAdmin } from "./support/admin";
import { bordfeedRequests, mockOrigin } from "./support/mock";
import { readGlobal } from "./support/seed";

const FULL_KEY = ["bf_mock_key", "0000000000000001"].join("_");

function runBordful(args: string[], input?: string) {
  return spawnSync("bun", ["run", "bordful", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      BORDFEED_BASE_URL: mockOrigin(),
    },
    input,
  });
}

test.describe("E13 cli-connect", { tag: ["@E13"] }, () => {
  test("connects from the CLI with the same stored shape", async ({
    request,
  }) => {
    test.setTimeout(180_000);
    const sample = runBordful(["sample"]);
    expect(sample.status).toBe(0);

    const connect = runBordful(
      [
        "connect",
        "--email",
        "owner@example.com",
        "--board-name",
        "Example Board",
      ],
      "424242\n"
    );
    expect(connect.status).toBe(0);
    const stdout = connect.stdout ?? "";
    expect(stdout).toContain("Connected");
    expect(stdout).toContain("bf_...0001");
    expect(stdout.includes(FULL_KEY)).toBe(false);

    const admin = await ensureAdmin(request);
    const connection = await readGlobal(admin, "bordfeed-connection");
    await admin.dispose();
    expect(connection.state).toBe("connected");
    expect(connection.feedId).toBe("11111111-1111-4111-8111-111111111111");
    expect(connection.keyHint).toBe("bf_...0001");
    expect(connection.showAttribution).toBe(true);

    const registers = (await bordfeedRequests()).filter(
      (entry) => entry.path === "/api/agent/register"
    );
    const last = registers.at(-1)?.body;
    const body =
      last !== null && typeof last === "object"
        ? (last as { utm_medium?: string })
        : {};
    expect(body.utm_medium).toBe("cli");
  });
});
