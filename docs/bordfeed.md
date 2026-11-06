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

Every Bordfeed call also sends `X-Bordfeed-Client: bordful/<version>` (this release: `bordful/1.0.0`).

To turn off the header and `install_id`, set `telemetry.clientHeader` to `false` in `bordful.config.ts`. `ref` and the `utm_*` fields stay.

The footer credit URL is `https://bordfeed.com/?ref=bordful&utm_source=bordful&utm_medium=credit&utm_campaign=board`.

## Daily sync

`/api/cron/bordfeed` runs at 06:00 UTC. "Sync now" in the admin and `bun run bordful sync` run the same sync. Only one sync runs at a time. A sync that starts while another is running fetches nothing and says so.

- The first sync after you connect fetches one page of the newest jobs: `jobsPerSync` jobs, 50 by default. It does not page through the rest of the feed, and it does not unpublish jobs that are not in that page.
- Every later sync does two things:
  - **Checks the board's jobs.** It looks up the next 200 published Bordfeed jobs on the board by id (`GET /api/v1/jobs/{id}`) and unpublishes the ones Bordfeed no longer shows, whether they closed, expired, filled or were archived. Unpublished jobs are not deleted. The next sync goes on from where this one stopped and wraps to the start, so a board of up to 200 Bordfeed jobs is fully checked every sync. With the daily cron, a board of 1,000 Bordfeed jobs notices a closed job within 5 days, and a board of 2,000 within 10. Jobs past their own expiry date (`valid_through`) are also handled by the board's expire cron.
  - **Adds new jobs.** It reads jobs that first appeared in the feed since the last sync (`since_field=first_visible`) and adds them, up to `jobsPerSync`.
- A job already on the board is not fetched again when Bordfeed edits it. Bordfeed touches `updated_at` on routine scrapes, so asking for every updated job would refetch most of the feed each day.
- If more new jobs appeared than `jobsPerSync`, the next sync continues from where this one stopped. The `since` point moves forward only after all of them are read, so no new job is skipped. A sync adds at most `jobsPerSync` jobs, so on a busy feed raise `jobsPerSync` or run the sync more often (the `/api/cron/bordfeed` schedule in `vercel.json`, which some Vercel plans limit to once a day).
- A job that closes and later reopens keeps its first-appeared time, so it does not come back as a new job. It stays unpublished.
- Checks run one request at a time, about two a second, to stay inside Bordfeed's rate limit. A sync with 200 checks takes about 100 seconds, and checks stop after 120 seconds so the rest of the sync fits in the cron's time limit. A failed check never holds back new jobs.
- An unpublished job stays down unless Bordfeed sends it again, which later syncs rarely do, so the sync guards against a Bordfeed incident. If at least 10 jobs were checked and 80% or more came back gone (or at least 5 and all of them), it unpublishes nothing and the admin shows: "Bordfeed reported most of the checked jobs as gone, so the board kept them published for now." The same slice must come back that way on two later syncs, at least 12 hours apart. The board still keeps those jobs until `BORDFEED_ALLOW_MASS_UNPUBLISH=1`. With that set, one sync unpublishes at most 10 of the held jobs and leaves the rest for a later sync. Normal churn stays well under that line and is unpublished as usual, with no cap from this guard.
- A job whose lookup keeps failing with an unexpected answer is skipped, so it cannot stop later checks. New jobs are read for at most 210 seconds of the sync, so the board write still fits in the cron's time limit.
- Sample jobs are replaced when you connect, not unpublished one by one. A sample job you unpublish stays unpublished.

## Import blocklist

**Globals → Import blocklist** in the admin keeps Bordfeed jobs you don't want off the board. It has three lists, one entry per line. None of them are case-sensitive.

| List | Matches |
| --- | --- |
| Companies | The exact company name. |
| Domains | The company domain, the apply link and the source listing link. `example.com` also covers `jobs.example.com`. |
| Keywords | Whole words or phrases in the job title and summary. `java` does not match `JavaScript`. |

- A sync drops matching jobs before it creates their companies, so a blocked company gets no page. They count as skipped in the sync summary.
- Saving the blocklist unpublishes imported jobs on the board that match it. Jobs are unpublished, not deleted.
- A blocked job stays unpublished when Bordfeed sends it again.
- Removing an entry does not republish anything. A job comes back only if Bordfeed sends it again.
- Manual and paid jobs are never affected.
- Bordfeed still delivers blocked jobs, so they still use credits.

## Credits per sync

Bordfeed charges one credit for each job your workspace receives for the first time. A job it sends again, even after it changed or closed, is free, and an empty page is free. Checks are free too: Bordfeed answers a lookup of a job that is no longer active with a 404 before it charges anything, and the board only checks jobs it already received. If a check is ever billed (a job fetched under a different workspace), the sync counts the credit against its caps and stops checking for that run. On pay as you go one credit is $0.01, and a new account starts with 2,000 credits ($20).

Two caps bound what a sync can fetch, so a schedule can never drain the balance:

| Setting | Default | Range | What it caps |
| --- | --- | --- | --- |
| `jobsPerSync` | 50 | 20 to 100 | Jobs one sync fetches. The first sync is one page of this size; later syncs fetch at most this many new jobs. |
| `jobsPerDay` | 200 | 20 to 5000 | Jobs fetched per UTC day across every sync, cron and manual. At the cap a sync makes no request and the admin says so. |

Set the defaults in `bordful.config.ts` under `bordfeed.sync`. Config values outside the range are clamped. Admins can set either one for this board in the Bordfeed Connection global, which rejects values outside the range. A value there wins. Leave it empty to use the config value.

With the defaults, a sync uses at most 50 credits and a board uses at most 200 credits a day. The daily cron uses about one credit per new job, because jobs the board already has are not fetched again and closures are found by free checks. The caps count jobs fetched, so the credits used are never more than the cap and often fewer.

If the balance cannot cover a page, Bordfeed answers 402 and the admin shows: "This Bordfeed workspace does not have enough credits for this sync." The board keeps its jobs. Top up in Bordfeed, then sync again.
