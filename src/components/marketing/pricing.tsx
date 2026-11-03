import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Container } from "./container";
import { KBD_ON_PRIMARY, Kbd } from "./kbd";
import { DEPLOY_URL } from "./links";
import { Section } from "./section";
import { SectionHeader } from "./section-header";
import { GITHUB_URL } from "./site";

// The home section shows a shorter card: Paper's own lines, three features
// and the deploy button on the free plan.
interface HomePlan {
  badge?: string;
  cta: string;
  description: string;
  features: readonly string[];
  href: string;
  unit: string;
}

interface Plan {
  cta: string;
  description: string;
  external: boolean;
  features: readonly string[];
  highlight?: boolean;
  home: HomePlan;
  href: string;
  name: string;
  price: string;
}

const SETUP_URL = "https://buy.stripe.com/bIY5mJdyAdYc1pKdRe";

const plans: readonly Plan[] = [
  {
    cta: "Clone now",
    description: "For developers and hobbyists",
    external: true,
    features: [
      "Next.js codebase",
      "Full job board features",
      "Self-hosted solution",
      "MIT license",
      "Community support",
    ],
    home: {
      badge: "Start here",
      cta: "Deploy to Vercel",
      description:
        "For developers and hobbyists. Self-host on your own accounts.",
      features: ["Full job board features", "MIT license", "Community support"],
      href: DEPLOY_URL,
      unit: "forever",
    },
    href: GITHUB_URL,
    name: "Open Source",
    price: "Free",
  },
  {
    cta: "Order setup",
    description: "Let us handle everything for you",
    external: true,
    features: [
      "Full installation service",
      "Custom domain setup",
      "One-time payment",
      "1-hour consultation",
      "Community support",
    ],
    highlight: true,
    home: {
      cta: "Order setup",
      description:
        "We install it, set your domain and walk you through it. Pay once.",
      features: [
        "Full installation",
        "Custom domain setup",
        "1-hour consultation",
      ],
      href: SETUP_URL,
      unit: "once",
    },
    href: SETUP_URL,
    name: "Custom Setup",
    price: "$499",
  },
];

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="text-foreground size-3.5 shrink-0"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3.5 8.5l3 3 6-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      />
    </svg>
  );
}

function PlanBody({ plan, primary }: { plan: Plan; primary: boolean }) {
  return (
    <>
      <h3 className="text-foreground text-[15px] leading-[22px] font-medium">
        {plan.name}
      </h3>
      <p className="flex items-baseline gap-1.5">
        <span className="text-foreground text-[40px] leading-[46px] font-medium tracking-[-0.03em]">
          {plan.price}
        </span>
      </p>
      <p className="text-muted-foreground text-[13px] leading-[19px]">
        {plan.description}
      </p>
      <ul className="flex flex-col gap-2 py-1 md:py-3">
        {plan.features.map((feature) => (
          <li
            className="text-muted-foreground flex items-center gap-2 text-[13px] leading-[19px]"
            key={feature}
          >
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        asChild
        className={cn(
          "h-11 w-full px-4 text-[14px] md:h-9 md:w-auto md:self-start md:text-[13px]",
          !primary && "shadow-xs"
        )}
        variant={primary ? "default" : "outline"}
      >
        <a
          href={plan.href}
          rel={plan.external ? "noopener noreferrer" : undefined}
          target={plan.external ? "_blank" : undefined}
        >
          {plan.cta}
        </a>
      </Button>
    </>
  );
}

function HomePlanBody({ plan, primary }: { plan: Plan; primary: boolean }) {
  const { home } = plan;

  return (
    <>
      <div className="flex h-5 items-center justify-between">
        <h3 className="text-foreground text-[15px] leading-5 font-medium">
          {plan.name}
        </h3>
        {home.badge ? (
          <span className="bg-primary text-primary-foreground flex h-5 items-center rounded-md px-[7px] text-[11px] leading-[14px] font-medium">
            {home.badge}
          </span>
        ) : null}
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-foreground text-[40px] leading-[44px] font-medium tracking-[-0.035em]">
          {plan.price}
        </span>
        <span className="text-subtle text-[13px] leading-[18px]">
          {home.unit}
        </span>
      </p>
      <p className="text-muted-foreground text-[13px] leading-5">
        {home.description}
      </p>
      <ul className="flex flex-col gap-0.5">
        {home.features.map((feature) => (
          <li
            className="text-muted-foreground flex gap-2 text-[13px] leading-5"
            key={feature}
          >
            <span aria-hidden="true" className="text-subtle">
              ✓
            </span>
            {feature}
          </li>
        ))}
      </ul>
      <Button
        asChild
        className={cn(
          "h-11 w-full gap-[7px] px-3.5 text-[15px] md:h-[34px] md:w-auto md:self-start md:text-[13px]",
          !primary && "shadow-xs"
        )}
        variant={primary ? "default" : "outline"}
      >
        <a href={home.href} rel="noopener noreferrer" target="_blank">
          {home.cta}
          {primary ? <Kbd className={KBD_ON_PRIMARY}>D</Kbd> : null}
        </a>
      </Button>
    </>
  );
}

// Standalone pricing page: two cards side by side, the paid plan outlined.
function PricingCards() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid w-full max-w-[856px] gap-3 md:grid-cols-2 md:gap-4">
        {plans.map((plan) => (
          <div
            className={cn(
              "bg-card flex flex-col gap-3.5 rounded-[14px] p-[22px] md:gap-2.5 md:rounded-xl md:p-7",
              plan.highlight
                ? "ring-foreground ring-1"
                : "ring-1 ring-(--shot-ring)"
            )}
            key={plan.name}
          >
            <PlanBody plan={plan} primary={Boolean(plan.highlight)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Pricing({
  variant = "section",
}: {
  variant?: "section" | "standalone";
}) {
  if (variant === "standalone") {
    return <PricingCards />;
  }

  // Home section: two flush cells, the free plan on the raised surface.
  return (
    <Section id="pricing" padding="flush">
      <Container className="border-line border-b pt-10 pb-8 md:pt-16 md:pb-10">
        <SectionHeader
          eyebrow="Pricing"
          title="Free to run."
          titleMuted="Help if you want it."
        />
      </Container>
      <div className="grid md:grid-cols-2">
        {plans.map((plan, index) => (
          <div
            className={cn(
              "border-line flex flex-col gap-4 px-4 py-8 md:px-10 md:py-9",
              index === 0
                ? "bg-card border-b md:border-r md:border-b-0"
                : undefined
            )}
            key={plan.name}
          >
            <HomePlanBody plan={plan} primary={index === 0} />
          </div>
        ))}
      </div>
      <Container className="border-line border-t py-3.5">
        <p className="text-subtle text-[11px] leading-[14px]">
          Payments by Stripe. Prices in USD, VAT may apply. Bordfeed has its own
          plans.
        </p>
      </Container>
    </Section>
  );
}
