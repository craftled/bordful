"use client";

import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type SyntheticEvent,
  useActionState,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  connectAction,
  pasteKeyAction,
  resetAction,
  setAttributionAction,
  syncNowAction,
  verifyCodeAction,
} from "@/actions/bordfeed-connect";
import {
  ALREADY_CONNECTED_MESSAGE,
  ALREADY_ISSUED_MESSAGE,
  CONNECT_LIMIT_MESSAGE,
  INVALID_KEY_MESSAGE,
  INVALID_START_MESSAGE,
  NEED_CODE_MESSAGE,
  REGISTER_RATE_LIMIT_MESSAGE,
  REGISTRATION_EXPIRED_MESSAGE,
  VERIFY_LIMIT_MESSAGE,
  WORKSPACE_REQUIRED_MESSAGE,
  WRONG_CODE_MESSAGE,
} from "@/lib/bordfeed/connect/messages";
import type { ConnectStepResult } from "@/lib/bordfeed/connect/service";

import styles from "./connect-card.module.css";

export interface ConnectCardView {
  boardName: string;
  email: string;
  keyHint: string | null;
  lastErrorMessage: string | null;
  lastSyncAt: string | null;
  previousState: "connected" | "sample" | null;
  showAttribution: boolean;
  state: "awaiting_code" | "connected" | "error" | "sample";
}

const ERROR_MESSAGES = new Set([
  ALREADY_CONNECTED_MESSAGE,
  ALREADY_ISSUED_MESSAGE,
  CONNECT_LIMIT_MESSAGE,
  INVALID_KEY_MESSAGE,
  INVALID_START_MESSAGE,
  NEED_CODE_MESSAGE,
  REGISTER_RATE_LIMIT_MESSAGE,
  REGISTRATION_EXPIRED_MESSAGE,
  VERIFY_LIMIT_MESSAGE,
  WORKSPACE_REQUIRED_MESSAGE,
  WRONG_CODE_MESSAGE,
]);

function isProblem(result: ConnectStepResult): boolean {
  return (
    result.fallback === "paste_key" ||
    Boolean(result.workspaces?.length) ||
    result.state === "error" ||
    result.message.startsWith("Connected. The first sync failed:") ||
    ERROR_MESSAGES.has(result.message) ||
    result.message.startsWith("attribution can be hidden")
  );
}

function usePublish(
  result: ConnectStepResult | null,
  onResult: (result: ConnectStepResult) => void,
  serverState: ConnectCardView["state"],
  refreshOnSameState: boolean
): void {
  const router = useRouter();
  useEffect(() => {
    if (!result) {
      return;
    }

    onResult(result);
    if (result.state !== serverState || refreshOnSameState) {
      router.refresh();
    }
  }, [onResult, refreshOnSameState, result, router, serverState]);
}

function RegisterForm({
  boardName,
  email,
  onBoardName,
  onEmail,
  onResult,
  serverState,
}: {
  boardName: string;
  email: string;
  onBoardName: (value: string) => void;
  onEmail: (value: string) => void;
  onResult: (result: ConnectStepResult) => void;
  serverState: ConnectCardView["state"];
}) {
  const [result, action, pending] = useActionState(connectAction, null);
  usePublish(result, onResult, serverState, false);
  const onEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onEmail(event.target.value);
    },
    [onEmail]
  );
  const onBoardNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onBoardName(event.target.value);
    },
    [onBoardName]
  );

  return (
    <form action={action} className={styles.form}>
      <p className={styles.hint}>
        The board shows sample jobs from the template. Connecting creates a free
        Bordfeed account.
      </p>
      <label htmlFor="bordfeed-email">
        Email
        <input
          autoComplete="email"
          data-testid="bordfeed-email"
          id="bordfeed-email"
          name="email"
          onChange={onEmailChange}
          required
          type="email"
          value={email}
        />
      </label>
      <label htmlFor="bordfeed-board-name">
        Board name
        <input
          data-testid="bordfeed-board-name"
          id="bordfeed-board-name"
          maxLength={100}
          name="boardName"
          onChange={onBoardNameChange}
          required
          type="text"
          value={boardName}
        />
      </label>
      <button
        className="btn btn--style-primary"
        data-testid="bordfeed-register-submit"
        disabled={pending}
        type="submit"
      >
        Send code
      </button>
    </form>
  );
}

function WorkspaceForm({
  boardName,
  email,
  onResult,
  serverState,
  workspaces,
}: {
  boardName: string;
  email: string;
  onResult: (result: ConnectStepResult) => void;
  serverState: ConnectCardView["state"];
  workspaces: { name: string; slug: string }[];
}) {
  const [result, action, pending] = useActionState(connectAction, null);
  usePublish(result, onResult, serverState, false);

  return (
    <form action={action} className={styles.form}>
      <input name="boardName" type="hidden" value={boardName} />
      <input name="email" type="hidden" value={email} />
      <label htmlFor="bordfeed-workspace-select">
        Choose which Bordfeed workspace to connect.
        <select
          data-testid="bordfeed-workspace-select"
          id="bordfeed-workspace-select"
          name="workspace"
          required
        >
          {workspaces.map((workspace) => (
            <option key={workspace.slug} value={workspace.slug}>
              {workspace.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="btn btn--style-primary"
        disabled={pending}
        type="submit"
      >
        Continue
      </button>
    </form>
  );
}

function VerifyForm({
  onResult,
  serverState,
}: {
  onResult: (result: ConnectStepResult) => void;
  serverState: ConnectCardView["state"];
}) {
  const [result, action, pending] = useActionState(verifyCodeAction, null);
  usePublish(result, onResult, serverState, false);

  return (
    <form action={action} className={styles.form}>
      <label htmlFor="bordfeed-code">
        6-digit code
        <input
          autoComplete="one-time-code"
          data-testid="bordfeed-code"
          id="bordfeed-code"
          inputMode="numeric"
          name="code"
          pattern="\d{6}"
          required
          type="text"
        />
      </label>
      <button
        className="btn btn--style-primary"
        data-testid="bordfeed-verify-submit"
        disabled={pending}
        type="submit"
      >
        Verify code
      </button>
    </form>
  );
}

function PasteForm({
  onOpenChange,
  onResult,
  open,
  serverState,
}: {
  onOpenChange: (open: boolean) => void;
  onResult: (result: ConnectStepResult) => void;
  open: boolean;
  serverState: ConnectCardView["state"];
}) {
  const [result, action, pending] = useActionState(pasteKeyAction, null);
  usePublish(result, onResult, serverState, false);
  const onDetailsToggle = useCallback(
    (event: SyntheticEvent<HTMLDetailsElement>) => {
      onOpenChange(event.currentTarget.open);
    },
    [onOpenChange]
  );

  return (
    <details className={styles.stack} onToggle={onDetailsToggle} open={open}>
      <summary>Already have a Bordfeed API key?</summary>
      <form action={action} className={styles.form}>
        <label htmlFor="bordfeed-paste-key">
          API key
          <input
            autoComplete="off"
            data-testid="bordfeed-paste-key"
            id="bordfeed-paste-key"
            name="apiKey"
            type="password"
          />
        </label>
        <button
          className="btn btn--style-secondary"
          data-testid="bordfeed-paste-key-submit"
          disabled={pending}
          type="submit"
        >
          Save API key
        </button>
      </form>
    </details>
  );
}

function AttributionField({
  onResult,
  serverState,
  showAttribution,
}: {
  onResult: (result: ConnectStepResult) => void;
  serverState: ConnectCardView["state"];
  showAttribution: boolean;
}) {
  const [creditResult, creditAction, creditPending] = useActionState(
    setAttributionAction,
    null
  );
  usePublish(creditResult, onResult, serverState, true);
  const connected = serverState === "connected";
  const onCreditChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { form } = event.currentTarget;
    const hidden = form?.elements.namedItem("show");
    if (hidden instanceof HTMLInputElement) {
      hidden.value = event.currentTarget.checked ? "true" : "false";
    }
    form?.requestSubmit();
  }, []);

  return (
    <form action={creditAction}>
      <input
        name="show"
        type="hidden"
        value={showAttribution ? "false" : "true"}
      />
      <label className={styles.check} htmlFor="bordfeed-show-attribution">
        <input
          checked={showAttribution}
          data-testid="bordfeed-show-attribution"
          disabled={!connected || creditPending}
          id="bordfeed-show-attribution"
          onChange={onCreditChange}
          type="checkbox"
        />
        Show the Jobs by Bordfeed credit
      </label>
    </form>
  );
}

function ConnectedTools({
  onResult,
  serverState,
}: {
  onResult: (result: ConnectStepResult) => void;
  serverState: ConnectCardView["state"];
}) {
  const [syncResult, syncAction, syncPending] = useActionState(
    syncNowAction,
    null
  );
  const [resetResult, resetFormAction, resetPending] = useActionState(
    resetAction,
    null
  );
  const [confirming, setConfirming] = useState(false);
  usePublish(syncResult, onResult, serverState, true);
  usePublish(resetResult, onResult, serverState, true);
  const askConfirm = useCallback(() => {
    setConfirming(true);
  }, []);
  const cancelConfirm = useCallback(() => {
    setConfirming(false);
  }, []);

  return (
    <div className={styles.stack}>
      <form action={syncAction}>
        <button
          className="btn btn--style-primary"
          data-testid="bordfeed-sync-now"
          disabled={syncPending}
          type="submit"
        >
          Sync now
        </button>
      </form>
      {confirming ? (
        <form action={resetFormAction} className={styles.form}>
          <p className={styles.hint}>
            Disconnecting removes the saved key and shows sample jobs again.
          </p>
          <div className={styles.actions}>
            <button
              className="btn btn--style-secondary"
              data-testid="bordfeed-reset"
              disabled={resetPending}
              type="submit"
            >
              Disconnect and show sample jobs
            </button>
            <button
              className="btn btn--style-secondary"
              onClick={cancelConfirm}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="btn btn--style-secondary"
          data-testid="bordfeed-reset"
          onClick={askConfirm}
          type="button"
        >
          Disconnect
        </button>
      )}
    </div>
  );
}

export function ConnectCardClient({ view }: { view: ConnectCardView }) {
  const [email, setEmail] = useState(view.email);
  const [boardName, setBoardName] = useState(view.boardName);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<
    { name: string; slug: string }[] | null
  >(null);
  const [latest, setLatest] = useState<ConnectStepResult | null>(null);
  const onResult = useCallback((result: ConnectStepResult) => {
    setLatest(result);
    if (result.fallback === "paste_key") {
      setPasteOpen(true);
    }
    setWorkspaces(
      result.workspaces && result.workspaces.length > 0
        ? result.workspaces
        : null
    );
  }, []);
  const showRegister =
    !workspaces &&
    (view.state === "sample" ||
      (view.state === "error" && view.previousState !== "connected"));
  const showTools =
    view.state === "connected" || view.previousState === "connected";
  let statusText = "";
  let errorText = view.lastErrorMessage ?? "";
  if (latest) {
    if (isProblem(latest)) {
      errorText = latest.message;
    } else {
      errorText = "";
      statusText = latest.message;
    }
  }

  return (
    <section
      className={styles.card}
      data-state={view.state}
      data-testid="bordfeed-connect-card"
    >
      <h2>Connect Bordfeed</h2>
      {statusText ? (
        <p
          className={styles.message}
          data-testid="bordfeed-message"
          role="status"
        >
          {statusText}
        </p>
      ) : null}
      {errorText ? (
        <p className={styles.error} data-testid="bordfeed-error" role="alert">
          {errorText}
        </p>
      ) : null}
      {showRegister ? (
        <RegisterForm
          boardName={boardName}
          email={email}
          onBoardName={setBoardName}
          onEmail={setEmail}
          onResult={onResult}
          serverState={view.state}
        />
      ) : null}
      {view.state === "awaiting_code" ? (
        <VerifyForm onResult={onResult} serverState={view.state} />
      ) : null}
      {workspaces ? (
        <WorkspaceForm
          boardName={boardName}
          email={email}
          onResult={onResult}
          serverState={view.state}
          workspaces={workspaces}
        />
      ) : null}
      <PasteForm
        onOpenChange={setPasteOpen}
        onResult={onResult}
        open={pasteOpen}
        serverState={view.state}
      />
      <AttributionField
        onResult={onResult}
        serverState={view.state}
        showAttribution={view.showAttribution}
      />
      {showTools ? (
        <ConnectedTools onResult={onResult} serverState={view.state} />
      ) : null}
      <p data-testid="bordfeed-last-sync">
        {view.lastSyncAt
          ? `Last sync ${view.lastSyncAt}${view.keyHint ? ` (${view.keyHint})` : ""}`
          : "No sync yet."}
      </p>
    </section>
  );
}
