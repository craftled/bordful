import type { JobOrigin } from "@/lib/domain/job-vocab";

export function isIndexable(job: { origin: JobOrigin }): boolean {
  return job.origin !== "bordfeed_sample";
}
