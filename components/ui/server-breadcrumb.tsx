import { ServerBreadcrumb } from '@/components/ui/breadcrumb';
import { CAREER_LEVEL_DISPLAY_NAMES } from '@/lib/constants/career-levels';
import { JOB_TYPE_DISPLAY_NAMES } from '@/lib/constants/job-types';
import { getDisplayNameFromCode } from '@/lib/constants/languages';
import { formatLocationTitle } from '@/lib/constants/locations';

// Category-related constants
const CATEGORY_SECTIONS = ['types', 'levels', 'languages', 'locations'];
const CATEGORY_TYPES = ['type', 'level', 'language', 'location'];

// Special case mappings for better display names (just for section names)
const SEGMENT_DISPLAY_NAMES: Record<string, string> = {
  // Main sections
  jobs: 'Jobs',
  pricing: 'Pricing',
  about: 'About',
  contact: 'Contact',
  faq: 'FAQ',
  'job-alerts': 'Job Alerts',
  changelog: 'Changelog',

  // Job categories
  types: 'Job Types',
  levels: 'Career Levels',
  languages: 'Languages',
  locations: 'Job Locations',

  // Type mapping - match with URL segment
  type: 'Type',
  level: 'Level',
  language: 'Language',
  location: 'Location',
};

// Words that should not be capitalized in title case (unless they're the first word)
const LOWERCASE_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'for',
  'nor',
  'on',
  'at',
  'to',
  'from',
  'by',
  'with',
  'in',
  'of',
]);

// Apply standard title casing rules
const applyTitleCase = (text: string): string => {
  // Split the text into words
  const words = text.split('-');

  // Process each word
  return words
    .map((word, index) => {
      // Check if this looks like an acronym (all uppercase or 2-3 characters)
      if (word.length <= 3) {
        return word.toUpperCase();
      }

      // Check if it's a common lowercase word (unless it's the first word)
      if (index > 0 && LOWERCASE_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase();
      }

      // Default: capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Format a segment using existing utility functions and smart title casing
const formatSegment = (
  segment: string,
  context?: {
    type?: 'jobType' | 'careerLevel' | 'language' | 'location';
    parentSegment?: string;
  }
): string => {
  // Check if we have a named mapping first (for section names)
  if (SEGMENT_DISPLAY_NAMES[segment]) {
    return SEGMENT_DISPLAY_NAMES[segment];
  }

  // Handle based on context if provided
  if (context) {
    if (context.type === 'location' || context.parentSegment === 'location') {
      // Handle hyphenated location names by converting to spaces before formatting
      const formattedLocation = segment.replace(/-/g, ' ');
      return formatLocationTitle(formattedLocation);
    }

    if (context.type === 'language' || context.parentSegment === 'language') {
      try {
        return getDisplayNameFromCode(segment as string);
      } catch {
        // Fall back to default formatting below
      }
    }

    if (context.type === 'jobType' || context.parentSegment === 'type') {
      // Check if it matches any of our job types (case-insensitive)
      const match = Object.entries(JOB_TYPE_DISPLAY_NAMES).find(
        ([key]) => key.toLowerCase() === segment.toLowerCase()
      );
      if (match) {
        return match[1];
      }
    }

    if (context.type === 'careerLevel' || context.parentSegment === 'level') {
      // Check if it matches any of our career levels (case-insensitive)
      const match = Object.entries(CAREER_LEVEL_DISPLAY_NAMES).find(
        ([key]) => key.toLowerCase() === segment.toLowerCase()
      );
      if (match) {
        return match[1];
      }
    }
  }

  // Apply standard title casing for anything not handled above
  return applyTitleCase(segment);
};

// Handle job detail page breadcrumbs (like /jobs/job-title)
const handleJobDetailPage = (
  _segments: string[],
  dynamicData: { name: string; url: string }
): { name: string; url: string }[] => {
  return [
    { name: 'Home', url: '/' },
    { name: 'Jobs', url: '/jobs' },
    dynamicData,
  ];
};

// Handle job category detail page breadcrumbs (like /jobs/type/full-time)
const handleCategoryDetailPage = (
  segments: string[]
): { name: string; url: string }[] => {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Jobs', url: '/jobs' },
  ];

  // Add Category segment (Type, Level, etc.)
  const categoryName = formatSegment(segments[1]);
  const categoryPlural = `${segments[1]}s`; // e.g., types, levels
  breadcrumbs.push({
    name: categoryName,
    url: `/jobs/${categoryPlural}`,
  });

  // Add the specific value with nice formatting based on category type
  const valueSegment = formatSegment(segments[2], {
    parentSegment: segments[1],
  });

  // Add "Jobs" to the end for job categories
  breadcrumbs.push({
    name: `${valueSegment} Jobs`,
    url: `/${segments[0]}/${segments[1]}/${segments[2]}`,
  });

  return breadcrumbs;
};

// Handle standard page breadcrumbs
const handleStandardPage = (
  segments: string[]
): { name: string; url: string }[] => {
  const breadcrumbs = [{ name: 'Home', url: '/' }];
  let currentPath = '';

  // Build breadcrumbs for each segment
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Determine context for better formatting
    const context = i > 0 ? { parentSegment: segments[i - 1] } : undefined;

    breadcrumbs.push({
      name: formatSegment(segment, context),
      url: currentPath,
    });
  }

  return breadcrumbs;
};

// Generate breadcrumb items based on current path
const generateBreadcrumbItems = (
  pathname: string,
  dynamicData?: { name: string; url: string }
) => {
  const segments = pathname.split('/').filter(Boolean);

  // Handle special case for job detail pages
  if (
    dynamicData &&
    segments.length >= 2 &&
    segments[0] === 'jobs' &&
    !CATEGORY_SECTIONS.includes(segments[1])
  ) {
    return handleJobDetailPage(segments, dynamicData);
  }

  // Special handling for job category detail pages (job/type/full-time, etc.)
  if (
    segments.length >= 3 &&
    segments[0] === 'jobs' &&
    CATEGORY_TYPES.includes(segments[1])
  ) {
    return handleCategoryDetailPage(segments);
  }

  // Default: handle as standard page path
  return handleStandardPage(segments);
};

type PageBreadcrumbProps = {
  /**
   * Current page path
   */
  pathname: string;

  /**
   * Optional dynamic data to override the automatically generated breadcrumb
   * Useful for job detail pages where the title comes from the job data
   */
  dynamicData?: {
    name: string;
    url: string;
  };

  /**
   * Optional className to apply to the breadcrumb container
   */
  className?: string;
};

export function PageBreadcrumb({
  pathname,
  dynamicData,
  className,
}: PageBreadcrumbProps) {
  // Generate breadcrumb items based on the provided path
  const items = generateBreadcrumbItems(pathname, dynamicData);

  return <ServerBreadcrumb className={className} items={items} />;
}
