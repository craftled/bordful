import { revalidateTag } from "next/cache";

export function revalidateReadTags(tags: string[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch {
      // CLI and migration runs have no Next incremental cache. A stale
      // five minute cache is acceptable there.
    }
  }
}
