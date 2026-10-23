import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { Container } from "./container";
import { Section } from "./section";
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
}

const plans: readonly Plan[] = [
  {
    cta: "Clone Now",
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
    cta: "Order Setup",
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
  },
];

function PricingCards() {
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <Card
            className={cn(
              "gap-4 rounded-lg bg-background/50 py-6 shadow-none",
              plan.highlight && "border-foreground"
            )}
            key={plan.name}
          >
            <CardHeader className="px-6">
              <h3 className="font-medium text-lg leading-none">{plan.name}</h3>
              <p className="text-muted-foreground text-sm">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent className="px-6">
              <div className="font-medium text-3xl">{plan.price}</div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    className="flex text-muted-foreground text-sm"
                    key={feature}
                  >
                    <svg
                      aria-hidden="true"
                      className="mr-2 h-5 w-5 text-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="px-6">
              <Button
                asChild
                className="h-10 w-full rounded-full"
                variant={plan.highlight ? "default" : "outline"}
              >
                <a
                  href={plan.href}
                  rel={plan.external ? "noopener noreferrer" : undefined}
                  target={plan.external ? "_blank" : undefined}
                >
                  {plan.cta}
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="mt-8 text-center text-muted-foreground text-xs">
        <p>Payments are processed & secured by Stripe.</p>
        <p className="mt-1">Price in USD. VAT may apply.</p>
        <p className="mt-3">
          Bordfeed has its own plans.{" "}
          <a
            className="underline-offset-4 hover:underline"
            href={BORDFEED_PRICING_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            See Bordfeed pricing
          </a>
          .
        </p>
      </div>
    </>
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

  return (
    <Section id="pricing" variant="secondary">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h2 className="font-medium text-2xl tracking-tight sm:text-3xl">
              Pricing
            </h2>
            <p className="mx-auto mt-3 max-w-[600px] text-balance text-muted-foreground text-sm">
              Bordful is open source and free to use commercially. Need help
              getting started? We offer custom setup services for a one-time
              fee.
            </p>
          </div>
          <div className="mt-8">
            <PricingCards />
          </div>
        </div>
      </Container>
    </Section>
  );
}
