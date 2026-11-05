import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";
import { Section } from "./section";
import { SectionHeader } from "./section-header";
import { GITHUB_URL } from "./site";

// "short" is the tighter wording the home section uses.
export const questions: {
  answer: ReactNode;
  question: string;
  short?: string;
  // Plain text for FAQPage JSON-LD when `answer` is not a string.
  text?: string;
}[] = [
  {
    answer:
      "An open-source job board template on Next.js, Payload and Postgres. Deploy it and you get a board with real sample jobs.",
    question: "What is Bordful?",
  },
  {
    answer:
      "Yes. The template is MIT licensed and free for personal and commercial projects. You pay your host, and any service you choose to turn on.",
    question: "Is it free?",
    short: "Is it really free?",
  },
  {
    answer:
      "Bordfeed supplies the sample jobs on a fresh board and, after you connect, a feed of jobs for your board. You can skip the connection and publish your own jobs. Bordfeed sells its own plans.",
    question: "What is Bordfeed and do I need it?",
    short: "Do I need Bordfeed?",
  },
  {
    answer:
      "Yes. Editors add jobs in the Payload admin. You can also turn on Post a Job and send employers to a Stripe payment link. A listing stays up for the number of days you set, 30 by default.",
    question: "Can I post my own jobs?",
  },
  {
    answer: (
      <>
        Pull the latest code from{" "}
        <a
          className="text-primary underline-offset-4 hover:underline"
          href={GITHUB_URL}
          rel="noopener noreferrer"
          target="_blank"
        >
          GitHub
        </a>{" "}
        and run the database migrations. Your jobs stay in Postgres. Read the{" "}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href="/changelog"
        >
          changelog
        </Link>{" "}
        before you deploy.
      </>
    ),
    question: "How do I update a fork?",
    short: "How do I update my fork?",
    text: "Pull the latest code from GitHub and run the database migrations. Your jobs stay in Postgres. Read the changelog before you deploy.",
  },
];

export function faqPlainAnswers(): { answer: string; question: string }[] {
  return questions.map((item) => ({
    answer: item.text ?? (typeof item.answer === "string" ? item.answer : ""),
    question: item.question,
  }));
}

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

// Paper's phone home uses a 16px chevron. The +/− marker is desktop only.
function PhoneChevron() {
  return (
    <svg
      aria-hidden="true"
      className="text-subtle size-4 shrink-0 transition-transform group-open:rotate-180 md:hidden"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </svg>
  );
}

function PlusMinus() {
  return (
    <span
      aria-hidden="true"
      className="text-subtle hidden text-[15px] leading-[18px] md:inline"
    >
      <span className="group-open:hidden">+</span>
      <span className="hidden group-open:inline">−</span>
    </span>
  );
}

function QuestionList({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("border-line w-full border-b", className)}>
      {questions.map((item, index) => (
        <details
          className={cn(
            "group border-line border-t",
            compact ? "py-4" : "py-4 md:py-[18px]"
          )}
          key={item.question}
          open={index === 0}
        >
          <summary
            className={cn(
              "text-foreground flex cursor-pointer items-center justify-between gap-4 rounded-sm text-[15px] leading-[18px] font-medium",
              compact ? "md:text-[14px] md:leading-5" : "md:leading-[22px]"
            )}
          >
            {compact ? (item.short ?? item.question) : item.question}
            {compact ? (
              <>
                <PhoneChevron />
                <PlusMinus />
              </>
            ) : (
              <Chevron />
            )}
          </summary>
          <p
            className={cn(
              "text-muted-foreground text-[14px] leading-[21px]",
              compact
                ? "max-w-[560px] pt-2 md:text-[13px] md:leading-5"
                : "max-w-[600px] pt-2 md:leading-[22px]"
            )}
          >
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

// "section" is the home layout: heading on the left, questions on the right.
// "page" stacks a centered heading over the list, as on the pricing page.
export function Faq({ variant = "section" }: { variant?: "section" | "page" }) {
  if (variant === "page") {
    return (
      <Section className="md:py-[72px]">
        <Container className="flex flex-col gap-6 md:items-center md:gap-8">
          <SectionHeader
            className="gap-2.5 md:items-center md:text-center md:[&>h2]:text-[28px] md:[&>h2]:leading-[34px] md:[&>h2]:tracking-[-0.03em] [&>p]:hidden md:[&>p]:block md:[&>p]:text-[15px] md:[&>p]:leading-[23px]"
            description="Everything you need to know before you start."
            title="Frequently asked"
            titleMuted="questions."
          />
          <QuestionList className="md:max-w-[720px]" />
        </Container>
      </Section>
    );
  }

  return (
    <Section>
      <Container className="flex flex-col gap-6 md:flex-row md:justify-between md:gap-12">
        <SectionHeader
          className="md:w-[320px]"
          eyebrow="FAQ"
          phone="mono"
          title="Questions."
          titleMuted="Short answers."
        />
        <QuestionList className="md:max-w-[620px]" compact />
      </Container>
    </Section>
  );
}
