import { expect, test } from "vitest";

import { isIndexable } from "./indexable";
import {
  toBordfeedConnectionPublic,
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
      workplaceType: "remote",
    })
  ).toEqual({
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
    workplaceType: "remote",
  });
});

test("sample attribution stays visible until the board is connected", () => {
  expect(
    toBordfeedConnectionPublic({
      lastSyncAt: null,
      showAttribution: false,
      state: "sample",
      templateId: "remote-engineering",
    })
  ).toEqual({
    lastSyncAt: null,
    showAttribution: true,
    state: "sample",
    templateId: "remote-engineering",
  });
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
