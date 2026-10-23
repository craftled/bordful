import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  description: "That page is not on this site.",
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center px-4 pt-32 text-center">
      <h1 className="font-medium text-4xl">404</h1>
      <p className="mt-3 text-muted-foreground">
        Sorry, we could not find that page.
      </p>
      <Button asChild className="mt-6 rounded-full">
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}
