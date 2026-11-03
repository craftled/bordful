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
      <Container className="flex flex-col gap-5 md:gap-9">
        <SectionHeader
          eyebrow="How it works"
          phone="mono"
          title="From zero to a live board."
          titleMuted="Before your coffee cools."
        />
        {/* Phones get Paper's numbered rows; from md up, the four-column
            timeline with a progress rule over each step. */}
        <ol className="flex flex-col md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              className="border-line flex gap-3.5 border-t py-4 md:flex-col md:gap-3 md:border-t-0 md:py-0"
              key={step.title}
            >
              <span
                aria-hidden="true"
                className="text-subtle w-5 shrink-0 pt-0.5 font-mono text-[12px] leading-4 font-medium md:hidden"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "hidden h-0.5 md:block",
                  index === 0 ? "bg-foreground" : "bg-line"
                )}
              />
              <div className="flex flex-col gap-1 md:gap-1.5 md:pr-5">
                <p className="text-subtle hidden font-mono text-[11px] leading-[14px] font-medium uppercase md:block">
                  {step.when}
                </p>
                <h3 className="text-foreground text-[15px] leading-[18px] font-medium md:leading-5">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-[14px] leading-5 md:text-[13px] md:leading-[19px]">
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
