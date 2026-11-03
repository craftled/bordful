import {
  Bell,
  Briefcase,
  CreditCard,
  Filter,
  Palette,
  Plug,
  Rss,
  Shield,
} from "lucide-react";

import { Container } from "./container";
import { FeatureCard } from "./feature-card";
import { Section } from "./section";
import { SectionHeader } from "./section-header";

export const FEATURES_PAGE_ITEMS = [
  {
    description:
      "A job list with search, sorting by newest, oldest or salary, pagination, company pages, and a detail page for every job. Visitors can save and mark jobs as applied, kept in their own browser.",
    icon: Briefcase,
    title: "The job board",
  },
  {
    description:
      "Narrow the list by job type, level, salary range, language, remote only, and visa sponsorship. Browse by location, level, type and language archives.",
    icon: Filter,
    title: "Filters",
  },
  {
    description:
      "Visitors subscribe with an email and filters, then get a weekly or daily digest through Resend. Confirm and unsubscribe are one-click safe. Alerts stay off until you enable them.",
    icon: Bell,
    title: "Email alerts",
  },
  {
    description:
      "Send employers to your Stripe payment link. You set the price label and how long a listing stays up, 30 days by default. Editors publish the job in the admin.",
    icon: CreditCard,
    title: "Post a Job",
  },
  {
    description:
      "Colors, fonts and radius come from Site settings and apply on the next page load, with no redeploy. Component slots let you replace the header, footer or job card extras.",
    icon: Palette,
    title: "Theming",
  },
  {
    description:
      "RSS, Atom and JSON feeds of the newest jobs, a sitemap, and JobPosting structured data on each listing. Sample jobs are kept out of all of them.",
    icon: Rss,
    title: "SEO and feeds",
  },
  {
    description:
      "A fresh board loads sample jobs from Bordfeed. Connect in the admin or the CLI, and a daily sync keeps the board current within your per-sync and per-day credit caps.",
    icon: Plug,
    title: "Bordfeed sync",
  },
  {
    description:
      "Payload gives editors an admin at /admin for jobs and site settings. Sign-in locks for 10 minutes after 5 failed attempts.",
    icon: Shield,
    title: "Admin",
  },
] as const;

export function FeaturesPageGrid() {
  return (
    <Section className="border-b-0" padding="flush">
      <Container className="border-line border-t border-b pt-10 pb-8 md:pt-16 md:pb-10">
        <SectionHeader
          description="Every part of the template, as it works in the app today."
          eyebrow="What is included"
          title="Built for"
          titleMuted="job boards."
        />
      </Container>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES_PAGE_ITEMS.map((feature) => (
          <FeatureCard
            className="border-line border-b sm:border-r sm:nth-[2n]:border-r-0 lg:nth-[2n]:border-r lg:nth-[4n]:border-r-0"
            description={feature.description}
            icon={feature.icon}
            key={feature.title}
            title={feature.title}
          />
        ))}
      </div>
    </Section>
  );
}
