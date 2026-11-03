import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// One cell of the features grid. The grid draws the hairlines between cells.
export function FeatureCard({
  className,
  description,
  icon: Icon,
  title,
}: {
  className?: string;
  description: string;
  icon?: LucideIcon;
  title: string;
}) {
  return (
    <div className={cn("bg-card flex flex-col gap-2 p-6 md:p-8", className)}>
      {Icon ? (
        <span className="bg-tag text-foreground mb-3 flex size-7 items-center justify-center rounded-lg">
          <Icon aria-hidden="true" className="size-3.5" strokeWidth={1.6} />
        </span>
      ) : null}
      <h3 className="text-foreground text-[15px] leading-5 font-medium">
        {title}
      </h3>
      <p className="text-muted-foreground text-[13px] leading-[19px]">
        {description}
      </p>
    </div>
  );
}
