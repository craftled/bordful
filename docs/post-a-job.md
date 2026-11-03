# Post a Job

Post a Job is a Stripe payment link plus a job you publish in the admin. Bordful does not run Stripe Checkout or a webhook.

The page (`/post`) and the nav item stay hidden until you set a payment link and enable Post a Job. With the defaults (`enabled` false, empty link, empty price label), `/post` and `/post/thanks` respond 404.

## Set up the payment link

1. In Stripe, create a payment link. Use test mode first.
2. Add custom fields for job title, company, and apply URL.
3. Set the after-payment redirect to `{your site}/post/thanks` (for example `https://board.example/post/thanks`).
4. In Site settings, Post a Job, paste the link into Payment link URL. The link must be `https`.
5. Set a price label (for example `$99`). The label is display text. Stripe charges whatever the payment link charges.
6. Leave duration at 30 days, or set 1 to 365.
7. Enable Post a Job.

Enabling requires a payment link. After that, the nav item "Post a job" appears, and `/post` shows the price, the duration ("Listed for 30 days"), and a link to the payment URL.

`/post/thanks` is the page visitors see after Stripe redirects them. It is `noindex`.

## Publish the job

When a payment arrives, open the Stripe receipt and create the job in `/admin`:

1. Set Origin to `paid`.
2. Put the Stripe payment id in Payment reference.
3. Fill the listing, including the apply URL from the custom field.
4. Publish it.

Publishing a paid job sets Valid through to the publish time plus `durationDays` (30 days by default).

## Expiry

The expire cron runs daily at 05:30 UTC (`/api/cron/expire`). It unpublishes jobs whose Valid through is in the past. The row stays in the admin as a draft.

To extend a listing, edit Valid through and publish again. A date you set is kept. The hook does not overwrite it with a new 30 day window.

Other origins are not given a duration by this feature. The same cron still unpublishes them when Valid through is set and has passed.
