import { Container } from "./container";

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
    <section
      className="border-border border-y py-12"
      data-testid="marketing-product-strip"
    >
      <Container className="flex flex-col items-center gap-8">
        <div className="space-y-1 text-center">
          <h2 className="font-semibold text-lg tracking-tight">
            Built for makers and founders
          </h2>
          <p className="text-muted-foreground text-sm">
            From the team behind these indie products
          </p>
        </div>
        <ul className="grid w-full grid-cols-2 items-center gap-x-8 gap-y-6 text-center sm:grid-cols-3 md:grid-cols-5">
          {PRODUCTS.map((product) => (
            <li key={product.href}>
              <a
                className="font-semibold text-lg text-muted-foreground tracking-tight hover:text-foreground focus-visible:rounded-sm focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4"
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
    </section>
  );
}
