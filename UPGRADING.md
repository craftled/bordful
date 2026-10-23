# Upgrading

## From 0.1.x (Airtable)

There is no in-place upgrade. 1.0 is a new app: Payload 4 and Postgres, not Airtable.

Stay on the [legacy-airtable branch](https://github.com/craftled/bordful/tree/legacy-airtable), or deploy 1.0 fresh and re-enter jobs. The Deploy button in the [README](README.md) starts a new project. It does not attach to an Airtable base.

## Within 1.x

Add the upstream remote once:

```bash
git remote add upstream https://github.com/craftled/bordful.git
git fetch upstream
git merge upstream/v1
bun install
bun run check
```

Later releases merge `upstream/main` instead of `upstream/v1`.

Then deploy. Migrations run on deploy. Read [Changelog](CHANGELOG.md) before you merge. Breaking notes are listed there.

The admin update notice links here. It appears when GitHub has a newer release than the version this board is running.

## Self-hosting

Keep `PAYLOAD_SECRET` stable across upgrades. It signs admin sessions, and the Bordfeed API key is encrypted with it. A new secret forces you to reconnect Bordfeed. See [Bordfeed](docs/bordfeed.md).
