import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { generateBreadcrumbSchema } from '@/lib/utils/metadata';

type BreadcrumbItem = {
  name: string;
  url: string;
};

interface BreadcrumbProps extends React.ComponentPropsWithoutRef<'nav'> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, ...props }, ref) => {
    // Generate schema.org markup
    const schemaMarkup = generateBreadcrumbSchema(items);

    return (
      <>
        {/* Schema.org markup for SEO */}
        <script
          dangerouslySetInnerHTML={{ __html: schemaMarkup }}
          type="application/ld+json"
        />
        <nav aria-label="breadcrumb" ref={ref} {...props} />
      </>
    );
  }
);
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<'ol'>
>(({ className, ...props }, ref) => (
  <ol
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-muted-foreground text-sm sm:gap-2.5',
      className
    )}
    ref={ref}
    {...props}
  />
));
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<'li'>
>(({ className, ...props }, ref) => (
  <li
    className={cn('inline-flex items-center gap-1.5', className)}
    ref={ref}
    {...props}
  />
));
BreadcrumbItem.displayName = 'BreadcrumbItem';

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<'a'> & {
    asChild?: boolean;
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : 'a';

  return (
    <Comp
      className={cn('transition-colors hover:text-foreground', className)}
      ref={ref}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(({ className, ...props }, ref) => (
  <span
    aria-current="page"
    aria-disabled="true"
    className={cn('font-normal text-foreground', className)}
    ref={ref}
    role="link"
    {...props}
  />
));
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) => (
  <li
    aria-hidden="true"
    className={cn('[&>svg]:h-3.5 [&>svg]:w-3.5', className)}
    role="presentation"
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<'span'>) => (
  <span
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    role="presentation"
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

// New server component for generating breadcrumbs from metadata
function ServerBreadcrumb({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  const schemaMarkup = generateBreadcrumbSchema(items);

  return (
    <>
      {/* Schema.org markup for SEO */}
      <script
        dangerouslySetInnerHTML={{ __html: schemaMarkup }}
        type="application/ld+json"
      />
      <nav aria-label="breadcrumb" className={className}>
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-muted-foreground text-xs sm:gap-2.5">
          {items.map((item, index) => {
            const isLastItem = index === items.length - 1;

            return (
              <React.Fragment key={item.url}>
                <li className="inline-flex items-center gap-1.5">
                  {isLastItem ? (
                    <span
                      aria-current="page"
                      aria-disabled="true"
                      className="font-normal text-gray-900"
                      role="link"
                    >
                      {item.name}
                    </span>
                  ) : (
                    <a
                      className="text-gray-500 transition-colors hover:text-foreground"
                      href={item.url}
                    >
                      {item.name}
                    </a>
                  )}
                </li>

                {!isLastItem && (
                  <li
                    aria-hidden="true"
                    className="mx-[-0.25rem] text-gray-300 [&>svg]:h-3.5 [&>svg]:w-3.5"
                    role="presentation"
                  >
                    <ChevronRight />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  ServerBreadcrumb,
};
