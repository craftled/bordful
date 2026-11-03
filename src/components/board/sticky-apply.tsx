"use client";

// Mobile only. Sticky, not fixed, and rendered last in the job wrapper: it pins while the
// job is read and sits in the flow above the footer at the end, so it never covers the footer.
// On md+ the letter's own action bar stays in view, so this bar is hidden there.
export function StickyApply({
  companyName,
  href,
  title,
}: {
  companyName: string;
  href: string;
  title: string;
}) {
  return (
    <div className="border-line bg-background sticky bottom-0 z-20 -mx-4 border-t px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))] md:hidden">
      <a
        className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-11 w-full min-w-0 items-center justify-center rounded-md px-3.5 text-[15px] leading-[18px] font-medium"
        data-testid="job-sticky-apply"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="truncate">Apply at {companyName}</span>
        <span className="sr-only"> to {title}</span>
      </a>
    </div>
  );
}
