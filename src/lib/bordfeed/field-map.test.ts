import { expect, test } from "vitest";

import {
  BORDFEED_COMPANY_UNMAPPED_FIELDS,
  BORDFEED_JOB_UNMAPPED_FIELDS,
  COMPANY_FIELD_MAP,
  JOB_FIELD_MAP,
} from "./field-map";
import openapi from "./openapi.pinned.json" with { type: "json" };

function assertPartition(
  properties: Record<string, unknown>,
  mapped: Record<string, string>,
  unmapped: readonly string[]
): void {
  const names = Object.keys(properties);
  const listed = [...Object.keys(mapped), ...unmapped];
  expect(listed).toHaveLength(new Set(listed).size);
  expect(listed.slice().sort()).toEqual(names.slice().sort());
}

test("every pinned Job and company field is mapped or listed unmapped", () => {
  const {
    components: { schemas },
  } = openapi;
  assertPartition(
    schemas.Job.properties,
    JOB_FIELD_MAP,
    BORDFEED_JOB_UNMAPPED_FIELDS
  );
  assertPartition(
    schemas.JobCompanyEmbed.properties,
    COMPANY_FIELD_MAP,
    BORDFEED_COMPANY_UNMAPPED_FIELDS
  );
});
