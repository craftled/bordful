# Theme

`src/theme/tokens.ts` is the one theme file. It holds the default colors, fonts, and corner radius.

Site Settings in the admin override those defaults. The public layout resolves the settings and writes them as CSS variables.

Dark mode follows the system and uses the fixed Bordful 1.0 dark palette in `src/app/globals.css`. Site Settings colors apply to light mode. Set `data-theme="light"` or `"dark"` on `<html>` to pin one.
