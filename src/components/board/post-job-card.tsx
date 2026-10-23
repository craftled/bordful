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
      className="rounded-lg border border-border bg-background p-4"
    >
      <h2 className="font-semibold text-base" id={titleId}>
        Hiring? Post your job
      </h2>
      <p className="mt-1 text-muted-foreground text-sm">
        Reach candidates browsing this board.
      </p>
      <Link
        className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-4 font-medium text-primary-foreground text-sm hover:bg-primary/90"
        href="/post"
      >
        {priceLabel ? `Post a job (${priceLabel})` : "Post a job"}
      </Link>
      <p className="mt-2 text-center text-muted-foreground text-xs">
        {durationDays}-day listing
      </p>
    </section>
  );
}
