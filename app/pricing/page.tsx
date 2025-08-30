import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/ui/hero-section';
import { JobBadge } from '@/components/ui/job-badge';
import { MetadataBreadcrumb } from '@/components/ui/metadata-breadcrumb';
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';

// Format a billing term for display
const formatPricingBillingTerm = (billingTerm: string): string => {
  return `/${billingTerm}`;
};

// Add metadata for SEO
export const metadata: Metadata = {
  title: `${config.pricing?.title || 'Pricing'} | ${config.title}`,
  description:
    config.pricing?.description ||
    "Choose the plan that's right for your job board needs.",
  keywords:
    config.pricing?.keywords ||
    'job board pricing, post job, job listing plans, recruitment pricing',
  openGraph: {
    title: `${config.pricing?.title || 'Pricing'} | ${config.title}`,
    description:
      config.pricing?.description ||
      "Choose the plan that's right for your job board needs.",
    type: 'website',
    url: `${config.url}/pricing`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${config.pricing?.title || 'Pricing'} | ${config.title}`,
    description:
      config.pricing?.description ||
      "Choose the plan that's right for your job board needs.",
  },
  alternates: {
    canonical: '/pricing',
    languages: {
      en: `${config.url}/pricing`,
      'x-default': `${config.url}/pricing`,
    },
  },
};

// This page will be static
export const dynamic = 'force-static';

export default function PricingPage() {
  // If pricing is not enabled, redirect to home page
  if (!config.pricing?.enabled) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="mb-4 font-bold text-2xl">Pricing Not Available</h1>
          <p className="mb-6">The pricing page is currently not available.</p>
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
        badge={config.pricing.badge || 'Pricing'}
        description={config.pricing.description}
        heroImage={config.pricing.heroImage}
        title={config.pricing.title}
      />

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <MetadataBreadcrumb metadata={metadata} pathname="/pricing" />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {config.pricing.plans.map((plan, index) => (
            <div className="group relative" key={index}>
              <div
                className={`block h-full rounded-lg border px-5 py-6 transition-all ${
                  plan.highlighted
                    ? 'border-zinc-400 shadow-sm'
                    : 'hover:border-gray-400'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-medium text-lg">{plan.name}</h2>
                    {plan.badge && (
                      <JobBadge
                        icon={<Sparkles className="h-3 w-3" />}
                        type={plan.badge.type || 'featured'}
                      >
                        {plan.badge.text}
                      </JobBadge>
                    )}
                  </div>

                  <div className="flex items-baseline">
                    <span className="font-bold text-2xl">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="ml-1 text-gray-500 text-sm">
                        {formatPricingBillingTerm(plan.billingTerm)}
                      </span>
                    )}
                  </div>

                  <div className="text-gray-600 text-sm">
                    {plan.description}
                  </div>

                  <div>
                    <Button
                      asChild
                      className="w-full gap-1.5 text-xs"
                      size="xs"
                      style={
                        plan.cta.variant !== 'outline'
                          ? {
                              backgroundColor: resolveColor(
                                config.ui.primaryColor
                              ),
                            }
                          : undefined
                      }
                      variant={
                        plan.cta.variant === 'outline' ? 'outline' : 'primary'
                      }
                    >
                      <Link
                        href={plan.cta.link}
                        rel={
                          plan.cta.link.startsWith('http')
                            ? 'noopener noreferrer'
                            : undefined
                        }
                        target={
                          plan.cta.link.startsWith('http')
                            ? '_blank'
                            : undefined
                        }
                      >
                        {plan.cta.label}
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-3.5 w-3.5"
                        />
                      </Link>
                    </Button>
                  </div>

                  <div className="border-t pt-4" />

                  <ul className="space-y-2.5">
                    {plan.features.map((feature, featureIndex) => (
                      <li className="flex items-start" key={featureIndex}>
                        <Check className="mt-0.5 mr-2 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Processing Information */}
        {config.pricing.paymentProcessingText && (
          <div className="mx-auto mt-12 max-w-sm text-center">
            <p className="text-balance text-gray-500 text-xs">
              {config.pricing.paymentProcessingText}
            </p>

            {/* Payment Method Icons */}
            {config.pricing.paymentMethods?.enabled && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {(
                  config.pricing.paymentMethods.icons as unknown as Array<{
                    name: string;
                    alt?: string;
                  }>
                ).map((icon) => (
                  <div
                    className="relative h-8 w-10 transition-all hover:opacity-100 hover:grayscale-0"
                    key={icon.name}
                  >
                    <Image
                      alt={icon.alt || `${icon.name} payment method`}
                      fill
                      src={`/assets/${icon.name}.svg`}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
