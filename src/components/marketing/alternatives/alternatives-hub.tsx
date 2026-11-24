import Link from "next/link";

import { Container } from "@/components/marketing/container";
import { CUSTOM_SETUP_URL, DEPLOY_URL } from "@/components/marketing/links";
import { MarketingCta } from "@/components/marketing/marketing-cta";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { Button } from "@/components/ui/button";

import { Breadcrumb } from "./breadcrumb";
import {
  ALTERNATIVES,
  ALTERNATIVES_HUB,
  ALTERNATIVES_HUB_CTA,
  formatCheckedOn,
} from "./registry";

export function AlternativesHub() {
  return (
    <>
      <Breadcrumb
        items={[{ href: "/", label: "Home" }, { label: "Alternatives" }]}
      />
      <Section className="md:py-14">
        <Container className="flex flex-col gap-5 md:items-center md:gap-[18px] md:text-center">
          <SectionHeader
            description={ALTERNATIVES_HUB.intro}
            eyebrow="Alternatives"
            headingLevel="h1"
            title={ALTERNATIVES_HUB.heading.title}
            titleMuted={ALTERNATIVES_HUB.heading.titleMuted}
          />
        </Container>
      </Section>
      <Section>
        <Container className="grid gap-4 md:grid-cols-2">
          {ALTERNATIVES.map((page) => (
            <article
              className="bg-card border-line flex flex-col items-start gap-4 rounded-xl border p-5 md:p-6"
              key={page.slug}
            >
              <h2 className="text-foreground text-[20px] leading-7 font-medium tracking-[-0.02em]">
                {page.name}
              </h2>
              <p className="text-muted-foreground text-[14px] leading-[21px]">
                {page.hub.summary.text}
              </p>
              {page.sources
                .filter((source) => source.id === page.hub.summary.sources[0])
                .map((source) => (
                  <p
                    className="text-subtle text-[12px] leading-[18px]"
                    key={source.id}
                  >
                    Source:{" "}
                    <a
                      className="hover:text-foreground underline underline-offset-2"
                      href={source.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {source.title}
                    </a>
                    , checked {formatCheckedOn(source.checkedOn)}.
                  </p>
                ))}
              <Button
                asChild
                className="h-10 px-3.5 text-[14px]"
                variant="outline"
              >
                <Link href={`/alternatives/${page.slug}`}>
                  {page.hub.linkLabel}
                </Link>
              </Button>
            </article>
          ))}
        </Container>
      </Section>
      <MarketingCta
        actions={[
          { external: true, href: DEPLOY_URL, label: "Deploy to Vercel" },
          {
            external: true,
            href: CUSTOM_SETUP_URL,
            label: "Custom Setup, $999 once",
          },
        ]}
        description={ALTERNATIVES_HUB_CTA.description}
        title={ALTERNATIVES_HUB_CTA.title}
        titleMuted={ALTERNATIVES_HUB_CTA.titleMuted}
      />
      <MarketingSlimFooter />
    </>
  );
}
