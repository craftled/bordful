import config from "@payload-config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

import { TokenActionForm } from "@/components/alerts/token-action-form";
import { BoardShell } from "@/components/board/board-shell";
import { describeAlertQuery, firstSearchValue } from "@/lib/alerts/query";
import { findPendingAlert } from "@/lib/alerts/subscribe";

import { confirmAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false },
  title: "Confirm job alerts",
};

export default async function ConfirmAlertPage({
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
  const pending = await findPendingAlert(payload, token);

  return (
    <BoardShell>
      <section className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
        <h1 className="font-semibold text-2xl">Confirm your job alerts</h1>
        {pending ? (
          <>
            <p>{describeAlertQuery(pending.query)}</p>
            <TokenActionForm
              action={confirmAction}
              buttonTestId="alerts-confirm-button"
              doneTestId="alerts-confirmed"
              invalidText="This confirmation link is not valid."
              submitLabel="Confirm"
              token={token}
            />
          </>
        ) : (
          <p data-testid="alerts-invalid-token">
            This confirmation link is not valid.
          </p>
        )}
      </section>
    </BoardShell>
  );
}
