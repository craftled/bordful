import type * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "border-line-strong bg-card text-foreground selection:bg-primary selection:text-primary-foreground placeholder:text-subtle file:text-foreground hover:border-subtle h-8 w-full min-w-0 rounded-lg border px-2.5 text-[13px] leading-[18px] transition-[color,box-shadow] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[13px] file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:border-ring focus-visible:ring-tag focus-visible:ring-4",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}

export { Input };
