import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface PayloadCallViolation {
  call: string;
  file: string;
  line: number;
}

const CALL_PATTERN =
  /\b(?:payload|req\.payload)\.(findByID|findVersionByID|findGlobalVersions|findVersions|findGlobal|find|count|create|updateGlobal|update|delete|duplicate|jobs\.queue|jobs\.runByID|jobs\.run|jobs\.cancel)\s*\(/y;

const TRAILING_CALL = /\s*\($/;

interface CodeFrame {
  braces: number;
  kind: "code";
  template: boolean;
}

type Frame =
  | CodeFrame
  | { kind: "line" }
  | { kind: "block" }
  | { kind: "single" }
  | { kind: "double" }
  | { kind: "template" };

interface Cursor {
  checked: number;
  index: number;
  line: number;
  violations: PayloadCallViolation[];
}

function charAt(source: string, index: number): string {
  return source[index] ?? "";
}

function pushDelimiter(stack: Frame[], char: string, next: string): number {
  if (char === "/" && next === "/") {
    stack.push({ kind: "line" });
    return 2;
  }
  if (char === "/" && next === "*") {
    stack.push({ kind: "block" });
    return 2;
  }
  if (char === "'") {
    stack.push({ kind: "single" });
    return 1;
  }
  if (char === '"') {
    stack.push({ kind: "double" });
    return 1;
  }
  if (char === "`") {
    stack.push({ kind: "template" });
    return 1;
  }
  return 0;
}

function closeBrace(stack: Frame[], frame: CodeFrame): void {
  if (frame.template && frame.braces === 0) {
    stack.pop();
    return;
  }
  frame.braces -= 1;
}

function skipLine(stack: Frame[], char: string): number {
  if (char === "\n") {
    stack.pop();
  }
  return 1;
}

function skipBlock(stack: Frame[], char: string, next: string): number {
  if (char === "*" && next === "/") {
    stack.pop();
    return 2;
  }
  return 1;
}

function skipQuoted(stack: Frame[], char: string, quote: "'" | '"'): number {
  if (char === "\\") {
    return 2;
  }
  if (char === quote) {
    stack.pop();
  }
  return 1;
}

function skipTemplate(stack: Frame[], char: string, next: string): number {
  if (char === "\\") {
    return 2;
  }
  if (char === "`") {
    stack.pop();
    return 1;
  }
  if (char === "$" && next === "{") {
    stack.push({ braces: 0, kind: "code", template: true });
    return 2;
  }
  return 1;
}

function skipNonCode(
  frame: Frame,
  stack: Frame[],
  char: string,
  next: string
): number {
  if (frame.kind === "line") {
    return skipLine(stack, char);
  }
  if (frame.kind === "block") {
    return skipBlock(stack, char, next);
  }
  if (frame.kind === "single") {
    return skipQuoted(stack, char, "'");
  }
  if (frame.kind === "double") {
    return skipQuoted(stack, char, '"');
  }
  if (frame.kind === "template") {
    return skipTemplate(stack, char, next);
  }
  return 1;
}

function stepCallCode(
  source: string,
  index: number,
  stack: Frame[],
  frame: CodeFrame
): { advance: number; parenDelta: number } {
  const opened = pushDelimiter(
    stack,
    charAt(source, index),
    charAt(source, index + 1)
  );
  if (opened > 0) {
    return { advance: opened, parenDelta: 0 };
  }
  const char = charAt(source, index);
  if (char === "{") {
    frame.braces += 1;
    return { advance: 1, parenDelta: 0 };
  }
  if (char === "}") {
    closeBrace(stack, frame);
    return { advance: 1, parenDelta: 0 };
  }
  if (char === "(") {
    return { advance: 1, parenDelta: 1 };
  }
  if (char === ")") {
    return { advance: 1, parenDelta: -1 };
  }
  return { advance: 1, parenDelta: 0 };
}

function readCallEnd(source: string, openParen: number): number {
  const stack: Frame[] = [{ braces: 0, kind: "code", template: false }];
  let parens = 1;
  let index = openParen + 1;

  while (index < source.length) {
    const frame = stack.at(-1);
    if (!frame) {
      break;
    }
    if (frame.kind !== "code") {
      index += skipNonCode(
        frame,
        stack,
        charAt(source, index),
        charAt(source, index + 1)
      );
      continue;
    }
    const step = stepCallCode(source, index, stack, frame);
    if (step.parenDelta < 0) {
      parens -= 1;
      if (parens === 0) {
        return index;
      }
    } else {
      parens += step.parenDelta;
    }
    index += step.advance;
  }

  return source.length - 1;
}

function newlineCount(value: string): number {
  let count = 0;
  for (const char of value) {
    if (char === "\n") {
      count += 1;
    }
  }
  return count;
}

function matchCall(source: string, file: string, cursor: Cursor): boolean {
  CALL_PATTERN.lastIndex = cursor.index;
  const match = CALL_PATTERN.exec(source);
  if (match?.index !== cursor.index) {
    return false;
  }

  const openParen = cursor.index + match[0].length - 1;
  const end = readCallEnd(source, openParen);
  const args = source.slice(openParen + 1, end);
  cursor.checked += 1;
  if (!args.includes("overrideAccess")) {
    cursor.violations.push({
      call: match[0].replace(TRAILING_CALL, ""),
      file,
      line: cursor.line,
    });
  }
  cursor.line += newlineCount(source.slice(cursor.index, end + 1));
  cursor.index = end + 1;
  return true;
}

function scanCode(
  source: string,
  file: string,
  stack: Frame[],
  frame: CodeFrame,
  cursor: Cursor
): void {
  const char = charAt(source, cursor.index);
  const next = charAt(source, cursor.index + 1);
  const opened = pushDelimiter(stack, char, next);
  if (opened > 0) {
    cursor.index += opened;
    return;
  }
  if (char === "{") {
    frame.braces += 1;
    cursor.index += 1;
    return;
  }
  if (char === "}") {
    closeBrace(stack, frame);
    cursor.index += 1;
    return;
  }
  if ((char === "p" || char === "r") && matchCall(source, file, cursor)) {
    return;
  }
  if (char === "\n") {
    cursor.line += 1;
  }
  cursor.index += 1;
}

function inspectPayloadCalls(
  source: string,
  file: string
): { checked: number; violations: PayloadCallViolation[] } {
  const cursor: Cursor = {
    checked: 0,
    index: 0,
    line: 1,
    violations: [],
  };
  const stack: Frame[] = [{ braces: 0, kind: "code", template: false }];

  while (cursor.index < source.length) {
    const frame = stack.at(-1);
    if (!frame) {
      break;
    }
    if (frame.kind !== "code") {
      const char = charAt(source, cursor.index);
      const skip = skipNonCode(
        frame,
        stack,
        char,
        charAt(source, cursor.index + 1)
      );
      if (char === "\n") {
        cursor.line += 1;
      }
      cursor.index += skip;
      continue;
    }
    scanCode(source, file, stack, frame, cursor);
  }

  return { checked: cursor.checked, violations: cursor.violations };
}

export function findViolations(
  source: string,
  file: string
): PayloadCallViolation[] {
  return inspectPayloadCalls(source, file).violations;
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "migrations") {
        continue;
      }
      files.push(...walk(full));
      continue;
    }
    if (entry.name === "payload-types.ts") {
      continue;
    }
    if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

function main(): number {
  const files = walk(path.resolve("src"));
  const violations: PayloadCallViolation[] = [];
  let checked = 0;

  for (const file of files) {
    const relative = path.relative(process.cwd(), file);
    const result = inspectPayloadCalls(readFileSync(file, "utf8"), relative);
    checked += result.checked;
    violations.push(...result.violations);
  }

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(`${violation.file}:${violation.line} ${violation.call}`);
    }
    return 1;
  }

  console.log(`lint:payload: ok (${checked} calls checked)`);
  return 0;
}

const [, entry] = process.argv;
if (entry && import.meta.url === pathToFileURL(path.resolve(entry)).href) {
  process.exitCode = main();
}
