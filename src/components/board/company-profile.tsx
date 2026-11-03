import Link from "next/link";

import { JobCardList, JobCardRow } from "@/components/board/job-card-row";
import {
  compactRelative,
  jobStatuses,
  StatusPill,
} from "@/components/board/job-row";
import { httpUrl } from "@/lib/board/apply";
import {
  formatLocation,
  formatRelativePosted,
  formatSalary,
} from "@/lib/board/format";
import { buildCompanyPath, buildJobPath } from "@/lib/board/paths";
import type { CompanyStats } from "@/lib/read/company-stats";
import type { CompanySummary, JobListItem } from "@/lib/read/types";

const WWW_PREFIX = /^www\./u;

export const COMPANY_SIDE_CARD =
  "bg-card ring-line flex flex-col gap-2.5 rounded-[14px] p-[18px] ring-1";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(WWW_PREFIX, "");
  } catch {
    return url;
  }
}

export interface CompanyFact {
  label: string;
  value: string;
}

/** The company's site: its website, else https on its domain. */
export function companyWebsite(company: CompanySummary): string | null {
  const domain = company.domain?.trim() ?? "";
  return (
    httpUrl(company.website?.trim() ?? "") ??
    (domain ? httpUrl(`https://${domain}`) : null)
  );
}

/** "Industry · domain", from whichever of the two the company has. */
export function companySubline(
  company: CompanySummary,
  website: string | null
): string {
  const domain = company.domain?.trim() ?? "";
  const host = domain || (website ? hostOf(website) : "");
  return [company.industry?.trim() ?? "", host]
    .filter((part) => part.length > 0)
    .join(" · ");
}

function placeFact(
  company: CompanySummary,
  jobLocation: string | null
): CompanyFact | null {
  const hq = company.location?.trim() ?? "";
  if (hq) {
    return { label: "Headquarters", value: hq };
  }
  if (jobLocation) {
    return { label: "Location", value: jobLocation };
  }
  return null;
}

/** Only facts the data has: no founded year or headcount guesses. */
export function companyFacts(
  company: CompanySummary,
  jobLocation: string | null,
  openRoles: number
): CompanyFact[] {
  const industry = company.industry?.trim() ?? "";
  const facts: (CompanyFact | null)[] = [
    placeFact(company, jobLocation),
    industry ? { label: "Industry", value: industry } : null,
    {
      label: "Hiring",
      value: openRoles === 1 ? "1 open role" : `${openRoles} open roles`,
    },
  ];
  return facts.filter((fact): fact is CompanyFact => fact !== null);
}

export function CompanyLogoTile({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="bg-logo-tile text-muted-foreground flex size-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] text-[21px] leading-[26px] font-semibold md:size-16 md:rounded-[14px] md:text-[26px] md:leading-8"
    >
      {logoUrl ? (
        // biome-ignore lint/performance/noImgElement: a 64px company mark, served as-is
        <img
          alt=""
          className="size-full object-cover"
          height={64}
          src={logoUrl}
          width={64}
        />
      ) : (
        name.trim().charAt(0).toUpperCase() || "?"
      )}
    </span>
  );
}

export function CompanyFactsStrip({ facts }: { facts: CompanyFact[] }) {
  return (
    <dl className="bg-card ring-line grid grid-cols-2 overflow-clip rounded-[12px] ring-1 md:flex md:flex-wrap">
      {facts.map((fact) => (
        <div
          className="flex flex-col gap-0.5 px-4 py-3 md:w-[268px]"
          key={fact.label}
        >
          <dt className="text-subtle text-[12px] leading-4">{fact.label}</dt>
          <dd className="text-foreground text-[14px] leading-[18px] font-medium">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RolePills({ job, now }: { job: JobListItem; now: number }) {
  return (
    <>
      {jobStatuses(job, now).map((status) => (
        <StatusPill key={status} status={status} />
      ))}
    </>
  );
}

export function CompanyRoles({
  jobs,
  now,
}: {
  jobs: readonly JobListItem[];
  now: number;
}) {
  return (
    <section
      aria-labelledby="open-roles-title"
      className="flex min-w-0 flex-col gap-3.5"
    >
      <h2
        className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase"
        id="open-roles-title"
      >
        Open roles · {jobs.length}
      </h2>
      <JobCardList testId="job-list">
        {jobs.map((job) => (
          <JobCardRow
            companyName={job.companyName}
            href={buildJobPath(job.slug)}
            initial={job.companyName.trim().charAt(0).toUpperCase() || "?"}
            key={job.id}
            location={formatLocation(job)}
            logoUrl={job.companyLogoUrl}
            pills={
              jobStatuses(job, now).length > 0 ? (
                <RolePills job={job} now={now} />
              ) : undefined
            }
            salary={formatSalary(job)}
            slug={job.slug}
            time={job.publishedAt ? compactRelative(job.publishedAt, now) : ""}
            timeTitle={
              job.publishedAt
                ? formatRelativePosted(job.publishedAt, now)
                : undefined
            }
            title={job.title}
          />
        ))}
      </JobCardList>
    </section>
  );
}

export function SimilarCompaniesCard({
  companies,
}: {
  companies: readonly CompanyStats[];
}) {
  if (companies.length === 0) {
    return null;
  }
  return (
    <section
      aria-labelledby="similar-companies-title"
      className={COMPANY_SIDE_CARD}
    >
      <h2
        className="text-subtle text-[13px] leading-4 font-normal"
        id="similar-companies-title"
      >
        Similar companies
      </h2>
      <ul className="flex flex-col gap-2.5">
        {companies.map((item) => (
          <li key={item.slug}>
            <Link
              className="group flex justify-between gap-3 text-[13px] leading-4"
              href={buildCompanyPath(item.slug)}
            >
              <span className="text-foreground min-w-0 truncate group-hover:underline">
                {item.name}
              </span>
              <span className="text-subtle shrink-0 tabular-nums">
                {item.count === 1 ? "1 role" : `${item.count} roles`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
