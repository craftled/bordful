"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useState } from "react";

import { jobStatuses, StatusPill } from "@/components/board/job-row";
import { HINT_CLASS } from "@/components/board/rail-styles";
import { useJobList } from "@/components/board/saved-jobs";
import { offersVisa } from "@/lib/board/filter";
import {
  formatLocation,
  formatRelativePosted,
  formatSalary,
  formatShortDate,
  SENIORITY_LABELS,
} from "@/lib/board/format";
import { buildJobPath } from "@/lib/board/paths";
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_WORKPLACE_LABELS,
} from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";
import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const EXCERPT_CHARS = 480;
const SIMILAR_LIMIT = 3;
const SENTENCE_END = /[.!?]\s/gu;

// The JSON Feed carries each live job's plain-text description. One fetch
// serves every preview on the page; jobs outside the feed show no excerpt.
let feedTexts: Promise<Map<string, string>> | null = null;

function loadFeedTexts(): Promise<Map<string, string>> {
  if (feedTexts) {
    return feedTexts;
  }
  feedTexts = fetch("/feed.json", { headers: { accept: "application/json" } })
    .then((response) => (response.ok ? response.json() : { items: [] }))
    .then((body: unknown) => {
      const map = new Map<string, string>();
      const items =
        typeof body === "object" && body !== null && "items" in body
          ? (body as { items: unknown }).items
          : [];
      if (!Array.isArray(items)) {
        return map;
      }
      for (const item of items) {
        const { content_text: text, url } = item as {
          content_text?: unknown;
          url?: unknown;
        };
        if (typeof url !== "string" || typeof text !== "string") {
          continue;
        }
        const slug = url.split("/jobs/").pop();
        if (slug) {
          map.set(slug, text);
        }
      }
      return map;
    })
    .catch(() => {
      feedTexts = null;
      return new Map<string, string>();
    });
  return feedTexts;
}

// The start of the description, cut at a sentence (or word) boundary.
export function excerpt(text: string, max = EXCERPT_CHARS): string {
  const clean = text.replace(/\s+/gu, " ").trim();
  if (clean.length <= max) {
    return clean;
  }
  const head = clean.slice(0, max);
  let cut = -1;
  for (const match of head.matchAll(SENTENCE_END)) {
    cut = (match.index ?? 0) + 1;
  }
  if (cut > max / 2) {
    return head.slice(0, cut);
  }
  const space = head.lastIndexOf(" ");
  return `${head.slice(0, space > 0 ? space : max)}…`;
}

function useDescription(slug: string): string | null {
  const [text, setText] = useState<{ slug: string; value: string } | null>(
    null
  );
  useEffect(() => {
    let live = true;
    loadFeedTexts().then((map) => {
      if (live) {
        setText({ slug, value: map.get(slug) ?? "" });
      }
    });
    return () => {
      live = false;
    };
  }, [slug]);

  return text?.slug === slug && text.value ? excerpt(text.value) : null;
}

export interface PreviewFact {
  label: string;
  value: string;
}

export function previewFacts(job: JobListItem, now: number): PreviewFact[] {
  const facts: PreviewFact[] = [];
  const salary = formatSalary(job);
  if (salary) {
    facts.push({ label: "Salary", value: salary });
  }
  if (job.employmentType) {
    facts.push({
      label: "Type",
      value: JOB_EMPLOYMENT_LABELS[job.employmentType],
    });
  }
  if (job.seniority) {
    facts.push({ label: "Level", value: SENIORITY_LABELS[job.seniority] });
  }
  if (job.visaSponsorship !== null && job.visaSponsorship.trim() !== "") {
    facts.push({
      label: "Visa",
      value: offersVisa(job.visaSponsorship) ? "Offered" : "Not offered",
    });
  }
  const closes = job.validThrough ? formatShortDate(job.validThrough, now) : "";
  if (closes) {
    facts.push({ label: "Closes", value: closes });
  }
  return facts;
}

// Other jobs on this page that share a category with the open one.
export function similarJobs(
  job: JobListItem,
  jobs: readonly JobListItem[],
  limit = SIMILAR_LIMIT
): JobListItem[] {
  const categories = new Set(job.categories);
  if (categories.size === 0) {
    return [];
  }
  return jobs
    .filter(
      (other) =>
        other.slug !== job.slug &&
        other.categories.some((category) => categories.has(category))
    )
    .slice(0, limit);
}

// The alert sign-up, prefilled with the open job's type, level and
// workplace, plus a short summary of those filters.
export function roleAlert(job: JobListItem): { href: string; summary: string } {
  const params = new URLSearchParams();
  const parts: string[] = [];
  if (job.seniority) {
    params.set("seniority", job.seniority);
    parts.push(SENIORITY_LABELS[job.seniority]);
  }
  if (job.employmentType) {
    params.set("types", job.employmentType);
    parts.push(JOB_EMPLOYMENT_LABELS[job.employmentType]);
  }
  if (job.workplaceType === "remote") {
    params.set("remote", "true");
    parts.push(JOB_WORKPLACE_LABELS.remote);
  }
  const qs = params.toString();
  return {
    href: qs.length > 0 ? `/alerts?${qs}` : "/alerts",
    summary: parts.join(", "),
  };
}

function SimilarJob({
  job,
  onSelect,
}: {
  job: JobListItem;
  onSelect: (job: JobListItem) => void;
}) {
  const onClick = useCallback(() => onSelect(job), [job, onSelect]);
  const salary = formatSalary(job);
  return (
    <li className="border-line border-t">
      <button
        className={cn(
          "group/similar flex h-[34px] w-full cursor-pointer items-center justify-between gap-3 rounded-sm text-left",
          FOCUS
        )}
        onClick={onClick}
        type="button"
      >
        <span className="text-foreground min-w-0 truncate text-[13px] leading-[18px] group-hover/similar:underline">
          {job.title} · {job.companyName}
        </span>
        {salary ? (
          <span className="text-subtle shrink-0 text-[12px] leading-4">
            {salary}
          </span>
        ) : null}
      </button>
    </li>
  );
}

function Logo({ job }: { job: JobListItem }) {
  const initial = job.companyName.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className="bg-foreground text-background flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-lg text-[20px] font-medium"
    >
      {job.companyLogoUrl ? (
        // biome-ignore lint/performance/noImgElement: a 52px company mark, served as-is
        <img
          alt=""
          className="bg-card size-full object-cover"
          height={52}
          src={job.companyLogoUrl}
          width={52}
        />
      ) : (
        initial
      )}
    </span>
  );
}

function KeyButton({
  children,
  label,
  onClick,
}: {
  children: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(HINT_CLASS, "hover:text-foreground cursor-pointer", FOCUS)}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function PreviewSide({
  alert,
  onSelect,
  similar,
}: {
  alert: { href: string; summary: string } | null;
  onSelect?: (job: JobListItem) => void;
  similar: JobListItem[];
}) {
  return (
    <div className="flex w-[250px] shrink-0 flex-col gap-4">
      {alert ? (
        <div className="bg-surface-sub ring-line flex flex-col gap-2.5 rounded-[10px] p-3.5 ring-1 ring-inset">
          <h3 className="text-foreground text-[13px] leading-[18px] font-medium">
            Get roles like this
          </h3>
          <p className="text-muted-foreground text-[12px] leading-[17px]">
            {alert.summary ? `${alert.summary}. ` : ""}New matches by email.
          </p>
          <Link
            className={cn(
              "bg-card text-foreground ring-line-strong hover:bg-surface-sub flex h-7 shrink-0 items-center rounded-[8px] px-2.5 text-[13px] leading-[18px] font-medium ring-1 ring-inset",
              FOCUS
            )}
            href={alert.href}
          >
            Save alert
          </Link>
        </div>
      ) : null}
      {similar.length > 0 && onSelect ? (
        <section aria-label="Similar jobs" className="flex flex-col">
          <h3 className="text-subtle pb-2 text-[12px] leading-4 font-medium">
            Similar jobs
          </h3>
          <ul className="flex flex-col">
            {similar.map((other) => (
              <SimilarJob job={other} key={other.slug} onSelect={onSelect} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

// The right-hand panel for the selected row ("Job open" in the design).
export function JobPreview({
  alertsEnabled = false,
  index,
  job,
  jobs = [],
  now,
  onClose,
  onNext,
  onPrev,
  onSelect,
  total,
}: {
  alertsEnabled?: boolean;
  index: number;
  job: JobListItem;
  // The jobs on this page, for "Similar jobs".
  jobs?: readonly JobListItem[];
  now: number;
  onClose: () => void;
  onNext: (() => void) | null;
  onPrev: (() => void) | null;
  onSelect?: (job: JobListItem) => void;
  total: number;
}) {
  const titleId = useId();
  const saved = useJobList("saved");
  const applied = useJobList("applied");
  const description = useDescription(job.slug);
  const isSaved = saved.has(job.slug);
  const { toggle } = saved;
  const { add } = applied;
  const onSave = useCallback(() => toggle(job.slug), [job.slug, toggle]);
  const onApply = useCallback(() => add(job.slug), [add, job.slug]);
  const href = buildJobPath(job.slug);
  const facts = previewFacts(job, now);
  const statuses = jobStatuses(job, now);
  const posted = job.publishedAt
    ? formatRelativePosted(job.publishedAt, now)
    : "";
  const meta = [
    job.companyName,
    formatLocation(job),
    posted ? `Posted ${posted}` : "",
  ].filter((part) => part.length > 0);
  const closes = job.validThrough ? formatShortDate(job.validThrough, now) : "";
  const similar = onSelect ? similarJobs(job, jobs) : [];
  const alert = alertsEnabled ? roleAlert(job) : null;
  const hasSide = alert !== null || similar.length > 0;

  return (
    <section
      aria-labelledby={titleId}
      className="bg-card ring-line flex min-h-0 flex-1 flex-col overflow-clip rounded-[14px] shadow-[0_1px_2px_rgb(0_0_0/0.04),0_28px_56px_-20px_rgb(0_0_0/0.16)] ring-1"
      data-testid="job-preview"
    >
      <div className="border-line flex h-11 shrink-0 items-center justify-between border-b pr-4 pl-5">
        <div className="flex items-center gap-2.5">
          <p className="text-subtle text-[12px] leading-4 tabular-nums">
            {index} of {total}
          </p>
          <div className="flex gap-0.5">
            {onPrev ? (
              <KeyButton label="Previous job (K)" onClick={onPrev}>
                ↑
              </KeyButton>
            ) : null}
            {onNext ? (
              <KeyButton label="Next job (J)" onClick={onNext}>
                ↓
              </KeyButton>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            className={cn(
              "text-subtle hover:text-foreground rounded-sm text-[12px] leading-4",
              FOCUS
            )}
            data-testid="job-preview-open"
            href={href}
          >
            Open full post ↗
          </Link>
          <KeyButton label="Close preview (Esc)" onClick={onClose}>
            Esc
          </KeyButton>
        </div>
      </div>
      <div className="flex min-h-0 grow flex-col gap-6 overflow-y-auto px-9 py-7">
        <div className="flex items-center gap-4">
          <Logo job={job} />
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              className="text-foreground text-[26px] leading-8 font-medium tracking-[-0.02em]"
              id={titleId}
            >
              <Link className={cn("rounded-sm", FOCUS)} href={href}>
                {job.title}
              </Link>
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="text-muted-foreground text-[14px] leading-5">
                {meta.join(" · ")}
              </p>
              {statuses.map((status) => (
                <StatusPill key={status} status={status} />
              ))}
            </div>
          </div>
        </div>
        {facts.length > 0 ? (
          <dl className="bg-surface-sub ring-line flex flex-wrap rounded-[10px] ring-1 ring-inset">
            {facts.map((fact) => (
              <div
                className="border-line flex min-w-28 grow basis-0 flex-col gap-1 border-r px-4 py-3 last:border-r-0"
                key={fact.label}
              >
                <dt className="text-subtle text-[12px] leading-4">
                  {fact.label}
                </dt>
                <dd className="text-foreground text-[14px] leading-5 font-medium">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="flex gap-10">
          <div className="flex min-w-0 grow basis-0 flex-col gap-[18px]">
            {description ? (
              <div className="flex flex-col gap-1.5">
                <h3 className="text-foreground text-[15px] leading-5 font-medium">
                  About the role
                </h3>
                <p className="text-muted-foreground text-[14px] leading-[22px]">
                  {description}
                </p>
                <Link
                  className={cn(
                    "text-foreground w-fit rounded-sm text-[13px] leading-[18px] underline underline-offset-4",
                    FOCUS
                  )}
                  href={href}
                >
                  Read the full post
                </Link>
              </div>
            ) : null}
            {job.categories.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {job.categories.map((category) => (
                  <li
                    className="bg-tag text-muted-foreground rounded-[5px] px-1.5 py-0.5 text-[12px] leading-4 font-medium"
                    key={category}
                  >
                    {category}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {hasSide ? (
            <PreviewSide alert={alert} onSelect={onSelect} similar={similar} />
          ) : null}
        </div>
      </div>
      <div className="bg-card border-line flex shrink-0 items-center justify-between gap-3 border-t py-3.5 pr-5 pl-9">
        <p className="text-muted-foreground flex min-w-0 items-center gap-2 text-[13px] leading-[18px]">
          {closes ? (
            <>
              <span
                aria-hidden="true"
                className="bg-closing size-1.5 shrink-0 rounded-full"
              />
              <span className="truncate">Closes {closes}</span>
            </>
          ) : null}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            aria-pressed={isSaved}
            className={cn(
              "bg-card text-foreground ring-line-strong hover:bg-surface-sub inline-flex h-[38px] items-center rounded-[8px] px-4 text-[14px] leading-[18px] font-medium ring-1 ring-inset",
              FOCUS
            )}
            data-testid="job-preview-save"
            onClick={onSave}
            type="button"
          >
            {isSaved ? "Saved" : "Save"}
          </button>
          {job.applyHref ? (
            <a
              className={cn(
                "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-[38px] items-center rounded-[8px] px-[18px] text-[14px] leading-[18px] font-medium",
                FOCUS
              )}
              data-testid="job-preview-apply"
              href={job.applyHref}
              onClick={onApply}
              rel="noopener noreferrer"
              target="_blank"
            >
              {job.companyName ? `Apply at ${job.companyName} ↗` : "Apply ↗"}
            </a>
          ) : (
            <Link
              className={cn(
                "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-[38px] items-center rounded-[8px] px-[18px] text-[14px] leading-[18px] font-medium",
                FOCUS
              )}
              href={href}
            >
              View job
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
