import type { Metadata } from "next";

import { resolveServerUrl } from "@/config/server-url";

import { MARKETING_DESCRIPTION } from "./site";

const title = "Bordful: open-source job board template";

const image = {
  alt: title,
  height: 630,
  url: "/marketing/bordful-job-board-software.png",
  width: 1200,
};

export function marketingLayoutMetadata(enabled: boolean): Metadata {
  if (!enabled) {
    return {};
  }

  return {
    description: MARKETING_DESCRIPTION,
    icons: {
      apple: "/marketing/apple-icon.png",
      icon: "/marketing/icon.svg",
    },
    metadataBase: new URL(resolveServerUrl()),
    openGraph: {
      description: MARKETING_DESCRIPTION,
      images: [image],
      locale: "en_US",
      siteName: "Bordful",
      title,
      type: "website",
    },
    title: {
      default: title,
      template: "%s | Bordful",
    },
    twitter: {
      card: "summary_large_image",
      creator: "@bordful",
      description: MARKETING_DESCRIPTION,
      images: [image.url],
      site: "@bordful",
      title,
    },
  };
}
