import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function writeTinyPng(name = "e2e.png"): string {
  const filePath = path.join(tmpdir(), name);
  writeFileSync(filePath, Buffer.from(PNG_BASE64, "base64"));
  return filePath;
}
