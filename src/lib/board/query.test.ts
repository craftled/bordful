import { expect, test } from "vitest";

import { parseBoardQuery, serializeBoardQuery } from "./query";

const options = { defaultPerPage: 20 };

test("parses csv filters and serializes the canonical query string", () => {
  const query = parseBoardQuery(
    new URLSearchParams(
      "types=contract,full-time,bogus,contract&remote=true&q=%20Designer%20&per_page=50&page=2&sort=oldest"
    ),
    options
  );

  expect(query).toEqual({
    categories: [],
    featured: false,
    languages: [],
    page: 2,
    perPage: 50,
    q: "Designer",
    remote: true,
    salary: [],
    seniority: [],
    sort: "oldest",
    types: ["contract", "full-time"],
    visa: false,
  });
  expect(serializeBoardQuery(query, options).toString()).toBe(
    "q=Designer&types=contract%2Cfull-time&remote=true&sort=oldest&per_page=50&page=2"
  );
});

test("drops unknown per page values and non positive pages", () => {
  expect(
    parseBoardQuery(new URLSearchParams("per_page=7"), options).perPage
  ).toBe(20);
  expect(parseBoardQuery(new URLSearchParams("page=-3"), options).page).toBe(1);
});

test("parses categories and featured, lowercased and de-duplicated", () => {
  const query = parseBoardQuery(
    new URLSearchParams("categories=Design,design%20,Data&featured=true"),
    options
  );

  expect(query.categories).toEqual(["design", "data"]);
  expect(query.featured).toBe(true);
  expect(serializeBoardQuery(query, options).toString()).toBe(
    "categories=design%2Cdata&featured=true"
  );
  expect(
    parseBoardQuery(new URLSearchParams("featured=1"), options).featured
  ).toBe(false);
});

test("a comma followed by a space stays inside one category", () => {
  const query = parseBoardQuery(
    new URLSearchParams({ categories: "Art, Fashion & Design,Data" }),
    options
  );

  expect(query.categories).toEqual(["art, fashion & design", "data"]);
  expect(
    parseBoardQuery(serializeBoardQuery(query, options), options).categories
  ).toEqual(query.categories);
});
