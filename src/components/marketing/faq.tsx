import Link from "next/link";
import type { ReactNode } from "react";

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

export function Faq() {
  return (
    <Section variant="secondary">
      <Container>
        <SectionHeader
          description="Short answers about the template, Bordfeed, and posting your own jobs."
          title="Frequently asked questions"
        />
        <div className="mx-auto mt-8 w-full max-w-2xl divide-y divide-border/40">
          {questions.map((item) => (
            <details className="py-1" key={item.question}>
              <summary className="cursor-pointer py-4 font-medium text-sm">
                {item.question}
              </summary>
              <p className="pb-4 text-muted-foreground text-sm">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
