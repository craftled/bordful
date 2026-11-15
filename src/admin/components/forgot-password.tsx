import { Button } from "@payloadcms/ui";
import { FormHeader } from "@payloadcms/ui/rsc";
import type { AdminViewServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import type { ReactElement } from "react";

const DEPLOY_DOCS =
  "https://github.com/craftled/bordful/blob/main/docs/deploy.md#admin-sign-in";

const commandStyle = {
  background: "var(--color-bg-secondary)",
  borderRadius: "var(--radius-m, 4px)",
  margin: "var(--spacer-4, 1rem) 0",
  overflowWrap: "anywhere",
  padding: "var(--spacer-2, 0.5rem) var(--spacer-3, 0.75rem)",
  whiteSpace: "pre-wrap",
} as const;

// Replaces Payload's forgot-password form. Bordful has no email adapter, so
// that form said a reset email was sent when none ever was.
export function ForgotPassword({
  initPageResult,
}: Pick<AdminViewServerProps, "initPageResult">): ReactElement {
  const { config } = initPageResult.req.payload;
  const loginURL = formatAdminURL({
    adminRoute: config.routes.admin,
    path: config.admin.routes.login,
  });

  return (
    <section data-testid="forgot-password">
      <FormHeader
        description="This board does not send password reset emails. Ask another admin to set a new password for you in Users. If you own this board, run this from a clone of its repository:"
        heading="Reset your password"
      />
      <pre style={commandStyle}>
        <code>bun run bordful reset-password --email you@example.com</code>
      </pre>
      <Button
        buttonStyle="ghost"
        className="forgot-password__back"
        el="anchor"
        newTab
        url={DEPLOY_DOCS}
      >
        How to reset a password
      </Button>
      <Button
        buttonStyle="ghost"
        className="forgot-password__back"
        el="link"
        url={loginURL}
      >
        Back to login
      </Button>
    </section>
  );
}
