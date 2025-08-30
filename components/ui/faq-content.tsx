'use client';

import { ArrowRight, Link as LinkIcon, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { Answer, FAQPage, Question, WithContext } from 'schema-dts';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import config from '@/config';
import { resolveColor } from '@/lib/utils/colors';
import { slugify } from '@/lib/utils/slugify';

// Define the types based on the config
type FAQItem = {
  question: string;
  answer: string;
  isRichText?: boolean;
};

// We're using this interface in the ReadonlyArray type below
// biome-ignore lint/correctness/noUnusedVariables: Type needed for ReadonlyArray type
type FAQCategory = {
  title: string;
  items: FAQItem[];
};

type FAQContentProps = {
  categories: ReadonlyArray<{
    readonly title: string;
    readonly items: ReadonlyArray<{
      readonly question: string;
      readonly answer: string;
      readonly isRichText?: boolean;
    }>;
  }>;
};

export function FAQContent({ categories }: FAQContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Generate a stable ID for each FAQ item
  const getItemId = (categoryTitle: string, question: string) => {
    return `${slugify(categoryTitle)}-${slugify(question)}`;
  };

  // Get the search query from URL if it exists
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
      handleSearch(query);
    }

    // Check for hash in URL for anchor links
    const hash = window.location.hash;
    if (hash) {
      const categoryId = hash.substring(1); // Remove the # character
      setTimeout(() => {
        const element = document.getElementById(categoryId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });

          // Find and expand the items in this category
          const categoryIndex = categories.findIndex(
            (cat) => slugify(cat.title) === categoryId
          );
          if (categoryIndex !== -1) {
            const category = categories[categoryIndex];
            const itemIds = category.items.map((item) =>
              getItemId(category.title, item.question)
            );
            setExpandedItems(itemIds);
          }
        }
      }, 100);
    }
    // biome-ignore lint/react-hooks/exhaustive-deps: Stable dependencies for FAQ functionality
  }, [searchParams, categories, getItemId, handleSearch]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);

    // If search is empty, collapse all items
    if (!value.trim()) {
      setExpandedItems([]);
      return;
    }

    // Find items that match the search term
    const matchingItems: string[] = [];

    categories.forEach((category) => {
      category.items.forEach((item) => {
        const questionMatch = item.question
          .toLowerCase()
          .includes(value.toLowerCase());
        const answerMatch = item.answer
          .toLowerCase()
          .includes(value.toLowerCase());

        if (questionMatch || answerMatch) {
          matchingItems.push(getItemId(category.title, item.question));
        }
      });
    });

    // Expand matching items
    setExpandedItems(matchingItems);

    // Update URL with search query
    if (value.trim()) {
      router.replace(`/faq?q=${encodeURIComponent(value)}`, { scroll: false });
    } else {
      router.replace('/faq', { scroll: false });
    }
  };

  // Handle keyboard navigation
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      setExpandedItems([]);
      router.replace('/faq', { scroll: false });
    }
  };

  // Generate FAQ schema for SEO
  const generateFAQSchema = () => {
    // Create type-safe schema using schema-dts
    const faqSchema: WithContext<FAQPage> = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: categories.flatMap((category) =>
        category.items.map(
          (item) =>
            ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              } as Answer,
            }) as Question
        )
      ),
    };

    return JSON.stringify(faqSchema);
  };

  // Scroll to category - keeping this for potential future use
  // biome-ignore lint/correctness/noUnusedVariables: Function kept for future use
  const _scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, '', `#${categoryId}`);
    }
  };

  // Filter categories based on search term
  const filteredCategories = searchTerm.trim()
    ? categories
        .map((category) => ({
          ...category,
          items: category.items.filter(
            (item) =>
              item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.answer.toLowerCase().includes(searchTerm.toLowerCase())
          ),
        }))
        .filter((category) => category.items.length > 0)
    : categories;

  return (
    <>
      {/* FAQ Schema for SEO */}
      <script
        dangerouslySetInnerHTML={{ __html: generateFAQSchema() }}
        type="application/ld+json"
      />

      {/* Search Bar */}
      <div className="mb-8 w-full">
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            aria-label="Search FAQs"
            className="h-10 pl-9"
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search FAQs..."
            type="text"
            value={searchTerm}
          />
          {searchTerm && (
            <button
              aria-label="Clear search"
              className="-translate-y-1/2 absolute top-1/2 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setSearchTerm('');
                setExpandedItems([]);
                router.replace('/faq', { scroll: false });
              }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* FAQ Content */}
      <div className="space-y-10">
        {filteredCategories.length === 0 ? (
          <div className="py-8 text-center">
            <p className="mb-4 text-zinc-600">
              No results found for &quot;{searchTerm}&quot;
            </p>
            <Button
              onClick={() => {
                setSearchTerm('');
                setExpandedItems([]);
                router.replace('/faq', { scroll: false });
              }}
              size="xs"
              variant="outline"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          filteredCategories.map((category, categoryIndex) => {
            const categoryId = slugify(category.title);
            return (
              <div
                className="space-y-4"
                id={categoryId}
                key={categoryIndex}
                ref={(el) => {
                  categoryRefs.current[categoryId] = el;
                }}
              >
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg text-zinc-900">
                    {category.title}
                  </h2>
                  <button
                    aria-label={`Copy link to ${category.title} section`}
                    className="text-zinc-400 transition-colors hover:text-zinc-600"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/faq#${categoryId}`
                      );
                      // You could add a toast notification here
                    }}
                    title="Copy link to this section"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </button>
                </div>
                <Accordion
                  className="space-y-2"
                  onValueChange={setExpandedItems}
                  type="multiple"
                  value={expandedItems}
                >
                  {category.items.map((item, itemIndex) => {
                    const itemId = getItemId(category.title, item.question);
                    return (
                      <AccordionItem
                        className="overflow-hidden rounded-lg border border-zinc-200 px-4"
                        key={itemIndex}
                        value={itemId}
                      >
                        <AccordionTrigger className="py-4 font-medium text-sm text-zinc-800 hover:no-underline">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-4 text-sm text-zinc-600">
                          {item.isRichText ? (
                            <div className="markdown-content">
                              <ReactMarkdown
                                components={{
                                  // Apply primary color to all links in markdown content
                                  a: ({ ...props }) => (
                                    <a
                                      {...props}
                                      className="underline transition-opacity hover:opacity-80"
                                      style={{
                                        color: resolveColor(
                                          config.ui.primaryColor
                                        ),
                                      }}
                                    />
                                  ),
                                }}
                                remarkPlugins={[remarkGfm, remarkBreaks]}
                              >
                                {item.answer}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            item.answer
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            );
          })
        )}

        {/* Contact Section */}
        <div className="mt-12 border-zinc-200 border-t pt-8 text-center">
          <h2 className="mb-2 font-semibold text-lg text-zinc-900">
            Still have questions?
          </h2>
          <p className="mb-6 text-sm text-zinc-600">
            If you couldn&apos;t find the answer to your question, feel free to
            contact us.
          </p>
          <Button
            asChild
            className="gap-1.5 text-xs"
            size="xs"
            style={{ backgroundColor: resolveColor(config.ui.primaryColor) }}
            variant="primary"
          >
            <Link href="/about">
              Contact
              <ArrowRight aria-hidden="true" className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
