import type { AlertFrequency } from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

import type { EmailBrand } from "./brand";
import { escapeHtml, headerSafe } from "./escape";
import {
  EMAIL_COLORS,
  EMAIL_FONT,
  renderEmailButton,
  renderEmailLayout,
} from "./layout";
import type { RenderedEmail } from "./rendered";

function locationText(job: JobListItem): string {
  const value = job.locationDisplay?.trim();
  return value && value.length > 0 ? value : "Location not listed";
}

function companyText(job: JobListItem): string {
  const value = job.companyName.trim();
  return value.length > 0 ? value : "Company not listed";
}

// Mirrors the on-site preview row (components/alerts/example-email.tsx).
function jobRowHtml(job: JobListItem, url: string, first: boolean): string {
  const title = job.title.trim() || "Untitled role";
  const company = job.companyName.trim();
  const initial = Array.from(company)[0]?.toUpperCase() || "?";
  const location = job.locationDisplay?.trim();
  const meta = location
    ? `${companyText(job)} · ${location}`
    : companyText(job);
  const rule = first ? "" : `border-top:1px solid ${EMAIL_COLORS.line};`;
  return `<tr>
<td width="36" valign="middle" style="padding:14px 12px 14px 0;${rule}"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="36" height="36" align="center" valign="middle" bgcolor="${EMAIL_COLORS.tag}" style="width:36px;height:36px;background-color:${EMAIL_COLORS.tag};border-radius:8px;${EMAIL_FONT}font-size:13px;line-height:16px;font-weight:600;color:${EMAIL_COLORS.mutedForeground};">${escapeHtml(initial)}</td></tr></table></td>
<td valign="middle" style="padding:14px 0;${rule}"><a href="${escapeHtml(url)}" target="_blank" style="${EMAIL_FONT}font-size:15px;line-height:20px;font-weight:500;color:${EMAIL_COLORS.foreground};text-decoration:none;">${escapeHtml(title)}</a><br><span style="${EMAIL_FONT}font-size:13px;line-height:18px;color:${EMAIL_COLORS.mutedForeground};">${escapeHtml(meta)}</span></td>
</tr>`;
}

function jobText(job: JobListItem, url: string): string {
  const title = job.title.trim() || "Untitled role";
  return [title, companyText(job), locationText(job), url].join("\n");
}

export function renderDigestEmail(input: {
  brand: EmailBrand;
  frequency: AlertFrequency;
  jobs: JobListItem[];
  unsubscribeUrl: string;
}): RenderedEmail {
  const { brand } = input;
  const siteName = headerSafe(brand.siteName);
  const count = input.jobs.length;
  const subject =
    count === 1
      ? `1 new job on ${siteName}`
      : `${count} new jobs on ${siteName}`;
  const jobs = input.jobs.map((job) => ({
    job,
    url: `${brand.siteUrl}/jobs/${encodeURIComponent(job.slug)}`,
  }));
  const allJobsUrl = `${brand.siteUrl}/jobs`;
  const alertsUrl = `${brand.siteUrl}/alerts`;
  const safeName = escapeHtml(siteName);
  const safeUnsubscribe = escapeHtml(input.unsubscribeUrl);
  const cadence = input.frequency === "daily" ? "daily" : "weekly";
  const html = renderEmailLayout({
    bodyHtml: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
${jobs.map(({ job, url }, index) => jobRowHtml(job, url, index === 0)).join("\n")}
</table>
${renderEmailButton({
  background: EMAIL_COLORS.card,
  border: EMAIL_COLORS.border,
  color: EMAIL_COLORS.foreground,
  href: allJobsUrl,
  label: "View all jobs",
  radiusPx: brand.radiusPx,
})}`,
    brand,
    footerHtml: `You are getting this ${cadence} digest because you confirmed job alerts on ${safeName}. <a href="${safeUnsubscribe}" target="_blank" style="color:${EMAIL_COLORS.mutedForeground};text-decoration:underline;">Unsubscribe</a><br>To change your filters, unsubscribe and <a href="${escapeHtml(alertsUrl)}" target="_blank" style="color:${EMAIL_COLORS.mutedForeground};text-decoration:underline;">sign up again</a>.`,
    heading: subject,
    preheader: jobs
      .map(({ job }) => job.title.trim())
      .filter(Boolean)
      .join(", "),
  });
  const text = [
    subject,
    "",
    ...jobs.map(({ job, url }) => jobText(job, url)),
    "",
    `View all jobs: ${allJobsUrl}`,
    "",
    `You are getting this ${cadence} digest because you confirmed job alerts on ${siteName}.`,
    `Unsubscribe: ${input.unsubscribeUrl}`,
    `To change your filters, unsubscribe and sign up again: ${alertsUrl}`,
  ].join("\n");

  return { html, subject, text };
}
