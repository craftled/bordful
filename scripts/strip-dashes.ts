import { readFileSync, writeFileSync } from "node:fs";

// Generated comments pad the dash with spaces. Swallow that padding so the
// replacement reads as a comma, not a double-spaced ", ".
export function stripDashes(source: string): string {
  return source.replaceAll(/[^\S\n]*[\u2014\u2013][^\S\n]*/g, ", ");
}

const invokedDirectly = process.argv[1]?.includes("strip-dashes.ts") === true;

if (invokedDirectly) {
  const [, , file] = process.argv;

  if (!file) {
    process.stderr.write("usage: bun scripts/strip-dashes.ts <file>\n");
    process.exit(1);
  }

  writeFileSync(file, stripDashes(readFileSync(file, "utf8")));
}
