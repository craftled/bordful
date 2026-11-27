import { ChevronRight } from "lucide-react";
import { AppLink as Link } from "@/components/app-link";

export interface BreadcrumbItem {
  href?: string;
  label: string;
}

export function Breadcrumb({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="px-4 pt-6 md:px-10 md:pt-8">
      <ol className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center gap-2 text-[13px] leading-[19px]">
        {items.map((item, index) => {
          const current = index === items.length - 1;

          return (
            <li className="flex items-center gap-2" key={item.label}>
              {index > 0 ? (
                <ChevronRight
                  aria-hidden="true"
                  className="text-subtle size-3 shrink-0"
                  strokeWidth={1.4}
                />
              ) : null}
              {item.href && !current ? (
                <Link
                  className="text-muted-foreground hover:text-foreground rounded-sm underline-offset-4 hover:underline focus-visible:underline"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={current ? "page" : undefined}
                  className={
                    current
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
