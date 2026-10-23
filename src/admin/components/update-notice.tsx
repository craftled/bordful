import type { ServerProps } from "payload";
import type { ReactElement } from "react";

import { hasRole } from "@/access/roles";
import { checkForUpdate } from "@/lib/update-check/check";

const panelStyle = {
  background: "var(--theme-elevation-100, var(--color-bg-secondary))",
  border: "1px solid var(--theme-elevation-150, var(--color-border))",
  borderRadius: "var(--border-radius-m, 4px)",
  color: "var(--theme-text, var(--color-text))",
  marginBottom: "var(--spacer-4, 1rem)",
  padding: "var(--spacer-4, 1rem)",
} as const;

function isStaff(user: ServerProps["user"]): boolean {
  return hasRole(user, "admin") || hasRole(user, "editor");
}

export async function UpdateNotice(
  props: ServerProps
): Promise<ReactElement | null> {
  try {
    if (!isStaff(props.user)) {
      return null;
    }

    const result = await checkForUpdate(props.payload);
    if (!result.isNewer || result.latest === null) {
      return null;
    }

    const { current, latest } = result;
    return (
      <section
        data-current={current}
        data-latest={latest}
        data-testid="update-notice"
        style={panelStyle}
      >
        <p>{`Bordful ${latest} is available. This board runs ${current}.`}</p>
        <p>
          <a
            href={`https://github.com/craftled/bordful/releases/tag/v${latest}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            Release notes
          </a>{" "}
          <a
            href="https://github.com/craftled/bordful/blob/v1/UPGRADING.md"
            rel="noopener noreferrer"
            target="_blank"
          >
            How to upgrade
          </a>
        </p>
      </section>
    );
  } catch {
    return null;
  }
}
