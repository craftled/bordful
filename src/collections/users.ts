import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import { isAdmin, isAdminField } from "@/access/roles";
import { canAccessAdminPanel, usersRead, usersUpdate } from "@/access/users";
import { USER_ROLES } from "@/lib/domain/job-vocab";
import { toOptions } from "@/lib/domain/options";

const firstUserIsAdmin: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== "create") {
    return data;
  }

  const { totalDocs } = await req.payload.count({
    collection: "users",
    overrideAccess: true,
    req,
  });

  if (totalDocs === 0) {
    data.roles = ["admin"];
  }

  return data;
};

export const Users: CollectionConfig = {
  access: {
    admin: canAccessAdminPanel,
    create: isAdmin,
    delete: isAdmin,
    read: usersRead,
    update: usersUpdate,
  },
  admin: { useAsTitle: "email" },
  auth: {
    lockTime: 600_000,
    maxLoginAttempts: 5,
    useAPIKey: true,
  },
  authorship: false,
  fields: [
    {
      access: { create: isAdminField, update: isAdminField },
      defaultValue: ["editor"],
      hasMany: true,
      name: "roles",
      options: toOptions(USER_ROLES),
      required: true,
      saveToJWT: true,
      type: "select",
    },
  ],
  hooks: { beforeChange: [firstUserIsAdmin] },
  slug: "users",
  versions: false,
};
