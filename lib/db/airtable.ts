import Airtable from 'airtable';
import {
  CURRENCY_CODES,
  CURRENCY_RATES,
  type CurrencyCode,
  formatCurrencySymbol,
  getCurrencyByName,
} from '@/lib/constants/currencies';
import {
  getLanguageByName,
  LANGUAGE_CODES,
  type LanguageCode,
} from '@/lib/constants/languages';
import type { RemoteRegion, WorkplaceType } from '@/lib/constants/workplace';
import { normalizeMarkdown } from '@/lib/utils/markdown';

// Initialize Airtable with Personal Access Token
const base = new Airtable({
  apiKey: process.env.AIRTABLE_ACCESS_TOKEN,
  endpointUrl: 'https://api.airtable.com',
}).base(process.env.AIRTABLE_BASE_ID || '');

// Get table name from environment variables with fallback
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Jobs';

export type CareerLevel =
  | 'Internship'
  | 'EntryLevel'
  | 'Associate'
  | 'Junior'
  | 'MidLevel'
  | 'Senior'
  | 'Staff'
  | 'Principal'
  | 'Lead'
  | 'Manager'
  | 'SeniorManager'
  | 'Director'
  | 'SeniorDirector'
  | 'VP'
  | 'SVP'
  | 'EVP'
  | 'CLevel'
  | 'Founder'
  | 'NotSpecified';

export type SalaryUnit = 'hour' | 'day' | 'week' | 'month' | 'year' | 'project';

export type Salary = {
  min: number | null;
  max: number | null;
  currency: CurrencyCode;
  unit: SalaryUnit;
};

export type Job = {
  id: string;
  title: string;
  company: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  salary: Salary | null;
  description: string;
  benefits: string | null;
  application_requirements: string | null;
  apply_url: string;
  posted_date: string;
  valid_through?: string | null;
  job_identifier?: string | null;
  job_source_name?: string | null;
  status: 'active' | 'inactive';
  career_level: CareerLevel[];
  visa_sponsorship: 'Yes' | 'No' | 'Not specified';
  featured: boolean;
  workplace_type: WorkplaceType;
  remote_region: RemoteRegion;
  timezone_requirements: string | null;
  workplace_city: string | null;
  workplace_country: string | null;
  languages: LanguageCode[];

  // Schema.org fields for structured data
  skills?: string | null;
  qualifications?: string | null;
  education_requirements?: string | null;
  experience_requirements?: string | null;
  industry?: string | null;
  occupational_category?: string | null;
  responsibilities?: string | null;
};

// Format salary for display
export function formatSalary(
  salary: Salary | null,
  showCurrencyCode = false
): string {
  if (!salary || !(salary.min || salary.max)) {
    return 'Not specified';
  }

  const formattedSymbol = formatCurrencySymbol(salary.currency);

  const formatNumber = (
    num: number | null,
    _currency: CurrencyCode,
    forceScale?: 'k' | 'M'
  ): string => {
    if (!num) {
      return '';
    }

    // Define consistent thresholds for all currencies
    const kThreshold = 10_000;
    const mThreshold = 1_000_000;

    // Apply forced scale if provided (for consistent range formatting)
    if (forceScale === 'M') {
      return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (forceScale === 'k') {
      return `${(num / 1000).toFixed(0)}k`;
    }

    // Format with appropriate scale based on magnitude
    if (num >= mThreshold) {
      return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (num >= kThreshold) {
      return `${(num / 1000).toFixed(0)}k`;
    }

    // For smaller numbers, show the full value with thousands separator
    return num.toLocaleString();
  };

  // Handle single value cases (only min or only max)
  let range;
  if (salary.min && salary.max) {
    // Determine the appropriate scale for both values based on the larger number
    let forceScale: 'k' | 'M' | undefined;

    // Use consistent thresholds for all currencies
    if (Math.max(salary.min, salary.max) >= 1_000_000) {
      forceScale = 'M'; // Force both values to use millions
    } else if (Math.max(salary.min, salary.max) >= 10_000) {
      forceScale = 'k'; // Force both values to use thousands
    }

    range =
      salary.min === salary.max
        ? formatNumber(salary.min, salary.currency)
        : `${formatNumber(
            salary.min,
            salary.currency,
            forceScale
          )}-${formatNumber(salary.max, salary.currency, forceScale)}`;
  } else {
    range = formatNumber(salary.min || salary.max, salary.currency);
  }

  // Use full words with slash
  const unitDisplay = {
    hour: '/hour',
    day: '/day',
    week: '/week',
    month: '/month',
    year: '/year',
    project: '/project',
  }[salary.unit];

  // Add currency code in parentheses if requested
  const currencyCode = showCurrencyCode ? ` (${salary.currency})` : '';

  return `${formattedSymbol}${range}${unitDisplay}${currencyCode}`;
}

// Format USD approximation for non-USD salaries
export function formatUSDApproximation(salary: Salary | null): string | null {
  if (!salary || !(salary.min || salary.max) || salary.currency === 'USD') {
    return null;
  }

  // Create a USD equivalent salary object
  const usdSalary: Salary = {
    min: salary.min ? salary.min * CURRENCY_RATES[salary.currency] : null,
    max: salary.max ? salary.max * CURRENCY_RATES[salary.currency] : null,
    currency: 'USD',
    unit: salary.unit,
  };

  // Format without currency code
  const formatted = formatSalary(usdSalary, false);
  return `≈ ${formatted}`;
}

// Normalize salary for comparison (convert to annual USD)
export function normalizeAnnualSalary(salary: Salary | null): number {
  if (!salary || !(salary.min || salary.max)) {
    return -1;
  }

  // Use the conversion rates from the currency constants
  const exchangeRate = CURRENCY_RATES[salary.currency] || 1;

  // Annualization multipliers
  const annualMultiplier: Record<SalaryUnit, number> = {
    hour: 2080, // 40 hours/week * 52 weeks
    day: 260, // 52 weeks * 5 days
    week: 52,
    month: 12,
    year: 1,
    project: 1, // Projects treated as one-time annual equivalent
  };

  // Use the maximum value for comparison, or minimum if no maximum
  const value = salary.max || salary.min || 0;

  // Convert to USD and annualize
  return value * exchangeRate * annualMultiplier[salary.unit];
}

// Ensure career level is always returned as an array
function normalizeCareerLevel(value: unknown): CareerLevel[] {
  if (!value) {
    return ['NotSpecified'];
  }

  if (Array.isArray(value)) {
    // Convert Airtable's display values to our enum values
    return value.map((level) => {
      // Handle Airtable's display format (e.g., "Entry Level" -> "EntryLevel")
      const normalized = level.replace(/\s+/g, '');
      return normalized as CareerLevel;
    });
  }

  // Handle single value
  const normalized = (value as string).replace(/\s+/g, '');
  return [normalized as CareerLevel];
}

function normalizeWorkplaceType(value: unknown): WorkplaceType {
  if (
    typeof value === 'string' &&
    ['On-site', 'Hybrid', 'Remote'].includes(value)
  ) {
    return value as WorkplaceType;
  }
  // If the value is undefined or invalid, check if there's a remote_region
  // If there is, it's probably a remote job
  if (value === undefined || value === null) {
    return 'Not specified';
  }
  return 'Not specified';
}

function normalizeRemoteRegion(value: unknown): RemoteRegion {
  if (typeof value === 'string') {
    const validRegions = [
      'Worldwide',
      'Americas Only',
      'Europe Only',
      'Asia-Pacific Only',
      'US Only',
      'EU Only',
      'UK/EU Only',
      'US/Canada Only',
    ];
    if (validRegions.includes(value)) {
      return value as RemoteRegion;
    }
  }
  return null;
}

// Function to normalize language data from Airtable
// This can handle multiple formats:
// - ISO codes directly: "en", "fr"
// - "Language Name (code)" format: "English (en)", "French (fr)"
// - Language names: "English", "French" (via lookup)
function normalizeLanguages(value: unknown): LanguageCode[] {
  if (!value) {
    return [];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        // Format 1: Extract code from "Language Name (code)" format
        const languageCodeMatch = /.*?\(([a-z]{2})\)$/i.exec(item);
        if (languageCodeMatch?.[1]) {
          const extractedCode = languageCodeMatch[1].toLowerCase();

          // Verify the extracted code is valid
          if (LANGUAGE_CODES.includes(extractedCode as LanguageCode)) {
            return extractedCode as LanguageCode;
          }
        }

        // Format 2: Check if the string itself is a valid 2-letter code
        if (
          item.length === 2 &&
          LANGUAGE_CODES.includes(item.toLowerCase() as LanguageCode)
        ) {
          return item.toLowerCase() as LanguageCode;
        }

        // Format 3: Try to look up by language name
        const language = getLanguageByName(item);
        if (language) {
          return language.code as LanguageCode;
        }
      }

      return null;
    })
    .filter((code): code is LanguageCode => code !== null);
}

// Function to normalize currency data from Airtable
// This can handle multiple formats:
// - ISO codes directly: "USD", "EUR" or crypto codes: "USDT", "DOGE"
// - "Currency Code (Name)" format: "USD (United States Dollar)", "USDT (Tether USD)"
// - Currency names: "United States Dollar", "Tether USD" (via lookup)
function normalizeCurrency(value: unknown): CurrencyCode {
  if (!value) {
    return 'USD'; // Default to USD if no currency specified
  }

  if (typeof value === 'string') {
    // Format 1: Extract code from "USD (United States Dollar)" or "USDT (Tether USD)" format
    const currencyCodeMatch = /^([A-Z]{2,5})\s*\(.*?\)$/i.exec(value);
    if (currencyCodeMatch?.[1]) {
      const extractedCode = currencyCodeMatch[1].toUpperCase();

      // Verify the extracted code is valid
      if (CURRENCY_CODES.includes(extractedCode as CurrencyCode)) {
        return extractedCode as CurrencyCode;
      }
    }

    // Format 2: Check if the string itself is a valid currency code (2-5 letters for crypto)
    const upperCaseValue = value.toUpperCase();
    if (CURRENCY_CODES.includes(upperCaseValue as CurrencyCode)) {
      return upperCaseValue as CurrencyCode;
    }

    // Format 3: Try to look up by currency name
    const currency = getCurrencyByName(value);
    if (currency) {
      return currency.code;
    }
  }

  // Default to USD if we can't determine the currency
  return 'USD';
}

// Function to normalize benefits text with a maximum length
function normalizeBenefits(value: unknown): string | null {
  if (!value) {
    return null;
  }

  // Convert to string if it's not already
  const benefitsText = String(value).trim();

  // If empty after trimming, return null
  if (!benefitsText) {
    return null;
  }

  // Trim to maximum 1000 characters for safety
  const MAX_BENEFITS_LENGTH = 1000;
  if (benefitsText.length > MAX_BENEFITS_LENGTH) {
    return benefitsText.substring(0, MAX_BENEFITS_LENGTH).trim();
  }

  return benefitsText;
}

// Function to normalize application requirements with a maximum length
function normalizeApplicationRequirements(value: unknown): string | null {
  if (!value) {
    return null;
  }

  // Convert to string if it's not already
  const requirementsText = String(value).trim();

  // If empty after trimming, return null
  if (!requirementsText) {
    return null;
  }

  // Trim to maximum 1000 characters for safety
  const MAX_REQUIREMENTS_LENGTH = 1000;
  if (requirementsText.length > MAX_REQUIREMENTS_LENGTH) {
    return requirementsText.substring(0, MAX_REQUIREMENTS_LENGTH).trim();
  }

  return requirementsText;
}

// Function to normalize visa sponsorship field
function normalizeVisaSponsorship(
  value: unknown
): 'Yes' | 'No' | 'Not specified' {
  if (!value) {
    return 'Not specified';
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim();

    // Case-insensitive check for yes
    if (/^yes$/i.test(normalizedValue)) {
      return 'Yes';
    }

    // Case-insensitive check for no
    if (/^no$/i.test(normalizedValue)) {
      return 'No';
    }
  }

  return 'Not specified';
}

export async function getJobs(): Promise<Job[]> {
  try {
    // Fetch all active jobs
    const records = await base(TABLE_NAME)
      .select({
        filterByFormula: "{status} = 'active'",
        sort: [{ field: 'posted_date', direction: 'desc' }],
      })
      .all();

    // Transform Airtable records to our Job type
    const jobs = records.map((record) => {
      const fields = record.fields;

      return {
        id: record.id,
        title: fields.title as string,
        company: fields.company as string,
        type: fields.type as Job['type'],
        salary:
          fields.salary_min || fields.salary_max
            ? {
                min: fields.salary_min ? Number(fields.salary_min) : null,
                max: fields.salary_max ? Number(fields.salary_max) : null,
                currency: normalizeCurrency(fields.salary_currency),
                unit: fields.salary_unit as SalaryUnit,
              }
            : null,
        description: normalizeMarkdown(fields.description as string),
        benefits: normalizeBenefits(fields.benefits),
        application_requirements: normalizeApplicationRequirements(
          fields.application_requirements
        ),
        apply_url: fields.apply_url as string,
        posted_date: fields.posted_date as string,
        // New fields
        valid_through: (fields.valid_through as string) || null,
        job_identifier: (fields.job_identifier as string) || null,
        job_source_name: (fields.job_source_name as string) || null,
        status: fields.status as Job['status'],
        career_level: normalizeCareerLevel(fields.career_level),
        visa_sponsorship: normalizeVisaSponsorship(fields.visa_sponsorship),
        featured: !!fields.featured,
        workplace_type: normalizeWorkplaceType(fields.workplace_type),
        remote_region: normalizeRemoteRegion(fields.remote_region),
        timezone_requirements: (fields.timezone_requirements as string) || null,
        workplace_city: (fields.workplace_city as string) || null,
        workplace_country: (fields.workplace_country as string) || null,
        languages: normalizeLanguages(fields.languages),

        // Schema.org structured data fields
        skills: (fields.skills as string) || null,
        qualifications: (fields.qualifications as string) || null,
        education_requirements:
          (fields.education_requirements as string) || null,
        experience_requirements:
          (fields.experience_requirements as string) || null,
        industry: (fields.industry as string) || null,
        occupational_category: (fields.occupational_category as string) || null,
        responsibilities: (fields.responsibilities as string) || null,
      };
    });

    return jobs;
  } catch (_error) {
    return [];
  }
}

export async function getJob(id: string): Promise<Job | null> {
  try {
    const record = await base(TABLE_NAME).find(id);
    const fields = record.fields;

    // Return null for inactive jobs - consistent with Google's guidelines to return 404
    if (fields.status !== 'active') {
      return null;
    }

    return {
      id: record.id,
      title: fields.title as string,
      company: fields.company as string,
      type: fields.type as Job['type'],
      salary:
        fields.salary_min || fields.salary_max
          ? {
              min: fields.salary_min ? Number(fields.salary_min) : null,
              max: fields.salary_max ? Number(fields.salary_max) : null,
              currency: normalizeCurrency(fields.salary_currency),
              unit: fields.salary_unit as SalaryUnit,
            }
          : null,
      description: normalizeMarkdown(fields.description as string),
      benefits: normalizeBenefits(fields.benefits),
      application_requirements: normalizeApplicationRequirements(
        fields.application_requirements
      ),
      apply_url: fields.apply_url as string,
      posted_date: fields.posted_date as string,
      // New fields
      valid_through: (fields.valid_through as string) || null,
      job_identifier: (fields.job_identifier as string) || null,
      job_source_name: (fields.job_source_name as string) || null,
      status: fields.status as Job['status'],
      career_level: normalizeCareerLevel(fields.career_level),
      visa_sponsorship: normalizeVisaSponsorship(fields.visa_sponsorship),
      featured: !!fields.featured,
      workplace_type: normalizeWorkplaceType(fields.workplace_type),
      remote_region: normalizeRemoteRegion(fields.remote_region),
      timezone_requirements: (fields.timezone_requirements as string) || null,
      workplace_city: (fields.workplace_city as string) || null,
      workplace_country: (fields.workplace_country as string) || null,
      languages: normalizeLanguages(fields.languages),

      // Schema.org structured data fields
      skills: (fields.skills as string) || null,
      qualifications: (fields.qualifications as string) || null,
      education_requirements: (fields.education_requirements as string) || null,
      experience_requirements:
        (fields.experience_requirements as string) || null,
      industry: (fields.industry as string) || null,
      occupational_category: (fields.occupational_category as string) || null,
      responsibilities: (fields.responsibilities as string) || null,
    };
  } catch (_error) {
    return null;
  }
}

export async function testConnection() {
  try {
    const _records = await base(TABLE_NAME)
      .select({
        maxRecords: 1, // Just get one record to test
      })
      .all();
    return true;
  } catch (_error) {
    return false;
  }
}
