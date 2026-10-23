import { expect, test } from "vitest";

import { GET as getAtom } from "@/app/atom.xml/route";
import { toJobDetail, toJobListItem } from "@/lib/read/mappers";
import type { JobDetail, JobListItem } from "@/lib/read/types";
import {
  exampleProductDesignerJob,
  exampleSeniorBackendJob,
  sampleRemoteDataAnalystJob,
} from "../../../tests/fixtures/board";

import { buildJobPostingJsonLd } from "./job-posting";
import { buildJsonFeed } from "./json-feed";
import { truncateAtWord } from "./plaintext";
import { buildRobots } from "./robots";
import { buildRssFeed, buildRssItem } from "./rss";
import { buildSitemapEntries } from "./sitemap";
import type { FeedJob } from "./types";
import { escapeXml } from "./xml";

const siteUrl = "https://board.example";
const siteName = "Example Board";
const ctx = { siteName, siteUrl };

const exampleCompany = {
  name: "Example Co",
  slug: "example-co",
  website: "https://example.com",
};

function listItem(
  job: Record<string, unknown>,
  companySlug: string,
  withCompany = false
): JobListItem {
  return toJobListItem({
    ...job,
    company: withCompany ? exampleCompany : undefined,
    companySlug,
  });
}

function detail(
  job: Record<string, unknown>,
  companySlug: string,
  withCompany = false
): JobDetail {
  return toJobDetail({
    ...job,
    company: withCompany ? exampleCompany : undefined,
    companySlug,
  });
}

function feedJob(job: JobListItem, descriptionText: string): FeedJob {
  return { ...job, descriptionText };
}

const backend = detail(exampleSeniorBackendJob, "example-co", true);
const designer = detail(exampleProductDesignerJob, "acme-example-ltd");
const sample = detail(sampleRemoteDataAnalystJob, "example-co");

const backendList = listItem(exampleSeniorBackendJob, "example-co", true);
const designerList = listItem(exampleProductDesignerJob, "acme-example-ltd");
const sampleList = listItem(sampleRemoteDataAnalystJob, "example-co");

const backendFeed = feedJob(backendList, "Example description.");
const designerFeed = feedJob(designerList, "Example description.");

test("backend job posting JSON-LD matches the contract order", () => {
  const result = buildJobPostingJsonLd(backend, ctx);
  expect(result).toEqual({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    applicantLocationRequirements: {
      "@type": "Country",
      name: "US",
    },
    baseSalary: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: {
        "@type": "QuantitativeValue",
        maxValue: 160_000,
        minValue: 120_000,
        unitText: "YEAR",
      },
    },
    datePosted: "2026-10-20T09:00:00.000Z",
    description: "Example description.",
    directApply: false,
    employmentType: "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: "Example Co",
      sameAs: "https://example.com",
    },
    jobLocationType: "TELECOMMUTE",
    title: "Example Senior Backend Engineer",
    url: "https://board.example/jobs/example-senior-backend-engineer",
  });
  expect(Object.keys(result ?? {})).toEqual([
    "@context",
    "@type",
    "title",
    "description",
    "datePosted",
    "employmentType",
    "hiringOrganization",
    "jobLocationType",
    "applicantLocationRequirements",
    "baseSalary",
    "directApply",
    "url",
  ]);
});

test("hybrid jobs carry a place and validThrough, without salary", () => {
  const result = buildJobPostingJsonLd(designer, ctx);
  expect(result).toMatchObject({
    employmentType: "CONTRACTOR",
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "DE",
      },
    },
    validThrough: "2099-01-01T00:00:00.000Z",
  });
  expect(result).not.toHaveProperty("baseSalary");
  expect(result).not.toHaveProperty("jobLocationType");
  const location = result?.jobLocation as { address: Record<string, unknown> };
  expect(location.address).toEqual({
    "@type": "PostalAddress",
    addressCountry: "DE",
  });
});

test("sample jobs are left out of JSON-LD", () => {
  expect(buildJobPostingJsonLd(sample, ctx)).toBeNull();
});

test("a relative company logo becomes an absolute URL", () => {
  const job = toJobDetail({
    ...exampleSeniorBackendJob,
    company: {
      logoUrl: "/logo.png",
      name: "Example Co",
      slug: "example-co",
      website: "https://example.com",
    },
    companySlug: "example-co",
  });
  const result = buildJobPostingJsonLd(job, ctx);
  expect(result?.hiringOrganization).toMatchObject({
    logo: "https://board.example/logo.png",
    sameAs: "https://example.com",
  });
});

test("a protocol-relative company logo keeps its host", () => {
  const job = toJobDetail({
    ...exampleSeniorBackendJob,
    company: {
      logoUrl: "//cdn.example/logo.png",
      name: "Example Co",
      slug: "example-co",
      website: "https://example.com",
    },
    companySlug: "example-co",
  });
  const result = buildJobPostingJsonLd(job, ctx);
  expect(result?.hiringOrganization).toMatchObject({
    logo: "https://cdn.example/logo.png",
  });
  const httpResult = buildJobPostingJsonLd(job, {
    siteName,
    siteUrl: "http://board.example",
  });
  expect(httpResult?.hiringOrganization).toMatchObject({
    logo: "http://cdn.example/logo.png",
  });
});

test("RSS item matches the backend fixture", () => {
  expect(buildRssItem(backendFeed, siteUrl)).toBe(
    '<item><title>Example Senior Backend Engineer at Example Co</title><link>https://board.example/jobs/example-senior-backend-engineer</link><guid isPermaLink="true">https://board.example/jobs/example-senior-backend-engineer</guid><pubDate>Tue, 20 Oct 2026 09:00:00 GMT</pubDate><description>Example description.</description></item>'
  );
});

test("RSS titles escape XML", () => {
  const named = feedJob(
    { ...backendList, title: 'R&D <Lead> "Ops"' },
    "Example description."
  );
  expect(buildRssItem(named, siteUrl)).toContain(
    "<title>R&amp;D &lt;Lead&gt; &quot;Ops&quot; at Example Co</title>"
  );
});

test("RSS feed is deterministic and newest first", () => {
  const feed = buildRssFeed({
    jobs: [designerFeed, backendFeed],
    siteDescription: "Example Board",
    siteName,
    siteUrl,
  });
  expect(
    feed.startsWith(
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Example Board</title><link>https://board.example/</link>'
    )
  ).toBe(true);
  expect(feed).toContain(
    "<lastBuildDate>Wed, 21 Oct 2026 09:00:00 GMT</lastBuildDate>"
  );
  expect(feed.indexOf("example-product-designer")).toBeLessThan(
    feed.indexOf("example-senior-backend-engineer")
  );
  expect(feed).toContain(
    '<atom:link href="https://board.example/feed.xml" rel="self" type="application/rss+xml"/>'
  );
});

test("JSON Feed item matches the backend fixture", () => {
  const feed = buildJsonFeed({
    jobs: [designerFeed, backendFeed],
    siteName,
    siteUrl,
  });
  expect(feed.items[1]).toEqual({
    content_text: "Example description.",
    date_published: "2026-10-20T09:00:00.000Z",
    id: "https://board.example/jobs/example-senior-backend-engineer",
    title: "Example Senior Backend Engineer at Example Co",
    url: "https://board.example/jobs/example-senior-backend-engineer",
  });
});

test("fork sitemap skips sample jobs and orders companies by slug", () => {
  expect(
    buildSitemapEntries({
      jobs: [sampleList, designerList, backendList],
      marketing: false,
      siteUrl,
    })
  ).toEqual([
    { url: "https://board.example/" },
    { url: "https://board.example/jobs" },
    { url: "https://board.example/companies" },
    {
      lastModified: "2026-10-21T09:00:00.000Z",
      url: "https://board.example/jobs/example-product-designer",
    },
    {
      lastModified: "2026-10-20T09:00:00.000Z",
      url: "https://board.example/jobs/example-senior-backend-engineer",
    },
    { url: "https://board.example/companies/acme-example-ltd" },
    { url: "https://board.example/companies/example-co" },
  ]);
});

test("sitemap breaks equal publish times by numeric id", () => {
  const publishedAt = "2026-10-21T09:00:00.000Z";
  const low = {
    ...designerList,
    id: "9",
    publishedAt,
    slug: "low-id",
  };
  const high = {
    ...designerList,
    id: "10",
    publishedAt,
    slug: "high-id",
  };
  const urls = buildSitemapEntries({
    jobs: [low, high],
    marketing: false,
    siteUrl,
  }).map((entry) => entry.url);
  expect(urls.indexOf("https://board.example/jobs/high-id")).toBeLessThan(
    urls.indexOf("https://board.example/jobs/low-id")
  );
});

test("marketing sitemap starts with the marketing pages", () => {
  const entries = buildSitemapEntries({
    jobs: [sampleList, designerList, backendList],
    marketing: true,
    siteUrl,
  });
  expect(entries.slice(0, 9).map((entry) => entry.url)).toEqual([
    "https://board.example/",
    "https://board.example/jobs",
    "https://board.example/pricing",
    "https://board.example/showcase",
    "https://board.example/changelog",
    "https://board.example/about",
    "https://board.example/privacy",
    "https://board.example/terms",
    "https://board.example/companies",
  ]);
  expect(entries.some((entry) => entry.url.includes("sample-remote"))).toBe(
    false
  );
});

test("robots points at the sitemap and blocks private routes", () => {
  expect(buildRobots("https://board.example")).toEqual({
    rules: {
      allow: "/",
      disallow: ["/admin", "/api", "/jobs/search"],
      userAgent: "*",
    },
    sitemap: "https://board.example/sitemap.xml",
  });
});

test("escapeXml drops invalid XML characters", () => {
  expect(escapeXml("a\u0001b & c")).toBe("ab &amp; c");
});

test("feed descriptions cut at a word boundary", () => {
  const text = "word ".repeat(101).trim();
  expect(text.length).toBe(504);
  expect(truncateAtWord(text, 500)).toBe(`${"word ".repeat(100).trim()}...`);
});

test("feed descriptions do not split a code point", () => {
  const emoji = "\u{1F600}";
  const within = `${"a".repeat(499)}${emoji}`;
  expect(truncateAtWord(within, 500)).toBe(within);

  const over = `${"a".repeat(499)}${emoji}bbb`;
  expect(truncateAtWord(over, 500)).toBe(`${"a".repeat(499)}${emoji}...`);
  expect(truncateAtWord(over, 500).includes("\uFFFD")).toBe(false);
});

test("atom.xml redirects to the RSS feed", async () => {
  const response = await getAtom(new Request("https://board.example/atom.xml"));
  expect(response.status).toBe(301);
  expect(response.headers.get("location")).toBe(
    "https://board.example/feed.xml"
  );
});
