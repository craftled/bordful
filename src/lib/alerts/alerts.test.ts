import { expect, test } from "vitest";

import { EMPTY_JOB_ALERT_QUERY } from "@/lib/domain/job-vocab";
import type { JobListItem, SiteSettingsView } from "@/lib/read/types";

import { alertsReady } from "./config";
import { idempotencyKey, isDue, periodKey, selectDigestJobs } from "./digest";
import { matchesAlertQuery } from "./match";
import { describeAlertQuery, parseAlertQueryFromFormData } from "./query";
import { hashToken, unsubscribeTokenFor } from "./tokens";

const now = new Date("2026-10-23T08:00:00.000Z");

function view(alerts: SiteSettingsView["alerts"]): SiteSettingsView {
  return { alerts } as SiteSettingsView;
}

function card(overrides: Partial<JobListItem>): JobListItem {
  return {
    careerLevel: [],
    categories: [],
    companyLogoUrl: null,
    companyName: "Example Co",
    companySlug: "example-co",
    countryCode: null,
    employmentType: "full-time",
    featured: false,
    id: overrides.slug ?? "1",
    indexable: true,
    languages: [],
    locationDisplay: "Remote",
    origin: "manual",
    publishedAt: null,
    remoteRegion: null,
    salaryCurrency: null,
    salaryMax: null,
    salaryMaxUsd: null,
    salaryMin: null,
    salaryMinUsd: null,
    seniority: null,
    slug: "job",
    title: "Example Role",
    validThrough: null,
    visaSponsorship: null,
    workplaceType: null,
    ...overrides,
  };
}

test("hashToken matches the sha256 hex vectors", () => {
  expect(hashToken("abc")).toBe(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
  );
  expect(hashToken("test-confirm-token")).toBe(
    "35c53b90fe8ac9a502e661dbfec38f3b981c9855830e041d1536ea827fe8d32c"
  );
});

test("unsubscribeTokenFor is a derived base64url hmac", () => {
  expect(
    unsubscribeTokenFor(
      { email: "ada@example.com", id: 42 },
      "example-payload-secret-0123456789abcdef"
    )
  ).toBe("cDpfDlKHHSI6P7AKjSQLhMlyz0nQQSYFYOCq5_eZAxE");
});

test("periodKey uses UTC days and ISO weeks", () => {
  expect(periodKey("weekly", now)).toBe("2026-W43");
  expect(periodKey("weekly", new Date("2026-10-26T08:00:00.000Z"))).toBe(
    "2026-W44"
  );
  expect(periodKey("weekly", new Date("2027-01-01T08:00:00.000Z"))).toBe(
    "2026-W53"
  );
  expect(periodKey("daily", now)).toBe("2026-10-23");
});

test("idempotencyKey includes the subscriber, frequency, and period", () => {
  expect(idempotencyKey({ id: 42 }, "weekly", now)).toBe(
    "alerts-42-weekly-2026-W43"
  );
});

test("isDue waits one hour less than the full period", () => {
  expect(
    isDue(
      {
        confirmedAt: "2026-10-16T09:00:00.000Z",
        frequency: "weekly",
        lastSentAt: null,
        status: "active",
      },
      now
    )
  ).toBe(true);
  expect(
    isDue(
      {
        confirmedAt: "2026-10-16T09:00:01.000Z",
        frequency: "weekly",
        lastSentAt: null,
        status: "active",
      },
      now
    )
  ).toBe(false);
  expect(
    isDue(
      {
        confirmedAt: "2026-10-01T00:00:00.000Z",
        frequency: "weekly",
        lastSentAt: "2026-10-17T08:00:00.000Z",
        status: "active",
      },
      now
    )
  ).toBe(false);
  expect(
    isDue(
      {
        confirmedAt: "2026-10-01T00:00:00.000Z",
        frequency: "daily",
        lastSentAt: "2026-10-22T08:30:00.000Z",
        status: "active",
      },
      now
    )
  ).toBe(true);
  expect(
    isDue(
      {
        confirmedAt: "2026-10-16T09:00:00.000Z",
        frequency: "weekly",
        lastSentAt: null,
        status: "pending",
      },
      now
    )
  ).toBe(false);
});

test("parseAlertQueryFromFormData drops unknown values and duplicates", () => {
  const formData = new FormData();
  formData.append("types", "contract");
  formData.append("types", "bogus");
  formData.append("types", "contract");
  formData.set("remote", "on");
  formData.set("salary", "$50K - $100K");
  formData.set("seniority", "senior");
  formData.set("languages", "en");

  expect(parseAlertQueryFromFormData(formData)).toEqual({
    languages: ["en"],
    remote: true,
    salary: ["$50K - $100K"],
    seniority: ["senior"],
    types: ["contract"],
    visa: false,
  });
});

test("describeAlertQuery names the active filters", () => {
  expect(
    describeAlertQuery({
      ...EMPTY_JOB_ALERT_QUERY,
      remote: true,
      types: ["full-time", "contract"],
    })
  ).toBe("Remote, Full-time or Contract");
  expect(describeAlertQuery(EMPTY_JOB_ALERT_QUERY)).toBe("All new jobs");
});

test("selectDigestJobs keeps indexable matches inside the watermark window", () => {
  const jobs = [
    card({
      employmentType: "full-time",
      publishedAt: "2026-10-20T09:00:00.000Z",
      slug: "a",
      workplaceType: "remote",
    }),
    card({
      employmentType: "contract",
      publishedAt: "2026-10-21T09:00:00.000Z",
      slug: "b",
      workplaceType: "hybrid",
    }),
    card({
      employmentType: "full-time",
      indexable: false,
      origin: "bordfeed_sample",
      publishedAt: "2026-10-22T09:00:00.000Z",
      slug: "c",
      workplaceType: "remote",
    }),
    card({
      employmentType: "full-time",
      publishedAt: "2026-10-24T09:00:00.000Z",
      slug: "d",
      workplaceType: "remote",
    }),
  ];
  const subscriber = {
    confirmedAt: "2026-10-19T00:00:00.000Z",
    query: { remote: true },
    status: "active",
    watermark: "2026-10-20T12:00:00.000Z",
  };

  expect(
    selectDigestJobs(jobs, subscriber, now).map((job) => job.slug)
  ).toEqual([]);
  expect(
    selectDigestJobs(jobs, { ...subscriber, query: {} }, now).map(
      (job) => job.slug
    )
  ).toEqual(["b"]);
  expect(
    selectDigestJobs(
      jobs,
      {
        confirmedAt: "2026-10-19T00:00:00.000Z",
        query: { remote: true },
        watermark: null,
      },
      now
    ).map((job) => job.slug)
  ).toEqual(["a"]);
});

test("matchesAlertQuery uses the board salary edges and visa words", () => {
  const bands = [
    card({ salaryMaxUsd: 49_999, salaryMinUsd: 49_999, slug: "under" }),
    card({ salaryMaxUsd: 50_000, salaryMinUsd: 50_000, slug: "fifty" }),
    card({ salaryMaxUsd: 100_000, salaryMinUsd: 100_000, slug: "hundred" }),
    card({
      salaryMaxUsd: 100_001,
      salaryMinUsd: 100_001,
      slug: "over-hundred",
    }),
    card({ salaryMaxUsd: 200_000, salaryMinUsd: 200_000, slug: "two-hundred" }),
    card({ salaryMaxUsd: 200_001, salaryMinUsd: 200_001, slug: "above" }),
    card({ slug: "none" }),
    card({
      salaryMaxUsd: 80_000,
      salaryMinUsd: 40_000,
      slug: "span",
    }),
  ];

  expect(
    bands
      .filter((job) =>
        matchesAlertQuery(job, {
          ...EMPTY_JOB_ALERT_QUERY,
          salary: ["< $50K"],
        })
      )
      .map((job) => job.slug)
  ).toEqual(["under", "span"]);
  expect(
    bands
      .filter((job) =>
        matchesAlertQuery(job, {
          ...EMPTY_JOB_ALERT_QUERY,
          salary: ["$50K - $100K"],
        })
      )
      .map((job) => job.slug)
  ).toEqual(["fifty", "hundred", "span"]);
  expect(
    bands
      .filter((job) =>
        matchesAlertQuery(job, {
          ...EMPTY_JOB_ALERT_QUERY,
          salary: ["$100K - $200K"],
        })
      )
      .map((job) => job.slug)
  ).toEqual(["over-hundred", "two-hundred"]);
  expect(
    bands
      .filter((job) =>
        matchesAlertQuery(job, {
          ...EMPTY_JOB_ALERT_QUERY,
          salary: ["> $200K"],
        })
      )
      .map((job) => job.slug)
  ).toEqual(["above"]);
  expect(
    matchesAlertQuery(card({ visaSponsorship: "Offered" }), {
      ...EMPTY_JOB_ALERT_QUERY,
      visa: true,
    })
  ).toBe(true);
  expect(
    matchesAlertQuery(card({ visaSponsorship: "none" }), {
      ...EMPTY_JOB_ALERT_QUERY,
      visa: true,
    })
  ).toBe(false);
});

test("alertsReady returns each setup reason", () => {
  const readyAlerts = {
    defaultFrequency: "weekly" as const,
    enabled: true,
    fromEmail: "alerts@board.example",
    fromName: "Example Board",
  };

  expect(
    alertsReady(view({ ...readyAlerts, enabled: false }), {
      RESEND_API_KEY: "re_test_fake",
    })
  ).toEqual({
    ready: false,
    reason: "Alerts are turned off in Site settings.",
  });
  expect(alertsReady(view(readyAlerts), { RESEND_API_KEY: "" })).toEqual({
    ready: false,
    reason: "Add RESEND_API_KEY to the environment.",
  });
  expect(alertsReady(view(readyAlerts), {})).toEqual({
    ready: false,
    reason: "Add RESEND_API_KEY to the environment.",
  });
  expect(
    alertsReady(view({ ...readyAlerts, fromEmail: null }), {
      RESEND_API_KEY: "re_test_fake",
    })
  ).toEqual({
    ready: false,
    reason: "Add a sender email in Site settings, Alerts.",
  });
  expect(
    alertsReady(view(readyAlerts), { RESEND_API_KEY: "re_test_fake" })
  ).toEqual({ ready: true });
});
