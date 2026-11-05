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
  description: "Please read these terms carefully before using Bordful.",
  path: "/terms",
  title: "Terms of Service",
});

const SECTIONS = [
  "Acceptance of Terms",
  "Use License",
  "Your Responsibilities",
  "Disclaimer",
  "Limitations",
  "Third-Party Services",
  "Revisions",
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
              Terms of Service
            </h1>
            <div className="space-y-1">
              <p className="text-muted-foreground text-[14px] leading-5">
                Please read these terms carefully before using Bordful.
              </p>
              <p className="text-subtle text-[14px] leading-5">
                Last updated: October 23, 2026
              </p>
            </div>
            <div className="flex flex-col gap-8">
              <Block index={1} title="Acceptance of Terms">
                <p>
                  By accessing and using Bordful, you agree to be bound by these
                  terms of service. If you disagree with any part of these
                  terms, you may not use our software.
                </p>
              </Block>
              <Block index={2} title="Use License">
                <p>
                  Bordful is open source software released under the MIT
                  License. You are free to:
                </p>
                <ul className="ml-4 space-y-2">
                  <Item>Modify and distribute the code</Item>
                  <Item>Use for commercial purposes</Item>
                  <Item>Sublicense and sell copies</Item>
                  <Item>Integrate with other software</Item>
                </ul>
                <p>
                  The only requirement is that the original copyright and
                  license notice must be included in all copies or substantial
                  portions of the software.
                </p>
              </Block>
              <Block index={3} title="Your Responsibilities">
                <p>When using Bordful, you are responsible for:</p>
                <ul className="ml-4 space-y-2">
                  <Item>Maintaining the security of your deployment</Item>
                  <Item>
                    Complying with data protection laws in your jurisdiction
                  </Item>
                  <Item>Managing your own job board content and user data</Item>
                  <Item>
                    Ensuring proper use of third-party services you connect,
                    including your host
                  </Item>
                </ul>
              </Block>
              <Block index={4} title="Disclaimer">
                <p>
                  Bordful is provided &quot;as is&quot;, without warranty of any
                  kind, express or implied. We do not warrant that the software
                  will be error-free, uninterrupted, secure, or meet your
                  specific requirements. In no event shall the authors be liable
                  for any claim, damages, or other liability arising from the
                  use of the software.
                </p>
              </Block>
              <Block index={5} title="Limitations">
                <p>You may not use Bordful:</p>
                <ul className="ml-4 space-y-2">
                  <Item>For any illegal purposes</Item>
                  <Item>To violate any laws in your jurisdiction</Item>
                  <Item>To infringe upon intellectual property rights</Item>
                  <Item>To transmit harmful code or malware</Item>
                </ul>
              </Block>
              <Block index={6} title="Third-Party Services">
                <p>
                  Bordful can connect to third-party services such as your host,
                  Bordfeed (jobs feed and Connect Bordfeed, if connected),
                  Resend (job alert emails, if enabled), and Stripe (Post a Job
                  payments, if enabled). Your use of these services is subject
                  to their respective terms of service and privacy policies. We
                  are not responsible for the practices or policies of these
                  third-party services.
                </p>
              </Block>
              <Block index={7} title="Revisions">
                <p>
                  We may revise these terms of service at any time without
                  notice. By using Bordful you agree to be bound by the current
                  version of these terms of service. We recommend checking this
                  page periodically for changes.
                </p>
              </Block>
              <Block index={8} title="Contact">
                <p>
                  If you have any questions about these terms, please contact us
                  at{" "}
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
