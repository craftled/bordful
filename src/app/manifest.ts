import type { MetadataRoute } from "next";

import { MARKETING_DESCRIPTION } from "@/components/marketing/site";

// This route always serves /manifest.webmanifest. Bordful branding is the
// template default. Forks that rebrand replace this file. See src/app/README.md
// for why the icon files are not app-directory file conventions.
export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f5f5f4",
    description: MARKETING_DESCRIPTION,
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "any",
        src: "/marketing/icon.svg",
        type: "image/svg+xml",
      },
      {
        purpose: "any",
        sizes: "180x180",
        src: "/marketing/apple-icon.png",
        type: "image/png",
      },
    ],
    name: "Bordful",
    short_name: "Bordful",
    start_url: "/",
    theme_color: "#161616",
  };
}
