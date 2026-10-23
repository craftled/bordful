import { formatLocation, formatSalary } from "@/lib/board/format";
import { languageLabel } from "@/lib/board/taxonomy";
import {
  JOB_EMPLOYMENT_LABELS,
  JOB_WORKPLACE_LABELS,
} from "@/lib/domain/job-vocab";
import type { JobDetail, PublicDetailField } from "@/lib/read/types";

function Fact({ label, value }: { label: string; value: string }) {
  if (value.length === 0) {
    return null;
  }

  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function factValue(job: JobDetail, field: PublicDetailField): string {
  if (field === "salary") {
    return formatSalary(job);
  }
  if (field === "location") {
    return formatLocation(job);
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

export function JobFacts({
  fields,
  job,
}: {
  fields: readonly PublicDetailField[];
  job: JobDetail;
}) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2" data-testid="job-facts">
      {fields.map((field) => (
        <Fact
          key={field}
          label={fieldLabel(field)}
          value={factValue(job, field)}
        />
      ))}
    </dl>
  );
}

function fieldLabel(field: PublicDetailField): string {
  if (field === "employmentType") {
    return "Employment type";
  }
  if (field === "workplaceType") {
    return "Workplace";
  }
  if (field === "careerLevel") {
    return "Career level";
  }
  if (field === "validThrough") {
    return "Apply by";
  }

  return field.charAt(0).toUpperCase() + field.slice(1);
}
