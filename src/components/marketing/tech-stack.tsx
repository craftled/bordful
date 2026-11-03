import { cn } from "@/lib/utils";

import { MarketingImage } from "./marketing-image";

// The pieces the 1.0 template is built on or wires up. Payload, Stripe and
// Resend have no logo file in this repo, so they get a lettermark.
const stack = [
  { invert: true, name: "Next.js", src: "/marketing/logos/nextjs.svg" },
  { invert: false, name: "Payload", src: null },
  { invert: false, name: "Postgres", src: "/marketing/logos/postgresql.svg" },
  { invert: true, name: "Vercel", src: "/marketing/logos/vercel.svg" },
  {
    invert: true,
    name: "Tailwind CSS",
    src: "/marketing/logos/tailwindcss.svg",
  },
  { invert: true, name: "shadcn/ui", src: "/marketing/logos/shadcn.svg" },
  { invert: false, name: "Stripe", src: null },
  { invert: false, name: "Resend", src: null },
] as const;

export function TechStack() {
  return (
    <section aria-labelledby="marketing-stack-heading">
      <h2 className="sr-only" id="marketing-stack-heading">
        Built with a modern stack
      </h2>
      {/* Paper's phone strip: a "Built on" label over wrapping name chips. */}
      <div className="border-line flex flex-col gap-3.5 border-b px-4 py-10 md:hidden">
        <p
          aria-hidden="true"
          className="text-subtle font-mono text-[11px] leading-[14px] font-medium tracking-[0.04em] uppercase"
        >
          Built on
        </p>
        <ul className="flex flex-wrap gap-2">
          {stack.map((item) => (
            <li
              className="bg-card ring-line text-muted-foreground rounded-md px-2.5 py-1.5 text-[13px] leading-4 font-medium ring-1 ring-inset"
              key={item.name}
            >
              {item.name}
            </li>
          ))}
        </ul>
      </div>
      <ul className="hidden grid-cols-4 md:grid lg:grid-cols-8">
        {stack.map((item) => (
          <li
            className={cn(
              "border-line flex h-[73px] items-center justify-center gap-[9px] border-r border-b",
              "nth-[4n]:border-r-0 lg:last:border-r-0 lg:nth-[4n]:border-r"
            )}
            key={item.name}
          >
            {item.src ? (
              <MarketingImage
                alt=""
                className={cn(
                  "size-[18px] opacity-85",
                  item.invert && "marketing-mono"
                )}
                height={18}
                src={item.src}
                width={18}
              />
            ) : (
              <span
                aria-hidden="true"
                className="bg-foreground text-background flex size-[18px] items-center justify-center rounded-[4px] text-[10px] leading-none font-medium opacity-85"
              >
                {item.name[0]}
              </span>
            )}
            <span className="text-foreground text-[14px] leading-[18px] font-medium tracking-[-0.01em] opacity-85">
              {item.name}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
