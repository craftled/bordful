import type { MetadataRoute } from 'next';
import { getJobs } from '@/lib/db/airtable';
import { generateJobSlug } from '@/lib/utils/slugify';

/**
 * Generate the sitemap for the website
 * This function runs at build time and creates a sitemap for all your pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get the base URL from environment variable or default to localhost
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Define your static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ] as MetadataRoute.Sitemap;

  try {
    // Fetch all active jobs
    const jobs = await getJobs();

    // Create sitemap entries for each job using descriptive slugs
    const jobRoutes = jobs
      .filter(
        (job) =>
          job.posted_date && !Number.isNaN(new Date(job.posted_date).getTime())
      )
      .map((job) => ({
        url: `${baseUrl}/jobs/${generateJobSlug(job.title, job.company)}`,
        lastModified: new Date(job.posted_date),
        changeFrequency: 'daily' as const,
        priority: job.featured ? 0.9 : 0.7,
      }));

    // Create sitemap entries for job category pages
    const uniqueTypes = [
      ...new Set(jobs.map((job) => job.type).filter(Boolean)),
    ];
    const typeRoutes = uniqueTypes.map((type) => ({
      url: `${baseUrl}/jobs/type/${type.toLowerCase().replace(/\s+/g, '-')}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));

    // Create sitemap entries for career level pages
    const uniqueLevels = [
      ...new Set(jobs.flatMap((job) => job.career_level).filter(Boolean)),
    ];
    const levelRoutes = uniqueLevels.map((level) => ({
      url: `${baseUrl}/jobs/level/${level.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));

    // Create sitemap entries for location pages
    const locations = jobs.reduce((acc, job) => {
      if (job.workplace_type === 'Remote' && !acc.includes('remote')) {
        acc.push('remote');
      }
      if (job.workplace_country && !acc.includes(job.workplace_country)) {
        acc.push(job.workplace_country);
      }
      return acc;
    }, [] as string[]);

    const locationRoutes = locations.map((location) => ({
      url: `${baseUrl}/jobs/location/${location
        .toLowerCase()
        .replace(/\s+/g, '-')}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }));

    // Combine all routes
    return [
      ...staticRoutes,
      ...jobRoutes,
      ...typeRoutes,
      ...levelRoutes,
      ...locationRoutes,
    ];
  } catch (_error) {
    // Return static routes if there's an error fetching jobs
    return staticRoutes;
  }
}
