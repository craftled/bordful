import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Container } from "@/components/marketing/container";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description: "Please read these terms carefully before using Bordful.",
  title: "Terms of Service",
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

export default function TermsPage() {
  assertMarketingEnabled();

  return (
    <Section className="pt-24 md:pt-32">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <SectionHeader
              description="Please read these terms carefully before using Bordful."
              headingLevel="h1"
              title="Terms of Service"
            />
            <p className="mt-2 text-muted-foreground text-sm">
              Last updated: October 23, 2026
            </p>
          </div>
          <div className="mt-16 space-y-10">
            <Block title="1. Acceptance of Terms">
              <p>
                By accessing and using Bordful, you agree to be bound by these
                terms of service. If you disagree with any part of these terms,
                you may not use our software.
              </p>
            </Block>
            <Block title="2. Use License">
              <p>
                Bordful is open source software released under the MIT License.
                You are free to:
              </p>
              <ul className="ml-4 space-y-2">
                <Item>Modify and distribute the code</Item>
                <Item>Use for commercial purposes</Item>
                <Item>Sublicense and sell copies</Item>
                <Item>Integrate with other software</Item>
              </ul>
              <p>
                The only requirement is that the original copyright and license
                notice must be included in all copies or substantial portions of
                the software.
              </p>
            </Block>
            <Block title="3. Your Responsibilities">
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
            <Block title="4. Disclaimer">
              <p>
                Bordful is provided &quot;as is&quot;, without warranty of any
                kind, express or implied. We do not warrant that the software
                will be error-free, uninterrupted, secure, or meet your specific
                requirements. In no event shall the authors be liable for any
                claim, damages, or other liability arising from the use of the
                software.
              </p>
            </Block>
            <Block title="5. Limitations">
              <p>You may not use Bordful:</p>
              <ul className="ml-4 space-y-2">
                <Item>For any illegal purposes</Item>
                <Item>To violate any laws in your jurisdiction</Item>
                <Item>To infringe upon intellectual property rights</Item>
                <Item>To transmit harmful code or malware</Item>
              </ul>
            </Block>
            <Block title="6. Third-Party Services">
              <p>
                Bordful can connect to third-party services such as your host,
                Bordfeed (jobs feed and Connect Bordfeed, if connected), Resend
                (job alert emails, if enabled), and Stripe (Post a Job payments,
                if enabled). Your use of these services is subject to their
                respective terms of service and privacy policies. We are not
                responsible for the practices or policies of these third-party
                services.
              </p>
            </Block>
            <Block title="7. Revisions">
              <p>
                We may revise these terms of service at any time without notice.
                By using Bordful you agree to be bound by the current version of
                these terms of service. We recommend checking this page
                periodically for changes.
              </p>
            </Block>
            <Block title="8. Contact">
              <p>
                If you have any questions about these terms, please contact us
                at{" "}
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
