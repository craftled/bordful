import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Container } from "@/components/marketing/container";
import { DocsSectionNav } from "@/components/marketing/docs-section-nav";
import { MarketingSlimFooter } from "@/components/marketing/marketing-footer";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { assertMarketingEnabled } from "@/config/marketing-guard";

import {
  LegalBreadcrumb,
  LegalMobileBar,
} from "../_components/legal-mobile-bar";

export const metadata: Metadata = marketingPageMetadata({
  description: "How we handle your data and protect your privacy.",
  path: "/privacy",
  title: "Privacy Policy",
});

const SECTIONS = [
  "Introduction",
  "Data Collection",
  "Your Responsibilities",
  "Third-Party Services",
  "Security",
  "Updates",
  "Contact",
] as const;

function slugify(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/gu, "-");
}

const NAV_ITEMS = SECTIONS.map((label) => ({ id: slugify(label), label }));

function Block({
  children,
  index,
  title,
}: {
  children: ReactNode;
  index: number;
  title: string;
}) {
  return (
    <section
      aria-labelledby={`${slugify(title)}-heading`}
      className="scroll-mt-32 space-y-3 lg:scroll-mt-24"
      id={slugify(title)}
    >
      <h2
        className="text-foreground text-[17px] leading-[22px] font-medium md:text-xl md:leading-[26px] md:tracking-[-0.02em]"
        id={`${slugify(title)}-heading`}
      >
        {index}. {title}
      </h2>
      <div className="text-muted-foreground space-y-3 text-[14px] leading-[22px]">
        {children}
      </div>
    </section>
  );
}

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="text-subtle">•</span>
      <span>{children}</span>
    </li>
  );
}

export default function PrivacyPage() {
  assertMarketingEnabled();

  return (
    <>
      <LegalMobileBar current="privacy" sections={NAV_ITEMS} />
      <Container className="md:px-10">
        <div className="flex flex-col gap-12 pt-6 pb-[72px] lg:flex-row lg:gap-14 lg:pt-12">
          <div className="hidden shrink-0 lg:flex">
            <DocsSectionNav items={NAV_ITEMS} />
          </div>
          <div className="flex w-full max-w-[680px] flex-col gap-6 lg:gap-8">
            <LegalBreadcrumb label="Privacy" />
            <h1 className="text-foreground text-[30px] leading-9 font-medium tracking-[-0.03em] sm:text-[40px] sm:leading-[46px]">
              Privacy Policy
            </h1>
            <div className="space-y-1">
              <p className="text-muted-foreground text-[14px] leading-5">
                How we handle your data and protect your privacy.
              </p>
              <p className="text-subtle text-[14px] leading-5">
                Last updated: October 23, 2026
              </p>
            </div>
            <div className="flex flex-col gap-8">
              <Block index={1} title="Introduction">
                <p>
                  This privacy policy explains how Bordful collects, uses, and
                  protects any information when you use our open-source job
                  board software. We&apos;re committed to ensuring your privacy
                  is protected.
                </p>
              </Block>
              <Block index={2} title="Data Collection">
                <p>
                  As an open-source software, Bordful itself doesn&apos;t
                  collect any data. However, when you deploy your job board, you
                  may collect:
                </p>
                <ul className="ml-4 space-y-2">
                  <Item>Job listings stored in the database you deploy</Item>
                  <Item>
                    Email addresses of job alert subscribers (if enabled)
                  </Item>
                  <Item>Usage analytics (if you implement them)</Item>
                  <Item>User submitted information</Item>
                </ul>
              </Block>
              <Block index={3} title="Your Responsibilities">
                <p>When deploying Bordful, you are responsible for:</p>
                <ul className="ml-4 space-y-2">
                  <Item>Creating your own privacy policy</Item>
                  <Item>
                    Complying with data protection laws in your jurisdiction
                  </Item>
                  <Item>Securing user data in your database</Item>
                  <Item>Managing user consent and data rights</Item>
                </ul>
              </Block>
              <Block index={4} title="Third-Party Services">
                <p>
                  Bordful integrates with third-party services that may collect
                  data:
                </p>
                <ul className="ml-4 space-y-2">
                  <Item>Vercel: hosting</Item>
                  <Item>
                    Bordfeed: jobs feed and Connect Bordfeed (if connected)
                  </Item>
                  <Item>Resend: job alert emails (if enabled)</Item>
                  <Item>Stripe: Post a Job payments (if enabled)</Item>
                </ul>
                <p>
                  Please review their respective privacy policies to understand
                  how they handle data.
                </p>
              </Block>
              <Block index={5} title="Security">
                <p>
                  While we&apos;ve implemented security best practices in our
                  code, you are responsible for securing your deployment,
                  including:
                </p>
                <ul className="ml-4 space-y-2">
                  <Item>Keeping dependencies updated</Item>
                  <Item>Configuring proper access controls</Item>
                  <Item>Protecting API keys and credentials</Item>
                </ul>
              </Block>
              <Block index={6} title="Updates">
                <p>
                  We may update this privacy policy to reflect changes in our
                  software or legal requirements. We recommend checking this
                  page periodically for any changes.
                </p>
              </Block>
              <Block index={7} title="Contact">
                <p>
                  If you have any questions about this privacy policy, please
                  contact us at{" "}
                  <a
                    className="text-foreground underline underline-offset-4"
                    href="mailto:support@bordful.com"
                  >
                    support@bordful.com
                  </a>
                  .
                </p>
              </Block>
            </div>
          </div>
        </div>
      </Container>
      <MarketingSlimFooter />
    </>
  );
}
