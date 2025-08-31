import {
  ArrowUpRight,
  Briefcase,
  Globe2,
  GraduationCap,
  Languages,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';
import type { ItemList, ListItem, WithContext } from 'schema-dts';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import { PostJobBanner } from '@/components/ui/post-job-banner';
import config from '@/config';
import { CAREER_LEVEL_DISPLAY_NAMES } from '@/lib/constants/career-levels';
import type { Country } from '@/lib/constants/countries';
import {
  getDisplayNameFromCode,
  type LanguageCode,
} from '@/lib/constants/languages';
import {
  createLocationSlug,
  formatLocationTitle,
} from '@/lib/constants/locations';
import type { CareerLevel } from '@/lib/db/airtable';
import { getJobs } from '@/lib/db/airtable';
import { resolveColor } from '@/lib/utils/colors';
import { generateMetadata } from '@/lib/utils/metadata';

// Constants for display limits
const MAX_CATEGORIES_DISPLAY = 12;
const MAX_JOB_TYPES_DISPLAY = 6;
const MAX_COUNTRIES_DISPLAY = 5;
const MAX_CAREER_LEVELS_DISPLAY = 6;

// Generate metadata for SEO
export const metadata: Metadata = generateMetadata({
  title: `Browse All Job Categories | ${config.title}`,
  description:
    'Explore job categories including types, career levels, locations, and languages. Find your perfect position with our comprehensive job filters.',
  path: '/jobs',
  openGraph: {
    type: 'website',
  },
});

// Revalidate page every 5 minutes
export const revalidate = 300;

type JobCounts = {
  types: Record<string, number>;
  careerLevels: Record<CareerLevel, number>;
  locations: {
    countries: Partial<Record<Country, number>>;
    cities: Record<string, number>;
    remote: number;
  };
  languages: Record<LanguageCode, number>;
};

type CategoryCardProps = {
  href: string;
  title: string;
  count: number;
};

function CategoryCard({ href, title, count }: CategoryCardProps) {
  return (
    <div className="group relative">
      <Link
        aria-label={`Browse ${count.toLocaleString()} ${title} ${
          count === 1 ? 'position' : 'positions'
        }`}
        className="block rounded-lg border p-4 transition-all hover:border-gray-400 sm:p-5"
        href={href}
      >
        <div className="space-y-1.5 sm:space-y-2">
          <h2 className="font-medium text-sm sm:text-base">{title}</h2>
          <div className="text-gray-500 text-xs sm:text-sm">
            {count.toLocaleString()} {count === 1 ? 'position' : 'positions'}{' '}
            available
          </div>
        </div>
      </Link>
      <div className="absolute right-3 bottom-3 opacity-0 transition-opacity group-hover:opacity-100 sm:right-4 sm:bottom-4">
        <Button
          asChild
          className="hidden gap-1.5 text-xs sm:inline-flex"
          size="xs"
          style={{ backgroundColor: resolveColor(config.ui.primaryColor) }}
          variant="primary"
        >
          <Link aria-label={`View all ${title} positions`} href={href}>
            View Jobs
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default async function JobsDirectoryPage() {
  const jobs = await getJobs();

  // Aggregate job counts by different dimensions
  const jobCounts = jobs.reduce<JobCounts>(
    (acc, job) => {
      // Count by type (skip undefined)
      if (job.type) {
        acc.types[job.type] = (acc.types[job.type] || 0) + 1;
      }

      // Count by career level (skip NotSpecified)
      for (const level of job.career_level) {
        if (level !== 'NotSpecified') {
          acc.careerLevels[level] = (acc.careerLevels[level] || 0) + 1;
        }
      }

      // Count by location
      if (job.workplace_country) {
        const country = job.workplace_country as Country;
        acc.locations.countries[country] =
          (acc.locations.countries[country] || 0) + 1;
      }
      if (job.workplace_city) {
        acc.locations.cities[job.workplace_city] =
          (acc.locations.cities[job.workplace_city] || 0) + 1;
      }
      if (job.workplace_type === 'Remote') {
        acc.locations.remote += 1;
      }

      // Count by language
      if (job.languages) {
        for (const lang of job.languages) {
          acc.languages[lang] = (acc.languages[lang] || 0) + 1;
        }
      }

      return acc;
    },
    {
      types: {},
      careerLevels: {} as Record<CareerLevel, number>,
      locations: {
        countries: {},
        cities: {},
        remote: 0,
      },
      languages: {} as Record<LanguageCode, number>,
    }
  );

  // Sort and filter job types to ensure consistent order
  const sortedJobTypes = Object.entries(jobCounts.types)
    .filter(
      ([type]) => type !== 'undefined' && type.toLowerCase() !== 'not specified'
    )
    .sort((a, b) => b[1] - a[1]); // Sort by count

  // Sort and filter career levels to ensure consistent order
  const sortedCareerLevels = Object.entries(jobCounts.careerLevels)
    .filter(([level]) => level !== 'NotSpecified')
    .sort((a, b) => b[1] - a[1]); // Sort by count

  // Sort languages by count
  const topLanguages = Object.entries(jobCounts.languages)
    .filter(([, count]) => count > 0)
    .sort((a, b) => {
      // Sort alphabetically by language name
      const nameA = getDisplayNameFromCode(a[0] as LanguageCode);
      const nameB = getDisplayNameFromCode(b[0] as LanguageCode);
      return nameA.localeCompare(nameB);
    })
    .slice(0, MAX_CATEGORIES_DISPLAY);

  // Generate ItemList schema for job categories
  const generateItemListSchema = () => {
    // Create type-safe schema using schema-dts
    const itemListSchema: WithContext<ItemList> = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Job Types',
          url: `${config.url}/jobs/types`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Career Levels',
          url: `${config.url}/jobs/levels`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Job Locations',
          url: `${config.url}/jobs/locations`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: 'Job Languages',
          url: `${config.url}/jobs/languages`,
        },
      ] as ListItem[],
    };

    return JSON.stringify(itemListSchema);
  };

  return (
    <>
      {/* Add schema markup */}
      <Script
        dangerouslySetInnerHTML={{ __html: generateItemListSchema() }}
        id="item-list-schema"
        type="application/ld+json"
      />

      <HeroSection
        badge="Job Categories"
        description={`Explore ${jobs.length.toLocaleString()} open positions across different categories. Find the perfect role that matches your skills and preferences.`}
        heroImage={config.jobsPages?.directory?.heroImage}
        title="Browse All Job Categories"
      />

      <main className="container py-6 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row">
          <div className="flex-[3]">
            <div className="max-w-5xl">
              {/* Breadcrumb navigation */}
              <div className="mb-6">
                <MetadataBreadcrumb
                  items={[
                    { name: 'Home', url: '/' },
                    { name: 'Jobs', url: '/jobs' },
                  ]}
                  metadata={metadata}
                  pathname="/jobs"
                />
              </div>

              <div className="space-y-8 sm:space-y-12">
                {/* Job Types Section */}
                <section
                  aria-labelledby="job-types-heading"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-center gap-2">
                    <Briefcase
                      aria-hidden="true"
                      className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
                    />
                    <h2
                      className="font-semibold text-lg sm:text-xl"
                      id="job-types-heading"
                    >
                      Job Types
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {sortedJobTypes
                      .slice(0, MAX_JOB_TYPES_DISPLAY)
                      .map(([type, count]) => (
                        <CategoryCard
                          count={count}
                          href={`/jobs/type/${type.toLowerCase()}`}
                          key={type}
                          title={type}
                        />
                      ))}
                  </div>
                  <div>
                    <Button
                      asChild
                      className="mt-2 gap-1.5 text-xs"
                      size="xs"
                      variant="outline"
                    >
                      <Link href="/jobs/types">
                        View All Job Types
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                      </Link>
                    </Button>
                  </div>
                </section>

                {/* Locations Section */}
                <section
                  aria-labelledby="locations-heading"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-center gap-2">
                    <Globe2
                      aria-hidden="true"
                      className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
                    />
                    <h2
                      className="font-semibold text-lg sm:text-xl"
                      id="locations-heading"
                    >
                      Locations
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {/* Remote Category */}
                    {jobCounts.locations.remote > 0 && (
                      <CategoryCard
                        count={jobCounts.locations.remote}
                        href="/jobs/location/remote"
                        title="Remote"
                      />
                    )}

                    {/* Top Countries */}
                    {Object.entries(jobCounts.locations.countries)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, MAX_COUNTRIES_DISPLAY)
                      .map(([country, count]) => (
                        <CategoryCard
                          count={count}
                          href={`/jobs/location/${createLocationSlug(country)}`}
                          key={country}
                          title={formatLocationTitle(country)}
                        />
                      ))}
                  </div>
                  <div>
                    <Button
                      asChild
                      className="mt-2 gap-1.5 text-xs"
                      size="xs"
                      variant="outline"
                    >
                      <Link
                        aria-label="View all available locations"
                        href="/jobs/locations"
                      >
                        View All Locations
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                      </Link>
                    </Button>
                  </div>
                </section>

                {/* Career Levels Section */}
                <section
                  aria-labelledby="career-levels-heading"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      aria-hidden="true"
                      className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
                    />
                    <h2
                      className="font-semibold text-lg sm:text-xl"
                      id="career-levels-heading"
                    >
                      Career Levels
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {sortedCareerLevels
                      .slice(0, MAX_CAREER_LEVELS_DISPLAY)
                      .map(([level, count]) => (
                        <CategoryCard
                          count={count}
                          href={`/jobs/level/${level.toLowerCase()}`}
                          key={level}
                          title={
                            CAREER_LEVEL_DISPLAY_NAMES[level as CareerLevel]
                          }
                        />
                      ))}
                  </div>
                  <div>
                    <Button
                      asChild
                      className="mt-2 gap-1.5 text-xs"
                      size="xs"
                      variant="outline"
                    >
                      <Link
                        aria-label="View all career levels"
                        href="/jobs/levels"
                      >
                        View All Career Levels
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                      </Link>
                    </Button>
                  </div>
                </section>

                {/* Languages Section */}
                <section
                  aria-labelledby="languages-heading"
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex items-center gap-2">
                    <Languages
                      aria-hidden="true"
                      className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
                    />
                    <h2
                      className="font-semibold text-lg sm:text-xl"
                      id="languages-heading"
                    >
                      Languages
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                    {topLanguages.map(([lang, count]) => (
                      <CategoryCard
                        count={count}
                        href={`/jobs/language/${lang.toLowerCase()}`}
                        key={lang}
                        title={getDisplayNameFromCode(lang as LanguageCode)}
                      />
                    ))}
                  </div>
                  <div>
                    <Button
                      asChild
                      className="mt-2 gap-1.5 text-xs"
                      size="xs"
                      variant="outline"
                    >
                      <Link
                        aria-label="View all languages"
                        href="/jobs/languages"
                      >
                        View All Languages
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                      </Link>
                    </Button>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="order-first w-full lg:order-last lg:w-[240px] xl:w-[260px]">
            <div className="space-y-6">
              <PostJobBanner />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
