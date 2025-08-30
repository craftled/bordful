---
title: Comprehensive FAQ System
description: Documentation for Bordful's feature-rich FAQ page with advanced functionality.
lastUpdated: "2025-05-22"
---

Bordful includes a feature-rich FAQ page with advanced functionality designed to provide a seamless user experience and improved SEO.

## Key Features

- Client-side search with URL persistence
- Rich text support with markdown rendering
- Anchor links for direct navigation to specific categories
- FAQ schema markup for improved SEO
- Copy-to-clipboard feature for section links
- Responsive design with consistent styling

## Configuration

### Page Configuration

In your `config.ts` file, you can customize the FAQ page:

```typescript
faq: {
  // Enable or disable the FAQ page
  enabled: true,
  
  // Show FAQ link in navigation and footer
  showInNavigation: true,
  showInFooter: true,
  
  // Page title and description
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about our job board and services.",
  
  // Categories of FAQs
  categories: [
    {
      title: "General Questions",
      items: [
        {
          question: "What is Bordful?",
          answer: "Bordful is a modern, minimal job board...",
          isRichText: false, // Set to true for markdown support
        },
        // More FAQ items...
      ],
    },
    // More categories...
  ],
},
```

### Route Configuration

The FAQ page is defined in the application's route configuration in `lib/config/routes.ts`:

```typescript
// Route configuration
export const routes: RouteConfig[] = [
  // ... other routes
  {
    path: "/faq",
    name: "FAQ",
  },
  // ... other routes
];
```

This route configuration is used throughout the application for:
- Navigation menu generation
- Breadcrumb navigation
- Active link detection
- URL building

The route system supports both static routes like `/faq` and dynamic routes with parameters (e.g., `/jobs/[slug]`).

## Search Functionality

### Client-Side Search

The FAQ system includes a powerful client-side search feature:

1. **Real-time Filtering**: FAQ items are filtered as users type
2. **URL Persistence**: Search queries are stored in the URL (e.g., `/faq?q=search+term`), making results shareable
3. **Keyboard Navigation**: Users can press Escape to clear the search
4. **Visual Indicators**: Search state is clearly indicated with a clear button and styling

Example implementation:

```typescript
// Example search functionality
const [searchQuery, setSearchQuery] = useState<string>("");

const filteredFAQs = useMemo(() => {
  if (!searchQuery.trim()) return faqCategories;
  
  return faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);
}, [faqCategories, searchQuery]);
```

## Rich Text Support

The FAQ system supports rich text formatting in answers:

1. **Markdown Rendering**: Uses ReactMarkdown to parse and display formatted content
2. **Comprehensive Format Support**: Supports headings, lists, tables, code blocks, and blockquotes
3. **Consistent Styling**: Markdown content is styled to match the rest of the application
4. **Per-Item Configuration**: Each FAQ item can be configured individually with the `isRichText` property

Example markdown in an FAQ answer:

```markdown
## Getting Started

To get started with Bordful:

1. Clone the repository
2. Install dependencies with `bun install`
3. Configure your environment variables

For more detailed instructions, see our [Installation Guide](/docs/getting-started).
```

## Navigation and Accessibility

The FAQ system includes several features to improve navigation and accessibility:

1. **Anchor Links**: Direct navigation to specific categories (e.g., `/faq#general-questions`)
2. **Copy-to-clipboard**: Easily share specific FAQ sections with a copy button
3. **Accordion Interface**: Compact presentation with expand/collapse functionality
4. **ARIA Labels**: Proper accessibility attributes for screen readers
5. **Keyboard Navigation**: Full keyboard support for navigation
6. **Stable IDs**: Reliable expand/collapse functionality with stable IDs

Example anchor link generation:

```typescript
// Generate a stable ID from the category title
function generateCategoryId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

## SEO Optimization

The FAQ system automatically generates structured data for better search engine visibility:

1. **FAQ Schema Markup**: Implements schema.org/FAQPage for rich search results
2. **Improved Visibility**: Questions may appear directly in Google search results
3. **SEO-friendly URLs**: Clean URLs with query parameter support
4. **Meta Data**: Proper page titles and descriptions

Example FAQ schema markup:

```typescript
// Example FAQ schema.org markup
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqCategories.flatMap(category => 
    category.items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  )
};
```

## UI Components

The FAQ system consists of several key components:

1. **FAQPage**: Main container component
2. **SearchBar**: Input field for filtering FAQs
3. **FAQCategory**: Category container with title and anchor
4. **FAQItem**: Individual question and answer with accordion functionality
5. **FAQSchemaMarkup**: Hidden component for SEO structured data

## Extension and Customization

### Adding Custom Styling

You can customize the appearance of the FAQ page by modifying the component styles:

```typescript
// Example custom styling
const CustomFAQCategory = styled(FAQCategory)`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
`;
```

### Integrating with External Data Sources

The FAQ system can be integrated with external data sources:

```typescript
// Example fetching FAQs from an external API
async function fetchFAQs() {
  const response = await fetch('/api/faqs');
  const data = await response.json();
  
  // Transform to match the expected format
  return data.map(category => ({
    title: category.categoryName,
    items: category.questions.map(q => ({
      question: q.title,
      answer: q.content,
      isRichText: q.format === 'markdown'
    }))
  }));
}
```

## Related Documentation

- [Configuration Options](/docs/reference/configuration-options.md)
- [Markdown Support](/docs/guides/markdown-support.md)
- [SEO Optimization](/docs/advanced/seo-optimization.md) 