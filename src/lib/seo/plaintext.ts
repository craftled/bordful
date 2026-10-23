import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";

const WHITESPACE = /\s+/g;
const FEED_DESCRIPTION_LIMIT = 500;

function isLexicalState(
  value: unknown
): value is Parameters<typeof convertLexicalToPlaintext>[0]["data"] {
  if (value === null || typeof value !== "object" || !("root" in value)) {
    return false;
  }

  const { root } = value as { root?: unknown };
  return root !== null && typeof root === "object";
}

export function collapseWhitespace(value: string): string {
  return value.replace(WHITESPACE, " ").trim();
}

export function truncateAtWord(value: string, limit: number): string {
  if (value.length <= limit) {
    return value;
  }

  const slice = value.slice(0, limit);
  const boundary = slice.lastIndexOf(" ");
  const cut = boundary > 0 ? slice.slice(0, boundary).trimEnd() : slice;
  return `${cut}...`;
}

export function plainJobDescription(data: unknown): string {
  if (!isLexicalState(data)) {
    return "";
  }

  return collapseWhitespace(convertLexicalToPlaintext({ data }));
}

export function feedDescriptionText(data: unknown): string {
  return truncateAtWord(plainJobDescription(data), FEED_DESCRIPTION_LIMIT);
}
