export function SectionHeader({
  description,
  headingLevel = "h2",
  title,
}: {
  description: string;
  headingLevel?: "h1" | "h2";
  title: string;
}) {
  const Heading = headingLevel;

  return (
    <div className="text-center">
      <Heading className="font-medium text-2xl tracking-tight sm:text-3xl">
        {title}
      </Heading>
      <p className="mx-auto mt-4 max-w-[600px] text-balance text-center text-muted-foreground text-sm">
        {description}
      </p>
    </div>
  );
}
