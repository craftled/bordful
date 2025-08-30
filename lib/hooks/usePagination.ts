'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import config from '@/config';

export function usePagination() {
  // Get default per page from config or fallback to 10
  const defaultPerPage = config.jobListings?.defaultPerPage || 10;

  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));

  const [perPage, setPerPage] = useQueryState(
    'per_page',
    parseAsInteger.withDefault(defaultPerPage)
  );

  // Ensure page is at least 1
  const validPage = Math.max(1, page);

  return {
    page: validPage,
    setPage,
    perPage,
    setPerPage,
  };
}
