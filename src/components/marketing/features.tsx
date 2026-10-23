import { Container } from "./container";
import { FeatureCard } from "./feature-card";
import { Section } from "./section";
import { SectionHeader } from "./section-header";

const features = [
  {
    description:
      "A fresh deploy shows real sample jobs from Bordfeed. The board is up in about two minutes.",
    title: "Sample jobs on first boot",
  },
  {
    description:
      "Connect Bordfeed when you want an ongoing feed, and the sample jobs step aside.",
    title: "Connect Bordfeed",
  },
  {
    description:
      "Employers pay through your Stripe payment link. You set how many days a listing stays up.",
    title: "Post a Job",
  },
  {
    description:
      "Visitors subscribe to a weekly or daily digest. Mail goes out through Resend.",
    title: "Email job alerts",
  },
  {
    description:
      "RSS and JSON feeds for the newest jobs, plus JobPosting JSON-LD on each listing.",
    title: "Feeds and structured data",
  },
  {
    description:
      "Colors, type, and logo come from site settings. Deploy the same app on Vercel.",
    title: "Your brand, your deploy",
  },
] as const;

export function Features() {
  return (
    <Section variant="secondary">
      <Container>
        <SectionHeader
          description="Payload, Postgres, and the pieces a job board needs on day one."
          title="Features"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              description={feature.description}
              key={feature.title}
              title={feature.title}
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
