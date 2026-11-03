import { revalidateTag } from "next/cache";

// Writes must show up on the next request. The "max" profile is
// stale-while-revalidate, so the first read after a save still gets old data.
export function revalidateReadTags(tags: string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch {
      // CLI and migration runs have no Next incremental cache. A stale
      // five minute cache is acceptable there.
    }
  }
}
