"use client";

import { useCallback, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import {
  nextThemePreference,
  parseThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "./theme-preference";

const listeners = new Set<() => void>();

function read(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return parseThemePreference(document.documentElement.dataset.theme);
  }
}

function apply(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === "system") {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = preference;
  }
  try {
    if (preference === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    }
  } catch {
    // Blocked storage: the choice holds for this page only.
  }
  for (const listener of listeners) {
    listener();
  }
}

function serverSnapshot(): ThemePreference {
  return "system";
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) {
      apply(parseThemePreference(event.newValue));
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const LABELS: Record<ThemePreference, string> = {
  dark: "Dark theme",
  light: "Light theme",
  system: "System theme",
};

function Icon({ preference }: { preference: ThemePreference }) {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      viewBox="0 0 20 20"
    >
      {preference === "light" ? (
        <>
          <circle cx="10" cy="10" r="3.5" />
          <path d="M10 2.5v1.5M10 16v1.5M2.5 10H4M16 10h1.5M4.7 4.7l1 1M14.3 14.3l1 1M4.7 15.3l1-1M14.3 5.7l1-1" />
        </>
      ) : null}
      {preference === "dark" ? (
        <path d="M16 12.2A6.5 6.5 0 0 1 7.8 4a6.5 6.5 0 1 0 8.2 8.2z" />
      ) : null}
      {preference === "system" ? (
        <>
          <rect height="10" rx="1.5" width="14" x="3" y="3.5" />
          <path d="M7.5 16.5h5M10 13.5v3" />
        </>
      ) : null}
    </svg>
  );
}

/** Cycles the page theme: system, light, dark. Saved in this browser. */
export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore(subscribe, read, serverSnapshot);
  const next = nextThemePreference(preference);
  const onClick = useCallback(() => apply(next), [next]);

  return (
    <button
      aria-label={`${LABELS[preference]}. Switch to ${LABELS[next].toLowerCase()}`}
      className={cn(
        "text-muted-foreground hover:text-foreground focus-visible:outline-ring flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        className
      )}
      data-testid="theme-toggle"
      onClick={onClick}
      title={LABELS[preference]}
      type="button"
    >
      <Icon preference={preference} />
    </button>
  );
}
