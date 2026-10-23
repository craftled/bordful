import { escapeHtml, headerSafe } from "./escape";
import { renderEmailLayout } from "./layout";
import type { RenderedEmail } from "./rendered";

export function renderConfirmEmail(input: {
  confirmUrl: string;
  siteName: string;
}): RenderedEmail {
  const siteName = headerSafe(input.siteName);
  const confirmUrl = input.confirmUrl.trim();
  const safeName = escapeHtml(siteName);
  const safeUrl = escapeHtml(confirmUrl);
  const subject = `Confirm your job alerts on ${siteName}`;
  const html = renderEmailLayout({
    bodyHtml: `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Confirm your job alerts for ${safeName}.</p>
<p style="margin:0;font-size:16px;line-height:1.5;"><a href="${safeUrl}" style="color:#18181b;">Confirm your job alerts</a></p>`,
    footerHtml: `You received this because someone entered this address on ${safeName}.`,
    title: subject,
  });
  const text = [
    subject,
    "",
    `Confirm your job alerts for ${siteName}.`,
    "Open this link and click the button to confirm:",
    confirmUrl,
    "",
    `You received this because someone entered this address on ${siteName}.`,
  ].join("\n");

  return { html, subject, text };
}
