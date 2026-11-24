import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { DocsSectionNav } from "@/components/marketing/docs-section-nav";
import { TERMS_CONTENT } from "@/components/marketing/legal-content";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { assertMarketingEnabled } from "@/config/marketing-guard";

import {
  LegalBreadcrumb,
  LegalMobileBar,
} from "../_components/legal-mobile-bar";
import { LegalParts } from "../_components/legal-parts";

const { blocks, heading, lastUpdated, lede } = TERMS_CONTENT;

export const metadata: Metadata = marketingPageMetadata({
  description: lede,
  path: "/terms",
  title: heading,
});

function slugify(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/gu, "-");
}

const NAV_ITEMS = blocks.map((block) => ({
  id: slugify(block.title),
  label: block.title,
}));

export default function TermsPage() {
  assertMarketingEnabled();

  return (
    <>
      <LegalMobileBar current="terms" sections={NAV_ITEMS} />
      <Container className="md:px-10">
        <div className="flex flex-col gap-12 pt-6 pb-[72px] lg:flex-row lg:gap-14 lg:pt-12">
          <div className="hidden shrink-0 lg:flex">
            <DocsSectionNav items={NAV_ITEMS} />
          </div>
          <div className="flex w-full max-w-[680px] flex-col gap-6 lg:gap-8">
            <LegalBreadcrumb label="Terms" />
            <h1 className="text-foreground text-[30px] leading-9 font-medium tracking-[-0.03em] sm:text-[40px] sm:leading-[46px]">
              {heading}
            </h1>
            <div className="space-y-1">
              <p className="text-muted-foreground text-[14px] leading-5">
                {lede}
              </p>
              <p className="text-subtle text-[14px] leading-5">
                Last updated: {lastUpdated}
              </p>
            </div>
            <div className="flex flex-col gap-8">
              {blocks.map((block, index) => (
                <section
                  aria-labelledby={`${slugify(block.title)}-heading`}
                  className="scroll-mt-32 space-y-3 lg:scroll-mt-24"
                  id={slugify(block.title)}
                  key={block.title}
                >
                  <h2
                    className="text-foreground text-[17px] leading-[22px] font-medium md:text-xl md:leading-[26px] md:tracking-[-0.02em]"
                    id={`${slugify(block.title)}-heading`}
                  >
                    {index + 1}. {block.title}
                  </h2>
                  <div className="text-muted-foreground space-y-3 text-[14px] leading-[22px]">
                    {block.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph
                          .map((part) =>
                            typeof part === "string" ? part : part.href
                          )
                          .join("")}
                      >
                        <LegalParts
                          linkClassName="text-foreground underline underline-offset-4"
                          parts={paragraph}
                        />
                      </p>
                    ))}
                    {block.bullets ? (
                      <ul className="ml-4 space-y-2">
                        {block.bullets.map((bullet) => (
                          <li
                            className="flex gap-2.5"
                            key={bullet
                              .map((part) =>
                                typeof part === "string" ? part : part.href
                              )
                              .join("")}
                          >
                            <span className="text-subtle">•</span>
                            <span>
                              <LegalParts
                                linkClassName="text-foreground underline underline-offset-4"
                                parts={bullet}
                              />
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </Container>
      <MarketingSlimFooter />
    </>
  );
}
