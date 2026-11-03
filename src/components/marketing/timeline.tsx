import { cn } from "@/lib/utils";

import { Container } from "./container";
import { Section } from "./section";
import { SectionHeader } from "./section-header";

// The real path from the deploy button to a paying board: the Vercel clone
// provisions Postgres, a fresh install shows the Bordfeed sample feed, Site
// settings carry the brand, and Post a Job is a Stripe payment link.
const STEPS = [
  {
    body: "One click to Vercel. Postgres and the admin come with it.",
    title: "Deploy",
    when: "Minute 0",
  },
  {
    body: "Sample jobs from Bordfeed fill it, so it never looks empty.",
    title: "Board is live",
    when: "Minute 2",
  },
  {
    body: "Logo, colors and fonts in Site settings. Turn on alerts with Resend.",
    title: "Make it yours",
    when: "Day 1",
  },
  {
    body: "Connect your Bordfeed feed, or add a Stripe link and take paid posts.",
    title: "Open for business",
    when: "Week 1",
  },
] as const;

export function Timeline() {
  return (
    <Section>
      <Container className="flex flex-col gap-9">
        <SectionHeader
          eyebrow="How it works"
          title="From zero to a live board."
          titleMuted="Before your coffee cools."
        />
        <ol className="grid gap-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li className="flex flex-col gap-3" key={step.title}>
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5",
                  index === 0 ? "bg-foreground" : "bg-line"
                )}
              />
              <div className="flex flex-col gap-1.5 pr-5">
                <p className="text-subtle font-mono text-[11px] leading-[14px] font-medium uppercase">
                  {step.when}
                </p>
                <h3 className="text-foreground text-[15px] leading-5 font-medium">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-[13px] leading-[19px]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
