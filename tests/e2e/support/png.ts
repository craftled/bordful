import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export function writeTinyPng(name = "e2e.png"): string {
  // mkdtemp makes a fresh 0700 directory, so no other user can pre-create
  // or swap the file at a predictable path in the shared temp dir.
  const directory = mkdtempSync(path.join(tmpdir(), "bordful-e2e-"));
  const filePath = path.join(directory, path.basename(name));
  writeFileSync(filePath, Buffer.from(PNG_BASE64, "base64"), { mode: 0o600 });
  return filePath;
}
