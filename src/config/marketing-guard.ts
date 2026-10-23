import { notFound } from "next/navigation";

import { isMarketingEnabled } from "./flags";

export function assertMarketingEnabled(): void {
  if (!isMarketingEnabled()) {
    notFound();
  }
}
