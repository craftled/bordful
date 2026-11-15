// Pulls the latest Bordful release into this board: `bun run bordful:upgrade`.
// Self-contained on purpose (Node built-ins and git only), so a board created
// before this script existed can run the copy on upstream main. See UPGRADING.md.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const UPSTREAM_URL = "https://github.com/craftled/bordful.git";

const REMOTE = "upstream";
const BRANCH = "main";
const TARGET = `${REMOTE}/${BRANCH}`;
const DEPENDENCY_FILES = ["package.json", "bun.lock"];

export type UpgradeStatus =
  | "base-not-found"
  | "conflicts"
  | "detached"
  | "dirty"
  | "merge-in-progress"
  | "merge-failed"
  | "merged"
  | "not-a-repo"
  | "operation-in-progress"
  | "up-to-date";

export interface UpgradeResult {
  /** Upstream commits this run brought in, or would have. */
  commits: number;
  /** Files Git could not merge. Set when status is "conflicts". */
  conflicts: string[];
  /** True when the merge changed package.json or bun.lock. */
  dependenciesChanged: boolean;
  /** Git's error output when a merge could not start. */
  mergeError?: string;
  /** Upstream commit recorded as the shared base, for a Deploy button project. */
  recordedBase: string | null;
  status: UpgradeStatus;
}

export interface UpgradeOptions {
  cwd: string;
  log?: (line: string) => void;
  /** Used only when the `upstream` remote does not exist yet. */
  upstreamUrl?: string;
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryGit(cwd: string, args: string[]): string | null {
  try {
    return git(cwd, args);
  } catch {
    return null;
  }
}

function lines(output: string): string[] {
  return output.split("\n").filter((line) => line.length > 0);
}

function result(
  status: UpgradeStatus,
  extra: Partial<UpgradeResult> = {}
): UpgradeResult {
  return {
    commits: 0,
    conflicts: [],
    dependenciesChanged: false,
    recordedBase: null,
    status,
    ...extra,
  };
}

/**
 * A Deploy button project starts from one commit whose files are a copy of
 * some upstream commit. Find that upstream commit by comparing trees.
 */
export function findUpstreamBase(cwd: string): string | null {
  const rootTrees = new Set(
    lines(git(cwd, ["rev-list", "--max-parents=0", "HEAD"])).map((root) =>
      git(cwd, ["rev-parse", `${root}^{tree}`])
    )
  );

  for (const entry of lines(git(cwd, ["log", "--format=%H %T", TARGET]))) {
    const [commit, tree] = entry.split(" ");
    if (commit && tree && rootTrees.has(tree)) {
      return commit;
    }
  }

  return null;
}

function hasOperationInProgress(root: string): boolean {
  return [
    "rebase-merge",
    "rebase-apply",
    "CHERRY_PICK_HEAD",
    "REVERT_HEAD",
  ].some((name) => {
    const gitPath = tryGit(root, ["rev-parse", "--git-path", name]);
    return gitPath !== null && existsSync(resolve(root, gitPath));
  });
}

function preflightStatus(root: string): UpgradeStatus | null {
  if (tryGit(root, ["rev-parse", "-q", "--verify", "MERGE_HEAD"]) !== null) {
    return "merge-in-progress";
  }
  if (hasOperationInProgress(root)) {
    return "operation-in-progress";
  }
  if (tryGit(root, ["symbolic-ref", "-q", "HEAD"]) === null) {
    return "detached";
  }
  if (git(root, ["status", "--porcelain", "--untracked-files=no"]) !== "") {
    return "dirty";
  }
  return null;
}

function recordUpstreamBase(root: string, log: (line: string) => void) {
  if (tryGit(root, ["merge-base", "HEAD", TARGET]) !== null) {
    return null;
  }

  const base = findUpstreamBase(root);
  if (base === null) {
    return false;
  }

  git(root, [
    "merge",
    "-s",
    "ours",
    "--allow-unrelated-histories",
    "-m",
    `Record upstream base ${base.slice(0, 7)}`,
    base,
  ]);
  log(`Recorded upstream commit ${base.slice(0, 7)} as the shared base.`);
  return base;
}

export function upgrade(options: UpgradeOptions): UpgradeResult {
  const log = options.log ?? (() => undefined);
  const root = tryGit(options.cwd, ["rev-parse", "--show-toplevel"]);
  if (root === null) {
    return result("not-a-repo");
  }

  const blocked = preflightStatus(root);
  if (blocked !== null) {
    return result(blocked);
  }

  if (tryGit(root, ["remote", "get-url", REMOTE]) === null) {
    const url = options.upstreamUrl ?? UPSTREAM_URL;
    git(root, ["remote", "add", REMOTE, url]);
    log(`Added the ${REMOTE} remote: ${url}`);
  }

  log(`Fetching ${TARGET}...`);
  git(root, [
    "fetch",
    "--quiet",
    REMOTE,
    `+refs/heads/${BRANCH}:refs/remotes/${TARGET}`,
  ]);

  if (tryGit(root, ["merge-base", "--is-ancestor", TARGET, "HEAD"]) !== null) {
    return result("up-to-date");
  }

  const recordedBase = recordUpstreamBase(root, log);
  if (recordedBase === false) {
    return result("base-not-found");
  }

  const commits = Number(git(root, ["rev-list", "--count", `HEAD..${TARGET}`]));
  const before = git(root, ["rev-parse", "HEAD"]);
  const branch = git(root, ["symbolic-ref", "--short", "-q", "HEAD"]);
  log(`Merging into ${branch}`);
  log(`Merging ${commits} upstream commit${commits === 1 ? "" : "s"}...`);

  try {
    git(root, ["merge", "--no-edit", "--no-stat", TARGET]);
  } catch (error) {
    const conflicts = lines(
      git(root, [
        "-c",
        "core.quotePath=false",
        "diff",
        "--name-only",
        "--diff-filter=U",
      ])
    );
    if (conflicts.length === 0) {
      const stderr =
        error instanceof Error &&
        "stderr" in error &&
        Buffer.isBuffer(error.stderr)
          ? error.stderr.toString("utf8").trim()
          : "";
      return result("merge-failed", {
        commits,
        mergeError:
          stderr || (error instanceof Error ? error.message : String(error)),
        recordedBase,
      });
    }

    return result("conflicts", { commits, conflicts, recordedBase });
  }

  const dependenciesChanged =
    git(root, [
      "diff",
      "--name-only",
      before,
      "HEAD",
      "--",
      ...DEPENDENCY_FILES,
    ]) !== "";

  return result("merged", { commits, dependenciesChanged, recordedBase });
}

const AFTER_MERGE = [
  "Next:",
  "  1. Read CHANGELOG.md for breaking notes.",
  "  2. bun run check",
  "  3. git push, then deploy. Migrations run on deploy.",
];

export function report(outcome: UpgradeResult): string[] {
  switch (outcome.status) {
    case "not-a-repo":
      return ["This folder is not a Git repository. Run this from your board."];
    case "merge-in-progress":
      return [
        "A merge is already in progress.",
        "Finish it with `git commit`, or cancel it with `git merge --abort`, then run this again.",
      ];
    case "operation-in-progress":
      return [
        "A rebase, cherry-pick, or revert is already in progress.",
        "Finish or cancel it, then run this again.",
      ];
    case "detached":
      return ["HEAD is detached. Switch to a branch, then run this again."];
    case "dirty":
      return [
        "You have uncommitted changes. Commit them first, then run this again.",
      ];
    case "up-to-date":
      return ["Already up to date with the latest Bordful."];
    case "base-not-found":
      return [
        "This project does not share history with Bordful, and none of its starting commits match an upstream commit.",
        "The command stopped without changing your files or commits. Follow the manual steps in UPGRADING.md.",
      ];
    case "merge-failed":
      return [
        outcome.mergeError ?? "Git could not start the merge.",
        "The merge did not start. Your files are unchanged. Fix the error above and run this again.",
        ...(outcome.recordedBase
          ? ["The base record commit stays and changes no files."]
          : []),
      ];
    case "conflicts":
      return [
        `Git could not merge ${outcome.conflicts.length} file${outcome.conflicts.length === 1 ? "" : "s"} that changed on both sides:`,
        ...outcome.conflicts.map((file) => `  ${file}`),
        "",
        "Fix each file, then:",
        "  git add <file>",
        "  bun install",
        "  bun run check",
        "  git commit",
        "",
        "To put your files back: git merge --abort",
        ...(outcome.recordedBase
          ? ["The base record commit stays and changes no files."]
          : []),
      ];
    case "merged":
      return [
        `Merged ${outcome.commits} upstream commit${outcome.commits === 1 ? "" : "s"}.`,
      ];
    default:
      return [];
  }
}

function main(): number {
  const outcome = upgrade({
    cwd: process.cwd(),
    log: (line) => console.log(line),
  });

  for (const line of report(outcome)) {
    console.log(line);
  }

  if (outcome.status !== "merged") {
    return outcome.status === "up-to-date" ? 0 : 1;
  }

  if (outcome.dependenciesChanged) {
    console.log("Dependencies changed. Running bun install...");
    const root =
      tryGit(process.cwd(), ["rev-parse", "--show-toplevel"]) ?? process.cwd();
    const bun = process.versions.bun ? process.execPath : "bun";
    const install = spawnSync(bun, ["install"], {
      cwd: root,
      stdio: "inherit",
    });
    if (install.status !== 0) {
      console.log(
        `bun install failed${install.error?.message ? `: ${install.error.message}` : ""}. Run it yourself before the check.`
      );
      return 1;
    }
  }

  for (const line of AFTER_MERGE) {
    console.log(line);
  }

  return 0;
}

if (import.meta.main) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
