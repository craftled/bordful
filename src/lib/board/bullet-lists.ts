// Job descriptions from feeds often arrive as plain text with "- item" lines
// (or HTML paragraphs of them) instead of real lists. This turns each run of
// such lines into a Lexical list, so the job page can style it as a list.

type LexicalJson = Record<string, unknown>;

const BULLET = /^\s*(?:[-*•–]|(?<number>\d{1,3})[.)])\s+/u;

interface Line {
  marker: RegExpMatchArray | null;
  nodes: LexicalJson[];
}

function isRecord(value: unknown): value is LexicalJson {
  return value !== null && typeof value === "object";
}

function childrenOf(node: LexicalJson): LexicalJson[] | null {
  const { children } = node;
  return Array.isArray(children) ? children.filter(isRecord) : null;
}

function splitLines(children: LexicalJson[]): Line[] {
  const lines: Line[] = [];
  let current: LexicalJson[] = [];

  const flush = () => {
    const [first] = current;
    const marker =
      first?.type === "text" && typeof first.text === "string"
        ? first.text.match(BULLET)
        : null;
    lines.push({ marker, nodes: current });
    current = [];
  };

  for (const child of children) {
    if (child.type === "linebreak") {
      flush();
    } else {
      current.push(child);
    }
  }
  flush();

  return lines.filter((line) => line.nodes.length > 0);
}

function stripMarker(line: Line): LexicalJson[] {
  const [first, ...rest] = line.nodes;
  if (!(first && line.marker)) {
    return line.nodes;
  }

  const text = String(first.text).slice(line.marker[0].length);
  return text.length > 0 ? [{ ...first, text }, ...rest] : rest;
}

function joinLines(lines: Line[]): LexicalJson[] {
  return lines.flatMap((line, index) =>
    index === 0
      ? line.nodes
      : [{ type: "linebreak", version: 1 } as LexicalJson, ...line.nodes]
  );
}

function block(type: string, children: LexicalJson[]): LexicalJson {
  return {
    children,
    direction: "ltr",
    format: "",
    indent: 0,
    type,
    version: 1,
  };
}

function list(lines: Line[]): LexicalJson {
  const numbered = lines[0]?.marker?.groups?.number !== undefined;
  return {
    ...block(
      "list",
      lines.map((line, index) => ({
        ...block("listitem", stripMarker(line)),
        value: index + 1,
      }))
    ),
    listType: numbered ? "number" : "bullet",
    start: 1,
    tag: numbered ? "ol" : "ul",
  };
}

function convertParagraph(node: LexicalJson): LexicalJson[] {
  const children = childrenOf(node);
  if (!children) {
    return [node];
  }

  const lines = splitLines(children);
  if (!lines.some((line) => line.marker)) {
    return [node];
  }

  const out: LexicalJson[] = [];
  let run: Line[] = [];
  let bullets = false;

  const flush = () => {
    if (run.length > 0) {
      out.push(bullets ? list(run) : { ...node, children: joinLines(run) });
    }
    run = [];
  };

  for (const line of lines) {
    const isBullet = line.marker !== null;
    if (isBullet !== bullets) {
      flush();
      bullets = isBullet;
    }
    run.push(line);
  }
  flush();

  return out;
}

function mergeLists(nodes: LexicalJson[]): LexicalJson[] {
  const out: LexicalJson[] = [];

  for (const node of nodes) {
    const previous = out.at(-1);
    if (
      previous?.type === "list" &&
      node.type === "list" &&
      previous.listType === node.listType &&
      previous.converted === true &&
      node.converted === true
    ) {
      const items = [
        ...(childrenOf(previous) ?? []),
        ...(childrenOf(node) ?? []),
      ];
      out[out.length - 1] = {
        ...previous,
        children: items.map((item, index) => ({ ...item, value: index + 1 })),
      };
    } else {
      out.push(node);
    }
  }

  return out.map((node) => {
    if (node.converted !== true) {
      return node;
    }
    const { converted: _converted, ...rest } = node;
    return rest;
  });
}

/** Returns a copy of a Lexical editor state with "- item" line runs as lists. */
export function bulletLinesToLists<T>(state: T): T {
  if (!(isRecord(state) && isRecord(state.root))) {
    return state;
  }

  const children = childrenOf(state.root);
  if (!children) {
    return state;
  }

  const converted = children.flatMap((child) =>
    child.type === "paragraph"
      ? convertParagraph(child).map((node) =>
          node.type === "list" ? { ...node, converted: true } : node
        )
      : [child]
  );

  return {
    ...state,
    root: { ...state.root, children: mergeLists(converted) },
  } as T;
}
