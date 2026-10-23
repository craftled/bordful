import { Geist, Geist_Mono, IBM_Plex_Serif } from "next/font/google";

// Self-hosted at build time, so the CSP stays same-origin and no font
// request leaves the server at runtime.
export const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-ibm-plex-serif",
  weight: ["400", "500", "600", "700"],
});

export const FONT_VARIABLE_CLASSES = [
  geistSans.variable,
  geistMono.variable,
  ibmPlexSerif.variable,
].join(" ");
