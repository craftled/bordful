import { expect, test } from "vitest";

import { defineBordfulConfig } from "@/config/define-config";

import {
  bordfeedClientHeaders,
  bordfeedClientHeaderValue,
} from "./client-header";

test("the client header names this bordful version", () => {
  expect(bordfeedClientHeaderValue()).toBe("bordful/1.0.0-beta.1");
  expect(bordfeedClientHeaders(defineBordfulConfig({}))).toEqual({
    "X-Bordfeed-Client": "bordful/1.0.0-beta.1",
  });
  expect(
    bordfeedClientHeaders(
      defineBordfulConfig({ telemetry: { clientHeader: false } })
    )
  ).toEqual({});
});
