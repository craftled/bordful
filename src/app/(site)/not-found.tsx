import Link from "next/link";

import { BoardShell } from "@/components/board/board-shell";
import { BOARD_SEARCH_PATH } from "@/lib/board/paths";

export default function NotFound() {
  return (
    <BoardShell fullBleed>
      <div className="mx-auto flex w-full max-w-[1072px] flex-col items-center gap-4 px-4 pt-12 pb-16 text-center md:pt-16 md:pb-[72px]">
        <p className="text-subtle font-mono text-[11px] font-medium tracking-[0.04em] uppercase">
          Error 404
        </p>
        <div className="flex flex-col items-center">
          <p
            aria-hidden="true"
            className="text-foreground text-[64px] leading-[76px] font-medium tracking-[-0.045em] md:text-[88px] md:leading-[106px]"
          >
            404
          </p>
          <h1 className="text-subtle text-[24px] leading-8 font-medium tracking-[-0.03em] md:text-[32px] md:leading-10">
            Page not found.
          </h1>
        </div>
        <p className="text-muted-foreground text-[15px] leading-[18px]">
          The page moved or never existed. Try a search, or start from the
          latest roles.
        </p>
        <search className="mt-2 w-full max-w-[480px]">
          <form action={BOARD_SEARCH_PATH}>
            <input
              aria-label="Search jobs"
              className="bg-card border-line placeholder:text-subtle text-foreground h-11 w-full rounded-[10px] border px-3.5 text-[14px] shadow-xs"
              name="q"
              placeholder="Search jobs by role, company or skill"
              type="search"
            />
          </form>
        </search>
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2 inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-medium"
          href="/"
        >
          Latest jobs
        </Link>
      </div>
    </BoardShell>
  );
}
