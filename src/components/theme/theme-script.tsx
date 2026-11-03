import { THEME_STORAGE_KEY } from "./theme-preference";

// Runs before first paint so a pinned light or dark choice never flashes the
// system theme. No choice stored means the page follows the system.
const SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function ThemeScript({ nonce }: { nonce?: string }) {
  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: fixed inline script, no user input
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
      nonce={nonce}
    />
  );
}
