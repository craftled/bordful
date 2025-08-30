import Link from 'next/link';
import type { Job } from '@/lib/db/airtable';
import { generateJobSlug } from '@/lib/utils/slugify';

type SimilarJobsProps = {
  currentJob: Job;
  allJobs: Job[];
};

export function SimilarJobs({ currentJob, allJobs }: SimilarJobsProps) {
  // Filter similar jobs based on title, location, or company
  const similarJobs = allJobs
    .filter((job) => {
      // Exclude current job
      if (job.id === currentJob.id) {
        return false;
      }

      // Check if job title contains similar keywords or is in same location
      const titleWords = currentJob.title.toLowerCase().split(' ');
      const jobTitleLower = job.title.toLowerCase();
      const isSimilarTitle = titleWords.some(
        (word) => word.length > 3 && jobTitleLower.includes(word)
      );

      // Compare workplace location
      const isSameLocation =
        (job.workplace_type === 'Remote' &&
          currentJob.workplace_type === 'Remote') ||
        (job.workplace_city &&
          currentJob.workplace_city &&
          job.workplace_city === currentJob.workplace_city) ||
        (job.workplace_country &&
          currentJob.workplace_country &&
          job.workplace_country === currentJob.workplace_country);

      return isSimilarTitle || isSameLocation;
    })
    .slice(0, 5); // Show max 5 similar jobs

  if (similarJobs.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="mb-3 font-semibold text-lg">Similar Jobs</h2>
      <div className="space-y-3">
        {similarJobs.map((job) => {
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
            <Link
              className="block hover:text-gray-900"
              href={`/jobs/${generateJobSlug(job.title, job.company)}`}
              key={job.id}
            >
              <div className="text-xs leading-tight">{job.title}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500 leading-tight">
                <span>{job.company}</span>
                <span>•</span>
                <span>{job.type}</span>
                {location && (
                  <>
                    <span>•</span>
                    <span>{location}</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
