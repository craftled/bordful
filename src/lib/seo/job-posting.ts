import type { JobDetail } from "@/lib/read/types";

export function buildJobPostingJsonLd(
  _job: JobDetail,
  _ctx: { siteUrl: string; siteName: string }
): Record<string, unknown> | null {
  return null;
}
