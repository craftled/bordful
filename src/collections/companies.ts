import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from "payload";

import { anyone, denyAuthenticated, isStaff } from "@/access/roles";
import { JOB_ORIGINS, SYNC_OWNED_ORIGINS } from "@/lib/domain/job-vocab";
import { toOptions } from "@/lib/domain/options";

import { emptyToNull } from "./shared/empty-to-null";
import { owned } from "./shared/owned";
import {
  revalidateCompanies,
  revalidateCompaniesDelete,
} from "./shared/revalidate";
import { hostname, httpUrl, syncOriginValidate } from "./shared/validators";

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isSyncOwned(origin: unknown): boolean {
  return (SYNC_OWNED_ORIGINS as readonly unknown[]).includes(origin);
}

// Jobs copy the company slug and domain for links. companyName is owner text
// on manual and paid jobs, so it stays as written. Sync-owned companies change
// only through sync, and refreshCompanyJobs there updates their jobs. Each job
// update saves one version, so only a real slug or domain change touches jobs.
const refreshJobCompanyFields: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== "update" || isSyncOwned(doc.origin)) {
    return doc;
  }

  const slug = textOrNull(doc.slug);
  const domain = textOrNull(doc.domain);
  if (
    slug === textOrNull(previousDoc?.slug) &&
    domain === textOrNull(previousDoc?.domain)
  ) {
    return doc;
  }

  await req.payload.update({
    collection: "jobs",
    data: { companyDomain: domain, companySlug: slug },
    depth: 0,
    overrideAccess: true,
    req,
    where: { company: { equals: doc.id } },
  });
  return doc;
};

// The database nulls jobs.company on delete, so match the copied slug on jobs
// left without a company.
const clearJobCompanyFields: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const slug = textOrNull(doc.slug);
  if (slug === null) {
    return doc;
  }

  await req.payload.update({
    collection: "jobs",
    data: { companyDomain: null, companySlug: null },
    depth: 0,
    overrideAccess: true,
    req,
    where: {
      and: [{ company: { exists: false } }, { companySlug: { equals: slug } }],
    },
  });
  return doc;
};

export const Companies: CollectionConfig = {
  access: {
    create: isStaff,
    delete: isStaff,
    read: anyone,
    update: isStaff,
  },
  admin: { useAsTitle: "name" },
  fields: [
    owned({ name: "name", required: true, type: "text" }),
    owned({
      index: true,
      name: "slug",
      type: "slug",
      unique: true,
      useAsSlug: "name",
    }),
    owned({ name: "logo", relationTo: "media", type: "upload" }),
    owned({ name: "logoUrl", type: "text", validate: httpUrl }),
    owned({
      hooks: { beforeValidate: [emptyToNull] },
      index: true,
      name: "domain",
      type: "text",
      unique: true,
      validate: hostname,
    }),
    owned({ name: "website", type: "text", validate: httpUrl }),
    owned({ name: "careersUrl", type: "text", validate: httpUrl }),
    owned({ name: "linkedinUrl", type: "text", validate: httpUrl }),
    owned({ name: "twitterUrl", type: "text", validate: httpUrl }),
    owned({ name: "description", type: "richText" }),
    owned({ name: "industry", type: "text" }),
    owned({ name: "location", type: "text" }),
    owned({ min: 0, name: "headcount", type: "number" }),
    owned({
      defaultValue: "manual",
      name: "origin",
      options: toOptions(JOB_ORIGINS),
      required: true,
      type: "select",
      validate: syncOriginValidate,
    }),
    {
      access: { create: denyAuthenticated, update: denyAuthenticated },
      admin: { readOnly: true },
      hooks: { beforeValidate: [emptyToNull] },
      index: true,
      name: "bordfeedCompanyId",
      type: "text",
      unique: true,
    },
  ],
  hooks: {
    afterChange: [refreshJobCompanyFields, revalidateCompanies],
    afterDelete: [clearJobCompanyFields, revalidateCompaniesDelete],
  },
  slug: "companies",
  versions: false,
};
