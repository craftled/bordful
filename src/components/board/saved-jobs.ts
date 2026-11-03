"use client";

import { useCallback, useSyncExternalStore } from "react";

// Saved and applied jobs live in the visitor's browser only. Nothing is sent
// to the server, so the board needs no accounts for these lists.
export type JobListKind = "applied" | "saved";

const STORAGE_KEYS: Record<JobListKind, string> = {
  applied: "bordful:applied-jobs",
  saved: "bordful:saved-jobs",
};

const EMPTY: readonly string[] = Object.freeze([]);
const listeners = new Set<() => void>();
const cache = new Map<JobListKind, readonly string[]>();

function read(kind: JobListKind): readonly string[] {
  const cached = cache.get(kind);
  if (cached) {
    return cached;
  }

  let value: readonly string[] = EMPTY;
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(STORAGE_KEYS[kind]) ?? "[]"
    );
    if (Array.isArray(parsed)) {
      value = parsed.filter((slug): slug is string => typeof slug === "string");
    }
  } catch {
    value = EMPTY;
  }

  cache.set(kind, value);
  return value;
}

function write(kind: JobListKind, slugs: readonly string[]): void {
  cache.set(kind, slugs);
  try {
    window.localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(slugs));
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
    if (
      event.key === STORAGE_KEYS.saved ||
      event.key === STORAGE_KEYS.applied
    ) {
      cache.clear();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Slugs in a browser-local job list, plus helpers to change it. Empty on the server. */
export function useJobList(kind: JobListKind) {
  const slugs = useSyncExternalStore(
    subscribe,
    () => read(kind),
    () => EMPTY
  );

  const has = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  const add = useCallback(
    (slug: string) => {
      const current = read(kind);
      if (!current.includes(slug)) {
        write(kind, [slug, ...current]);
      }
    },
    [kind]
  );

  const remove = useCallback(
    (slug: string) => {
      write(
        kind,
        read(kind).filter((item) => item !== slug)
      );
    },
    [kind]
  );

  const toggle = useCallback(
    (slug: string) => {
      if (read(kind).includes(slug)) {
        remove(slug);
      } else {
        add(slug);
      }
    },
    [add, kind, remove]
  );

  return { add, has, remove, slugs, toggle };
}
