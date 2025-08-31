'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { DEFAULT_PER_PAGE } from '@/lib/constants/defaults';

export function useJobsPerPage() {
  const [jobsPerPage, setJobsPerPage] = useQueryState(
    'per_page',
    parseAsInteger.withDefault(DEFAULT_PER_PAGE)
  );

  return {
    jobsPerPage,
    setJobsPerPage: (value: number) => {
      // If value is the default, remove the parameter from URL
      setJobsPerPage(value === DEFAULT_PER_PAGE ? null : value);
    },
  };
}
