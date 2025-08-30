import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { JobAlertsForm } from '@/components/job-alerts/JobAlertsForm';
import { CompactJobCardList } from '@/components/jobs/CompactJobCardList';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';
import { getJobs } from '@/lib/db/airtable';

// Add metadata for SEO
export const metadata: Metadata = {
  title: 'Job Alerts | Get Notified of New Opportunities',
  description:
    config.jobAlerts.form?.description ||
    'Subscribe to job alerts and get notified when new opportunities are posted.',
  keywords:
    'job alerts, job notifications, career alerts, employment updates, job subscription',
  openGraph: {
    title: 'Job Alerts | Get Notified of New Opportunities',
    description:
      config.jobAlerts.form?.description ||
      'Subscribe to job alerts and get notified when new opportunities are posted.',
    type: 'website',
    url: `${config.url}/job-alerts`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Alerts | Get Notified of New Opportunities',
    description:
      config.jobAlerts.form?.description ||
      'Subscribe to job alerts and get notified when new opportunities are posted.',
  },
  alternates: {
    canonical: `${config.url}/job-alerts`,
    languages: {
      en: `${config.url}/job-alerts`,
      'x-default': `${config.url}/job-alerts`,
    },
  },
};

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function JobAlertsPage() {
  // Redirect to home page if job alerts feature is disabled
  if (!config.jobAlerts?.enabled) {
    redirect('/');
  }

  // Fetch the latest jobs
  const allJobs = await getJobs();
  const latestJobs = allJobs.slice(0, 7); // Show 10 jobs

  return (
    <main className="min-h-screen bg-background">
      <HeroSection
        badge={config.jobAlerts.hero?.badge || 'Job Alerts'}
        description={
          config.jobAlerts.hero?.description ||
          'Subscribe to job alerts and get notified when new opportunities are posted.'
        }
        heroImage={config.jobAlerts.heroImage}
        title={config.jobAlerts.hero?.title || 'Get Jobs Right to Your Inbox'}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-6">
          <MetadataBreadcrumb metadata={metadata} pathname="/job-alerts" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Job alerts form */}
          <div className="lg:col-span-1">
            <h2 className="mb-4 font-semibold text-xl">
              {config.jobAlerts.form?.heading || 'Subscribe for Updates'}
            </h2>
            <p className="mb-6 text-sm text-zinc-600">
              {config.jobAlerts.form?.description ||
                "Get notified when new jobs are posted. We'll also subscribe you to Bordful newsletter."}
            </p>
            <JobAlertsForm />
          </div>

          {/* Latest jobs */}
          <div className="lg:col-span-2">
            <CompactJobCardList className="bg-white" jobs={latestJobs} />
          </div>
        </div>
      </div>
    </main>
  );
}
