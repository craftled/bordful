import { getJobs } from '@/lib/db/airtable';
import { generateJobSlug } from '@/lib/utils/slugify';

export type MinimalJob = {
  title: string;
  company: string;
  type: string;
  workplace_type: string;
};

/**
 * Find job by slug from all jobs
 */
export async function getJobBySlugMinimal(
  slug: string
): Promise<MinimalJob | null> {
  try {
    const jobs = await getJobs();

    for (const job of jobs) {
      if (job.status === 'active') {
        const jobSlug = generateJobSlug(job.title, job.company);
        if (jobSlug === slug) {
          return {
            title: job.title,
            company: job.company,
            type: job.type,
            workplace_type: job.workplace_type,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding job by slug:', error);
    return null;
  }
}

/**
 * Validate job parameters and fetch job data
 */
export async function validateJobAndParams(context: {
  params: { slug: string };
}): Promise<{ job: MinimalJob } | Response> {
  try {
    const params = await context.params;
    const { slug } = params;

    if (!slug || typeof slug !== 'string') {
      return new Response('Invalid slug parameter', { status: 400 });
    }

    const job = await getJobBySlugMinimal(slug);
    if (!job) {
      return new Response(`Job not found: ${slug}`, { status: 404 });
    }

    return { job };
  } catch (error) {
    console.error('Error validating job parameters:', error);
    return new Response('Invalid request parameters', { status: 400 });
  }
}
