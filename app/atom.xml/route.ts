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
    // Check if Atom feeds are enabled
    if (!isFeedEnabled(config.rssFeed, 'atom')) {
      return new Response('Atom feed not enabled', { status: 404 });
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

    // Return the feed as Atom XML
    return new Response(feed.atom1(), {
      headers: {
        'Content-Type': 'application/atom+xml; charset=utf-8',
      },
    });
  } catch (_error) {
    return new Response('Error generating Atom feed', { status: 500 });
  }
}
