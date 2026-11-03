// Feed descriptions are often padded with blank paragraphs (" ") and lines
// that start or end on a <br>. In the job letter those render as tall empty
// gaps, so drop them before rendering. Words are never changed.

type LexicalJson = Record<string, unknown>;

const BLANK = /^\s*$/u;

function isRecord(value: unknown): value is LexicalJson {
  return value !== null && typeof value === "object";
}

function isBlankInline(node: unknown): boolean {
  if (!isRecord(node)) {
    return false;
  }
  if (node.type === "linebreak") {
    return true;
  }
  return node.type === "text" && typeof node.text === "string"
    ? BLANK.test(node.text)
    : false;
}

function trimEdges(children: unknown[]): unknown[] {
  let start = 0;
  let end = children.length;
  while (start < end && isBlankInline(children[start])) {
    start += 1;
  }
  while (end > start && isBlankInline(children[end - 1])) {
    end -= 1;
  }
  return children.slice(start, end);
}

/** Returns a copy of a Lexical editor state without blank paragraphs or edge line breaks. */
export function dropBlankParagraphs<T>(state: T): T {
  if (!(isRecord(state) && isRecord(state.root))) {
    return state;
  }
  const { children } = state.root;
  if (!Array.isArray(children)) {
    return state;
  }

  const kept = children.flatMap((child: unknown) => {
    if (!(isRecord(child) && child.type === "paragraph")) {
      return [child];
    }
    const inline = Array.isArray(child.children) ? child.children : [];
    const trimmed = trimEdges(inline);
    if (trimmed.length === 0) {
      return [];
    }
    return trimmed.length === inline.length
      ? [child]
      : [{ ...child, children: trimmed }];
  });

  return {
    ...state,
    root: { ...state.root, children: kept },
  } as T;
}
