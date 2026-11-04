# Theming

Defaults live in `src/theme/tokens.ts`. Site settings, Theme, overrides them. Empty color fields keep the default. Saving applies on the next page load. You do not redeploy.

Dark mode is not part of the board theme. The marketing site styling is separate and only used on bordful.com (`BORDFUL_MARKETING=true`).

## Colors

Ten keys, each `#rrggbb`:

| Key | Default |
| --- | --- |
| `background` | `#f5f5f4` |
| `foreground` | `#161616` |
| `primary` | `#161616` |
| `primaryForeground` | `#ffffff` |
| `muted` | `#f7f7f6` |
| `mutedForeground` | `#5c5c5c` |
| `accent` | `#f0f0ef` |
| `accentForeground` | `#161616` |
| `border` | `#e4e4e3` |
| `ring` | `#161616` |

Each color field shows the value, a swatch, and Reset to default. Paired fields show a contrast hint: background with foreground, primary with primary foreground, muted with muted foreground, and accent with accent foreground. The hint reads "Low contrast" when the ratio is below 4.5. Border and ring have no pair.

## Fonts

Heading and body each take one stack:

| Id | Stack |
| --- | --- |
| `system` | `system-ui, sans-serif` |
| `sans` | Geist Sans, then `ui-sans-serif, system-ui, sans-serif` |
| `serif` | IBM Plex Serif, then `Georgia, serif` |
| `mono` | Geist Mono, then `ui-monospace, Menlo, monospace` |

Geist Sans, Geist Mono and IBM Plex Serif are self-hosted with `next/font` (`src/theme/fonts.ts`). The default for both is `sans`.

## Radius and logo

Radius is in rem. The default is `0.5`. The admin field accepts 0 to 2 in steps of `0.125`.

The logo is the Site settings logo upload. It is not a theme color. The header shows it when a file is set.
