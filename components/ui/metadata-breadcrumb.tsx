import type { Metadata } from 'next';
import { ServerBreadcrumb } from '@/components/ui/breadcrumb';

type MetadataBreadcrumbProps = {
  /**
   * The page metadata to extract breadcrumb information from
   */
  metadata: Metadata;

  /**
   * Current pathname to determine the active breadcrumb
   */
  pathname: string;

  /**
   * Optional className to apply to the breadcrumb container
   */
  className?: string;

  /**
   * Optional explicit breadcrumb items to use instead of generating from metadata
   */
  items?: { name: string; url: string }[];
};

/**
 * Extracts breadcrumb items from page metadata
 */
function extractBreadcrumbsFromMetadata(
  metadata: Metadata,
  pathname: string
): { name: string; url: string }[] {
  // Start with home
  const breadcrumbs: { name: string; url: string }[] = [
    { name: 'Home', url: '/' },
  ];

  // Get title from metadata
  let title = '';
  if (typeof metadata.title === 'string') {
    title = metadata.title;
  } else if (metadata.title && 'default' in metadata.title) {
    title = metadata.title.default as string;
  }

  // If we have a title, add the current page
  if (title) {
    // Remove any site suffix (e.g., " | My Site")
    const cleanedTitle = title.split('|')[0].trim();
    breadcrumbs.push({
      name: cleanedTitle,
      url: pathname,
    });
  }

  return breadcrumbs;
}

/**
 * Server component that generates breadcrumbs from page metadata
 */
export function MetadataBreadcrumb({
  metadata,
  pathname,
  className,
  items: explicitItems,
}: MetadataBreadcrumbProps) {
  // Use provided items or extract from metadata
  const breadcrumbItems =
    explicitItems || extractBreadcrumbsFromMetadata(metadata, pathname);

  return <ServerBreadcrumb className={className} items={breadcrumbItems} />;
}
