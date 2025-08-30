import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { AboutSchema } from '@/components/ui/about-schema';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';

// Add metadata for SEO
export const metadata: Metadata = {
  title: `${config.about?.title || 'About Us'} | ${config.title}`,
  description:
    config.about?.description ||
    'Learn more about our company, mission, and values.',
  keywords: 'about us, company, mission, values, team, story',
  openGraph: {
    title: `${config.about?.title || 'About Us'} | ${config.title}`,
    description:
      config.about?.description ||
      'Learn more about our company, mission, and values.',
    type: 'website',
    url: `${config.url}/about`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${config.about?.title || 'About Us'} | ${config.title}`,
    description:
      config.about?.description ||
      'Learn more about our company, mission, and values.',
  },
  alternates: {
    canonical: '/about',
    languages: {
      en: `${config.url}/about`,
      'x-default': `${config.url}/about`,
    },
  },
};

// This page will be static
export const dynamic = 'force-static';

export default function AboutPage() {
  // If about page is not enabled, redirect to home page
  if (!config.about?.enabled) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="mb-4 font-bold text-2xl">About Page Not Available</h1>
          <p className="mb-6">The about page is currently not available.</p>
          <Link href="/">
            <Button
              style={{ backgroundColor: resolveColor(config.ui.primaryColor) }}
              variant="primary"
            >
              Return Home
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Add AboutPage Schema from config */}
      <AboutSchema
        companyName={config.about.schema?.companyName || config.title}
        description={
          config.about.schema?.description || config.about.description
        }
        logo={
          config.about.schema?.logo ||
          (config.nav?.logo?.enabled
            ? `${config.url}${config.nav.logo.src}`
            : undefined)
        }
      />

      <HeroSection
        badge={config.about.badge || 'About Us'}
        description={config.about.description}
        heroImage={config.about.heroImage}
        title={config.about.title}
      />

      {/* About Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <MetadataBreadcrumb metadata={metadata} pathname="/about" />
          </div>

          <div className="w-full">
            {/* Mission Section */}
            <h2 className="mb-4 font-semibold text-xl text-zinc-900">
              {config.about.sections?.mission?.title || 'Mission'}
            </h2>
            <p className="mb-8 text-zinc-600 leading-relaxed">
              {config.about.sections?.mission?.content ||
                "We're on a mission to connect talented professionals with meaningful opportunities and help organizations find the perfect candidates to drive their success."}
            </p>

            {/* Story Section */}
            <h2 className="mb-4 font-semibold text-xl text-zinc-900">
              {config.about.sections?.story?.title || 'Story'}
            </h2>
            <p className="mb-8 text-zinc-600 leading-relaxed">
              {config.about.sections?.story?.content ||
                "Founded with a passion for revolutionizing the job search experience, our platform was built to address the challenges faced by both job seekers and employers in today's competitive market."}
            </p>

            {/* Team Section */}
            <h2 className="mb-4 font-semibold text-xl text-zinc-900">
              {config.about.sections?.team?.title || 'Team'}
            </h2>
            <p className="mb-8 text-zinc-600 leading-relaxed">
              {config.about.sections?.team?.content ||
                'Our diverse team brings together expertise from recruitment, technology, and design to create an innovative job board solution that puts user experience first.'}
            </p>

            {/* Contact Us Section - Conditionally rendered based on config */}
            {config.about.contact?.show && (
              <>
                <h2 className="mb-4 font-semibold text-xl text-zinc-900">
                  {config.about.contact.title || 'Get in Touch'}
                </h2>
                <p className="mb-6 text-zinc-600 leading-relaxed">
                  {config.about.contact.description ||
                    'Have questions or want to learn more about our services? We&apos;d love to hear from you.'}
                </p>
                <div className="mt-6 mb-8">
                  <Link href={config.about.contact.url}>
                    <Button
                      className="gap-1.5 text-xs"
                      size="xs"
                      style={{
                        backgroundColor: resolveColor(config.ui.primaryColor),
                      }}
                      variant="primary"
                    >
                      {config.about.contact.label}
                      <ArrowRight
                        aria-hidden="true"
                        className="ml-1 h-3.5 w-3.5"
                      />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
