import { createHash, randomBytes } from "node:crypto";

import type { Payload } from "payload";

const INSTALL_ID = /^[a-f0-9]{64}$/;

export async function ensureInstallId(payload: Payload): Promise<string> {
  const current = await payload.findGlobal({
    depth: 0,
    overrideAccess: true,
    showHiddenFields: true,
    slug: "install-state",
  });

  if (
    typeof current.installId === "string" &&
    INSTALL_ID.test(current.installId)
  ) {
    return current.installId;
  }

  const installId = randomBytes(32).toString("hex");
  await payload.updateGlobal({
    data: { installId },
    depth: 0,
    overrideAccess: true,
    slug: "install-state",
  });

  return installId;
}

export function bordfeedInstallId(installId: string): string {
  return createHash("sha256").update(installId).digest("hex");
}
