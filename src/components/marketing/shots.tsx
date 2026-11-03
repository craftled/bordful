import { cn } from "@/lib/utils";

import { MarketingImage } from "./marketing-image";

// Screenshots of the running app, captured at 2x. The sizes are fixed so the
// layout holds before the files load.
export const SHOTS = {
  boardDark: {
    height: 1800,
    src: "/marketing/shots/board-dark.png",
    width: 2880,
  },
  boardLight: {
    height: 1800,
    src: "/marketing/shots/board-light.png",
    width: 2880,
  },
  jobLight: {
    height: 1800,
    src: "/marketing/shots/job-light.png",
    width: 2880,
  },
  mobileHome: {
    height: 1688,
    src: "/marketing/shots/mobile-home.png",
    width: 780,
  },
  mobileJob: {
    height: 1688,
    src: "/marketing/shots/mobile-job.png",
    width: 780,
  },
} as const;

export type ShotName = keyof typeof SHOTS;

// A desktop screenshot with Paper's hairline and soft drop shadow.
export function Shot({
  alt,
  className,
  name,
}: {
  alt: string;
  className?: string;
  name: ShotName;
}) {
  const shot = SHOTS[name];

  return (
    <MarketingImage
      alt={alt}
      className={cn(
        "bg-card ring-line-strong max-w-none rounded-xl object-cover object-top shadow-[0_30px_60px_-24px_rgb(0_0_0/35%)] ring-1",
        className
      )}
      decoding="async"
      height={shot.height}
      loading="lazy"
      src={shot.src}
      width={shot.width}
    />
  );
}

// The board home in the viewer's own theme: light by default, dark when the
// page is dark.
export function ThemedBoardShot({
  alt,
  className,
}: {
  alt: string;
  className?: string;
}) {
  return (
    <>
      <Shot
        alt={alt}
        className={cn(className, "dark:hidden")}
        name="boardLight"
      />
      <Shot
        alt={alt}
        className={cn(className, "hidden dark:block")}
        name="boardDark"
      />
    </>
  );
}

// A phone screenshot inside a plain device frame drawn in CSS.
export function PhoneShot({
  alt,
  className,
  name,
}: {
  alt: string;
  className?: string;
  name: "mobileHome" | "mobileJob";
}) {
  const shot = SHOTS[name];

  return (
    <div
      className={cn(
        "bg-card ring-line-strong shrink-0 rounded-[30px] p-[5px] shadow-[0_24px_30px_rgb(0_0_0/25%)] ring-1",
        className
      )}
    >
      <MarketingImage
        alt={alt}
        className="bg-surface-sub block h-auto w-full rounded-[25px]"
        decoding="async"
        height={shot.height}
        loading="lazy"
        src={shot.src}
        width={shot.width}
      />
    </div>
  );
}
