# Configuration

Two places hold board setup: `bordful.config.ts` in the repo, and Site settings in the admin (`/admin`, global Site settings).

Environment variables are listed in [Deploy](deploy.md#environment-variables).

## bordful.config.ts

`defineBordfulConfig` in `src/config/define-config.ts` parses this file. Unknown keys are rejected. Defaults below match that schema. The committed file is:

```ts
export default defineBordfulConfig({
  bordfeed: {
    baseUrl: "https://bordfeed.com",
    syncCron: "0 6 * * *",
    sync: { jobsPerSync: 50, jobsPerDay: 200 },
  },
  telemetry: { clientHeader: true },
  board: { defaultTemplateId: "fully-remote" },
  alerts: { provider: "resend" },
  csp: { extraScriptOrigins: [], extraConnectOrigins: [] },
});
```

| Option                                                                            | Default                | Rules                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bordfeed.baseUrl`                                                                | `https://bordfeed.com` | `https` only. Use the origin only, for example `https://bordfeed.com`. The schema does not reject a trailing path. `BORDFEED_BASE_URL` overrides this at runtime and may be `http` for a local mock.                |
| `bordfeed.syncCron`                                                               | `0 6 * * *`            | Five cron fields. Step values must use `*/N` or `a-b/N`. This matches the Vercel cron for `/api/cron/bordfeed`. Nothing reads it at runtime: the schedule is the cron in `vercel.json`, so change it there.         |
| `bordfeed.sync.jobsPerSync`                                                       | `50`                   | Most jobs one sync fetches, including the first sync. Clamped to 20 to 100. A value set in the Bordfeed Connection global wins over this one. See [Credits per sync](bordfeed.md#credits-per-sync).                 |
| `bordfeed.sync.jobsPerDay`                                                        | `200`                  | Most jobs fetched per UTC day across every sync. Clamped to 20 to 5000. A value set in the Bordfeed Connection global wins over this one.                                                                           |
| `telemetry.clientHeader`                                                          | `true`                 | `false` drops the `X-Bordfeed-Client` header and `install_id`. `ref` and `utm_*` still go out. See [Bordfeed](bordfeed.md).                                                                                         |
| `board.defaultTemplateId`                                                         | `fully-remote`         | Template used for sample jobs and for the feed created at connect. Read once, on first boot. An existing board keeps the template stored in its Bordfeed connection, so changing this value later does not move it. |
| `alerts.provider`                                                                 | `resend`               | Only `resend`.                                                                                                                                                                                                      |
| `csp.extraScriptOrigins`                                                          | `[]`                   | Extra `script-src` origins. `https` origins only. Current browsers ignore them because of `'strict-dynamic'`; see below.                                                                                            |
| `social.bluesky`, `social.github`, `social.linkedin`, `social.reddit`, `social.x` | unset                  | Optional profile links. Each must be an `https` URL. Set ones show as icons in the header, the mobile menu and the footer. The committed file leaves them out.                                                      |
| `csp.extraConnectOrigins`                                                         | `[]`                   | Extra `connect-src` origins: hosts that `fetch`, XHR, WebSocket or beacon calls may reach. `https` origins only.                                                                                                    |

Live Bordfeed template ids (15 Nov 2026): `fully-remote`, `remote-writing`, `engineering-it`, `growth-marketing-eu`, `customer-support`, `remote-design`, `senior-tech-remote-us`.

An extra CSP origin is an origin, not a URL path. `https://cdn.example.com` is the accepted shape. One leading wildcard label is allowed (`https://*.example.com`). A path, `http`, a quote, a semicolon, a space, or a comma fails config parsing, so the dev server and the build stop with `Invalid bordful.config.ts` and name the bad entry. Every page, `/api` and `/admin` response then sends the origins in its `Content-Security-Policy` header.

The script policy uses a per-request nonce with `'strict-dynamic'`. Browsers that support `'strict-dynamic'` (all current ones) ignore origin lists in `script-src`, so listing a host does not let a plain `<script src>` tag from it run. A script runs when it carries the page nonce or when an already trusted script inserts it. `extraScriptOrigins` only matters for older browsers without `'strict-dynamic'`.

The rest of the policy has no option. `img-src` allows only the board itself, `blob:` and `data:` URLs, Vercel Blob (`*.public.blob.vercel-storage.com`), `bordfeed.com` and `*.bordfeed.com`, and `img.logo.dev`, so an image or iframe from another host is blocked. `form-action` allows only the board, `buy.stripe.com` and `checkout.stripe.com`. `frame-src`, `frame-ancestors` and `object-src` are `'none'`. Static files and prefetch requests skip the CSP header.

To load a third-party script from a `src/custom/**` slot, use `next/script`. Next inserts it from its own nonced code after the page loads, so it runs with no nonce of yours. Add every host that script calls to `extraConnectOrigins`.

```tsx
import Script from "next/script";

export function Analytics() {
  return (
    <Script src="https://cdn.example.com/a.js" strategy="afterInteractive" />
  );
}
```

In development, open the board at `http://localhost:3000`. Next's dev server blocks its own scripts on other hosts such as `127.0.0.1` unless they are listed in `allowedDevOrigins`, so the script does not run there.

## Site settings

Admins edit the Site settings global. Editors do not.

| Group      | Fields                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| (top)      | Name (default `Job Board`), tagline, logo (media upload).                                                                                       |
| Theme      | Ten color overrides, heading font, body font, radius. See [Theming](theming.md).                                                                |
| Board      | Title, description, jobs per page (5 to 100, default 20), public detail fields.                                                                 |
| Post a Job | Enabled (default off), payment link URL, price label (default empty), duration in days (default 30, 1 to 365). See [Post a Job](post-a-job.md). |
| Alerts     | Enabled (default off), default frequency (`weekly` or `daily`, default `weekly`), sender name, sender email. See [Job alerts](alerts.md).       |
| Showcase   | List my board (default off).                                                                                                                    |

Public detail fields, all on by default: `salary`, `location`, `employmentType`, `workplaceType`, `careerLevel`, `languages`, `categories`, `validThrough`.

`BORDFUL_MARKETING` is not a Site settings field. It is an environment variable, and it is `true` only on bordful.com. See [Deploy](deploy.md).
