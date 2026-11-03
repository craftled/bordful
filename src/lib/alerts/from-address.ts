export function formatFromAddress(
  fromName: string,
  siteName: string,
  fromEmail: string
): string {
  const chosen = fromName.trim().length > 0 ? fromName : siteName;
  const name = chosen.replaceAll(/[\r\n"]/g, "").trim() || "Job alerts";
  return `"${name}" <${fromEmail}>`;
}
