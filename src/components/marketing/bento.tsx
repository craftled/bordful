import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";
import { SectionHeader } from "./section-header";
import { PhoneShot, Shot } from "./shots";

// A trimmed JobPosting in the shape lib/seo/job-posting.ts emits for a remote
// job with a salary, cut to the keys (and salary bounds) that fit the card. The values are an
// example listing.
const JOB_POSTING_CODE = [
  "{",
  '  "@type": "JobPosting",',
  '  "title": "Senior Product Designer",',
  '  "hiringOrganization": { "name": "Example Co" },',
  '  "jobLocationType": "TELECOMMUTE",',
  '  "baseSalary": { "minValue": 150000, "maxValue": 190000 }',
  "}",
].join("\n");

// Post a Job values: the price label is display text the owner types (the
// docs use $99), and durationDays defaults to 30 in Site settings.
const EXAMPLE_PRICE_LABEL = "$99";
const DEFAULT_DURATION_DAYS = 30;

// The four cards' copy, shared by the phone list and the desktop bento.
const CARDS = {
  alerts: {
    description: "Visitors sign up for a daily or weekly email of new jobs.",
    title: "Visitors come back on their own",
  },
  brand: {
    description: "Neutral by default, so every board looks like its owner.",
    title: "Your colors, not ours",
  },
  paid: {
    description: "Your Stripe payment link. Listings expire on their own.",
    title: "Employers pay to post",
  },
  seo: {
    description: "JobPosting data, sitemaps and a clean URL per job.",
    title: "Found on Google from day one",
  },
} as const;

const PHONE_ORDER = ["alerts", "brand", "seo", "paid"] as const;

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
        "text-foreground relative flex flex-col gap-1 overflow-hidden px-4 py-6 md:px-7",
        inverse ? "marketing-dark bg-(--inverse-card)" : "bg-card",
        className
      )}
    >
      <h3 className="text-[16px] leading-[22px] font-medium">{title}</h3>
      <p className="text-muted-foreground text-[13px] leading-[19px]">
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
      <Container className="md:border-line pt-10 pb-5 md:border-b md:pt-16 md:pb-10">
        <SectionHeader
          eyebrow="Features"
          id="marketing-bento-heading"
          phone="mono"
          title="Everything a board needs."
          titleMuted="Nothing it does not."
        />
      </Container>
      {/* Paper's phone home keeps the copy and drops the pictures. */}
      <ul className="flex flex-col gap-5 px-4 pb-10 md:hidden">
        {PHONE_ORDER.map((key) => (
          <li
            className="bg-card ring-line flex flex-col gap-1.5 rounded-[14px] p-[18px] ring-1 ring-inset"
            key={key}
          >
            <h3 className="text-foreground text-[15px] leading-[18px] font-medium">
              {CARDS[key].title}
            </h3>
            <p className="text-muted-foreground text-[13px] leading-[19px]">
              {CARDS[key].description}
            </p>
          </li>
        ))}
      </ul>
      <div className="bg-line hidden gap-px md:grid md:grid-cols-2">
        <Card className="h-[440px]" {...CARDS.alerts}>
          <div className="absolute top-[100px] left-[70px] flex items-start gap-[30px]">
            <PhoneShot
              alt="The board home on a phone"
              className="w-[190px]"
              name="mobileHome"
            />
            <PhoneShot
              alt="A job page on a phone"
              className="mt-8 w-[190px]"
              name="mobileJob"
            />
          </div>
        </Card>
        <Card className="h-[440px]" {...CARDS.brand}>
          <Shot
            alt="The board in the light theme"
            className="absolute top-[110px] left-4 h-[273px] w-[480px] rounded-lg shadow-[0_0_0_1px_var(--line),0_16px_32px_-12px_rgb(0_0_0/20%)] md:left-7 md:h-[319px] md:w-[560px]"
            name="boardLight"
          />
          <Shot
            alt="The board with a dark theme"
            className="absolute top-[200px] left-24 h-[273px] w-[480px] rounded-lg shadow-[0_0_0_1px_rgb(255_255_255/6%),0_24px_48px_-12px_rgb(0_0_0/45%)] md:left-[140px] md:h-[319px] md:w-[560px]"
            name="boardDark"
          />
        </Card>
        <Card className="min-h-[300px]" {...CARDS.seo}>
          {/* Long lines wrap inside the card instead of running off its
              edge on narrower screens. */}
          <pre className="ring-line text-muted-foreground mt-[31px] rounded-[10px] bg-(--panel) p-4 font-mono text-[12px] leading-[19px] break-words whitespace-pre-wrap ring-1 ring-inset">
            <code>{JOB_POSTING_CODE}</code>
          </pre>
        </Card>
        <Card className="min-h-[300px]" inverse {...CARDS.paid}>
          <div className="mt-[31px] flex flex-col">
            <dl className="flex gap-2.5">
              <div className="flex flex-1 flex-col gap-1 rounded-[10px] p-3.5 ring-1 ring-(--kbd-on-outline) ring-inset">
                <dt className="text-muted-foreground text-[12px] leading-4">
                  Price
                </dt>
                <dd className="text-[22px] leading-[26px] font-medium">
                  {EXAMPLE_PRICE_LABEL}
                </dd>
                <dd className="text-subtle text-[11px] leading-[14px]">
                  Paid through Stripe
                </dd>
              </div>
              <div className="bg-primary text-primary-foreground flex flex-1 flex-col gap-1 rounded-[10px] p-3.5">
                <dt className="text-primary-foreground/65 text-[12px] leading-4">
                  Listed for
                </dt>
                <dd className="text-[22px] leading-[26px] font-medium">
                  {DEFAULT_DURATION_DAYS} days
                </dd>
                <dd className="text-primary-foreground/65 text-[11px] leading-[14px]">
                  Then it expires
                </dd>
              </div>
            </dl>
            <p
              aria-hidden="true"
              className="bg-primary text-primary-foreground mt-[18px] flex h-9 items-center justify-center rounded-lg text-[13px] leading-4 font-medium"
            >
              Continue to Stripe &#8599;
            </p>
            <p className="text-subtle mt-3.5 font-mono text-[10px] leading-3">
              Example price. You set your own.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
