import { expect, test } from "vitest";

import { textToLexical } from "@/lib/bordfeed/html-to-lexical";

import { bulletLinesToLists } from "./bullet-lists";

interface Node {
  children?: Node[];
  listType?: string;
  text?: string;
  type: string;
}

function rootChildren(state: unknown): Node[] {
  return (state as { root: { children: Node[] } }).root.children;
}

function texts(node: Node): string {
  return (node.children ?? [])
    .map((child) => child.text ?? (child.type === "linebreak" ? "\n" : ""))
    .join("");
}

test("turns a run of dash lines after a label into a bullet list", () => {
  const state = bulletLinesToLists(
    textToLexical("Required Skills:\n- Godot engine\n- Gdscript\n- C#")
  );
  const [label, list] = rootChildren(state);

  expect(label?.type).toBe("paragraph");
  expect(texts(label as Node)).toBe("Required Skills:");
  expect(list?.type).toBe("list");
  expect(list?.listType).toBe("bullet");
  expect(list?.children?.map(texts)).toEqual([
    "Godot engine",
    "Gdscript",
    "C#",
  ]);
});

test("merges one-bullet paragraphs into a single list", () => {
  const state = bulletLinesToLists(textToLexical("• One\n\n• Two\n\n• Three"));
  const children = rootChildren(state);

  expect(children).toHaveLength(1);
  expect(children[0]?.children?.map(texts)).toEqual(["One", "Two", "Three"]);
});

test("numbered lines become an ordered list", () => {
  const [list] = rootChildren(
    bulletLinesToLists(textToLexical("1. Apply\n2. Talk"))
  );

  expect(list?.listType).toBe("number");
  expect(list?.children?.map(texts)).toEqual(["Apply", "Talk"]);
});

test("leaves prose and hyphenated words alone", () => {
  const input = textToLexical(
    "A well-paid role.\nNo dashes - here at the start."
  );

  expect(bulletLinesToLists(input)).toEqual(input);
});

test("passes through values that are not editor states", () => {
  expect(bulletLinesToLists(null)).toBeNull();
  expect(bulletLinesToLists({ foo: 1 })).toEqual({ foo: 1 });
});
