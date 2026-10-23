"use client";

import { useActionState } from "react";

import type { AlertsActionState } from "@/lib/alerts/action-state";

type TokenAction = (
  prev: AlertsActionState | null,
  formData: FormData
) => Promise<AlertsActionState>;

export function TokenActionForm({
  action,
  buttonTestId,
  doneTestId,
  invalidText,
  submitLabel,
  token,
}: {
  action: TokenAction;
  buttonTestId: string;
  doneTestId: string;
  invalidText: string;
  submitLabel: string;
  token: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.ok) {
    return (
      <p data-testid={doneTestId} role="status">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input name="token" type="hidden" value={token} />
      <button
        className="h-10 w-fit rounded-md bg-primary px-4 text-primary-foreground disabled:opacity-50"
        data-testid={buttonTestId}
        disabled={pending}
        type="submit"
      >
        {submitLabel}
      </button>
      {state && !state.ok ? (
        <p data-testid="alerts-invalid-token" role="alert">
          {invalidText}
        </p>
      ) : null}
    </form>
  );
}
