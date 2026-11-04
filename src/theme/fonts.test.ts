import { expect, test, vi } from "vitest";

// next/font is a build-time transform; record the options each face gets.
const calls = vi.hoisted(() => new Map<string, { preload?: boolean }>());

vi.mock("next/font/google", () => {
  const face =
    (name: string) => (options: { preload?: boolean; variable: string }) => {
      calls.set(name, options);
      return { className: name, variable: options.variable };
    };
  return {
    Geist: face("Geist"),
    Geist_Mono: face("Geist_Mono"),
    IBM_Plex_Serif: face("IBM_Plex_Serif"),
  };
});

test("only the default body face is preloaded", async () => {
  await import("./fonts");

  expect(calls.get("Geist")?.preload).not.toBe(false);
  expect(calls.get("Geist_Mono")?.preload).toBe(false);
  expect(calls.get("IBM_Plex_Serif")?.preload).toBe(false);
});
