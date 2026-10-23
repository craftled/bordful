import type { FeedInput, FeedJob } from "./types";
import { escapeXml } from "./xml";

function rssDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toUTCString();
}

export function buildRssItem(job: FeedJob, siteUrl: string): string {
  const url = escapeXml(`${siteUrl}/jobs/${job.slug}`);
  const published = rssDate(job.publishedAt);
  const pubDate = published ? `<pubDate>${escapeXml(published)}</pubDate>` : "";

  return [
    "<item>",
    `<title>${escapeXml(`${job.title} at ${job.companyName}`)}</title>`,
    `<link>${url}</link>`,
    `<guid isPermaLink="true">${url}</guid>`,
    pubDate,
    `<description>${escapeXml(job.descriptionText)}</description>`,
    "</item>",
  ]
    .filter((part) => part.length > 0)
    .join("");
}

function newestRfc822(jobs: FeedJob[]): string | null {
  let newest = Number.NEGATIVE_INFINITY;
  let iso: string | null = null;

  for (const job of jobs) {
    if (!job.publishedAt) {
      continue;
    }

    const time = Date.parse(job.publishedAt);
    if (Number.isNaN(time) || time < newest) {
      continue;
    }

    newest = time;
    iso = job.publishedAt;
  }

  return iso ? rssDate(iso) : null;
}

export function buildRssFeed(input: FeedInput): string {
  // Newest item date, never the clock, so the same jobs always emit the same XML.
  const lastBuild = newestRfc822(input.jobs);
  const lastBuildDate = lastBuild
    ? `<lastBuildDate>${escapeXml(lastBuild)}</lastBuildDate>`
    : "";
  const items = input.jobs
    .map((job) => buildRssItem(job, input.siteUrl))
    .join("");
  const self = escapeXml(`${input.siteUrl}/feed.xml`);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(input.siteName)}</title>`,
    `<link>${escapeXml(`${input.siteUrl}/`)}</link>`,
    `<description>${escapeXml(input.siteDescription)}</description>`,
    `<atom:link href="${self}" rel="self" type="application/rss+xml"/>`,
    lastBuildDate,
    items,
    "</channel>",
    "</rss>",
  ].join("");
}
