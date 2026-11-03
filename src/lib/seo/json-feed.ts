import type { FeedJob, JsonFeed, JsonFeedItem } from "./types";

export interface JsonFeedInput {
  jobs: FeedJob[];
  siteName: string;
  siteUrl: string;
}

function jsonItem(job: FeedJob, siteUrl: string): JsonFeedItem {
  const url = `${siteUrl}/jobs/${job.slug}`;
  const item: JsonFeedItem = {
    content_text: job.descriptionText,
    id: url,
    title: `${job.title} at ${job.companyName}`,
    url,
  };

  if (job.publishedAt) {
    item.date_published = job.publishedAt;
  }

  return item;
}

export function buildJsonFeed(input: JsonFeedInput): JsonFeed {
  return {
    feed_url: `${input.siteUrl}/feed.json`,
    home_page_url: `${input.siteUrl}/`,
    items: input.jobs.map((job) => jsonItem(job, input.siteUrl)),
    title: input.siteName,
    version: "https://jsonfeed.org/version/1.1",
  };
}
