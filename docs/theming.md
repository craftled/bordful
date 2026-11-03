# Theming

Defaults live in `src/theme/tokens.ts`. Site settings, Theme, overrides them. Empty color fields keep the default. Saving applies on the next page load. You do not redeploy.

Dark mode is not part of the beta board theme. The marketing site styling is separate and only used on bordful.com (`BORDFUL_MARKETING=true`).

## Colors

Ten keys, each `#rrggbb`:

| Key | Default |
| --- | --- |
| `background` | `#ffffff` |
| `foreground` | `#0a0a0a` |
| `primary` | `#171717` |
| `primaryForeground` | `#fafafa` |
| `muted` | `#f5f5f5` |
| `mutedForeground` | `#737373` |
| `accent` | `#f5f5f5` |
| `accentForeground` | `#171717` |
| `border` | `#e5e5e5` |
| `ring` | `#a3a3a3` |

Each color field shows the value, a swatch, and Reset to default. Paired fields show a contrast hint: background with foreground, primary with primary foreground, muted with muted foreground, and accent with accent foreground. The hint reads "Low contrast" when the ratio is below 4.5. Border and ring have no pair.

## Fonts

Heading and body each take one stack:

| Id | Stack |
| --- | --- |
| `system` | `system-ui, sans-serif` |
| `sans` | `ui-sans-serif, system-ui, sans-serif` |
| `serif` | `ui-serif, Georgia, serif` |
| `mono` | `ui-monospace, Menlo, monospace` |

The default for both is `system`.

## Radius and logo

Radius is in rem. The default is `0.625`. The admin field accepts 0 to 2 in steps of `0.125`.

The logo is the Site settings logo upload. It is not a theme color. The header shows it when a file is set.
