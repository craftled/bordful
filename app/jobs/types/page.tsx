import { Briefcase } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';
import {
  JOB_TYPE_DESCRIPTIONS,
  JOB_TYPE_DISPLAY_NAMES,
  type JobType,
} from '@/lib/constants/job-types';
import { getJobs } from '@/lib/db/airtable';
import { generateMetadata } from '@/lib/utils/metadata';

// Generate metadata for SEO
export const metadata: Metadata = generateMetadata({
  title: `Browse Jobs by Type | ${config.title}`,
  description:
    'Explore tech jobs by employment type. Find full-time, part-time, or contract positions that match your preferences.',
  path: '/jobs/types',
});

// Revalidate page every 5 minutes
export const revalidate = 300;

type TypeCardProps = {
  href: string;
  title: string;
  description: string;
  count: number;
};

function TypeCard({ href, title, description, count }: TypeCardProps) {
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
        <p className="line-clamp-2 text-gray-500 text-xs sm:text-sm">
          {description}
        </p>
        <div className="text-gray-500 text-xs sm:text-sm">
          {count.toLocaleString()} {count === 1 ? 'position' : 'positions'}{' '}
          available
        </div>
      </div>
    </Link>
  );
}

export default async function JobTypesPage() {
  const jobs = await getJobs();

  // Aggregate job counts by type
  const typeCounts = jobs.reduce<Partial<Record<JobType, number>>>(
    (acc, job) => {
      if (job.type) {
        acc[job.type] = (acc[job.type] || 0) + 1;
      }
      return acc;
    },
    {}
  );

  // Sort types by job count
  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      type: type as JobType,
      title: JOB_TYPE_DISPLAY_NAMES[type as JobType],
      description: JOB_TYPE_DESCRIPTIONS[type as JobType],
      count,
    }));

  return (
    <>
      <HeroSection
        badge="Job Types"
        description={`Explore ${jobs.length.toLocaleString()} open positions across different employment types. Find the perfect role that matches your preferences.`}
        heroImage={config.jobsPages?.types?.heroImage}
        title="Browse Jobs by Type"
      />

      <main className="container py-6 sm:py-8">
        <div className="max-w-5xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <MetadataBreadcrumb
              items={[
                { name: 'Home', url: '/' },
                { name: 'Jobs', url: '/jobs' },
                { name: 'Types', url: '/jobs/types' },
              ]}
              metadata={metadata}
              pathname="/jobs/types"
            />
          </div>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Briefcase
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
              />
              <h2 className="font-semibold text-lg sm:text-xl">
                Available Job Types
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {sortedTypes.map(({ type, title, description, count }) => (
                <TypeCard
                  count={count}
                  description={description}
                  href={`/jobs/type/${type.toLowerCase()}`}
                  key={type}
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
