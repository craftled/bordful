import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Container } from "@/components/marketing/container";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description: "How we handle your data and protect your privacy.",
  title: "Privacy Policy",
};

function Block({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-4">
      <h2 className="font-medium text-xl">{title}</h2>
      <div className="space-y-3 text-muted-foreground text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function Item({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-primary">•</span>
      <span>{children}</span>
    </li>
  );
}

export default function PrivacyPage() {
  assertMarketingEnabled();

  return (
    <Section className="pt-24 md:pt-32">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <SectionHeader
              description="How we handle your data and protect your privacy."
              headingLevel="h1"
              title="Privacy Policy"
            />
            <p className="mt-2 text-muted-foreground text-sm">
              Last updated: October 23, 2026
            </p>
          </div>
          <div className="mt-16 space-y-10">
            <Block title="1. Introduction">
              <p>
                This privacy policy explains how Bordful collects, uses, and
                protects any information when you use our open-source job board
                software. We&apos;re committed to ensuring your privacy is
                protected.
              </p>
            </Block>
            <Block title="2. Data Collection">
              <p>
                As an open-source software, Bordful itself doesn&apos;t collect
                any data. However, when you deploy your job board, you may
                collect:
              </p>
              <ul className="ml-4 space-y-2">
                <Item>
                  Job listings and applications stored in the database you
                  deploy
                </Item>
                <Item>Usage analytics (if you implement them)</Item>
                <Item>User submitted information</Item>
              </ul>
            </Block>
            <Block title="3. Your Responsibilities">
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
            <Block title="4. Third-Party Services">
              <p>
                Bordful integrates with third-party services that may collect
                data:
              </p>
              <ul className="ml-4 space-y-2">
                <Item>Vercel: hosting</Item>
              </ul>
              <p>
                Please review their respective privacy policies to understand
                how they handle data.
              </p>
            </Block>
            <Block title="5. Security">
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
            <Block title="6. Updates">
              <p>
                We may update this privacy policy to reflect changes in our
                software or legal requirements. We recommend checking this page
                periodically for any changes.
              </p>
            </Block>
            <Block title="7. Contact">
              <p>
                If you have any questions about this privacy policy, please
                contact us at{" "}
                <a
                  className="text-primary hover:underline"
                  href="mailto:support@bordful.com"
                >
                  support@bordful.com
                </a>
                .
              </p>
            </Block>
          </div>
        </div>
      </Container>
    </Section>
  );
}
