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
  ATTRIBUTION_CONNECTED_ONLY_MESSAGE,
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
  registrationExpired: boolean;
  showAttribution: boolean;
  state: "awaiting_code" | "connected" | "error" | "sample";
}

const ERROR_MESSAGES = new Set([
  ALREADY_CONNECTED_MESSAGE,
  ALREADY_ISSUED_MESSAGE,
  ATTRIBUTION_CONNECTED_ONLY_MESSAGE,
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
    ERROR_MESSAGES.has(result.message)
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

const SYNC_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatSyncTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  const month = SYNC_MONTHS[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${month} ${day}, ${year}, ${hours}:${minutes} UTC`;
}

function RegisterForm({
  action,
  boardName,
  email,
  intro = true,
  onBoardName,
  onEmail,
  pending,
}: {
  action: (payload: FormData) => void;
  boardName: string;
  email: string;
  intro?: boolean;
  onBoardName: (value: string) => void;
  onEmail: (value: string) => void;
  pending: boolean;
}) {
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
      {intro ? (
        <p className={styles.hint}>
          The board shows sample jobs from the template. Connecting creates a
          free Bordfeed account.
        </p>
      ) : null}
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
  action,
  boardName,
  email,
  pending,
  workspaces,
}: {
  action: (payload: FormData) => void;
  boardName: string;
  email: string;
  pending: boolean;
  workspaces: { name: string; slug: string }[];
}) {
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
        data-testid="bordfeed-workspace-submit"
        disabled={pending}
        type="submit"
      >
        Continue
      </button>
    </form>
  );
}

function VerifyForm({
  action,
  pending,
}: {
  action: (payload: FormData) => void;
  pending: boolean;
}) {
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
  action,
  onOpenChange,
  open,
  pending,
}: {
  action: (payload: FormData) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
}) {
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
  action,
  pending,
  showAttribution,
  state,
}: {
  action: (payload: FormData) => void;
  pending: boolean;
  showAttribution: boolean;
  state: ConnectCardView["state"];
}) {
  const connected = state === "connected";
  // The box shows the click at once. The saved value follows on refresh.
  const [checked, setChecked] = useState(showAttribution);
  useEffect(() => {
    setChecked(showAttribution);
  }, [showAttribution]);
  const onCreditChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { form } = event.currentTarget;
    setChecked(event.currentTarget.checked);
    const hidden = form?.elements.namedItem("show");
    if (hidden instanceof HTMLInputElement) {
      hidden.value = event.currentTarget.checked ? "true" : "false";
    }
    form?.requestSubmit();
  }, []);

  return (
    <form action={action}>
      <input
        name="show"
        type="hidden"
        value={showAttribution ? "false" : "true"}
      />
      <label className={styles.check} htmlFor="bordfeed-show-attribution">
        <input
          checked={checked}
          data-testid="bordfeed-show-attribution"
          disabled={!connected || pending}
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
  resetForm,
  resetPending,
  syncAction,
  syncPending,
}: {
  resetForm: (payload: FormData) => void;
  resetPending: boolean;
  syncAction: (payload: FormData) => void;
  syncPending: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
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
        <form action={resetForm} className={styles.form}>
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
  // A save revalidates the board, so Next re-renders the card with the new
  // state. Sub-forms unmount on that render, so the action hooks live here.
  const [registerResult, registerAction, registerPending] = useActionState(
    connectAction,
    null
  );
  const [verifyResult, verifyAction, verifyPending] = useActionState(
    verifyCodeAction,
    null
  );
  const [pasteResult, pasteAction, pastePending] = useActionState(
    pasteKeyAction,
    null
  );
  const [creditResult, creditAction, creditPending] = useActionState(
    setAttributionAction,
    null
  );
  const [syncResult, syncAction, syncPending] = useActionState(
    syncNowAction,
    null
  );
  const [resetResult, resetFormAction, resetPending] = useActionState(
    resetAction,
    null
  );
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
  usePublish(registerResult, onResult, view.state, false);
  usePublish(verifyResult, onResult, view.state, false);
  usePublish(pasteResult, onResult, view.state, false);
  usePublish(creditResult, onResult, view.state, true);
  usePublish(syncResult, onResult, view.state, true);
  usePublish(resetResult, onResult, view.state, true);
  const showRegister =
    !workspaces &&
    (view.state === "sample" ||
      view.registrationExpired ||
      (view.state === "error" && view.previousState !== "connected"));
  const showVerify =
    view.state === "awaiting_code" && !view.registrationExpired && !workspaces;
  const showTools =
    view.state === "connected" || view.previousState === "connected";
  let statusText = view.registrationExpired ? REGISTRATION_EXPIRED_MESSAGE : "";
  let errorText = view.state === "error" ? (view.lastErrorMessage ?? "") : "";
  if (latest) {
    if (isProblem(latest)) {
      errorText = latest.message;
      statusText = "";
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
      <p
        className={styles.message}
        data-testid="bordfeed-message"
        role="status"
      >
        {statusText}
      </p>
      <p className={styles.error} data-testid="bordfeed-error" role="alert">
        {errorText}
      </p>
      {showRegister ? (
        <RegisterForm
          action={registerAction}
          boardName={boardName}
          email={email}
          onBoardName={setBoardName}
          onEmail={setEmail}
          pending={registerPending}
        />
      ) : null}
      {showVerify ? (
        <>
          <VerifyForm action={verifyAction} pending={verifyPending} />
          <details className={styles.stack}>
            <summary>Use a different email</summary>
            <RegisterForm
              action={registerAction}
              boardName={boardName}
              email={email}
              intro={false}
              onBoardName={setBoardName}
              onEmail={setEmail}
              pending={registerPending}
            />
          </details>
        </>
      ) : null}
      {workspaces ? (
        <WorkspaceForm
          action={registerAction}
          boardName={boardName}
          email={email}
          pending={registerPending}
          workspaces={workspaces}
        />
      ) : null}
      <PasteForm
        action={pasteAction}
        onOpenChange={setPasteOpen}
        open={pasteOpen}
        pending={pastePending}
      />
      <AttributionField
        action={creditAction}
        pending={creditPending}
        showAttribution={view.showAttribution}
        state={view.state}
      />
      {showTools ? (
        <ConnectedTools
          resetForm={resetFormAction}
          resetPending={resetPending}
          syncAction={syncAction}
          syncPending={syncPending}
        />
      ) : null}
      <p data-testid="bordfeed-last-sync">
        {view.lastSyncAt ? (
          <>
            {"Last sync "}
            <time dateTime={view.lastSyncAt}>
              {formatSyncTime(view.lastSyncAt)}
            </time>
            {view.keyHint ? ` (${view.keyHint})` : ""}
          </>
        ) : (
          "No sync yet."
        )}
      </p>
    </section>
  );
}
