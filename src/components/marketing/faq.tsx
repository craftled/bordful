import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";
import { Section } from "./section";
import { SectionHeader } from "./section-header";
import { GITHUB_URL } from "./site";

const questions: { answer: ReactNode; question: string }[] = [
  {
    answer:
      "Bordful is an open-source job board template. It runs on Next.js, Payload, and Postgres. Deploy it and you get a board with real sample jobs from Bordfeed.",
    question: "What is Bordful?",
  },
  {
    answer:
      "Yes. The template is MIT licensed and free for personal and commercial projects. You pay your host, and any service you choose to turn on.",
    question: "Is it free?",
  },
  {
    answer:
      "Bordfeed supplies the sample jobs on a fresh board and, after you connect, a feed of jobs for your board. You can skip the connection and publish your own jobs. Bordfeed sells its own plans.",
    question: "What is Bordfeed and do I need it?",
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
  },
];

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

function QuestionList({ className }: { className?: string }) {
  return (
    <div className={cn("border-line w-full border-b", className)}>
      {questions.map((item) => (
        <details
          className="group border-line border-t py-4 md:py-[18px]"
          key={item.question}
        >
          <summary className="text-foreground flex cursor-pointer items-center justify-between gap-4 rounded-sm text-[14px] leading-5 font-medium md:text-[15px] md:leading-[22px]">
            {item.question}
            <Chevron />
          </summary>
          <p className="text-muted-foreground max-w-[600px] pt-2 text-[13px] leading-5 md:text-[14px] md:leading-[22px]">
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
      <Section className="md:pt-12 md:pb-[72px]">
        <Container className="flex flex-col gap-6 md:items-center md:gap-8">
          <SectionHeader
            className="md:items-center md:text-center"
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
          className="md:max-w-[320px]"
          description="Short answers about the template, Bordfeed, and posting your own jobs."
          eyebrow="FAQ"
          title="Frequently asked"
          titleMuted="questions."
        />
        <QuestionList className="md:max-w-[620px]" />
      </Container>
    </Section>
  );
}
