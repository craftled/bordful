import type {
  GlobalAfterChangeHook,
  GlobalConfig,
  TextFieldSingleValidation,
} from "payload";

import { anyone, isAdmin } from "@/access/roles";
import { hexColor } from "@/collections/shared/validators";
import { ALERT_FREQUENCIES } from "@/lib/domain/job-vocab";
import { toOptions } from "@/lib/domain/options";
import { revalidateReadTags } from "@/lib/read/revalidate";
import { PUBLIC_DETAIL_FIELDS } from "@/lib/read/types";
import { FONT_IDS, THEME_COLOR_KEYS } from "@/theme/tokens";

const revalidateSiteSettings: GlobalAfterChangeHook = ({ doc }) => {
  revalidateReadTags(["site-settings"]);
  return doc;
};

const paymentLinkUrl: TextFieldSingleValidation = (value, { siblingData }) => {
  const enabled =
    siblingData !== null &&
    typeof siblingData === "object" &&
    "enabled" in siblingData &&
    siblingData.enabled === true;

  if (value === null || value === undefined || value === "") {
    return enabled ? "Add a payment link before enabling Post a Job." : true;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "https:") {
      return true;
    }
  } catch {
    return "Enter an https URL.";
  }

  return "Enter an https URL.";
};

const colorFields = THEME_COLOR_KEYS.map((name) => ({
  admin: {
    components: {
      Field: "/admin/components/color-field#ColorField",
    },
  },
  name,
  type: "text" as const,
  validate: hexColor,
}));

export const SiteSettings: GlobalConfig = {
  access: {
    read: anyone,
    readVersions: isAdmin,
    update: isAdmin,
  },
  fields: [
    { defaultValue: "Job Board", name: "name", required: true, type: "text" },
    { defaultValue: "", name: "tagline", type: "text" },
    { name: "logo", relationTo: "media", type: "upload" },
    {
      fields: [
        { fields: colorFields, name: "colors", type: "group" },
        {
          defaultValue: "system",
          name: "fontHeading",
          options: toOptions(FONT_IDS),
          type: "select",
        },
        {
          defaultValue: "system",
          name: "fontBody",
          options: toOptions(FONT_IDS),
          type: "select",
        },
        {
          admin: { step: 0.125 },
          defaultValue: 0.625,
          max: 2,
          min: 0,
          name: "radius",
          type: "number",
        },
      ],
      name: "theme",
      type: "group",
    },
    {
      fields: [
        { defaultValue: "", name: "title", type: "text" },
        { defaultValue: "", name: "description", type: "textarea" },
        {
          defaultValue: 20,
          max: 100,
          min: 5,
          name: "jobsPerPage",
          type: "number",
        },
        {
          defaultValue: [...PUBLIC_DETAIL_FIELDS],
          hasMany: true,
          name: "publicDetailFields",
          options: toOptions(PUBLIC_DETAIL_FIELDS),
          type: "select",
        },
      ],
      name: "board",
      type: "group",
    },
    {
      fields: [
        { defaultValue: false, name: "enabled", type: "checkbox" },
        {
          defaultValue: "",
          name: "paymentLinkUrl",
          type: "text",
          validate: paymentLinkUrl,
        },
        { defaultValue: "", name: "priceLabel", type: "text" },
        {
          defaultValue: 30,
          max: 365,
          min: 1,
          name: "durationDays",
          required: true,
          type: "number",
        },
      ],
      name: "postJob",
      type: "group",
    },
    {
      fields: [
        { defaultValue: false, name: "enabled", type: "checkbox" },
        {
          defaultValue: "weekly",
          name: "defaultFrequency",
          options: toOptions(ALERT_FREQUENCIES),
          type: "select",
        },
        { defaultValue: "", name: "fromName", type: "text" },
        { name: "fromEmail", type: "email" },
      ],
      name: "alerts",
      type: "group",
    },
    {
      fields: [{ defaultValue: false, name: "listMyBoard", type: "checkbox" }],
      name: "showcase",
      type: "group",
    },
  ],
  hooks: { afterChange: [revalidateSiteSettings] },
  slug: "site-settings",
  versions: { max: 20 },
};
