# Route groups

There is no `src/app/layout.tsx`. Three root layouts exist:

- `(payload)` serves the admin and REST API.
- `(site)` serves the board and every fork route. `/` lives in `(site)/page.tsx` and dispatches on `BORDFUL_MARKETING`.
- `(marketing)` serves bordful.com pages. Each page calls `assertMarketingEnabled()`, so they 404 when the flag is off.

Navigating between root layouts is a full page load. `/jobs` stays in `(site)` for both modes. Unmatched URLs use `global-not-found.tsx`.

Icons stay in metadata, not `src/app/icon.svg` or `src/app/apple-icon.png`. A file-convention icon would brand forks and the admin with the Bordful mark. `(site)` uses `boardIcons`. `(marketing)` uses `marketingLayoutMetadata`. `/favicon.ico` is rewritten to `/marketing/icon.svg` only when marketing is on. `manifest.ts` serves Bordful branding at `/manifest.webmanifest` only when marketing is on; forks get a 404. Legacy URL redirects in `next.config.ts` are also gated on `BORDFUL_MARKETING` at build time.
