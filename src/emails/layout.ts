export function renderEmailLayout(input: {
  bodyHtml: string;
  footerHtml: string;
  title: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background:#f4f4f5;color:#18181b;font-family:Georgia,serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;padding:24px;">
<tr><td>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${input.title}</h1>
${input.bodyHtml}
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#52525b;">${input.footerHtml}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
