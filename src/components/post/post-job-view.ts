import type { SiteSettingsView } from "@/lib/read/types";

export interface PostJobView {
  ctaHref: string;
  ctaLabel: string;
  durationLabel: string;
  priceLabel: string | null;
}

export function buildPostJobView(
  postJob: SiteSettingsView["postJob"]
): PostJobView | null {
  if (!postJob.enabled || postJob.paymentLinkUrl === "") {
    return null;
  }

  const priceLabel = postJob.priceLabel === "" ? null : postJob.priceLabel;
  const dayWord = postJob.durationDays === 1 ? "day" : "days";

  return {
    ctaHref: postJob.paymentLinkUrl,
    ctaLabel:
      priceLabel === null ? "Post a job" : `Post a job for ${priceLabel}`,
    durationLabel: `Listed for ${postJob.durationDays} ${dayWord}`,
    priceLabel,
  };
}

export function postJobPageDescription(view: PostJobView): string {
  return `${view.ctaLabel}. ${view.durationLabel}.`;
}
