import { afterEach, expect, test, vi } from "vitest";

import { isIndexable } from "./indexable";
import {
  toBordfeedConnectionPublic,
  toCompanySummary,
  toJobListItem,
  toSiteSettingsView,
} from "./mappers";

test("isIndexable is false only for sample jobs", () => {
  expect(isIndexable({ origin: "manual" })).toBe(true);
  expect(isIndexable({ origin: "paid" })).toBe(true);
  expect(isIndexable({ origin: "bordfeed" })).toBe(true);
  expect(isIndexable({ origin: "bordfeed_sample" })).toBe(false);
});

test("toJobListItem maps a populated card logo and language values", () => {
  expect(
    toJobListItem({
      applyUrl: "https://example.com/apply",
      careerLevel: ["Senior"],
      categories: [{ value: "Engineering" }],
      company: { logoUrl: "https://example.com/logo.png" },
      companyLogo: {
        url: "/api/media/file/logo.png",
        variants: { card: { url: "/api/media/file/logo-320x320.png" } },
      },
      companyName: "Example Co",
      companySlug: "example-co",
      countryCode: "US",
      employmentType: "full-time",
      featured: true,
      id: 7,
      languages: [{ value: "en" }],
      locationDisplay: "Remote",
      origin: "manual",
      publishedAt: "2026-10-20T09:00:00.000Z",
      remoteRegion: "Worldwide",
      salaryCurrency: "USD",
      salaryMax: 160_000,
      salaryMaxUsd: 160_000,
      salaryMin: 120_000,
      salaryMinUsd: 120_000,
      seniority: "senior",
      slug: "example-senior-backend-engineer",
      title: "Example Senior Backend Engineer",
      validThrough: null,
      visaSponsorship: "Offered",
      workplaceType: "remote",
    })
  ).toEqual({
    applyHref: "https://example.com/apply",
    careerLevel: ["Senior"],
    categories: ["Engineering"],
    companyLogoUrl: "/api/media/file/logo-320x320.png",
    companyName: "Example Co",
    companySlug: "example-co",
    countryCode: "US",
    employmentType: "full-time",
    featured: true,
    id: "7",
    indexable: true,
    languages: ["en"],
    locationDisplay: "Remote",
    origin: "manual",
    publishedAt: "2026-10-20T09:00:00.000Z",
    remoteRegion: "Worldwide",
    salaryCurrency: "USD",
    salaryMax: 160_000,
    salaryMaxUsd: 160_000,
    salaryMin: 120_000,
    salaryMinUsd: 120_000,
    seniority: "senior",
    slug: "example-senior-backend-engineer",
    title: "Example Senior Backend Engineer",
    validThrough: null,
    visaSponsorship: "Offered",
    workplaceType: "remote",
  });
});

test("sample attribution stays visible until the board is connected", () => {
  expect(
    toBordfeedConnectionPublic({
      lastSyncAt: null,
      showAttribution: false,
      state: "sample",
      templateId: "fully-remote",
    })
  ).toEqual({
    lastSyncAt: null,
    showAttribution: true,
    state: "sample",
    templateId: "fully-remote",
  });

  expect(toBordfeedConnectionPublic({ templateId: null }).templateId).toBe(
    "fully-remote"
  );
});

test("empty site settings resolve to the documented defaults", () => {
  const settings = toSiteSettingsView({});
  expect(settings.postJob).toEqual({
    durationDays: 30,
    enabled: false,
    paymentLinkUrl: "",
    priceLabel: "",
  });
  expect(settings.alerts.defaultFrequency).toBe("weekly");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const LOGO_DEV =
  "https://img.logo.dev/acme.com?format=png&retina=true&size=64&token=pk_test";

test("job logos fall back to Logo.dev by company domain only when a key is set", () => {
  const job = { company: { logoUrl: null }, companyDomain: "acme.com", id: 1 };

  expect(toJobListItem(job).companyLogoUrl).toBeNull();

  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");
  expect(toJobListItem(job).companyLogoUrl).toBe(LOGO_DEV);
  expect(
    toJobListItem({ company: { domain: "acme.com" }, id: 1 }).companyLogoUrl
  ).toBe(LOGO_DEV);
  expect(toJobListItem({ company: 7, id: 1 }).companyLogoUrl).toBeNull();
});

test("an uploaded logo or a logo URL wins over Logo.dev", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  expect(
    toJobListItem({
      company: { logoUrl: "https://cdn.example/acme.png" },
      companyDomain: "acme.com",
      id: 1,
    }).companyLogoUrl
  ).toBe("https://cdn.example/acme.png");
  expect(
    toJobListItem({
      companyDomain: "acme.com",
      companyLogo: { url: "/api/media/file/acme.png" },
      id: 1,
    }).companyLogoUrl
  ).toBe("/api/media/file/acme.png");

  expect(
    toCompanySummary({ domain: "acme.com", id: 1, logoUrl: "" }).logoUrl
  ).toBe(LOGO_DEV);
  expect(
    toCompanySummary({
      domain: "acme.com",
      id: 1,
      logoUrl: "https://cdn.example/acme.png",
    }).logoUrl
  ).toBe("https://cdn.example/acme.png");
});

test("a secret Logo.dev key is never put in a logo URL", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "sk_secret");
  expect(toCompanySummary({ domain: "acme.com", id: 1 }).logoUrl).toBeNull();
});
