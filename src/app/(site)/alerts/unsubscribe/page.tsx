import config from "@payload-config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import { TokenActionForm } from "@/components/alerts/token-action-form";
import { BoardShell } from "@/components/board/board-shell";
import { firstSearchValue } from "@/lib/alerts/query";
import { findUnsubscribeAlert } from "@/lib/alerts/subscribe";

import { unsubscribeAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false },
  title: "Unsubscribe from job alerts",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = firstSearchValue(params.token);
  if (!token) {
    notFound();
  }

  const payload = await getPayload({ config });
  const subscriber = await findUnsubscribeAlert(payload, token);

  return (
    <BoardShell>
      <section className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
        <h1 className="font-semibold text-2xl">Unsubscribe from job alerts</h1>
        {subscriber ? (
          <>
            <p>This stops job alerts for this subscription.</p>
            <TokenActionForm
              action={unsubscribeAction}
              buttonTestId="alerts-unsubscribe-button"
              doneTestId="alerts-unsubscribed"
              invalidText="This unsubscribe link is not valid."
              submitLabel="Unsubscribe"
              token={token}
            />
          </>
        ) : (
          <p data-testid="alerts-invalid-token">
            This unsubscribe link is not valid.
          </p>
        )}
      </section>
    </BoardShell>
  );
}
