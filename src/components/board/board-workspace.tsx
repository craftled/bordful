"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { JobPreview } from "@/components/board/job-preview";
import { useJobList } from "@/components/board/saved-jobs";
import type { JobListItem } from "@/lib/read/types";
import { cn } from "@/lib/utils";

// The preview panel needs the xl layout (rail, list and a right column).
const WIDE_QUERY = "(min-width: 80rem)";
const ROW_SELECTOR = '[data-testid="job-row"]';
const ROW_LINK_SELECTOR = '[data-testid="job-row-link"]';

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

function hasModifier(event: KeyboardEvent | MouseEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}

function isWide(): boolean {
  return window.matchMedia(WIDE_QUERY).matches;
}

function rowsIn(container: HTMLElement | null): HTMLElement[] {
  return container
    ? [...container.querySelectorAll<HTMLElement>(ROW_SELECTOR)]
    : [];
}

function rowFor(
  container: HTMLElement | null,
  slug: string | null
): HTMLElement | null {
  return rowsIn(container).find((row) => row.dataset.jobSlug === slug) ?? null;
}

function focusRow(row: HTMLElement) {
  row.querySelector<HTMLElement>(ROW_LINK_SELECTOR)?.focus();
  row.scrollIntoView({ block: "nearest" });
}

// The row a click should preview, or null when the click belongs to the
// browser: a modified or middle click, a narrow screen, or another link or
// button inside the row (company link, save hint).
function previewTarget(event: MouseEvent): HTMLElement | null {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.shiftKey ||
    hasModifier(event) ||
    !isWide()
  ) {
    return null;
  }
  const { target } = event;
  if (!(target instanceof Element) || target.closest("button")) {
    return null;
  }
  const anchor = target.closest("a");
  if (anchor && !anchor.matches(ROW_LINK_SELECTOR)) {
    return null;
  }
  return target.closest<HTMLElement>(ROW_SELECTOR);
}

// The row J/K lands on, starting from the focused row, then the open one.
function nextRow(
  container: HTMLElement | null,
  selected: string | null,
  direction: 1 | -1
): HTMLElement | null {
  const rows = rowsIn(container);
  if (rows.length === 0) {
    return null;
  }
  const focused = document.activeElement?.closest<HTMLElement>(ROW_SELECTOR);
  const from = focused
    ? rows.indexOf(focused)
    : rows.findIndex((row) => row.dataset.jobSlug === selected);
  if (from < 0) {
    return direction === 1 ? (rows[0] ?? null) : (rows.at(-1) ?? null);
  }
  const index = Math.min(Math.max(from + direction, 0), rows.length - 1);
  return rows[index] ?? null;
}

// The slug S saves: the focused row, else the open preview.
function saveTarget(
  container: HTMLElement | null,
  previewSlug: string | null
): string | null {
  const focused = document.activeElement?.closest<HTMLElement>(ROW_SELECTOR);
  if (focused && container?.contains(focused)) {
    return focused.dataset.jobSlug ?? null;
  }
  return previewSlug;
}

// J/K move between rows (and the preview follows), S saves, Esc closes the
// preview. Returns whether the key was used.
function handleBoardKey(
  key: string,
  board: {
    close: () => void;
    container: HTMLElement | null;
    openSlug: string | null;
    select: (slug: string | null) => void;
    toggleSaved: (slug: string) => void;
  }
): boolean {
  if (key === "j" || key === "k") {
    const row = nextRow(board.container, board.openSlug, key === "j" ? 1 : -1);
    if (!row) {
      return false;
    }
    focusRow(row);
    if (board.openSlug !== null) {
      board.select(row.dataset.jobSlug ?? null);
    }
    return true;
  }
  if (key === "s") {
    const slug = saveTarget(board.container, board.openSlug);
    if (slug) {
      board.toggleSaved(slug);
    }
    return slug !== null;
  }
  if (key === "escape" && board.openSlug !== null) {
    board.close();
    return true;
  }
  return false;
}

// The board's list area: rail, list and right column, plus the job preview.
// Rows stay real links, so without JS (or with Cmd/Ctrl/Shift-click, or
// below xl) they open the job page. With JS on a wide screen a plain click,
// or Enter on a focused row, opens the job in the right column instead; a
// second Enter opens the full page. J/K move, S saves, Esc closes.
export function BoardWorkspace({
  alertsEnabled = false,
  aside,
  className,
  jobs,
  list,
  now,
  offset = 0,
  openClassName,
  preview = true,
  rail,
  total,
}: {
  // Shows the "Get roles like this" card in the preview.
  alertsEnabled?: boolean;
  aside?: ReactNode;
  className: string;
  jobs: JobListItem[];
  list: ReactNode;
  now: number;
  // Rows on earlier pages, for the "N of M" counter.
  offset?: number;
  openClassName: string;
  preview?: boolean;
  rail?: ReactNode;
  total: number;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const saved = useJobList("saved");
  const bySlug = useMemo(
    () => new Map(jobs.map((item) => [item.slug, item])),
    [jobs]
  );
  const current = selected ? (bySlug.get(selected) ?? null) : null;
  const isOpen = preview && current !== null;
  const openSlug = isOpen ? selected : null;

  // The selected row is styled through data-selected on its <li>.
  useEffect(() => {
    for (const row of rowsIn(listRef.current)) {
      if (openSlug !== null && row.dataset.jobSlug === openSlug) {
        row.dataset.selected = "true";
      } else {
        delete row.dataset.selected;
      }
    }
  }, [openSlug]);

  // A row click (or Enter, which clicks a focused link) previews the job.
  useEffect(() => {
    const container = listRef.current;
    if (!(container && preview)) {
      return;
    }
    function onClick(event: MouseEvent) {
      const row = previewTarget(event);
      const slug = row?.dataset.jobSlug;
      if (!(row && slug && bySlug.has(slug))) {
        return;
      }
      // Keyboard Enter on the row already open goes to the full page.
      if (event.detail === 0 && slug === openSlug) {
        return;
      }
      event.preventDefault();
      setSelected(slug);
      row.querySelector<HTMLElement>(ROW_LINK_SELECTOR)?.focus();
    }
    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [bySlug, openSlug, preview]);

  const close = useCallback(() => {
    const row = rowFor(listRef.current, openSlug);
    setSelected(null);
    if (row) {
      focusRow(row);
    }
  }, [openSlug]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        hasModifier(event) ||
        isTyping(event.target)
      ) {
        return;
      }
      const handled = handleBoardKey(event.key.toLowerCase(), {
        close,
        container: listRef.current,
        openSlug,
        select: setSelected,
        toggleSaved: saved.toggle,
      });
      if (handled) {
        event.preventDefault();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, openSlug, saved.toggle]);

  // Leaving the xl layout drops the preview; the rows are plain links there.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const media = window.matchMedia(WIDE_QUERY);
    const onChange = () => {
      if (!media.matches) {
        setSelected(null);
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [isOpen]);

  const goTo = useCallback((target: JobListItem) => {
    setSelected(target.slug);
    rowFor(listRef.current, target.slug)?.scrollIntoView({ block: "nearest" });
  }, []);

  const index = current ? jobs.indexOf(current) : -1;
  const prev = index > 0 ? jobs[index - 1] : undefined;
  const next = index >= 0 ? jobs[index + 1] : undefined;
  const onPrev = useCallback(() => {
    if (prev) {
      goTo(prev);
    }
  }, [goTo, prev]);
  const onNext = useCallback(() => {
    if (next) {
      goTo(next);
    }
  }, [goTo, next]);

  return (
    <div className={cn(className, isOpen && openClassName)}>
      {rail}
      <div
        className={cn(
          "min-w-0",
          // With a job open, the other rows step back.
          isOpen &&
            "xl:[&_[data-testid=job-row]:not([data-selected=true])]:opacity-[0.62]"
        )}
        ref={listRef}
      >
        {list}
      </div>
      {aside ? <div className={cn(isOpen && "xl:hidden")}>{aside}</div> : null}
      {isOpen && current ? (
        <div className="hidden py-2 pr-2 xl:block">
          <div className="sticky top-2 flex h-[calc(100dvh-1rem)] flex-col">
            <JobPreview
              alertsEnabled={alertsEnabled}
              index={offset + index + 1}
              job={current}
              jobs={jobs}
              key={current.slug}
              now={now}
              onClose={close}
              onNext={next ? onNext : null}
              onPrev={prev ? onPrev : null}
              onSelect={goTo}
              total={total}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
