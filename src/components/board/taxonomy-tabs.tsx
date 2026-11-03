import Link from "next/link";
import type { TaxonomyKind } from "@/lib/board/paths";
import { cn } from "@/lib/utils";

export const TAXONOMY_INDEX_PATH: Record<TaxonomyKind, string> = {
  language: "/jobs/languages",
  level: "/jobs/levels",
  location: "/jobs/locations",
  type: "/jobs/types",
};

export const TAXONOMY_INDEX_LABEL: Record<TaxonomyKind, string> = {
  language: "Languages",
  level: "Levels",
  location: "Locations",
  type: "Types",
};

const TABS: { kind: TaxonomyKind; label: string }[] = [
  { kind: "location", label: "Location" },
  { kind: "type", label: "Type" },
  { kind: "level", label: "Level" },
  { kind: "language", label: "Language" },
];

// Real links between the four index pages: pills on a phone, a segmented
// control from md up.
export function TaxonomyTabs({
  active,
  compact = false,
}: {
  active: TaxonomyKind;
  // Paper's type, level and language indexes use a 16px label line (24px
  // tabs); the locations index uses 19px (27px tabs).
  compact?: boolean;
}) {
  return (
    <nav
      aria-label="Browse jobs by"
      className="md:bg-tag flex gap-[6px] overflow-x-auto md:gap-[2px] md:rounded-[8px] md:p-[2px]"
    >
      {TABS.map((tab) => {
        const current = tab.kind === active;
        return (
          <Link
            aria-current={current ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-3 py-[7px] text-[13px] leading-4 font-medium ring-1 md:rounded-[6px] md:px-3 md:py-1 md:text-[13px] md:ring-0",
              compact ? null : "md:leading-[19px]",
              current
                ? "bg-primary text-primary-foreground ring-primary md:bg-card md:text-foreground md:shadow-[0_0_0_1px_var(--line),0_1px_2px_rgb(0_0_0/0.05)]"
                : "bg-card text-foreground ring-line-strong md:text-muted-foreground md:hover:text-foreground md:bg-transparent md:font-normal"
            )}
            data-testid="taxonomy-tab"
            href={TAXONOMY_INDEX_PATH[tab.kind]}
            key={tab.kind}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
