# Job alerts

Alerts email matching jobs through Resend. They stay off until you add `RESEND_API_KEY`, set a sender, and enable them in Site settings. Until then, `/alerts` responds 404.

## Turn alerts on

1. Add `RESEND_API_KEY` to the environment. See [Deploy](deploy.md).
2. In Resend, verify the domain you will send from.
3. In Site settings, Alerts, set the sender name and sender email (for example `Example Board` and `alerts@board.example`).
4. Leave the default frequency on `weekly`, or choose `daily`.
5. Enable Alerts.

The From line is the sender name, or the site name when the sender name is empty, and the sender email.

`RESEND_BASE_URL` is optional. Leave it empty to use the Resend API.

## What visitors do

On `/alerts` they enter an email, pick filters, and choose weekly (the default) or daily. If you set the site default to daily, the form selects daily.

Bordful always answers "Check your inbox to confirm your job alerts." It does not say whether that address was already subscribed.

On Vercel, BotID checks each `/alerts` signup before any subscriber write or email. Deep Analysis can be enabled under Firewall, then Rules (Pro or Enterprise). Off Vercel the check is skipped, and the short per-IP window plus the per-email confirmation cooldown still apply. BotID turns on when `NEXT_PUBLIC_VERCEL_ENV` is set, so do not set it by hand off Vercel: the check would fail and every signup would be dropped.

The confirmation email links to `/alerts/confirm`. The visitor must submit the confirm button. Opening the link does not confirm, so a mail scanner that prefetches the URL does not subscribe them.

A signup nobody confirms is deleted after 7 days by the daily `/api/cron/expire` run, and its confirm link stops working. The visitor can sign up again.

## Digests and unsubscribe

`/api/cron/alerts` runs daily at 08:00 UTC. A subscriber receives a digest only when both are true:

- Their period has passed since the last digest, or since they confirmed (7 days for weekly, 1 day for daily).
- At least one new published job matches their filters.

Sample jobs are never emailed. Jobs already covered by an earlier digest are not sent again. A second run in the same period does not send another copy.

Every digest includes a one-click unsubscribe link and says how to change filters: unsubscribe and sign up again. Submitting `/alerts` with an already active address changes nothing. The message also sets `List-Unsubscribe` and `List-Unsubscribe-Post`. Mail clients that support one-click unsubscribe call `POST /alerts/unsubscribe/one-click`. Visitors can also open `/alerts/unsubscribe` and submit the button.

Confirm and unsubscribe pages stay available after you disable alerts, so people can still stop mail. Both pages are `noindex`.

Unsubscribe tokens and confirm tokens are stored as hashes. The unsubscribe token is derived from the subscriber id, the email, and `PAYLOAD_SECRET`. Each digest stores the current hash before it is sent, so the newest email's link works even if the secret or the address changed. Links in older emails stop working after such a change.
