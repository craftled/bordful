import type { ImgHTMLAttributes } from "react";

interface MarketingImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
  height: number;
  src: string;
  width: number;
}

export function MarketingImage({
  alt,
  height,
  width,
  ...props
}: MarketingImageProps) {
  return (
    // biome-ignore lint/performance/noImgElement: SVG is refused by the image optimizer, and /marketing is outside images.localPatterns
    <img {...props} alt={alt} height={height} width={width} />
  );
}
