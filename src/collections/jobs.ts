import {
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  ValidationError,
} from "payload";
import { jobsRead } from "@/access/jobs";
import {
  denyAuthenticated,
  isAdmin,
  isStaff,
  isStaffField,
} from "@/access/roles";
import { syncOwnedFieldUpdate } from "@/access/sync-owned";
import { computeValidThrough } from "@/jobs/expire-job";
import {
  CAREER_LEVELS,
  JOB_EMPLOYMENT_LABELS,
  JOB_EMPLOYMENT_TYPES,
  JOB_ORIGINS,
  JOB_WORKPLACE_LABELS,
  JOB_WORKPLACE_TYPES,
  SENIORITIES,
} from "@/lib/domain/job-vocab";
import { toOptions } from "@/lib/domain/options";
import { isReservedJobSlug } from "@/lib/domain/reserved-slugs";
import { emptyToNull } from "./shared/empty-to-null";
import { owned } from "./shared/owned";
import { relationId } from "./shared/relation-id";
import { revalidateJobs, revalidateJobsDelete } from "./shared/revalidate";
import { stringListField } from "./shared/string-list";
import {
  httpUrl,
  iso2,
  iso4217,
  syncOriginValidate,
} from "./shared/validators";

function durationDaysOf(settings: unknown): number {
  if (
    settings === null ||
    typeof settings !== "object" ||
    !("postJob" in settings)
  ) {
    return 30;
  }

  const { postJob } = settings;
  if (
    postJob === null ||
    typeof postJob !== "object" ||
    !("durationDays" in postJob)
  ) {
    return 30;
  }

  return typeof postJob.durationDays === "number" ? postJob.durationDays : 30;
}

const denormalizeCompany: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  // data holds only the submitted fields. No company key: nothing to derive.
  if (!("company" in data)) {
    return data;
  }

  const companyId = relationId(data.company);
  const company =
    companyId === null
      ? null
      : await req.payload.findByID({
          collection: "companies",
          depth: 0,
          disableErrors: true,
          id: companyId,
          overrideAccess: true,
          req,
        });

  // A cleared or deleted company must not leave a link to /companies/<slug>.
  if (!company) {
    if (operation === "update") {
      data.companySlug = null;
      data.companyDomain = null;
    }

    return data;
  }

  // Slug and domain are derived, so every save re-reads them. A draft saved
  // before a company slug change would otherwise publish the old link.
  data.companySlug = company.slug;
  data.companyDomain = company.domain;

  const previousId = relationId(originalDoc?.company);
  const changed =
    operation === "create" ||
    previousId === null ||
    String(previousId) !== String(companyId);
  if (!changed) {
    return data;
  }

  if (!data.companyName && typeof company.name === "string") {
    data.companyName = company.name;
  }

  data.companyLogo = company.logo;
  return data;
};

const stampPublishedAt: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
}) => {
  if (
    data._status === "published" &&
    !data.publishedAt &&
    !originalDoc?.publishedAt
  ) {
    data.publishedAt = new Date().toISOString();
  }

  return data;
};

const applyPaidExpiry: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const origin = data.origin ?? originalDoc?.origin;
  if (origin !== "paid") {
    return data;
  }

  const settings = await req.payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    req,
    slug: "site-settings",
  });
  const publishedAt = data.publishedAt ?? originalDoc?.publishedAt ?? null;
  const validThrough = data.validThrough ?? originalDoc?.validThrough ?? null;

  data.validThrough = computeValidThrough({
    durationDays: durationDaysOf(settings),
    origin,
    publishedAt: typeof publishedAt === "string" ? publishedAt : null,
    validThrough: typeof validThrough === "string" ? validThrough : null,
  });

  return data;
};

export const PAST_VALID_THROUGH_MESSAGE =
  "Set Valid through to a future date to publish this job.";

// Publishing past its date would save, stay hidden and be drafted by the next
// expire run. Only the move to published is stopped: a past date on a live job
// is how an editor ends a listing. Sync and cron writes have no user.
const blockExpiredPublish: CollectionBeforeChangeHook = ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const publishing =
    data._status === "published" && originalDoc?._status !== "published";
  if (!(req.user && publishing)) {
    return data;
  }

  const validThrough =
    "validThrough" in data ? data.validThrough : originalDoc?.validThrough;
  const time = validThrough ? new Date(validThrough).getTime() : Number.NaN;
  if (time <= Date.now()) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [{ message: PAST_VALID_THROUGH_MESSAGE, path: "validThrough" }],
      req,
    });
  }

  return data;
};

const sidebarDate = {
  date: { pickerAppearance: "dayAndTime" as const },
  position: "sidebar" as const,
};

export const Jobs: CollectionConfig = {
  access: {
    create: isStaff,
    delete: isStaff,
    read: jobsRead,
    readVersions: isAdmin,
    update: isStaff,
  },
  admin: {
    defaultColumns: [
      "title",
      "companyName",
      "origin",
      "_status",
      "publishedAt",
      "validThrough",
    ],
    useAsTitle: "title",
  },
  fields: [
    owned({ maxLength: 200, name: "title", required: true, type: "text" }),
    owned({
      index: true,
      name: "slug",
      type: "slug",
      unique: true,
      useAsSlug: "title",
      validate: (value) => {
        if (value && isReservedJobSlug(value)) {
          return "This slug is reserved.";
        }

        return true;
      },
    }),
    owned({
      name: "company",
      relationTo: "companies",
      type: "relationship",
    }),
    owned({ name: "companyName", required: true, type: "text" }),
    owned({
      admin: { readOnly: true },
      index: true,
      name: "companySlug",
      type: "text",
    }),
    owned({
      admin: { readOnly: true },
      name: "companyLogo",
      relationTo: "media",
      type: "upload",
    }),
    owned({
      admin: { readOnly: true },
      name: "companyDomain",
      type: "text",
    }),
    owned({
      admin: {
        description:
          "A short plain-text summary of the role. Board search matches it.",
      },
      name: "summary",
      type: "textarea",
    }),
    owned({ name: "description", type: "richText" }),
    owned({ name: "applyUrl", type: "text", validate: httpUrl }),
    owned({ name: "applyEmail", type: "email" }),
    owned({ name: "applyMethod", type: "text" }),
    owned({
      index: true,
      name: "employmentType",
      options: toOptions(JOB_EMPLOYMENT_TYPES, JOB_EMPLOYMENT_LABELS),
      type: "select",
    }),
    owned({
      index: true,
      name: "workplaceType",
      options: toOptions(JOB_WORKPLACE_TYPES, JOB_WORKPLACE_LABELS),
      type: "select",
    }),
    owned({ name: "locationDisplay", type: "text" }),
    owned({ name: "locality", type: "text" }),
    owned({ name: "region", type: "text" }),
    owned({
      index: true,
      name: "countryCode",
      type: "text",
      validate: iso2,
    }),
    owned({ name: "remoteRegion", type: "text" }),
    owned({ min: 0, name: "salaryMin", type: "number" }),
    owned({ min: 0, name: "salaryMax", type: "number" }),
    owned({ name: "salaryCurrency", type: "text", validate: iso4217 }),
    owned({
      admin: { description: "Annualized USD, used for filters." },
      min: 0,
      name: "salaryMinUsd",
      type: "number",
    }),
    owned({
      admin: { description: "Annualized USD, used for filters." },
      min: 0,
      name: "salaryMaxUsd",
      type: "number",
    }),
    owned({
      hasMany: true,
      name: "careerLevel",
      options: toOptions(CAREER_LEVELS),
      type: "select",
    }),
    owned({
      index: true,
      name: "seniority",
      options: toOptions(SENIORITIES),
      type: "select",
    }),
    owned({ name: "visaSponsorship", type: "text" }),
    owned(stringListField("languages", "Languages")),
    owned(stringListField("categories", "Categories")),
    owned(stringListField("skills", "Skills")),
    {
      admin: { position: "sidebar" },
      defaultValue: false,
      name: "featured",
      type: "checkbox",
    },
    owned({
      admin: sidebarDate,
      index: true,
      name: "publishedAt",
      type: "date",
    }),
    owned({
      admin: sidebarDate,
      index: true,
      name: "validThrough",
      type: "date",
    }),
    owned({
      admin: { position: "sidebar" },
      defaultValue: "manual",
      index: true,
      name: "origin",
      options: toOptions(JOB_ORIGINS),
      required: true,
      type: "select",
      validate: syncOriginValidate,
    }),
    {
      access: { create: denyAuthenticated, update: denyAuthenticated },
      admin: { position: "sidebar", readOnly: true },
      hooks: { beforeValidate: [emptyToNull] },
      index: true,
      name: "bordfeedJobId",
      type: "text",
      unique: true,
    },
    {
      access: {
        create: denyAuthenticated,
        read: isStaffField,
        update: denyAuthenticated,
      },
      admin: { hidden: true, readOnly: true },
      name: "bordfeedDescriptionHash",
      type: "text",
    },
    owned({ name: "sourceListingUrl", type: "text", validate: httpUrl }),
    {
      access: { read: isStaffField, update: syncOwnedFieldUpdate },
      name: "paymentReference",
      type: "text",
    },
  ],
  hooks: {
    afterChange: [revalidateJobs],
    afterDelete: [revalidateJobsDelete],
    beforeChange: [
      denormalizeCompany,
      stampPublishedAt,
      applyPaidExpiry,
      blockExpiredPublish,
    ],
  },
  slug: "jobs",
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
};
