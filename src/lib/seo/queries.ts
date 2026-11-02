import { unstable_cache } from "next/cache";
import type { Payload } from "payload";

import { toJobListItem } from "@/lib/read/mappers";
import { READ_TAGS } from "@/lib/read/tags";
import type { JobListItem } from "@/lib/read/types";

import { dropExpired } from "./expiry";
import { feedDescriptionText } from "./plaintext";
import type { FeedJob } from "./types";

const SITEMAP_JOB_LIMIT = 5000;

function descriptionOf(doc: unknown): unknown {
  if (doc !== null && typeof doc === "object" && "description" in doc) {
    return doc.description;
  }

  return null;
}

export async function queryFeedJobs(
  payload: Payload,
  limit = 50
): Promise<FeedJob[]> {
  const result = await payload.find({
    collection: "jobs",
    depth: 1,
    draft: false,
    limit,
    overrideAccess: false,
    sort: ["-publishedAt", "-id"],
    where: { origin: { not_equals: "bordfeed_sample" } },
  });

  return result.docs.map((doc) => ({
    ...toJobListItem(doc),
    descriptionText: feedDescriptionText(descriptionOf(doc)),
  }));
}

export async function querySitemapJobs(
  payload: Payload
): Promise<JobListItem[]> {
  const result = await payload.find({
    collection: "jobs",
    depth: 0,
    draft: false,
    limit: SITEMAP_JOB_LIMIT,
    overrideAccess: false,
    sort: ["-publishedAt", "-id"],
    where: { origin: { not_equals: "bordfeed_sample" } },
  });

  return result.docs.map((doc) => toJobListItem(doc));
}

async function payloadClient(): Promise<Payload> {
  // Loaded on call so tests can point DATABASE_URL at the lane database first.
  const { default: config } = await import("@payload-config");
  const { getPayload } = await import("payload");
  return getPayload({ config });
}

export async function getFeedJobs(limit = 50): Promise<FeedJob[]> {
  // Over-fetch so jobs expiring inside the cache window do not shrink the feed
  // below `limit` before the next refresh.
  const jobs = await unstable_cache(
    async () => queryFeedJobs(await payloadClient(), limit * 2),
    ["queryFeedJobs", String(limit)],
    { revalidate: 300, tags: [READ_TAGS.jobs, READ_TAGS.companies] }
  )();
  return dropExpired(jobs, new Date()).slice(0, limit);
}

export async function getSitemapJobs(): Promise<JobListItem[]> {
  const jobs = await unstable_cache(
    async () => querySitemapJobs(await payloadClient()),
    ["querySitemapJobs"],
    { revalidate: 300, tags: [READ_TAGS.jobs] }
  )();
  return dropExpired(jobs, new Date());
}
