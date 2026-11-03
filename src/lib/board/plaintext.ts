import type { RichText } from "@payloadcms/richtext-lexical/react";
import type { ComponentProps } from "react";

const WHITESPACE_RE = /\s+/g;
const BLOCK_TYPES = new Set(["heading", "listitem", "paragraph"]);

type EditorState = ComponentProps<typeof RichText>["data"];

function lexicalRoot(value: unknown): unknown {
  if (value !== null && typeof value === "object" && "root" in value) {
    const { root } = value as { root?: unknown };
    if (root !== undefined) {
      return root;
    }
  }

  return value;
}

function walk(node: unknown, parts: string[]): void {
  if (typeof node === "string") {
    parts.push(node);
    return;
  }
  if (node === null || typeof node !== "object") {
    return;
  }

  const record = node as { children?: unknown; text?: unknown; type?: unknown };
  if (typeof record.text === "string") {
    parts.push(record.text);
  }
  if (record.type === "linebreak") {
    parts.push(" ");
  }

  const isBlock =
    typeof record.type === "string" && BLOCK_TYPES.has(record.type);
  if (isBlock && parts.length > 0) {
    parts.push(" ");
  }

  if (!Array.isArray(record.children)) {
    return;
  }

  for (const child of record.children) {
    walk(child, parts);
  }
}

export function plainTextFromLexical(value: unknown): string {
  const parts: string[] = [];
  walk(lexicalRoot(value), parts);
  return parts.join("").replace(WHITESPACE_RE, " ").trim();
}

export function metaDescription(value: unknown): string {
  return plainTextFromLexical(value).slice(0, 160);
}

export function editorState(value: unknown): EditorState | null {
  if (value === null || typeof value !== "object" || !("root" in value)) {
    return null;
  }

  const { root } = value;
  if (root === null || typeof root !== "object") {
    return null;
  }

  return value as EditorState;
}
