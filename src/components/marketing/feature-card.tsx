import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Card className="gap-3 rounded-lg bg-background/50 py-5 shadow-none">
      <CardHeader className="px-5">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-5 text-muted-foreground text-sm">
        {description}
      </CardContent>
    </Card>
  );
}
