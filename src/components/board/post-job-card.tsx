import Link from "next/link";
import { useId } from "react";

// Callers render this only when Site settings enable Post a Job.
export function PostJobCard({
  priceLabel,
  durationDays,
}: {
  priceLabel: string;
  durationDays: number;
}) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="bg-card ring-line flex flex-col gap-2.5 rounded-[14px] p-4 shadow-xs ring-1"
    >
      <h2 className="text-[13px] leading-[18px] font-medium" id={titleId}>
        Hiring? Post your job
      </h2>
      <p className="text-muted-foreground text-[12px] leading-[17px]">
        Reach candidates browsing this board.
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-7 items-center justify-center rounded-[6px] px-2.5 text-[13px] font-medium"
          href="/post"
        >
          {priceLabel ? `Post a job (${priceLabel})` : "Post a job"}
        </Link>
        <p className="text-subtle text-[12px]">{durationDays}-day listing</p>
      </div>
    </section>
  );
}
