import { describe, expect, test } from "vitest";

import { buildRegisterBody } from "./register-body";

const base = {
  boardName: "Example Board",
  email: "owner@example.com",
  installId: "0".repeat(64),
  medium: "admin" as const,
  telemetry: true,
  templateId: "fully-remote",
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
      template_id: "fully-remote",
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
      template_id: "fully-remote",
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

  test("keeps an 80 character board name and drops an 81 character one", () => {
    expect(
      buildRegisterBody({ ...base, boardName: "b".repeat(80) }).board_name
    ).toBe("b".repeat(80));
    expect(
      buildRegisterBody({ ...base, boardName: "b".repeat(81) })
    ).not.toHaveProperty("board_name");
  });

  test("drops a board name that live would read as a domain", () => {
    for (const boardName of ["Remote.io", "jobs.example.com", "www jobs"]) {
      expect(buildRegisterBody({ ...base, boardName })).not.toHaveProperty(
        "board_name"
      );
    }
    expect(
      buildRegisterBody({ ...base, boardName: "Dr. Smith Jobs" }).board_name
    ).toBe("Dr. Smith Jobs");
  });
});
