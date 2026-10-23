"use client";

export function StickyApply({ href }: { href: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-border border-t bg-background p-3">
      <a
        className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-primary px-4 font-medium text-primary-foreground text-sm"
        data-testid="job-sticky-apply"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        Apply
      </a>
    </div>
  );
}
