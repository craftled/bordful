import type { Metadata } from "next";

import { Container } from "@/components/marketing/container";
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
    <Container className="md:px-10">
      <div className="mx-auto flex w-full max-w-[1072px] flex-col gap-8 pt-7 pb-[72px]">
        <p className="text-[13px] leading-4">
          <span className="text-subtle">Bordful / </span>
          <span className="text-foreground">About</span>
        </p>
        <h1 className="flex flex-col text-[30px] leading-[40px] font-medium tracking-[-0.035em] sm:text-[40px] sm:leading-[48px]">
          <span className="text-foreground">About</span>
          <span className="text-subtle">
            An open-source job board you can deploy, fill, and make your own.
          </span>
        </h1>
        <div className="text-muted-foreground max-w-2xl space-y-4 text-[14px] leading-[22px]">
          <p>
            Bordful is an open-source job board template. Deploy it and a board
            with real sample jobs from Bordfeed is live in about two minutes.
            From there you can connect your own Bordfeed feed, post jobs through
            a Stripe payment link, and send email alerts with Resend.
          </p>
          <p>
            The board also publishes RSS and JSON feeds, and each public job can
            carry JobPosting JSON-LD.
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
              Bordfeed powers the jobs: the sample set on a fresh board, and the
              feed you connect when you want ongoing listings.{" "}
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
      </div>
    </Container>
  );
}
