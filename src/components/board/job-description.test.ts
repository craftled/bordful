import { expect, test } from "vitest";

import { dropBlankParagraphs } from "./job-description";

const text = (value: string) => ({ text: value, type: "text" });
const br = { type: "linebreak" };
const paragraph = (...children: unknown[]) => ({ children, type: "paragraph" });
const state = (...children: unknown[]) => ({
  root: { children, type: "root" },
});

test("drops paragraphs that hold only spaces or line breaks", () => {
  const result = dropBlankParagraphs(
    state(
      paragraph(text("Intro")),
      paragraph(text(" ")),
      paragraph(br),
      paragraph(),
      paragraph(text("Outro"))
    )
  );

  expect(result.root.children).toEqual([
    paragraph(text("Intro")),
    paragraph(text("Outro")),
  ]);
});

test("trims leading and trailing line breaks but keeps inner ones", () => {
  const result = dropBlankParagraphs(
    state(paragraph(text(" "), br, text("One"), br, text("Two"), br))
  );

  expect(result.root.children).toEqual([
    paragraph(text("One"), br, text("Two")),
  ]);
});

test("leaves lists and unknown input alone", () => {
  const list = { children: [], type: "list" };
  expect(dropBlankParagraphs(state(list)).root.children).toEqual([list]);
  expect(dropBlankParagraphs(null)).toBeNull();
});
