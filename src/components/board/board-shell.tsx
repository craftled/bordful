import type { ReactNode } from "react";

// The contract keeps this async so L1 can await data without changing the export.
// biome-ignore lint/suspicious/useAwait: signature is frozen as an async server component
export async function BoardShell({
  children,
}: {
  children: ReactNode;
}): Promise<React.JSX.Element> {
  return <>{children}</>;
}
