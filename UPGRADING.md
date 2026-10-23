# Upgrading

## From 0.1.x (Airtable)

There is no in-place upgrade. 1.0 is a new app: Payload 4 and Postgres, not Airtable.

Stay on the [legacy-airtable branch](https://github.com/craftled/bordful/tree/legacy-airtable), or deploy 1.0 fresh and re-enter jobs. The Deploy button in the [README](README.md) starts a new project. It does not attach to an Airtable base.

## Within 1.x

Read [Changelog](CHANGELOG.md) before you merge. Breaking notes are listed there.

Add the upstream remote once:

```bash
git remote add upstream https://github.com/craftled/bordful.git
git fetch upstream
```

### First upgrade of a Deploy button project

The Deploy button creates a new Git repository and pushes the source files into it. That repository has its own initial commit. It does not share history with `craftled/bordful`, so a plain `git merge upstream/v1` stops with "refusing to merge unrelated histories".

For that first merge:

```bash
git merge upstream/v1 --allow-unrelated-histories
```

Unchanged files merge cleanly. Resolve any conflicts, then commit. After that commit the histories are related, and later upgrades use a plain merge:

```bash
git merge upstream/v1
bun install
bun run check
```

Later releases merge `upstream/main` instead of `upstream/v1`.

If you have not deployed yet and you plan to pull upgrades, fork `craftled/bordful` and import that fork in Vercel. A fork shares history, so the first merge does not need `--allow-unrelated-histories`.

Then deploy. Migrations run on deploy.

The admin update notice links here. It appears when GitHub has a newer release than the version this board is running.

## Self-hosting

Keep `PAYLOAD_SECRET` stable across upgrades. It signs admin sessions, and the Bordfeed API key is encrypted with it. A new secret forces you to reconnect Bordfeed. See [Bordfeed](docs/bordfeed.md).
