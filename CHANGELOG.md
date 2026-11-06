# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-03

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
- Nonce-based CSP and security headers.
- Deploy to Vercel button that provisions Neon Postgres and Vercel Blob.
- Import blocklist in the admin: Bordfeed jobs from listed companies or domains, or with listed keywords, are not imported. Saving it unpublishes matching imported jobs. See [docs/bordfeed.md](docs/bordfeed.md#import-blocklist).
- Restoring an older job version in the admin creates a draft. Publish it to make the restored version live.

### Changed

- Publishing a job with a past Valid through now shows an error in the admin. It used to save, stay hidden, and go back to draft at the next expire run. Setting a past date on a live job still ends the listing.
- Digest emails say how to change alert filters.
- Rebuilt on Payload 4 (4.0.0-beta.6, with Lexical 0.53) and Postgres.
- Requires Node.js 26 LTS. `engines.node` is `26.x`, which overrides the Vercel project Node.js setting. Built-in fetch on Vercel uses HTTP/2 on Node 26. Set the Vercel environment variable `VERCEL_FETCH_DISABLE_H2=1` to keep HTTP/1.1.

### Fixed

- Digest unsubscribe links keep working after `PAYLOAD_SECRET` or a subscriber's email changes. Each digest now stores the current hash before it is sent, and a digest is not sent if that fails.
- One-click unsubscribe answers 404 for an unknown token instead of reporting success.
- A sample job an editor unpublished no longer comes back on the next sync.
- Alert signups nobody confirms are deleted after 7 days.
- Logo and media uploads work on a board deployed with the button. Vercel now connects new Blob stores through OIDC and sets `BLOB_STORE_ID` with no `BLOB_READ_WRITE_TOKEN`, so Payload's Blob adapter stayed off and every upload failed. Bordful now talks to the store with OIDC, and the button asks for a public store so logos can be served from it.
- A fresh deploy could show an empty board. Vercel's first requests each booted the app and seeded the sample jobs at the same time, and the board cached the empty page. One boot now takes the sync lease and seeds, the others skip, and an empty first page is read again before it is served.
- `next build` no longer runs its own TypeScript pass. `bun run typecheck` already runs in CI, and the duplicate pass added about nine seconds to every deploy.

### Removed

- The `bounced` alert subscriber status. Nothing set it, and Resend already stops delivery to addresses that hard bounce. A migration moves any row set by hand to `unsubscribed`.
- Airtable.
- Google Sheets.
- Static generation.

## 0.1.x (Airtable edition)

The legacy Airtable version and its changelog live on the [airtable branch](https://github.com/craftled/bordful/blob/airtable/CHANGELOG.md).
