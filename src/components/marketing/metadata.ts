import type { Metadata } from "next";

import { resolveServerUrl } from "@/config/server-url";
import { BORDFUL_ICONS } from "@/lib/seo/icons";

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
    icons: BORDFUL_ICONS,
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

// `/` lives in the (site) group, outside the marketing layout, so it takes the
// same card here. The title is absolute: the board layout's template would
// otherwise append the site name.
export function marketingHomeMetadata(): Metadata {
  return {
    ...marketingLayoutMetadata(true),
    alternates: { canonical: "/" },
    title: { absolute: title },
  };
}
