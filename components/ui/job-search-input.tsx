'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import config from '@/config';
import { useJobSearch } from '@/lib/hooks/useJobSearch';

type JobSearchInputProps = {
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
};

export function JobSearchInput({
  placeholder,
  className = 'pl-9 h-10',
  'aria-label': ariaLabel,
}: JobSearchInputProps) {
  // Get config values with fallbacks
  const defaultPlaceholder =
    config.search?.placeholder || 'Search by role, company, or location...';
  const defaultAriaLabel = config.search?.ariaLabel || 'Search jobs';

  // Use provided props or fallback to config values
  const finalPlaceholder = placeholder || defaultPlaceholder;
  const finalAriaLabel = ariaLabel || defaultAriaLabel;

  const { searchTerm, isSearching, handleSearch, clearSearch } = useJobSearch();
  const [inputValue, setInputValue] = useState(searchTerm || '');

  // Keep input value in sync with URL search term
  useEffect(() => {
    setInputValue(searchTerm || '');
  }, [searchTerm]);

  // Handle input changes without triggering search on every keystroke
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    // The debounced search is handled in the hook
    handleSearch(value);
  };

  // Handle keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setInputValue('');
      clearSearch();
    }
    // Explicitly don't search on Enter - we use debounce instead
  };

  // Handle clear button click
  const onClear = () => {
    setInputValue('');
    clearSearch();
  };

  // Get hero search background color from config
  const heroSearchBgColor = config?.ui?.heroSearchBgColor || '';

  return (
    <div className="relative">
      <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
      <Input
        aria-label={finalAriaLabel}
        className={className}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={finalPlaceholder}
        style={{ backgroundColor: heroSearchBgColor || undefined }}
        type="text"
        value={inputValue}
      />
      {inputValue && (
        <button
          aria-label="Clear search"
          className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {isSearching && (
        <div className="-translate-y-1/2 absolute top-1/2 right-10">
          <div className="pulse-dot h-2 w-2 rounded-full bg-blue-500 opacity-75" />
        </div>
      )}
    </div>
  );
}
