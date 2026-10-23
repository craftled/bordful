import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";
import { Fragment } from "react";

import { JobBreadcrumb } from "@/components/board/job-breadcrumb";
import { factRows, JobFacts } from "@/components/board/job-facts";
import { PostJobCard } from "@/components/board/post-job-card";
import { SimilarJobs } from "@/components/board/similar-jobs";
import { StickyApply } from "@/components/board/sticky-apply";
import { httpUrl, jobApplyHref } from "@/lib/board/apply";
import { buildCompanyPath } from "@/lib/board/paths";
import { editorState } from "@/lib/board/plaintext";
import type {
  JobDetail,
  JobListItem,
  PublicDetailField,
} from "@/lib/read/types";

const META_FIELDS: readonly PublicDetailField[] = [
  "employmentType",
  "salary",
  "location",
];

export function JobPosting({
  fields,
  job,
  jsonLd,
  marketing,
  nonce,
  postJob,
  similarJobs,
}: {
  fields: readonly PublicDetailField[];
  job: JobDetail;
  jsonLd: Record<string, unknown> | null;
  marketing: boolean;
  nonce: string | undefined;
  postJob: { enabled: boolean; priceLabel: string; durationDays: number };
  similarJobs: readonly JobListItem[];
}) {
  const applyHref = jobApplyHref(job);
  const description = editorState(job.description);
  const website = httpUrl(job.company?.website?.trim() ?? "");
  const companyHref = job.companySlug
    ? buildCompanyPath(job.companySlug)
    : null;
  const meta = factRows(job, fields).filter((row) =>
    META_FIELDS.includes(row.field)
  );

  return (
    <div className="space-y-6">
      <JobBreadcrumb marketing={marketing} title={job.title} />
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_17.5rem] md:items-start md:gap-8">
        <article className="min-w-0 space-y-6 pb-24 md:pb-0">
          <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <h1
                className="font-[var(--font-heading)] font-semibold text-2xl"
                data-testid="job-title"
              >
                {job.title}
              </h1>
              {companyHref ? (
                <Link
                  className="text-base hover:underline"
                  data-testid="job-company"
                  href={companyHref}
                >
                  {job.companyName}
                </Link>
              ) : (
                <p className="text-base" data-testid="job-company">
                  {job.companyName}
                </p>
              )}
              {meta.length > 0 ? (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
                  {meta.map((row, index) => (
                    <Fragment key={row.field}>
                      {index > 0 ? <span aria-hidden="true">•</span> : null}
                      <span>{row.value}</span>
                    </Fragment>
                  ))}
                </p>
              ) : null}
            </div>
            {applyHref ? (
              <a
                className="hidden h-10 shrink-0 items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-4 font-medium text-primary-foreground text-sm hover:bg-primary/90 md:inline-flex"
                data-testid="job-apply-header"
                href={applyHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                Apply Now
                <span className="sr-only"> to {job.title}</span>
              </a>
            ) : null}
          </header>
          <div className="bordful-prose" data-testid="job-description">
            {description ? <RichText data={description} /> : null}
          </div>
          {applyHref ? (
            <a
              className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] bg-primary px-4 font-medium text-primary-foreground text-sm hover:bg-primary/90"
              data-testid="job-apply"
              href={applyHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              Apply Now
            </a>
          ) : null}
          {website || companyHref ? (
            <section
              aria-labelledby="about-company-title"
              className="space-y-2 rounded-lg border border-border bg-background p-5"
            >
              <h2 className="font-semibold text-base" id="about-company-title">
                About {job.companyName}
              </h2>
              {website ? (
                <a
                  className="block break-all text-sm hover:underline"
                  href={website}
                  rel="noopener noreferrer"
                >
                  {website}
                </a>
              ) : null}
              {companyHref ? (
                <Link
                  className="block text-sm hover:underline"
                  href={companyHref}
                >
                  View company
                </Link>
              ) : null}
            </section>
          ) : null}
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
        <aside className="mt-8 space-y-6 md:mt-0">
          <JobFacts fields={fields} job={job} />
          {postJob.enabled ? (
            <PostJobCard
              durationDays={postJob.durationDays}
              priceLabel={postJob.priceLabel}
            />
          ) : null}
          <SimilarJobs jobs={similarJobs} />
        </aside>
      </div>
      {applyHref ? <StickyApply href={applyHref} /> : null}
    </div>
  );
}
