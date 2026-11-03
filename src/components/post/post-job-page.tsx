import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { PostJobView } from "./post-job-view";

export function PostJobPage({ view }: { view: PostJobView }) {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-4">
      <header className="flex flex-col gap-3">
        <h1 className="font-semibold text-3xl tracking-tight">Post a Job</h1>
        <p className="max-w-2xl text-muted-foreground">
          Reach people who read this board, its RSS feed and its job alert
          emails. Pay once with the secure Stripe link, and the board owner
          publishes your listing.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <Card className="h-fit gap-4 py-5">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-2 pl-5 text-sm">
              <li>Pay with the secure Stripe link.</li>
              <li>You receive a receipt.</li>
              <li>
                The board owner collects the job details and publishes it,
                usually within one business day.
              </li>
            </ol>
          </CardContent>
        </Card>
        <Card className="h-fit gap-6 py-6" data-testid="post-job-pricing">
          <CardHeader className="gap-2">
            <CardTitle className="text-muted-foreground text-sm uppercase tracking-wider">
              Job listing
            </CardTitle>
            {view.priceLabel ? (
              <p
                className="font-semibold text-4xl tracking-tight"
                data-testid="post-job-price"
              >
                {view.priceLabel}
              </p>
            ) : null}
            <p
              className="text-muted-foreground text-sm"
              data-testid="post-job-duration"
            >
              {view.durationLabel}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              <li>Listed on the board for the duration</li>
              <li>Included in the RSS feed and job alert emails</li>
              <li>A JobPosting page that search engines can read</li>
            </ul>
            <Button asChild className="w-full">
              <a
                data-testid="post-job-cta"
                href={view.ctaHref}
                rel="noopener noreferrer"
              >
                {view.ctaLabel}
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </article>
  );
}
