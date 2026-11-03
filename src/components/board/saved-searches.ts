"use client";

import { useCallback, useSyncExternalStore } from "react";

// Saved searches live in the visitor's browser only, like saved jobs: a name
// and the board URL that reproduces the filters. Nothing reaches the server.
export interface SavedSearch {
  href: string;
  id: string;
  name: string;
}

const STORAGE_KEY = "bordful:saved-searches";
const MAX_SEARCHES = 20;
const NAME_MAX = 60;

const EMPTY: readonly SavedSearch[] = Object.freeze([]);
const listeners = new Set<() => void>();
let cache: readonly SavedSearch[] | null = null;

// Only same-origin board paths are kept, so a tampered entry cannot become an
// off-site or script link in the rail.
export function isBoardHref(href: string): boolean {
  return href === "/" || href === "/jobs" || href.startsWith("/jobs/");
}

function parse(raw: string | null): readonly SavedSearch[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) {
      return EMPTY;
    }
    return parsed.filter(
      (item): item is SavedSearch =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as SavedSearch).id === "string" &&
        typeof (item as SavedSearch).name === "string" &&
        typeof (item as SavedSearch).href === "string" &&
        isBoardHref((item as SavedSearch).href)
    );
  } catch {
    return EMPTY;
  }
}

function read(): readonly SavedSearch[] {
  if (cache) {
    return cache;
  }
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  cache = parse(raw);
  return cache;
}

function write(searches: readonly SavedSearch[]): void {
  cache = searches;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // Private mode or blocked storage: keep the in-memory list for this visit.
  }
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Browser-local saved searches. Empty on the server. */
export function useSavedSearches() {
  const searches = useSyncExternalStore(subscribe, read, () => EMPTY);

  const save = useCallback((name: string, href: string) => {
    if (!isBoardHref(href)) {
      return;
    }
    const label = name.trim().slice(0, NAME_MAX) || "Saved search";
    const rest = read().filter((item) => item.href !== href);
    write([{ href, id: newId(), name: label }, ...rest].slice(0, MAX_SEARCHES));
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((item) => item.id !== id));
  }, []);

  const find = useCallback(
    (href: string) => searches.find((item) => item.href === href) ?? null,
    [searches]
  );

  return { find, remove, save, searches };
}
