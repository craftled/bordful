import { expect, test } from "vitest";

import { boardStateHref } from "./links";
import { parseBoardQuery } from "./query";

const options = { defaultPerPage: 20 };

test("boardStateHref points an empty query at the fork home", () => {
  const query = parseBoardQuery(new URLSearchParams(""), options);
  expect(boardStateHref(query, options, false)).toBe("/");
});
