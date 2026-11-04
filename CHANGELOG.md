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

- Rebuilt on Payload 4 (4.0.0-beta.6, with Lexical 0.53) and Postgres.
- Requires Node.js 26 LTS. `engines.node` is `26.x`, which overrides the Vercel project Node.js setting. Built-in fetch on Vercel uses HTTP/2 on Node 26. Set the Vercel environment variable `VERCEL_FETCH_DISABLE_H2=1` to keep HTTP/1.1.

### Removed

- Airtable.
- Google Sheets.
- Static generation.

## 0.1.x (Airtable edition)

The legacy Airtable version and its changelog live on the [airtable branch](https://github.com/craftled/bordful/blob/airtable/CHANGELOG.md).
