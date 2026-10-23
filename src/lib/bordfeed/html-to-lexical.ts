import { type DefaultTreeAdapterMap, parseFragment } from "parse5";

type ChildNode = DefaultTreeAdapterMap["childNode"];
type ElementNode = DefaultTreeAdapterMap["element"];
type TextNode = DefaultTreeAdapterMap["textNode"];

interface Marks {
  bold: boolean;
  code: boolean;
  italic: boolean;
  strike: boolean;
  underline: boolean;
}

export interface LexicalText {
  detail: 0;
  format: number;
  mode: "normal";
  style: "";
  text: string;
  type: "text";
  version: 1;
}

export interface LexicalLinebreak {
  type: "linebreak";
  version: 1;
}

export interface LexicalElement {
  children: LexicalNode[];
  direction: "ltr";
  fields?: {
    linkType: "custom";
    newTab: boolean;
    url: string;
  };
  format: "";
  indent: 0;
  listType?: "bullet" | "number";
  start?: number;
  tag?: string;
  type: string;
  value?: number;
  version: 1;
}

export type LexicalNode = LexicalElement | LexicalLinebreak | LexicalText;

export interface LexicalRoot {
  root: {
    children: LexicalNode[];
    direction: "ltr";
    format: "";
    indent: 0;
    type: "root";
    version: 1;
  };
}

const SKIP_TAGS = new Set(["script", "style"]);
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const BLANK_LINES = /\n{2,}/;
const WHITESPACE = /\s+/g;
const DROP_TAGS = new Set(["iframe", "img"]);
const BLOCK_TAGS = new Set([
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ol",
  "p",
  "ul",
]);

const EMPTY_MARKS: Marks = {
  bold: false,
  code: false,
  italic: false,
  strike: false,
  underline: false,
};

function isElement(node: ChildNode): node is ElementNode {
  return "tagName" in node;
}

function isText(node: ChildNode): node is TextNode {
  return node.nodeName === "#text";
}

function formatBits(marks: Marks): number {
  return (
    (marks.bold ? 1 : 0) +
    (marks.italic ? 2 : 0) +
    (marks.strike ? 4 : 0) +
    (marks.underline ? 8 : 0) +
    (marks.code ? 16 : 0)
  );
}

function textNode(text: string, marks: Marks = EMPTY_MARKS): LexicalText {
  return {
    detail: 0,
    format: formatBits(marks),
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

function linebreak(): LexicalLinebreak {
  return { type: "linebreak", version: 1 };
}

function element(
  type: string,
  children: LexicalNode[],
  extra: Partial<LexicalElement> = {}
): LexicalElement {
  return {
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    type,
    version: 1,
    ...extra,
  };
}

function paragraph(children: LexicalNode[]): LexicalElement {
  return element("paragraph", children);
}

function root(children: LexicalNode[]): LexicalRoot {
  const blocks = children.length > 0 ? children : [paragraph([textNode("")])];
  return {
    root: {
      children: blocks,
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

function attr(elementNode: ElementNode, name: string): string | null {
  const found = elementNode.attrs.find((item) => item.name === name);
  return found?.value ?? null;
}

function safeHref(raw: string): string | null {
  try {
    const parsed = new URL(raw);
    if (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:" ||
      parsed.protocol === "mailto:"
    ) {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

function headingTag(tagName: string): "h2" | "h3" | "h4" {
  if (tagName === "h3") {
    return "h3";
  }

  if (tagName === "h4" || tagName === "h5" || tagName === "h6") {
    return "h4";
  }

  return "h2";
}

function withMark(marks: Marks, patch: Partial<Marks>): Marks {
  return { ...marks, ...patch };
}

function collectInlines(nodes: ChildNode[], marks: Marks): LexicalNode[] {
  const out: LexicalNode[] = [];

  for (const node of nodes) {
    if (isText(node)) {
      if (node.value.length > 0) {
        out.push(textNode(node.value, marks));
      }
      continue;
    }

    if (!isElement(node) || SKIP_TAGS.has(node.tagName)) {
      continue;
    }

    out.push(...convertInline(node, marks));
  }

  return out;
}

function convertInline(node: ElementNode, marks: Marks): LexicalNode[] {
  if (node.tagName === "br") {
    return [linebreak()];
  }

  if (node.tagName === "strong" || node.tagName === "b") {
    return collectInlines(node.childNodes, withMark(marks, { bold: true }));
  }

  if (node.tagName === "em" || node.tagName === "i") {
    return collectInlines(node.childNodes, withMark(marks, { italic: true }));
  }

  if (node.tagName === "u") {
    return collectInlines(
      node.childNodes,
      withMark(marks, { underline: true })
    );
  }

  if (
    node.tagName === "s" ||
    node.tagName === "strike" ||
    node.tagName === "del"
  ) {
    return collectInlines(node.childNodes, withMark(marks, { strike: true }));
  }

  if (node.tagName === "code") {
    return collectInlines(node.childNodes, withMark(marks, { code: true }));
  }

  if (node.tagName === "a") {
    const children = collectInlines(node.childNodes, marks);
    const href = safeHref(attr(node, "href") ?? "");
    if (!(href && children.length > 0)) {
      return children;
    }

    return [
      element("link", children, {
        fields: {
          linkType: "custom",
          newTab: attr(node, "target") === "_blank",
          url: href,
        },
      }),
    ];
  }

  if (BLOCK_TAGS.has(node.tagName)) {
    return collectInlines(node.childNodes, marks);
  }

  return collectInlines(node.childNodes, marks);
}

function hasVisible(nodes: LexicalNode[]): boolean {
  return nodes.some((node) => {
    if (node.type === "text" && "text" in node) {
      return node.text.trim().length > 0;
    }

    if (node.type === "linebreak") {
      return true;
    }

    if ("children" in node) {
      return hasVisible(node.children);
    }

    return false;
  });
}

function inlineParagraph(nodes: ChildNode[]): LexicalElement | null {
  const inlines = collectInlines(nodes, EMPTY_MARKS);
  return hasVisible(inlines) ? paragraph(inlines) : null;
}

function convertList(node: ElementNode): LexicalElement | null {
  const items = node.childNodes.filter(
    (child): child is ElementNode => isElement(child) && child.tagName === "li"
  );
  if (items.length === 0) {
    return null;
  }

  const tag = node.tagName === "ol" ? "ol" : "ul";
  return element(
    "list",
    items.map((item, index) => convertListItem(item, index + 1)),
    {
      listType: tag === "ol" ? "number" : "bullet",
      start: 1,
      tag,
    }
  );
}

function convertListItem(node: ElementNode, value: number): LexicalElement {
  const children: LexicalNode[] = [];
  const inline: ChildNode[] = [];

  const flush = () => {
    if (inline.length === 0) {
      return;
    }

    const block = inlineParagraph(inline);
    if (block) {
      children.push(block);
    }
    inline.length = 0;
  };

  for (const child of node.childNodes) {
    if (
      isElement(child) &&
      (child.tagName === "ul" || child.tagName === "ol")
    ) {
      flush();
      children.push(...convertBlocks([child]));
      continue;
    }

    if (
      isElement(child) &&
      BLOCK_TAGS.has(child.tagName) &&
      child.tagName !== "p"
    ) {
      flush();
      children.push(...convertBlocks([child]));
      continue;
    }

    inline.push(child);
  }

  flush();
  return element("listitem", children.length > 0 ? children : [paragraph([])], {
    value,
  });
}

function headingBlock(node: ElementNode): LexicalNode[] {
  const inlines = collectInlines(node.childNodes, EMPTY_MARKS);
  return hasVisible(inlines)
    ? [element("heading", inlines, { tag: headingTag(node.tagName) })]
    : [];
}

function quoteBlock(node: ElementNode): LexicalNode[] {
  const blocks = convertBlocks(node.childNodes);
  const fallback = inlineParagraph(node.childNodes);
  let children: LexicalNode[] = [];
  if (blocks.length > 0) {
    children = blocks;
  } else if (fallback) {
    children = [fallback];
  }

  return children.length > 0 ? [element("quote", children)] : [];
}

function convertBlock(node: ElementNode): LexicalNode[] {
  if (SKIP_TAGS.has(node.tagName)) {
    return [];
  }

  if (DROP_TAGS.has(node.tagName)) {
    return convertBlocks(node.childNodes);
  }

  if (node.tagName === "p") {
    const block = inlineParagraph(node.childNodes);
    return block ? [block] : [];
  }

  if (HEADING_TAGS.has(node.tagName)) {
    return headingBlock(node);
  }

  if (node.tagName === "ul" || node.tagName === "ol") {
    const list = convertList(node);
    return list ? [list] : [];
  }

  if (node.tagName === "blockquote") {
    return quoteBlock(node);
  }

  if (node.tagName === "li") {
    return [convertListItem(node, 1)];
  }

  return convertBlocks(node.childNodes);
}

function convertBlocks(nodes: ChildNode[]): LexicalNode[] {
  const out: LexicalNode[] = [];

  for (const node of nodes) {
    if (isText(node)) {
      const trimmed = node.value.replaceAll(WHITESPACE, " ").trim();
      if (trimmed.length > 0) {
        out.push(paragraph([textNode(trimmed)]));
      }
      continue;
    }

    if (isElement(node)) {
      out.push(...convertBlock(node));
    }
  }

  return out;
}

export function htmlToLexical(html: string): LexicalRoot {
  const fragment = parseFragment(html);
  return root(convertBlocks(fragment.childNodes));
}

export function textToLexical(text: string): LexicalRoot {
  const normalized = text.replaceAll("\r\n", "\n");
  if (normalized.length === 0) {
    return root([paragraph([textNode("")])]);
  }

  const blocks = normalized.split(BLANK_LINES).map((block) => {
    const lines = block.split("\n");
    const children: LexicalNode[] = [];

    for (const [index, line] of lines.entries()) {
      if (index > 0) {
        children.push(linebreak());
      }

      if (line.length > 0) {
        children.push(textNode(line));
      }
    }

    return paragraph(children.length > 0 ? children : [textNode("")]);
  });

  return root(blocks);
}
