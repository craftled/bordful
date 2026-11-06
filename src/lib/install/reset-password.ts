import { randomBytes } from "node:crypto";

import type { Payload } from "payload";

// Payload's own reset, minus the email: it also clears a sign-in lockout, which
// a plain password update does not. Password hashes do not use PAYLOAD_SECRET,
// so this works without the production value, which `vercel env pull` cannot
// return once the variable is Sensitive.
export async function resetPassword(
  payload: Payload,
  email: string
): Promise<string | null> {
  const token = await payload.forgotPassword({
    collection: "users",
    data: { email },
    disableEmail: true,
    overrideAccess: true,
  });
  if (!token) {
    return null;
  }

  const password = randomBytes(18).toString("base64url");
  await payload.resetPassword({
    collection: "users",
    data: { password, token },
    overrideAccess: true,
  });

  return password;
}

export async function adminEmails(payload: Payload): Promise<string[]> {
  const admins = await payload.find({
    collection: "users",
    depth: 0,
    limit: 10,
    overrideAccess: true,
    pagination: false,
    sort: "createdAt",
    where: { roles: { contains: "admin" } },
  });

  return admins.docs.map((user) => user.email);
}
