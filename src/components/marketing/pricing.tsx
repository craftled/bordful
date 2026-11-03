import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Container } from "./container";
import { Section } from "./section";
import { SectionHeader } from "./section-header";
import { BORDFEED_PRICING_URL, GITHUB_URL } from "./site";

interface Plan {
  cta: string;
  description: string;
  external: boolean;
  features: readonly string[];
  highlight?: boolean;
  href: string;
  name: string;
  price: string;
  unit?: string;
}

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
    href: "https://buy.stripe.com/bIY5mJdyAdYc1pKdRe",
    name: "Custom Setup",
    price: "$499",
    unit: "once",
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
        {plan.unit ? (
          <span className="text-subtle text-[13px] leading-[18px]">
            {plan.unit}
          </span>
        ) : null}
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

function PricingNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-subtle text-[11px] leading-4", className)}>
      Payments are processed and secured by Stripe. Price in USD. VAT may apply.
      Bordfeed has its own plans.{" "}
      <a
        className="hover:text-foreground rounded-sm underline underline-offset-4"
        href={BORDFEED_PRICING_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        See Bordfeed pricing
      </a>
      .
    </p>
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
              plan.highlight ? "ring-foreground ring-1" : "ring-line ring-1"
            )}
            key={plan.name}
          >
            <PlanBody plan={plan} primary={Boolean(plan.highlight)} />
          </div>
        ))}
      </div>
      <PricingNote className="text-center" />
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
          description="Need help getting started? We offer custom setup services for a one-time fee."
          eyebrow="Pricing"
          title="Simple pricing."
          titleMuted="Free to use commercially."
        />
      </Container>
      <div className="grid md:grid-cols-2">
        {plans.map((plan, index) => (
          <div
            className={cn(
              "border-line flex flex-col gap-3.5 px-4 py-8 md:gap-4 md:px-10 md:py-9",
              index === 0
                ? "bg-card border-b md:border-r md:border-b-0"
                : undefined
            )}
            key={plan.name}
          >
            <PlanBody plan={plan} primary={index === 0} />
          </div>
        ))}
      </div>
      <Container className="border-line border-t py-3.5">
        <PricingNote />
      </Container>
    </Section>
  );
}
