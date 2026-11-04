import { afterEach, expect, test, vi } from "vitest";

import { marketingHomeMetadata } from "@/components/marketing/metadata";

import { generateMetadata } from "./page";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
// The page bodies read the database; metadata does not.
vi.mock("@/app/(marketing)/_components/marketing-home", () => ({}));
vi.mock("@/components/board/board-home", () => ({}));
vi.mock("@/components/board/board-shell", () => ({}));
vi.mock("@/lib/read", () => ({}));

afterEach(() => {
  vi.unstubAllEnvs();
});

test("the marketing home carries the marketing card", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");

  const metadata = await generateMetadata();

  expect(metadata).toEqual(marketingHomeMetadata());
  expect(metadata.description).toBeTruthy();
  expect(metadata.openGraph).toBeDefined();
  expect(metadata.icons).toBeDefined();
});

test("the fork home keeps the board layout's metadata", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "false");

  expect(await generateMetadata()).toEqual({});
});
