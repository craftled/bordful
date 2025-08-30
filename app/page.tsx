import type { Metadata } from 'next';
import { HomePage } from '@/components/home/HomePage';
import config from '@/config';
import { getJobs } from '@/lib/db/airtable';
import { generateMetadata } from '@/lib/utils/metadata';

// Add metadata for SEO
export const metadata: Metadata = generateMetadata({
  title: config.title,
  description: config.description,
  path: '/',
  openGraph: {
    type: 'website',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: `${config.title} - ${config.description}`,
      },
    ],
  },
});

// Revalidate every 5 minutes
export const revalidate = 300;

export default async function Home() {
  const jobs = await getJobs();
  return <HomePage initialJobs={jobs} />;
}
