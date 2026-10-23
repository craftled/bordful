const AMPERSAND = /&/g;
const LESS_THAN = /</g;
const GREATER_THAN = />/g;
const QUOTE = /"/g;
const APOSTROPHE = /'/g;

function isXmlChar(code: number): boolean {
  return (
    code === 0x9 ||
    code === 0xa ||
    code === 0xd ||
    (code >= 0x20 && code <= 0xd7_ff) ||
    (code >= 0xe0_00 && code <= 0xff_fd) ||
    (code >= 0x1_00_00 && code <= 0x10_ff_ff)
  );
}

export function escapeXml(value: string): string {
  // XML 1.0 rejects most C0 controls and unpaired surrogates.
  let safe = "";
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0;
    if (isXmlChar(code)) {
      safe += char;
    }
  }

  return safe
    .replace(AMPERSAND, "&amp;")
    .replace(LESS_THAN, "&lt;")
    .replace(GREATER_THAN, "&gt;")
    .replace(QUOTE, "&quot;")
    .replace(APOSTROPHE, "&apos;");
}
