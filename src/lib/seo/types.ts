import type { JobListItem } from "@/lib/read/types";

export interface FeedJob extends JobListItem {
  descriptionText: string;
}

export interface FeedInput {
  jobs: FeedJob[];
  siteDescription: string;
  siteName: string;
  siteUrl: string;
}

export interface JsonFeedItem {
  content_text: string;
  date_published?: string;
  id: string;
  title: string;
  url: string;
}

export interface JsonFeed {
  feed_url: string;
  home_page_url: string;
  items: JsonFeedItem[];
  title: string;
  version: "https://jsonfeed.org/version/1.1";
}

export interface SitemapEntry {
  lastModified?: string;
  url: string;
}
