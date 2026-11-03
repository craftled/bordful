import Link from "next/link";

import { buildCompanyPath } from "@/lib/board/paths";

// Paper's 108px company card: logo and name on top, then the location the
// company hires in on the left and its open role count on the right.
export function CompanyCard({
  count,
  location = null,
  logoUrl = null,
  name,
  slug,
}: {
  count: number;
  location?: string | null;
  logoUrl?: string | null;
  name: string;
  slug: string;
}) {
  return (
    <Link
      className="bg-card ring-line hover:ring-line-strong flex h-full flex-col gap-3 rounded-[14px] p-[18px] ring-1 transition-shadow"
      href={buildCompanyPath(slug)}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="bg-logo-tile text-muted-foreground flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[13px] leading-4 font-semibold"
        >
          {logoUrl ? (
            // biome-ignore lint/performance/noImgElement: a 40px company mark, served as-is
            <img
              alt=""
              className="size-full object-cover"
              height={40}
              loading="lazy"
              src={logoUrl}
              width={40}
            />
          ) : (
            name.trim().charAt(0).toUpperCase()
          )}
        </span>
        <span
          className="text-foreground min-w-0 truncate text-[16px] leading-5 font-medium"
          data-testid="company-name"
        >
          {name}
        </span>
      </span>
      <span className="flex items-center justify-between gap-3 pt-1 text-[13px] leading-4">
        <span className="text-subtle min-w-0 truncate">{location ?? ""}</span>
        <span className="text-foreground shrink-0 font-medium tabular-nums">
          {count === 1 ? "1 open role" : `${count} open roles`}
        </span>
      </span>
    </Link>
  );
}
