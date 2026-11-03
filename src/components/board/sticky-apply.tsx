"use client";

// Mobile only. Sticky, not fixed, and rendered last in the job wrapper: it pins while the
// job is read and sits in the flow above the footer at the end, so it never covers the footer.
// On md+ the header button stays in view, so this bar is hidden there.
export function StickyApply({ href, title }: { href: string; title: string }) {
  return (
    <div className="border-border bg-background sticky bottom-0 z-20 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <a
        className="bg-primary text-primary-foreground inline-flex h-10 w-full items-center justify-center rounded-[var(--radius)] px-4 text-sm font-medium"
        data-testid="job-sticky-apply"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        Apply Now
        <span className="sr-only"> to {title}</span>
      </a>
    </div>
  );
}
