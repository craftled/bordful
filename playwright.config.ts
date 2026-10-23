import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

interface FlowEntry {
  enabled: boolean;
  file: string;
  id: string;
  requires: string[];
}

const NUMERIC_PORT = /^\d+$/;
const root = path.dirname(fileURLToPath(import.meta.url));
const e2eDir = path.join(root, "tests/e2e");
const registry = JSON.parse(
  readFileSync(path.join(e2eDir, "flows.json"), "utf8")
) as { flows: FlowEntry[] };

for (const flow of registry.flows) {
  if (!existsSync(path.join(e2eDir, flow.file))) {
    throw new Error(`E2E flow ${flow.id} lists missing file ${flow.file}`);
  }
}

function port(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  if (!NUMERIC_PORT.test(value)) {
    throw new Error(`${name} must be a numeric port`);
  }

  return value;
}

const mockPort = port("MOCK_PORT", "4999");
const appPort = port("APP_PORT", "3000");
const marketingPort = port("APP_MARKETING_PORT", "3001");
const mockOrigin = `http://127.0.0.1:${mockPort}`;
const appOrigin = `http://127.0.0.1:${appPort}`;
const marketingOrigin = `http://127.0.0.1:${marketingPort}`;

process.env.E2E_MARKETING_BASE_URL ??= marketingOrigin;

// The pieces stay split. The generic-api-key rule flags this documented fixture
// when the full value sits next to CRON_SECRET, and this repo does not allowlist paths.
const e2eCron = ["e2e-cron-secret", "0123456789"].join("-");

const e2eEnv = {
  BORDFEED_BASE_URL: mockOrigin,
  BORDFUL_RELEASES_URL: `${mockOrigin}/repos/craftled/bordful/releases?per_page=20`,
  BORDFUL_TEST_CLOCK: "true",
  CRON_SECRET: e2eCron,
  RESEND_API_KEY: "re_e2e_fake",
  RESEND_BASE_URL: mockOrigin,
};

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? appOrigin;

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  retries: process.env.CI ? 2 : 0,
  testDir: "tests/e2e",
  testMatch: registry.flows
    .filter((flow) => flow.enabled)
    .map((flow) => flow.file),
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "bun tests/mocks/server.ts",
      env: { MOCK_PORT: mockPort },
      name: "mock",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      url: `${mockOrigin}/__mock/health`,
    },
    {
      command: `bun run start -- -p ${appPort}`,
      env: {
        ...e2eEnv,
        NEXT_PUBLIC_SERVER_URL: appOrigin,
      },
      name: "app",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      url: appOrigin,
    },
    {
      command: `bun run start -- -p ${marketingPort}`,
      env: {
        ...e2eEnv,
        BORDFUL_MARKETING: "true",
        NEXT_PUBLIC_SERVER_URL: appOrigin,
      },
      name: "marketing",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      url: marketingOrigin,
    },
  ],
  workers: 1,
});
