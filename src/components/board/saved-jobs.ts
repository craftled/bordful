"use client";

import { useCallback, useSyncExternalStore } from "react";

// Saved and applied jobs live in the visitor's browser only. Nothing is sent
// to the server, so the board needs no accounts for these lists.
export type JobListKind = "applied" | "saved";

const STORAGE_KEYS: Record<JobListKind, string> = {
  applied: "bordful:applied-jobs",
  saved: "bordful:saved-jobs",
};

// Per-slug details kept beside the slug list under their own key, so the
// list itself stays the plain string[] older builds read and write.
const META_KEYS: Record<JobListKind, string> = {
  applied: "bordful:applied-jobs-meta",
  saved: "bordful:saved-jobs-meta",
};

/** What the saved page needs to show a job after it leaves the board. */
export interface JobSnapshot {
  companyName: string;
  location: string;
  salary: string;
  title: string;
  validThrough: string | null;
}

export interface JobListEntryMeta {
  /** Epoch ms when this browser added the job. Missing for older saves. */
  addedAt?: number;
  snapshot?: JobSnapshot;
}

export type JobListMeta = Readonly<Record<string, JobListEntryMeta>>;

const EMPTY: readonly string[] = Object.freeze([]);
const EMPTY_META: JobListMeta = Object.freeze({});
const listeners = new Set<() => void>();
const cache = new Map<JobListKind, readonly string[]>();
const metaCache = new Map<JobListKind, JobListMeta>();

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSnapshot(value: unknown): JobSnapshot | undefined {
  if (!isRecord(value) || typeof value.title !== "string") {
    return;
  }
  const text = (key: string) =>
    typeof value[key] === "string" ? (value[key] as string) : "";
  return {
    companyName: text("companyName"),
    location: text("location"),
    salary: text("salary"),
    title: value.title,
    validThrough:
      typeof value.validThrough === "string" ? value.validThrough : null,
  };
}

/** Parses stored meta, dropping anything malformed. Exported for tests. */
export function parseJobListMeta(raw: string | null): JobListMeta {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? "{}");
  } catch {
    return EMPTY_META;
  }
  if (!isRecord(parsed)) {
    return EMPTY_META;
  }

  const meta: Record<string, JobListEntryMeta> = {};
  for (const [slug, value] of Object.entries(parsed)) {
    if (!isRecord(value)) {
      continue;
    }
    const entry: JobListEntryMeta = {};
    if (typeof value.addedAt === "number" && Number.isFinite(value.addedAt)) {
      entry.addedAt = value.addedAt;
    }
    const snapshot = parseSnapshot(value.snapshot);
    if (snapshot) {
      entry.snapshot = snapshot;
    }
    meta[slug] = entry;
  }
  return meta;
}

function readMeta(kind: JobListKind): JobListMeta {
  const cached = metaCache.get(kind);
  if (cached) {
    return cached;
  }

  let value = EMPTY_META;
  try {
    value = parseJobListMeta(window.localStorage.getItem(META_KEYS[kind]));
  } catch {
    value = EMPTY_META;
  }
  metaCache.set(kind, value);
  return value;
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function writeMeta(kind: JobListKind, meta: JobListMeta): void {
  metaCache.set(kind, meta);
  try {
    window.localStorage.setItem(META_KEYS[kind], JSON.stringify(meta));
  } catch {
    // Same as the list: keep it in memory for this visit.
  }
}

function write(kind: JobListKind, slugs: readonly string[]): void {
  cache.set(kind, slugs);
  try {
    window.localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(slugs));
  } catch {
    // Private mode or blocked storage: keep the in-memory list for this visit.
  }
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === STORAGE_KEYS.saved ||
      event.key === STORAGE_KEYS.applied ||
      event.key === META_KEYS.saved ||
      event.key === META_KEYS.applied
    ) {
      cache.clear();
      metaCache.clear();
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
        const meta = readMeta(kind);
        writeMeta(kind, {
          ...meta,
          [slug]: { ...meta[slug], addedAt: Date.now() },
        });
        write(kind, [slug, ...current]);
      }
    },
    [kind]
  );

  const remove = useCallback(
    (slug: string) => {
      const meta = readMeta(kind);
      if (slug in meta) {
        const { [slug]: _dropped, ...rest } = meta;
        writeMeta(kind, rest);
      }
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

function sameSnapshot(left: JobSnapshot | undefined, right: JobSnapshot) {
  return (
    left !== undefined &&
    left.companyName === right.companyName &&
    left.location === right.location &&
    left.salary === right.salary &&
    left.title === right.title &&
    left.validThrough === right.validThrough
  );
}

/**
 * When each job joined a browser-local list, plus the last details seen for
 * it, so the saved page can still name a job after it closes. Empty on the
 * server and for jobs saved before this was kept.
 */
export function useJobListMeta(kind: JobListKind) {
  const meta = useSyncExternalStore(
    subscribe,
    () => readMeta(kind),
    () => EMPTY_META
  );

  // Records the latest details for jobs still in the list. A no-op when
  // nothing changed, so it is safe to call on every render.
  const remember = useCallback(
    (snapshots: ReadonlyArray<{ slug: string; snapshot: JobSnapshot }>) => {
      const current = readMeta(kind);
      const listed = new Set(read(kind));
      let next: Record<string, JobListEntryMeta> | null = null;
      for (const { slug, snapshot } of snapshots) {
        if (
          !listed.has(slug) ||
          sameSnapshot(current[slug]?.snapshot, snapshot)
        ) {
          continue;
        }
        next ??= { ...current };
        next[slug] = { ...current[slug], snapshot };
      }
      if (next) {
        writeMeta(kind, next);
        notify();
      }
    },
    [kind]
  );

  return { meta, remember };
}
