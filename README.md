# Bordful

Open-source job board template on Next.js and Payload, live in two minutes with sample jobs from Bordfeed.

Bordful 1.0 is a rebuild on Payload 4. The Airtable edition (0.1.x) lives on the [legacy-airtable branch](https://github.com/craftled/bordful/tree/legacy-airtable).

[![Deploy with Vercel](https://vercel.com/button)](<https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcraftled%2Fbordful%2Ftree%2Fv1&project-name=bordful&repository-name=bordful&env=PAYLOAD_SECRET%2CCRON_SECRET&envDescription=PAYLOAD_SECRET%20signs%20admin%20sessions%20(32%2B%20random%20characters).%20CRON_SECRET%20guards%20the%20cron%20routes.&envLink=https%3A%2F%2Fgithub.com%2Fcraftled%2Fbordful%2Fblob%2Fv1%2Fdocs%2Fdeploy.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D>)

The button provisions Neon Postgres and Vercel Blob. It then asks for two values:

- `PAYLOAD_SECRET`: 32+ random characters
- `CRON_SECRET`

Details are in [Deploy](docs/deploy.md).

## Features

Bordful 1.0 beta includes:

- A board with search, filters, and taxonomy archives
- Job and company pages with JobPosting JSON-LD
- RSS 2.0 and JSON Feed
- Sitemap and robots
- Sample jobs from a Bordfeed template on first deploy
- Connect Bordfeed in the admin, or with `bun run bordful connect`
- Post a Job through a Stripe payment link, with admin publish and automatic expiry
- Email job alerts via Resend with double opt-in (weekly default, daily option)
- Theme colors, fonts, radius, and logo in admin settings
- An update notice in the admin
- Nonce-based CSP and security headers

## Quick start

Prerequisites: Bun 1.4.2, Node.js 24.22.1 or later, and Postgres 17.

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

## Customizing without merge conflicts

Keep your changes in admin settings, `bordful.config.ts`, and `src/custom/**`. See [Customization](docs/customization.md).

## Upgrading

See [Upgrading](UPGRADING.md). A project created with the Deploy button does not share git history with this repo, so the first merge is `git merge upstream/v1 --allow-unrelated-histories`. The admin update notice links to Upgrading. Breaking notes are in [Changelog](CHANGELOG.md).

## Security

See [Security](SECURITY.md).

## License (MIT)

Bordful is [MIT licensed](LICENSE).

## Built by Craftled

Built by [Craftled](https://craftled.com).
