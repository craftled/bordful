import { expect, test } from "vitest";

import { pageSlots } from "./pagination";

test("lists every page when there are seven or fewer", () => {
  expect(pageSlots(1, 1)).toEqual([1]);
  expect(pageSlots(1, 2)).toEqual([1, 2]);
  expect(pageSlots(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

test("ellipsis after the first page of twenty", () => {
  expect(pageSlots(1, 20)).toEqual([1, 2, "gap", 20]);
});

test("ellipsis on both sides in the middle", () => {
  expect(pageSlots(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
});

test("ellipsis before the last page near the end", () => {
  expect(pageSlots(19, 20)).toEqual([1, "gap", 18, 19, 20]);
  expect(pageSlots(20, 20)).toEqual([1, "gap", 19, 20]);
});

test("ellipsis after the first page when only one page is hidden", () => {
  expect(pageSlots(2, 20)).toEqual([1, 2, 3, "gap", 20]);
});

test("a single hidden page is shown rather than replaced by an ellipsis", () => {
  // Page 4 of 9: neighbours 3 and 5, so page 2 is the only hidden one.
  expect(pageSlots(4, 9)).toEqual([1, 2, 3, 4, 5, "gap", 9]);
  // Page 6 of 9: page 8 is the only hidden one before the last page.
  expect(pageSlots(6, 9)).toEqual([1, "gap", 5, 6, 7, 8, 9]);
});

test("edge pages have no neighbour past the ends", () => {
  expect(pageSlots(1, 8)).toEqual([1, 2, "gap", 8]);
  expect(pageSlots(8, 8)).toEqual([1, "gap", 7, 8]);
});
