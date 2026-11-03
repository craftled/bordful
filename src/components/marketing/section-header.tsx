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
      <Heading className="text-2xl font-medium tracking-tight sm:text-3xl">
        {title}
      </Heading>
      <p className="text-muted-foreground mx-auto mt-4 max-w-[600px] text-center text-sm text-balance">
        {description}
      </p>
    </div>
  );
}
