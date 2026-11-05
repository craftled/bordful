import { RichText } from "@payloadcms/richtext-lexical/react";
import Link from "next/link";

import {
  JobApplyLink,
  JobSaveButton,
  JobShareCard,
} from "@/components/board/job-actions";
import {
  categoryCrumb,
  JobBreadcrumb,
  locationCrumb,
} from "@/components/board/job-breadcrumb";
import { dropBlankParagraphs } from "@/components/board/job-description";
import { JobFacts } from "@/components/board/job-facts";
import { PostJobCard } from "@/components/board/post-job-card";
import { RelativeTime } from "@/components/board/relative-time";
import { SimilarJobs } from "@/components/board/similar-jobs";
import { StickyApply } from "@/components/board/sticky-apply";
import { httpUrl, jobApplyHref } from "@/lib/board/apply";
import { bulletLinesToLists } from "@/lib/board/bullet-lists";
import { formatRelativePosted, formatShortDate } from "@/lib/board/format";
import { buildCompanyPath } from "@/lib/board/paths";
import { editorState } from "@/lib/board/plaintext";
import type {
  CompanySummary,
  JobDetail,
  JobListItem,
  PublicDetailField,
} from "@/lib/read/types";
import { cn } from "@/lib/utils";

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

const WWW_PREFIX = /^www\./u;

function websiteHost(url: string): string {
  try {
    return new URL(url).hostname.replace(WWW_PREFIX, "");
  } catch {
    return url;
  }
}

function companyLine(
  company: CompanySummary | null,
  website: string | null
): string {
  const parts = [
    company?.industry?.trim() ?? "",
    company?.headcount
      ? `${company.headcount.toLocaleString("en-US")} people`
      : "",
    company?.domain?.trim() || (website ? websiteHost(website) : ""),
  ];
  return parts.filter((part) => part.length > 0).join(" · ");
}

function postedDate(iso: string): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Date(parsed).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
}

function Monogram({ name, size }: { name: string; size: "lg" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={
        size === "lg"
          ? "bg-logo-tile text-muted-foreground md:bg-primary md:text-primary-foreground flex size-11 shrink-0 items-center justify-center rounded-lg text-[13px] leading-4 font-semibold md:size-10 md:rounded-[10px] md:text-[17px] md:leading-5"
          : "bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg text-[14px] leading-4 font-semibold"
      }
    >
      {initial(name)}
    </span>
  );
}

const RAIL_CARD =
  "bg-card ring-line flex flex-col gap-3 rounded-[14px] p-[18px] ring-1 ring-inset";
const RAIL_BUTTON =
  "bg-card ring-line-strong hover:bg-selected inline-flex h-7 shrink-0 items-center rounded-lg px-2.5 text-[13px] leading-[18px] font-medium ring-1 ring-inset";

function AboutCompany({
  companyHref,
  job,
  openRoles,
  website,
}: {
  companyHref: string | null;
  job: JobDetail;
  openRoles: number;
  website: string | null;
}) {
  const { company } = job;
  const rows = [
    { label: "Industry", value: company?.industry?.trim() ?? "" },
    {
      label: "Team",
      value: company?.headcount
        ? `${company.headcount.toLocaleString("en-US")} people`
        : "",
    },
    { label: "Based in", value: company?.location?.trim() ?? "" },
    { label: "Open roles", value: openRoles > 0 ? String(openRoles) : "" },
  ].filter((row) => row.value.length > 0);

  return (
    <section aria-labelledby="about-company-title" className={RAIL_CARD}>
      <div className="flex items-center gap-2.5">
        <Monogram name={job.companyName} size="md" />
        <h2
          className="text-foreground min-w-0 text-[15px] leading-5 font-medium"
          id="about-company-title"
        >
          About {job.companyName}
        </h2>
      </div>
      {rows.length > 0 ? (
        <dl className="flex flex-col gap-3 text-[13px] leading-[18px]">
          {rows.map((row) => (
            <div className="flex justify-between gap-4" key={row.label}>
              <dt className="text-subtle shrink-0">{row.label}</dt>
              <dd className="text-foreground min-w-0 text-right font-medium">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {companyHref ? (
          <Link
            className={cn(RAIL_BUTTON, "max-w-full min-w-0 shrink")}
            href={companyHref}
          >
            <span className="truncate">All {job.companyName} jobs</span>
          </Link>
        ) : null}
        {website ? (
          <a
            className={RAIL_BUTTON}
            href={website}
            rel="noopener noreferrer"
            target="_blank"
          >
            Website<span aria-hidden="true">&nbsp;↗</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}

function AlertCard() {
  return (
    <section aria-labelledby="job-alert-title" className={RAIL_CARD}>
      <h2
        className="text-foreground text-[14px] leading-[18px] font-medium"
        id="job-alert-title"
      >
        Get roles like this
      </h2>
      <p className="text-muted-foreground text-[13px] leading-[19px]">
        New jobs from this board, sent to you by email.
      </p>
      <Link
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-7 w-fit items-center rounded-lg px-2.5 text-[13px] leading-[18px] font-medium"
        href="/alerts"
      >
        Create alert
      </Link>
    </section>
  );
}

function Letterhead({
  companyHref,
  job,
  now,
  website,
}: {
  companyHref: string | null;
  job: JobDetail;
  now: number;
  website: string | null;
}) {
  const subline = companyLine(job.company, website);
  const nameClass =
    "text-foreground text-[15px] leading-[18px] font-medium md:leading-5";

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5 md:gap-3">
        <Monogram name={job.companyName} size="lg" />
        <div className="flex min-w-0 flex-col">
          {companyHref ? (
            <Link
              className={`${nameClass} w-fit hover:underline`}
              data-testid="job-company"
              href={companyHref}
            >
              {job.companyName}
            </Link>
          ) : (
            <p className={nameClass} data-testid="job-company">
              {job.companyName}
            </p>
          )}
          {subline ? (
            <p className="text-subtle truncate text-[13px] leading-4 md:leading-[18px]">
              {subline}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-5 md:gap-2.5">
        <h1
          className="text-foreground text-[30px] leading-9 font-medium tracking-[-0.03em] md:text-[40px] md:leading-[46px] md:tracking-[-0.025em]"
          data-testid="job-title"
        >
          {job.title}
        </h1>
        <PostedLine job={job} now={now} />
      </div>
    </header>
  );
}

function PostedLine({ job, now }: { job: JobDetail; now: number }) {
  const { featured, publishedAt } = job;
  const postedAgo = publishedAt ? formatRelativePosted(publishedAt, now) : "";
  const postedOn = publishedAt ? postedDate(publishedAt) : "";
  if (!(featured || (publishedAt && postedAgo))) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {publishedAt && postedAgo ? (
        <p className="text-subtle md:text-muted-foreground text-[13px] leading-4 md:text-[15px] md:leading-5">
          Posted{" "}
          {postedOn && postedOn !== postedAgo ? (
            <span className="hidden md:inline">{postedOn} · </span>
          ) : null}
          <RelativeTime iso={publishedAt} label={postedAgo} />
        </p>
      ) : null}
      {featured ? (
        <span className="bg-featured/10 text-featured rounded-md px-1.5 text-[11px] leading-4 font-medium">
          Featured
        </span>
      ) : null}
    </div>
  );
}

// Desktop only; pinned to the bottom of the viewport while the letter scrolls.
// On mobile StickyApply takes this job.
function ActionBar({
  applyHref,
  closes,
  job,
}: {
  applyHref: string | null;
  closes: string;
  job: JobDetail;
}) {
  return (
    <div className="border-line bg-card hidden items-center justify-between gap-3 border-t py-4 pr-6 pl-12 md:sticky md:bottom-0 md:z-10 md:flex xl:pl-[88px]">
      {closes ? (
        <p className="text-muted-foreground flex min-w-0 items-center gap-2 text-[13px] leading-[18px]">
          <span
            aria-hidden="true"
            className="bg-closing size-1.5 shrink-0 rounded-full"
          />
          Closes {closes}
        </p>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <JobSaveButton
          className="h-10 shrink-0 px-4 text-[14px] leading-[18px]"
          slug={job.slug}
          testId="job-save"
          variant="text"
        />
        {applyHref ? (
          <JobApplyLink
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 min-w-0 shrink-0 items-center justify-center rounded-lg px-5 text-[14px] leading-[18px] font-medium"
            href={applyHref}
            slug={job.slug}
            testId="job-apply"
          >
            Apply at {job.companyName}
            <span aria-hidden="true">&nbsp;↗</span>
            <span className="sr-only"> to {job.title}</span>
          </JobApplyLink>
        ) : null}
      </div>
    </div>
  );
}

function SideRail({
  alertsEnabled,
  companyHref,
  job,
  openRoles,
  postJob,
  shareUrl,
  website,
}: {
  alertsEnabled: boolean;
  companyHref: string | null;
  job: JobDetail;
  openRoles: number;
  postJob: { enabled: boolean; priceLabel: string; durationDays: number };
  shareUrl: string;
  website: string | null;
}) {
  const showAbout = Boolean(job.company || companyHref || website);

  return (
    <aside
      aria-label="About this job"
      className="hidden gap-4 md:grid md:grid-cols-2 lg:flex lg:flex-col"
    >
      {showAbout ? (
        <AboutCompany
          companyHref={companyHref}
          job={job}
          openRoles={openRoles}
          website={website}
        />
      ) : null}
      {alertsEnabled ? <AlertCard /> : null}
      <JobShareCard title={job.title} url={shareUrl} />
      {postJob.enabled ? (
        <PostJobCard
          durationDays={postJob.durationDays}
          priceLabel={postJob.priceLabel}
        />
      ) : null}
    </aside>
  );
}

export function JobPosting({
  alertsEnabled,
  fields,
  job,
  jsonLd,
  marketing,
  nonce,
  now,
  openRoles,
  postJob,
  shareUrl,
  similarJobs,
}: {
  alertsEnabled: boolean;
  fields: readonly PublicDetailField[];
  job: JobDetail;
  jsonLd: Record<string, unknown> | null;
  marketing: boolean;
  nonce: string | undefined;
  now: number;
  openRoles: number;
  postJob: { enabled: boolean; priceLabel: string; durationDays: number };
  shareUrl: string;
  similarJobs: readonly JobListItem[];
}) {
  const applyHref = jobApplyHref(job);
  // Rows synced before list detection still render dash lines as lists.
  const description = dropBlankParagraphs(
    bulletLinesToLists(editorState(job.description))
  );
  const website = httpUrl(job.company?.website?.trim() ?? "");
  const companyHref = job.companySlug
    ? buildCompanyPath(job.companySlug)
    : null;
  // Paper's apply bar reads "Closes Nov 22": only for a future closing date.
  const closesAt = job.validThrough ? Date.parse(job.validThrough) : Number.NaN;
  const closes =
    fields.includes("validThrough") &&
    job.validThrough &&
    !Number.isNaN(closesAt) &&
    closesAt > now
      ? formatShortDate(job.validThrough, now)
      : "";

  return (
    <div className="-mt-6 flex flex-col gap-5 md:-mt-1 lg:-mx-0.5">
      <JobBreadcrumb
        actions={
          <JobSaveButton
            className="md:hidden"
            slug={job.slug}
            testId="job-top-save"
            variant="icon"
          />
        }
        category={fields.includes("categories") ? categoryCrumb(job) : null}
        companyName={job.companyName}
        location={fields.includes("location") ? locationCrumb(job) : null}
        marketing={marketing}
        title={job.title}
      />
      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <article className="md:bg-card md:ring-line min-w-0 md:overflow-clip md:rounded-2xl md:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_28px_56px_-20px_rgb(0_0_0/0.16)] md:ring-1 md:dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04),0_32px_64px_-16px_rgb(0_0_0/0.75)]">
          <div className="flex flex-col gap-5 md:gap-9 md:px-12 md:pt-14 md:pb-12 xl:px-[88px]">
            <Letterhead
              companyHref={companyHref}
              job={job}
              now={now}
              website={website}
            />
            <JobFacts fields={fields} job={job} />
            <div className="bordful-prose" data-testid="job-description">
              {description ? <RichText data={description} /> : null}
            </div>
          </div>
          <ActionBar applyHref={applyHref} closes={closes} job={job} />
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
        <SideRail
          alertsEnabled={alertsEnabled}
          companyHref={companyHref}
          job={job}
          openRoles={openRoles}
          postJob={postJob}
          shareUrl={shareUrl}
          website={website}
        />
      </div>
      {similarJobs.length > 0 ? (
        <div className="md:pt-9 md:pb-8">
          <SimilarJobs
            companyHref={companyHref}
            companyName={job.companyName}
            jobs={similarJobs}
            now={now}
            openRoles={openRoles}
          />
        </div>
      ) : null}
      <StickyApply
        companyName={job.companyName}
        href={applyHref}
        slug={job.slug}
        title={job.title}
      />
    </div>
  );
}
