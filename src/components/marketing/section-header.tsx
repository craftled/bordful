import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// h1 is a page header: centered on desktop, left-aligned on mobile, with a
// plain eyebrow. h2 is a section header: left-aligned with a tag eyebrow.
// titleMuted is the second, lighter line of Paper's two-tone headings.
export function SectionHeader({
  className,
  description,
  eyebrow,
  headingLevel = "h2",
  id,
  title,
  titleMuted,
}: {
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  headingLevel?: "h1" | "h2";
  id?: string;
  title: string;
  titleMuted?: string;
}) {
  const Heading = headingLevel;
  const page = headingLevel === "h1";

  return (
    <div
      className={cn(
        "flex flex-col",
        page ? "gap-5 md:items-center md:text-center" : "gap-3.5",
        className
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "self-start text-[12px] leading-4 font-medium",
            page
              ? "bg-card ring-line-strong text-foreground rounded-full px-2.5 py-0.5 ring-1 md:self-center md:bg-transparent md:px-0 md:py-0 md:text-[13px] md:leading-[19px] md:ring-0"
              : "bg-tag text-muted-foreground flex h-5 items-center rounded-sm px-[7px] text-[11px] leading-[14px]"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <Heading
        className={cn(
          "text-foreground flex flex-col font-medium text-balance",
          page
            ? "text-[32px] leading-10 tracking-[-0.035em] md:text-[48px] md:leading-[54px]"
            : "text-[26px] leading-8 tracking-[-0.025em] md:text-[30px] md:leading-9"
        )}
        id={id}
      >
        <span>{title}</span>
        {titleMuted ? (
          <span className={page ? "text-subtle" : "text-(--text-faint)"}>
            {" "}
            {titleMuted}
          </span>
        ) : null}
      </Heading>
      {description ? (
        <p
          className={cn(
            "text-muted-foreground max-w-[560px]",
            page
              ? "text-[16px] leading-6 md:text-[16px] md:leading-[25px]"
              : "text-[14px] leading-[22px]"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
