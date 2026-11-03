import type { CollectionConfig } from "payload";

import { anyone, denyAuthenticated, isStaff } from "@/access/roles";
import { JOB_ORIGINS } from "@/lib/domain/job-vocab";
import { toOptions } from "@/lib/domain/options";

import { emptyToNull } from "./shared/empty-to-null";
import { owned } from "./shared/owned";
import {
  revalidateCompanies,
  revalidateCompaniesDelete,
} from "./shared/revalidate";
import { hostname, httpUrl, syncOriginValidate } from "./shared/validators";

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
    afterChange: [revalidateCompanies],
    afterDelete: [revalidateCompaniesDelete],
  },
  slug: "companies",
  versions: false,
};
