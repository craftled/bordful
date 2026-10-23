import { Container } from "./container";
import { MarketingImage } from "./marketing-image";
import { Section } from "./section";
import { SectionHeader } from "./section-header";

const stack = [
  {
    description: "React framework for the board and the admin",
    invert: true,
    name: "Next.js",
    src: "/marketing/logos/nextjs.svg",
  },
  {
    description: "Content, admin, and the local API",
    invert: false,
    name: "Payload",
    src: null,
  },
  {
    description: "Jobs, companies, and settings",
    invert: false,
    name: "Postgres",
    src: "/marketing/logos/postgresql.svg",
  },
  {
    description: "Utility-first styling",
    invert: true,
    name: "Tailwind CSS",
    src: "/marketing/logos/tailwindcss.svg",
  },
  {
    description: "Interface primitives",
    invert: true,
    name: "shadcn/ui",
    src: "/marketing/logos/shadcn.svg",
  },
  {
    description: "Deploy and scale the board",
    invert: true,
    name: "Vercel",
    src: "/marketing/logos/vercel.svg",
  },
] as const;

export function TechStack() {
  return (
    <Section>
      <Container>
        <SectionHeader
          description="The 1.0 stack. Postgres holds the data. Payload is the admin. Vercel runs the app."
          title="Built with a modern stack"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stack.map((item) => (
            <div
              className="flex items-start gap-4 rounded-lg border bg-background/50 p-5"
              key={item.name}
            >
              {item.src ? (
                <MarketingImage
                  alt=""
                  className={item.invert ? "marketing-mono h-5 w-5" : "h-5 w-5"}
                  height={20}
                  src={item.src}
                  width={20}
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-sm border font-medium text-[10px]">
                  P
                </span>
              )}
              <div>
                <h3 className="mb-1 font-medium text-sm">{item.name}</h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
