# Configuration

Two places hold board setup: `bordful.config.ts` in the repo, and Site settings in the admin (`/admin`, global Site settings).

## bordful.config.ts

`defineBordfulConfig` in `src/config/define-config.ts` parses this file. Unknown keys are rejected. Defaults below match that schema. The committed file is:

```ts
export default defineBordfulConfig({
  bordfeed: { baseUrl: "https://bordfeed.com", syncCron: "0 6 * * *" },
  telemetry: { clientHeader: true },
  board: { defaultTemplateId: "engineering-it" },
  alerts: { provider: "resend" },
  csp: { extraScriptOrigins: [], extraConnectOrigins: [] },
});
```

| Option | Default | Rules |
| --- | --- | --- |
| `bordfeed.baseUrl` | `https://bordfeed.com` | `https` only. No trailing path. `BORDFEED_BASE_URL` overrides this at runtime and may be `http` for a local mock. |
| `bordfeed.syncCron` | `0 6 * * *` | Five cron fields. Step values must use `*/N` or `a-b/N`. This matches the Vercel cron for `/api/cron/bordfeed`. Editing it does not change `vercel.json`. |
| `telemetry.clientHeader` | `true` | `false` drops the `X-Bordfeed-Client` header and `install_id`. `ref` and `utm_*` still go out. See [Bordfeed](bordfeed.md). |
| `board.defaultTemplateId` | `engineering-it` | Template used for sample jobs and for the feed created at connect. |
| `alerts.provider` | `resend` | Only `resend`. |
| `csp.extraScriptOrigins` | `[]` | Extra `script-src` origins. `https` origins only. |
| `csp.extraConnectOrigins` | `[]` | Extra `connect-src` origins. `https` origins only. |

Live Bordfeed template ids (23 Oct 2026): `remote-writing`, `engineering-it`, `growth-marketing-eu`, `customer-support`, `remote-design`, `senior-tech-remote-us`.

An extra CSP origin is an origin, not a URL path. `https://cdn.example.com` is valid. A path, a quote, a semicolon, a space, or a comma is rejected. One leading wildcard label is allowed (`https://*.example.com`).

## Site settings

Admins edit the Site settings global. Editors do not.

| Group | Fields |
| --- | --- |
| (top) | Name (default `Job Board`), tagline, logo (media upload). |
| Theme | Ten color overrides, heading font, body font, radius. See [Theming](theming.md). |
| Board | Title, description, jobs per page (5 to 100, default 20), public detail fields. |
| Post a Job | Enabled (default off), payment link URL, price label (default empty), duration in days (default 30, 1 to 365). See [Post a Job](post-a-job.md). |
| Alerts | Enabled (default off), default frequency (`weekly` or `daily`, default `weekly`), sender name, sender email. See [Job alerts](alerts.md). |
| Showcase | List my board (default off). |

Public detail fields, all on by default: `salary`, `location`, `employmentType`, `workplaceType`, `careerLevel`, `languages`, `categories`, `validThrough`.

`BORDFUL_MARKETING` is not a Site settings field. It is an environment variable, and it is `true` only on bordful.com. See [Deploy](deploy.md).
