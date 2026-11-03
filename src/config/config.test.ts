import { expect, test } from "vitest";
import { defineBordfulConfig } from "./define-config";
import { bordfulConfig } from "./index";

const HTTP_BASE_URL = /Invalid bordful.config.ts: bordfeed\.baseUrl:/u;
const STEP_CRON = /Invalid bordful.config.ts: bordfeed\.syncCron:/u;

const defaults = {
  alerts: { provider: "resend" },
  board: { defaultTemplateId: "fully-remote" },
  bordfeed: {
    baseUrl: "https://bordfeed.com",
    sync: { jobsPerDay: 200, jobsPerSync: 50 },
    syncCron: "0 6 * * *",
  },
  csp: { extraConnectOrigins: [], extraScriptOrigins: [] },
  social: {},
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

test("sync caps clamp to 20 to 100 per sync and 20 to 5000 per day", () => {
  expect(
    defineBordfulConfig({
      bordfeed: { sync: { jobsPerDay: 1, jobsPerSync: 1000 } },
    }).bordfeed.sync
  ).toEqual({ jobsPerDay: 20, jobsPerSync: 100 });
  expect(
    defineBordfulConfig({
      bordfeed: { sync: { jobsPerDay: 99_999, jobsPerSync: 3 } },
    }).bordfeed.sync
  ).toEqual({ jobsPerDay: 5000, jobsPerSync: 20 });
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

test("rejects non-https social profile URLs", () => {
  expect(() =>
    defineBordfulConfig({ social: { github: "http://github.com/x" } })
  ).toThrow();
  expect(() =>
    defineBordfulConfig({ social: { x: "javascript:alert(1)" } })
  ).toThrow();
});

test("the parsed config is frozen", () => {
  const config = defineBordfulConfig({});
  expect(Object.isFrozen(config)).toBe(true);
  expect(Object.isFrozen(config.bordfeed)).toBe(true);
  expect(Object.isFrozen(config.csp.extraScriptOrigins)).toBe(true);
});
