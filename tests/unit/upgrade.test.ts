import { execFileSync } from "node:child_process";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";

import {
  report,
  type UpgradeResult,
  type UpgradeStatus,
  upgrade,
} from "../../scripts/upgrade";

const BASE_FILES = {
  "bordful.config.ts": "export default { name: 'Bordful' };\n",
  "package.json": '{ "name": "bordful", "dependencies": {} }\n',
  "src/core.ts": "export const core = 1;\n",
  "src/custom/index.ts": "export const customSlots = {};\n",
};

const temporary: string[] = [];
let globalConfigDir: string;
const originalGlobalConfig = process.env.GIT_CONFIG_GLOBAL;
const originalNoSystem = process.env.GIT_CONFIG_NOSYSTEM;

beforeAll(() => {
  globalConfigDir = mkdtempSync(path.join(tmpdir(), "bordful-git-config-"));
  process.env.GIT_CONFIG_GLOBAL = path.join(globalConfigDir, "config");
  process.env.GIT_CONFIG_NOSYSTEM = "1";
  writeFileSync(process.env.GIT_CONFIG_GLOBAL, "");
});

afterAll(() => {
  rmSync(globalConfigDir, { force: true, recursive: true });
  if (originalGlobalConfig === undefined) {
    delete process.env.GIT_CONFIG_GLOBAL;
  } else {
    process.env.GIT_CONFIG_GLOBAL = originalGlobalConfig;
  }
  if (originalNoSystem === undefined) {
    delete process.env.GIT_CONFIG_NOSYSTEM;
  } else {
    process.env.GIT_CONFIG_NOSYSTEM = originalNoSystem;
  }
});

afterEach(() => {
  for (const dir of temporary.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
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

test("keeps the base record commit after aborting a first-upgrade conflict", () => {
  const { base, board, upstream } = deployButtonProject();
  commit(board, "my core", { "src/core.ts": "export const core = 'mine';\n" });
  const originalHead = git(board, "rev-parse", "HEAD");
  const originalTree = git(board, "rev-parse", "HEAD^{tree}");
  const originalFile = read(board, "src/core.ts");
  commit(upstream, "fix core", { "src/core.ts": "export const core = 2;\n" });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("conflicts");
  expect(outcome.recordedBase).toBe(base);
  expect(git(board, "rev-parse", "HEAD")).not.toBe(originalHead);
  expect(git(board, "rev-parse", "HEAD^1")).toBe(originalHead);
  git(board, "merge", "--abort");
  expect(read(board, "src/core.ts")).toBe(originalFile);
  expect(git(board, "rev-parse", "HEAD^{tree}")).toBe(originalTree);
  expect(git(board, "log", "-1", "--format=%s")).toContain(
    "Record upstream base"
  );
  expect(git(board, "rev-parse", "HEAD^1")).toBe(originalHead);

  const next = upgrade({ cwd: board });

  expect(next.status).toBe("conflicts");
  expect(next.recordedBase).toBeNull();
  git(board, "merge", "--abort");
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

test("staged-only changes count as dirty", () => {
  const { board, upstream } = deployButtonProject();
  commit(upstream, "fix core", { "src/core.ts": "export const core = 2;\n" });
  const head = git(board, "rev-parse", "HEAD");
  write(board, { "src/core.ts": "export const core = 'staged';\n" });
  git(board, "add", "src/core.ts");

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("dirty");
  expect(git(board, "rev-parse", "HEAD")).toBe(head);
  expect(git(board, "remote")).toBe("");
});

test("refuses a detached HEAD without changing HEAD or adding a remote", () => {
  const { board, upstream } = deployButtonProject();
  git(board, "checkout", "--detach", "-q");
  const head = git(board, "rev-parse", "HEAD");

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("detached");
  expect(git(board, "rev-parse", "HEAD")).toBe(head);
  expect(git(board, "remote")).toBe("");
});

test("refuses a paused rebase without changing HEAD or adding a remote", () => {
  const board = repo();
  commit(board, "initial", { "src/core.ts": "export const core = 1;\n" });
  commit(board, "first", { "src/core.ts": "export const core = 2;\n" });
  commit(board, "second", { "src/core.ts": "export const core = 3;\n" });
  expect(() => git(board, "rebase", "--exec", "false", "HEAD~1")).toThrow();
  const head = git(board, "rev-parse", "HEAD");

  const outcome = upgrade({ cwd: board, upstreamUrl: "/unused" });

  expect(outcome.status).toBe("operation-in-progress");
  expect(git(board, "rev-parse", "HEAD")).toBe(head);
  expect(git(board, "remote")).toBe("");
  git(board, "rebase", "--abort");
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
  expect(read(board, "src/core.ts")).toBe(
    "export const core = 'edited before first commit';\n"
  );
});

test("keeps an existing upstream remote", () => {
  const { board, upstream } = deployButtonProject();
  git(board, "remote", "add", "upstream", upstream);
  commit(upstream, "fix core", { "src/core.ts": "export const core = 2;\n" });

  const outcome = upgrade({ cwd: board, upstreamUrl: "/nonexistent" });

  expect(outcome.status).toBe("merged");
  expect(git(board, "remote", "get-url", "upstream")).toBe(upstream);
});

test("never pushes to origin", () => {
  const { board, upstream } = deployButtonProject();
  const originDir = mkdtempSync(path.join(tmpdir(), "bordful-origin-"));
  temporary.push(originDir);
  const origin = path.join(originDir, "origin.git");
  git(originDir, "init", "--bare", "-q", origin);
  git(board, "remote", "add", "origin", origin);
  git(board, "push", "-q", "origin", "HEAD:main");
  commit(upstream, "fix core", { "src/core.ts": "export const core = 2;\n" });
  const before = git(board, "ls-remote", "origin");

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("merged");
  expect(git(board, "ls-remote", "origin")).toBe(before);
});

test("reports an untracked-file collision as a merge failure and keeps the file", () => {
  const { board, upstream } = deployButtonProject();
  write(board, { "src/new.ts": "owner's untracked file\n" });
  commit(upstream, "add new file", { "src/new.ts": "upstream file\n" });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("merge-failed");
  expect(outcome.mergeError).toContain("would be overwritten by merge");
  expect(read(board, "src/new.ts")).toBe("owner's untracked file\n");
  expect(() => git(board, "rev-parse", "--verify", "MERGE_HEAD")).toThrow();
  expect(report(outcome)).toContain(
    "The merge did not start. Your files are unchanged. Fix the error above and run this again."
  );
  expect(report(outcome)).toContain(
    "The base record commit stays and changes no files."
  );
});

test("does not overwrite an ignored local file tracked upstream", () => {
  const upstream = repo();
  commit(upstream, "release", BASE_FILES);
  const board = mkdtempSync(path.join(tmpdir(), "bordful-upgrade-"));
  temporary.push(board);
  git(board, "clone", "-q", upstream, ".");
  git(board, "config", "user.name", "Test");
  git(board, "config", "user.email", "test@example.com");
  git(board, "config", "commit.gpgsign", "false");
  const ignoredFiles = path.join(board, ".git", "info", "exclude");
  writeFileSync(ignoredFiles, `${readFileSync(ignoredFiles, "utf8")}.env\n`);
  const localContents = Buffer.from("LOCAL_TEST_CONFIG=owner-value\n");
  writeFileSync(path.join(board, ".env"), localContents);
  commit(upstream, "track local config path", {
    ".env": "UPSTREAM_TEST_CONFIG=upstream-value\n",
  });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("merge-failed");
  expect(outcome.mergeError).toContain("untracked working tree files");
  expect(readFileSync(path.join(board, ".env"))).toEqual(localContents);
  expect(() => git(board, "rev-parse", "--verify", "MERGE_HEAD")).toThrow();
});

test("protects ignored files before recording the first upstream base", () => {
  const { board, upstream } = deployButtonProject();
  const ignoredFiles = path.join(board, ".git", "info", "exclude");
  writeFileSync(ignoredFiles, `${readFileSync(ignoredFiles, "utf8")}.env\n`);
  const localContents = Buffer.from("LOCAL_TEST_CONFIG=owner-value\n");
  writeFileSync(path.join(board, ".env"), localContents);
  commit(upstream, "track local config path", {
    ".env": "UPSTREAM_TEST_CONFIG=upstream-value\n",
  });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("merge-failed");
  expect(outcome.recordedBase).toBeNull();
  expect(outcome.mergeError).toContain("ignored working tree files");
  expect(readFileSync(path.join(board, ".env"))).toEqual(localContents);
  expect(git(board, "log", "-1", "--format=%s")).toBe("Initial commit");
  expect(() => git(board, "rev-parse", "--verify", "MERGE_HEAD")).toThrow();
});

test("reports a hook-rejected merge as open and gives recovery steps", () => {
  const upstream = repo();
  commit(upstream, "release", BASE_FILES);
  const board = mkdtempSync(path.join(tmpdir(), "bordful-upgrade-"));
  temporary.push(board);
  git(board, "clone", "-q", upstream, ".");
  git(board, "config", "user.name", "Test");
  git(board, "config", "user.email", "test@example.com");
  git(board, "config", "commit.gpgsign", "false");
  commit(board, "board customization", {
    "bordful.config.ts": "export default { name: 'Mine' };\n",
  });
  commit(upstream, "upstream update", {
    "src/core.ts": "export const core = 2;\n",
  });
  const hook = path.join(board, ".git", "hooks", "pre-merge-commit");
  writeFileSync(hook, "#!/bin/sh\nexit 1\n");
  chmodSync(hook, 0o755);

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("merge-failed");
  expect(outcome.mergeOpen).toBe(true);
  expect(read(board, "src/core.ts")).toBe("export const core = 2;\n");
  expect(git(board, "rev-parse", "--verify", "MERGE_HEAD")).not.toBe("");
  expect(report(outcome)).toContain(
    "Review the merged files, then run `git commit`, or run `git merge --abort` to put them back."
  );
  expect(report(outcome)).not.toContain(
    "The merge did not start. Your files are unchanged. Fix the error above and run this again."
  );
  git(board, "merge", "--abort");
});

test("prints non-ASCII conflict paths without quoting", () => {
  const { board, upstream } = deployButtonProject();
  commit(board, "my file", { "src/é.ts": "export const value = 'mine';\n" });
  commit(upstream, "upstream file", {
    "src/é.ts": "export const value = 'upstream';\n",
  });

  const outcome = upgrade({ cwd: board, upstreamUrl: upstream });

  expect(outcome.status).toBe("conflicts");
  expect(outcome.conflicts).toEqual(["src/é.ts"]);
  git(board, "merge", "--abort");
});

test("the bootstrap script imports only node built-ins", () => {
  const source = readFileSync(
    path.join(process.cwd(), "scripts/upgrade.ts"),
    "utf8"
  );
  const specifiers = [
    ...source.matchAll(/\b(?:from\s*|import\s*)["'](?<specifier>[^"']+)["']/gu),
  ].map((match) => match.groups?.specifier ?? "");

  expect(specifiers.length).toBeGreaterThan(0);
  expect(specifiers.every((specifier) => specifier.startsWith("node:"))).toBe(
    true
  );
});

test("report has a message for every upgrade status", () => {
  const statuses: UpgradeStatus[] = [
    "base-not-found",
    "conflicts",
    "detached",
    "dirty",
    "merge-in-progress",
    "merge-failed",
    "merged",
    "not-a-repo",
    "operation-in-progress",
    "up-to-date",
  ];

  for (const status of statuses) {
    const outcome: UpgradeResult = {
      commits: 1,
      conflicts: ["src/core.ts"],
      dependenciesChanged: false,
      mergeError: "Git rejected the merge.",
      recordedBase: "abc123",
      status,
    };
    expect(report(outcome).join("\n"), status).not.toBe("");
  }
});

test("reports a folder that is not a Git repository", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "bordful-upgrade-"));
  temporary.push(dir);

  expect(upgrade({ cwd: dir }).status).toBe("not-a-repo");
});
