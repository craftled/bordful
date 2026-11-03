import { expect, test } from "vitest";

import { buildShareLinks } from "./job-share";

test("share links carry the encoded canonical url", () => {
  const links = buildShareLinks("https://x.test/jobs/a-b?x=1", "Dev & Ops");

  expect(links.linkedin).toBe(
    "https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fx.test%2Fjobs%2Fa-b%3Fx%3D1"
  );
  expect(links.x).toContain("url=https%3A%2F%2Fx.test%2Fjobs%2Fa-b%3Fx%3D1");
  expect(links.x).toContain("text=Dev%20%26%20Ops");
  expect(links.email).toBe(
    "mailto:?subject=Dev%20%26%20Ops&body=https%3A%2F%2Fx.test%2Fjobs%2Fa-b%3Fx%3D1"
  );
});
