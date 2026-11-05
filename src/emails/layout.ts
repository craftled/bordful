import { contrastRatio } from "@/theme/contrast";
import { DEFAULT_THEME_TOKENS } from "@/theme/tokens";

import type { EmailBrand } from "./brand";
import { escapeHtml } from "./escape";

const { colors } = DEFAULT_THEME_TOKENS;

// Light surfaces stay fixed so a fork's dark theme cannot make mail
// unreadable. card, tag, line, and text-subtle mirror src/app/globals.css.
export const EMAIL_COLORS = {
  background: colors.background,
  border: colors.border,
  card: "#ffffff",
  foreground: colors.foreground,
  line: "#ededed",
  mutedForeground: colors.mutedForeground,
  subtle: "#6b6b6b",
  tag: colors.accent,
};

export const EMAIL_FONT =
  "font-family:Geist,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;";

const MIN_BUTTON_EDGE_CONTRAST = 1.5;
const PREHEADER_FILLER = "&zwnj;&nbsp;".repeat(80);

// A primary this close to the white card would vanish, so it gets the card
// border instead.
export function primaryButtonBorder(primary: string): string {
  const ratio = contrastRatio(primary, EMAIL_COLORS.card);
  return ratio !== null && ratio < MIN_BUTTON_EDGE_CONTRAST
    ? EMAIL_COLORS.border
    : primary;
}

// The cell carries the background and mso-padding-alt so Outlook desktop,
// which ignores padding on <a>, still paints a padded button. Other clients
// pad the <a>, so the whole button stays clickable.
export function renderEmailButton(input: {
  background: string;
  border: string;
  color: string;
  href: string;
  label: string;
  radiusPx: number;
}): string {
  const background = escapeHtml(input.background);
  const color = escapeHtml(input.color);
  const radius = `border-radius:${input.radiusPx}px;`;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" bgcolor="${background}" style="background-color:${background};border:1px solid ${escapeHtml(input.border)};mso-padding-alt:11px 20px;${radius}">
<a href="${escapeHtml(input.href)}" target="_blank" style="display:inline-block;padding:11px 20px;${EMAIL_FONT}font-size:14px;line-height:20px;font-weight:500;color:${color};text-decoration:none;${radius}">${escapeHtml(input.label)}</a>
</td></tr>
</table>`;
}

function renderHeader(brand: EmailBrand): string {
  const siteUrl = escapeHtml(brand.siteUrl);
  const name = `<a href="${siteUrl}" target="_blank" style="${EMAIL_FONT}font-size:14px;line-height:24px;font-weight:500;color:${EMAIL_COLORS.foreground};text-decoration:none;">${escapeHtml(brand.siteName)}</a>`;
  const logo = brand.logoUrl
    ? `<td valign="middle" style="padding:0 8px 0 0;"><a href="${siteUrl}" target="_blank"><img src="${escapeHtml(brand.logoUrl)}" alt="" height="24" style="display:block;height:24px;width:auto;max-width:160px;border:0;border-radius:6px;"></a></td>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>${logo}<td valign="middle">${name}</td></tr>
</table>`;
}

export function renderEmailLayout(input: {
  bodyHtml: string;
  brand: EmailBrand;
  footerHtml: string;
  heading: string;
  preheader: string;
}): string {
  const heading = escapeHtml(input.heading);
  const { background: page, card } = EMAIL_COLORS;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${heading}</title>
</head>
<body bgcolor="${page}" style="margin:0;padding:0;background-color:${page};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(input.preheader)}${PREHEADER_FILLER}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${page}" style="background-color:${page};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="560" align="center" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
<tr><td align="left" style="padding:0 4px 16px;">${renderHeader(input.brand)}</td></tr>
<tr><td align="left" bgcolor="${card}" style="background-color:${card};border:1px solid ${EMAIL_COLORS.border};border-radius:14px;padding:28px;">
<h1 style="margin:0 0 8px;${EMAIL_FONT}font-size:20px;line-height:28px;font-weight:500;letter-spacing:-0.01em;color:${EMAIL_COLORS.foreground};">${heading}</h1>
${input.bodyHtml}
</td></tr>
<tr><td align="left" style="padding:16px 4px 0;${EMAIL_FONT}font-size:12px;line-height:18px;color:${EMAIL_COLORS.subtle};">${input.footerHtml}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
