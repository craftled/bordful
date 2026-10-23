"use client";

// Mobile only. On md+ the header button stays in view, so this bar would only cover content.
export function StickyApply({ href }: { href: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-border border-t bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <a
        className="inline-flex h-10 w-full items-center justify-center rounded-[var(--radius)] bg-primary px-4 font-medium text-primary-foreground text-sm"
        data-testid="job-sticky-apply"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        Apply Now
      </a>
    </div>
  );
}
