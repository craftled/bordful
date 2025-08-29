import { getJobs, CareerLevel } from "@/lib/db/airtable";
import { HeroSection } from "@/components/ui/hero-section";
import config from "@/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobsLayout } from "@/components/jobs/JobsLayout";
import { CAREER_LEVEL_DISPLAY_NAMES } from "@/lib/constants/career-levels";
import { generateMetadata as createMetadata } from "@/lib/utils/metadata";
import { JobSearchInput } from "@/components/ui/job-search-input";

// Revalidate page every 5 minutes
export const revalidate = 300;

interface Props {
  params: Promise<{
    level: string;
  }>;
}

/**
 * Convert URL slug to career level
 */
function getCareerLevelFromSlug(slug: string): CareerLevel | null {
  const normalized = slug.toLowerCase();
  const match = Object.entries(CAREER_LEVEL_DISPLAY_NAMES).find(
    ([key]) => key.toLowerCase() === normalized
  );
  return match ? (match[0] as CareerLevel) : null;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Await the entire params object first
  const resolvedParams = await params;
  const levelSlug = decodeURIComponent(resolvedParams.level).toLowerCase();
  const careerLevel = getCareerLevelFromSlug(levelSlug);

  if (!careerLevel || careerLevel === "NotSpecified") {
    return {
      title: "Career Level Not Found | " + config.title,
      description: "The career level you're looking for doesn't exist.",
    };
  }

  const displayName = CAREER_LEVEL_DISPLAY_NAMES[careerLevel];

  return createMetadata({
    title: `${displayName} Jobs | ${config.title}`,
    description: `Browse jobs requiring ${displayName} experience. Find the perfect role that matches your career level.`,
    path: `/jobs/level/${levelSlug}`,
  });
}

export default async function CareerLevelPage({ params }: Props) {
  const jobs = await getJobs();
  // Await the entire params object first
  const resolvedParams = await params;
  const levelSlug = decodeURIComponent(resolvedParams.level).toLowerCase();
  const careerLevel = getCareerLevelFromSlug(levelSlug);

  if (!careerLevel || careerLevel === "NotSpecified") {
    return notFound();
  }

  const displayName = CAREER_LEVEL_DISPLAY_NAMES[careerLevel];

  const filteredJobs = jobs.filter((job) =>
    job.career_level.includes(careerLevel)
  );

  if (filteredJobs.length === 0) return notFound();

  return (
    <>
      <HeroSection
        badge={displayName}
        title={`${displayName} Jobs`}
        description={`Browse ${filteredJobs.length.toLocaleString()} ${
          filteredJobs.length === 1 ? "position" : "positions"
        } for ${displayName.toLowerCase()} roles. Find opportunities that match your career stage.`}
        heroImage={config.jobsPages?.dynamicPages?.level?.heroImage}
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
