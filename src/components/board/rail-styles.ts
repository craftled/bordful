import { cn } from "@/lib/utils";

// Shared by the server rail and its client sections (saved lists, searches).
export const RAIL_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function railLinkClass(active: boolean): string {
  return cn(
    "flex h-[30px] shrink-0 items-center justify-between gap-2 rounded-[6px] px-2 text-[13px] leading-[18px] transition-colors",
    active
      ? "bg-card text-foreground ring-line font-medium shadow-xs ring-1"
      : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
    RAIL_FOCUS
  );
}

export const RAIL_COUNT =
  "text-subtle shrink-0 text-[12px] leading-4 tabular-nums";

export const RAIL_HEADING =
  "text-subtle px-2 pb-1 text-[11px] leading-[14px] font-medium";
