import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";
import {
  HOME_BENTO,
  HOME_BENTO_EXAMPLE,
  HOME_JOB_POSTING_CODE,
} from "./home-content";
import { SectionHeader } from "./section-header";
import { PhoneShot, Shot } from "./shots";

const CARDS = HOME_BENTO.cards;
const PHONE_ORDER = HOME_BENTO.phoneOrder;
const JOB_POSTING_CODE = HOME_JOB_POSTING_CODE;
const EXAMPLE = HOME_BENTO_EXAMPLE;

function Card({
  children,
  className,
  description,
  inverse = false,
  title,
}: {
  children: ReactNode;
  className?: string;
  description: string;
  inverse?: boolean;
  title: string;
}) {
  return (
    <div
      className={cn(
        "text-foreground relative flex flex-col gap-1 overflow-hidden px-4 py-6 md:px-7",
        inverse ? "marketing-dark bg-(--inverse-card)" : "bg-card",
        className
      )}
    >
      <h3 className="text-[16px] leading-[22px] font-medium">{title}</h3>
      <p className="text-muted-foreground text-[13px] leading-[19px]">
        {description}
      </p>
      {children}
    </div>
  );
}

export function Bento() {
  return (
    <section
      aria-labelledby="marketing-bento-heading"
      className="border-line scroll-mt-14 border-b"
      id="features"
    >
      <Container className="md:border-line pt-10 pb-5 md:border-b md:pt-16 md:pb-10">
        <SectionHeader
          eyebrow={HOME_BENTO.eyebrow}
          id="marketing-bento-heading"
          phone="mono"
          title={HOME_BENTO.heading[0]}
          titleMuted={HOME_BENTO.heading[1]}
        />
      </Container>
      {/* Paper's phone home keeps the copy and drops the pictures. */}
      <ul className="flex flex-col gap-5 px-4 pb-10 md:hidden">
        {PHONE_ORDER.map((key) => (
          <li
            className="bg-card ring-line flex flex-col gap-1.5 rounded-[14px] p-[18px] ring-1 ring-inset"
            key={key}
          >
            <h3 className="text-foreground text-[15px] leading-[18px] font-medium">
              {CARDS[key].title}
            </h3>
            <p className="text-muted-foreground text-[13px] leading-[19px]">
              {CARDS[key].description}
            </p>
          </li>
        ))}
      </ul>
      <div className="bg-line hidden gap-px md:grid md:grid-cols-2">
        <Card className="h-[440px]" {...CARDS.alerts}>
          <div className="absolute top-[100px] left-[70px] flex items-start gap-[30px]">
            <PhoneShot
              alt="The board home on a phone"
              className="w-[190px]"
              name="mobileHome"
            />
            <PhoneShot
              alt="A job page on a phone"
              className="mt-8 w-[190px]"
              name="mobileJob"
            />
          </div>
        </Card>
        <Card className="h-[440px]" {...CARDS.brand}>
          <Shot
            alt="The board in the light theme"
            className="absolute top-[110px] left-4 h-[273px] w-[480px] rounded-lg shadow-[0_0_0_1px_var(--line),0_16px_32px_-12px_rgb(0_0_0/20%)] md:left-7 md:h-[319px] md:w-[560px]"
            name="boardLight"
          />
          <Shot
            alt="The board with a dark theme"
            className="absolute top-[200px] left-24 h-[273px] w-[480px] rounded-lg shadow-[0_0_0_1px_rgb(255_255_255/6%),0_24px_48px_-12px_rgb(0_0_0/45%)] md:left-[140px] md:h-[319px] md:w-[560px]"
            name="boardDark"
          />
        </Card>
        <Card className="min-h-[300px]" {...CARDS.seo}>
          {/* Long lines wrap inside the card instead of running off its
              edge on narrower screens. */}
          <pre className="ring-line text-muted-foreground mt-[31px] rounded-[10px] bg-(--panel) p-4 font-mono text-[12px] leading-[19px] break-words whitespace-pre-wrap ring-1 ring-inset">
            <code>{JOB_POSTING_CODE}</code>
          </pre>
        </Card>
        <Card className="min-h-[300px]" inverse {...CARDS.paid}>
          {/* Decorative mock of a Stripe checkout for the paid card. The
              honest summary is the card copy; the mock itself is for human
              readers only. */}
          <div className="mt-[31px] flex flex-col" data-markdown-ignore>
            <dl className="flex gap-2.5">
              <div className="flex flex-1 flex-col gap-1 rounded-[10px] p-3.5 ring-1 ring-(--kbd-on-outline) ring-inset">
                <dt className="text-muted-foreground text-[12px] leading-4">
                  {EXAMPLE.priceName}
                </dt>
                <dd className="text-[22px] leading-[26px] font-medium">
                  {EXAMPLE.priceLabel}
                </dd>
                <dd className="text-subtle text-[11px] leading-[14px]">
                  {EXAMPLE.paidThrough}
                </dd>
              </div>
              <div className="bg-primary text-primary-foreground flex flex-1 flex-col gap-1 rounded-[10px] p-3.5">
                <dt className="text-primary-foreground/65 text-[12px] leading-4">
                  {EXAMPLE.listedFor}
                </dt>
                <dd className="text-[22px] leading-[26px] font-medium">
                  {EXAMPLE.durationDays} days
                </dd>
                <dd className="text-primary-foreground/65 text-[11px] leading-[14px]">
                  {EXAMPLE.thenExpires}
                </dd>
              </div>
            </dl>
            <p
              aria-hidden="true"
              className="bg-primary text-primary-foreground mt-[18px] flex h-9 items-center justify-center rounded-lg text-[13px] leading-4 font-medium"
            >
              {EXAMPLE.continue} &#8599;
            </p>
            <p className="text-subtle mt-3.5 font-mono text-[10px] leading-3">
              {EXAMPLE.note}
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
