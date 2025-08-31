import { Feed } from 'feed';
import { DEFAULT_DESCRIPTION_LENGTH } from '@/lib/constants/defaults';
import { getJobs } from '@/lib/db/airtable';
import { generateJobSlug } from '@/lib/utils/slugify';

export type RSSFeedOptions = {
  baseUrl: string;
  feedTitle: string;
  feedDescription: string;
  feedLink: string;
  descriptionLength?: number;
};

export async function generateRSSFeed(options: RSSFeedOptions): Promise<Feed> {
  const {
    baseUrl,
    feedTitle,
    feedDescription,
    feedLink,
    descriptionLength = DEFAULT_DESCRIPTION_LENGTH,
  } = options;

  const feed = new Feed({
    title: feedTitle,
    description: feedDescription,
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    generator: 'bordful',
    feedLinks: {
      rss: feedLink,
    },
  });

  // Get jobs and add them to the feed
  const jobs = await getJobs();

  for (const job of jobs) {
    // Only include active jobs
    if (job.status === 'active') {
      const jobSlug = generateJobSlug(job.title, job.company);
      const jobUrl = `${baseUrl}/jobs/${jobSlug}`;

      feed.addItem({
        title: `${job.title} at ${job.company}`,
        id: jobUrl,
        link: jobUrl,
        description: job.description?.substring(0, descriptionLength) || '',
        content: job.description || '',
        author: [
          {
            name: job.company,
            link: job.companyWebsite || undefined,
          },
        ],
        date: new Date(job.createdTime || Date.now()),
        category: job.type ? [{ name: job.type }] : undefined,
      });
    }
  }

  return feed;
}
