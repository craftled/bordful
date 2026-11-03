import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Container } from "./container";
import { KBD_ON_PRIMARY, Kbd } from "./kbd";
import { DEPLOY_URL } from "./links";
import { Section } from "./section";
import { PhoneShot, ThemedBoardShot, ThemedImage } from "./shots";

const STACK_TAGS = ["MIT", "Next.js", "Payload", "Postgres"] as const;

export function Hero() {
  return (
    <>
      <Section padding="hero">
        <Container className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
          <div className="flex max-w-[720px] flex-col gap-5">
            <Link
              className="bg-card ring-line-strong inline-flex h-[21px] items-center gap-2 self-start rounded-full px-2.5 ring-1 ring-inset md:h-6 md:pr-[9px] md:pl-[3px]"
              href="/changelog"
            >
              <span className="bg-primary text-primary-foreground hidden rounded-full px-[7px] py-px text-[10px] leading-[14px] font-medium md:inline">
                1.0
              </span>
              {/* Paper's phone hero is a plain pill, without the chip or arrow. */}
              <span className="text-muted-foreground text-[12px] leading-4 font-medium md:hidden">
                New · Payload and Postgres
              </span>
              <span className="text-muted-foreground hidden text-[12px] leading-4 font-medium md:inline">
                Now on Payload and Postgres <span aria-hidden="true">→</span>
              </span>
            </Link>
            <h1 className="flex flex-col text-[34px] leading-[42px] font-medium tracking-[-0.035em] text-balance md:text-[52px] md:leading-[56px] md:tracking-[-0.04em]">
              <span className="text-foreground">The job board you own.</span>
              <span className="text-(--text-faint)"> Live in two minutes.</span>
            </h1>
            <p className="text-muted-foreground max-w-[520px] text-[16px] leading-6 md:leading-[25px]">
              An open-source template that deploys with real jobs already
              listed. Brand it, take paid posts and send alerts on your own
              domain.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-1.5">
              <Button
                asChild
                className="h-11 gap-[7px] px-3.5 text-[15px] sm:h-9 sm:text-[13px]"
              >
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
              <Button
                asChild
                className="h-11 px-3.5 text-[15px] shadow-xs sm:h-9 sm:text-[13px]"
                variant="outline"
              >
                <a data-testid="marketing-demo-link" href="/jobs">
                  <span>
                    Live demo <span aria-hidden="true">&#8599;</span>
                  </span>
                </a>
              </Button>
            </div>
          </div>
          {/* Paper's phone hero: the board's own phone list, at a size that
              reads, in place of the scaled-down desktop window. */}
          <a
            aria-label="Open the live demo board"
            className="bg-card block overflow-hidden rounded-2xl shadow-[0_0_0_1px_var(--shot-ring),0_1px_2px_rgb(0_0_0/4%),0_28px_56px_-20px_var(--shot-shadow)] md:hidden"
            href="/jobs"
          >
            <ThemedImage
              alt="The demo board's job list on a phone"
              className="block h-auto w-full"
              loading="eager"
              name="mobileListLight"
            />
          </a>
          <ul className="text-subtle hidden gap-3 font-mono text-[11px] leading-[14px] md:flex">
            {STACK_TAGS.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </Container>
      </Section>
      <div className="marketing-shot border-line relative hidden h-[560px] overflow-hidden border-b md:block">
        <div className="absolute top-10 left-10 w-[1120px] max-w-none overflow-hidden rounded-xl bg-(--window) shadow-[0_0_0_1px_var(--shot-ring),0_30px_60px_-24px_var(--shot-shadow)]">
          <div
            aria-hidden="true"
            className="relative flex h-[30px] items-center gap-1.5 px-3"
          >
            <span className="size-2 rounded-full bg-(--window-dot)" />
            <span className="size-2 rounded-full bg-(--window-dot)" />
            <span className="size-2 rounded-full bg-(--window-dot)" />
            <span className="bg-card ring-line absolute top-1.5 left-[450px] flex h-[18px] w-[220px] items-center justify-center rounded-[5px] ring-1 ring-inset dark:bg-white/6">
              <span className="text-subtle text-[10px] leading-3">
                jobs.yourbrand.com
              </span>
            </span>
          </div>
          <ThemedBoardShot
            alt="Bordful demo board"
            className="h-[638px] w-[1120px] rounded-none shadow-none"
          />
        </div>
        <PhoneShot
          alt="A job page on a phone"
          className="absolute top-[88px] left-[962px] hidden h-[448px] w-[220px] shadow-[0_30px_40px_rgb(0_0_0/28%)] lg:block dark:shadow-[0_30px_40px_rgb(0_0_0/50%)]"
          imageClassName="h-full object-cover object-top"
          name="mobileJob"
        />
      </div>
    </>
  );
}
