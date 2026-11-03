import { existsSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "vitest";

import {
  MARKETING_FOOTER_COLUMNS,
  MARKETING_HEADER_LINKS,
  type MarketingLink,
} from "./nav-links";

const ROOT = process.cwd();

// Route files for every in-app target. A link to a page that is not here 404s.
const ROUTE_FILES: Record<string, string> = {
  "/about": "src/app/(marketing)/about/page.tsx",
  "/changelog": "src/app/(marketing)/changelog/page.tsx",
  "/docs": "src/app/(marketing)/docs/page.tsx",
  "/faq": "src/app/(marketing)/faq/page.tsx",
  "/features": "src/app/(marketing)/features/page.tsx",
  "/feed.xml": "src/app/feed.xml/route.ts",
  "/jobs": "src/app/(site)/jobs/page.tsx",
  "/pricing": "src/app/(marketing)/pricing/page.tsx",
  "/privacy": "src/app/(marketing)/privacy/page.tsx",
  "/showcase": "src/app/(marketing)/showcase/page.tsx",
  "/terms": "src/app/(marketing)/terms/page.tsx",
};

function allLinks(): MarketingLink[] {
  return [
    ...MARKETING_HEADER_LINKS,
    ...MARKETING_FOOTER_COLUMNS.flatMap((column) => column.items),
  ];
}

test("every in-app marketing link points at an existing route", () => {
  const internal = allLinks()
    .map((link) => link.href)
    .filter((href) => href.startsWith("/"));

  for (const href of internal) {
    const path = href.split("#")[0] ?? "/";
    if (path === "/") {
      continue;
    }
    const file = ROUTE_FILES[path];
    expect(file, `no route mapped for ${href}`).toBeDefined();
    expect(existsSync(join(ROOT, file ?? "")), href).toBe(true);
  }
});

test("header and footer links have no dead anchors", () => {
  const hrefs = allLinks().map((link) => link.href);
  expect(hrefs).toContain("/features");
  expect(hrefs.filter((href) => href.startsWith("#"))).toEqual([]);
});
