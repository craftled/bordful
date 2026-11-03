import config from "@payload-config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import { AlertsForm } from "@/components/alerts/alerts-form";
import { BoardShell } from "@/components/board/board-shell";
import { alertsReady } from "@/lib/alerts/config";
import { parseAlertQueryFromSearchParams } from "@/lib/alerts/query";
import { querySiteSettings } from "@/lib/read/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Job alerts",
};

function toSearchParams(
  raw: Record<string, string | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      params.append(key, value);
      continue;
    }
    if (!value) {
      continue;
    }
    for (const item of value) {
      params.append(key, item);
    }
  }
  return params;
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Read the row directly instead of through the cached getSiteSettings, so a
  // save that turns alerts on takes effect on the next request.
  const payload = await getPayload({ config });
  const settings = await querySiteSettings(payload);
  if (!alertsReady(settings).ready) {
    notFound();
  }

  const params = await searchParams;
  const query = parseAlertQueryFromSearchParams(toSearchParams(params));

  return (
    <BoardShell>
      <AlertsForm
        defaultFrequency={settings.alerts.defaultFrequency}
        query={query}
      />
    </BoardShell>
  );
}
