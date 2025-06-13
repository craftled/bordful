import { getJobs } from "@/lib/db/airtable";
import { HeroSection } from "@/components/ui/hero-section";
import config from "@/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobsLayout } from "@/components/jobs/JobsLayout";
import {
  LanguageCode,
  LANGUAGE_CODES,
  getDisplayNameFromCode,
} from "@/lib/constants/languages";
import { generateMetadata as createMetadata } from "@/lib/utils/metadata";
import { JobSearchInput } from "@/components/ui/job-search-input";

// Revalidate page every 5 minutes
export const revalidate = 300;

interface Props {
  params: {
    language: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const languageCode = params.language.toLowerCase();

  // Check if valid language code
  if (!LANGUAGE_CODES.includes(languageCode as LanguageCode)) {
    return {
      title: "Language Not Found | " + config.title,
      description: "The language you're looking for doesn't exist.",
    };
  }

  const displayName = getDisplayNameFromCode(languageCode as LanguageCode);

  return createMetadata({
    title: `${displayName} Jobs | ${config.title}`,
    description: `Browse jobs requiring ${displayName} language skills. Find the perfect role that matches your language abilities.`,
    path: `/jobs/language/${languageCode}`,
  });
}

export default async function LanguagePage({ params }: Props) {
  const jobs = await getJobs();
  const languageCode = params.language.toLowerCase();

  // Check if valid language code
  if (!LANGUAGE_CODES.includes(languageCode as LanguageCode)) {
    return notFound();
  }

  const displayName = getDisplayNameFromCode(languageCode as LanguageCode);

  // Filter jobs by language code
  const filteredJobs = jobs.filter((job) =>
    job.languages?.includes(languageCode as LanguageCode)
  );

  if (filteredJobs.length === 0) return notFound();

  return (
    <>
      <HeroSection
        badge={displayName}
        title={`${displayName} Jobs`}
        description={`Browse ${filteredJobs.length.toLocaleString()} ${
          filteredJobs.length === 1 ? "position" : "positions"
        } requiring ${displayName} language skills. Find the perfect role that matches your language abilities.`}
        heroImage={config.jobsPages?.dynamicPages?.language?.heroImage}
      >
        {/* Search Bar */}
        <div className="max-w-[480px]">
          <JobSearchInput placeholder={`Search ${displayName} jobs...`} />
        </div>
      </HeroSection>
      <JobsLayout allJobs={jobs} filteredJobs={filteredJobs} />
    </>
  );
}
