'use client';

import { usePathname } from 'next/navigation';
import { PageBreadcrumb } from './server-breadcrumb';

type ClientBreadcrumbProps = {
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

/**
 * Client-side breadcrumb wrapper that gets the current pathname
 * and passes it to the server-side breadcrumb component
 */
export function ClientBreadcrumb({
  dynamicData,
  className,
}: ClientBreadcrumbProps) {
  const pathname = usePathname();

  return (
    <PageBreadcrumb
      className={className}
      dynamicData={dynamicData}
      pathname={pathname}
    />
  );
}
