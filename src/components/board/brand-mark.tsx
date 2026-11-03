import { BriefcaseBusiness } from "lucide-react";

const BORDFUL_MARK_SRC = "/marketing/logos/bordful.svg";

// Shown when Site settings has no logo, so a fresh board still has a mark.
// bordful.com (marketing mode) shows the Bordful mark, as Paper draws it.
export function BrandMark({ bordful = false }: { bordful?: boolean }) {
  if (bordful) {
    return (
      // biome-ignore lint/performance/noImgElement: a 20px static mark
      <img
        alt=""
        className="size-5 shrink-0 dark:invert"
        data-testid="bordful-mark"
        height={20}
        src={BORDFUL_MARK_SRC}
        width={20}
      />
    );
  }

  return (
    <span className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-[5px]">
      <BriefcaseBusiness aria-hidden="true" className="size-3" />
    </span>
  );
}
