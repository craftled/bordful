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

export function PostJobPage({ view }: { view: PostJobView }) {
  return (
    <article className="mx-auto flex w-full max-w-[1072px] flex-col gap-8 py-4 md:pt-7 md:pb-[72px]">
      <header className="flex flex-col gap-3">
        <h1 className="flex flex-col text-[30px] leading-9 font-medium tracking-[-0.035em] md:text-[40px] md:leading-[48px]">
          <span className="text-foreground">Post a job.</span>
          <span className="text-subtle">Pay once with Stripe.</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl text-[14px] leading-5">
          Reach people who read this board, its RSS feed and its job alert
          emails. Pay once with the secure Stripe link, and the board owner
          publishes your listing.
        </p>
      </header>
      <div className="flex flex-col items-start gap-8 md:flex-row">
        <section
          className={`${cardClass} flex w-full flex-col gap-3 p-5 md:w-[640px] md:shrink-0 md:p-7`}
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
          className={`${cardClass} flex w-full flex-col gap-3 p-5 md:w-[400px] md:shrink-0`}
          data-testid="post-job-pricing"
        >
          <p className="text-subtle text-[12px] leading-4">Job listing</p>
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
          <Button asChild className="h-10 w-full">
            <a
              data-testid="post-job-cta"
              href={view.ctaHref}
              rel="noopener noreferrer"
            >
              {view.ctaLabel}
            </a>
          </Button>
        </section>
      </div>
    </article>
  );
}
