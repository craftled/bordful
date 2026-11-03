import { geistMono, geistSans } from "@/theme/fonts";

// Same self-hosted Geist faces as the board, so font-sans and font-mono
// resolve inside the marketing frame too.
export const marketingFontVariables = `${geistSans.variable} ${geistMono.variable}`;
