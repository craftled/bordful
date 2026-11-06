import Link from "next/link";

import { Button } from "@/components/ui/button";

import type { PostJobView } from "./post-job-view";

const cardClass = "bg-card rounded-[14px] border border-line";

const STEPS = [
  "Pay with the secure Stripe link.",
  "You receive a receipt.",
  "The board owner collects the job details and publishes it, usually within one business day.",
];

const INCLUDED = [
  "Listed on the board for the duration",
  "Included in the RSS feed and job alert emails",
  "A JobPosting page that search engines can read",
];

export function PostJobPage({
  jobsHref,
  view,
}: {
  jobsHref: string;
  view: PostJobView;
}) {
  return (
    <article className="mx-auto flex w-full max-w-[1104px] flex-col gap-5 px-4 pt-2 pb-7 md:gap-8 md:pt-7 md:pb-[72px]">
      <nav aria-label="Breadcrumb" className="text-[13px] leading-4">
        <ol className="flex items-center gap-2">
          <li>
            <Link className="text-subtle hover:text-foreground" href={jobsHref}>
              Jobs
            </Link>
          </li>
          <li aria-hidden="true" className="text-subtle">
            /
          </li>
          <li aria-current="page" className="text-foreground">
            Post a job
          </li>
        </ol>
      </nav>
      <header className="flex flex-col gap-3">
        <h1 className="flex flex-col text-[28px] leading-[34px] font-medium tracking-[-0.035em] md:text-[40px] md:leading-[48px]">
          <span className="text-foreground">Post a job.</span>
          <span className="text-subtle">Pay once with Stripe.</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl text-[14px] leading-5">
          Reach people who read this board, its RSS feed and its job alert
          emails. Pay once with the secure Stripe link, and the board owner
          publishes your listing.
        </p>
      </header>
      <div className="flex flex-col items-start gap-5 md:flex-row md:gap-8">
        <section
          className={`${cardClass} flex w-full flex-col gap-3 p-5 md:min-w-0 md:flex-1 md:p-7`}
        >
          <h2 className="text-foreground text-[15px] leading-[18px] font-medium">
            How it works
          </h2>
          <ol className="flex flex-col gap-[10px]">
            {STEPS.map((step, index) => (
              <li
                className="text-muted-foreground flex gap-[10px] text-[13px] leading-5"
                key={step}
              >
                <span className="text-subtle font-medium">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>
        <section
          className={`${cardClass} flex w-full flex-col gap-3 p-5 md:w-[320px] md:shrink-0 lg:w-[400px]`}
          data-testid="post-job-pricing"
        >
          <p className="text-subtle text-[13px] leading-4">Job listing</p>
          {view.priceLabel ? (
            <p
              className="text-foreground text-[22px] leading-7 font-medium tracking-tight"
              data-testid="post-job-price"
            >
              {view.priceLabel}
            </p>
          ) : null}
          <p
            className="text-muted-foreground text-[13px] leading-4"
            data-testid="post-job-duration"
          >
            {view.durationLabel}
          </p>
          <div className="bg-line h-px" />
          <ul className="flex flex-col gap-2">
            {INCLUDED.map((item) => (
              <li className="text-foreground text-[13px] leading-5" key={item}>
                {item}
              </li>
            ))}
          </ul>
          <Button asChild className="h-10 w-full text-[14px] leading-[18px]">
            <a
              data-testid="post-job-cta"
              href={view.ctaHref}
              rel="noopener noreferrer"
            >
              {view.ctaLabel}
            </a>
          </Button>
          {view.testMode ? (
            <p
              className="bg-surface-sub text-muted-foreground rounded-[8px] px-3 py-2 text-[12px] leading-[18px]"
              data-testid="post-job-test-mode"
            >
              Demo checkout: no real charge. Pay with card 4242 4242 4242 4242,
              any future date and any CVC.
            </p>
          ) : null}
        </section>
      </div>
    </article>
  );
}
