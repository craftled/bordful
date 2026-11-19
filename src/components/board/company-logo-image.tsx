"use client";

import { useCallback, useState } from "react";

// A company mark that falls back to its letter tile when the image fails
// (a 404, a network error, a CSP block). The read layer already avoids URLs
// that CSP blocks; this is the backstop for everything else.
export function CompanyLogoImage({
  className,
  fallback,
  loading,
  size,
  src,
}: {
  className?: string;
  fallback: string;
  loading?: "eager" | "lazy";
  size: number;
  src: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const fail = useCallback(() => setFailedSrc(src), [src]);

  // An image can fail before hydration attaches onError. decode() rejects
  // for an image that already failed (and, unlike naturalWidth, does not
  // misread an SVG with no intrinsic size), so check once it is in the DOM.
  const check = useCallback(
    (img: HTMLImageElement | null) => {
      if (img?.complete) {
        img.decode().catch(fail);
      }
    },
    [fail]
  );

  if (failedSrc === src) {
    return fallback;
  }

  return (
    // biome-ignore lint/performance/noImgElement: a small company mark, served as-is
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError is a load failure, not a user interaction
    <img
      alt=""
      className={className}
      height={size}
      loading={loading}
      onError={fail}
      ref={check}
      src={src}
      width={size}
    />
  );
}
