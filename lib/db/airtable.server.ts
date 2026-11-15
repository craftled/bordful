import 'server-only';

import Airtable from 'airtable';
import { cache } from 'react';
import {
  CURRENCY_CODES,
  type CurrencyCode,
  getCurrencyByName,
} from '@/lib/constants/currencies';
import {
  getLanguageByName,
  LANGUAGE_CODES,
  type LanguageCode,
} from '@/lib/constants/languages';
import type { RemoteRegion, WorkplaceType } from '@/lib/constants/workplace';
import type { CareerLevel, Job, SalaryUnit } from '@/lib/db/airtable';
import { normalizeMarkdown } from '@/lib/utils/markdown';

type AirtableBase = ReturnType<Airtable['base']>;

const getAirtableBase = cache((): AirtableBase | null => {
  const apiKey = process.env.AIRTABLE_ACCESS_TOKEN;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!(apiKey && baseId)) {
    return null;
  }

  try {
    return new Airtable({
      apiKey,
      endpointUrl: 'https://api.airtable.com',
    }).base(baseId);
  } catch {
    return null;
  }
});

const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Jobs';

// Ensure career level is always returned as an array
function normalizeCareerLevel(value: unknown): CareerLevel[] {
  if (!value) {
    return ['NotSpecified'];
  }

  if (Array.isArray(value)) {
    // Convert Airtable's display values to our enum values
    return value.map((level) => {
      // Handle Airtable's display format (e.g., "Entry Level" -> "EntryLevel")
      const normalized = level.replace(/\s+/gu, '');
      return normalized as CareerLevel;
    });
  }

  // Handle single value
  const normalized = (value as string).replace(/\s+/gu, '');
  return [normalized as CareerLevel];
}

function normalizeWorkplaceType(value: unknown): WorkplaceType {
  if (
    typeof value === 'string' &&
    ['On-site', 'Hybrid', 'Remote'].includes(value)
  ) {
    return value as WorkplaceType;
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
        // Extract code from "Language Name (code)" format
        const languageCodeMatch = /.*?\(([a-z]{2})\)$/iu.exec(item);
        if (languageCodeMatch?.[1]) {
          const extractedCode = languageCodeMatch[1].toLowerCase();
          if (LANGUAGE_CODES.includes(extractedCode as LanguageCode)) {
            return extractedCode as LanguageCode;
          }
        }

        // String itself is a valid 2-letter code
        if (
          item.length === 2 &&
          LANGUAGE_CODES.includes(item.toLowerCase() as LanguageCode)
        ) {
          return item.toLowerCase() as LanguageCode;
        }

        // Try to look up by language name
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
function normalizeCurrency(value: unknown): CurrencyCode {
  if (!value) {
    return 'USD';
  }

  if (typeof value === 'string') {
    // Extract code from "USD (United States Dollar)" format
    const currencyCodeMatch = /^([A-Z]{2,5})\s*\(.*?\)$/iu.exec(value);
    if (currencyCodeMatch?.[1]) {
      const extractedCode = currencyCodeMatch[1].toUpperCase();
      if (CURRENCY_CODES.includes(extractedCode as CurrencyCode)) {
        return extractedCode as CurrencyCode;
      }
    }

    // String itself is a valid currency code
    const upperCaseValue = value.toUpperCase();
    if (CURRENCY_CODES.includes(upperCaseValue as CurrencyCode)) {
      return upperCaseValue as CurrencyCode;
    }

    // Try to look up by currency name
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
    if (/^yes$/iu.test(normalizedValue)) {
      return 'Yes';
    }
    if (/^no$/iu.test(normalizedValue)) {
      return 'No';
    }
  }

  return 'Not specified';
}

export const getJobs = cache(async (): Promise<Job[]> => {
  const base = getAirtableBase();
  if (!base) {
    return [];
  }

  try {
    const records = await base(TABLE_NAME)
      .select({
        filterByFormula: "{status} = 'active'",
        sort: [{ field: 'posted_date', direction: 'desc' }],
      })
      .all();

    return records.map((record) => {
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
        education_requirements:
          (fields.education_requirements as string) || null,
        experience_requirements:
          (fields.experience_requirements as string) || null,
        industry: (fields.industry as string) || null,
        occupational_category: (fields.occupational_category as string) || null,
        responsibilities: (fields.responsibilities as string) || null,
      };
    });
  } catch {
    return [];
  }
});

export const getJob = cache(async (id: string): Promise<Job | null> => {
  const base = getAirtableBase();
  if (!base) {
    return null;
  }

  try {
    const record = await base(TABLE_NAME).find(id);
    const fields = record.fields;

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
      experience_requirements:
        (fields.experience_requirements as string) || null,
      industry: (fields.industry as string) || null,
      occupational_category: (fields.occupational_category as string) || null,
      responsibilities: (fields.responsibilities as string) || null,
    };
  } catch {
    return null;
  }
});

export async function testConnection(): Promise<boolean> {
  const base = getAirtableBase();
  if (!base) {
    return false;
  }

  try {
    await base(TABLE_NAME)
      .select({
        maxRecords: 1,
      })
      .all();
    return true;
  } catch {
    return false;
  }
}
