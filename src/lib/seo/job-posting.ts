import type { JobEmploymentType } from "@/lib/domain/job-vocab";
import type { JobDetail } from "@/lib/read/types";

import { plainJobDescription } from "./plaintext";

const EMPLOYMENT_TYPE_LD: Record<JobEmploymentType, string> = {
  contract: "CONTRACTOR",
  "full-time": "FULL_TIME",
  internship: "INTERN",
  other: "OTHER",
  "part-time": "PART_TIME",
  "per-diem": "PER_DIEM",
  temporary: "TEMPORARY",
  volunteer: "VOLUNTEER",
};

function assignText(
  data: Record<string, unknown>,
  key: string,
  value: string | null
): void {
  if (value) {
    data[key] = value;
  }
}

function absoluteUrl(siteUrl: string, value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (value.startsWith("https://") || value.startsWith("http://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${siteUrl}${value}`;
  }

  return `${siteUrl}/${value}`;
}

function hiringOrganization(
  job: JobDetail,
  siteUrl: string
): Record<string, unknown> | null {
  const organization: Record<string, unknown> = { "@type": "Organization" };
  assignText(organization, "name", job.companyName);
  assignText(organization, "sameAs", job.company?.website ?? null);
  assignText(organization, "logo", absoluteUrl(siteUrl, job.companyLogoUrl));

  if (Object.keys(organization).length === 1) {
    return null;
  }

  return organization;
}

function jobLocation(job: JobDetail): Record<string, unknown> | null {
  const address: Record<string, unknown> = { "@type": "PostalAddress" };
  assignText(address, "addressLocality", job.locality);
  assignText(address, "addressRegion", job.region);
  assignText(address, "addressCountry", job.countryCode);

  if (Object.keys(address).length === 1) {
    return null;
  }

  return { "@type": "Place", address };
}

function baseSalary(job: JobDetail): Record<string, unknown> | null {
  if (!job.salaryCurrency) {
    return null;
  }

  if (job.salaryMin === null && job.salaryMax === null) {
    return null;
  }

  const value: Record<string, unknown> = { "@type": "QuantitativeValue" };
  if (job.salaryMin !== null) {
    value.minValue = job.salaryMin;
  }

  if (job.salaryMax !== null) {
    value.maxValue = job.salaryMax;
  }

  value.unitText = "YEAR";

  return {
    "@type": "MonetaryAmount",
    currency: job.salaryCurrency,
    value,
  };
}

export function buildJobPostingJsonLd(
  job: JobDetail,
  ctx: { siteUrl: string; siteName: string }
): Record<string, unknown> | null {
  if (!job.indexable) {
    return null;
  }

  // Assignment order is the JobPosting key order from the L2 contract.
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
  };

  assignText(data, "title", job.title);
  assignText(data, "description", plainJobDescription(job.description));
  assignText(data, "datePosted", job.publishedAt);
  assignText(data, "validThrough", job.validThrough);

  if (job.employmentType) {
    data.employmentType = EMPLOYMENT_TYPE_LD[job.employmentType];
  }

  const organization = hiringOrganization(job, ctx.siteUrl);
  if (organization) {
    data.hiringOrganization = organization;
  }

  if (job.workplaceType === "remote") {
    data.jobLocationType = "TELECOMMUTE";
    if (job.countryCode) {
      data.applicantLocationRequirements = {
        "@type": "Country",
        name: job.countryCode,
      };
    }
  } else {
    const location = jobLocation(job);
    if (location) {
      data.jobLocation = location;
    }
  }

  const salary = baseSalary(job);
  if (salary) {
    data.baseSalary = salary;
  }

  data.directApply = false;
  data.url = `${ctx.siteUrl}/jobs/${job.slug}`;
  return data;
}
