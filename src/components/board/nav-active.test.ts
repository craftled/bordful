import { expect, test } from "vitest";

import { isActiveItem, isActivePath } from "./nav-active";

test("the root item matches only the home page", () => {
  expect(isActivePath("/", "/")).toBe(true);
  expect(isActivePath("/jobs/type/full-time", "/")).toBe(false);
});

test("other items match themselves and their child routes only", () => {
  expect(isActivePath("/companies", "/companies")).toBe(true);
  expect(isActivePath("/companies/acme", "/companies")).toBe(true);
  expect(isActivePath("/companiesx", "/companies")).toBe(false);
});

test("matchPrefixes keeps an item active on routes outside its href", () => {
  const jobs = {
    href: "/",
    id: "jobs",
    label: "Jobs",
    matchPrefixes: ["/jobs"],
  };

  expect(isActiveItem("/", jobs)).toBe(true);
  expect(isActiveItem("/jobs/search", jobs)).toBe(true);
  expect(isActiveItem("/jobs/type/full-time", jobs)).toBe(true);
  expect(isActiveItem("/companies", jobs)).toBe(false);
});
