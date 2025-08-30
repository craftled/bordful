import { Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';

export default function JobNotFound() {
  return (
    <main className="container py-16">
      <div className="mx-auto max-w-[640px] text-center">
        <h1 className="mb-4 font-semibold text-2xl">Job Not Found</h1>
        <p className="mb-3 text-gray-600">
          The job posting you&apos;re looking for doesn&apos;t exist, has been
          removed, or has expired.
        </p>
        <p className="mb-8 text-gray-600">
          Companies may remove job listings when positions are filled or no
          longer available.
        </p>
        <Link href="/jobs">
          <Button
            className="gap-1.5 text-xs"
            size="xs"
            style={{
              backgroundColor: resolveColor(config.ui.primaryColor),
            }}
            variant="primary"
          >
            Browse Jobs
            <Search aria-hidden="true" className="ml-1 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </main>
  );
}
