import type { JobListItem } from "@/lib/read/types";

export const SIMILAR_JOBS_LIMIT = 5;

export type SimilarSource = Pick<
  JobListItem,
  | "categories"
  | "companyName"
  | "employmentType"
  | "id"
  | "locationDisplay"
  | "origin"
  | "publishedAt"
  | "title"
>;

// Title and company decide duplicates: the same posting can arrive twice with
// different ids (for example after a feed re-sync).
function dedupeKey(job: Pick<SimilarSource, "companyName" | "title">): string {
  return `${job.title.trim().toLowerCase()}\u0000${job.companyName.trim().toLowerCase()}`;
}

function locationKey(job: Pick<SimilarSource, "locationDisplay">): string {
  return (job.locationDisplay ?? "").trim().toLowerCase();
}

function sharedCategories(a: string[], b: string[]): number {
  const other = new Set(b.map((value) => value.toLowerCase()));
  return a.filter((value) => other.has(value.toLowerCase())).length;
}

export function rankSimilarJobs<T extends SimilarSource>(
  current: SimilarSource,
  candidates: readonly T[],
  options: { includeSamples: boolean; limit?: number }
): T[] {
  const location = locationKey(current);
  if (location.length === 0) {
    return [];
  }

  const scored = candidates
    .filter((job) => job.id !== current.id)
    .filter((job) => options.includeSamples || job.origin !== "bordfeed_sample")
    .filter((job) => locationKey(job) === location)
    .map((job) => {
      const categories = sharedCategories(job.categories, current.categories);
      const sameType =
        current.employmentType !== null &&
        job.employmentType === current.employmentType;
      return { job, score: categories + (sameType ? 1 : 0) };
    })
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return (b.job.publishedAt ?? "").localeCompare(a.job.publishedAt ?? "");
  });

  const seenIds = new Set<string>([current.id]);
  const seenKeys = new Set<string>([dedupeKey(current)]);
  const picked: T[] = [];
  for (const { job } of scored) {
    const key = dedupeKey(job);
    if (seenIds.has(job.id) || seenKeys.has(key)) {
      continue;
    }
    seenIds.add(job.id);
    seenKeys.add(key);
    picked.push(job);
    if (picked.length >= (options.limit ?? SIMILAR_JOBS_LIMIT)) {
      break;
    }
  }

  return picked;
}
