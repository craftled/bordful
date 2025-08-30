'use client';

import { formatDistanceToNow, isToday } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { JobCard } from '@/components/jobs/JobCard';
import { HeroSection } from '@/components/ui/hero-section';
import { JobFilters } from '@/components/ui/job-filters';
import { JobSearchInput } from '@/components/ui/job-search-input';
import { JobsPerPageSelect } from '@/components/ui/jobs-per-page-select';
import { PaginationControl } from '@/components/ui/pagination-control';
import { PostJobBanner } from '@/components/ui/post-job-banner';
import { SortOrderSelect } from '@/components/ui/sort-order-select';
import config from '@/config';
import type { LanguageCode } from '@/lib/constants/languages';
import type { CareerLevel, Job } from '@/lib/db/airtable';
import { normalizeAnnualSalary } from '@/lib/db/airtable';
import { useJobSearch } from '@/lib/hooks/useJobSearch';
import { usePagination } from '@/lib/hooks/usePagination';
import { useSortOrder } from '@/lib/hooks/useSortOrder';
import { filterJobsBySearch } from '@/lib/utils/filter-jobs';

type Filters = {
  types: string[];
  roles: CareerLevel[];
  remote: boolean;
  salaryRanges: string[];
  visa: boolean;
  languages: LanguageCode[];
};

type FilterType =
  | 'type'
  | 'role'
  | 'remote'
  | 'salary'
  | 'visa'
  | 'language'
  | 'clear';
type FilterValue = string[] | boolean | CareerLevel[] | LanguageCode[] | true;

function HomePageContent({ initialJobs }: { initialJobs: Job[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchTerm } = useJobSearch();
  const { sortOrder } = useSortOrder();
  const { page } = usePagination();

  // Parse initial filters from URL
  const initialFilters = {
    types: searchParams.get('types')?.split(',').filter(Boolean) || [],
    roles: (searchParams.get('roles')?.split(',').filter(Boolean) ||
      []) as CareerLevel[],
    remote: searchParams.get('remote') === 'true',
    salaryRanges: searchParams.get('salary')?.split(',').filter(Boolean) || [],
    visa: searchParams.get('visa') === 'true',
    languages: (searchParams.get('languages')?.split(',').filter(Boolean) ||
      []) as LanguageCode[],
  };

  const [filters, setFilters] = useState<Filters>({
    types: initialFilters?.types || [],
    roles: initialFilters?.roles || [],
    remote: initialFilters?.remote,
    salaryRanges: initialFilters?.salaryRanges || [],
    visa: initialFilters?.visa,
    languages: initialFilters?.languages || ([] as LanguageCode[]),
  });
  const [pendingUrlUpdate, setPendingUrlUpdate] = useState<Record<
    string,
    string | null
  > | null>(null);

  // Get jobs per page from URL or default
  const jobsPerPage = Number.parseInt(searchParams.get('per_page') || '10', 10);

  // Update URL with new parameters
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setPendingUrlUpdate(updates);
  }, []);

  // Handle URL updates
  useEffect(() => {
    if (pendingUrlUpdate) {
      const params = new URLSearchParams(searchParams);

      Object.entries(pendingUrlUpdate).forEach(([key, value]) => {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.replace(`/?${params.toString()}`, { scroll: false });
      setPendingUrlUpdate(null);
    }
  }, [pendingUrlUpdate, router, searchParams]);

  // Update URL when filters change
  const updateFilterParams = useCallback(
    (newFilters: Filters) => {
      const updates: Record<string, string | null> = {
        types: newFilters.types.length ? newFilters.types.join(',') : null,
        roles: newFilters.roles.length ? newFilters.roles.join(',') : null,
        remote: newFilters.remote ? 'true' : null,
        salary: newFilters.salaryRanges.length
          ? newFilters.salaryRanges.join(',')
          : null,
        visa: newFilters.visa ? 'true' : null,
        languages: newFilters.languages.length
          ? newFilters.languages.join(',')
          : null,
        page: '1', // Reset to first page when filters change
      };

      updateParams(updates);
    },
    [updateParams]
  );

  const handleFilterChange = useCallback(
    (filterType: FilterType, value: FilterValue) => {
      if (filterType === 'clear') {
        const clearedFilters = {
          types: [],
          roles: [] as CareerLevel[],
          remote: false,
          salaryRanges: [],
          visa: false,
          languages: [],
        };
        setFilters(clearedFilters);
        updateFilterParams(clearedFilters);
        return;
      }

      setFilters((prev) => {
        const newFilters = { ...prev };

        switch (filterType) {
          case 'type':
            if (
              Array.isArray(value) &&
              JSON.stringify(value) !== JSON.stringify(prev.types)
            ) {
              newFilters.types = value;
            } else {
              return prev;
            }
            break;
          case 'role':
            if (
              Array.isArray(value) &&
              JSON.stringify(value) !== JSON.stringify(prev.roles)
            ) {
              newFilters.roles = value as CareerLevel[];
            } else {
              return prev;
            }
            break;
          case 'remote':
            if (typeof value === 'boolean' && value !== prev.remote) {
              newFilters.remote = value;
            } else {
              return prev;
            }
            break;
          case 'salary':
            if (
              Array.isArray(value) &&
              JSON.stringify(value) !== JSON.stringify(prev.salaryRanges)
            ) {
              newFilters.salaryRanges = value;
            } else {
              return prev;
            }
            break;
          case 'visa':
            if (typeof value === 'boolean' && value !== prev.visa) {
              newFilters.visa = value;
            } else {
              return prev;
            }
            break;
          case 'language':
            if (
              Array.isArray(value) &&
              JSON.stringify(value) !== JSON.stringify(prev.languages)
            ) {
              newFilters.languages = value as LanguageCode[];
            } else {
              return prev;
            }
            break;
        }

        updateFilterParams(newFilters);
        return newFilters;
      });
    },
    [updateFilterParams]
  );

  // Sort and filter jobs
  const filteredJobs = useMemo(() => {
    let filtered = [...initialJobs];

    // Apply search filter using our utility function
    filtered = filterJobsBySearch(filtered, searchTerm || '');

    // Apply job type filter
    if (filters.types.length > 0) {
      filtered = filtered.filter((job) => filters.types.includes(job.type));
    }

    // Apply career level filter
    if (filters.roles.length > 0) {
      filtered = filtered.filter((job) => {
        if (!job.career_level) {
          return false;
        }
        return filters.roles.some((role) => job.career_level.includes(role));
      });
    }

    // Apply remote filter
    if (filters.remote) {
      filtered = filtered.filter((job) => job.workplace_type === 'Remote');
    }

    // Apply visa sponsorship filter
    if (filters.visa) {
      filtered = filtered.filter((job) => job.visa_sponsorship === 'Yes');
    }

    // Apply salary range filter
    if (filters.salaryRanges.length > 0) {
      filtered = filtered.filter((job) => {
        if (!job.salary) {
          return false;
        }
        const annualSalary = normalizeAnnualSalary(job.salary);

        return filters.salaryRanges.some((range) => {
          switch (range) {
            case '< $50K':
              return annualSalary < 50_000;
            case '$50K - $100K':
              return annualSalary >= 50_000 && annualSalary <= 100_000;
            case '$100K - $200K':
              return annualSalary > 100_000 && annualSalary <= 200_000;
            case '> $200K':
              return annualSalary > 200_000;
            default:
              return false;
          }
        });
      });
    }

    // Apply language filter
    if (filters.languages.length > 0) {
      filtered = filtered.filter((job) => {
        if (!job.languages || job.languages.length === 0) {
          return false;
        }
        return filters.languages.some((lang) => job.languages.includes(lang));
      });
    }

    // Apply sorting
    switch (sortOrder) {
      case 'oldest':
        filtered.sort(
          (a, b) =>
            new Date(a.posted_date).getTime() -
            new Date(b.posted_date).getTime()
        );
        break;
      case 'salary':
        filtered.sort((a, b) => {
          const salaryA = a.salary ? normalizeAnnualSalary(a.salary) : -1;
          const salaryB = b.salary ? normalizeAnnualSalary(b.salary) : -1;

          if (salaryA === -1 && salaryB === -1) {
            return 0;
          }
          if (salaryA === -1) {
            return 1;
          }
          if (salaryB === -1) {
            return -1;
          }
          return salaryB - salaryA;
        });
        break;
      default: // "newest"
        filtered.sort(
          (a, b) =>
            new Date(b.posted_date).getTime() -
            new Date(a.posted_date).getTime()
        );
    }

    return filtered;
  }, [initialJobs, searchTerm, sortOrder, filters]);

  // Sort jobs based on selected option and featured status
  const sortedJobs = useMemo(() => {
    // First sort by featured status, then by the selected sort option
    return [...filteredJobs].sort((a, b) => {
      // First compare by featured status
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }

      // Then apply the selected sort for jobs with the same featured status
      switch (sortOrder) {
        case 'newest':
          return (
            new Date(b.posted_date).getTime() -
            new Date(a.posted_date).getTime()
          );
        case 'oldest':
          return (
            new Date(a.posted_date).getTime() -
            new Date(b.posted_date).getTime()
          );
        case 'salary': {
          const aSalary = a.salary ? normalizeAnnualSalary(a.salary) : 0;
          const bSalary = b.salary ? normalizeAnnualSalary(b.salary) : 0;
          return bSalary - aSalary;
        }
        default:
          return 0;
      }
    });
  }, [filteredJobs, sortOrder]);

  // Calculate pagination
  const startIndex = (page - 1) * jobsPerPage;
  const paginatedJobs = sortedJobs.slice(startIndex, startIndex + jobsPerPage);

  // Get the most recent job's posted date (timestamp or null)
  const lastUpdatedTimestamp = useMemo(() => {
    if (initialJobs.length === 0) {
      return null;
    }

    const mostRecentDate = Math.max(
      ...initialJobs.map((job) => new Date(job.posted_date).getTime())
    );

    return mostRecentDate; // Return the timestamp
  }, [initialJobs]);

  // Calculate jobs added today
  const jobsAddedToday = useMemo(() => {
    return initialJobs.filter((job) => isToday(new Date(job.posted_date)))
      .length;
  }, [initialJobs]);

  return (
    <main className="min-h-screen bg-background">
      <HeroSection
        badge={config.badge}
        description={config.description}
        title={config.title}
        // Will use the global config.ui.heroImage since we're not specifying a custom one
      >
        {/* Search Bar - Replace with our new component */}
        <div className="max-w-[480px]">
          <JobSearchInput />
        </div>

        {/* Quick Stats - Reverted to original structure with color customization */}
        {(config.quickStats?.enabled ?? true) && (
          <div
            className="mt-6 grid max-w-[480px] grid-cols-3 gap-4 text-muted-foreground text-xs"
            // Apply base color here, specific elements might override
            style={{ color: config.ui.heroStatsColor || undefined }}
          >
            {/* Open Jobs */}
            {(config.quickStats?.sections?.openJobs?.enabled ?? true) && (
              <div>
                <div
                  className="font-medium text-foreground"
                  // Override title color if heroStatsColor is set
                  style={{
                    color:
                      config.ui.heroStatsColor ||
                      undefined /* Default: text-foreground */,
                  }}
                >
                  {config.quickStats?.sections?.openJobs?.title || 'Open Jobs'}
                </div>
                <div className="flex items-center">
                  {(config.quickStats?.sections?.openJobs
                    ?.showNewJobsIndicator ??
                    true) &&
                    jobsAddedToday > 0 && (
                      <span className="pulse-dot mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                    )}
                  <span /* Value inherits color from parent div */>
                    {initialJobs.length.toLocaleString()}
                  </span>
                  {(config.quickStats?.sections?.openJobs
                    ?.showNewJobsIndicator ??
                    true) &&
                    jobsAddedToday > 0 && (
                      <span
                        className="ml-1"
                        /* Added today text inherits color */
                      >
                        ({jobsAddedToday.toLocaleString()} added today)
                      </span>
                    )}
                </div>
              </div>
            )}

            {/* Last Updated */}
            {(config.quickStats?.sections?.lastUpdated?.enabled ?? true) &&
              lastUpdatedTimestamp && ( // Ensure timestamp exists
                <div>
                  <div
                    className="font-medium text-foreground"
                    style={{
                      color:
                        config.ui.heroStatsColor ||
                        undefined /* Default: text-foreground */,
                    }}
                  >
                    {config.quickStats?.sections?.lastUpdated?.title ||
                      'Last Updated'}
                  </div>
                  <div /* Value inherits color */>
                    {formatDistanceToNow(new Date(lastUpdatedTimestamp), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              )}

            {/* Trending Companies */}
            {(config.quickStats?.sections?.trending?.enabled ?? true) && (
              <div>
                <div
                  className="font-medium text-foreground"
                  style={{
                    color:
                      config.ui.heroStatsColor ||
                      undefined /* Default: text-foreground */,
                  }}
                >
                  {config.quickStats?.sections?.trending?.title || 'Trending'}
                </div>
                <div /* Value inherits color */>
                  {Array.from(new Set(initialJobs.map((job) => job.company)))
                    .slice(
                      0,
                      config.quickStats?.sections?.trending?.maxCompanies || 3
                    )
                    .join(', ')}
                </div>
              </div>
            )}
          </div>
        )}
      </HeroSection>

      {/* Jobs Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="order-2 flex-[3] md:order-1">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end sm:gap-0">
              <div className="w-full space-y-1 sm:w-auto">
                <h2 className="flex flex-wrap items-center gap-2 font-semibold text-xl tracking-tight">
                  Latest Opportunities
                  {page > 1 && (
                    <span className="font-normal text-gray-500">
                      Page {page}
                    </span>
                  )}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Showing {paginatedJobs.length.toLocaleString()} of{' '}
                  {sortedJobs.length.toLocaleString()} positions
                </p>
              </div>
              <div className="flex w-full items-center justify-between gap-3 overflow-x-auto pb-1 sm:w-auto sm:justify-end">
                <JobsPerPageSelect />
                <SortOrderSelect />
              </div>
            </div>

            <div className="space-y-4">
              {paginatedJobs.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    No positions found matching your search criteria. Try
                    adjusting your search terms.
                  </p>
                </div>
              ) : (
                paginatedJobs.map((job) => <JobCard job={job} key={job.id} />)
              )}
            </div>

            {/* Pagination with optimized range */}
            {sortedJobs.length > jobsPerPage && (
              <PaginationControl
                itemsPerPage={jobsPerPage}
                totalItems={sortedJobs.length}
              />
            )}

            {/* Post Job Banner - Mobile only */}
            <div className="mt-8 md:hidden">
              <PostJobBanner />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="order-1 w-full md:order-2 md:w-[240px] lg:w-[250px] xl:w-[260px]">
            <div className="space-y-6">
              <JobFilters
                initialFilters={initialFilters}
                jobs={initialJobs}
                onFilterChange={handleFilterChange}
              />
              {/* Post Job Banner - Desktop only */}
              <div className="hidden md:block">
                <PostJobBanner />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export function HomePage({ initialJobs }: { initialJobs: Job[] }) {
  return (
    <Suspense>
      <HomePageContent initialJobs={initialJobs} />
    </Suspense>
  );
}
