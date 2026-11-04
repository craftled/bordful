import type { JobListItem } from "@/lib/read/types";

import {
  BOARD_SEARCH_PATH,
  buildTaxonomyArchivePath,
  type TaxonomyKind,
} from "./paths";
import {
  type BoardQuery,
  type BoardQueryOptions,
  parseBoardQuery,
  serializeBoardQuery,
} from "./query";
import { filterByTaxonomy, SENIORITY_LEVEL } from "./taxonomy";

interface FacetTarget {
  kind: TaxonomyKind;
  value: string;
}

function facetTarget(query: BoardQuery): FacetTarget | null {
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
    return { kind: "type", value: type };
  }

  const [seniority] = query.seniority;
  if (query.seniority.length === 1 && seniority) {
    const label = SENIORITY_LEVEL[seniority];
    if (!label) {
      return null;
    }
    return { kind: "level", value: label };
  }

  if (query.remote) {
    return { kind: "location", value: "remote" };
  }

  const [language] = query.languages;
  if (!language) {
    return null;
  }

  return { kind: "language", value: language };
}

function isArchiveCandidate(
  query: BoardQuery,
  options: BoardQueryOptions
): boolean {
  return (
    query.q.length === 0 &&
    query.categories.length === 0 &&
    !query.featured &&
    query.salary.length === 0 &&
    !query.visa &&
    query.sort === "newest" &&
    query.perPage === options.defaultPerPage
  );
}

// An archive with no jobs is a 404, so a search for a value no job carries
// stays on the search page and shows its empty result instead.
function archivePath(
  query: BoardQuery,
  cards: readonly JobListItem[]
): string | null {
  const target = facetTarget(query);
  if (!target) {
    return null;
  }

  const matched = filterByTaxonomy(cards, target.kind, target.value);
  if (!matched || matched.length === 0) {
    return null;
  }

  return buildTaxonomyArchivePath(target.kind, target.value, query.page);
}

export function canonicalSearchRedirect(
  params: URLSearchParams,
  options: BoardQueryOptions,
  cards: readonly JobListItem[]
): string | null {
  const query = parseBoardQuery(params, options);
  if (isArchiveCandidate(query, options)) {
    const archive = archivePath(query, cards);
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
