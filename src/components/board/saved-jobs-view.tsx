"use client";

import Link from "next/link";
import {
  type ReactNode,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from "react";

import { BoardWorkspace } from "@/components/board/board-workspace";
import { JobRow } from "@/components/board/job-row";
import { type JobListKind, useJobList } from "@/components/board/saved-jobs";
import type { JobListItem } from "@/lib/read/types";

const noop = () => () => undefined;

// True once the browser-local lists can be read, so the empty state never
// flashes before hydration.
function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}

const COPY: Record<
  JobListKind,
  { empty: string; hint: string; title: string }
> = {
  applied: {
    empty: "No applications yet",
    hint: "Jobs you apply to from this browser show up here.",
    title: "Applied jobs",
  },
  saved: {
    empty: "No saved jobs yet",
    hint: "Press S on a row, or use Save on a job, to keep it here.",
    title: "Saved jobs",
  },
};

// The saved (or applied) list, rendered from the live board pool by the
// slugs this browser keeps. Jobs that have since closed are counted, not
// shown, and can be cleared.
export function SavedJobsView({
  aside,
  boardHref,
  cards,
  kind,
  now,
  rail,
}: {
  aside: ReactNode;
  boardHref: string;
  cards: JobListItem[];
  kind: JobListKind;
  now: number;
  rail: ReactNode;
}) {
  const hydrated = useHydrated();
  const list = useJobList(kind);
  const bySlug = useMemo(
    () => new Map(cards.map((card) => [card.slug, card])),
    [cards]
  );
  const jobs = useMemo(
    () =>
      list.slugs
        .map((slug) => bySlug.get(slug))
        .filter((card): card is JobListItem => card !== undefined),
    [bySlug, list.slugs]
  );
  const gone = useMemo(
    () => list.slugs.filter((slug) => !bySlug.has(slug)),
    [bySlug, list.slugs]
  );
  const { remove } = list;
  const clearGone = useCallback(() => {
    for (const slug of gone) {
      remove(slug);
    }
  }, [gone, remove]);
  const copy = COPY[kind];

  const body = hydrated ? (
    <div className="min-w-0 p-2">
      <div className="flex items-baseline justify-between gap-3 px-3 pt-2 pb-3">
        <h1 className="text-foreground text-[15px] leading-5 font-medium">
          {copy.title}
        </h1>
        <p
          className="text-subtle text-[12px] leading-4 tabular-nums"
          data-count={jobs.length}
          data-testid="job-count"
        >
          {jobs.length === 1 ? "1 job" : `${jobs.length} jobs`}
        </p>
      </div>
      {jobs.length > 0 ? (
        <ul className="flex flex-col gap-0.5" data-testid="job-list">
          {jobs.map((job) => (
            <JobRow job={job} key={job.id} now={now} />
          ))}
        </ul>
      ) : (
        <div
          className="bg-card ring-line m-2 flex flex-col items-center gap-2 rounded-[14px] px-6 py-10 text-center ring-1"
          data-testid="board-empty-box"
        >
          <p className="text-[14px] font-medium" data-testid="board-empty">
            {copy.empty}
          </p>
          <p className="text-muted-foreground text-[13px]">{copy.hint}</p>
          <Link
            className="text-muted-foreground hover:text-foreground text-[13px] underline underline-offset-4"
            href={boardHref}
          >
            Browse jobs
          </Link>
        </div>
      )}
      {gone.length > 0 ? (
        <p className="text-subtle flex flex-wrap items-center gap-x-2 px-3 pt-4 text-[12px] leading-4">
          {gone.length === 1
            ? "1 job in this list is no longer listed."
            : `${gone.length} jobs in this list are no longer listed.`}
          <button
            className="hover:text-foreground underline underline-offset-4"
            onClick={clearGone}
            type="button"
          >
            Remove them
          </button>
        </p>
      ) : null}
    </div>
  ) : (
    <div className="min-w-0 p-2" />
  );

  return (
    <BoardWorkspace
      aside={aside}
      className="flex-1 lg:grid lg:grid-cols-[216px_minmax(0,1fr)] xl:grid-cols-[216px_minmax(0,1fr)_400px]"
      jobs={jobs}
      list={body}
      now={now}
      openClassName="xl:grid-cols-[216px_520px_minmax(0,1fr)]"
      rail={rail}
      total={jobs.length}
    />
  );
}
