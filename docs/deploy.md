# Deploy

## Deploy button

The button in the [README](../README.md) opens the Vercel project flow and clones `craftled/bordful` at branch `main`. The `repository-url` parameter is a GitHub tree URL for `main`.

It provisions:

- Neon Postgres, which sets `DATABASE_URL`. Preview deployments get their own Neon branch.
- Vercel Blob, which sets `BLOB_STORE_ID`. Vercel connects new stores through OIDC, so there is no token to copy and Bordful uses the store as it is. The button asks for a public store, because logos are served straight from Blob. A private store cannot serve them, so if a board ends up with one, create a public store and connect it instead.

It then asks you to enter:

- `PAYLOAD_SECRET`: 32+ random characters. After the project exists, mark this variable Sensitive and limit it to Production. Create a different value for Preview. Do not reuse the production secret on Preview.
- `CRON_SECRET`: a random string. Cron routes reject requests that do not send it as a bearer token.

`NEXT_PUBLIC_SERVER_URL` is optional on Vercel. When it is unset, a Production deployment uses its production domain, a Preview deployment uses its own deployment URL, and any other host falls back to `http://localhost:3000`, so set it on every host other than Vercel. Set it only when you need to pin an origin, then redeploy, because Next inlines it at build time.

Migrations run automatically. With `NODE_ENV=production`, Payload applies `prodMigrations` the first time it connects to the database. That can be during `next build` as well as when the server starts, so a new deployment can migrate the production database before it is promoted. You do not run a migrate command yourself. Keep migrations backward compatible (add first, remove in a later release), so an instant rollback to the previous deployment still works against the newer schema.

## Environment variables

E2E-only variables (`BORDFUL_TEST_CLOCK`, `MOCK_PORT`, `APP_PORT`, `APP_MARKETING_PORT`, `PLAYWRIGHT_BASE_URL`, `E2E_MARKETING_BASE_URL`) are omitted here, except `DATABASE_URL_TEST` and `E2E_FLOWS`, which the table lists. Do not set any of them on a deployed board.

| Variable | Required | Who sets it | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Neon integration on Vercel. You, on any other host. | Postgres connection string. |
| `PAYLOAD_SECRET` | Yes | You | 32+ random characters. Mark Sensitive. Production uses one value. Preview uses a different value and its own Neon branch. |
| `CRON_SECRET` | Yes | You | Bearer secret for `/api/cron/bordfeed`, `/api/cron/expire`, and `/api/cron/alerts`. |
| `NEXT_PUBLIC_SERVER_URL` | No | You | Public origin, no trailing slash. Optional on Vercel (Production uses the production domain, Preview its deployment URL). Off Vercel it falls back to `http://localhost:3000`, so set it. Inlined at build time. |
| `BLOB_STORE_ID` | No locally | Blob integration on Vercel | On Vercel, uploads need Blob (the Deploy button provisions it). Bordful authenticates to the store with Vercel OIDC. Without Blob, Payload stores uploads in the local `media/` directory, which needs a persistent disk. Serverless and other read-only hosts cannot use that directory. |
| `BLOB_READ_WRITE_TOKEN` | No | You, optionally | A static Blob token. Older stores set it, and you need it to use Blob from a host other than Vercel. When it is set, it is used instead of OIDC. |
| `BORDFUL_MARKETING` | No | You, only on bordful.com | `true` only for bordful.com. Leave unset or `false` on a fork. Marketing routes stay off unless this is `true`. |
| `RESEND_API_KEY` | No | You | Job alerts stay off without it. See [Job alerts](alerts.md). |
| `RESEND_BASE_URL` | No | You | Resend API origin. Empty uses the SDK default. |
| `NEXT_PUBLIC_LOGO_DEV_TOKEN` | No | You | A [Logo.dev](https://logo.dev) publishable key (`pk_...`). Companies with no uploaded logo and no logo URL then show their Logo.dev logo by domain, or by the company website if no domain is stored, and the footer credits Logo.dev. A secret key (`sk_...`) is ignored, because the key is visible in page HTML. Inlined at build time, so redeploy after changing it. |
| `BORDFEED_BASE_URL` | No | You | Overrides `bordfeed.baseUrl` in `bordful.config.ts`. `http` is allowed here for local mocks. Use `https` for a real board. |
| `BORDFEED_API_KEY` | No | You | Optional default for `bun run bordful connect --key`. Leave empty to connect in the admin. |
| `BORDFEED_ALLOW_MASS_UNPUBLISH` | No | You | Set to `1` only to let a confirmed Bordfeed incident unpublish jobs. Leave unset. See [Daily sync](bordfeed.md#daily-sync). |
| `BORDFUL_RELEASES_URL` | No | You | Update check endpoint. The check runs at most once every 24 hours. Default: `https://api.github.com/repos/craftled/bordful/releases?per_page=20`. |
| `SENTRY_DSN` | No | You | Server and edge error capture. Unset means Sentry is off. |
| `NEXT_PUBLIC_SENTRY_DSN` | No | You | Browser error capture. The ingest origin is also added to the CSP `connect-src`. Inlined at build, so redeploy after changing it. |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | No | You | Trace sample rate, `0` to `1`. Empty uses `0.1`. |
| `NEXT_PUBLIC_SENTRY_REPLAY` | No | You | Session Replay in the browser. Only the exact value `true` turns it on. |
| `SENTRY_AUTH_TOKEN` | No | You, for source maps | Source map upload token. Mark Sensitive. Upload needs this plus `SENTRY_ORG` and `SENTRY_PROJECT`. |
| `SENTRY_ORG` | No | You, for source maps | Sentry org slug. Craftled uses `craftled-se`. |
| `SENTRY_PROJECT` | No | You, for source maps | Sentry project slug. Craftled uses `bordful`. |
| `DATABASE_URL_TEST` | No | You, locally | Used by `bun run test:int`. The database name must end in `_int` or `_test`. Do not set this on Vercel. |
| `E2E_FLOWS` | No | Playwright | Local Playwright flow filter. Do not set this on Vercel. The `S0-a11y` flow needs a fresh database that holds only the sample jobs. |

Placeholders only: `PAYLOAD_SECRET=replace-with-32-plus-random-chars`. Never commit `.env`.

## Error monitoring (optional)

Sentry is off by default. Set `SENTRY_DSN` to capture server and edge errors, and `NEXT_PUBLIC_SENTRY_DSN` to capture browser errors. The environment tag on every event is `VERCEL_ENV` on the server, `NEXT_PUBLIC_VERCEL_ENV` in the browser, and `NODE_ENV` anywhere else.

`NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` sets the trace sample rate, a number from `0` to `1`, with `0.1` the default. `NEXT_PUBLIC_SENTRY_REPLAY` turns on Session Replay in the browser, and only the exact value `true` after trimming turns it on: `1` and `TRUE` mean off. Replay masks all text and all inputs and blocks all media. Its compression worker runs from a blob URL, so the CSP gains `worker-src 'self' blob:`, and its events go to the ingest origin from `NEXT_PUBLIC_SENTRY_DSN`, which the CSP `connect-src` allows.

Readable stack traces need source maps. Set all three of `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` to upload them during the build. With any of the three unset the build skips the source map upload. The Craftled deployment uses org `craftled-se` and project `bordful`. A self-hosted fork needs its own Sentry account, org, and project.

Set the DSNs in the build environment too, not only at runtime. `NEXT_PUBLIC_*` values are inlined at build time, and whether `withSentryConfig` wraps the build is decided at build time, so a DSN that exists only at `docker run` leaves that build wiring off. Redeploy after changing any of them.

Browser capture starts only after the Sentry module loads asynchronously, so an error thrown before that, such as during first hydration, is not captured, and the page-load trace starts late. See the [Sentry Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/).

## Crons

`vercel.json` schedules three routes. Vercel Hobby rejects more frequent crons, so each one is daily. Each route requires `Authorization: Bearer <CRON_SECRET>`.

| Path | UTC schedule |
| --- | --- |
| `/api/cron/bordfeed` | 06:00 (`0 6 * * *`) |
| `/api/cron/expire` | 05:30 (`30 5 * * *`) |
| `/api/cron/alerts` | 08:00 (`0 8 * * *`) |

The Bordfeed cron fetches only jobs new to the feed since the last sync, capped per sync and per day, and finds closed jobs with free lookups, so one run spends at most `jobsPerSync` credits and a day at most `jobsPerDay`. See [Credits per sync](bordfeed.md#credits-per-sync).

## Custom domain

1. Deploy with the button.
2. In the Vercel project, open Settings, then Domains, and add the domain.
3. Create the DNS records Vercel shows.
4. When that domain is the production domain, leave `NEXT_PUBLIC_SERVER_URL` unset so the app uses the production domain. To pin the origin, set `NEXT_PUBLIC_SERVER_URL` to `https://board.example` and redeploy.

## Firewall

Bots can send `/jobs/search` thousands of different queries an hour. Search no longer reads the database for each one, but every request still runs a function, so add one Vercel Firewall rule after you deploy. The rule lives in the Vercel project, not in this repository, so a fork does not get it automatically.

In the Vercel project, open Firewall, then Configure, and add a custom rule:

| Setting | Value |
| --- | --- |
| Name | `Challenge search and alerts` |
| If | Request Path equals `/jobs/search` and Method equals `GET` |
| Or | Request Path equals `/alerts` and Method equals `GET` |
| Then | Challenge |

Publish the change. Browsers pass the challenge once. Scripts get HTTP 429 with `x-vercel-mitigated: challenge`. Search engines are unaffected, since `robots.txt` already disallows `/jobs/search`. The alerts form still works, because it posts with `POST`.

The same rule from the Vercel CLI:

```bash
vercel firewall rules add "Challenge search and alerts" \
  --condition '{"type":"path","op":"eq","value":"/jobs/search"}' \
  --condition '{"type":"method","op":"eq","value":"GET"}' \
  --or \
  --condition '{"type":"path","op":"eq","value":"/alerts"}' \
  --condition '{"type":"method","op":"eq","value":"GET"}' \
  --action challenge
vercel firewall publish
```

A per-IP rate limit does not help here. The traffic that prompted this rule came through residential proxies, with no single IP sending more than a few hundred requests a day.

## Admin sign-in

After 5 failed sign-ins an account locks for 10 minutes, then it can sign in again.

Bordful does not send password reset emails. The "Forgot password?" link on the login page points here. If you lose your password, ask another admin to set a new one in Users, or set it yourself from a clone of your repo. On Vercel, run:

```bash
bun install
vercel link
vercel env pull .env.local --environment=production
PAYLOAD_SECRET=$(openssl rand -hex 32) bun run bordful reset-password --email owner@example.com
```

The first run changes nothing. It prints the database it would change as `host:port/database`. Check that this is your board's database, in Vercel under Storage or in your Neon dashboard, then run the same line again with `--database-host` and that exact text. When you are done, run `rm .env.local`.

If the command says `DATABASE_URL` is empty, Vercel kept the value back because it is Sensitive. Copy the connection string from your Neon dashboard and run `export DATABASE_URL='...'` first.

On any other host, set `DATABASE_URL` to the production database and run the `reset-password` line the same way.

The check matters because the command boots your app, which seeds whatever `DATABASE_URL` points at, and migrates it when `NODE_ENV` is `production`. If the folder you run it from has no `.env` file, the Payload CLI loads the first one it finds in a parent folder, which can belong to a different project. The check also stops if `DATABASE_URL` connects somewhere other than its URL host, for example through a `host` query parameter or a socket path.

Check out the same commit your site is deployed from before you run the command. Booting with `NODE_ENV=production` applies pending migrations, so a newer checkout could migrate the production database ahead of the live app.

The command prints a new password once, clears any lockout, and signs that user out everywhere. Sign in, then change the password in Users. If the email does not match a user, the command lists the admin emails.

The `PAYLOAD_SECRET` in the command is a throwaway. A password reset does not need the real value, which Vercel will not show once it is Sensitive. Do not save it to the project.

Anyone who has `DATABASE_URL` can reset a password this way, so treat it like an admin password.

## Self-hosting outside Vercel

Run Node.js 26 LTS (see `.nvmrc`).

Use any Postgres 17 database and set `DATABASE_URL` yourself. Set `PAYLOAD_SECRET` and `CRON_SECRET` yourself. With neither `BLOB_READ_WRITE_TOKEN` nor `BLOB_STORE_ID` set, media uploads go to the local `media/` directory, so the host needs a persistent disk. Blob is required on Vercel and on other read-only or serverless hosts. Outside Vercel there is no OIDC, so create a read-write token for the store and set `BLOB_READ_WRITE_TOKEN`. Run migrations once:

```bash
bun run payload migrate
```

Call these three URLs from your own scheduler, at the same UTC times. Send the header `Authorization` with the bearer scheme and your `CRON_SECRET` value.

- `https://board.example/api/cron/bordfeed`
- `https://board.example/api/cron/expire`
- `https://board.example/api/cron/alerts`

Keep `PAYLOAD_SECRET` stable across upgrades. See [Upgrading](../UPGRADING.md).
