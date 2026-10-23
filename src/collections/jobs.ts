import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { jobsRead } from "@/access/jobs";
import { isAdmin, isStaff, isStaffField } from "@/access/roles";
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
  const companyId = relationId(data.company);
  if (companyId === null) {
    return data;
  }

  const previousId = relationId(originalDoc?.company);
  const changed =
    operation === "create" ||
    previousId === null ||
    String(previousId) !== String(companyId);
  if (!changed) {
    return data;
  }

  const company = await req.payload.findByID({
    collection: "companies",
    depth: 0,
    id: companyId,
    overrideAccess: true,
    req,
  });

  if (!data.companyName && typeof company.name === "string") {
    data.companyName = company.name;
  }

  data.companySlug = company.slug;
  data.companyDomain = company.domain;
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
    owned({
      access: { create: ({ req }) => !req.user },
      admin: { position: "sidebar", readOnly: true },
      hooks: { beforeValidate: [emptyToNull] },
      index: true,
      name: "bordfeedJobId",
      type: "text",
      unique: true,
    }),
    owned({
      access: {
        create: ({ req }) => !req.user,
        read: isStaffField,
      },
      admin: { hidden: true, readOnly: true },
      name: "bordfeedDescriptionHash",
      type: "text",
    }),
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
    beforeChange: [denormalizeCompany, stampPublishedAt, applyPaidExpiry],
  },
  slug: "jobs",
  versions: { drafts: { autosave: false }, maxPerDoc: 20 },
};
