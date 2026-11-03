import { boardHomePath } from "@/config/nav";

const PUBLIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PATH_PAGE_RE = /^[1-9]\d*$/;
const NON_SLUG_RE = /[^a-z0-9]+/g;
const EDGE_HYPHEN_RE = /^-+|-+$/g;

export const BOARD_SEARCH_PATH = "/jobs/search";

export type TaxonomyKind = "language" | "level" | "location" | "type";

export function slugifyTaxonomyValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(NON_SLUG_RE, "-")
    .replace(EDGE_HYPHEN_RE, "");
}

export function buildJobPath(slug: string): string {
  return `/jobs/${slug}`;
}

export function buildCompanyPath(slug: string): string {
  return `/companies/${slug}`;
}

export function buildBoardPagePath(marketing: boolean, page: number): string {
  if (page <= 1) {
    return boardHomePath(marketing);
  }

  return `/jobs/page/${page}`;
}

export function buildTaxonomyArchivePath(
  kind: TaxonomyKind,
  value: string,
  page = 1
): string {
  const base = `/jobs/${kind}/${slugifyTaxonomyValue(value)}`;
  if (page > 1) {
    return `${base}/page/${page}`;
  }

  return base;
}

export function isPublicJobSlug(slug: string): boolean {
  return PUBLIC_SLUG_RE.test(slug);
}

export function isPublicCompanySlug(slug: string): boolean {
  return PUBLIC_SLUG_RE.test(slug);
}

export function parsePathPage(value: string): number | null {
  if (!PATH_PAGE_RE.test(value)) {
    return null;
  }

  const page = Number.parseInt(value, 10);
  return Number.isSafeInteger(page) ? page : null;
}
