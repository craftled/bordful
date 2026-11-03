import Link from "next/link";

import { buildCompanyPath } from "@/lib/board/paths";

export function CompanyCard({
  count,
  logoUrl = null,
  name,
  slug,
}: {
  count: number;
  logoUrl?: string | null;
  name: string;
  slug: string;
}) {
  return (
    <Link
      className="bg-card ring-line hover:ring-line-strong flex h-full items-center gap-3 rounded-[14px] p-[18px] ring-1 transition-shadow"
      href={buildCompanyPath(slug)}
    >
      <span
        aria-hidden="true"
        className="bg-tag text-muted-foreground flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md text-[13px] leading-4 font-semibold"
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
      <span className="flex min-w-0 grow flex-col gap-px">
        <span
          className="text-foreground truncate text-[16px] leading-5 font-medium"
          data-testid="company-name"
        >
          {name}
        </span>
        <span className="text-muted-foreground text-[13px] leading-4">
          {count === 1 ? "1 open role" : `${count} open roles`}
        </span>
      </span>
    </Link>
  );
}
