import type { EmailBrand } from "./brand";
import { escapeHtml, headerSafe } from "./escape";
import {
  EMAIL_COLORS,
  EMAIL_FONT,
  primaryButtonBorder,
  renderEmailButton,
  renderEmailLayout,
} from "./layout";
import type { RenderedEmail } from "./rendered";

export function renderConfirmEmail(input: {
  brand: EmailBrand;
  confirmUrl: string;
}): RenderedEmail {
  const { brand } = input;
  const siteName = headerSafe(brand.siteName);
  const confirmUrl = input.confirmUrl.trim();
  const safeName = escapeHtml(siteName);
  const safeUrl = escapeHtml(confirmUrl);
  const subject = `Confirm your job alerts on ${siteName}`;
  const intro = `Confirm this address to get new jobs from ${siteName} by email.`;
  const ignore = "If it was not you, ignore this email.";
  const html = renderEmailLayout({
    bodyHtml: `<p style="margin:0 0 24px;${EMAIL_FONT}font-size:15px;line-height:22px;color:${EMAIL_COLORS.mutedForeground};">${escapeHtml(intro)}</p>
${renderEmailButton({
  background: brand.primary,
  border: primaryButtonBorder(brand.primary),
  color: brand.primaryForeground,
  href: confirmUrl,
  label: "Confirm job alerts",
  radiusPx: brand.radiusPx,
})}
<p style="margin:24px 0 0;${EMAIL_FONT}font-size:13px;line-height:20px;color:${EMAIL_COLORS.subtle};">Or paste this link into your browser:<br><a href="${safeUrl}" target="_blank" style="color:${EMAIL_COLORS.mutedForeground};word-break:break-all;">${safeUrl}</a></p>`,
    brand,
    footerHtml: `You received this because someone entered this address on ${safeName}. ${ignore}`,
    heading: "Confirm your job alerts",
    preheader: "Confirm your address to start getting new jobs.",
  });
  const text = [
    subject,
    "",
    intro,
    "Open this link, then press Confirm on the page:",
    confirmUrl,
    "",
    `You received this because someone entered this address on ${siteName}. ${ignore}`,
  ].join("\n");

  return { html, subject, text };
}
