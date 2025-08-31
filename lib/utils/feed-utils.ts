import { Feed } from 'feed';
import config from '@/config';
import { DEFAULT_DESCRIPTION_LENGTH } from '@/lib/constants/defaults';
import { formatSalary, getJobs } from '@/lib/db/airtable';
import { generateJobSlug } from '@/lib/utils/slugify';

export type FeedConfig = {
  enabled: boolean;
  formats?: {
    rss?: boolean;
    json?: boolean;
    atom?: boolean;
  };
  title?: string;
  descriptionLength?: number;
};

export type JobItem = {
  title: string;
  company: string;
  type: string;
  workplace_type: string;
  workplace_city?: string;
  workplace_country?: string;
  salary?: any;
  posted_date?: string;
  description: string;
  apply_url: string;
  status: string;
};

/**
 * Check if feed generation is enabled for a specific format
 */
export function isFeedEnabled(
  feedConfig: FeedConfig | undefined,
  format: 'rss' | 'json' | 'atom'
): boolean {
  return Boolean(feedConfig?.enabled && feedConfig?.formats?.[format]);
}

/**
 * Create and configure a feed instance
 */
export function createFeed(baseUrl: string, feedConfig: FeedConfig): Feed {
  return new Feed({
    title: feedConfig?.title || `${config.title} | Job Feed`,
    description: config.description,
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    image: `${baseUrl}/opengraph-image.png`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    updated: new Date(),
    generator: 'Bordful Job Board',
    feedLinks: {
      rss2: `${baseUrl}/feed.xml`,
      json: `${baseUrl}/feed.json`,
      atom: `${baseUrl}/atom.xml`,
    },
  });
}

/**
 * Format job posting date safely
 */
export function formatJobDate(postedDate?: string): string {
  if (!postedDate) {
    return 'Date not available';
  }

  const date = new Date(postedDate);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Create rich job description for feed
 */
export function createJobDescription(
  job: JobItem,
  descriptionLength: number
): string {
  return `
## ${job.title} at ${job.company}

**Type:** ${job.type}
**Location:** ${job.workplace_type}${job.workplace_city ? ` - ${job.workplace_city}` : ''}${job.workplace_country ? `, ${job.workplace_country}` : ''}
**Salary:** ${job.salary ? formatSalary(job.salary, true) : 'Not specified'}
**Posted:** ${formatJobDate(job.posted_date)}

${job.description.substring(0, descriptionLength)}...

**Apply Now:** ${job.apply_url}
`;
}

/**
 * Add job item to feed
 */
export function addJobToFeed(
  feed: Feed,
  job: JobItem,
  baseUrl: string,
  descriptionLength: number
): void {
  const jobSlug = generateJobSlug(job.title, job.company);
  const jobUrl = `${baseUrl}/jobs/${jobSlug}`;

  const jobDescription = createJobDescription(job, descriptionLength);

  feed.addItem({
    title: `${job.title} at ${job.company}`,
    id: jobUrl,
    link: jobUrl,
    description: jobDescription,
    content: jobDescription,
    author: [
      {
        name: job.company,
        link: job.apply_url,
      },
    ],
    date:
      job.posted_date && !Number.isNaN(new Date(job.posted_date).getTime())
        ? new Date(job.posted_date)
        : new Date(),
    image: undefined, // Could be added later if job.featured exists
    category: [
      { name: job.type },
      ...(Array.isArray(job.workplace_type)
        ? []
        : [{ name: job.workplace_type }]),
    ],
  });
}

/**
 * Process jobs and add them to feed
 */
export async function processJobsForFeed(
  feed: Feed,
  baseUrl: string,
  descriptionLength: number
): Promise<void> {
  const jobs = await getJobs();

  for (const job of jobs) {
    // Only include active jobs
    if (job.status === 'active') {
      addJobToFeed(feed, job, baseUrl, descriptionLength);
    }
  }
}
