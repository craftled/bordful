# Upgrading

## From 0.1.x (Airtable)

There is no in-place upgrade. 1.0 is a new app: Payload 4 and Postgres, not Airtable.

Stay on the [airtable branch](https://github.com/craftled/bordful/tree/airtable), or deploy 1.0 fresh and re-enter jobs. The Deploy button in the [README](README.md) starts a new project. It does not attach to an Airtable base.

## Within 1.x

Read [Changelog](CHANGELOG.md) before you merge. Breaking notes are listed there.

1.0 requires Node.js 26 LTS. `engines.node` is `26.x`, which overrides the Node.js version in your Vercel project settings, so the next deploy runs on Node 26. Built-in fetch then uses HTTP/2. Set the Vercel environment variable `VERCEL_FETCH_DISABLE_H2=1` to keep HTTP/1.1.

Add the upstream remote once:

```bash
git remote add upstream https://github.com/craftled/bordful.git
git fetch upstream
```

### First upgrade of a Deploy button project

The Deploy button creates a new Git repository and pushes the source files into it. That repository has its own initial commit. It does not share history with `craftled/bordful`, so a plain `git merge upstream/main` stops with "refusing to merge unrelated histories".

Do not start with `--allow-unrelated-histories`. That merge has no common ancestor. Only files that are identical on both sides merge cleanly. Every other file, including files you never edited, shows up as a whole-file add/add conflict. Keeping your side drops upstream fixes. Taking the upstream side drops your edits.

Record the upstream commit your root tree came from, then merge normally. These steps expect one root commit (the Deploy button commit) with your later commits on top. The first command only records the shared base. It does not change your files. The second command brings in upstream changes. A file only one side changed merges cleanly. Git conflicts only where both sides edited the same lines.

```bash
init=$(git rev-list --max-parents=0 HEAD)
base=$(for c in $(git rev-list upstream/main); do [ "$(git rev-parse "$c^{tree}")" = "$(git rev-parse "$init^{tree}")" ] && echo "$c" && break; done)
if [ -n "$base" ]; then
  git merge -s ours --allow-unrelated-histories -m "Record upstream base" "$base"
  git merge upstream/main
else
  echo "No upstream commit matches your initial tree. Every file upstream changed will show as a whole-file conflict."
  git merge upstream/main --allow-unrelated-histories
fi
```

If `base` is empty, resolve the whole-file conflicts by hand. For a file outside your customization points (admin settings, `bordful.config.ts`, `src/custom/**`), take the upstream copy. In this merge, `theirs` is upstream, and the command replaces the whole file:

```bash
git checkout --theirs -- path/to/file
git add path/to/file
```

Use that only for files you did not edit. For a file you did edit, combine the two copies yourself, then `git add` it.

If Git stops with conflicts, resolve them, run the install and check below, then `git commit`. If the merge already committed, run the same commands and commit again only if they change files:

```bash
bun install
bun run check
```

After this first upgrade the histories are related. Later upgrades are a plain merge:

```bash
git merge upstream/main
bun install
bun run check
```

Releases ship on `main`. The pre-release 1.0 commits are on `main` too, so the base search above also finds a Deploy button project created before 1.0.0.

If you have not deployed yet and you plan to pull upgrades, fork `craftled/bordful` and import that fork in Vercel. A fork shares history, so the first merge does not need the base step above.

Then deploy. Migrations run on deploy.

The admin update notice links here. It appears when GitHub has a newer release than the version this board is running.

## Self-hosting

Keep `PAYLOAD_SECRET` stable across upgrades. It signs admin sessions, and the Bordfeed API key is encrypted with it. A new secret forces you to reconnect Bordfeed. See [Bordfeed](docs/bordfeed.md).
