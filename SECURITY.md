# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.0.x | Supported |
| 0.2.x (airtable branch) | Security fixes only |

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
- A Bordfeed incident (most checked jobs reported gone) does not unpublish jobs on its own. Leave `BORDFEED_ALLOW_MASS_UNPUBLISH` unset on a normal board. See [Daily sync](docs/bordfeed.md#daily-sync).
- CSP uses a new nonce on each request. No third-party scripts are allowed by default. A third-party script needs the page nonce. Extra `connect-src` origins go in the `csp` options in `bordful.config.ts`. See [Configuration](docs/configuration.md).
- Keep `.env` out of git. `.env.example` holds placeholders only, such as `replace-with-32-plus-random-chars`.