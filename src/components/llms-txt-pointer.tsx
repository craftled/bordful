import { isMarketingEnabled } from "@/config/flags";
import { LLMS_TXT_PATH } from "@/lib/docs/agent-docs-paths";

// The agent-readable llms.txt directive: a hidden link to /llms.txt as the
// first child of <body> on every public page. sr-only means no visual change;
// aria-hidden and tabIndex -1 keep it away from screen reader and keyboard
// users, so the skip link stays the first tab stop.
export function LlmsTxtPointer() {
  if (!isMarketingEnabled()) {
    return null;
  }
  return (
    <div aria-hidden="true" className="sr-only" data-testid="llms-txt-pointer">
      For the complete documentation index, see{" "}
      <a href={LLMS_TXT_PATH} tabIndex={-1}>
        llms.txt
      </a>
      .
    </div>
  );
}
