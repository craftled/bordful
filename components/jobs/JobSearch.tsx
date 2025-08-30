/**
 * @deprecated Use JobSearchInput component instead.
 * This component is maintained for backward compatibility.
 */

'use client';

import { useEffect } from 'react';
import { JobSearchInput } from '@/components/ui/job-search-input';
import type { Job } from '@/lib/db/airtable';
import { useJobSearch } from '@/lib/hooks/useJobSearch';
import { filterJobsBySearch } from '@/lib/utils/filter-jobs';

export function JobSearch({
  jobs,
  onSearch,
}: {
  jobs: Job[];
  onSearch: (filtered: Job[]) => void;
}) {
  const { searchTerm } = useJobSearch();

  // Filter jobs when search term changes
  useEffect(() => {
    const filtered = filterJobsBySearch(jobs, searchTerm || '');
    onSearch(filtered);
  }, [jobs, searchTerm, onSearch]);

  return (
    <div className="mb-8">
      <JobSearchInput
        className="w-full max-w-md rounded-lg border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Search jobs..."
      />
    </div>
  );
}
