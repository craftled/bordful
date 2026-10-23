import { expect, test } from "vitest";

const HTTP_BASE_URL = /Invalid bordful.config.ts: bordfeed\.baseUrl:/;
const STEP_CRON = /Invalid bordful.config.ts: bordfeed\.syncCron:/;

import { defineBordfulConfig } from "./define-config";
import { bordfulConfig } from "./index";

const defaults = {
  alerts: { provider: "resend" },
  board: { defaultTemplateId: "engineering-it" },
  bordfeed: { baseUrl: "https://bordfeed.com", syncCron: "0 6 * * *" },
  csp: { extraConnectOrigins: [], extraScriptOrigins: [] },
  telemetry: { clientHeader: true },
};

test("defineBordfulConfig fills every default", () => {
  expect(defineBordfulConfig({})).toEqual(defaults);
});

test("a partial override keeps the other defaults", () => {
  expect(defineBordfulConfig({ telemetry: { clientHeader: false } })).toEqual({
    ...defaults,
    telemetry: { clientHeader: false },
  });
});

test("the committed config matches the defaults", () => {
  expect(bordfulConfig).toEqual(defaults);
});

test("rejects an http bordfeed URL and a step cron", () => {
  expect(() =>
    defineBordfulConfig({
      bordfeed: { baseUrl: "http://bordfeed.com", syncCron: "0 6 * * *" },
    })
  ).toThrow(HTTP_BASE_URL);

  expect(() =>
    defineBordfulConfig({
      bordfeed: { baseUrl: "https://bordfeed.com", syncCron: "5/15 * * * *" },
    })
  ).toThrow(STEP_CRON);
});

test("the parsed config is frozen", () => {
  const config = defineBordfulConfig({});
  expect(Object.isFrozen(config)).toBe(true);
  expect(Object.isFrozen(config.bordfeed)).toBe(true);
  expect(Object.isFrozen(config.csp.extraScriptOrigins)).toBe(true);
});
