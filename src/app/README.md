# Route groups

There is no `src/app/layout.tsx`. Three root layouts exist:

- `(payload)` serves the admin and REST API.
- `(site)` serves the board and every fork route. `/` lives in `(site)/page.tsx` and dispatches on `BORDFUL_MARKETING`.
- `(marketing)` serves bordful.com pages. Each page calls `assertMarketingEnabled()`, so they 404 when the flag is off.

Navigating between root layouts is a full page load. `/jobs` stays in `(site)` for both modes. Unmatched URLs use `global-not-found.tsx`.
