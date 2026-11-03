export function confirmUrl(siteUrl: string, token: string): string {
  return `${siteUrl}/alerts/confirm?token=${encodeURIComponent(token)}`;
}

export function unsubscribePageUrl(siteUrl: string, token: string): string {
  return `${siteUrl}/alerts/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function oneClickUnsubscribeUrl(siteUrl: string, token: string): string {
  const encoded = encodeURIComponent(token);
  return `${siteUrl}/alerts/unsubscribe/one-click?token=${encoded}`;
}

export function jobUrl(siteUrl: string, slug: string): string {
  return `${siteUrl}/jobs/${encodeURIComponent(slug)}`;
}
