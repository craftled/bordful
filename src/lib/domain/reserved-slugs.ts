export const RESERVED_JOB_SLUGS = [
  "page",
  "search",
  "type",
  "level",
  "location",
  "language",
] as const;

export function isReservedJobSlug(slug: string): boolean {
  return (RESERVED_JOB_SLUGS as readonly string[]).includes(slug);
}
