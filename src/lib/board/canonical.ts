import { BOARD_SEARCH_PATH, buildTaxonomyArchivePath } from "./paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  parseBoardQuery,
  serializeBoardQuery,
} from "./query";
import { SENIORITY_LEVEL } from "./taxonomy";

function facetTarget(query: BoardQuery): string | null {
  const count =
    query.types.length +
    query.seniority.length +
    (query.remote ? 1 : 0) +
    query.languages.length;
  if (count !== 1) {
    return null;
  }

  const [type] = query.types;
  if (query.types.length === 1 && type) {
    return buildTaxonomyArchivePath("type", type, query.page);
  }

  const [seniority] = query.seniority;
  if (query.seniority.length === 1 && seniority) {
    const label = SENIORITY_LEVEL[seniority];
    if (!label) {
      return null;
    }
    return buildTaxonomyArchivePath("level", label, query.page);
  }

  if (query.remote) {
    return buildTaxonomyArchivePath("location", "remote", query.page);
  }

  const [language] = query.languages;
  if (!language) {
    return null;
  }

  return buildTaxonomyArchivePath("language", language, query.page);
}

function isArchiveCandidate(
  query: BoardQuery,
  options: BoardQueryOptions
): boolean {
  return (
    query.q.length === 0 &&
    query.salary.length === 0 &&
    !query.visa &&
    query.sort === "newest" &&
    query.perPage === options.defaultPerPage
  );
}

export function canonicalSearchRedirect(
  params: URLSearchParams,
  options: BoardQueryOptions
): string | null {
  const query = parseBoardQuery(params, options);
  if (isArchiveCandidate(query, options)) {
    const archive = facetTarget(query);
    if (archive) {
      return archive;
    }
  }

  const canonical = serializeBoardQuery(query, options).toString();
  if (params.toString() === canonical) {
    return null;
  }
  if (canonical.length === 0) {
    return BOARD_SEARCH_PATH;
  }

  return `${BOARD_SEARCH_PATH}?${canonical}`;
}
