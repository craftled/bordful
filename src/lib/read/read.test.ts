import type { Payload } from "payload";
import { afterEach, expect, test, vi } from "vitest";

import { isIndexable } from "./indexable";
import {
  toBordfeedConnectionPublic,
  toCompanySummary,
  toJobListItem,
  toSiteSettingsView,
} from "./mappers";
import { queryPublishedJobs } from "./queries";

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
const ACME_EXAMPLE_LOGO_DEV =
  "https://img.logo.dev/acme.example?format=png&retina=true&size=64&token=pk_test";

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

const BORDFEED_LOGO = "https://cdn.bordfeed.com/logos/acme.png";
const WORKDAY_LOGO = "https://example.myworkdayjobs.com/logo.png";

test("an uploaded logo wins, then Logo.dev by domain, then a logo URL", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  expect(
    toJobListItem({
      company: {
        logoUrl: BORDFEED_LOGO,
        website: "https://other.example",
      },
      companyDomain: "acme.com",
      id: 1,
    }).companyLogoUrl
  ).toBe(LOGO_DEV);
  expect(
    toJobListItem({ company: { logoUrl: BORDFEED_LOGO }, id: 1 }).companyLogoUrl
  ).toBe(BORDFEED_LOGO);
  expect(
    toJobListItem({
      companyDomain: "acme.com",
      companyLogo: { url: "/api/media/file/acme.png" },
      company: { website: "https://other.example" },
      id: 1,
    }).companyLogoUrl
  ).toBe("/api/media/file/acme.png");

  expect(
    toCompanySummary({
      domain: "acme.com",
      id: 1,
      logoUrl: "",
      website: "https://other.example",
    }).logoUrl
  ).toBe(LOGO_DEV);
  expect(
    toCompanySummary({
      domain: "acme.com",
      id: 1,
      logoUrl: BORDFEED_LOGO,
      website: "https://other.example",
    }).logoUrl
  ).toBe(LOGO_DEV);
  expect(toCompanySummary({ id: 1, logoUrl: BORDFEED_LOGO }).logoUrl).toBe(
    BORDFEED_LOGO
  );
});

test("logo URLs on hosts CSP img-src blocks never reach the read model", () => {
  for (const token of ["pk_test", ""]) {
    vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", token);
    expect(
      toJobListItem({ company: { logoUrl: WORKDAY_LOGO }, id: 1 })
        .companyLogoUrl
    ).toBeNull();
    expect(toCompanySummary({ id: 1, logoUrl: WORKDAY_LOGO }).logoUrl).toBe(
      null
    );
  }

  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "");
  expect(
    toJobListItem({
      company: { logoUrl: WORKDAY_LOGO },
      companyDomain: "acme.com",
      id: 1,
    }).companyLogoUrl
  ).toBeNull();
});

test("empty logo URLs fall through to a valid company website", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  expect(
    toJobListItem({
      company: {
        logoUrl: "",
        website: "https://www.acme.example/jobs",
      },
      id: 1,
    }).companyLogoUrl
  ).toBe(ACME_EXAMPLE_LOGO_DEV);
  expect(
    toCompanySummary({
      id: 1,
      logoUrl: "",
      website: "https://www.acme.example/jobs",
    }).logoUrl
  ).toBe(ACME_EXAMPLE_LOGO_DEV);
});

test("company websites supply Logo.dev domains for jobs and summaries", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  expect(
    toJobListItem({
      company: { website: "https://www.acme.example/jobs" },
      id: 1,
    }).companyLogoUrl
  ).toBe(ACME_EXAMPLE_LOGO_DEV);
  expect(
    toCompanySummary({
      id: 1,
      website: "https://www.acme.example/jobs",
    }).logoUrl
  ).toBe(ACME_EXAMPLE_LOGO_DEV);
});

test("valid company websites do not produce Logo.dev URLs without a token", () => {
  for (const token of [undefined, ""]) {
    vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", token);
    expect(
      toJobListItem({
        company: { website: "https://www.acme.example" },
        id: 1,
      }).companyLogoUrl
    ).toBeNull();
    expect(
      toCompanySummary({
        id: 1,
        website: "https://www.acme.example",
      }).logoUrl
    ).toBeNull();
  }
});

test("stored company domains take priority over website domains", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  expect(
    toCompanySummary({
      domain: "real.example",
      id: 1,
      website: "https://other.example",
    }).logoUrl
  ).toBe(
    "https://img.logo.dev/real.example?format=png&retina=true&size=64&token=pk_test"
  );
  expect(
    toJobListItem({
      company: { website: "https://other.example" },
      companyDomain: "job.example",
      id: 1,
    }).companyLogoUrl
  ).toBe(
    "https://img.logo.dev/job.example?format=png&retina=true&size=64&token=pk_test"
  );
});

test("invalid or missing company websites do not produce Logo.dev URLs", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  for (const company of [
    { website: "not a url" },
    { website: "ftp://x.example" },
    { website: null },
    {},
  ]) {
    expect(toJobListItem({ company, id: 1 }).companyLogoUrl).toBeNull();
    expect(toCompanySummary({ id: 1, ...company }).logoUrl).toBeNull();
  }
});

test("an empty job company domain does not block its website fallback", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  expect(
    toJobListItem({
      company: { website: "https://www.acme.example/jobs" },
      companyDomain: "",
      id: 1,
    }).companyLogoUrl
  ).toBe(ACME_EXAMPLE_LOGO_DEV);
});

test("invalid stored company domains fall through to website domains", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  for (const domain of ["   ", "not a domain"]) {
    expect(
      toJobListItem({
        company: { website: "https://www.acme.example/jobs" },
        companyDomain: domain,
        id: 1,
      }).companyLogoUrl
    ).toBe(ACME_EXAMPLE_LOGO_DEV);
    expect(
      toJobListItem({
        company: {
          domain,
          website: "https://www.acme.example/jobs",
        },
        id: 1,
      }).companyLogoUrl
    ).toBe(ACME_EXAMPLE_LOGO_DEV);
    expect(
      toCompanySummary({
        domain,
        id: 1,
        website: "https://www.acme.example/jobs",
      }).logoUrl
    ).toBe(ACME_EXAMPLE_LOGO_DEV);
  }
});

test("published job queries select company domains and populate domain sources", async () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "pk_test");

  const fixtures = [
    {
      company: { name: "Acme" },
      companyDomain: "acme.example",
      id: 1,
    },
    {
      company: {
        domain: "co.example",
        logoUrl: null,
        name: "X",
        website: null,
      },
      companyDomain: null,
      id: 2,
    },
    {
      company: {
        domain: null,
        website: "https://www.site.example",
      },
      companyDomain: null,
      id: 3,
    },
  ];
  const payload = {
    find: (args: {
      populate: { companies: Record<string, boolean> };
      select: Record<string, boolean>;
    }) => {
      const docs = fixtures.map(({ company, ...topLevel }) => {
        const projected = Object.fromEntries(
          Object.keys(args.select)
            .filter((key) => args.select[key])
            .filter((key) => key !== "company")
            .map((key) => [key, topLevel[key as keyof typeof topLevel]])
        );
        return {
          ...projected,
          company: Object.fromEntries(
            Object.keys(args.populate.companies)
              .filter((key) => args.populate.companies[key])
              .map((key) => [key, company[key as keyof typeof company]])
          ),
        };
      });
      return { docs, page: 1, totalDocs: 3, totalPages: 1 };
    },
  };

  const result = await queryPublishedJobs(payload as unknown as Payload, {
    limit: 10,
    page: 1,
  });

  expect(result.items.map((item) => item.companyLogoUrl)).toEqual([
    "https://img.logo.dev/acme.example?format=png&retina=true&size=64&token=pk_test",
    "https://img.logo.dev/co.example?format=png&retina=true&size=64&token=pk_test",
    "https://img.logo.dev/site.example?format=png&retina=true&size=64&token=pk_test",
  ]);
});

test("a secret Logo.dev key is never put in a logo URL", () => {
  vi.stubEnv("NEXT_PUBLIC_LOGO_DEV_TOKEN", "sk_secret");
  expect(toCompanySummary({ domain: "acme.com", id: 1 }).logoUrl).toBeNull();
});
