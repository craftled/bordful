'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import config from '@/config';
import { SORT_TRIGGER_WIDTH, SORT_TRIGGER_WIDTH_SM } from '@/lib/constants/defaults';
import { useSortOrder } from '@/lib/hooks/useSortOrder';

type SortOption = 'newest' | 'oldest' | 'salary';

// Sort option labels mapping
const sortOptionLabels: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  salary: 'Highest salary',
};

export function SortOrderSelect() {
  const { sortOrder, setSortOrder } = useSortOrder();

  // Get available sort options from config or use default
  const availableSortOptions = config.jobListings?.sortOptions || [
    'newest',
    'oldest',
    'salary',
  ];

  // Get default sort order from config or use "newest"
  const defaultSortOrder =
    (config.jobListings?.defaultSortOrder as SortOption) || 'newest';

  // Get label configuration with fallbacks
  const showLabel = config.jobListings?.labels?.sortOrder?.show ?? true;
  const labelText = config.jobListings?.labels?.sortOrder?.text || 'Sort by:';

  // Adjust width based on whether label is shown
  const triggerWidth = `w-[${SORT_TRIGGER_WIDTH}px] sm:w-[${SORT_TRIGGER_WIDTH_SM}px]`;

  return (
    <div className="flex items-center gap-2">
      {/* Only show label if configured */}
      {showLabel && (
        <label
          className="hidden whitespace-nowrap text-muted-foreground text-sm sm:inline"
          htmlFor="sort-order-trigger"
        >
          {labelText}
        </label>
      )}
      <Select
        onValueChange={(value: SortOption) => {
          // Only pass null if it's the default value
          if (value === defaultSortOrder) {
            setSortOrder(null);
          } else {
            setSortOrder(value);
          }
        }}
        value={sortOrder}
      >
        <SelectTrigger
          aria-label="Select sort order for job listings"
          className={`${triggerWidth} h-7 text-xs`}
          id="sort-order-trigger"
        >
          <SelectValue
            placeholder={
              sortOptionLabels[sortOrder as SortOption] ||
              sortOptionLabels[defaultSortOrder]
            }
          />
        </SelectTrigger>
        <SelectContent className="bg-white" position="popper">
          {availableSortOptions.map((option) => (
            <SelectItem className="text-xs" key={option} value={option}>
              {sortOptionLabels[option as SortOption]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
