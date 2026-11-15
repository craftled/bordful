import { Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="mb-4 text-4xl font-bold">404</h1>
      <h2 className="mb-6 text-2xl font-semibold">Page Not Found</h2>
      <p className="text-muted-foreground mb-8 text-center">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Link href="/">
        <Button>
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
