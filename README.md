# Bordful

Open-source job board template on Next.js and Payload, live in two minutes with sample jobs from Bordfeed.

Bordful 1.0 is a rebuild on Payload 4. The Airtable edition (0.x, latest 0.2.0) lives on the [airtable branch](https://github.com/craftled/bordful/tree/airtable).

[![Deploy with Vercel](https://vercel.com/button)](<https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcraftled%2Fbordful%2Ftree%2Fmain&project-name=bordful&repository-name=bordful&env=PAYLOAD_SECRET%2CCRON_SECRET&envDescription=PAYLOAD_SECRET%20signs%20admin%20sessions%20(32%2B%20random%20characters).%20CRON_SECRET%20guards%20the%20cron%20routes.&envLink=https%3A%2F%2Fgithub.com%2Fcraftled%2Fbordful%2Fblob%2Fmain%2Fdocs%2Fdeploy.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22blob%22%2C%22access%22%3A%22public%22%7D%5D>)

The button provisions Neon Postgres and Vercel Blob. It then asks for two values:

- `PAYLOAD_SECRET`: 32+ random characters
- `CRON_SECRET`

Details are in [Deploy](docs/deploy.md).

## Features

Bordful 1.0 includes:

- A board with search, filters, and taxonomy archives
- Job and company pages with JobPosting JSON-LD
- RSS 2.0 and JSON Feed
- Sitemap and robots
- Sample jobs from a Bordfeed template on first deploy
- Connect Bordfeed in the admin, or with `bun run bordful connect`
- Post a Job through a Stripe payment link, with admin publish and automatic expiry
- Email job alerts via Resend with double opt-in (weekly default, daily option)
- Import blocklist for Bordfeed jobs
- Light and dark themes, with a header toggle
- Theme colors, fonts, radius, and logo in admin settings
- An update notice in the admin, and `bun run bordful:upgrade` to merge upstream changes
- Company logos from Logo.dev for companies with no uploaded logo
- `bun run bordful reset-password` for a lost admin password
- Nonce-based CSP and security headers

## Quick start

Prerequisites: Bun 1.4.2, Node.js 26 LTS (see .nvmrc), and Postgres 17.

```bash
bun install
cp .env.example .env
```

Fill `DATABASE_URL`, `PAYLOAD_SECRET`, and `CRON_SECRET` in `.env`.

```bash
bun run payload migrate
bun run dev
```

Open `http://localhost:3000/admin` and create the first admin. That user gets the admin role.

## Documentation

- [Deploy](docs/deploy.md)
- [Configuration](docs/configuration.md)
- [Bordfeed](docs/bordfeed.md)
- [Post a Job](docs/post-a-job.md)
- [Job alerts](docs/alerts.md)
- [Theming](docs/theming.md)
- [Customization](docs/customization.md)

## Known limits

- Payload 4 is still a beta upstream. Bordful pins it and bumps it by hand.
- There are no admin password reset emails. See [Deploy](docs/deploy.md#admin-sign-in).
- `csp.extraScriptOrigins` and `csp.extraConnectOrigins` are accepted but not applied. See [Configuration](docs/configuration.md).
- Migrations run on first database connect in production, which can happen during the build. Keep your own migrations backward compatible. See [Deploy](docs/deploy.md).
- The admin update notice follows GitHub releases, and fixes merged after the v1.0.0 tag have no release yet, so it stays quiet about them. Run `bun run bordful:upgrade` to get them. See [Upgrading](UPGRADING.md).
- A new board's first sync can bring jobs from the last hour with only the employer name, because Bordfeed links companies after a job arrives. A later sync adds the domain and logo once Bordfeed has linked the company.

## Customizing without merge conflicts

Keep your changes in admin settings, `bordful.config.ts`, and `src/custom/**`. See [Customization](docs/customization.md).

## Upgrading

Run `bun run bordful:upgrade`. It merges the latest `main` from craftled/bordful into your board, including the one-time base step a Deploy button project needs. A board created before this command existed runs the upstream copy once. See [Upgrading](UPGRADING.md). The admin update notice links to Upgrading. Breaking notes are in [Changelog](CHANGELOG.md).

## Security

See [Security](SECURITY.md).

## License (MIT)

Bordful is [MIT licensed](LICENSE).

## Built by Craftled

Built by [Craftled](https://craftled.com).
