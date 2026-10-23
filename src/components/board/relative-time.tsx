"use client";

export function RelativeTime({ iso, label }: { iso: string; label: string }) {
  return <time dateTime={iso}>{label}</time>;
}
