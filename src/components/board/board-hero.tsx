import type { ReactNode } from "react";

import { BoardSearchForm } from "@/components/board/board-search-form";
import { companiesFromPool } from "@/lib/board/companies";
import { formatRelativePosted } from "@/lib/board/format";
import type { BoardQuery, BoardQueryOptions } from "@/lib/board/query";
import type { JobListItem } from "@/lib/read/types";

const DEFAULT_TITLE = "Discover and Apply to Your Dream Jobs Today";
const DEFAULT_INTRO =
  "Browse curated opportunities from leading companies. Updated daily with the latest positions.";
const TRENDING_LIMIT = 3;

export interface HeroStats {
  lastUpdated: string | null;
  openJobs: number;
  trending: string[];
}

// Null fields mean "omit this stat", never a placeholder like NaN.
export function heroStats(
  cards: readonly JobListItem[],
  now: number
): HeroStats {
  let newestMs: number | null = null;
  let newestIso: string | null = null;
  for (const card of cards) {
    if (!card.publishedAt) {
      continue;
    }
    const ms = Date.parse(card.publishedAt);
    if (Number.isNaN(ms)) {
      continue;
    }
    if (newestMs === null || ms > newestMs) {
      newestMs = ms;
      newestIso = card.publishedAt;
    }
  }

  const trending = companiesFromPool(cards)
    .sort((left, right) => right.count - left.count)
    .slice(0, TRENDING_LIMIT)
    .map((row) => row.name);
  const lastUpdated =
    newestIso === null ? "" : formatRelativePosted(newestIso, now);

  return {
    lastUpdated: lastUpdated.length > 0 ? lastUpdated : null,
    openJobs: cards.length,
    trending,
  };
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-primary-foreground/80 text-xs">{label}</dt>
      <dd className="text-sm font-semibold break-words md:text-base">
        {children}
      </dd>
    </div>
  );
}

export function BoardHero({
  badge,
  cards,
  intro,
  options,
  query,
  title,
}: {
  badge: string;
  cards: JobListItem[];
  intro: string;
  options: BoardQueryOptions;
  query: BoardQuery;
  title: string;
}) {
  const stats = heroStats(cards, Date.now());

  return (
    <section
      className="bordful-inverse bg-primary text-primary-foreground border-b"
      data-testid="board-hero"
    >
      <div className="max-w-board mx-auto w-full space-y-6 px-4 py-8 md:py-12">
        <div className="max-w-2xl space-y-4">
          {badge ? (
            <p className="text-primary inline-block rounded-full bg-white px-3 py-1 text-xs font-medium">
              {badge}
            </p>
          ) : null}
          <h1 className="font-[var(--font-heading)] text-3xl font-semibold tracking-tight md:text-4xl">
            {title || DEFAULT_TITLE}
          </h1>
          <p className="text-primary-foreground/90">{intro || DEFAULT_INTRO}</p>
          <BoardSearchForm options={options} query={query} variant="hero" />
        </div>
        <dl className="grid max-w-2xl grid-cols-3 gap-4">
          <Stat label="Open jobs">{stats.openJobs}</Stat>
          {stats.lastUpdated ? (
            <Stat label="Last updated">{stats.lastUpdated}</Stat>
          ) : null}
          {stats.trending.length > 0 ? (
            <Stat label="Trending">{stats.trending.join(", ")}</Stat>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
