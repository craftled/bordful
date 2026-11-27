# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-03

The `v1.0.0` tag was cut on 3 November. Changes merged to `main` since then are listed here too. A project created with the Deploy button gets them, because the button clones `main`.

### Added

- Job board with search, filters, and taxonomy archives.
- Job and company pages with JobPosting JSON-LD.
- RSS 2.0, JSON Feed, sitemap, and robots.
- Sample jobs from a Bordfeed template on first deploy.
- Connect Bordfeed in the admin, or with `bun run bordful connect`.
- Post a Job through a Stripe payment link, with admin publish and automatic expiry.
- Email job alerts via Resend, with double opt-in (weekly default, daily option).
- Theme colors, fonts, radius, and logo in admin settings.
- Update notice in the admin. Upgrade steps are in [UPGRADING.md](UPGRADING.md).
- `bun run bordful:upgrade` merges the latest `main` from craftled/bordful into a board, including the first upgrade of a Deploy button project. See [UPGRADING.md](UPGRADING.md#upgrade-command).
- Nonce-based CSP and security headers.
- Deploy to Vercel button that provisions Neon Postgres and Vercel Blob.
- Import blocklist in the admin: Bordfeed jobs from listed companies or domains, or with listed keywords, are not imported. Saving it unpublishes matching imported jobs. See [docs/bordfeed.md](docs/bordfeed.md#import-blocklist).
- Restoring an older job version in the admin creates a draft. Publish it to make the restored version live.
- Company logos from [Logo.dev](https://logo.dev). Set `NEXT_PUBLIC_LOGO_DEV_TOKEN` to a publishable key, and companies with no uploaded logo and no logo URL show their logo by domain, or by the company website if no domain is stored. The footer then credits Logo.dev. See [docs/deploy.md](docs/deploy.md#environment-variables).
- Light and dark themes. The board follows the visitor's system setting, and a header toggle switches between system, light and dark and remembers the choice. See [docs/theming.md](docs/theming.md).
- Board search also matches location, remote region, summary and skills.
- On Vercel, alert signup is checked by Vercel BotID. See [docs/alerts.md](docs/alerts.md).
- `bun run bordful reset-password` gets you back into the admin after a lost password, with no email setup. It first shows the database it would change as `host:port/database` and runs only after you confirm it with `--database-host`. The admin's "Forgot password?" page now shows this command instead of a form that never sent an email. See [docs/deploy.md](docs/deploy.md#admin-sign-in).
- bordful.com docs for AI agents. `/llms.txt` lists every docs page, each docs page has a markdown version at its URL plus `.md` (`/docs.md` for the overview), and docs URLs return markdown when a request sends `Accept: text/markdown`. Every page links to `/llms.txt`. A board with marketing off is unchanged.
- bordful.com marketing pages, pricing and the board index pages have markdown versions at their URL plus `.md` (`/index.md` for the home page) and on `Accept: text/markdown`, and are listed in `/llms.txt`. `/llms-full.txt` has every docs page in one file. Docs pages have Copy as Markdown and Open in ChatGPT or Claude. A board with marketing off is unchanged.

### Changed

- graphql 17.1.0. Payload still declares graphql ^16.8.1, but Bordful disables GraphQL, and the board, admin, CLI and integration tests run clean on 17.
- Disconnecting Bordfeed deletes every imported job instead of turning them into drafts, and the confirm step says how many. A reconnect imports only the newest `jobsPerSync` jobs, so drafts used to pile up in the admin and never came back. Companies are kept. Disconnect waits while a sync is running.
- Taxonomy archives (type, level, location, language) with fewer than 3 indexable jobs are marked `noindex` and left out of the sitemap. They still render for visitors. Sample jobs do not count.
- Publishing a job with a past Valid through now shows an error in the admin. It used to save, stay hidden, and go back to draft at the next expire run. Setting a past date on a live job still ends the listing.
- Digest emails say how to change alert filters.
- Alert confirmation and digest emails use the board's name, logo, button color and radius from Site settings, and the confirm email has a button.
- A Bordfeed incident, where most checked jobs are reported gone, now needs two later syncs at least 12 hours apart to see the same jobs, and unpublishes at most 10 of them per sync, and only with `BORDFEED_ALLOW_MASS_UNPUBLISH=1`. See [docs/bordfeed.md](docs/bordfeed.md#daily-sync).
- The admin sign-in cookie is `Secure` with `SameSite=Lax`.
- The sitemap lists `/post` and `/alerts` when they are enabled, and the taxonomy archives with at least 3 indexable jobs. `/jobs` has a description, Open Graph and Twitter tags, and links to the RSS and JSON feeds.
- Rebuilt on Payload 4 (4.0.0-beta.12, with Lexical 0.53) and Postgres. beta.7 and later include Payload security fixes, and beta.12 adds more.
- Marketing screenshots are WebP instead of PNG, 2.5 MB down to about 1.1 MB. The social share image stays PNG.
- `pg` is a direct dependency, pinned to the version `@payloadcms/db-postgres` uses, because the install check imports it.
- Bun 1.4.5 for installs, scripts and CI (was 1.4.2). It includes Bun's TLS, HTTP and DNS security fixes.
- Requires Node.js 26.13.1 or later (26 LTS). `engines.node` is `^26.13.1`, which overrides the Vercel project Node.js setting. Built-in fetch on Vercel uses HTTP/2 on Node 26. Set the Vercel environment variable `VERCEL_FETCH_DISABLE_H2=1` to keep HTTP/1.1.

### Fixed

- No more `SECURITY WARNING` about SSL modes in the logs. A `DATABASE_URL` with `sslmode=require` (what Neon gives you), `prefer` or `verify-ca` is now passed to Postgres as `sslmode=verify-full`. That is how pg already treated it, and it stays that way when pg 9 makes `require` mean something weaker.
- Board links to `/jobs/search` no longer prefetch. Each prefetch ran a search query, and behind a firewall bot challenge it failed with a 429 in the console. Clicking a search link works as before.
- The `/jobs.md` markdown had an empty heading when the board title was blank. It now uses "Latest jobs", like the page. It also no longer leaves a blank paragraph for an empty description, and the company, location and type in job rows are spaced. Docs markdown no longer has a double blank line after the llms.txt note.
- Docs now match the code on the Bordfeed board name rule, `NEXT_PUBLIC_SERVER_URL` fallbacks, the CLI options and exit codes, connect and alert limits, the digest size, and the sitemap rule.
- The FAQ answer "How do I update a fork?" told readers to pull code and run migrations by hand. It now points at `bun run bordful:upgrade` and says migrations run on deploy.
- `csp.extraConnectOrigins` and `csp.extraScriptOrigins` in `bordful.config.ts` are now sent in the `Content-Security-Policy` header. They were validated but never applied. A bad origin now stops the build with `Invalid bordful.config.ts` instead of failing later. A plain `<script src>` tag is still blocked in current browsers, so load third-party scripts with `next/script`; see [docs/configuration.md](docs/configuration.md).
- The Bordfeed connect card no longer keeps an old success message over a newer server state. If the board moved on after an action, for example to an error after the API key was revoked, the card now shows that error.
- Board previews retry the job description after `/feed.json` returns an error. A single failed response used to leave every preview without an excerpt until the page was reloaded.
- The admin update notice skips GitHub prereleases, so a board on a stable version is never pointed at a beta. A board already on a prerelease still sees newer ones.
- The Bordfeed client no longer repeats a POST (register, verify, create feed) after a 5xx response, which could create a second feed or spend the emailed code. Reads still retry, and every method still retries a 429.
- Job descriptions from Bordfeed are parsed with parse5 8.1.1, which fixes crashes and very slow parsing on some malformed HTML.
- Connecting Bordfeed with an account that uses two-factor sign-in now says an emailed code cannot create an API key and opens the paste-key path. It used to say "Bordfeed rejected the API key." Disabled accounts and closed sign-ups get their own messages too.
- Board search no longer queries Postgres for each search string. Summary and skills are matched against a cached index that is read at most once every 5 minutes, and the job list reads only the fields its cards show. Bots sending many different searches used to run one database query per request and could use up a hosted database's monthly transfer allowance.
- Digest unsubscribe links keep working after `PAYLOAD_SECRET` or a subscriber's email changes. Each digest now stores the current hash before it is sent, and a digest is not sent if that fails.
- One-click unsubscribe answers 404 for an unknown token instead of reporting success.
- A sample job an editor unpublished no longer comes back on the next sync.
- Alert signups nobody confirms are deleted after 7 days.
- Logo and media uploads work on a board deployed with the button. Vercel now connects new Blob stores through OIDC and sets `BLOB_STORE_ID` with no `BLOB_READ_WRITE_TOKEN`, so Payload's Blob adapter stayed off and every upload failed. Bordful now talks to the store with OIDC, and the button asks for a public store so logos can be served from it.
- A fresh deploy could show an empty board. Vercel's first requests each booted the app and seeded the sample jobs at the same time, and the board cached the empty page. One boot now takes the sync lease and seeds, the others skip, and an empty first page is read again before it is served.
- `next build` no longer runs its own TypeScript pass. `bun run typecheck` already runs in CI, and the duplicate pass added about nine seconds to every deploy.
- A company no longer appears twice after a sync. Bordfeed sends a job that is under an hour old with the employer name alone, and the same job again with the company's domain and logo once it is linked. The sync matched companies by Bordfeed id and domain only, so the second delivery created a second company and left the first one empty. It now matches the name as well, fills in the id, domain and logo on the company it already has, and a name-only job no longer clears a logo.
- An unreadable percent escape in a URL, such as `/jobs/%E0%A4%A`, shows the 404 page instead of a plain-text 500.
- Salary sort uses the same converted USD range as the salary filter. The `/jobs/levels` counts match the level archives. `/jobs/search?types=...` redirects only to archives that have jobs.
- Deleting a company, or changing its slug or domain, updates its jobs, so job pages no longer link to a 404. Changing or deleting a media file refreshes the cached logo.
- The filter, sort and per-page menus close on Escape, on an outside click and after a choice. A long unbroken word no longer makes a job page wider than a phone screen, and `/post` and the board footer no longer scroll sideways at some widths.
- Muted text and the featured, new and closing badges meet WCAG AA contrast. Headings are in order on the board, and board pages have a "Skip to content" link. Board search is a search landmark, the alert form marks the email field invalid only after a failed check, and job title and company links on the board have 24px touch targets.
- Job rows no longer show a broken image when a company logo URL is on a host that the CSP `img-src` list blocks. The board uses an uploaded logo first, then Logo.dev by domain when a publishable key is set, then the logo URL only if its host is already allowed, and otherwise a letter tile. The CSP list is unchanged.

### Removed

- The `bounced` alert subscriber status. Nothing set it, and Resend already stops delivery to addresses that hard bounce. A migration moves any row set by hand to `unsubscribed`.
- Airtable.
- Google Sheets.
- Static generation.
- Unused code: the shadcn `badge`, `card`, `checkbox`, `select`, `separator` and `textarea` components (add one back with `bunx shadcn add <name>`), an old marketing features section, and index files nothing imported.
- The `@payloadcms/email-resend` dependency. It was never configured; alerts send through `resend` directly.

## 0.x (Airtable edition)

The legacy Airtable version and its changelog live on the [airtable branch](https://github.com/craftled/bordful/blob/airtable/CHANGELOG.md).
