import { describe, expect, test } from "vitest";

import { buildRegisterBody } from "./register-body";

const base = {
  boardName: "Example Board",
  email: "owner@example.com",
  installId: "0".repeat(64),
  medium: "admin" as const,
  telemetry: true,
  templateId: "engineering-it",
};

describe("buildRegisterBody", () => {
  test("sends the admin register body with a hashed install id", () => {
    expect(buildRegisterBody(base)).toEqual({
      agent_name: "bordful",
      board_name: "Example Board",
      email: "owner@example.com",
      install_id:
        "60e05bd1b195af2f94112fa7197a5c88289058840ce7c6df9693756bc6250f55",
      ref: "bordful",
      template_id: "engineering-it",
      utm_campaign: "connect",
      utm_medium: "admin",
      utm_source: "bordful",
    });
  });

  test("omits install_id when telemetry is off", () => {
    expect(buildRegisterBody({ ...base, telemetry: false })).toEqual({
      agent_name: "bordful",
      board_name: "Example Board",
      email: "owner@example.com",
      ref: "bordful",
      template_id: "engineering-it",
      utm_campaign: "connect",
      utm_medium: "admin",
      utm_source: "bordful",
    });
  });

  test("marks cli signup and includes the workspace", () => {
    expect(
      buildRegisterBody({
        ...base,
        medium: "cli",
        workspace: "example-workspace",
      })
    ).toMatchObject({
      utm_medium: "cli",
      workspace: "example-workspace",
    });
  });

  test("cuts a 120 character board name to 100 characters", () => {
    const boardName = "b".repeat(120);
    expect(buildRegisterBody({ ...base, boardName }).board_name).toBe(
      "b".repeat(100)
    );
  });
});
