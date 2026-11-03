import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Container } from "./container";
import { KBD_ON_PRIMARY, Kbd } from "./kbd";
import { DEPLOY_URL } from "./links";
import { MarketingImage } from "./marketing-image";
import { Section } from "./section";

const STACK_TAGS = ["MIT", "Next.js", "Payload", "Postgres"] as const;

export function Hero() {
  return (
    <>
      <Section padding="hero">
        <Container className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-[720px] flex-col gap-5">
            <Link
              className="bg-card ring-line-strong inline-flex h-6 items-center gap-2 self-start rounded-full pr-[9px] pl-[3px] ring-1 ring-inset"
              href="/changelog"
            >
              <span className="bg-primary text-primary-foreground rounded-full px-[7px] py-px text-[10px] leading-[14px] font-medium">
                1.0
              </span>
              <span className="text-muted-foreground text-[12px] leading-4 font-medium">
                Now on Payload and Postgres{" "}
                <span aria-hidden="true">&rarr;</span>
              </span>
            </Link>
            <h1 className="flex flex-col text-[36px] leading-[42px] font-medium tracking-[-0.04em] text-balance md:text-[52px] md:leading-[56px]">
              <span className="text-foreground">The job board you own.</span>
              <span className="text-subtle"> Live in two minutes.</span>
            </h1>
            <p className="text-muted-foreground max-w-[520px] text-[16px] leading-[25px]">
              An open-source template that deploys with real jobs already
              listed. Brand it, take paid posts and send alerts on your own
              domain.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Button asChild className="gap-[7px] px-3.5">
                <a
                  data-testid="marketing-deploy-button"
                  href={DEPLOY_URL}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Deploy to Vercel
                  <Kbd className={KBD_ON_PRIMARY}>D</Kbd>
                </a>
              </Button>
              <Button asChild className="px-3.5 shadow-xs" variant="outline">
                <a data-testid="marketing-demo-link" href="/jobs">
                  Live demo <span aria-hidden="true">&#8599;</span>
                </a>
              </Button>
            </div>
          </div>
          <ul className="text-subtle flex gap-3 font-mono text-[11px] leading-[14px]">
            {STACK_TAGS.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </Container>
      </Section>
      <div className="marketing-shot border-line h-[240px] overflow-hidden border-b px-4 pt-6 sm:h-[400px] md:h-[560px] md:px-10 md:pt-10">
        <MarketingImage
          alt="Bordful demo board"
          className="bg-card ring-line-strong w-full rounded-lg shadow-sm ring-1"
          height={1692}
          src="/marketing/bordful-demo.png"
          width={2880}
        />
      </div>
    </>
  );
}
