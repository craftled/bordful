import { BriefcaseBusiness } from "lucide-react";

// Shown when Site settings has no logo, so a fresh board still has a mark.
export function BrandMark() {
  return (
    <span className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
      <BriefcaseBusiness aria-hidden="true" className="size-4" />
    </span>
  );
}
