"use client";

import { JobApplyLink, JobSaveButton } from "@/components/board/job-actions";

// Mobile only. Sticky, not fixed, and rendered last in the job wrapper: it pins while the
// job is read and sits in the flow above the footer at the end, so it never covers the footer.
// On md+ the letter's own action bar stays in view, so this bar is hidden there.
// The phone tab bar is hidden on job pages, so the bar pins to the bottom.
export function StickyApply({
  companyName,
  href,
  slug,
  title,
}: {
  companyName: string;
  href: string | null;
  slug: string;
  title: string;
}) {
  return (
    <div className="border-line bg-background sticky bottom-0 z-20 -mx-4 border-t px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:hidden">
      <div className="flex gap-2.5">
        <JobSaveButton
          className="h-11 w-[88px] shrink-0 text-[15px]"
          slug={slug}
          testId="job-sticky-save"
          variant="text"
        />
        {href ? (
          <JobApplyLink
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-11 min-w-0 flex-1 items-center justify-center rounded-lg px-3.5 text-[15px] leading-[18px] font-medium"
            href={href}
            slug={slug}
            testId="job-sticky-apply"
          >
            <span className="truncate">Apply at {companyName}</span>
            <span className="sr-only"> to {title}</span>
          </JobApplyLink>
        ) : null}
      </div>
    </div>
  );
}
