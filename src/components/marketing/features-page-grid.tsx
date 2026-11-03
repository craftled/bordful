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
import { Section } from "./section";

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
    <Section className="md:py-[72px]" padding="default">
      <Container className="flex flex-col gap-5 md:items-center md:gap-8">
        <div className="flex flex-col gap-5 md:items-center md:gap-2.5 md:text-center">
          <h2 className="flex flex-col text-[26px] leading-8 font-medium tracking-[-0.03em] md:text-[28px] md:leading-[34px]">
            <span className="text-foreground">Built for</span>
            <span className="text-subtle">job boards.</span>
          </h2>
          <p className="text-muted-foreground max-w-[520px] text-[15px] leading-[18px] md:leading-[23px] md:text-balance">
            Every part of the template, as it works in the app today.
          </p>
        </div>
        <ul className="grid w-full gap-5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {FEATURES_PAGE_ITEMS.map((feature) => (
            <li
              className="bg-card ring-line-strong flex flex-col gap-1.5 rounded-[14px] p-[18px] ring-1 ring-inset sm:gap-2.5 sm:rounded-xl sm:p-5"
              key={feature.title}
            >
              <span className="bg-tag text-muted-foreground hidden size-7 shrink-0 items-center justify-center rounded-lg sm:flex">
                <feature.icon
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.4}
                />
              </span>
              <h3 className="text-foreground text-[15px] leading-[22px] font-medium">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-[13px] leading-[19px]">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
