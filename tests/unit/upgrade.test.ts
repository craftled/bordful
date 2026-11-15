import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";

import { upgrade } from "../../scripts/upgrade";

const BASE_FILES = {
  "bordful.config.ts": "export default { name: 'Bordful' };\n",
  "package.json": '{ "name": "bordful", "dependencies": {} }\n',
  "src/core.ts": "export const core = 1;\n",
  "src/custom/index.ts": "export const customSlots = {};\n",
};

const temporary: string[] = [];

afterEach(() => {
  for (const dir of temporary.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function write(cwd: string, files: Record<string, string>): void {
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    writeFileSync(path.join(cwd, file), content);
  }
}

function commit(cwd: string, message: string, files: Record<string, string>) {
  write(cwd, files);
  git(cwd, "add", "-A");
  git(cwd, "commit", "-q", "-m", message);
  return git(cwd, "rev-parse", "HEAD");
}

function repo(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "bordful-upgrade-"));
  temporary.push(dir);
  git(dir, "init", "-q", "-b", "main");
  git(dir, "config", "user.name", "Test");
  git(dir, "config", "user.email", "test@example.com");
  git(dir, "config", "commit.gpgsign", "false");
  return dir;
}

/** Upstream at one commit, plus a Deploy button copy of it with its own history. */
function deployButtonProject() {
  const upstream = repo();
  const base = commit(upstream, "release", BASE_FILES);
  const board = repo();
  commit(board, "Initial commit", BASE_FILES);
  return { base, board, upstream };
}

function read(cwd: string, file: string): string {
  return readFileSync(path.join(cwd, file), "utf8");
}

test("upgrades a Deploy button project and keeps the owner's edits", () => {
  const { base, board, upstream } = deployButtonProject();
  commit(board, "my slot", {
    "src/custom/index.ts": "export const customSlots = { header: 1 };\n",
  });
  commit(upstream, "fix core", {
    "package.json": '{ "name": "bordful", "dependencies": { "a": "1" } }\n',
    "src/core.ts": "export const core = 2;\n",
    "src/new.ts": "export const added = true;\n",
  });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome).toEqual({
    commits: 1,
    conflicts: [],
    dependenciesChanged: true,
    recordedBase: base,
    status: "merged",
  });
  expect(read(board, "src/core.ts")).toBe("export const core = 2;\n");
  expect(read(board, "src/new.ts")).toBe("export const added = true;\n");
  expect(read(board, "src/custom/index.ts")).toContain("header: 1");
  expect(git(board, "status", "--porcelain")).toBe("");
});

test("a second run is a plain merge, then reports up to date", () => {
  const { board, upstream } = deployButtonProject();
  commit(upstream, "one", { "src/core.ts": "export const core = 2;\n" });
  upgrade({ cwd: board, upstreamUrl: upstream });
  commit(upstream, "two", { "src/core.ts": "export const core = 3;\n" });

  const second = upgrade({ cwd: board });

  expect(second.status).toBe("merged");
  expect(second.recordedBase).toBeNull();
  expect(second.dependenciesChanged).toBe(false);
  expect(read(board, "src/core.ts")).toBe("export const core = 3;\n");
  expect(upgrade({ cwd: board }).status).toBe("up-to-date");
});

test("finds the base when it is not the first upstream commit", () => {
  const upstream = repo();
  commit(upstream, "older", { "src/old.ts": "export const old = 1;\n" });
  const base = commit(upstream, "release", BASE_FILES);
  const board = repo();
  commit(board, "Initial commit", {
    ...BASE_FILES,
    "src/old.ts": "export const old = 1;\n",
  });
  commit(upstream, "later", { "src/core.ts": "export const core = 2;\n" });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("merged");
  expect(outcome.recordedBase).toBe(base);
});

test("merges a fork that already shares history", () => {
  const upstream = repo();
  commit(upstream, "release", BASE_FILES);
  const board = mkdtempSync(path.join(tmpdir(), "bordful-upgrade-"));
  temporary.push(board);
  git(board, "clone", "-q", upstream, ".");
  git(board, "config", "user.name", "Test");
  git(board, "config", "user.email", "test@example.com");
  git(board, "config", "commit.gpgsign", "false");
  commit(board, "my config", {
    "bordful.config.ts": "export default { name: 'Mine' };\n",
  });
  commit(upstream, "fix core", { "src/core.ts": "export const core = 2;\n" });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("merged");
  expect(outcome.recordedBase).toBeNull();
  expect(read(board, "bordful.config.ts")).toContain("Mine");
  expect(read(board, "src/core.ts")).toBe("export const core = 2;\n");
});

test("lists the files that conflict and leaves the merge open", () => {
  const { board, upstream } = deployButtonProject();
  commit(board, "my core", { "src/core.ts": "export const core = 'mine';\n" });
  commit(upstream, "fix core", { "src/core.ts": "export const core = 2;\n" });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("conflicts");
  expect(outcome.conflicts).toEqual(["src/core.ts"]);
  expect(upgrade({ cwd: board }).status).toBe("merge-in-progress");
  git(board, "merge", "--abort");
  expect(read(board, "src/core.ts")).toBe("export const core = 'mine';\n");
});

test("refuses to run with uncommitted changes", () => {
  const { board, upstream } = deployButtonProject();
  commit(upstream, "fix core", { "src/core.ts": "export const core = 2;\n" });
  const head = git(board, "rev-parse", "HEAD");
  write(board, { "src/core.ts": "export const core = 'wip';\n" });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("dirty");
  expect(git(board, "rev-parse", "HEAD")).toBe(head);
  expect(git(board, "remote")).toBe("");
});

test("changes nothing when no upstream commit matches the starting tree", () => {
  const upstream = repo();
  commit(upstream, "release", BASE_FILES);
  const board = repo();
  const head = commit(board, "Initial commit", {
    ...BASE_FILES,
    "src/core.ts": "export const core = 'edited before first commit';\n",
  });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("base-not-found");
  expect(git(board, "rev-parse", "HEAD")).toBe(head);
});

test("keeps an existing upstream remote", () => {
  const { board, upstream } = deployButtonProject();
  git(board, "remote", "add", "upstream", upstream);
  commit(upstream, "fix core", { "src/core.ts": "export const core = 2;\n" });

  const outcome = upgrade({ cwd: board, upstreamUrl: "/nonexistent" });

  expect(outcome.status).toBe("merged");
  expect(git(board, "remote", "get-url", "upstream")).toBe(upstream);
});

test("reports a folder that is not a Git repository", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bordful-upgrade-"));
  temporary.push(dir);

  expect(upgrade({ cwd: dir }).status).toBe("not-a-repo");
});
