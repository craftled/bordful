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
      <section className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-6 px-0 py-12 text-center">
        <h1 className="text-foreground text-[30px] leading-9 font-medium tracking-[-0.035em] md:text-[40px] md:leading-[48px]">
          Confirm your job alerts
        </h1>
        <div className="bg-card border-line text-muted-foreground flex w-full flex-col items-center gap-4 rounded-[14px] border p-5 text-[14px]">
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
        </div>
      </section>
    </BoardShell>
  );
}
