"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
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
      <Button
        className="w-fit"
        data-testid={buttonTestId}
        disabled={pending}
        type="submit"
      >
        {submitLabel}
      </Button>
      {state && !state.ok ? (
        <p
          className="text-destructive text-sm"
          data-testid="alerts-invalid-token"
          role="alert"
        >
          {invalidText}
        </p>
      ) : null}
    </form>
  );
}
