import { expect, test } from "vitest";

import {
  formatLocation,
  formatRelativePosted,
  formatSalary,
  isNewJob,
} from "./format";

test("formats compact salaries", () => {
  expect(
    formatSalary({
      salaryCurrency: "USD",
      salaryMax: 160_000,
      salaryMin: 120_000,
    })
  ).toBe("$120k-160k (USD)");
  expect(
    formatSalary({
      salaryCurrency: "EUR",
      salaryMax: 70_000,
      salaryMin: 50_000,
    })
  ).toBe("€50k-70k (EUR)");
  expect(
    formatSalary({ salaryCurrency: "GBP", salaryMax: null, salaryMin: 95_000 })
  ).toBe("£95k (GBP)");
  expect(
    formatSalary({ salaryCurrency: "USD", salaryMax: 5000, salaryMin: 5000 })
  ).toBe("$5,000 (USD)");
  expect(
    formatSalary({
      salaryCurrency: "USD",
      salaryMax: 1_500_000,
      salaryMin: 1_200_000,
    })
  ).toBe("$1.2M-1.5M (USD)");
  expect(formatSalary({})).toBe("");
});

test("formats relative posted times in UTC", () => {
  const now = Date.parse("2026-10-23T09:00:00.000Z");

  expect(formatRelativePosted("2026-10-23T08:59:30.000Z", now)).toBe(
    "just now"
  );
  expect(formatRelativePosted("2026-10-23T08:00:00.000Z", now)).toBe(
    "1 hour ago"
  );
  expect(formatRelativePosted("2026-10-20T09:00:00.000Z", now)).toBe(
    "3 days ago"
  );
  expect(formatRelativePosted("2026-09-10T12:00:00.000Z", now)).toBe(
    "Sep 10, 2026"
  );
  expect(isNewJob("2026-10-21T10:00:00.000Z", now)).toBe(true);
  expect(isNewJob("2026-10-21T08:00:00.000Z", now)).toBe(false);
});

test("formats location lines", () => {
  expect(
    formatLocation({
      locationDisplay: null,
      remoteRegion: "Worldwide",
      workplaceType: "remote",
    })
  ).toBe("Remote (Worldwide)");
  expect(
    formatLocation({
      locationDisplay: null,
      remoteRegion: null,
      workplaceType: "remote",
    })
  ).toBe("Remote");
  expect(
    formatLocation({
      locationDisplay: "Berlin, DE",
      remoteRegion: null,
      workplaceType: "hybrid",
    })
  ).toBe("Hybrid, Berlin, DE");
  expect(
    formatLocation({
      locationDisplay: "Berlin, DE; Munich, DE",
      remoteRegion: null,
      workplaceType: "onsite",
    })
  ).toBe("Berlin, DE +1");
  expect(
    formatLocation({
      locationDisplay: null,
      remoteRegion: null,
      workplaceType: null,
    })
  ).toBe("Location not listed");
});
