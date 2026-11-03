import { cn } from "@/lib/utils";

// The shortcut letter Paper prints inside a button. MarketingHotkeys makes the
// key work; the hint itself is hidden from screen readers so the link keeps
// its plain name.
export function Kbd({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "hidden rounded-[4px] px-1 font-mono text-[10px] leading-[15px] font-normal lg:inline-block",
        className
      )}
    >
      {children}
    </span>
  );
}

// Tones for the hint on a filled (primary) button and on an outline button.
export const KBD_ON_PRIMARY = "bg-(--kbd-on-primary) text-primary-foreground";
export const KBD_ON_OUTLINE = "bg-(--kbd-on-outline) text-muted-foreground";
