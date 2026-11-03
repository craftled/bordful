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
      <article className="mx-auto -mt-8 flex w-full max-w-[520px] flex-col items-center gap-3.5 px-4 pt-8 pb-7 text-center md:mt-0 md:gap-5 md:pt-10 md:pb-10">
        <div
          aria-hidden="true"
          className="bg-new/10 text-new flex size-12 items-center justify-center rounded-full"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="22"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
            width="22"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h1
          className="text-foreground text-[28px] leading-[34px] font-medium tracking-[-0.035em] md:text-[40px] md:leading-[48px]"
          data-testid="post-job-thanks"
        >
          Thanks for your payment
        </h1>
        <p className="text-muted-foreground text-[14px] leading-[18px] md:text-[15px]">
          The board owner will collect the job details and publish the listing,
          usually within one business day.
        </p>
        <a
          className="bg-card text-foreground border-line-strong inline-flex h-[34px] items-center rounded-lg border px-[14px] text-[13px] leading-4 font-medium"
          href={boardHomePath(isMarketingEnabled())}
        >
          Back to the board
        </a>
      </article>
    </BoardShell>
  );
}
