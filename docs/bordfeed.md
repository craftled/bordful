# Bordfeed

A new board starts in sample mode. Connecting Bordfeed replaces those sample jobs with jobs from your Bordfeed feed.

## Sample mode

On first boot, Bordful loads up to 20 jobs from the template in `board.defaultTemplateId` (default `engineering-it`). The daily cron at 06:00 UTC refreshes them. See [Deploy](deploy.md).

Sample jobs use origin `bordfeed_sample`. They are `noindex`. They are left out of the sitemap, the RSS and JSON feeds, and JobPosting JSON-LD. They are never included in alert emails.

The footer shows a "Jobs by Bordfeed" link while the board is in sample mode. You can hide that credit only when the connection state is `connected`.

## Connect in the admin

Open `/admin`. The Connect Bordfeed card asks for:

1. Your email and the board name.
2. The 6-digit code Bordfeed emails you.
3. A workspace, when that email belongs to several Bordfeed workspaces. Pick one. Bordful registers again with that workspace.

If the code was already used, Bordfeed does not return the API key again. The card tells you to paste the key from your Bordfeed dashboard instead.

"Already have a Bordfeed API key?" opens the paste-key path. A wrong key is not stored. After a valid key, Bordful creates the feed and runs the first sync.

Bordfeed allows 5 signups per hour from one IP address. Shared hosts can hit that limit. Paste an API key, or try again in an hour.

The API key is stored encrypted with `PAYLOAD_SECRET`. It is hidden from every API read and it is never shown again. The admin shows a hint (`bf_...` plus the last 4 characters). Rotating `PAYLOAD_SECRET` makes the stored key unreadable, so you reconnect.

The first sync removes the sample jobs. Later syncs are described below.

## CLI

From the repo:

```bash
bun run bordful connect --email owner@example.com --board-name "Example Board"
bun run bordful sample
bun run bordful sync
bun run bordful status
```

`connect` uses the same email, code, and workspace steps as the admin. `utm_medium` is `cli` instead of `admin`. `sample` returns the board to sample jobs. `sync` runs a sync now. `status` prints the state, the key hint, the feed id, and the last sync. It never prints the API key.

`BORDFEED_API_KEY` is an optional default for `bun run bordful connect --key`.

The CLI process cannot refresh the Next.js cache. The board updates within 5 minutes.

## What Bordful sends

Register (`POST /api/agent/register`) sends:

| Field | Value |
| --- | --- |
| `email` | The address you entered |
| `agent_name` | `bordful` |
| `board_name` | Site name, or the CLI board name, trimmed to 100 characters |
| `ref` | `bordful` |
| `utm_source` | `bordful` |
| `utm_medium` | `admin` or `cli` |
| `utm_campaign` | `connect` |
| `install_id` | SHA-256 hex of the random install id stored for this board |
| `template_id` | The connection template id |
| `workspace` | Only when you picked a workspace |

Every Bordfeed call also sends `X-Bordfeed-Client: bordful/<version>` (this release: `bordful/1.0.0-beta.1`).

To turn off the header and `install_id`, set `telemetry.clientHeader` to `false` in `bordful.config.ts`. `ref` and the `utm_*` fields stay.

The footer credit URL is `https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=credit&utm_campaign=board`.

## Daily sync

`/api/cron/bordfeed` runs at 06:00 UTC. Jobs that disappeared from the feed are unpublished, not deleted. A later sync can publish them again if Bordfeed still lists them. Sample jobs are replaced when you connect, not unpublished one by one.
