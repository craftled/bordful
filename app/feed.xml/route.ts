import config from '@/config';
import { DEFAULT_DESCRIPTION_LENGTH } from '@/lib/constants/defaults';
import {
  createFeed,
  type FeedConfig,
  isFeedEnabled,
  processJobsForFeed,
} from '@/lib/utils/feed-utils';

export const revalidate = 300; // 5 minutes, matching other dynamic routes

export async function GET() {
  try {
    // Check if RSS feeds are enabled
    if (!isFeedEnabled(config.rssFeed, 'rss')) {
      return new Response('RSS feed not enabled', { status: 404 });
    }

    const baseUrl = config.url;

    // Create and configure feed
    const feedConfig: FeedConfig = config.rssFeed || { enabled: true };
    const feed = createFeed(baseUrl, feedConfig);

    // Use configured description length or default
    const descriptionLength =
      feedConfig.descriptionLength || DEFAULT_DESCRIPTION_LENGTH;

    // Process jobs and add them to feed
    await processJobsForFeed(feed, baseUrl, descriptionLength);

    // Return the feed as RSS XML
    return new Response(feed.rss2(), {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
      },
    });
  } catch (_error) {
    return new Response('Error generating RSS feed', { status: 500 });
  }
}
