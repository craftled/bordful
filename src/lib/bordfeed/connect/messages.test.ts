import { describe, expect, test } from "vitest";

import { safeMessage } from "../errors";

import {
  ALREADY_ISSUED_MESSAGE,
  connectedMessage,
  connectedSyncFailedMessage,
  REGISTER_RATE_LIMIT_MESSAGE,
  REGISTRATION_EXPIRED_MESSAGE,
  RESET_MESSAGE,
  registeredMessage,
  WORKSPACE_REQUIRED_MESSAGE,
  WRONG_CODE_MESSAGE,
} from "./messages";

describe("connect messages", () => {
  test("registered", () => {
    expect(registeredMessage("owner@example.com")).toBe(
      "We sent a 6-digit code to owner@example.com. Enter it below."
    );
  });

  test("wrong code", () => {
    expect(WRONG_CODE_MESSAGE).toBe(
      "That code did not match. Check the email and try again."
    );
  });

  test("register 429", () => {
    expect(REGISTER_RATE_LIMIT_MESSAGE).toBe(
      "Bordfeed allows 5 signups per hour from this server's address. Paste an API key from your Bordfeed dashboard instead, or try again in an hour."
    );
  });

  test("already issued", () => {
    expect(ALREADY_ISSUED_MESSAGE).toBe(
      "This code was already used and its API key was issued. Paste your Bordfeed API key instead."
    );
    expect(ALREADY_ISSUED_MESSAGE).toBe(safeMessage("already_issued"));
  });

  test("workspace required", () => {
    expect(WORKSPACE_REQUIRED_MESSAGE).toBe(
      "Choose which Bordfeed workspace to connect."
    );
  });

  test("connected", () => {
    expect(connectedMessage(3)).toBe("Connected. Synced 3 jobs from Bordfeed.");
  });

  test("connected but first sync failed", () => {
    expect(connectedSyncFailedMessage("Could not reach Bordfeed.")).toBe(
      "Connected. The first sync failed: Could not reach Bordfeed."
    );
  });

  test("registration expired", () => {
    expect(REGISTRATION_EXPIRED_MESSAGE).toBe("The code expired. Start again.");
  });

  test("reset", () => {
    expect(RESET_MESSAGE).toBe(
      "Disconnected. The board shows sample jobs again."
    );
  });
});
