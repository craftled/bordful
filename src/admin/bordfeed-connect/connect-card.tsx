import type { ServerProps } from "payload";
import type { JSX } from "react";

import { hasRole } from "@/access/roles";
import { connectAdminDenial } from "@/lib/bordfeed/connect/admin";
import { readConnection } from "@/lib/bordfeed/connection-store";
import { querySiteSettings } from "@/lib/read/queries";

import { ConnectCardClient, type ConnectCardView } from "./connect-card-client";

function emailOf(user: NonNullable<ServerProps["user"]>): string {
  if ("email" in user && typeof user.email === "string") {
    return user.email;
  }

  return "";
}

async function deniedFor(
  payload: ServerProps["payload"],
  user: NonNullable<ServerProps["user"]>
): Promise<boolean> {
  if (!connectAdminDenial(user)) {
    return false;
  }

  if (hasRole(user, "editor")) {
    return true;
  }

  const doc = await payload.findByID({
    collection: "users",
    depth: 0,
    id: user.id,
    overrideAccess: true,
  });
  return connectAdminDenial(doc) !== null;
}

export async function BordfeedConnectCard({
  payload,
  user,
}: ServerProps): Promise<JSX.Element | null> {
  if (!user) {
    return null;
  }

  const record = await readConnection(payload);
  if (await deniedFor(payload, user)) {
    return (
      <p data-state={record.state} data-testid="bordfeed-connect-card">
        {`Bordfeed status: ${record.state}.`}
      </p>
    );
  }

  const settings = await querySiteSettings(payload);
  const view: ConnectCardView = {
    boardName: settings.name,
    email: emailOf(user),
    keyHint: record.keyHint,
    lastErrorMessage: record.lastError?.message ?? null,
    lastSyncAt: record.lastSyncAt,
    previousState: record.previousState,
    showAttribution: record.showAttribution,
    state: record.state,
  };

  return <ConnectCardClient view={view} />;
}
