'use client';

import { parseAsInteger, useQueryState } from 'nuqs';

export function useJobsPerPage() {
  const [jobsPerPage, setJobsPerPage] = useQueryState(
    'per_page',
    parseAsInteger.withDefault(10)
  );

  return {
    jobsPerPage,
    setJobsPerPage: (value: number) => {
      // If value is 10 (default), remove the parameter from URL
      setJobsPerPage(value === 10 ? null : value);
    },
  };
}
