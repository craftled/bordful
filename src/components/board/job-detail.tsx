import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";

import { JobFacts } from "@/components/board/job-facts";
import { StickyApply } from "@/components/board/sticky-apply";
import { httpUrl, jobApplyHref } from "@/lib/board/apply";
import { buildCompanyPath } from "@/lib/board/paths";
import { editorState } from "@/lib/board/plaintext";
import type { JobDetail, PublicDetailField } from "@/lib/read/types";

export function JobPosting({
  fields,
  job,
  jsonLd,
  nonce,
}: {
  fields: readonly PublicDetailField[];
  job: JobDetail;
  jsonLd: Record<string, unknown> | null;
  nonce: string | undefined;
}) {
  const applyHref = jobApplyHref(job);
  const description = editorState(job.description);
  const website = httpUrl(job.company?.website?.trim() ?? "");
  const companyHref = job.companySlug
    ? buildCompanyPath(job.companySlug)
    : null;

  return (
    <article className="space-y-6 pb-24">
      <header className="space-y-2">
        <h1
          className="font-[var(--font-heading)] font-semibold text-3xl"
          data-testid="job-title"
        >
          {job.title}
        </h1>
        {companyHref ? (
          <Link data-testid="job-company" href={companyHref}>
            {job.companyName}
          </Link>
        ) : (
          <p data-testid="job-company">{job.companyName}</p>
        )}
      </header>
      <JobFacts fields={fields} job={job} />
      <div data-testid="job-description">
        {description ? <RichText data={description} /> : null}
      </div>
      {applyHref ? (
        <a
          className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-primary px-4 font-medium text-primary-foreground text-sm"
          data-testid="job-apply"
          href={applyHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          Apply
        </a>
      ) : null}
      {applyHref ? <StickyApply href={applyHref} /> : null}
      <section className="space-y-2 border-border border-t pt-6">
        <h2 className="font-semibold text-lg">About {job.companyName}</h2>
        {website ? (
          <a href={website} rel="noopener noreferrer">
            {website}
          </a>
        ) : null}
        {companyHref ? <Link href={companyHref}>View company</Link> : null}
      </section>
      {jsonLd ? (
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is data and "<" is escaped
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c"),
          }}
          nonce={nonce}
          type="application/ld+json"
        />
      ) : null}
    </article>
  );
}
