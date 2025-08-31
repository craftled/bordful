import { GraduationCap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';
import { CAREER_LEVEL_DISPLAY_NAMES } from '@/lib/constants/career-levels';
import { type CareerLevel, getJobs } from '@/lib/db/airtable';
import { generateMetadata } from '@/lib/utils/metadata';

// Generate metadata for SEO
export const metadata: Metadata = generateMetadata({
  title: `Browse Jobs by Career Level | ${config.title}`,
  description:
    'Explore tech jobs by experience level. Find positions that match your career stage, from internships to executive roles.',
  path: '/jobs/levels',
});

// Revalidate page every 5 minutes
export const revalidate = 300;

type LevelCardProps = {
  href: string;
  title: string;
  count: number;
};

function LevelCard({ href, title, count }: LevelCardProps) {
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

export default async function CareerLevelsPage() {
  const jobs = await getJobs();

  // Aggregate job counts by career level
  const levelCounts = jobs.reduce<Partial<Record<CareerLevel, number>>>(
    (acc, job) => {
      for (const level of job.career_level) {
        if (level !== 'NotSpecified') {
          acc[level] = (acc[level] || 0) + 1;
        }
      }
      return acc;
    },
    {}
  );

  // Sort levels by job count
  const sortedLevels = Object.entries(levelCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([level, count]) => ({
      level: level as CareerLevel,
      title: CAREER_LEVEL_DISPLAY_NAMES[level as CareerLevel],
      count,
    }));

  // Group levels by category
  const entryLevels = sortedLevels.filter((item) =>
    ['Internship', 'EntryLevel', 'Associate', 'Junior'].includes(item.level)
  );
  const midLevels = sortedLevels.filter((item) =>
    ['MidLevel', 'Senior', 'Staff', 'Principal'].includes(item.level)
  );
  const leadershipLevels = sortedLevels.filter((item) =>
    [
      'Lead',
      'Manager',
      'SeniorManager',
      'Director',
      'SeniorDirector',
      'VP',
      'SVP',
      'EVP',
      'CLevel',
      'Founder',
    ].includes(item.level)
  );

  return (
    <>
      <HeroSection
        badge="Career Levels"
        description={`Explore ${jobs.length.toLocaleString()} open positions across different experience levels. Find the perfect role that matches your career stage.`}
        heroImage={config.jobsPages?.levels?.heroImage}
        title="Browse Jobs by Career Level"
      />

      <main className="container py-6 sm:py-8">
        <div className="max-w-5xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <MetadataBreadcrumb
              items={[
                { name: 'Home', url: '/' },
                { name: 'Jobs', url: '/jobs' },
                { name: 'Career Levels', url: '/jobs/levels' },
              ]}
              metadata={metadata}
              pathname="/jobs/levels"
            />
          </div>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
              />
              <h2 className="font-semibold text-lg sm:text-xl">
                Entry Level Positions
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {entryLevels.map(({ level, title, count }) => (
                <LevelCard
                  count={count}
                  href={`/jobs/level/${level.toLowerCase()}`}
                  key={level}
                  title={title}
                />
              ))}
            </div>
          </section>

          {/* Mid Level Section */}
          {midLevels.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap
                  aria-hidden="true"
                  className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
                />
                <h2 className="font-semibold text-lg sm:text-xl">
                  Mid & Senior Level Positions
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {midLevels.map(({ level, title, count }) => (
                  <LevelCard
                    count={count}
                    href={`/jobs/level/${level.toLowerCase()}`}
                    key={level}
                    title={title}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Leadership Section */}
          {leadershipLevels.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap
                  aria-hidden="true"
                  className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
                />
                <h2 className="font-semibold text-lg sm:text-xl">
                  Leadership Positions
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {leadershipLevels.map(({ level, title, count }) => (
                  <LevelCard
                    count={count}
                    href={`/jobs/level/${level.toLowerCase()}`}
                    key={level}
                    title={title}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
