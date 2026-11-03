import type { SiteSettingsView } from "@/lib/read/types";

export interface PostJobView {
  ctaHref: string;
  ctaLabel: string;
  durationLabel: string;
  priceLabel: string | null;
  // A Stripe test-mode link takes no real money, as on the demo board.
  testMode: boolean;
}

const STRIPE_HOSTS = new Set(["buy.stripe.com", "checkout.stripe.com"]);

/** True for a Stripe payment link in test mode (its path starts with "test_"). */
export function isStripeTestLink(url: string): boolean {
  try {
    const { hostname, pathname } = new URL(url);
    return STRIPE_HOSTS.has(hostname) && pathname.startsWith("/test_");
  } catch {
    return false;
  }
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
    testMode: isStripeTestLink(postJob.paymentLinkUrl),
  };
}

export function postJobPageDescription(view: PostJobView): string {
  return `${view.ctaLabel}. ${view.durationLabel}.`;
}
