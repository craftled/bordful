import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactInfoSection } from '@/components/contact/ContactInfoSection';
import { SupportChannelCard } from '@/components/contact/SupportChannelCard';
import { Button } from '@/components/ui/button';
import { ContactSchema } from '@/components/ui/contact-schema';
import { HeroSection } from '@/components/ui/hero-section';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';

// Add metadata for SEO
export const metadata: Metadata = {
  title: `${config.contact?.title || 'Contact'} | ${config.title}`,
  description:
    config.contact?.description ||
    "Have questions or feedback? We'd love to hear from you.",
  keywords:
    config.contact?.keywords ||
    'contact us, support, help, questions, feedback, get in touch',
  openGraph: {
    title: `${config.contact?.title || 'Contact'} | ${config.title}`,
    description:
      config.contact?.description ||
      "Have questions or feedback? We'd love to hear from you.",
    type: 'website',
    url: `${config.url}/contact`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${config.contact?.title || 'Contact'} | ${config.title}`,
    description:
      config.contact?.description ||
      "Have questions or feedback? We'd love to hear from you.",
  },
  alternates: {
    canonical: '/contact',
    languages: {
      en: `${config.url}/contact`,
      'x-default': `${config.url}/contact`,
    },
  },
};

// This page will be static
export const dynamic = 'force-static';

export default function ContactPage() {
  // If contact page is not enabled, redirect to home page
  if (!config.contact?.enabled) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="mb-4 font-bold text-2xl">
            Contact Page Not Available
          </h1>
          <p className="mb-6">The contact page is currently not available.</p>
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
      {/* Add ContactPage Schema */}
      <ContactSchema
        address={config.contact.contactInfo.address}
        companyName={config.contact.contactInfo.companyName}
        description={config.contact.schema?.description}
        email={config.contact.contactInfo.email}
        phone={config.contact.contactInfo.phone}
      />

      <HeroSection
        badge={config.contact.badge || 'Contact Us'}
        description={config.contact.description}
        heroImage={config.contact.heroImage}
        title={config.contact.title}
      />

      {/* Contact and Support Channels */}
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <MetadataBreadcrumb metadata={metadata} pathname="/contact" />
        </div>

        <h2 className="mb-8 text-center font-semibold text-2xl text-zinc-900">
          {config.contact.supportChannels.title}
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Contact Information Card (First Card) */}
          <div className="h-full">
            <ContactInfoSection
              address={config.contact.contactInfo.address}
              companyName={config.contact.contactInfo.companyName}
              description={config.contact.contactInfo.description}
              email={config.contact.contactInfo.email}
              phone={config.contact.contactInfo.phone}
              title={config.contact.contactInfo.title}
            />
          </div>

          {/* Support Channel Cards */}
          {config.contact.supportChannels.channels.map((channel, index) => (
            <SupportChannelCard
              buttonLink={channel.buttonLink}
              buttonText={channel.buttonText}
              description={channel.description}
              icon={channel.icon}
              key={channel.title || index}
              title={channel.title}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
