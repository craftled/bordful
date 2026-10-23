import { Button } from "@/components/ui/button";

import type { PostJobView } from "./post-job-view";

export function PostJobPage({ view }: { view: PostJobView }) {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-semibold text-3xl tracking-tight">Post a job</h1>
        {view.priceLabel ? (
          <p className="font-semibold text-2xl" data-testid="post-job-price">
            {view.priceLabel}
          </p>
        ) : null}
        <p data-testid="post-job-duration">{view.durationLabel}</p>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-lg">What you get</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Listed on the board for the duration</li>
          <li>Included in the RSS feed and job alert emails</li>
          <li>A JobPosting page that search engines can read</li>
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-lg">How it works</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Pay with the secure Stripe link.</li>
          <li>You receive a receipt.</li>
          <li>
            The board owner collects the job details and publishes it, usually
            within one business day.
          </li>
        </ol>
      </section>
      <Button asChild>
        <a
          data-testid="post-job-cta"
          href={view.ctaHref}
          rel="noopener noreferrer"
        >
          {view.ctaLabel}
        </a>
      </Button>
    </article>
  );
}
