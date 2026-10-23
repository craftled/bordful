import { expect, test } from "vitest";

import { htmlToLexical } from "./html-to-lexical";

const text = (value: string, format = 0) => ({
  detail: 0,
  format,
  mode: "normal",
  style: "",
  text: value,
  type: "text",
  version: 1,
});

const paragraph = (children: ReturnType<typeof text>[]) => ({
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  type: "paragraph",
  version: 1,
});

test("htmlToLexical keeps marked text and drops script contents", () => {
  expect(
    htmlToLexical(
      "<p>Hello <strong>world</strong></p><ul><li>One</li></ul><script>x()</script>"
    )
  ).toEqual({
    root: {
      children: [
        paragraph([text("Hello "), text("world", 1)]),
        {
          children: [
            {
              children: [paragraph([text("One")])],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "listitem",
              value: 1,
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          listType: "bullet",
          start: 1,
          tag: "ul",
          type: "list",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
  expect(
    JSON.stringify(htmlToLexical("<p>Hello</p><script>x()</script>"))
  ).not.toContain("x()");
});

test("unsafe links keep their text and lose the href", () => {
  const lexical = htmlToLexical('<a href="javascript:x">y</a>');
  expect(JSON.stringify(lexical)).not.toContain('"type":"link"');
  expect(JSON.stringify(lexical)).toContain("y");
});
