import { getJobs } from "@/lib/db/airtable";
import { HeroSection } from "@/components/ui/hero-section";
import config from "@/config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobsLayout } from "@/components/jobs/JobsLayout";
import { getCountryFromSlug } from "@/lib/constants/locations";
import { JobSearchInput } from "@/components/ui/job-search-input";

// Revalidate page every 5 minutes
export const revalidate = 300;

interface Props {
  params: {
    location: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locationSlug = decodeURIComponent(params.location).toLowerCase();

  // Handle remote case
  if (locationSlug === "remote") {
    return {
      title: `Remote Jobs | ${config.title}`,
      description:
        "Browse remote positions. Find the perfect remote role that matches your preferences.",
      alternates: {
        canonical: "/jobs/location/remote",
      },
    };
  }

  // Handle country case
  const countryName = getCountryFromSlug(locationSlug);
  if (!countryName) {
    return notFound();
  }

  return {
    title: `${countryName} Jobs | ${config.title}`,
    description: `Browse positions in ${countryName}. Find the perfect role that matches your location preferences.`,
    alternates: {
      canonical: `/jobs/location/${locationSlug}`,
    },
  };
}

export default async function JobLocationPage({ params }: Props) {
  const jobs = await getJobs();
  const locationSlug = decodeURIComponent(params.location).toLowerCase();

  // Handle remote jobs
  if (locationSlug === "remote") {
    const filteredJobs = jobs.filter((job) => job.workplace_type === "Remote");
    if (filteredJobs.length === 0) return notFound();

    return (
      <>
        <HeroSection
          badge="Remote"
          title="Remote Jobs"
          description={`Browse ${filteredJobs.length.toLocaleString()} remote ${
            filteredJobs.length === 1 ? "position" : "positions"
          }. Work from anywhere with these flexible opportunities.`}
          heroImage={config.jobsPages?.dynamicPages?.location?.heroImage}
        >
          {/* Search Bar */}
          <div className="max-w-[480px]">
            <JobSearchInput placeholder="Search remote jobs..." />
          </div>
        </HeroSection>
        <JobsLayout filteredJobs={filteredJobs} />
      </>
    );
  }

  // Handle country-specific jobs
  const countryName = getCountryFromSlug(locationSlug);
  if (!countryName) return notFound();

  const filteredJobs = jobs.filter(
    (job) => job.workplace_country?.toLowerCase() === countryName.toLowerCase()
  );

  if (filteredJobs.length === 0) return notFound();

  return (
    <>
      <HeroSection
        badge={countryName}
        title={`${countryName} Jobs`}
        description={`Browse ${filteredJobs.length.toLocaleString()} ${
          filteredJobs.length === 1 ? "position" : "positions"
        } in ${countryName}. Find the perfect role that matches your location preferences.`}
        heroImage={config.jobsPages?.dynamicPages?.location?.heroImage}
      >
        {/* Search Bar */}
        <div className="max-w-[480px]">
          <JobSearchInput placeholder={`Search ${countryName} jobs...`} />
        </div>
      </HeroSection>
      <JobsLayout filteredJobs={filteredJobs} />
    </>
  );
}
