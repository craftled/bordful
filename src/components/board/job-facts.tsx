import {
  Briefcase,
  CalendarClock,
  Clock,
  Languages,
  Laptop,
  MapPin,
  Tag,
  Wallet,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

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
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
}

const FACT_ORDER: readonly PublicDetailField[] = [
  "validThrough",
  "location",
  "workplaceType",
  "salary",
  "careerLevel",
  "employmentType",
  "categories",
  "languages",
];

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
  if (job.validThrough) {
    const parsed = Date.parse(job.validThrough);
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

  return "";
}

const FACT_META: Record<
  PublicDetailField,
  { icon: FactRow["icon"]; label: string }
> = {
  careerLevel: { icon: Briefcase, label: "Career level" },
  categories: { icon: Tag, label: "Category" },
  employmentType: { icon: Clock, label: "Employment type" },
  languages: { icon: Languages, label: "Languages" },
  location: { icon: MapPin, label: "Location" },
  salary: { icon: Wallet, label: "Salary" },
  validThrough: { icon: CalendarClock, label: "Apply by" },
  workplaceType: { icon: Laptop, label: "Workplace" },
};

// Only fields the owner allowed and that have a value. Empty rows are dropped
// here, not hidden in markup, so the box disappears when nothing is left.
export function factRows(
  job: JobDetail,
  fields: readonly PublicDetailField[]
): FactRow[] {
  return FACT_ORDER.filter((field) => fields.includes(field))
    .map((field) => ({
      field,
      icon: FACT_META[field].icon,
      label: FACT_META[field].label,
      value: factValue(job, field),
    }))
    .filter((row) => row.value.length > 0);
}

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
      aria-labelledby="job-facts-title"
      className="border-border bg-muted rounded-lg border p-5"
      data-testid="job-facts"
    >
      <h2 className="text-base font-semibold" id="job-facts-title">
        Job details
      </h2>
      <dl className="mt-4 space-y-4">
        {rows.map((row) => (
          <div className="flex gap-3" key={row.field}>
            <row.icon
              aria-hidden="true"
              className="text-muted-foreground mt-0.5 size-4 shrink-0"
            />
            <div className="min-w-0">
              <dt className="text-muted-foreground text-xs">{row.label}</dt>
              <dd className="text-sm break-words">{row.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
