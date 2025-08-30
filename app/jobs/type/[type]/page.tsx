import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JobsLayout } from '@/components/jobs/JobsLayout';
import { HeroSection } from '@/components/ui/hero-section';
import { JobSearchInput } from '@/components/ui/job-search-input';
import config from '@/config';
import {
  JOB_TYPE_DESCRIPTIONS,
  JOB_TYPE_DISPLAY_NAMES,
  type JobType,
} from '@/lib/constants/job-types';
import { getJobs } from '@/lib/db/airtable';
import { generateMetadata as createMetadata } from '@/lib/utils/metadata';

// Revalidate page every 5 minutes
export const revalidate = 300;

type Props = {
  params: Promise<{
    type: string;
  }>;
};

/**
 * Convert URL slug to job type
 */
function getJobTypeFromSlug(slug: string): JobType | null {
  const normalized = slug.toLowerCase();
  const match = Object.entries(JOB_TYPE_DISPLAY_NAMES).find(
    ([key]) => key.toLowerCase() === normalized
  );
  return match ? (match[0] as JobType) : null;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Await the entire params object first
  const resolvedParams = await params;
  const typeSlug = decodeURIComponent(resolvedParams.type).toLowerCase();
  const jobType = getJobTypeFromSlug(typeSlug);

  if (!jobType) {
    return {
      title: `Job Type Not Found | ${config.title}`,
      description: "The job type you're looking for doesn't exist.",
    };
  }

  const displayName = JOB_TYPE_DISPLAY_NAMES[jobType];
  const description = JOB_TYPE_DESCRIPTIONS[jobType];

  return createMetadata({
    title: `${displayName} Jobs | ${config.title}`,
    description: `Browse ${displayName.toLowerCase()} jobs. ${description}`,
    path: `/jobs/type/${typeSlug}`,
  });
}

export default async function JobTypePage({ params }: Props) {
  const jobs = await getJobs();
  // Await the entire params object first
  const resolvedParams = await params;
  const typeSlug = decodeURIComponent(resolvedParams.type).toLowerCase();
  const jobType = getJobTypeFromSlug(typeSlug);

  if (!jobType) {
    return notFound();
  }

  const displayName = JOB_TYPE_DISPLAY_NAMES[jobType];
  const description = JOB_TYPE_DESCRIPTIONS[jobType];

  const filteredJobs = jobs.filter((job) => job.type === jobType);

  if (filteredJobs.length === 0) {
    return notFound();
  }

  return (
    <>
      <HeroSection
        badge={displayName}
        description={`Browse ${filteredJobs.length.toLocaleString()} ${
          filteredJobs.length === 1 ? 'position' : 'positions'
        } for ${displayName.toLowerCase()} roles. ${description}`}
        heroImage={config.jobsPages?.dynamicPages?.type?.heroImage}
        title={`${displayName} Jobs`}
      >
        {/* Search Bar */}
        <div className="max-w-[480px]">
          <JobSearchInput
            placeholder={`Search ${displayName.toLowerCase()} jobs...`}
          />
        </div>
      </HeroSection>
      <JobsLayout filteredJobs={filteredJobs} />
    </>
  );
}
