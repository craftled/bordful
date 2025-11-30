// Apitable Database Integration
// This file replaces airtable.ts for Apitable backend

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

// Apitable configuration from environment variables
const APITABLE_API_URL =
  process.env.APITABLE_API_URL || 'http://localhost:80/api/v1';
const APITABLE_TOKEN = process.env.APITABLE_TOKEN || '';
const APITABLE_DATASHEET_ID = process.env.APITABLE_DATASHEET_ID || '';

// Types (same as airtable.ts)
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

// Apitable API Response Types
type ApitableRecord = {
  recordId: string;
  fields: Record<string, unknown>;
  createdAt?: number;
  updatedAt?: number;
};

type ApitableResponse = {
  success: boolean;
  code: number;
  message: string;
  data: {
    records: ApitableRecord[];
    pageNum?: number;
    pageSize?: number;
    total?: number;
  };
};

// Helper function to make Apitable API calls
async function apitableFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApitableResponse> {
  const url = `${APITABLE_API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${APITABLE_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Apitable API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Format salary for display
export function formatSalary(
  salary: Salary | null,
  showCurrencyCode = false
): string {
  if (!(salary && (salary.min || salary.max))) {
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

    const kThreshold = 10_000;
    const mThreshold = 1_000_000;

    if (forceScale === 'M') {
      return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (forceScale === 'k') {
      return `${(num / 1000).toFixed(0)}k`;
    }

    if (num >= mThreshold) {
      return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (num >= kThreshold) {
      return `${(num / 1000).toFixed(0)}k`;
    }

    return num.toLocaleString();
  };

  let range;
  if (salary.min && salary.max) {
    let forceScale: 'k' | 'M' | undefined;

    if (Math.max(salary.min, salary.max) >= 1_000_000) {
      forceScale = 'M';
    } else if (Math.max(salary.min, salary.max) >= 10_000) {
      forceScale = 'k';
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

  const unitDisplay = {
    hour: '/hour',
    day: '/day',
    week: '/week',
    month: '/month',
    year: '/year',
    project: '/project',
  }[salary.unit];

  const currencyCode = showCurrencyCode ? ` (${salary.currency})` : '';

  return `${formattedSymbol}${range}${unitDisplay}${currencyCode}`;
}

// Format USD approximation for non-USD salaries
export function formatUSDApproximation(salary: Salary | null): string | null {
  if (!(salary && (salary.min || salary.max)) || salary.currency === 'USD') {
    return null;
  }

  const usdSalary: Salary = {
    min: salary.min ? salary.min * CURRENCY_RATES[salary.currency] : null,
    max: salary.max ? salary.max * CURRENCY_RATES[salary.currency] : null,
    currency: 'USD',
    unit: salary.unit,
  };

  const formatted = formatSalary(usdSalary, false);
  return `≈ ${formatted}`;
}

// Normalize salary for comparison (convert to annual USD)
export function normalizeAnnualSalary(salary: Salary | null): number {
  if (!(salary && (salary.min || salary.max))) {
    return -1;
  }

  const exchangeRate = CURRENCY_RATES[salary.currency] || 1;

  const annualMultiplier: Record<SalaryUnit, number> = {
    hour: 2080,
    day: 260,
    week: 52,
    month: 12,
    year: 1,
    project: 1,
  };

  const value = salary.max || salary.min || 0;

  return value * exchangeRate * annualMultiplier[salary.unit];
}

// Normalization functions
function normalizeCareerLevel(value: unknown): CareerLevel[] {
  if (!value) {
    return ['NotSpecified'];
  }

  if (Array.isArray(value)) {
    return value.map((level) => {
      const normalized = level.replace(/\s+/g, '');
      return normalized as CareerLevel;
    });
  }

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
        const languageCodeMatch = /.*?\(([a-z]{2})\)$/i.exec(item);
        if (languageCodeMatch?.[1]) {
          const extractedCode = languageCodeMatch[1].toLowerCase();
          if (LANGUAGE_CODES.includes(extractedCode as LanguageCode)) {
            return extractedCode as LanguageCode;
          }
        }

        if (
          item.length === 2 &&
          LANGUAGE_CODES.includes(item.toLowerCase() as LanguageCode)
        ) {
          return item.toLowerCase() as LanguageCode;
        }

        const language = getLanguageByName(item);
        if (language) {
          return language.code as LanguageCode;
        }
      }

      return null;
    })
    .filter((code): code is LanguageCode => code !== null);
}

function normalizeCurrency(value: unknown): CurrencyCode {
  if (!value) {
    return 'USD';
  }

  if (typeof value === 'string') {
    const currencyCodeMatch = /^([A-Z]{2,5})\s*\(.*?\)$/i.exec(value);
    if (currencyCodeMatch?.[1]) {
      const extractedCode = currencyCodeMatch[1].toUpperCase();

      if (CURRENCY_CODES.includes(extractedCode as CurrencyCode)) {
        return extractedCode as CurrencyCode;
      }
    }

    const upperCaseValue = value.toUpperCase();
    if (CURRENCY_CODES.includes(upperCaseValue as CurrencyCode)) {
      return upperCaseValue as CurrencyCode;
    }

    const currency = getCurrencyByName(value);
    if (currency) {
      return currency.code;
    }
  }

  return 'USD';
}

function normalizeBenefits(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const benefitsText = String(value).trim();

  if (!benefitsText) {
    return null;
  }

  const MAX_BENEFITS_LENGTH = 1000;
  if (benefitsText.length > MAX_BENEFITS_LENGTH) {
    return benefitsText.substring(0, MAX_BENEFITS_LENGTH).trim();
  }

  return benefitsText;
}

function normalizeApplicationRequirements(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const requirementsText = String(value).trim();

  if (!requirementsText) {
    return null;
  }

  const MAX_REQUIREMENTS_LENGTH = 1000;
  if (requirementsText.length > MAX_REQUIREMENTS_LENGTH) {
    return requirementsText.substring(0, MAX_REQUIREMENTS_LENGTH).trim();
  }

  return requirementsText;
}

function normalizeVisaSponsorship(
  value: unknown
): 'Yes' | 'No' | 'Not specified' {
  if (!value) {
    return 'Not specified';
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim();

    if (/^yes$/i.test(normalizedValue)) {
      return 'Yes';
    }

    if (/^no$/i.test(normalizedValue)) {
      return 'No';
    }
  }

  return 'Not specified';
}

// Transform Apitable record to Job type
function transformApitableRecord(record: ApitableRecord): Job {
  const fields = record.fields;

  return {
    id: record.recordId,
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

    skills: (fields.skills as string) || null,
    qualifications: (fields.qualifications as string) || null,
    education_requirements: (fields.education_requirements as string) || null,
    experience_requirements: (fields.experience_requirements as string) || null,
    industry: (fields.industry as string) || null,
    occupational_category: (fields.occupational_category as string) || null,
    responsibilities: (fields.responsibilities as string) || null,
  };
}

export async function getJobs(): Promise<Job[]> {
  try {
    const response = await apitableFetch(
      `/datasheets/${APITABLE_DATASHEET_ID}/records?pageSize=1000`
    );

    if (!response.success) {
      return [];
    }

    const jobs = response.data.records
      .map(transformApitableRecord)
      .filter((job) => job.status === 'active')
      .sort((a, b) => {
        return (
          new Date(b.posted_date).getTime() -
          new Date(a.posted_date).getTime()
        );
      });

    return jobs;
  } catch (_error) {
    return [];
  }
}

export async function getJob(id: string): Promise<Job | null> {
  try {
    const response = await apitableFetch(
      `/datasheets/${APITABLE_DATASHEET_ID}/records/${id}`
    );

    if (!response.success) {
      return null;
    }

    const job = transformApitableRecord(response.data.records[0]);

    if (job.status !== 'active') {
      return null;
    }

    return job;
  } catch (_error) {
    return null;
  }
}

export async function testConnection() {
  try {
    const response = await apitableFetch(
      `/datasheets/${APITABLE_DATASHEET_ID}/records?pageSize=1`
    );
    return response.success;
  } catch (_error) {
    return false;
  }
}
