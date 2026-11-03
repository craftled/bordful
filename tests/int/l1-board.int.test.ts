import { existsSync } from "node:fs";

import { beforeAll, expect, test } from "vitest";

if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

import { parseBoardQuery } from "@/lib/board/query";
import { countTaxonomy } from "@/lib/board/taxonomy";
import { buildBoardView } from "@/lib/board/view";
import { queryPublishedJobs } from "@/lib/read/queries";
import { loadBoardFixture } from "../fixtures/load";

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) {
  throw new Error("DATABASE_URL_TEST is required for test:int");
}

const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
if (!(databaseName.endsWith("_int") || databaseName.endsWith("_test"))) {
  throw new Error(
    `DATABASE_URL_TEST database must end with _int or _test (${databaseName})`
  );
}

process.env.DATABASE_URL = databaseUrl;

const { getPayload } = await import("payload");
const { default: config } = await import("@payload-config");

const payload = await getPayload({ config });

beforeAll(async () => {
  await payload.db.migrateFresh({ forceAcceptWarning: true });
  await loadBoardFixture(payload);
});

test("published jobs feed the board view and taxonomy counts", async () => {
  const listed = await queryPublishedJobs(payload, { limit: 1000, page: 1 });
  const view = buildBoardView(
    listed.items,
    parseBoardQuery(new URLSearchParams(""), { defaultPerPage: 20 })
  );
  const types = Object.fromEntries(
    countTaxonomy(listed.items).types.map((facet) => [facet.slug, facet.count])
  );

  expect(view.docs.map((card) => card.slug)).toEqual([
    "sample-remote-data-analyst",
    "example-product-designer",
    "example-senior-backend-engineer",
  ]);
  expect(types).toEqual({ contract: 1, "full-time": 1 });
});
