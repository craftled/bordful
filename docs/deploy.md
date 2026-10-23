# Deploy

## Deploy button

The button in the [README](../README.md) opens the Vercel project flow and clones `craftled/bordful` at branch `v1`. The `repository-url` parameter is a GitHub tree URL for that branch.

It provisions:

- Neon Postgres, which sets `DATABASE_URL`. Preview deployments get their own Neon branch.
- Vercel Blob, which sets `BLOB_READ_WRITE_TOKEN`.

It then asks you to enter:

- `PAYLOAD_SECRET`: 32+ random characters. After the project exists, mark this variable Sensitive and limit it to Production. Create a different value for Preview. Do not reuse the production secret on Preview.
- `CRON_SECRET`: a random string. Cron routes reject requests that do not send it as a bearer token.

`NEXT_PUBLIC_SERVER_URL` is optional on Vercel. When it is unset, the app uses the production URL. Set it only when you need to pin an origin, then redeploy, because Next inlines it at build time.

Migrations run automatically on deploy. Payload applies `prodMigrations` when the production server starts. You do not run a migrate command in the Vercel build.

## Environment variables

E2E-only variables (`BORDFUL_TEST_CLOCK`, `MOCK_PORT`, `APP_PORT`, `APP_MARKETING_PORT`, `PLAYWRIGHT_BASE_URL`, `E2E_MARKETING_BASE_URL`) are omitted here. Do not set them on a deployed board.

| Variable | Required | Who sets it | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Neon integration on Vercel. You, on any other host. | Postgres connection string. |
| `PAYLOAD_SECRET` | Yes | You | 32+ random characters. Mark Sensitive. Production uses one value. Preview uses a different value and its own Neon branch. |
| `CRON_SECRET` | Yes | You | Bearer secret for `/api/cron/bordfeed`, `/api/cron/expire`, and `/api/cron/alerts`. |
| `NEXT_PUBLIC_SERVER_URL` | No | You | Public origin, no trailing slash. Optional on Vercel (falls back to the production URL). Inlined at build time. |
| `BLOB_READ_WRITE_TOKEN` | No locally | Blob integration on Vercel | On Vercel, uploads need Blob (the Deploy button provisions it). Without this token, Payload stores uploads in the local `media/` directory, which needs a persistent disk. Serverless and other read-only hosts cannot use that directory. |
| `BORDFUL_MARKETING` | No | You, only on bordful.com | `true` only for bordful.com. Leave unset or `false` on a fork. Marketing routes stay off unless this is `true`. |
| `RESEND_API_KEY` | No | You | Job alerts stay off without it. See [Job alerts](alerts.md). |
| `RESEND_BASE_URL` | No | You | Resend API origin. Empty uses the SDK default. |
| `BORDFEED_BASE_URL` | No | You | Overrides `bordfeed.baseUrl` in `bordful.config.ts`. `http` is allowed here for local mocks. Use `https` for a real board. |
| `BORDFEED_API_KEY` | No | You | Optional default for `bun run bordful connect --key`. Leave empty to connect in the admin. |
| `BORDFUL_RELEASES_URL` | No | You | Update check endpoint. Default: `https://api.github.com/repos/craftled/bordful/releases?per_page=20`. |
| `DATABASE_URL_TEST` | No | You, locally | Used by `bun run test:int`. Must end in `_int`. Do not set this on Vercel. |
| `E2E_FLOWS` | No | Playwright | Local Playwright flow filter. Do not set this on Vercel. |

Placeholders only: `PAYLOAD_SECRET=replace-with-32-plus-random-chars`. Never commit `.env`.

## Crons

`vercel.json` schedules three routes. Vercel Hobby rejects more frequent crons, so each one is daily. Each route requires `Authorization: Bearer <CRON_SECRET>`.

| Path | UTC schedule |
| --- | --- |
| `/api/cron/bordfeed` | 06:00 (`0 6 * * *`) |
| `/api/cron/expire` | 05:30 (`30 5 * * *`) |
| `/api/cron/alerts` | 08:00 (`0 8 * * *`) |

## Custom domain

1. Deploy with the button.
2. In the Vercel project, open Settings, then Domains, and add the domain.
3. Create the DNS records Vercel shows.
4. When that domain is the production domain, leave `NEXT_PUBLIC_SERVER_URL` unset so the app uses the production URL. To pin the origin, set `NEXT_PUBLIC_SERVER_URL` to `https://board.example` and redeploy.

## Self-hosting outside Vercel

Use any Postgres 17 database and set `DATABASE_URL` yourself. Set `PAYLOAD_SECRET` and `CRON_SECRET` yourself. Without `BLOB_READ_WRITE_TOKEN`, media uploads go to the local `media/` directory, so the host needs a persistent disk. Blob is required on Vercel and on other read-only or serverless hosts: `payload.config.ts` enables the Blob adapter only when the token is set. Run migrations once:

```bash
bun run payload migrate
```

Call these three URLs from your own scheduler, at the same UTC times. Send the header `Authorization` with the bearer scheme and your `CRON_SECRET` value.

- `https://board.example/api/cron/bordfeed`
- `https://board.example/api/cron/expire`
- `https://board.example/api/cron/alerts`

Keep `PAYLOAD_SECRET` stable across upgrades. See [Upgrading](../UPGRADING.md).
