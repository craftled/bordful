import type { AlertFrequency } from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

import { escapeHtml, headerSafe } from "./escape";
import { renderEmailLayout } from "./layout";
import type { RenderedEmail } from "./rendered";

const TRAILING_SLASH = /\/$/;

function locationText(job: JobListItem): string {
  const value = job.locationDisplay?.trim();
  return value && value.length > 0 ? value : "Location not listed";
}

function companyText(job: JobListItem): string {
  const value = job.companyName.trim();
  return value.length > 0 ? value : "Company not listed";
}

function jobBlock(
  job: JobListItem,
  siteUrl: string
): { html: string; text: string } {
  const title = job.title.trim() || "Untitled role";
  const company = companyText(job);
  const location = locationText(job);
  const url = `${siteUrl}/jobs/${encodeURIComponent(job.slug)}`;
  const html = `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;"><a href="${escapeHtml(url)}" style="color:#18181b;font-weight:700;">${escapeHtml(title)}</a><br>${escapeHtml(company)}<br>${escapeHtml(location)}</p>`;
  const text = [title, company, location, url].join("\n");
  return { html, text };
}

export function renderDigestEmail(input: {
  frequency: AlertFrequency;
  jobs: JobListItem[];
  siteName: string;
  siteUrl: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  const siteName = headerSafe(input.siteName);
  const siteUrl = input.siteUrl.replace(TRAILING_SLASH, "");
  const count = input.jobs.length;
  const subject =
    count === 1
      ? `1 new job on ${siteName}`
      : `${count} new jobs on ${siteName}`;
  const blocks = input.jobs.map((job) => jobBlock(job, siteUrl));
  const safeName = escapeHtml(siteName);
  const safeUnsubscribe = escapeHtml(input.unsubscribeUrl);
  const cadence = input.frequency === "daily" ? "daily" : "weekly";
  const html = renderEmailLayout({
    bodyHtml: blocks.map((block) => block.html).join(""),
    footerHtml: `You are getting this ${cadence} digest because you confirmed job alerts on ${safeName}. <a href="${safeUnsubscribe}" style="color:#18181b;">Unsubscribe</a>`,
    title: escapeHtml(subject),
  });
  const text = [
    subject,
    "",
    ...blocks.map((block) => block.text),
    "",
    `You are getting this ${cadence} digest because you confirmed job alerts on ${siteName}.`,
    `Unsubscribe: ${input.unsubscribeUrl}`,
  ].join("\n");

  return { html, subject, text };
}
