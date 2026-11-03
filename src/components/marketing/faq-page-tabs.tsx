"use client";

import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";
import { questions } from "./faq";
import { Section } from "./section";

const CATEGORIES = [
  { label: "General", questions: ["What is Bordful?", "Is it free?"] },
  { label: "Setup", questions: ["What is Bordfeed and do I need it?"] },
  { label: "Customizing", questions: ["Can I post my own jobs?"] },
  { label: "Deploying", questions: ["How do I update a fork?"] },
] as const;

function Chevron() {
  return (
    <svg
      aria-hidden="true"
      className="text-subtle size-3.5 shrink-0 transition-transform group-open:rotate-180"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.4}
      />
    </svg>
  );
}

function TabButton({
  active,
  label,
  onSelect,
}: {
  active: boolean;
  label: string;
  onSelect: (label: string) => void;
}) {
  const handleClick = useCallback(() => onSelect(label), [label, onSelect]);

  return (
    <button
      aria-selected={active}
      className={cn(
        "px-3.5 py-1.5 text-[13px] leading-[18px] whitespace-nowrap max-md:rounded-full md:rounded-md md:px-2.5 md:py-1",
        active
          ? "bg-primary text-primary-foreground md:bg-card md:text-foreground font-medium md:shadow-[0_0_0_1px_rgb(0_0_0/6%),0_1px_2px_rgb(0_0_0/5%)]"
          : "text-muted-foreground hover:text-foreground max-md:bg-card max-md:text-foreground max-md:ring-line-strong max-md:ring-1 max-md:ring-inset"
      )}
      onClick={handleClick}
      role="tab"
      type="button"
    >
      {label}
    </button>
  );
}

function TabList({
  active,
  className,
  onSelect,
}: {
  active: string;
  className?: string;
  onSelect: (label: string) => void;
}) {
  return (
    <div
      aria-label="Question categories"
      className={cn(
        "md:bg-tag max-w-full items-center gap-2 overflow-x-auto md:gap-0.5 md:self-center md:rounded-lg md:p-0.5",
        "flex",
        className
      )}
      role="tablist"
    >
      {CATEGORIES.map((entry) => (
        <TabButton
          active={entry.label === active}
          key={entry.label}
          label={entry.label}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function FaqPageTabs() {
  const [active, setActive] = useState<string>(CATEGORIES[0].label);
  const category =
    CATEGORIES.find((entry) => entry.label === active) ?? CATEGORIES[0];
  const items = questions.filter((item) =>
    (category.questions as readonly string[]).includes(item.question)
  );

  return (
    <>
      <Section className="md:py-14">
        <Container className="flex flex-col gap-5 md:items-center md:gap-[18px] md:text-center">
          <p className="bg-card ring-line-strong text-muted-foreground md:text-foreground self-start rounded-full px-2.5 py-0.5 text-[12px] leading-4 font-medium ring-1 md:self-center md:bg-transparent md:px-0 md:py-0 md:text-[13px] md:leading-[19px] md:ring-0">
            FAQ
          </p>
          <h1 className="flex flex-col text-[32px] leading-10 font-medium tracking-[-0.035em] text-balance md:text-[48px] md:leading-[54px]">
            <span className="text-foreground">Frequently asked</span>
            <span className="text-subtle">questions.</span>
          </h1>
          <p className="text-muted-foreground max-w-[560px] text-[16px] leading-6 md:leading-[25px] md:text-balance">
            Short answers about the template, Bordfeed, and posting your own
            jobs.
          </p>
          <TabList
            active={active}
            className="hidden md:flex"
            onSelect={setActive}
          />
        </Container>
      </Section>
      <Section className="md:pt-12 md:pb-[72px]">
        <Container className="flex flex-col gap-4 md:items-center">
          <TabList active={active} className="md:hidden" onSelect={setActive} />
          <div
            className="border-line w-full border-b md:max-w-[720px]"
            key={category.label}
            role="tabpanel"
          >
            {items.map((item, index) => (
              <details
                className="group border-line border-t py-4 md:py-[18px]"
                key={item.question}
                open={index === 0}
              >
                <summary className="text-foreground flex cursor-pointer items-center justify-between gap-4 rounded-sm text-[15px] leading-[18px] font-medium md:leading-[22px]">
                  {item.question}
                  <Chevron />
                </summary>
                <p className="text-muted-foreground max-w-[600px] pt-2 text-[14px] leading-[21px] md:leading-[22px]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
