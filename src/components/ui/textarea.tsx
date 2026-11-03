import type * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "border-line-strong bg-card text-foreground placeholder:text-subtle focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex field-sizing-content min-h-16 w-full rounded-lg border px-2.5 py-2 text-[13px] leading-5 transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-slot="textarea"
      {...props}
    />
  );
}

export { Textarea };
