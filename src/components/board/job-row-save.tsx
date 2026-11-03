"use client";

import { useCallback } from "react";

import { HINT_CLASS } from "@/components/board/rail-styles";
import { useJobList } from "@/components/board/saved-jobs";
import { cn } from "@/lib/utils";

// The row's "S Save" hint doubles as a button, so mouse users can save
// without the keyboard. The saved state shows after hydration.
export function RowSaveButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const saved = useJobList("saved");
  const on = saved.has(slug);
  const { toggle } = saved;
  const onClick = useCallback(() => toggle(slug), [slug, toggle]);

  return (
    <button
      aria-label={on ? `Remove ${title} from saved jobs` : `Save ${title}`}
      aria-pressed={on}
      className={cn(
        HINT_CLASS,
        "hover:text-foreground focus-visible:outline-ring relative z-10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1"
      )}
      data-testid="job-row-save"
      onClick={onClick}
      type="button"
    >
      <kbd className="font-sans">S</kbd>
      {on ? "Saved" : "Save"}
    </button>
  );
}
