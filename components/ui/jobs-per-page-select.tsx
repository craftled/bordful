'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import config from '@/config';
import {
  DEFAULT_PER_PAGE,
  MIN_WIDTH_SELECT,
  PER_PAGE_OPTIONS,
  TRIGGER_HEIGHT,
  TRIGGER_WIDTH_MD,
  TRIGGER_WIDTH_SM,
} from '@/lib/constants/defaults';
import { usePagination } from '@/lib/hooks/usePagination';

export function JobsPerPageSelect() {
  const { perPage, setPerPage } = usePagination();
  const defaultPerPage = config.jobListings?.defaultPerPage || DEFAULT_PER_PAGE;

  // Options for per page
  const perPageOptions = PER_PAGE_OPTIONS;

  // Get label configuration with fallbacks
  const showLabel = config.jobListings?.labels?.perPage?.show ?? true;
  const labelText =
    config.jobListings?.labels?.perPage?.text || 'Jobs per page:';

  // Ensure perPage is a valid option
  const validPerPage = perPageOptions.includes(perPage)
    ? perPage
    : defaultPerPage;

  // Adjust width based on whether label is shown
  const triggerWidth = `w-[${TRIGGER_WIDTH_SM}px] sm:w-[${TRIGGER_WIDTH_MD}px]`;

  return (
    <div className="flex items-center gap-2">
      {/* Only show label if configured */}
      {showLabel && (
        <label
          className="hidden whitespace-nowrap text-muted-foreground text-sm sm:inline"
          htmlFor="per-page-trigger"
        >
          {labelText}
        </label>
      )}
      <Select
        onValueChange={(value) => {
          const newValue = Number.parseInt(value, 10);
          setPerPage(newValue === defaultPerPage ? null : newValue);
        }}
        value={validPerPage.toString()}
      >
        <SelectTrigger
          aria-label="Select number of jobs to display per page"
          className={`${triggerWidth} h-${TRIGGER_HEIGHT} text-xs`}
          id="per-page-trigger"
        >
          <SelectValue
            placeholder={showLabel ? validPerPage : `${validPerPage} per page`}
          />
        </SelectTrigger>
        <SelectContent
          aria-label="Jobs per page options"
          className={`min-w-[${MIN_WIDTH_SELECT}px] bg-white`}
          position="popper"
        >
          {perPageOptions.map((option) => (
            <SelectItem
              className="text-xs"
              key={option}
              value={option.toString()}
            >
              {showLabel ? option : `${option} per page`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
