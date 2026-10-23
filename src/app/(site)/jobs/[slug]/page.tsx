import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { BoardShell } from "@/components/board/board-shell";
import { JobPosting } from "@/components/board/job-detail";
import { resolveServerUrl } from "@/config/server-url";
import { buildJobPath, isPublicJobSlug } from "@/lib/board/paths";
import { metaDescription } from "@/lib/board/plaintext";
import { getJobBySlug, getSiteSettings } from "@/lib/read";
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

  const [job, settings, nonce] = await Promise.all([
    getJobBySlug(slug),
    getSiteSettings(),
    headers().then((value) => value.get("x-nonce") ?? undefined),
  ]);
  if (!job) {
    notFound();
  }

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
        nonce={nonce}
      />
    </BoardShell>
  );
}
