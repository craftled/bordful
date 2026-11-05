import type { Metadata } from "next";
import { Container } from "@/components/marketing/container";
import { marketingPageMetadata } from "@/components/marketing/metadata";
import { Section } from "@/components/marketing/section";
import { SectionHeader } from "@/components/marketing/section-header";
import {
  BORDFEED_ABOUT_URL,
  GITHUB_URL,
  SOCIAL_LINKS,
} from "@/components/marketing/site";
import { assertMarketingEnabled } from "@/config/marketing-guard";

export const metadata: Metadata = marketingPageMetadata({
  description:
    "Bordful is an open-source job board template built by Craftled. Bordfeed powers the jobs.",
  path: "/about",
  title: "About",
});

export default function AboutPage() {
  assertMarketingEnabled();

  return (
    <>
      <Section className="md:py-14">
        <Container>
          <SectionHeader
            eyebrow="About"
            headingLevel="h1"
            title="An open-source job board"
            titleMuted="you can deploy, fill, and make your own."
          />
        </Container>
      </Section>
      <Section className="md:py-14">
        <Container className="flex flex-col gap-8 md:px-10">
          <div className="text-muted-foreground max-w-2xl space-y-4 text-[14px] leading-[22px]">
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
          <div className="grid gap-4 md:grid-cols-3">
            <section className="bg-card ring-line flex flex-col gap-2 rounded-[14px] p-[22px] ring-1">
              <h2 className="text-foreground text-[16px] leading-5 font-medium">
                Craftled
              </h2>
              <p className="text-muted-foreground text-[14px] leading-[18px]">
                Craftled builds Bordful. The code is released under the{" "}
                <a
                  className="text-foreground underline-offset-4 hover:underline"
                  href="https://opensource.org/license/mit"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  MIT license
                </a>
                . The repository is on{" "}
                <a
                  className="text-foreground underline-offset-4 hover:underline"
                  href={GITHUB_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  GitHub
                </a>
                .
              </p>
            </section>
            <section className="bg-card ring-line flex flex-col gap-2 rounded-[14px] p-[22px] ring-1">
              <h2 className="text-foreground text-[16px] leading-5 font-medium">
                Bordfeed
              </h2>
              <p className="text-muted-foreground text-[14px] leading-[18px]">
                Bordfeed powers the jobs: the sample set on a fresh board, and
                the feed you connect when you want ongoing listings.{" "}
                <a
                  className="text-foreground underline-offset-4 hover:underline"
                  href={BORDFEED_ABOUT_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Bordfeed
                </a>
              </p>
            </section>
            <section className="bg-card ring-line flex flex-col gap-2 rounded-[14px] p-[22px] ring-1">
              <h2 className="text-foreground text-[16px] leading-5 font-medium">
                Elsewhere
              </h2>
              <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] leading-[18px]">
                {SOCIAL_LINKS.map((link) => (
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
            </section>
          </div>
        </Container>
      </Section>
    </>
  );
}
