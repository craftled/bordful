import { expect, test } from "vitest";

import { metaDescription, plainTextFromLexical } from "./plaintext";

test("plainTextFromLexical reads a lexical root and keeps inline text together", () => {
  const value = {
    root: {
      children: [
        {
          children: [{ text: "Hello " }, { text: "world" }],
          type: "paragraph",
        },
      ],
    },
  };

  expect(plainTextFromLexical(value)).toBe("Hello world");
  expect(
    plainTextFromLexical({
      root: {
        children: [
          {
            children: [{ text: "Sen" }, { text: "ior" }],
            type: "paragraph",
          },
        ],
      },
    })
  ).toBe("Senior");
});

test("plainTextFromLexical spaces block nodes and line breaks", () => {
  expect(
    plainTextFromLexical({
      root: {
        children: [
          { children: [{ text: "Hello" }], type: "paragraph" },
          { children: [{ text: "world" }], type: "heading" },
          {
            children: [{ text: "See" }, { type: "linebreak" }, { text: "you" }],
            type: "listitem",
          },
        ],
      },
    })
  ).toBe("Hello world See you");
});

test("metaDescription keeps the first 160 characters", () => {
  const body = "a".repeat(200);
  const description = metaDescription({
    root: {
      children: [{ children: [{ text: body }], type: "paragraph" }],
    },
  });

  expect(description).toBe("a".repeat(160));
  expect(description).toHaveLength(160);
});
