import { Languages } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';
import {
  getDisplayNameFromCode,
  type LanguageCode,
} from '@/lib/constants/languages';
import { getJobs } from '@/lib/db/airtable';
import { generateMetadata } from '@/lib/utils/metadata';

// Generate metadata for SEO
export const metadata: Metadata = generateMetadata({
  title: `Browse Jobs by Language | ${config.title}`,
  description:
    'Explore tech jobs by required languages. Find positions that match your language skills and preferences.',
  path: '/jobs/languages',
});

// Revalidate page every 5 minutes
export const revalidate = 300;

type LanguageCardProps = {
  href: string;
  title: string;
  count: number;
};

function LanguageCard({ href, title, count }: LanguageCardProps) {
  return (
    <Link
      className="block rounded-lg border p-4 transition-all hover:border-gray-400 sm:p-5"
      href={href}
    >
      <div className="space-y-1.5 sm:space-y-2">
        <h2 className="font-medium text-sm sm:text-base">{title}</h2>
        <p className="text-gray-500 text-xs sm:text-sm">
          {count.toLocaleString()} {count === 1 ? 'position' : 'positions'}{' '}
          available
        </p>
      </div>
    </Link>
  );
}

export default async function LanguagesPage() {
  const jobs = await getJobs();

  // Aggregate job counts by language code
  const languageCounts = jobs.reduce<Record<LanguageCode, number>>(
    (acc, job) => {
      if (job.languages) {
        for (const langCode of job.languages) {
          acc[langCode] = (acc[langCode] || 0) + 1;
        }
      }
      return acc;
    },
    {} as Record<LanguageCode, number>
  );

  // Sort languages by alphabetical order of name
  const sortedLanguages = Object.entries(languageCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => {
      // Sort alphabetically by language name
      const nameA = getDisplayNameFromCode(a[0] as LanguageCode);
      const nameB = getDisplayNameFromCode(b[0] as LanguageCode);
      return nameA.localeCompare(nameB);
    })
    .map(([code, count]) => ({
      code: code as LanguageCode,
      title: getDisplayNameFromCode(code as LanguageCode),
      count,
    }));

  return (
    <>
      <HeroSection
        badge="Languages"
        description={`Explore ${jobs.length.toLocaleString()} open positions across different language requirements. Find the perfect role that matches your language skills.`}
        heroImage={config.jobsPages?.languages?.heroImage}
        title="Browse Jobs by Language"
      />

      <main className="container py-6 sm:py-8">
        <div className="max-w-5xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <MetadataBreadcrumb
              items={[
                { name: 'Home', url: '/' },
                { name: 'Jobs', url: '/jobs' },
                { name: 'Languages', url: '/jobs/languages' },
              ]}
              metadata={metadata}
              pathname="/jobs/languages"
            />
          </div>

          <section>
            <div className="mb-4 flex items-center gap-2">
              <Languages
                aria-hidden="true"
                className="h-4 w-4 text-muted-foreground sm:h-5 sm:w-5"
              />
              <h2 className="font-semibold text-lg sm:text-xl">
                Available Languages
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {sortedLanguages.map(({ code, title, count }) => (
                <LanguageCard
                  count={count}
                  href={`/jobs/language/${code}`}
                  key={code}
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
