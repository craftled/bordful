import type { CollectionConfig } from "payload";

import { denyAll, isAdmin } from "@/access/roles";
import {
  ALERT_FREQUENCIES,
  ALERT_SUBSCRIBER_STATUSES,
  EMPTY_JOB_ALERT_QUERY,
} from "@/lib/domain/job-vocab";
import { toOptions } from "@/lib/domain/options";

export const AlertSubscribers: CollectionConfig = {
  access: {
    create: denyAll,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: { useAsTitle: "email" },
  authorship: false,
  fields: [
    { index: true, name: "email", required: true, type: "email", unique: true },
    {
      defaultValue: "pending",
      index: true,
      name: "status",
      options: toOptions(ALERT_SUBSCRIBER_STATUSES),
      required: true,
      type: "select",
    },
    {
      defaultValue: EMPTY_JOB_ALERT_QUERY,
      name: "query",
      type: "json",
    },
    {
      defaultValue: "weekly",
      name: "frequency",
      options: toOptions(ALERT_FREQUENCIES),
      required: true,
      type: "select",
    },
    {
      hidden: true,
      index: true,
      name: "confirmTokenHash",
      type: "text",
    },
    {
      hidden: true,
      index: true,
      name: "unsubscribeTokenHash",
      type: "text",
    },
    { name: "watermark", type: "date" },
    { name: "lastSentAt", type: "date" },
    { name: "confirmedAt", type: "date" },
  ],
  slug: "alert-subscribers",
  versions: false,
};
