import { Globe2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';
import type { Country } from '@/lib/constants/countries';
import type { LocationCounts } from '@/lib/constants/locations';
import {
  createLocationSlug,
  formatLocationTitle,
} from '@/lib/constants/locations';
import { getJobs } from '@/lib/db/airtable';
import { generateMetadata } from '@/lib/utils/metadata';

// Generate metadata for SEO
export const metadata: Metadata = generateMetadata({
  title: `Browse Jobs by Location | ${config.title}`,
  description:
    'Explore tech jobs by location. Find remote opportunities or positions in your preferred country.',
  path: '/jobs/locations',
});

// Revalidate page every 5 minutes
export const revalidate = 300;

type LocationCardProps = {
  href: string;
  title: string;
  count: number;
};

function LocationCard({ href, title, count }: LocationCardProps) {
  return (
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
  );
}

export default async function LocationsPage() {
  const jobs = await getJobs();

  // Aggregate job counts by location
  const locationCounts = jobs.reduce<LocationCounts>(
    (acc, job) => {
      if (job.workplace_type === 'Remote') {
        acc.remote += 1;
      }
      if (job.workplace_country) {
        // Only add countries that match our Country type
        // Use type assertion with validation
        const countryName = job.workplace_country;
        // Use a safer way to update the countries object that satisfies TypeScript
        acc.countries = {
          ...acc.countries,
          [countryName as Country]:
            (acc.countries[countryName as Country] || 0) + 1,
        };
      }
      if (job.workplace_city) {
        // Use a similar approach for cities to be consistent
        const cityName = job.workplace_city;
        acc.cities = {
          ...acc.cities,
          [cityName]: (acc.cities[cityName] || 0) + 1,
        };
      }
      return acc;
    },
    {
      countries: {},
      cities: {},
      remote: 0,
    }
  );

  // Sort countries by job count
  const sortedCountries = Object.entries(locationCounts.countries)
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({
      title: formatLocationTitle(country),
      slug: createLocationSlug(country),
      count,
    }));

  return (
    <>
      <HeroSection
        badge="Locations"
        description={`Explore ${jobs.length.toLocaleString()} open positions across different locations. Find remote opportunities or positions in your preferred country.`}
        heroImage={config.jobsPages?.locations?.heroImage}
        title="Browse Jobs by Location"
      />

      <main className="container py-6 sm:py-8">
        <div className="max-w-5xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <MetadataBreadcrumb
              items={[
                { name: 'Home', url: '/' },
                { name: 'Jobs', url: '/jobs' },
                { name: 'Locations', url: '/jobs/locations' },
              ]}
              metadata={metadata}
              pathname="/jobs/locations"
            />
          </div>

          {/* Remote Section */}
          {locationCounts.remote > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <Globe2
                  aria-hidden="true"
                  className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
                />
                <h2 className="font-semibold text-lg sm:text-xl">
                  Remote Opportunities
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                <LocationCard
                  count={locationCounts.remote}
                  href="/jobs/location/remote"
                  title="Remote"
                />
              </div>
            </section>
          )}

          {/* Countries Section */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Globe2
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
              />
              <h2 className="font-semibold text-lg sm:text-xl">
                Jobs by Country
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {sortedCountries.map(({ title, slug, count }) => (
                <LocationCard
                  count={count}
                  href={`/jobs/location/${slug}`}
                  key={slug}
                  title={title}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
