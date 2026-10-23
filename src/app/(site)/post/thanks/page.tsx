import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BoardShell } from "@/components/board/board-shell";
import { buildPostJobView } from "@/components/post/post-job-view";
import { isMarketingEnabled } from "@/config/flags";
import { boardHomePath } from "@/config/nav";
import { getSiteSettings } from "@/lib/read";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  if (buildPostJobView(settings.postJob) === null) {
    notFound();
  }

  return {
    robots: { index: false },
    title: "Thanks for your payment",
  };
}

export default async function PostJobThanksPage() {
  const settings = await getSiteSettings();
  if (buildPostJobView(settings.postJob) === null) {
    notFound();
  }

  return (
    <BoardShell>
      <article className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-12">
        <h1
          className="font-semibold text-3xl tracking-tight"
          data-testid="post-job-thanks"
        >
          Thanks for your payment
        </h1>
        <p>
          The board owner will collect the job details and publish the listing,
          usually within one business day.
        </p>
        <a
          className="font-medium text-sm underline underline-offset-4"
          href={boardHomePath(isMarketingEnabled())}
        >
          Back to the board
        </a>
      </article>
    </BoardShell>
  );
}
