"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { buildShareLinks } from "@/components/board/job-share";
import { useJobList } from "@/components/board/saved-jobs";

const OUTLINE_BUTTON =
  "bg-card ring-line-strong hover:bg-selected inline-flex items-center justify-center rounded-lg font-medium ring-1 ring-inset";

export function JobSaveButton({
  className,
  slug,
  testId,
  variant,
}: {
  className?: string;
  slug: string;
  testId: string;
  variant: "icon" | "text";
}) {
  const saved = useJobList("saved");
  const isSaved = saved.has(slug);
  const { toggle } = saved;
  const onToggle = useCallback(() => toggle(slug), [slug, toggle]);

  if (variant === "icon") {
    return (
      <button
        aria-label={isSaved ? "Remove from saved jobs" : "Save job"}
        aria-pressed={isSaved}
        className={`text-muted-foreground hover:text-foreground flex size-8 items-center justify-center rounded-md ${className ?? ""}`}
        data-testid={testId}
        onClick={onToggle}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-[18px]"
          fill={isSaved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <path d="M6 4h12v17l-6-4-6 4V4Z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      aria-pressed={isSaved}
      className={`${OUTLINE_BUTTON} ${className ?? ""}`}
      data-testid={testId}
      onClick={onToggle}
      type="button"
    >
      {isSaved ? "Saved" : "Save"}
    </button>
  );
}

export function JobApplyLink({
  children,
  className,
  href,
  slug,
  testId,
}: {
  children: React.ReactNode;
  className: string;
  href: string;
  slug: string;
  testId: string;
}) {
  const { add } = useJobList("applied");
  const onClick = useCallback(() => add(slug), [add, slug]);

  return (
    <a
      className={className}
      data-testid={testId}
      href={href}
      onClick={onClick}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

const SHARE_BUTTON =
  "bg-card ring-line-strong hover:bg-selected inline-flex h-7 shrink-0 items-center rounded-lg px-2.5 text-[13px] leading-[18px] font-medium ring-1 ring-inset";

export function JobShareCard({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const links = buildShareLinks(url, title);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopied(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [url]);

  return (
    <section
      aria-labelledby="share-job-title"
      className="bg-card ring-line flex flex-col gap-3 rounded-[14px] p-[18px] ring-1 ring-inset"
    >
      <h2
        className="text-subtle text-[12px] leading-4 font-medium"
        id="share-job-title"
      >
        Share this job
      </h2>
      <div className="flex flex-wrap gap-1.5">
        <button className={SHARE_BUTTON} onClick={copy} type="button">
          {copied ? "Copied" : "Copy link"}
        </button>
        <span aria-live="polite" className="sr-only">
          {copied ? "Link copied" : ""}
        </span>
        <a
          className={SHARE_BUTTON}
          href={links.linkedin}
          rel="noopener noreferrer"
          target="_blank"
        >
          LinkedIn
        </a>
        <a
          className={SHARE_BUTTON}
          href={links.x}
          rel="noopener noreferrer"
          target="_blank"
        >
          X
        </a>
        <a className={SHARE_BUTTON} href={links.email}>
          Email
        </a>
      </div>
    </section>
  );
}
