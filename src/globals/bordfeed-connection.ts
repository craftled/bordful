import type {
  CheckboxFieldValidation,
  GlobalAfterChangeHook,
  GlobalConfig,
  TextFieldSingleValidation,
} from "payload";

import { anyone, isAdmin, isAdminField } from "@/access/roles";
import { bordfulConfig } from "@/config";
import { isEncryptedEnvelope } from "@/lib/crypto/secret-box";
import { revalidateReadTags } from "@/lib/read/revalidate";

const STATES = ["sample", "awaiting_code", "connected", "error"] as const;
const PREVIOUS_STATES = ["sample", "connected"] as const;

const revalidateConnection: GlobalAfterChangeHook = ({ doc }) => {
  revalidateReadTags(["bordfeed-connection", "jobs"]);
  return doc;
};

const envelopeOrEmpty: TextFieldSingleValidation = (value) => {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  return isEncryptedEnvelope(value)
    ? true
    : "Bordfeed keys must be stored as an encrypted envelope.";
};

const attributionGuard: CheckboxFieldValidation = (value, { siblingData }) => {
  const { state } = siblingData as { state?: string };

  if (value === false && state !== "connected") {
    return "The Jobs by Bordfeed credit can be hidden only when Bordfeed is connected.";
  }

  return true;
};

function readOnlyText(name: string, extra?: Record<string, unknown>) {
  return {
    admin: { readOnly: true },
    name,
    type: "text" as const,
    ...extra,
  };
}

export const BordfeedConnection: GlobalConfig = {
  access: {
    read: anyone,
    update: isAdmin,
  },
  admin: {},
  authorship: false,
  fields: [
    {
      admin: { readOnly: true },
      defaultValue: "sample",
      name: "state",
      options: STATES.map((value) => ({ label: value, value })),
      required: true,
      type: "select",
    },
    {
      access: { read: isAdminField },
      admin: { readOnly: true },
      name: "previousState",
      options: PREVIOUS_STATES.map((value) => ({ label: value, value })),
      type: "select",
    },
    {
      admin: { readOnly: true },
      defaultValue: bordfulConfig.board.defaultTemplateId,
      name: "templateId",
      required: true,
      type: "text",
    },
    {
      access: { read: isAdminField },
      admin: { readOnly: true },
      name: "filters",
      type: "json",
    },
    {
      ...readOnlyText("registrationId"),
      access: { read: isAdminField },
    },
    {
      access: { read: isAdminField },
      admin: { readOnly: true },
      name: "registrationExpiresAt",
      type: "date",
    },
    {
      admin: { readOnly: true },
      hidden: true,
      name: "apiKeyEncrypted",
      type: "text",
      validate: envelopeOrEmpty,
    },
    {
      ...readOnlyText("keyHint"),
      access: { read: isAdminField },
    },
    {
      ...readOnlyText("feedId"),
      access: { read: isAdminField },
    },
    {
      admin: { readOnly: true },
      name: "lastSyncAt",
      type: "date",
    },
    {
      access: { read: isAdminField },
      admin: { readOnly: true },
      name: "lastSyncSummary",
      type: "json",
    },
    {
      access: { read: isAdminField },
      admin: { readOnly: true },
      name: "lastError",
      type: "json",
    },
    {
      defaultValue: true,
      name: "showAttribution",
      type: "checkbox",
      validate: attributionGuard,
    },
  ],
  hooks: { afterChange: [revalidateConnection] },
  slug: "bordfeed-connection",
  versions: false,
};
