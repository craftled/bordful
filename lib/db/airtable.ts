import {
  CURRENCY_RATES,
  type CurrencyCode,
  formatCurrencySymbol,
} from '@/lib/constants/currencies';
import type { LanguageCode } from '@/lib/constants/languages';
import type { RemoteRegion, WorkplaceType } from '@/lib/constants/workplace';

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

    // Define consistent thresholds for all currencies
    const kThreshold = 10_000;
    const mThreshold = 1_000_000;

    // Apply forced scale if provided (for consistent range formatting)
    if (forceScale === 'M') {
      return `${(num / 1_000_000).toFixed(1).replace(/\.0$/u, '')}M`;
    }
    if (forceScale === 'k') {
      return `${(num / 1000).toFixed(0)}k`;
    }

    // Format with appropriate scale based on magnitude
    if (num >= mThreshold) {
      return `${(num / 1_000_000).toFixed(1).replace(/\.0$/u, '')}M`;
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
  if (!(salary && (salary.min || salary.max)) || salary.currency === 'USD') {
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
  if (!(salary && (salary.min || salary.max))) {
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
