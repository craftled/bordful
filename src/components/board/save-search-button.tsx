"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { useSavedSearches } from "@/components/board/saved-searches";
import { cn } from "@/lib/utils";

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const TEXT_BUTTON =
  "hover:text-foreground hidden h-7 shrink-0 items-center rounded-[6px] px-2 text-[13px] lg:inline-flex";

// "Save this search" in the toolbar: names the current filter URL and keeps
// it in this browser. The rail lists saved searches; nothing reaches the
// server.
export function SaveSearchButton({
  defaultName,
  href,
}: {
  defaultName: string;
  href: string;
}) {
  const { find, remove, save } = useSavedSearches();
  const [editing, setEditing] = useState(false);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const existing = find(href);
  const existingId = existing?.id ?? null;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEditing = useCallback(() => setEditing(true), []);
  const stopEditing = useCallback(() => setEditing(false), []);
  const onRemove = useCallback(() => {
    if (existingId) {
      remove(existingId);
    }
  }, [existingId, remove]);
  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      save(inputRef.current?.value ?? defaultName, href);
      setEditing(false);
    },
    [defaultName, href, save]
  );
  const onInputKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setEditing(false);
    }
  }, []);

  if (existing) {
    return (
      <button
        aria-pressed="true"
        className={cn(TEXT_BUTTON, "text-muted-foreground", FOCUS)}
        data-testid="save-search"
        onClick={onRemove}
        title="Remove from saved searches"
        type="button"
      >
        Saved search
      </button>
    );
  }

  if (!editing) {
    return (
      <button
        className={cn(TEXT_BUTTON, "text-subtle", FOCUS)}
        data-testid="save-search"
        onClick={startEditing}
        type="button"
      >
        Save this search
      </button>
    );
  }

  return (
    <form
      className="hidden shrink-0 items-center gap-1.5 lg:flex"
      onSubmit={onSubmit}
    >
      <label className="sr-only" htmlFor={inputId}>
        Name this search
      </label>
      <input
        className="bg-card text-foreground ring-line-strong focus:ring-ring/40 h-7 w-48 rounded-[6px] px-2 text-[13px] ring-1 outline-none ring-inset"
        defaultValue={defaultName}
        id={inputId}
        maxLength={60}
        onKeyDown={onInputKeyDown}
        ref={inputRef}
      />
      <button
        className={cn(
          "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-7 items-center rounded-[6px] px-2.5 text-[13px] font-medium",
          FOCUS
        )}
        type="submit"
      >
        Save
      </button>
      <button
        className={cn(
          "text-subtle hover:text-foreground inline-flex h-7 items-center rounded-[6px] px-1.5 text-[13px]",
          FOCUS
        )}
        onClick={stopEditing}
        type="button"
      >
        Cancel
      </button>
    </form>
  );
}
