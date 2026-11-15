// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import type { AdminViewServerProps } from "payload";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";

import { ForgotPassword } from "./forgot-password";

// Payload's elements import CSS, which vitest cannot load.
vi.mock("@payloadcms/ui", () => ({
  Button: ({ children, url }: { children: ReactNode; url: string }) => (
    <a href={url}>{children}</a>
  ),
}));
vi.mock("@payloadcms/ui/rsc", () => ({
  FormHeader: ({
    description,
    heading,
  }: {
    description: string;
    heading: string;
  }) => (
    <header>
      <h1>{heading}</h1>
      <p>{description}</p>
    </header>
  ),
}));

const RESET_COMMAND = /bun run bordful reset-password/u;

afterEach(cleanup);

const initPageResult = {
  req: {
    payload: {
      config: {
        admin: { routes: { login: "/login" } },
        routes: { admin: "/admin" },
      },
    },
  },
} as unknown as AdminViewServerProps["initPageResult"];

test("points to the CLI reset instead of offering an email form", () => {
  render(<ForgotPassword initPageResult={initPageResult} />);

  expect(screen.getByText(RESET_COMMAND)).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
  expect(screen.queryByRole("button")).toBeNull();
  expect(
    screen.getByRole("link", { name: "Back to login" }).getAttribute("href")
  ).toBe("/admin/login");
});
