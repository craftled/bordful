import { JOB_WORKPLACE_LABELS } from "@/lib/domain/job-vocab";
import type { JobListItem } from "@/lib/read/types";

// Fewer salaried roles than this and a median says nothing, so it is omitted.
const MIN_SALARIED = 3;
const THOUSAND = 1000;

function midpointUsd(card: JobListItem): number | null {
  const { salaryMaxUsd: max, salaryMinUsd: min } = card;
  if (min !== null && max !== null) {
    return (min + max) / 2;
  }
  return min ?? max;
}

// Median of the USD-normalised salary midpoints, or null when too few roles
// publish a salary.
export function medianSalaryUsd(cards: readonly JobListItem[]): number | null {
  const values = cards
    .map(midpointUsd)
    .filter((value): value is number => value !== null && value > 0)
    .sort((left, right) => left - right);
  if (values.length < MIN_SALARIED) {
    return null;
  }

  const middle = Math.floor(values.length / 2);
  if (values.length % 2 === 1) {
    return values[middle] ?? null;
  }
  const low = values[middle - 1];
  const high = values[middle];
  return low === undefined || high === undefined ? null : (low + high) / 2;
}

export function formatMedianUsd(value: number | null): string | null {
  if (value === null) {
    return null;
  }
  return `Median $${Math.round(value / THOUSAND)}k`;
}

export interface WorkplaceCount {
  count: number;
  label: string;
  type: "hybrid" | "onsite" | "remote";
}

export function countWorkplaces(
  cards: readonly JobListItem[]
): WorkplaceCount[] {
  const types = ["remote", "hybrid", "onsite"] as const;
  return types
    .map((type) => ({
      count: cards.filter((card) => card.workplaceType === type).length,
      label: JOB_WORKPLACE_LABELS[type],
      type,
    }))
    .filter((row) => row.count > 0);
}
