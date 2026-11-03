import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import {
  BORDFEED_ABOUT_URL,
  GITHUB_URL,
  SOCIAL_LINKS,
} from "@/components/marketing/site";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = {
  description:
    "Bordful is an open-source job board template built by Craftled. Bordfeed powers the jobs.",
  title: "About",
};

export default function AboutPage() {
  assertMarketingEnabled();

  return (
    <Section className="pt-24 md:pt-32">
      <Container>
        <div className="mx-auto max-w-2xl space-y-12">
          <SectionHeader
            description="An open-source job board you can deploy, fill, and make your own."
            headingLevel="h1"
            title="About"
          />
          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed">
            <p>
              Bordful is an open-source job board template. Deploy it and a
              board with real sample jobs from Bordfeed is live in about two
              minutes. From there you can connect your own Bordfeed feed, post
              jobs through a Stripe payment link, and send email alerts with
              Resend.
            </p>
            <p>
              The board also publishes RSS and JSON feeds, and each public job
              can carry JobPosting JSON-LD.
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="font-medium text-xl">Craftled</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Craftled builds Bordful. The code is released under the{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href="https://opensource.org/license/mit"
                rel="noopener noreferrer"
                target="_blank"
              >
                MIT license
              </a>
              . The repository is on{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={GITHUB_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub
              </a>
              .
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="font-medium text-xl">Bordfeed</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bordfeed powers the jobs: the sample set on a fresh board, and the
              feed you connect when you want ongoing listings.{" "}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={BORDFEED_ABOUT_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                Bordfeed
              </a>
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="font-medium text-xl">Elsewhere</h2>
            <ul className="flex flex-wrap gap-4 text-sm">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    href={link.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
