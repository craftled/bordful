import { expect, test } from "vitest";

import { canonicalSearchRedirect } from "./canonical";

const options = { defaultPerPage: 20 };

test("redirects a single facet to its archive and cleans query order", () => {
  expect(
    canonicalSearchRedirect(new URLSearchParams("types=full-time"), options)
  ).toBe("/jobs/type/full-time");
  expect(
    canonicalSearchRedirect(new URLSearchParams("remote=true"), options)
  ).toBe("/jobs/location/remote");
  expect(
    canonicalSearchRedirect(
      new URLSearchParams("types=contract&page=2"),
      options
    )
  ).toBe("/jobs/type/contract/page/2");
  expect(
    canonicalSearchRedirect(
      new URLSearchParams("types=full-time&remote=true"),
      options
    )
  ).toBeNull();
  expect(
    canonicalSearchRedirect(new URLSearchParams("remote=true&q=a"), options)
  ).toBe("/jobs/search?q=a&remote=true");
  expect(
    canonicalSearchRedirect(new URLSearchParams("q=a&remote=true"), options)
  ).toBeNull();
});
