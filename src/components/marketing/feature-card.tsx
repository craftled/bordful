import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Card className="bg-background/50 gap-3 rounded-lg py-5 shadow-none">
      <CardHeader className="px-5">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground px-5 text-sm">
        {description}
      </CardContent>
    </Card>
  );
}
