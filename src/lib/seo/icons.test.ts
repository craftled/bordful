import { expect, test } from "vitest";

import { marketingLayoutMetadata } from "@/components/marketing/metadata";

import { BORDFUL_ICONS, boardIcons } from "./icons";

test("bordful.com's board uses the mark the marketing pages declare", () => {
  expect(boardIcons(true, "/api/media/file/logo.png")).toEqual(BORDFUL_ICONS);
  expect(marketingLayoutMetadata(true).icons).toEqual(BORDFUL_ICONS);
});

test("a fork uses its Site Settings logo, never the Bordful mark", () => {
  expect(boardIcons(false, "/api/media/file/logo-320x320.png")).toEqual({
    icon: "/api/media/file/logo-320x320.png",
  });
  expect(boardIcons(false, null)).toBeUndefined();
});
