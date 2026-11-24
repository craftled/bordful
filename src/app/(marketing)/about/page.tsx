import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Container } from "@/components/marketing/container";
import {
  ABOUT_CONTENT,
  type LegalPart,
} from "@/components/marketing/legal-content";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { assertMarketingEnabled } from "@/config/marketing-guard";
import { markdownPathFor } from "@/lib/docs/agent-docs-paths";
import { agentPageDescription } from "@/lib/docs/agent-pages";

import { LegalParts } from "../_components/legal-parts";

const { cards, eyebrow, heading, paragraphs } = ABOUT_CONTENT;

export const metadata: Metadata = marketingPageMetadata({
  description: agentPageDescription("/about"),
  markdownPath: markdownPathFor("/about"),
  path: "/about",
  title: "About",
});

function AboutCard({ card }: { card: (typeof cards)[number] }) {
  return (
    <section
      className="bg-card ring-line flex flex-col gap-2 rounded-[14px] p-[22px] ring-1"
      key={card.title}
    >
      <h2 className="text-foreground text-[16px] leading-5 font-medium">
        {card.title}
      </h2>
      {card.title === "Elsewhere" ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] leading-[18px]">
          {card.links?.map((link) => (
            <li key={link.href}>
              <a
                className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                href={link.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-[14px] leading-[18px]">
          <LegalParts
            linkClassName="text-foreground underline-offset-4 hover:underline"
            parts={card.parts as readonly LegalPart[]}
          />
        </p>
      )}
    </section>
  );
}

export default function AboutPage() {
  assertMarketingEnabled();

  return (
    <>
      <Section className="md:py-14">
        <Container>
          <SectionHeader
            eyebrow={eyebrow}
            headingLevel="h1"
            title={heading[0]}
            titleMuted={heading[1]}
          />
        </Container>
      </Section>
      <Section className="md:py-14">
        <Container className="flex flex-col gap-8 md:px-10">
          <div className="text-muted-foreground max-w-2xl space-y-4 text-[14px] leading-[22px]">
            {paragraphs.map((paragraph) => (
              <p
                key={paragraph
                  .map((part) => (typeof part === "string" ? part : part.href))
                  .join("")}
              >
                <LegalParts parts={paragraph} />
              </p>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {cards.map(
              (card): ReactNode => (
                <AboutCard card={card} key={card.title} />
              )
            )}
          </div>
        </Container>
      </Section>
    </>
  );
}
