import { Container } from "./container";
import { Section } from "./section";

// Same team, same products as the strip on bordful.com. Plain wordmarks because
// their logo files are not in this repo.
const PRODUCTS = [
  { href: "https://bestwriting.com/", name: "Best Writing" },
  { href: "https://marketful.com/", name: "Marketful" },
  { href: "https://pynions.com/", name: "Pynions" },
  { href: "https://uithings.com/", name: "UI Things" },
  { href: "https://growthlog.co/", name: "Growthlog" },
] as const;

export function ProductStrip() {
  return (
    <Section className="py-8 md:py-10" testId="marketing-product-strip">
      <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="flex flex-col gap-1 md:w-[280px] md:shrink-0">
          <h2 className="text-foreground text-[15px] leading-5 font-medium">
            Built for makers and founders
          </h2>
          <p className="text-muted-foreground text-[13px] leading-[19px]">
            From the team behind these indie products
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8">
          {PRODUCTS.map((product) => (
            <li key={product.href}>
              <a
                className="text-muted-foreground hover:text-foreground rounded-sm text-[16px] leading-6 font-medium tracking-[-0.015em]"
                href={product.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                {product.name}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
