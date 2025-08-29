"use client";

import { useState, useCallback, useEffect } from "react";
import type { Job, CareerLevel } from "@/lib/db/airtable";
import { JobListings } from "@/components/jobs/JobListings";
import { PostJobBanner } from "@/components/ui/post-job-banner";
import { useSearchParams } from "next/navigation";
import { ClientBreadcrumb } from "@/components/ui/client-breadcrumb";
import { JobsPerPageSelect } from "@/components/ui/jobs-per-page-select";
import { SortOrderSelect } from "@/components/ui/sort-order-select";
import { useSortOrder } from "@/lib/hooks/useSortOrder";
import { usePagination } from "@/lib/hooks/usePagination";
import { PaginationControl } from "@/components/ui/pagination-control";
import { JobFilters } from "@/components/ui/job-filters";
import { LanguageCode } from "@/lib/constants/languages";
import { JobType } from "@/lib/constants/job-types";
import { useJobSearch } from "@/lib/hooks/useJobSearch";
import { filterJobsBySearch } from "@/lib/utils/filter-jobs";

interface JobsLayoutProps {
  filteredJobs: Job[];
}

export function JobsLayout({ filteredJobs }: JobsLayoutProps) {
  const searchParams = useSearchParams();
  const { sortOrder } = useSortOrder();
  const { page } = usePagination();
  const { searchTerm } = useJobSearch();

  // Filter state
  const [selectedJobs, setSelectedJobs] = useState<Job[]>(filteredJobs);

  // Get URL params or defaults
  const jobsPerPage = Number(searchParams.get("per_page")) || 10;

  // Handle filter changes
  const handleFilterChange = useCallback(
    (
      filterType:
        | "type"
        | "role"
        | "remote"
        | "salary"
        | "visa"
        | "language"
        | "clear",
      value:
        | string[]
        | boolean
        | CareerLevel[]
        | LanguageCode[]
        | JobType[]
        | true
    ) => {
      if (filterType === "clear") {
        setSelectedJobs(filteredJobs);
        return;
      }

      // First apply search filter to the original filtered jobs
      let newFilteredJobs = filterJobsBySearch(filteredJobs, searchTerm || "");

      // Apply type filter
      if (filterType === "type" && Array.isArray(value) && value.length > 0) {
        // Type assertion to tell TypeScript this is a JobType array
        const jobTypes = value as JobType[];
        newFilteredJobs = newFilteredJobs.filter((job) =>
          jobTypes.includes(job.type as JobType)
        );
      }

      // Apply role/career level filter
      if (filterType === "role" && Array.isArray(value) && value.length > 0) {
        // Type assertion to tell TypeScript this is a CareerLevel array
        const careerLevels = value as CareerLevel[];
        newFilteredJobs = newFilteredJobs.filter((job) =>
          careerLevels.some((level) => job.career_level.includes(level))
        );
      }

      // Apply remote filter
      if (filterType === "remote" && value === true) {
        newFilteredJobs = newFilteredJobs.filter(
          (job) => job.workplace_type === "Remote"
        );
      }

      // Apply salary filter
      if (filterType === "salary" && Array.isArray(value) && value.length > 0) {
        // Type assertion to tell TypeScript this is a string array
        const salaryRanges = value as string[];
        // Handle salary filtering logic here
        newFilteredJobs = newFilteredJobs.filter((job) => {
          if (!job.salary) return false;

          // Calculate annual salary based on available data
          let annualSalary = 0;
          if (job.salary.max) {
            annualSalary = job.salary.max;
          } else if (job.salary.min) {
            // If hourly, convert to annual (assuming 2080 hours per year)
            annualSalary = job.salary.min * 2080;
          }

          if (annualSalary === 0) return false;

          if (salaryRanges.includes("< $50K") && annualSalary < 50000)
            return true;
          if (
            salaryRanges.includes("$50K - $100K") &&
            annualSalary >= 50000 &&
            annualSalary <= 100000
          )
            return true;
          if (
            salaryRanges.includes("$100K - $200K") &&
            annualSalary > 100000 &&
            annualSalary <= 200000
          )
            return true;
          if (salaryRanges.includes("> $200K") && annualSalary > 200000)
            return true;

          return false;
        });
      }

      // Apply visa filter
      if (filterType === "visa" && value === true) {
        newFilteredJobs = newFilteredJobs.filter(
          (job) => job.visa_sponsorship === "Yes"
        );
      }

      // Apply language filter
      if (
        filterType === "language" &&
        Array.isArray(value) &&
        value.length > 0
      ) {
        // Type assertion to tell TypeScript this is a LanguageCode array
        const languageCodes = value as LanguageCode[];
        newFilteredJobs = newFilteredJobs.filter((job) =>
          job.languages?.some((lang) =>
            languageCodes.includes(lang as LanguageCode)
          )
        );
      }

      setSelectedJobs(newFilteredJobs);
    },
    [filteredJobs, searchTerm]
  );

  // Apply search filter whenever the search term changes
  useEffect(() => {
    // Reset filters and apply search
    const searchFiltered = filterJobsBySearch(filteredJobs, searchTerm || "");
    setSelectedJobs(searchFiltered);
  }, [searchTerm, filteredJobs]);

  // Sort jobs
  const sortedJobs = [...selectedJobs].sort((a, b) => {
    switch (sortOrder) {
      case "oldest":
        return (
          new Date(a.posted_date).getTime() - new Date(b.posted_date).getTime()
        );
      case "salary":
        const aMax = a.salary?.max || 0;
        const bMax = b.salary?.max || 0;
        return bMax - aMax;
      default: // newest
        return (
          new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
        );
    }
  });

  // Pagination
  const startIndex = (page - 1) * jobsPerPage;
  const paginatedJobs = sortedJobs.slice(startIndex, startIndex + jobsPerPage);

  return (
    <main className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-4">
        <ClientBreadcrumb />
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-4 lg:gap-8">
        {/* Main content */}
        <div className="flex-[3] order-2 lg:order-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4 sm:gap-0">
            <div className="space-y-1 w-full sm:w-auto">
              <h1 className="text-xl lg:text-2xl font-semibold tracking-tight flex items-center gap-2 flex-wrap">
                Latest Jobs
                {page > 1 && (
                  <span className="text-gray-500 font-normal">Page {page}</span>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                Showing {paginatedJobs.length.toLocaleString()} of{" "}
                {sortedJobs.length.toLocaleString()} positions
              </p>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto overflow-x-auto pb-1">
              <JobsPerPageSelect />
              <SortOrderSelect />
            </div>
          </div>

          <JobListings jobs={paginatedJobs} />

          {sortedJobs.length > jobsPerPage && (
            <PaginationControl
              totalItems={sortedJobs.length}
              itemsPerPage={jobsPerPage}
            />
          )}

          {/* Post Job Banner - Mobile only */}
          <div className="mt-8 lg:hidden">
            <PostJobBanner />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-[240px] xl:w-[260px] order-first lg:order-last">
          <div className="space-y-6">
            <JobFilters
              onFilterChange={handleFilterChange}
              initialFilters={{
                types: [],
                roles: [],
                remote: false,
                salaryRanges: [],
                visa: false,
                languages: [],
              }}
              jobs={filteredJobs}
            />
            {/* Post Job Banner - Desktop only */}
            <div className="hidden lg:block">
              <PostJobBanner />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
