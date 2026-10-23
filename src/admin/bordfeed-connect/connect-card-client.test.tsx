// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import {
  connectAction,
  resetAction,
  setAttributionAction,
} from "@/actions/bordfeed-connect";
import {
  ATTRIBUTION_CONNECTED_ONLY_MESSAGE,
  CREDIT_SHOWN_MESSAGE,
  RESET_MESSAGE,
} from "@/lib/bordfeed/connect/messages";

import { ConnectCardClient, type ConnectCardView } from "./connect-card-client";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/actions/bordfeed-connect", () => ({
  connectAction: vi.fn(),
  pasteKeyAction: vi.fn(),
  resetAction: vi.fn(),
  setAttributionAction: vi.fn(),
  syncNowAction: vi.fn(),
  verifyCodeAction: vi.fn(),
}));

const CODE_SENT =
  "We sent a 6-digit code to owner@example.com. Enter it below.";

function view(overrides: Partial<ConnectCardView>): ConnectCardView {
  return {
    boardName: "Board",
    email: "owner@example.com",
    keyHint: null,
    lastErrorMessage: null,
    lastSyncAt: null,
    previousState: null,
    registrationExpired: false,
    showAttribution: true,
    state: "connected",
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test("a disconnect message is not replayed after the card moves on", async () => {
  vi.mocked(resetAction).mockResolvedValueOnce({
    message: RESET_MESSAGE,
    state: "sample",
  });
  vi.mocked(connectAction).mockResolvedValueOnce({
    message: CODE_SENT,
    state: "awaiting_code",
  });

  const { rerender } = render(<ConnectCardClient view={view({})} />);

  fireEvent.click(screen.getByTestId("bordfeed-reset"));
  fireEvent.click(screen.getByTestId("bordfeed-reset"));
  expect(await screen.findByText(RESET_MESSAGE)).toBeTruthy();

  rerender(<ConnectCardClient view={view({ state: "sample" })} />);
  fireEvent.click(screen.getByTestId("bordfeed-register-submit"));
  expect(await screen.findByText(CODE_SENT)).toBeTruthy();

  rerender(<ConnectCardClient view={view({ state: "awaiting_code" })} />);
  expect(screen.getByTestId("bordfeed-message").textContent).toBe(CODE_SENT);
  expect(screen.queryByText(RESET_MESSAGE)).toBeNull();
});

test("a refused credit save puts the checkbox back to the saved value", async () => {
  vi.mocked(setAttributionAction).mockResolvedValueOnce({
    message: ATTRIBUTION_CONNECTED_ONLY_MESSAGE,
    state: "connected",
  });

  render(<ConnectCardClient view={view({ showAttribution: true })} />);
  const box = screen.getByTestId("bordfeed-show-attribution");
  expect((box as HTMLInputElement).checked).toBe(true);

  fireEvent.click(box);
  await waitFor(() => {
    expect(screen.getByTestId("bordfeed-error").textContent).toBe(
      ATTRIBUTION_CONNECTED_ONLY_MESSAGE
    );
  });
  expect((box as HTMLInputElement).checked).toBe(true);
});

test("a saved credit change keeps the checkbox at the click", async () => {
  vi.mocked(setAttributionAction).mockResolvedValueOnce({
    message: CREDIT_SHOWN_MESSAGE,
    state: "connected",
  });

  render(<ConnectCardClient view={view({ showAttribution: false })} />);
  const box = screen.getByTestId(
    "bordfeed-show-attribution"
  ) as HTMLInputElement;

  fireEvent.click(box);
  expect(await screen.findByText(CREDIT_SHOWN_MESSAGE)).toBeTruthy();
  expect(box.checked).toBe(true);
});
