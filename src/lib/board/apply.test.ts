import { expect, test } from "vitest";

import { httpUrl, jobApplyHref } from "./apply";

test("jobApplyHref rejects a javascript apply url", () => {
  expect(
    jobApplyHref({ applyEmail: null, applyUrl: "javascript:alert(1)" })
  ).toBeNull();
});

test("jobApplyHref accepts https and builds mailto", () => {
  expect(
    jobApplyHref({
      applyEmail: null,
      applyUrl: "https://example.com/apply",
    })
  ).toBe("https://example.com/apply");
  expect(jobApplyHref({ applyEmail: "ada@example.com", applyUrl: null })).toBe(
    "mailto:ada@example.com"
  );
  expect(httpUrl("javascript:alert(1)")).toBeNull();
  expect(httpUrl("https://example.com")).toBe("https://example.com/");
});
