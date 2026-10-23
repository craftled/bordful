import { createHash } from "node:crypto";

import { defaultTheme } from "@payloadcms/ui";
import { ResolveThemeOnClient } from "@payloadcms/ui/layouts/Root/ResolveThemeOnClient";
import { expect, test } from "vitest";

import { PAYLOAD_THEME_SCRIPT_SHA256 } from "./build-csp";

test("the CSP hash matches the inline theme script Payload admin renders", () => {
  const element = ResolveThemeOnClient({ serverTheme: defaultTheme });
  const script: string = element.props.dangerouslySetInnerHTML.__html;
  const hash = createHash("sha256").update(script).digest("base64");
  expect(hash).toBe(PAYLOAD_THEME_SCRIPT_SHA256);
});
