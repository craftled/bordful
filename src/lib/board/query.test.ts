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
