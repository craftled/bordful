import { getJobs } from "@/lib/db/airtable";
import { HeroSection } from "@/components/ui/hero-section";
import config from "@/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobsLayout } from "@/components/jobs/JobsLayout";
import {
  JobType,
  JOB_TYPE_DISPLAY_NAMES,
  JOB_TYPE_DESCRIPTIONS,
} from "@/lib/constants/job-types";
import { generateMetadata as createMetadata } from "@/lib/utils/metadata";
import { JobSearchInput } from "@/components/ui/job-search-input";

// Revalidate page every 5 minutes
export const revalidate = 300;

interface Props {
  params: {
    type: string;
  };
}

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
  const typeSlug = decodeURIComponent(params.type).toLowerCase();
  const jobType = getJobTypeFromSlug(typeSlug);

  if (!jobType) {
    return {
      title: "Job Type Not Found | " + config.title,
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
  const typeSlug = decodeURIComponent(params.type).toLowerCase();
  const jobType = getJobTypeFromSlug(typeSlug);

  if (!jobType) {
    return notFound();
  }

  const displayName = JOB_TYPE_DISPLAY_NAMES[jobType];
  const description = JOB_TYPE_DESCRIPTIONS[jobType];

  const filteredJobs = jobs.filter((job) => job.type === jobType);

  if (filteredJobs.length === 0) return notFound();

  return (
    <>
      <HeroSection
        badge={displayName}
        title={`${displayName} Jobs`}
        description={`Browse ${filteredJobs.length.toLocaleString()} ${
          filteredJobs.length === 1 ? "position" : "positions"
        } for ${displayName.toLowerCase()} roles. ${description}`}
        heroImage={config.jobsPages?.dynamicPages?.type?.heroImage}
      >
        {/* Search Bar */}
        <div className="max-w-[480px]">
          <JobSearchInput
            placeholder={`Search ${displayName.toLowerCase()} jobs...`}
          />
        </div>
      </HeroSection>
      <JobsLayout allJobs={jobs} filteredJobs={filteredJobs} />
    </>
  );
}
