"use client";

import Link from "next/link";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { JobCardList, JobCardRow } from "@/components/board/job-card-row";
import {
  compactRelative,
  jobStatuses,
  StatusPill,
} from "@/components/board/job-row";
import {
  type JobListKind,
  type JobListMeta,
  type JobSnapshot,
  useJobList,
  useJobListMeta,
} from "@/components/board/saved-jobs";
import {
  formatLocation,
  formatSalary,
  formatShortDate,
} from "@/lib/board/format";
import { buildJobPath } from "@/lib/board/paths";
import type { JobListItem } from "@/lib/read/types";
import { cn } from "@/lib/utils";

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
  {
    added: string;
    empty: string;
    hint: string;
    note: string;
    noteShort: string;
    noteTitle: string;
    title: string;
  }
> = {
  applied: {
    added: "Applied",
    empty: "No applications yet",
    hint: "Jobs you apply to from this browser show up here.",
    note: "Applied jobs stay on this device. No account needed. Clearing your browser data removes them.",
    noteShort: "Applied jobs are kept in this browser. No account needed.",
    noteTitle: "Kept in this browser",
    title: "Applied jobs",
  },
  saved: {
    added: "Saved",
    empty: "No saved jobs yet",
    hint: "Press S on a row, or use Save on a job, to keep it here.",
    note: "Saved jobs stay on this device. No account needed. Clearing your browser data removes them.",
    noteShort: "Saved in this browser. No account needed.",
    noteTitle: "Saved in this browser",
    title: "Saved jobs",
  },
};

export type SavedTab = "all" | "closed" | "open";

export interface SavedEntry {
  addedAt: number | null;
  // The live card, or null once the job has left the board.
  card: JobListItem | null;
  slug: string;
  snapshot: JobSnapshot | null;
}

/** The list in saved order, each slug matched to its live card or last snapshot. */
export function savedEntries(
  slugs: readonly string[],
  cards: ReadonlyMap<string, JobListItem>,
  meta: JobListMeta
): SavedEntry[] {
  return slugs.map((slug) => ({
    addedAt: meta[slug]?.addedAt ?? null,
    card: cards.get(slug) ?? null,
    slug,
    snapshot: meta[slug]?.snapshot ?? null,
  }));
}

export function snapshotOf(card: JobListItem): JobSnapshot {
  return {
    companyName: card.companyName,
    location: formatLocation(card),
    salary: formatSalary(card),
    title: card.title,
    validThrough: card.validThrough,
  };
}

/** "5 roles, 1 closed." or "2 roles." */
export function savedSummary(total: number, closed: number): string {
  const roles = total === 1 ? "1 role" : `${total} roles`;
  return closed > 0 ? `${roles}, ${closed} closed.` : `${roles}.`;
}

function closedLabel(snapshot: JobSnapshot | null, now: number): string {
  const closes = snapshot?.validThrough
    ? Date.parse(snapshot.validThrough)
    : Number.NaN;
  if (!Number.isNaN(closes) && closes <= now && snapshot?.validThrough) {
    return `Closed ${formatShortDate(snapshot.validThrough, now)}`;
  }
  return "";
}

function RemoveButton({
  onRemove,
  slug,
  title,
}: {
  onRemove: (slug: string) => void;
  slug: string;
  title: string;
}) {
  const onClick = useCallback(() => onRemove(slug), [onRemove, slug]);
  return (
    <button
      className="text-subtle hover:text-foreground hover:bg-tag flex size-8 items-center justify-center rounded-lg transition-colors"
      data-testid="saved-remove"
      onClick={onClick}
      type="button"
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="16"
        viewBox="0 0 24 24"
        width="16"
      >
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
        />
      </svg>
      <span className="sr-only">Remove {title}</span>
    </button>
  );
}

const TAB_LABEL: Record<SavedTab, string> = {
  all: "All",
  closed: "Closed",
  open: "Open",
};

function Tabs({
  counts,
  onChange,
  tab,
}: {
  counts: Record<SavedTab, number>;
  onChange: (tab: SavedTab) => void;
  tab: SavedTab;
}) {
  const tabs: SavedTab[] = ["all", "open", "closed"];
  const onClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      onChange(event.currentTarget.dataset.tab as SavedTab);
    },
    [onChange]
  );
  return (
    <fieldset className="md:bg-tag m-0 flex min-w-0 gap-1.5 self-start border-0 p-0 md:gap-0.5 md:rounded-lg md:p-0.5">
      <legend className="sr-only">Filter saved jobs</legend>
      {tabs.map((value) => {
        const active = value === tab;
        return (
          <button
            aria-pressed={active}
            className={cn(
              "h-[30px] rounded-full px-3 text-[13px] leading-4 tabular-nums transition-colors md:h-6 md:rounded-sm",
              active
                ? "bg-primary text-primary-foreground md:bg-card md:text-foreground font-medium md:shadow-[0_0_0_1px_var(--line),0_1px_2px_rgb(0_0_0/0.05)]"
                : "bg-card text-foreground ring-line-strong hover:text-foreground md:text-muted-foreground ring-1 md:bg-transparent md:ring-0"
            )}
            data-tab={value}
            data-testid={`saved-tab-${value}`}
            key={value}
            onClick={onClick}
            type="button"
          >
            {TAB_LABEL[value]} {counts[value]}
          </button>
        );
      })}
    </fieldset>
  );
}

const SIDE_CARD =
  "bg-card ring-line flex flex-col rounded-[14px] p-[18px] ring-1";

function AlertCard() {
  return (
    <section
      aria-labelledby="saved-alert-title"
      className={cn(SIDE_CARD, "gap-2.5")}
    >
      <h2
        className="text-foreground text-[15px] leading-[18px] font-medium"
        id="saved-alert-title"
      >
        Get roles like these
      </h2>
      <p className="text-muted-foreground text-[13px] leading-4">
        New jobs from this board, sent to you by email.
      </p>
      <Link
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 w-fit items-center rounded-lg px-3.5 text-[13px] leading-4 font-medium md:h-8"
        href="/alerts"
      >
        Create alert
      </Link>
    </section>
  );
}

// The saved (or applied) list from the live board pool, by the slugs this
// browser keeps. Jobs that have left the board stay listed as closed, with
// the details last seen for them, until they are removed or cleared.
export function SavedJobsView({
  alertsEnabled,
  boardHref,
  cards,
  kind,
  now,
}: {
  alertsEnabled: boolean;
  boardHref: string;
  cards: JobListItem[];
  kind: JobListKind;
  now: number;
}) {
  const hydrated = useHydrated();
  const list = useJobList(kind);
  const { meta, remember } = useJobListMeta(kind);
  const [tab, setTab] = useState<SavedTab>("all");
  const bySlug = useMemo(
    () => new Map(cards.map((card) => [card.slug, card])),
    [cards]
  );
  const entries = useMemo(
    () => savedEntries(list.slugs, bySlug, meta),
    [bySlug, list.slugs, meta]
  );

  // Keep the last details of live jobs, for when they close.
  useEffect(() => {
    remember(
      entries.flatMap((entry) =>
        entry.card
          ? [{ slug: entry.slug, snapshot: snapshotOf(entry.card) }]
          : []
      )
    );
  }, [entries, remember]);

  const open = entries.filter((entry) => entry.card !== null);
  const closed = entries.filter((entry) => entry.card === null);
  const counts: Record<SavedTab, number> = {
    all: entries.length,
    closed: closed.length,
    open: open.length,
  };
  const byTab: Record<SavedTab, SavedEntry[]> = { all: entries, closed, open };
  const shown = byTab[tab];
  const { remove } = list;
  const clearClosed = useCallback(() => {
    for (const entry of closed) {
      remove(entry.slug);
    }
    setTab((current) => (current === "closed" ? "all" : current));
  }, [closed, remove]);
  const copy = COPY[kind];

  const clearButton =
    hydrated && closed.length > 0 ? (
      <button
        className="bg-card ring-line-strong text-foreground hover:bg-surface-sub h-[30px] shrink-0 rounded-full px-3 text-[13px] leading-4 font-medium ring-1 transition-colors md:h-[34px] md:rounded-lg md:px-3.5"
        data-testid="saved-clear-closed"
        onClick={clearClosed}
        type="button"
      >
        Clear closed
      </button>
    ) : null;

  return (
    <div className="flex flex-col gap-5 md:gap-8">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-foreground text-[28px] leading-[34px] font-medium tracking-[-0.035em] md:text-[40px] md:leading-[48px]">
          {copy.title}
          <span
            className="text-subtle block tabular-nums"
            data-count={hydrated ? entries.length : undefined}
            data-testid="job-count"
          >
            {hydrated ? savedSummary(entries.length, closed.length) : " "}
          </span>
        </h1>
        <div className="hidden md:block">{clearButton}</div>
      </div>
      {hydrated ? (
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_324px] lg:items-start lg:gap-8">
          <div className="flex min-w-0 flex-col gap-5 md:gap-3.5">
            {entries.length > 0 ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <Tabs counts={counts} onChange={setTab} tab={tab} />
                  <div className="md:hidden">{clearButton}</div>
                </div>
                <SavedList
                  addedLabel={copy.added}
                  now={now}
                  onRemove={remove}
                  shown={shown}
                  tab={tab}
                />
              </>
            ) : (
              <EmptyState boardHref={boardHref} kind={kind} />
            )}
          </div>
          <SavedAside
            alertsEnabled={alertsEnabled}
            kind={kind}
            offset={entries.length > 0}
          />
        </div>
      ) : (
        <div className="min-h-40" />
      )}
    </div>
  );
}

function SavedRow({
  addedLabel,
  entry,
  now,
  onRemove,
}: {
  addedLabel: string;
  entry: SavedEntry;
  now: number;
  onRemove: (slug: string) => void;
}) {
  const { card, snapshot, slug } = entry;
  const title = card?.title ?? snapshot?.title ?? "Listing no longer available";
  const companyName = card?.companyName ?? snapshot?.companyName ?? "";
  const added = entry.addedAt
    ? compactRelative(new Date(entry.addedAt).toISOString(), now)
    : "";
  const addedTime = added ? `${addedLabel} ${added}` : "";
  const time = card ? addedTime : closedLabel(snapshot, now);

  return (
    <JobCardRow
      action={<RemoveButton onRemove={onRemove} slug={slug} title={title} />}
      companyName={companyName}
      href={card ? buildJobPath(slug) : null}
      initial={companyName.trim().charAt(0).toUpperCase() || "?"}
      location={card ? formatLocation(card) : (snapshot?.location ?? "")}
      logoUrl={card?.companyLogoUrl ?? null}
      muted={card === null}
      pills={
        card === null || jobStatuses(card, now).length > 0 ? (
          <RowPills card={card} now={now} />
        ) : undefined
      }
      salary={card ? formatSalary(card) : (snapshot?.salary ?? "")}
      slug={slug}
      time={time}
      title={title}
    />
  );
}

function RowPills({ card, now }: { card: JobListItem | null; now: number }) {
  if (!card) {
    return (
      <span
        className="bg-closing/10 text-closing inline-flex shrink-0 items-center rounded-[8px] px-1.5 text-[11px] leading-4 font-medium"
        data-status="closed"
      >
        Closed
      </span>
    );
  }
  const statuses = jobStatuses(card, now);
  if (statuses.length === 0) {
    return null;
  }
  return (
    <>
      {statuses.map((status) => (
        <StatusPill key={status} status={status} />
      ))}
    </>
  );
}

function SavedList({
  addedLabel,
  now,
  onRemove,
  shown,
  tab,
}: {
  addedLabel: string;
  now: number;
  onRemove: (slug: string) => void;
  shown: SavedEntry[];
  tab: SavedTab;
}) {
  if (shown.length === 0) {
    return (
      <p className="text-muted-foreground text-[13px] leading-4" role="status">
        {tab === "closed"
          ? "None of these jobs have closed."
          : "Every job in this list has closed."}
      </p>
    );
  }
  return (
    <JobCardList testId="job-list">
      {shown.map((entry) => (
        <SavedRow
          addedLabel={addedLabel}
          entry={entry}
          key={entry.slug}
          now={now}
          onRemove={onRemove}
        />
      ))}
    </JobCardList>
  );
}

function EmptyState({
  boardHref,
  kind,
}: {
  boardHref: string;
  kind: JobListKind;
}) {
  const copy = COPY[kind];
  return (
    <div
      className="bg-card ring-line flex flex-col items-center gap-2 rounded-[14px] px-6 py-10 text-center ring-1"
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
  );
}

function SavedAside({
  alertsEnabled,
  kind,
  offset,
}: {
  alertsEnabled: boolean;
  kind: JobListKind;
  // Paper drops the cards to the list's top edge, below the tabs.
  offset: boolean;
}) {
  const copy = COPY[kind];
  return (
    <aside className={cn("flex flex-col gap-5 md:gap-4", offset && "lg:pt-12")}>
      <p className="text-subtle text-[12px] leading-4 md:hidden">
        {copy.noteShort}
      </p>
      <section
        aria-labelledby="saved-note-title"
        className={cn(SIDE_CARD, "hidden gap-2 md:flex")}
      >
        <h2
          className="text-foreground text-[15px] leading-[18px] font-medium"
          id="saved-note-title"
        >
          {copy.noteTitle}
        </h2>
        <p className="text-muted-foreground text-[13px] leading-4">
          {copy.note}
        </p>
      </section>
      {alertsEnabled ? <AlertCard /> : null}
    </aside>
  );
}
