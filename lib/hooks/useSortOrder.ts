'use client';

import { parseAsString, useQueryState } from 'nuqs';
import config from '@/config';

export type SortOrder = 'newest' | 'oldest' | 'salary';

export function useSortOrder() {
  // Get default sort order from config or fallback to "newest"
  const defaultSortOrder =
    (config.jobListings?.defaultSortOrder as SortOrder) || 'newest';

  const [sortOrder, setSortOrderState] = useQueryState(
    'sort',
    parseAsString.withDefault(defaultSortOrder)
  );

  // Validate sort order to ensure it's one of the allowed values
  const validSortOrder =
    sortOrder === 'newest' || sortOrder === 'oldest' || sortOrder === 'salary'
      ? sortOrder
      : defaultSortOrder;

  // Handle setting sort order with proper null handling
  const setSortOrder = (value: SortOrder | null) => {
    setSortOrderState(value === null ? null : value);
  };

  return {
    sortOrder: validSortOrder as SortOrder,
    setSortOrder,
  };
}
