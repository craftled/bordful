import { companiesFromPool } from "@/lib/board/companies";
import { formatRelativePosted } from "@/lib/board/format";
import type { JobListItem } from "@/lib/read/types";

const DEFAULT_TITLE = "Latest jobs";
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

// The list header: board title and intro above the job list, in the
// compact Paper list-header style rather than a marketing hero.
export function BoardHero({
  heading = "h1",
  intro,
  testId = "board-hero",
  title,
}: {
  heading?: "h1" | "h2";
  intro?: string;
  testId?: string;
  title?: string;
}) {
  const Heading = heading;

  return (
    <header className="space-y-1 px-3 pt-2 pb-1" data-testid={testId}>
      <Heading className="text-foreground text-[15px] leading-5 font-medium">
        {title || DEFAULT_TITLE}
      </Heading>
      {intro ? (
        <p className="text-subtle max-w-2xl text-[12px] leading-4">{intro}</p>
      ) : null}
    </header>
  );
}
