import Script from 'next/script';
import type {
  Country,
  JobPosting,
  MonetaryAmount,
  Organization,
  Place,
  QuantitativeValue,
  WithContext,
} from 'schema-dts';
import config from '@/config';
import type { Job, Salary } from '@/lib/db/airtable';

// Utility functions for schema formatting
function formatJobLocationType(job: Job): string | null {
  return job.workplace_type === 'Remote' ? 'TELECOMMUTE' : null;
}

function formatEmploymentType(type: string): string {
  const mappings: Record<string, string> = {
    'Full-time': 'FULL_TIME',
    'Part-time': 'PART_TIME',
    Contract: 'CONTRACTOR',
    Freelance: 'CONTRACTOR',
  };
  return mappings[type] || 'OTHER';
}

function formatSalaryForSchema(salary: Salary | null): MonetaryAmount | null {
  if (!salary || !(salary.min || salary.max)) {
    return null;
  }

  // Convert salary unit to schema.org unitText format
  const unitTextMapping: Record<string, string> = {
    hour: 'HOUR',
    day: 'DAY',
    week: 'WEEK',
    month: 'MONTH',
    year: 'YEAR',
    project: 'HOUR', // Default to HOUR for project as schema.org doesn't have a project unit
  };

  const unitText = unitTextMapping[salary.unit];

  // For a range, include minValue and maxValue
  if (salary.min && salary.max) {
    return {
      '@type': 'MonetaryAmount',
      currency: salary.currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: salary.min,
        maxValue: salary.max,
        unitText,
      } as QuantitativeValue,
    };
  }

  // For a single value (either min or max)
  // Make sure we always have a non-null value
  const singleValue = (salary.min || salary.max) as number;

  return {
    '@type': 'MonetaryAmount',
    currency: salary.currency,
    value: {
      '@type': 'QuantitativeValue',
      value: singleValue,
      unitText,
    } as QuantitativeValue,
  };
}

function formatLocation(job: Job): Place | null {
  // For remote jobs with no physical location
  if (
    job.workplace_type === 'Remote' &&
    !job.workplace_city &&
    !job.workplace_country
  ) {
    return null;
  }

  // For jobs with a physical location component
  return {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      ...(job.workplace_city && { addressLocality: job.workplace_city }),
      ...(job.workplace_country && { addressCountry: job.workplace_country }),
    },
  };
}

function formatApplicantLocationRequirements(
  job: Job
): Country | Country[] | null {
  // Only needed for remote jobs, but always return something for remote jobs
  if (job.workplace_type !== 'Remote') {
    return null;
  }

  // If no remote region specified or it's Worldwide, return a worldwide requirement
  if (!job.remote_region || job.remote_region === 'Worldwide') {
    return {
      '@type': 'Country',
      name: 'WORLDWIDE',
    };
  }

  // Format based on remote region
  switch (job.remote_region) {
    case 'US Only':
      return {
        '@type': 'Country',
        name: 'USA',
      };
    case 'EU Only':
      return {
        '@type': 'Country',
        name: 'EU',
      };
    case 'UK/EU Only':
      return [
        {
          '@type': 'Country',
          name: 'UK',
        },
        {
          '@type': 'Country',
          name: 'EU',
        },
      ];
    case 'US/Canada Only':
      return [
        {
          '@type': 'Country',
          name: 'USA',
        },
        {
          '@type': 'Country',
          name: 'Canada',
        },
      ];
    case 'Americas Only':
      return {
        '@type': 'Country',
        name: 'Americas',
      };
    case 'Europe Only':
      return {
        '@type': 'Country',
        name: 'Europe',
      };
    case 'Asia-Pacific Only':
      return {
        '@type': 'Country',
        name: 'Asia-Pacific',
      };
    default:
      return null;
  }
}

type JobSchemaProps = {
  job: Job;
  slug: string;
};

// Helper to check if a string field exists and has content
function hasContent(field: string | null | undefined): boolean {
  return !!field && field.trim().length > 0;
}

// Helper to parse experience months from text
function parseExperienceMonths(
  experienceText: string | null | undefined
): number | null {
  if (!experienceText) {
    return null;
  }

  // Look for years pattern (e.g., "2+ years", "2-3 years", "minimum 2 years")
  const yearsMatch = experienceText
    .toLowerCase()
    .match(/(\d+)(?:\s*\+|\s*-\s*\d+)?\s*years?/);
  if (yearsMatch?.[1]) {
    return Number.parseInt(yearsMatch[1], 10) * 12; // Convert years to months
  }

  // Look for months pattern (e.g., "6 months", "6+ months")
  const monthsMatch = experienceText
    .toLowerCase()
    .match(/(\d+)(?:\s*\+|\s*-\s*\d+)?\s*months?/);
  if (monthsMatch?.[1]) {
    return Number.parseInt(monthsMatch[1], 10);
  }

  return null;
}

// Configuration map for education credential types and their keywords
const EDUCATION_CREDENTIAL_MAP: Record<string, string[]> = {
  BachelorDegree: ['bachelor', 'bs', 'ba', 'b.s.', 'b.a.'],
  MasterDegree: ['master', 'ms', 'ma', 'm.s.', 'm.a.', 'mba'],
  DoctoralDegree: ['phd', 'doctorate', 'doctoral'],
  AssociateDegree: ['associate', 'aa', 'a.a.'],
  HighSchool: ['high school', 'secondary'],
  Certificate: ['certificate', 'certification'],
  ProfessionalDegree: ['professional'],
};

// Helper function to parse education credential into standard schema.org categories
function parseEducationCredential(
  education: string | null | undefined
): string {
  if (!education) {
    return 'EducationalOccupationalCredential';
  }

  const lowerEd = education.toLowerCase();

  // Check each credential type for matching keywords
  for (const [credentialType, keywords] of Object.entries(
    EDUCATION_CREDENTIAL_MAP
  )) {
    if (keywords.some((keyword) => lowerEd.includes(keyword))) {
      return credentialType;
    }
  }

  // Default fallback value
  return 'EducationalOccupationalCredential';
}

export function JobSchema({ job, slug }: JobSchemaProps) {
  // Format base URL for absolute links
  const baseUrl =
    config.url || process.env.NEXT_PUBLIC_APP_URL || 'https://bordful.com';

  // Use slug to create the job URL
  const jobUrl = `${baseUrl}/jobs/${slug}`;

  // Calculate valid through date if not provided (default to configured days from posted date or 30 days)
  const postDate = new Date(job.posted_date);
  const isValidPostDate = !Number.isNaN(postDate.getTime());

  // Use current date if posted_date is invalid
  const safePostDate = isValidPostDate ? postDate : new Date();
  const defaultValidThrough = new Date(safePostDate);

  // Use config value or fallback to 30 days
  const validityDays = config.jobListings?.defaultValidityDays ?? 30;
  defaultValidThrough.setDate(defaultValidThrough.getDate() + validityDays);

  // Only add valid_through if the job has it (will need to be added to Airtable)
  const validThrough = (() => {
    if (job.valid_through) {
      const validThroughDate = new Date(job.valid_through);
      return Number.isNaN(validThroughDate.getTime())
        ? defaultValidThrough.toISOString()
        : validThroughDate.toISOString();
    }
    return defaultValidThrough.toISOString();
  })();

  // Create schema data object
  // Use a record approach first to collect all properties
  const jobPostingData: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: safePostDate.toISOString(),
    validThrough,
    url: jobUrl,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    } as Organization,

    // Employment type
    employmentType: formatEmploymentType(job.type),

    // Optional properties with conditional rendering to avoid null values
    ...(job.job_identifier && {
      identifier: {
        '@type': 'PropertyValue',
        name: job.company,
        value: job.job_identifier,
      },
    }),

    // For remote jobs
    ...(formatJobLocationType(job) && {
      jobLocationType: formatJobLocationType(job),
    }),

    // Location handling - only add if not null
    ...(formatLocation(job) && {
      jobLocation: formatLocation(job),
    }),

    // Applicant location requirements - only add if not null
    ...(formatApplicantLocationRequirements(job) && {
      applicantLocationRequirements: formatApplicantLocationRequirements(job),
    }),

    // Salary information - only add if not null
    ...(formatSalaryForSchema(job.salary) && {
      baseSalary: formatSalaryForSchema(job.salary),
    }),

    // Always set directApply to false since we always link to external application forms
    directApply: false,

    // Add skills and requirements when available
    ...(hasContent(job.skills) && {
      skills: job.skills,
    }),
    ...(hasContent(job.qualifications) && {
      qualifications: job.qualifications,
    }),
    ...(hasContent(job.education_requirements) && {
      educationRequirements: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: parseEducationCredential(
          job.education_requirements
        ),
      },
    }),
    ...(hasContent(job.experience_requirements) && {
      experienceRequirements: {
        '@type': 'OccupationalExperienceRequirements',
        monthsOfExperience:
          parseExperienceMonths(job.experience_requirements) || 12,
      },
    }),

    // Add industry classification when available
    ...(hasContent(job.industry) && {
      industry: job.industry,
    }),
    ...(hasContent(job.occupational_category) && {
      occupationalCategory: job.occupational_category,
    }),

    // Add job benefits when available
    ...(hasContent(job.benefits) && {
      jobBenefits: job.benefits,
    }),

    // Add responsibilities if available (might be extracted from description in the future)
    ...(hasContent(job.responsibilities) && {
      responsibilities: job.responsibilities,
    }),

    // Add visa sponsorship information
    ...(job.visa_sponsorship !== 'Not specified' && {
      eligibilityToWorkRequirement:
        job.visa_sponsorship === 'Yes'
          ? 'Visa sponsorship is available for this position.'
          : 'Visa sponsorship is not available for this position.',
    }),
  };

  // Cast the complete data object to the schema-dts type for type safety at compile time
  // We need to cast to unknown first to avoid TypeScript's strict type checking on direct conversion
  const schemaData = jobPostingData as unknown as WithContext<JobPosting>;

  return (
    <Script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData),
      }}
      id="job-schema"
      type="application/ld+json"
    />
  );
}
