import { cn } from "@/lib/utils";

import { MarketingImage } from "./marketing-image";

// Screenshots of the running app, captured at 2x. The sizes are fixed so the
// layout holds before the files load.
export const SHOTS = {
  boardDark: {
    height: 1800,
    src: "/marketing/shots/board-dark.webp",
    width: 2880,
  },
  boardLight: {
    height: 1800,
    src: "/marketing/shots/board-light.webp",
    width: 2880,
  },
  jobDark: {
    height: 1800,
    src: "/marketing/shots/job-dark.webp",
    width: 2880,
  },
  jobLight: {
    height: 1800,
    src: "/marketing/shots/job-light.webp",
    width: 2880,
  },
  mobileHome: {
    height: 1688,
    src: "/marketing/shots/mobile-home.webp",
    width: 780,
  },
  mobileHomeDark: {
    height: 1688,
    src: "/marketing/shots/mobile-home-dark.webp",
    width: 780,
  },
  mobileJob: {
    height: 1688,
    src: "/marketing/shots/mobile-job.webp",
    width: 780,
  },
  mobileJobDark: {
    height: 1688,
    src: "/marketing/shots/mobile-job-dark.webp",
    width: 780,
  },
  // The board's phone list cut to the search bar and the first three jobs
  // (the filter chips and result count taken out), Paper's 358x296 card.
  mobileListDark: {
    height: 645,
    src: "/marketing/shots/mobile-rows-dark.webp",
    width: 780,
  },
  mobileListLight: {
    height: 645,
    src: "/marketing/shots/mobile-rows-light.webp",
    width: 780,
  },
} as const;

export type ShotName = keyof typeof SHOTS;

// Each light shot and the dark capture of the same screen.
const DARK_OF = {
  boardLight: "boardDark",
  jobLight: "jobDark",
  mobileHome: "mobileHomeDark",
  mobileJob: "mobileJobDark",
  mobileListLight: "mobileListDark",
} as const satisfies Partial<Record<ShotName, ShotName>>;

export type ThemedShotName = keyof typeof DARK_OF;

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
        "bg-card max-w-none rounded-xl object-cover object-top shadow-[0_0_0_1px_var(--shot-ring),0_30px_60px_-24px_var(--shot-shadow)]",
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

// A desktop screenshot in the viewer's own theme: light by default, dark when
// the page is dark.
export function ThemedShot({
  alt,
  className,
  name,
}: {
  alt: string;
  className?: string;
  name: ThemedShotName;
}) {
  return (
    <>
      <Shot alt={alt} className={cn(className, "dark:hidden")} name={name} />
      <Shot
        alt={alt}
        className={cn(className, "hidden dark:block")}
        name={DARK_OF[name]}
      />
    </>
  );
}

// The board home in the viewer's own theme.
export function ThemedBoardShot({
  alt,
  className,
}: {
  alt: string;
  className?: string;
}) {
  return <ThemedShot alt={alt} className={className} name="boardLight" />;
}

// A plain image in the viewer's theme, for crops that carry their own frame.
export function ThemedImage({
  alt,
  className,
  name,
  priority = false,
}: {
  alt: string;
  className?: string;
  name: ThemedShotName;
  priority?: boolean;
}) {
  const light = SHOTS[name];
  const dark = SHOTS[DARK_OF[name]];

  if (priority) {
    return (
      <>
        <picture className="theme-override:hidden">
          {/* The hero is hidden from md up, so desktop needs no screenshot download. */}
          <source
            media="(width >= 48rem)"
            srcSet="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
          />
          <source
            height={dark.height}
            media="(prefers-color-scheme: dark)"
            srcSet={dark.src}
            width={dark.width}
          />
          <MarketingImage
            alt={alt}
            className={className}
            decoding="async"
            fetchPriority="high"
            height={light.height}
            loading="eager"
            src={light.src}
            width={light.width}
          />
        </picture>
        <span className="theme-override:contents hidden">
          <MarketingImage
            alt={alt}
            className={cn(className, "dark:hidden")}
            decoding="async"
            height={light.height}
            loading="lazy"
            src={light.src}
            width={light.width}
          />
          <MarketingImage
            alt={alt}
            className={cn(className, "hidden dark:block")}
            decoding="async"
            height={dark.height}
            loading="lazy"
            src={dark.src}
            width={dark.width}
          />
        </span>
      </>
    );
  }

  return (
    <>
      <MarketingImage
        alt={alt}
        className={cn(className, "dark:hidden")}
        decoding="async"
        height={light.height}
        loading="lazy"
        src={light.src}
        width={light.width}
      />
      <MarketingImage
        alt={alt}
        className={cn(className, "hidden dark:block")}
        decoding="async"
        height={dark.height}
        loading="lazy"
        src={dark.src}
        width={dark.width}
      />
    </>
  );
}

// A phone screenshot inside a plain device frame drawn in CSS, in the viewer's
// theme.
export function PhoneShot({
  alt,
  className,
  imageClassName,
  name,
}: {
  alt: string;
  className?: string;
  /** Overrides the screenshot's sizing, e.g. to crop it to a fixed frame. */
  imageClassName?: string;
  name: "mobileHome" | "mobileJob";
}) {
  return (
    <div
      className={cn(
        "bg-card ring-line-strong shrink-0 rounded-[30px] p-[5px] shadow-[0_24px_30px_rgb(0_0_0/25%)] ring-1",
        className
      )}
    >
      <ThemedImage
        alt={alt}
        className={cn(
          "bg-surface-sub block h-auto w-full rounded-[25px]",
          imageClassName
        )}
        name={name}
      />
    </div>
  );
}
