import { ArrowUpRight, ClipboardList } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { ClientBreadcrumb } from '@/components/ui/client-breadcrumb';
import { JobDetailsSidebar } from '@/components/ui/job-details-sidebar';
import { JobSchema } from '@/components/ui/job-schema';
import { PostJobBanner } from '@/components/ui/post-job-banner';
import { SimilarJobs } from '@/components/ui/similar-jobs';
import config from '@/config';
import { PARENTHESIS_CONTENT_REGEX } from '@/lib/constants/defaults';
import { formatSalary, getJobs } from '@/lib/db/airtable';
import { resolveColor } from '@/lib/utils/colors';
import { formatDate } from '@/lib/utils/formatDate';
import { generateMetadata as createMetadata } from '@/lib/utils/metadata';
import { generateJobSlug } from '@/lib/utils/slugify';

// Generate static params for all active jobs
export async function generateStaticParams() {
  const jobs = await getJobs();
  // getJobs already filters for active jobs, but we'll explicitly filter here for clarity
  return jobs
    .filter((job) => job.status === 'active')
    .map((job) => ({
      slug: generateJobSlug(job.title, job.company),
    }));
}

// Generate metadata for the job page
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // Get all jobs first and resolve params
  const [allJobs, { slug }] = await Promise.all([getJobs(), params]);

  // Find the job with matching slug
  const job = allJobs.find((j) => {
    const jobSlug = generateJobSlug(j.title, j.company);
    return jobSlug === slug;
  });

  if (!job) {
    return {
      title: `Job Not Found | ${config.title}`,
      description: "The job you're looking for could not be found.",
    };
  }

  // Format location for metadata based on workplace type
  const metaLocation = (() => {
    // For Remote jobs, show the region if available
    if (job.workplace_type === 'Remote') {
      if (!job.remote_region) {
        return 'Remote position (Worldwide)';
      }

      // For Worldwide specifically, don't use "in"
      if (job.remote_region === 'Worldwide') {
        return 'Remote position (Worldwide)';
      }

      // For other regions, use "in"
      return `Remote position in ${job.remote_region}`;
    }

    // For Hybrid jobs, show the location with Hybrid prefix
    if (job.workplace_type === 'Hybrid') {
      const location = [job.workplace_city, job.workplace_country]
        .filter(Boolean)
        .join(', ');
      return location ? `Hybrid position in ${location}` : 'Hybrid position';
    }

    // For On-site jobs, show the location directly
    if (job.workplace_type === 'On-site') {
      const location = [job.workplace_city, job.workplace_country]
        .filter(Boolean)
        .join(', ');
      return location ? `in ${location}` : '';
    }

    // Default case (Not specified)
    return '';
  })();

  // Format deadline if available
  const deadlineText = (() => {
    if (!job.valid_through) {
      return 'Apply now';
    }

    const deadline = new Date(job.valid_through);
    if (Number.isNaN(deadline.getTime())) {
      return 'Apply now';
    }

    return `Apply before ${deadline.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`;
  })();

  // Build description parts dynamically
  const parts = [];

  // First part - company, job type and title (removing parentheses if present in the title)
  const cleanTitle = job.title.replace(PARENTHESIS_CONTENT_REGEX, ' ').trim();

  // Base description
  let baseDescription = `${job.company} is hiring ${
    job.type ? job.type.toLowerCase() : ''
  } ${cleanTitle}`.trim();
  let baseDescriptionAdded = false;

  // Add location only if it exists
  if (metaLocation) {
    // For "in X" format, append directly; for other formats, add as new sentence
    if (metaLocation.startsWith('in ')) {
      baseDescription += ` ${metaLocation}`;
    } else {
      parts.push(baseDescription);
      parts.push(metaLocation);
      baseDescriptionAdded = true;
    }
  }

  // Add the base description if it wasn't added already
  if (!baseDescriptionAdded) {
    parts.push(baseDescription);
  }

  // Salary
  if (job.salary) {
    parts.push(`Salary: ${formatSalary(job.salary, true)}`);
  }

  // Deadline
  parts.push(deadlineText);

  // Use our utility to generate consistent metadata
  // Join with periods and ensure proper formatting
  const description = parts
    .join('. ')
    // Fix any double periods
    .replace(/\.\./g, '.')
    // Ensure there's a period at the end
    .replace(/(\w)$/, '$1.');

  return createMetadata({
    title: `${job.title} at ${job.company}`,
    description,
    path: `/jobs/${slug}`,
    openGraph: {
      type: 'article',
      images: [
        {
          url: `/api/og/jobs/${slug}`,
          width: 1200,
          height: 630,
          alt: `${job.title} at ${job.company}`,
        },
      ],
    },
  });
}

// Revalidate page every 5 minutes (300 seconds) instead of forcing dynamic rendering
export const revalidate = 300;

export default async function JobPostPage({
  params,
}: {
  params: { slug: string };
}) {
  // Await the params to resolve before using
  const { slug } = await params;

  const jobs = await getJobs();
  const job = jobs.find((j) => generateJobSlug(j.title, j.company) === slug);

  if (!job) {
    notFound();
  }

  // Return 404 for inactive jobs as per Google's structured data guidelines
  if (job.status !== 'active') {
    notFound();
  }

  const { fullDate, relativeTime } = formatDate(job.posted_date);
  const showSalary =
    job.salary && (job.salary.min !== null || job.salary.max !== null);

  // Format location based on workplace type
  const location =
    job.workplace_type === 'Remote'
      ? job.remote_region
        ? `Remote (${job.remote_region})`
        : null
      : job.workplace_type === 'Hybrid'
        ? [
            job.workplace_city,
            job.workplace_country,
            job.remote_region ? `Hybrid (${job.remote_region})` : null,
          ]
            .filter(Boolean)
            .join(', ') || null
        : [job.workplace_city, job.workplace_country]
            .filter(Boolean)
            .join(', ') || null;

  return (
    <main className="container py-6">
      <JobSchema job={job} slug={slug} />

      <div className="flex flex-col gap-4 md:flex-row lg:gap-8">
        {/* Main content */}
        <article className="order-1 flex-[3]">
          <div className="mb-6">
            <ClientBreadcrumb
              dynamicData={{
                name: job.title,
                url: `/jobs/${slug}`,
              }}
            />
          </div>
          <div className="mb-8">
            <div className="space-y-2">
              <h1 className="font-semibold text-2xl">{job.title}</h1>
              <div className="text-base text-gray-600">{job.company}</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                <div className="flex flex-wrap items-center gap-3 text-gray-500 text-sm">
                  <span>{job.type}</span>
                  {showSalary && (
                    <>
                      <span>•</span>
                      <span>{formatSalary(job.salary, true)}</span>
                    </>
                  )}
                  {location && (
                    <>
                      <span>•</span>
                      <span>{location}</span>
                    </>
                  )}
                </div>
                <Button
                  asChild
                  className="w-full gap-1.5 text-xs sm:w-auto"
                  size="xs"
                  style={{
                    backgroundColor: resolveColor(config.ui.primaryColor),
                  }}
                  variant="primary"
                >
                  <a
                    href={job.apply_url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Apply Now
                    <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="prose prose-sm prose-gray max-w-none">
            <div aria-hidden="true" className="my-8 h-px bg-gray-200" />
            <div className="markdown-content [&_a:hover]:text-zinc-800 [&_a]:text-zinc-900 [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors">
              {!job.description && (
                <p className="text-red-500">No description available</p>
              )}
              <div className="hidden">
                Raw description: {JSON.stringify(job.description)}
              </div>
              {/* Use our custom utility to process Airtable's markdown format */}
              <ReactMarkdown
                components={{
                  // Customize heading styles - consistent with the rest of the app
                  h1: ({ ...props }) => (
                    <h1 className="mb-2 font-semibold text-2xl" {...props} />
                  ),
                  h2: ({ ...props }) => (
                    <h2 className="mb-2 font-semibold text-xl" {...props} />
                  ),
                  h3: ({ ...props }) => (
                    <h3 className="mb-2 font-semibold text-lg" {...props} />
                  ),
                  h4: ({ ...props }) => (
                    <h4 className="mb-2 font-semibold text-base" {...props} />
                  ),
                  // Style links
                  a: ({ ...props }) => (
                    <a
                      className="text-blue-600 hover:text-blue-800"
                      rel="noopener noreferrer"
                      target="_blank"
                      {...props}
                    />
                  ),
                  // Style lists with better nesting support
                  ul: ({ className, ...props }) => {
                    // Always indent top-level lists; nested lists get natural browser indent
                    return (
                      <ul
                        className={`my-2 ml-4 list-disc ${className || ''}`}
                        {...props}
                      />
                    );
                  },
                  ol: ({ className, ...props }) => {
                    return (
                      <ol
                        className={`my-2 ml-4 list-decimal ${className || ''}`}
                        {...props}
                      />
                    );
                  },
                  // Style paragraphs
                  p: ({ ...props }) => <p className="my-2" {...props} />,
                  // Style blockquotes (for Airtable quote blocks)
                  blockquote: ({ ...props }) => (
                    <blockquote
                      className="my-4 border-gray-200 border-l-4 pl-4 italic"
                      {...props}
                    />
                  ),
                  // Style code blocks
                  code: ({ className, children, ...props }) => {
                    // Inline code typically has no language class
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code
                          className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    // Block code
                    return (
                      <pre className="my-4 overflow-x-auto rounded-md bg-gray-100 p-4">
                        <code className="font-mono text-sm" {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                  // Style checkboxes for Airtable's checkbox format and improve list item handling
                  li: ({ children, className, ...props }) => {
                    // Check if this is a checkbox item
                    if (
                      typeof children === 'string' &&
                      (children.startsWith('[x] ') ||
                        children.startsWith('[ ] '))
                    ) {
                      const checkedBox = children.startsWith('[x] ');
                      const text = children.substring(4);
                      return (
                        <li className="my-1 flex items-start gap-2" {...props}>
                          <input
                            checked={checkedBox}
                            className="mt-1"
                            readOnly
                            type="checkbox"
                          />
                          <span>{text}</span>
                        </li>
                      );
                    }

                    // Check if this is a bold list item (like "**Lifecycle Marketing**")
                    // This is a special case for job descriptions with bold list headers
                    const isBoldListItem =
                      typeof children === 'object' &&
                      React.isValidElement(children) &&
                      children.type === 'strong';

                    if (isBoldListItem) {
                      return (
                        <li className="my-2 font-semibold" {...props}>
                          {children}
                        </li>
                      );
                    }

                    // Default list item
                    const listItemClass = className || '';
                    // Use standard padding for list items
                    const spacingClass = 'pl-1';

                    return (
                      <li
                        className={`${listItemClass} ${spacingClass} my-1`}
                        {...props}
                      >
                        {children}
                      </li>
                    );
                  },
                }}
                remarkPlugins={[remarkGfm]}
              >
                {job.description}
              </ReactMarkdown>
            </div>
          </div>

          {/* Application Requirements - Prominently displayed before apply button */}
          {job.application_requirements && (
            <div className="mt-6 mb-4 rounded-md border border-amber-200 bg-amber-50 p-2">
              <h3 className="mb-1.5 flex items-center gap-1 font-semibold text-xs">
                <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
                Application Requirements
              </h3>
              <p className="text-gray-700 text-xs">
                {job.application_requirements}
              </p>
            </div>
          )}

          <div className="mt-8">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                className="w-full gap-1.5 text-xs sm:w-auto"
                size="xs"
                style={{
                  backgroundColor: resolveColor(config.ui.primaryColor),
                }}
                variant="primary"
              >
                <a
                  href={job.apply_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Apply Now
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </Button>
              {job.valid_through &&
                (() => {
                  const deadline = new Date(job.valid_through);
                  return (
                    !Number.isNaN(deadline.getTime()) && (
                      <span className="w-full text-center text-gray-500 text-xs sm:w-auto sm:text-left">
                        Apply before:{' '}
                        {deadline.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    )
                  );
                })()}
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="order-2 flex w-full flex-col gap-6 md:w-[240px] lg:w-[250px] xl:w-[260px]">
          {/* Job Details - Always show first in sidebar */}
          <JobDetailsSidebar
            apply_url={job.apply_url}
            benefits={job.benefits}
            career_level={job.career_level}
            fullDate={fullDate}
            job_identifier={job.job_identifier || null}
            job_source_name={job.job_source_name || null}
            jobUrl={`${config.url}/jobs/${slug}`}
            languages={job.languages}
            relativeTime={relativeTime}
            remote_region={job.remote_region}
            salary={job.salary}
            timezone_requirements={job.timezone_requirements}
            title={job.title}
            valid_through={job.valid_through || null}
            visa_sponsorship={job.visa_sponsorship}
            workplace_city={job.workplace_city}
            workplace_country={job.workplace_country}
            workplace_type={job.workplace_type}
          />

          {/* On mobile, Similar Jobs appear before Post Job Banner */}
          <div className="md:order-3">
            <SimilarJobs allJobs={jobs} currentJob={job} />
          </div>
          <div className="md:order-2">
            <PostJobBanner />
          </div>
        </aside>
      </div>
    </main>
  );
}
