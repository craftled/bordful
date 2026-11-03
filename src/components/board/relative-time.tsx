"use client";

export function RelativeTime({
  className,
  iso,
  label,
  title,
}: {
  className?: string;
  iso: string;
  label: string;
  title?: string;
}) {
  return (
    <time className={className} dateTime={iso} title={title}>
      {label}
    </time>
  );
}
