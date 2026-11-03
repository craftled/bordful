import type { MetadataRoute } from "next";

import { resolveServerUrl } from "@/config/server-url";
import { buildRobots } from "@/lib/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return buildRobots(resolveServerUrl());
}
