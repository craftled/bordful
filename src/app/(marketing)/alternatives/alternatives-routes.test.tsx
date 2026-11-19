import { afterEach, expect, test, vi } from "vitest";

import { ALTERNATIVE_SLUGS } from "@/components/marketing/alternatives/registry";
import AlternativePage, {
  dynamicParams,
  generateStaticParams,
} from "./[slug]/page";
import HubPage from "./page";

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

test("marketing off rejects both alternatives routes", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "false");

  await expect(HubPage()).rejects.toThrow("NEXT_NOT_FOUND");
  await expect(
    AlternativePage({ params: Promise.resolve({ slug: "wp-job-manager" }) })
  ).rejects.toThrow("NEXT_NOT_FOUND");
});

test("marketing on serves hub and the registered child only", async () => {
  vi.stubEnv("BORDFUL_MARKETING", "true");

  expect(await HubPage()).toBeTruthy();
  expect(dynamicParams).toBe(false);
  expect(generateStaticParams()).toEqual([{ slug: "wp-job-manager" }]);
  expect(ALTERNATIVE_SLUGS).toEqual(["wp-job-manager"]);
  expect(
    await AlternativePage({
      params: Promise.resolve({ slug: "wp-job-manager" }),
    })
  ).toBeTruthy();
  await expect(
    AlternativePage({ params: Promise.resolve({ slug: "niceboard" }) })
  ).rejects.toThrow("NEXT_NOT_FOUND");
});
