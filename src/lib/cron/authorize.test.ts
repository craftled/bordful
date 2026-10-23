import { expect, test } from "vitest";

import { isAuthorizedCronRequest } from "./authorize";

const secret = "cron-secret";

function requestWith(header?: string): Request {
  const headers = new Headers();
  if (header !== undefined) {
    headers.set("authorization", header);
  }

  return new Request("http://localhost/api/cron/expire", { headers });
}

test("authorizes only an exact bearer header", () => {
  expect(isAuthorizedCronRequest(requestWith(`Bearer ${secret}`), secret)).toBe(
    true
  );
  expect(isAuthorizedCronRequest(requestWith("Bearer other"), secret)).toBe(
    false
  );
  expect(isAuthorizedCronRequest(requestWith(), secret)).toBe(false);
  expect(isAuthorizedCronRequest(requestWith(`bearer ${secret}`), secret)).toBe(
    false
  );
  expect(
    isAuthorizedCronRequest(requestWith(`Bearer ${secret}`), undefined)
  ).toBe(false);
  expect(isAuthorizedCronRequest(requestWith(`Bearer ${secret}`), "")).toBe(
    false
  );
});
