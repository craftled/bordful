import type { ReactNode } from "react";

import type { LegalPart } from "@/components/marketing/legal-content";

// Renders a run of legal copy parts: plain text and inline links. Shared by
// the /privacy, /terms and /about pages so the pages render exactly the
// parts the content module (and the agent markdown) describe.
export function LegalParts({
  parts,
  linkClassName = "text-foreground underline underline-offset-4 hover:underline",
}: {
  linkClassName?: string;
  parts: readonly LegalPart[];
}): ReactNode {
  return (
    <>
      {parts.map((part) =>
        typeof part === "string" ? (
          part
        ) : (
          <a
            className={linkClassName}
            href={part.href}
            key={part.href}
            rel={
              part.href.startsWith("mailto:")
                ? undefined
                : "noopener noreferrer"
            }
            target={part.href.startsWith("mailto:") ? undefined : "_blank"}
          >
            {part.label}
          </a>
        )
      )}
    </>
  );
}
