import { formatDistanceToNow } from 'date-fns';
import {
  Briefcase,
  Calendar,
  Clock,
  Flag,
  Gift,
  Globe,
  Hash,
  Languages,
  Laptop,
  Link,
  MapPin,
  Wallet,
} from 'lucide-react';
import { CollapsibleText } from '@/components/ui/collapsible-text';
import { JobBadge } from '@/components/ui/job-badge';
import config from '@/config';
import {
  getDisplayNameFromCode,
  type LanguageCode,
} from '@/lib/constants/languages';
import type { RemoteRegion, WorkplaceType } from '@/lib/constants/workplace';
import {
  type CareerLevel,
  formatSalary,
  formatUSDApproximation,
  type Salary,
} from '@/lib/db/airtable';

type JobDetailsSidebarProps = {
  title: string;
  jobUrl: string;
  fullDate: string;
  relativeTime: string;
  workplace_type: WorkplaceType;
  remote_region: RemoteRegion;
  timezone_requirements: string | null;
  workplace_city: string | null;
  workplace_country: string | null;
  salary: Salary | null;
  career_level: CareerLevel[];
  apply_url: string;
  visa_sponsorship: string;
  languages: LanguageCode[];
  benefits: string | null;
  valid_through: string | null;
  job_identifier: string | null;
  job_source_name: string | null;
};

function formatCareerLevel(level: CareerLevel): string {
  const formatMap: Record<CareerLevel, string> = {
    Internship: 'Internship',
    EntryLevel: 'Entry Level',
    Associate: 'Associate',
    Junior: 'Junior',
    MidLevel: 'Mid Level',
    Senior: 'Senior',
    Staff: 'Staff',
    Principal: 'Principal',
    Lead: 'Lead',
    Manager: 'Manager',
    SeniorManager: 'Senior Manager',
    Director: 'Director',
    SeniorDirector: 'Senior Director',
    VP: 'VP',
    SVP: 'SVP',
    EVP: 'EVP',
    CLevel: 'C-Level',
    Founder: 'Founder',
    NotSpecified: 'Not Specified',
  };

  return formatMap[level] || level;
}

export function JobDetailsSidebar({
  title,
  jobUrl,
  fullDate,
  relativeTime,
  workplace_type,
  remote_region,
  timezone_requirements,
  workplace_city,
  workplace_country,
  salary,
  career_level,
  apply_url,
  visa_sponsorship,
  languages,
  benefits,
  valid_through,
  job_identifier,
  job_source_name,
}: JobDetailsSidebarProps) {
  const showSalary = salary && (salary.min !== null || salary.max !== null);
  const usdApprox = showSalary ? formatUSDApproximation(salary) : null;
  const careerLevels = Array.from(
    new Set(Array.isArray(career_level) ? career_level : [career_level])
  );

  // Format location
  const location = [workplace_city, workplace_country]
    .filter(Boolean)
    .join(', ');

  // Format the application deadline if available
  const formatDeadline = () => {
    if (!valid_through) {
      return null;
    }

    const deadlineDate = new Date(valid_through);
    const now = new Date();
    const isPastDeadline = deadlineDate < now;

    // Calculate relative time to deadline
    const relativeDeadline = formatDistanceToNow(deadlineDate, {
      addSuffix: false,
    });

    // Format the date to a user-friendly string
    return {
      fullDate: deadlineDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      relativeTime: isPastDeadline
        ? `${relativeDeadline} ago`
        : `in ${relativeDeadline}`,
      isPastDeadline,
    };
  };

  const deadline = formatDeadline();

  return (
    <div className="space-y-4 rounded-lg border bg-gray-50 p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-md font-semibold">Job Details</h2>
        {config.jobReport.enabled && config.jobReport.showInSidebar && (
          <a
            className="flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800"
            href={`mailto:${
              config.jobReport.email
            }?subject=${encodeURIComponent(
              config.jobReport.emailSubject.replace('[Job Title]', title)
            )}&body=${encodeURIComponent(
              config.jobReport.emailMessage
                .replace('[Job Title]', title)
                .replace('[Job URL]', jobUrl)
            )}`}
          >
            <Flag className="h-3 w-3" />
            {config.jobReport.buttonText}
          </a>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
          <h3 className="text-sm font-medium">Date Posted</h3>
        </div>
        <p className="ml-6 text-sm text-gray-600">
          {fullDate} ({relativeTime})
        </p>
      </div>

      {/* Application Deadline */}
      {deadline && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-gray-500" />
            <h3 className="text-sm font-medium">Application Deadline</h3>
          </div>
          <div className="ml-6">
            <p className="text-sm text-gray-600">
              {deadline.fullDate} ({deadline.relativeTime})
            </p>
            {deadline.isPastDeadline && (
              <p className="mt-1 text-xs text-amber-600">
                This deadline has passed, but the job may still be accepting
                applications.
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
          <h3 className="text-sm font-medium">Job Location</h3>
        </div>
        {workplace_type === 'Remote' ? (
          <span className="ml-6 text-sm text-gray-600">
            Remote ({remote_region || 'Worldwide'})
          </span>
        ) : workplace_type === 'Hybrid' ? (
          <span className="ml-6 text-sm text-gray-600">
            {[location, `Hybrid (${remote_region})`].filter(Boolean).join(', ')}
          </span>
        ) : (
          <p className="ml-6 text-sm text-gray-600">
            {location || 'Not specified'}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <Laptop className="h-4 w-4 shrink-0 text-gray-500" />
          <h3 className="text-sm font-medium">Workplace Type</h3>
        </div>
        <div className="ml-6">
          <JobBadge
            type={
              workplace_type === 'Not specified'
                ? 'not specified'
                : workplace_type === 'On-site'
                  ? 'onsite'
                  : (workplace_type.toLowerCase() as
                      | 'remote'
                      | 'hybrid'
                      | 'default')
            }
          >
            {workplace_type}
          </JobBadge>
        </div>
      </div>

      {showSalary && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Wallet className="h-4 w-4 shrink-0 text-gray-500" />
            <h3 className="text-sm font-medium">Salary</h3>
          </div>
          <div className="ml-6">
            <p className="text-sm text-gray-600">
              {formatSalary(salary, true)}
            </p>
            {usdApprox && (
              <p className="mt-0.5 text-xs text-gray-500">{usdApprox}</p>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center gap-2">
          <Briefcase className="h-4 w-4 shrink-0 text-gray-500" />
          <h3 className="text-sm font-medium">Career Level</h3>
        </div>
        <div className="ml-6 flex flex-wrap gap-1.5">
          {careerLevels.map((level, index) => (
            <JobBadge
              href={
                level === 'NotSpecified'
                  ? undefined
                  : `/jobs/level/${level.toLowerCase()}`
              }
              key={`${level}-${index}`}
              type="career-level"
            >
              {formatCareerLevel(level)}
            </JobBadge>
          ))}
        </div>
      </div>

      {job_source_name && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link className="h-4 w-4 shrink-0 text-gray-500" />
            <h3 className="text-sm font-medium">Job Source</h3>
          </div>
          <a
            className="ml-6 text-sm text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-800"
            href={apply_url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {job_source_name}
          </a>
        </div>
      )}

      {/* Job Identifier */}
      {job_identifier && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Hash className="h-4 w-4 shrink-0 text-gray-500" />
            <h3 className="text-sm font-medium">Job ID</h3>
          </div>
          <p className="ml-6 text-sm text-gray-600">{job_identifier}</p>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center gap-2">
          <Globe className="h-4 w-4 shrink-0 text-gray-500" />
          <h3 className="text-sm font-medium">Visa Sponsorship</h3>
        </div>
        <div className="ml-6">
          <JobBadge
            type={
              visa_sponsorship === 'Yes'
                ? 'visa-yes'
                : visa_sponsorship === 'No'
                  ? 'visa-no'
                  : 'visa-not-specified'
            }
          >
            {visa_sponsorship}
          </JobBadge>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-gray-500" />
          <h3 className="text-sm font-medium">Job Timezones</h3>
        </div>
        <p className="ml-6 text-sm text-gray-600">
          {timezone_requirements || 'Not specified'}
        </p>
      </div>

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Languages className="h-4 w-4 shrink-0 text-gray-500" />
            <h3 className="text-sm font-medium">Languages</h3>
          </div>
          <div className="ml-6 flex flex-wrap gap-1.5">
            {languages.map((langCode) => (
              <JobBadge
                href={`/jobs/language/${langCode}`}
                key={langCode}
                type="language"
              >
                {getDisplayNameFromCode(langCode)}
              </JobBadge>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      {benefits && (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Gift className="h-4 w-4 shrink-0 text-gray-500" />
            <h3 className="text-sm font-medium">Benefits & Perks</h3>
          </div>
          <div className="ml-6">
            <CollapsibleText maxLength={150} text={benefits} />
          </div>
        </div>
      )}
    </div>
  );
}
