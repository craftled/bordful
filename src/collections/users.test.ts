import { expect, test } from "vitest";

import { Users } from "./users";

test("admin auth cookie is Secure with SameSite Lax", () => {
  expect(Users.auth).toMatchObject({
    cookies: { sameSite: "Lax", secure: true },
  });
});
