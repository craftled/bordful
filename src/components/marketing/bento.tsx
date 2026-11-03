import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";
import { SectionHeader } from "./section-header";
import { PhoneShot, Shot } from "./shots";

// A trimmed JobPosting in the shape lib/seo/job-posting.ts emits for a remote
// job with a salary. The values are an example listing.
const JOB_POSTING = {
  "@type": "JobPosting",
  baseSalary: {
    currency: "USD",
    value: { maxValue: 190_000, minValue: 150_000, unitText: "YEAR" },
  },
  employmentType: "FULL_TIME",
  hiringOrganization: { "@type": "Organization", name: "Example Co" },
  jobLocationType: "TELECOMMUTE",
  title: "Senior Product Designer",
} as const;

function inlineJson(value: unknown): string {
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value).map(
      ([key, item]) => `${JSON.stringify(key)}: ${inlineJson(item)}`
    );
    return `{ ${entries.join(", ")} }`;
  }

  return JSON.stringify(value);
}

// One key per line, nested objects on the same line, as Paper shows it.
const JOB_POSTING_CODE = [
  "{",
  Object.entries(JOB_POSTING)
    .map(([key, item]) => `  ${JSON.stringify(key)}: ${inlineJson(item)}`)
    .join(",\n"),
  "}",
].join("\n");

// Post a Job values: the price label is display text the owner types (the
// docs use $99), and durationDays defaults to 30 in Site settings.
const EXAMPLE_PRICE_LABEL = "$99";
const DEFAULT_DURATION_DAYS = 30;

function Card({
  children,
  className,
  description,
  inverse = false,
  title,
}: {
  children: ReactNode;
  className?: string;
  description: string;
  inverse?: boolean;
  title: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 overflow-hidden px-4 py-6 md:px-7",
        inverse
          ? "marketing-inverse bg-foreground text-background dark:bg-card dark:text-foreground"
          : "bg-card dark:bg-background",
        className
      )}
    >
      <h3 className="text-[16px] leading-[22px] font-medium">{title}</h3>
      <p
        className={cn(
          "text-[13px] leading-[19px]",
          inverse
            ? "text-background/65 dark:text-muted-foreground"
            : "text-muted-foreground"
        )}
      >
        {description}
      </p>
      {children}
    </div>
  );
}

export function Bento() {
  return (
    <section
      aria-labelledby="marketing-bento-heading"
      className="border-line scroll-mt-14 border-b"
      id="features"
    >
      <Container className="border-line border-b pt-10 pb-8 md:pt-16 md:pb-10">
        <SectionHeader
          eyebrow="Features"
          id="marketing-bento-heading"
          title="Everything a board needs."
          titleMuted="Nothing it does not."
        />
      </Container>
      <div className="bg-line grid gap-px md:grid-cols-2">
        <Card
          className="h-[400px] md:h-[440px]"
          description="Visitors sign up for a daily or weekly email of new jobs."
          title="Visitors come back on their own"
        >
          <div className="absolute top-[100px] left-1/2 flex -translate-x-1/2 items-start gap-[30px]">
            <PhoneShot
              alt="The board home on a phone"
              className="w-[160px] md:w-[190px]"
              name="mobileHome"
            />
            <PhoneShot
              alt="A job page on a phone"
              className="mt-8 w-[160px] md:w-[190px]"
              name="mobileJob"
            />
          </div>
        </Card>
        <Card
          className="h-[360px] md:h-[440px]"
          description="Neutral by default, so every board looks like its owner."
          title="Your colors, not ours"
        >
          <Shot
            alt="The board in the light theme"
            className="absolute top-[110px] left-4 w-[480px] rounded-lg md:left-7 md:w-[560px]"
            name="boardLight"
          />
          <Shot
            alt="The board with a dark theme"
            className="absolute top-[200px] left-24 w-[480px] rounded-lg md:left-[140px] md:w-[560px]"
            name="boardDark"
          />
        </Card>
        <Card
          className="md:min-h-[300px]"
          description="JobPosting data, sitemaps and a clean URL per job."
          title="Found on Google from day one"
        >
          <pre className="bg-secondary ring-line text-muted-foreground mt-[35px] overflow-x-auto rounded-[10px] p-4 font-mono text-[12px] leading-[19px] whitespace-pre-wrap ring-1 ring-inset">
            <code>{JOB_POSTING_CODE}</code>
          </pre>
        </Card>
        <Card
          className="md:min-h-[300px]"
          description="Your Stripe payment link. Listings expire on their own."
          inverse
          title="Employers pay to post"
        >
          <div className="mt-[35px] flex flex-col">
            <dl className="flex gap-2.5">
              <div className="ring-background/10 dark:ring-line-strong flex flex-1 flex-col gap-1 rounded-[10px] p-3.5 ring-1 ring-inset">
                <dt className="text-background/65 dark:text-muted-foreground text-[12px] leading-4">
                  Price
                </dt>
                <dd className="text-[22px] leading-[26px] font-medium">
                  {EXAMPLE_PRICE_LABEL}
                </dd>
                <dd className="text-background/50 dark:text-subtle text-[11px] leading-[14px]">
                  Paid through Stripe
                </dd>
              </div>
              <div className="bg-background text-foreground dark:bg-foreground dark:text-background flex flex-1 flex-col gap-1 rounded-[10px] p-3.5">
                <dt className="text-muted-foreground dark:text-background/65 text-[12px] leading-4">
                  Listed for
                </dt>
                <dd className="text-[22px] leading-[26px] font-medium">
                  {DEFAULT_DURATION_DAYS} days
                </dd>
                <dd className="text-muted-foreground dark:text-background/65 text-[11px] leading-[14px]">
                  Then it expires
                </dd>
              </div>
            </dl>
            <p
              aria-hidden="true"
              className="bg-background text-foreground dark:bg-foreground dark:text-background mt-[18px] flex h-9 items-center justify-center rounded-lg text-[13px] leading-4 font-medium"
            >
              Continue to Stripe &#8599;
            </p>
            <p className="text-background/50 dark:text-subtle mt-3.5 font-mono text-[10px] leading-3">
              Example price. You set your own.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
