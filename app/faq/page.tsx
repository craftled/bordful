import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FAQContent } from '@/components/ui/faq-content';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';

// Add metadata for SEO
export const metadata: Metadata = {
  title: `${config.faq?.title || 'FAQ'} | ${config.title}`,
  description:
    config.faq?.description ||
    'Find answers to common questions about our job board and services.',
  keywords:
    config.faq?.keywords ||
    'job board FAQ, frequently asked questions, job search help, employer questions',
  openGraph: {
    title: `${config.faq?.title || 'FAQ'} | ${config.title}`,
    description:
      config.faq?.description ||
      'Find answers to common questions about our job board and services.',
    type: 'website',
    url: `${config.url}/faq`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${config.faq?.title || 'FAQ'} | ${config.title}`,
    description:
      config.faq?.description ||
      'Find answers to common questions about our job board and services.',
  },
  alternates: {
    canonical: '/faq',
    languages: {
      en: `${config.url}/faq`,
      'x-default': `${config.url}/faq`,
    },
  },
};

// This page will be static
export const dynamic = 'force-static';

export default function FAQPage() {
  // If FAQ is not enabled, redirect to home page
  if (!config.faq?.enabled) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="mb-4 font-bold text-2xl">FAQ Not Available</h1>
          <p className="mb-6">The FAQ page is currently not available.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <HeroSection
        badge={config.faq.badge || 'FAQ'}
        description={config.faq.description}
        heroImage={config.faq.heroImage}
        title={config.faq.title}
      />

      {/* FAQ Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <MetadataBreadcrumb metadata={metadata} pathname="/faq" />
          </div>

          <FAQContent categories={config.faq.categories} />
        </div>
      </div>
    </main>
  );
}
