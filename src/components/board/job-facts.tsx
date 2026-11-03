import { formatLocation, formatSalary } from "@/lib/board/format";
import { languageLabel } from "@/lib/board/taxonomy";
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_WORKPLACE_LABELS,
} from "@/lib/domain/job-vocab";
import type { JobDetail, PublicDetailField } from "@/lib/read/types";

// formatLocation falls back to this text when nothing is known; it is not a value.
const LOCATION_FALLBACK = "Location not listed";

export interface FactRow {
  field: PublicDetailField;
  label: string;
  value: string;
}

const FACT_ORDER: readonly PublicDetailField[] = [
  "salary",
  "employmentType",
  "careerLevel",
  "location",
  "workplaceType",
  "categories",
  "languages",
  "validThrough",
];

export function formatClosingDate(validThrough: string | null): string {
  if (!validThrough) {
    return "";
  }
  const parsed = Date.parse(validThrough);
  if (Number.isNaN(parsed)) {
    return "";
  }
  return new Date(parsed).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
}

function factValue(job: JobDetail, field: PublicDetailField): string {
  if (field === "salary") {
    return formatSalary(job);
  }
  if (field === "location") {
    const location = formatLocation(job);
    return location === LOCATION_FALLBACK ? "" : location;
  }
  if (field === "employmentType") {
    return job.employmentType ? JOB_EMPLOYMENT_LABELS[job.employmentType] : "";
  }
  if (field === "workplaceType") {
    return job.workplaceType ? JOB_WORKPLACE_LABELS[job.workplaceType] : "";
  }
  if (field === "careerLevel") {
    return job.careerLevel.join(", ");
  }
  if (field === "languages") {
    return job.languages.map((language) => languageLabel(language)).join(", ");
  }
  if (field === "categories") {
    return job.categories.join(", ");
  }

  return formatClosingDate(job.validThrough);
}

const FACT_LABELS: Record<PublicDetailField, string> = {
  careerLevel: "Level",
  categories: "Category",
  employmentType: "Type",
  languages: "Languages",
  location: "Location",
  salary: "Salary",
  validThrough: "Closes",
  workplaceType: "Workplace",
};

// Only fields the owner allowed and that have a value. Empty rows are dropped
// here, not hidden in markup, so the strip disappears when nothing is left.
export function factRows(
  job: JobDetail,
  fields: readonly PublicDetailField[]
): FactRow[] {
  return FACT_ORDER.filter((field) => fields.includes(field))
    .map((field) => ({
      field,
      label: FACT_LABELS[field],
      value: factValue(job, field),
    }))
    .filter((row) => row.value.length > 0);
}

// A strip of key facts under the title. Cells wrap; the negative margin on the
// list hides the outer edge of each cell's top/left divider so only inner
// dividers show, whatever the wrap point.
export function JobFacts({
  fields,
  job,
}: {
  fields: readonly PublicDetailField[];
  job: JobDetail;
}) {
  const rows = factRows(job, fields);
  if (rows.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Job details"
      className="bg-card ring-line sm:bg-surface-faint overflow-clip rounded-[12px] ring-1 sm:ring-inset sm:dark:bg-black/20"
      data-testid="job-facts"
    >
      <dl className="-mt-px -ml-px flex flex-wrap">
        {rows.map((row) => (
          <div
            className="sm:border-line flex min-w-0 basis-1/2 flex-col gap-0.5 px-3.5 py-3 sm:grow sm:basis-auto sm:gap-1 sm:border-t sm:border-l sm:px-4 sm:py-3.5"
            key={row.field}
          >
            <dt className="text-subtle text-[12px] leading-4">{row.label}</dt>
            <dd className="text-foreground text-[14px] leading-[18px] font-medium break-words sm:text-[15px] sm:leading-5">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
