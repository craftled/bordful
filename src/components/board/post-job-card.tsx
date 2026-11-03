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
      className="border-border bg-background rounded-lg border p-4"
    >
      <h2 className="text-base font-semibold" id={titleId}>
        Hiring? Post your job
      </h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Reach candidates browsing this board.
      </p>
      <Link
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 inline-flex h-9 w-full items-center justify-center rounded-md px-4 text-sm font-medium"
        href="/post"
      >
        {priceLabel ? `Post a job (${priceLabel})` : "Post a job"}
      </Link>
      <p className="text-muted-foreground mt-2 text-center text-xs">
        {durationDays}-day listing
      </p>
    </section>
  );
}
