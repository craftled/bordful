import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { Container } from "./container";
import { Section } from "./section";

export interface MarketingCtaAction {
  external?: boolean;
  href: string;
  label: string;
}

// Paper's closing band on the inner marketing pages: a centered two-tone
// heading, one line of copy, and a primary plus an optional outline button.
export function MarketingCta({
  actions,
  description,
  headingLevel = "h2",
  title,
  titleMuted,
}: {
  actions: readonly MarketingCtaAction[];
  description: ReactNode;
  headingLevel?: "h2" | "h3";
  title: string;
  titleMuted?: string;
}) {
  const Heading = headingLevel;

  return (
    <Section className="md:py-20" variant="secondary">
      <Container className="flex flex-col items-center gap-5 text-center md:gap-[22px]">
        <Heading className="flex flex-col text-[28px] leading-[34px] font-medium tracking-[-0.035em] text-balance md:text-[34px] md:leading-10">
          <span className="text-foreground">{title}</span>
          {titleMuted ? (
            <span className="text-subtle"> {titleMuted}</span>
          ) : null}
        </Heading>
        <p className="text-muted-foreground max-w-[520px] text-[15px] leading-[23px]">
          {description}
        </p>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {actions.map((action, index) => (
            <Button
              asChild
              className="h-11 px-4 text-[15px] leading-[18px] sm:h-9 sm:text-[13px] sm:leading-[1.5]"
              key={action.href}
              variant={index === 0 ? "default" : "outline"}
            >
              {action.external ? (
                <a href={action.href} rel="noopener noreferrer" target="_blank">
                  {action.label}
                </a>
              ) : (
                <Link href={action.href}>{action.label}</Link>
              )}
            </Button>
          ))}
        </div>
      </Container>
    </Section>
  );
}
