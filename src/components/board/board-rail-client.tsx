"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import {
  RAIL_COUNT,
  RAIL_FOCUS,
  RAIL_HEADING,
  railLinkClass,
} from "@/components/board/rail-styles";
import { useJobList } from "@/components/board/saved-jobs";
import {
  type SavedSearch,
  useSavedSearches,
} from "@/components/board/saved-searches";
import { cn } from "@/lib/utils";

export const SAVED_JOBS_PATH = "/saved";
export const APPLIED_JOBS_PATH = "/saved?list=applied";

// Saved and Applied rows. The counts come from localStorage, so they appear
// after hydration; the links work either way.
export function RailJobLists({
  active,
}: {
  active: "applied" | "saved" | null;
}) {
  const saved = useJobList("saved");
  const applied = useJobList("applied");
  const rows = [
    {
      count: saved.slugs.length,
      href: SAVED_JOBS_PATH,
      id: "saved" as const,
      label: "Saved",
    },
    {
      count: applied.slugs.length,
      href: APPLIED_JOBS_PATH,
      id: "applied" as const,
      label: "Applied",
    },
  ];

  return (
    <>
      {rows.map((row) => (
        <Link
          aria-current={active === row.id ? "page" : undefined}
          className={railLinkClass(active === row.id)}
          data-testid={`rail-${row.id}`}
          href={row.href}
          key={row.id}
        >
          <span className="truncate">{row.label}</span>
          <span className={RAIL_COUNT}>{row.count}</span>
        </Link>
      ))}
    </>
  );
}

function SavedSearchRow({
  active,
  count,
  onRemove,
  search,
}: {
  active: boolean;
  // The open search's result count; other rows show none.
  count: number | null;
  onRemove: (id: string) => void;
  search: SavedSearch;
}) {
  const onClick = useCallback(() => onRemove(search.id), [onRemove, search.id]);

  return (
    <li className="group/search relative">
      <Link
        aria-current={active ? "page" : undefined}
        className={cn(
          railLinkClass(active),
          !(active && count !== null) && "pr-7"
        )}
        href={search.href}
      >
        <span className="truncate">{search.name}</span>
        {active && count !== null ? (
          <span
            className={cn(
              RAIL_COUNT,
              "group-focus-within/search:invisible group-hover/search:invisible"
            )}
          >
            {count}
          </span>
        ) : null}
      </Link>
      <button
        aria-label={`Remove saved search ${search.name}`}
        className={cn(
          "text-subtle hover:text-foreground absolute top-1/2 right-1.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-[4px] opacity-0 group-focus-within/search:opacity-100 group-hover/search:opacity-100",
          RAIL_FOCUS
        )}
        onClick={onClick}
        type="button"
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </li>
  );
}

// Searches saved with "Save search" in the toolbar. No unread counts: the
// board does not know what a visitor has already seen.
export function RailSavedSearches({
  currentCount = null,
  currentHref,
}: {
  currentCount?: number | null;
  currentHref: string;
}) {
  const { remove, searches } = useSavedSearches();
  if (searches.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="rail-saved-searches" className="flex flex-col">
      <h2 className={RAIL_HEADING} id="rail-saved-searches">
        Saved searches
      </h2>
      <ul className="flex flex-col gap-0.5">
        {searches.map((search) => (
          <SavedSearchRow
            active={search.href === currentHref}
            count={currentCount}
            key={search.id}
            onRemove={remove}
            search={search}
          />
        ))}
      </ul>
    </section>
  );
}
