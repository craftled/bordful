# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.0.x beta | Supported |
| 0.1.x (legacy-airtable) | Critical fixes, best effort |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do Not** open a public issue
2. Email security details to support@bordful.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will:
- Acknowledge receipt within 48 hours
- Provide an estimated timeline for a fix
- Keep you updated on the progress

Thank you for helping keep Bordful secure!

## Hardening for self-hosters

- Set `PAYLOAD_SECRET` to 32+ random characters. Mark it Sensitive in your host. Use a different value on each environment.
- Set `CRON_SECRET` and send it as `Authorization: Bearer` on `/api/cron/bordfeed`, `/api/cron/expire`, and `/api/cron/alerts`. See [Deploy](docs/deploy.md).
- The Bordfeed API key is encrypted at rest with `PAYLOAD_SECRET` and hidden from every API read. Alert confirm and unsubscribe tokens are stored as hashes.
- CSP uses a new nonce on each request. No third-party scripts are allowed by default. `csp.extraScriptOrigins` and `csp.extraConnectOrigins` in `bordful.config.ts` are not applied yet: `src/proxy.ts` builds the policy from the nonce only. An origin you add stays blocked until that is wired. When it is, origins must be `https`.
- Keep `.env` out of git. `.env.example` holds placeholders only, such as `replace-with-32-plus-random-chars`.