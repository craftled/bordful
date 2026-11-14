import type { JobTextEntry } from "@/lib/read/queries";

// Ids of jobs whose summary or skills contain q, case-insensitively and as a
// literal substring (the same rule as the card match in filter.ts).
export function matchTextIndex(
  index: readonly JobTextEntry[],
  q: string
): string[] {
  const needle = q.trim().toLowerCase();
  if (needle.length === 0) {
    return [];
  }

  return index
    .filter((entry) => entry.text.includes(needle))
    .map((entry) => entry.id);
}
