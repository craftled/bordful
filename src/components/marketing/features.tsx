import { Bell, Briefcase, CreditCard, Palette, Plug, Rss } from "lucide-react";

import { Container } from "./container";
import { FeatureCard } from "./feature-card";
import { Section } from "./section";
import { SectionHeader } from "./section-header";

const features = [
  {
    description:
      "A fresh deploy shows real sample jobs from Bordfeed. The board is up in about two minutes.",
    icon: Briefcase,
    title: "Sample jobs on first boot",
  },
  {
    description:
      "Connect Bordfeed when you want an ongoing feed, and the sample jobs step aside.",
    icon: Plug,
    title: "Connect Bordfeed",
  },
  {
    description:
      "Employers pay through your Stripe payment link. You set how many days a listing stays up.",
    icon: CreditCard,
    title: "Post a Job",
  },
  {
    description:
      "Visitors subscribe to a weekly or daily digest. Mail goes out through Resend.",
    icon: Bell,
    title: "Email job alerts",
  },
  {
    description:
      "RSS and JSON feeds for the newest jobs, plus JobPosting JSON-LD on each listing.",
    icon: Rss,
    title: "Feeds and structured data",
  },
  {
    description:
      "Colors, type, and logo come from site settings. Deploy the same app on Vercel.",
    icon: Palette,
    title: "Your brand, your deploy",
  },
] as const;

export function Features() {
  return (
    <Section className="border-b-0" id="features" padding="flush">
      <Container className="border-line border-b pt-10 pb-8 md:pt-16 md:pb-10">
        <SectionHeader
          eyebrow="Features"
          title="Payload, Postgres, and the pieces"
          titleMuted="a job board needs on day one."
        />
      </Container>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard
            className="border-line border-b sm:border-r sm:nth-[2n]:border-r-0 lg:nth-[2n]:border-r lg:nth-[3n]:border-r-0"
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
