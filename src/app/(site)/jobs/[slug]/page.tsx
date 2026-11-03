import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { BoardShell } from "@/components/board/board-shell";
import { JobPosting } from "@/components/board/job-detail";
import { isMarketingEnabled } from "@/config/flags";
import { resolveServerUrl } from "@/config/server-url";
import { buildJobPath, isPublicJobSlug } from "@/lib/board/paths";
import { metaDescription } from "@/lib/board/plaintext";
import { getSimilarJobs } from "@/lib/detail";
import {
  getBordfeedConnectionPublic,
  getJobBySlug,
  getSiteSettings,
} from "@/lib/read";
import { buildJobPostingJsonLd } from "@/lib/seo/job-posting";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isPublicJobSlug(slug)) {
    return { title: "Job" };
  }

  const job = await getJobBySlug(slug);
  if (!job) {
    return { title: "Job" };
  }

  const description = metaDescription(job.description);

  return {
    alternates: {
      canonical: `${resolveServerUrl()}${buildJobPath(job.slug)}`,
    },
    description: description.length > 0 ? description : undefined,
    robots: job.indexable ? undefined : { follow: true, index: false },
    title: job.title,
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isPublicJobSlug(slug)) {
    notFound();
  }

  const [job, settings, connection, nonce] = await Promise.all([
    getJobBySlug(slug),
    getSiteSettings(),
    getBordfeedConnectionPublic(),
    headers().then((value) => value.get("x-nonce") ?? undefined),
  ]);
  if (!job) {
    notFound();
  }

  // Sample jobs only exist on a board that has not connected a feed yet, so
  // they may appear in similar lists exactly when the board shows samples.
  const includeSamples = connection.state === "sample";
  // Similar jobs are optional: a failed read drops the section, not the page.
  const similarJobs = await getSimilarJobs(job, includeSamples).catch(
    (error: unknown) => {
      console.error(
        "similar jobs read failed",
        error instanceof Error ? error.name : "unknown"
      );
      return [];
    }
  );

  const jsonLd = job.indexable
    ? buildJobPostingJsonLd(job, {
        siteName: settings.name,
        siteUrl: resolveServerUrl(),
      })
    : null;

  return (
    <BoardShell>
      <JobPosting
        fields={settings.board.publicDetailFields}
        job={job}
        jsonLd={jsonLd}
        marketing={isMarketingEnabled()}
        nonce={nonce}
        postJob={settings.postJob}
        similarJobs={similarJobs}
      />
    </BoardShell>
  );
}
