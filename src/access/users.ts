import type { Access, CollectionAccess } from "payload";

import { hasRole } from "./roles";

function userId(user: unknown): number | string | null {
  if (user === null || typeof user !== "object" || !("id" in user)) {
    return null;
  }

  const { id } = user;
  if (typeof id === "number" || typeof id === "string") {
    return id;
  }

  return null;
}

export const usersRead: Access = ({ req }) => {
  if (hasRole(req.user, "admin")) {
    return true;
  }

  const id = userId(req.user);
  if (hasRole(req.user, "editor") && id !== null) {
    return { id: { equals: id } };
  }

  return false;
};

export const usersUpdate: Access = usersRead;

export const canAccessAdminPanel: NonNullable<CollectionAccess["admin"]> = ({
  req,
}) => hasRole(req.user, "admin") || hasRole(req.user, "editor");
