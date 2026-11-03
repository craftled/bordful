# Bordfeed

A new board starts in sample mode. Connecting Bordfeed replaces those sample jobs with jobs from your Bordfeed feed.

## Sample mode

On first boot, Bordful loads up to 20 jobs from the template in `board.defaultTemplateId` (default `fully-remote`). That template id is stored on first boot, so a board that upgrades keeps its earlier template. The daily cron at 06:00 UTC refreshes them. See [Deploy](deploy.md).

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

The feed Bordful creates uses your site name from Site settings. If the site still has the default name "Job Board", the feed takes the template name, for example "Fully Remote". It keeps the template filters.

A new Bordfeed account shows 0 credits until its first feed read, which adds the free starting credit (2,000 jobs on pay as you go). If Bordfeed answers with a credits or payment error, the admin card says so, and the sample jobs stay on the board until a sync succeeds.

The first successful sync removes the sample jobs. If the feed comes back empty, the samples stay, so the board is never blank. Later syncs are described below.

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

`/api/cron/bordfeed` runs at 06:00 UTC. "Sync now" in the admin and `bun run bordful sync` run the same sync. Only one sync runs at a time. A sync that starts while another is running fetches nothing and says so.

- The first sync after you connect fetches one page of the newest jobs: `jobsPerSync` jobs, 50 by default. It does not page through the rest of the feed, and it does not unpublish jobs that are not in that page.
- Every later sync asks Bordfeed only for what changed since the last sync. It reads jobs Bordfeed closed (`status=closed`) and jobs that expired (`status=expired`) since then (`since_field=updated`) and unpublishes them. Then it reads jobs that first appeared in the feed since then (`since_field=first_visible`) and adds them. Closed and expired jobs are unpublished, not deleted.
- A job already on the board is not fetched again when Bordfeed edits it. Bordfeed touches `updated_at` on routine scrapes, so asking for every updated job would refetch most of the feed each day.
- A sync stops once it has fetched `jobsPerSync` jobs. If more changed, the next sync continues from the cursor where this one stopped. The `since` point moves forward only after all three lists are read, so no closure, expiry or new job is skipped.
- Sample jobs are replaced when you connect, not unpublished one by one.

## Credits per sync

Bordfeed charges one credit for each job your workspace receives for the first time. A job it sends again, even after it changed or closed, is free, and an empty page is free. On pay as you go one credit is $0.01, and a new account starts with 2,000 credits ($20).

Two caps bound what a sync can fetch, so a schedule can never drain the balance:

| Setting | Default | Range | What it caps |
| --- | --- | --- | --- |
| `jobsPerSync` | 50 | 20 to 100 | Jobs one sync fetches, across its open, closed and expired requests. The first sync is one page of this size. |
| `jobsPerDay` | 200 | 20 to 5000 | Jobs fetched per UTC day across every sync, cron and manual. At the cap a sync makes no request and the admin says so. |

Set the defaults in `bordful.config.ts` under `bordfeed.sync`. Config values outside the range are clamped. Admins can set either one for this board in the Bordfeed Connection global, which rejects values outside the range. A value there wins. Leave it empty to use the config value.

With the defaults, a sync uses at most 50 credits and a board uses at most 200 credits a day. The daily cron uses about one credit per new job, because jobs the board already has are not fetched again. The caps count jobs fetched, so the credits used are never more than the cap and often fewer.

If the balance cannot cover a page, Bordfeed answers 402 and the admin shows: "This Bordfeed workspace does not have enough credits for this sync." The board keeps its jobs. Top up in Bordfeed, then sync again.
