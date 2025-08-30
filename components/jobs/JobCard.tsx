import { ArrowUpRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { JobBadge } from '@/components/ui/job-badge';
import config from '@/config';
import { formatSalary, type Job } from '@/lib/db/airtable';
import { resolveColor } from '@/lib/utils/colors';
import { formatDate } from '@/lib/utils/formatDate';
import { generateJobSlug } from '@/lib/utils/slugify';

export function JobCard({ job }: { job: Job }) {
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

  // Check if job was posted within the last 48 hours
  const isNew = () => {
    const now = new Date();
    const postedDate = new Date(job.posted_date);
    const diffInHours = Math.floor(
      (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60)
    );
    return diffInHours <= 48;
  };

  return (
    <div className="group relative">
      <Link
        className={`block rounded-lg border p-4 transition-all sm:p-5 ${
          job.featured
            ? 'bg-zinc-100 hover:bg-zinc-50'
            : 'hover:border-gray-400'
        }`}
        href={`/jobs/${generateJobSlug(job.title, job.company)}`}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <h2 className="line-clamp-2 font-medium text-base">
                {job.title}
              </h2>
              {isNew() && <JobBadge type="new">New</JobBadge>}
            </div>
            {job.featured && (
              <JobBadge
                className="shrink-0"
                icon={<Sparkles className="h-3 w-3" />}
                type="featured"
              >
                Featured
              </JobBadge>
            )}
          </div>
          <div className="text-gray-600 text-sm">{job.company}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-500 text-xs">
            <span className="whitespace-nowrap">{job.type}</span>
            {showSalary && (
              <>
                <span>•</span>
                <span className="whitespace-nowrap">
                  {formatSalary(job.salary, true)}
                </span>
              </>
            )}
            {location && (
              <>
                <span>•</span>
                <span className="whitespace-nowrap">{location}</span>
              </>
            )}
            <span>•</span>
            <time className="whitespace-nowrap" dateTime={job.posted_date}>
              {fullDate} ({relativeTime})
            </time>
          </div>
        </div>
      </Link>
      {job.apply_url && (
        <div className="absolute right-4 bottom-4 hidden opacity-0 transition-opacity group-hover:opacity-100 sm:block">
          <Button
            asChild
            className="gap-1.5 text-xs"
            size="xs"
            style={{ backgroundColor: resolveColor(config.ui.primaryColor) }}
            variant="primary"
          >
            <a
              href={job.apply_url}
              onClick={(e) => e.stopPropagation()}
              rel="noopener noreferrer"
              target="_blank"
            >
              Apply Now
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
