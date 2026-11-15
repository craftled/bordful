---
title: Customization Guide
description: Comprehensive guide to customizing and styling your Bordful job board, including Tailwind CSS configuration, script management, and data source customization.
lastUpdated: "2025-05-22"
---

# Customization Guide

Bordful is designed to be highly customizable, allowing you to tailor your job board to match your brand identity and specific requirements. This document covers the main customization options, including styling, script management, and data source customization.

## Styling

Bordful uses Tailwind CSS for styling, providing a flexible and consistent design system. The main configuration files are:

### Main Configuration Files

- **`app/globals.css`**: Tailwind CSS 4 entry point. It imports Tailwind, loads the typography plugin, and holds the theme (`@theme`), custom utilities and global styles. There is no `tailwind.config.ts`.
- **`components/*`**: Individual component styles and Tailwind composition

### Tailwind Configuration

Tailwind CSS 4 is configured in CSS. Add theme values to the `@theme` block in `app/globals.css`; each variable becomes utilities (for example `--color-primary` gives `bg-primary`, `text-primary`):

```css
/* app/globals.css */
@import 'tailwindcss';

@plugin '@tailwindcss/typography';

@theme {
  --color-primary: #0070f3;
  --color-primary-50: #f0f7ff;
  --color-secondary: #7928ca;
  --font-sans: var(--font-geist-sans), var(--font-inter), system-ui, sans-serif;
}
```

Tailwind 4 finds class names in your source files automatically, so there is no `content` list to maintain.

### Global Styles

The `app/globals.css` file contains global styles and CSS variables:

```css
@import 'tailwindcss';

:root {
  /* CSS variables for theme */
  --primary: #0070f3;
  --secondary: #7928ca;
  --background: #ffffff;
  --foreground: #000000;
  /* ... other variables */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #000000;
    --foreground: #ffffff;
    /* ... other dark mode variables */
  }
}

/* Global styles */
body {
  @apply bg-background text-foreground;
}

/* ... other global styles */
```

### Component Customization

To customize specific components, you can modify their individual files in the `components/` directory. Bordful uses a combination of Tailwind CSS and Shadcn UI components, which are highly customizable.

For example, to customize the job card appearance:

```tsx
// components/jobs/JobCard.tsx
<div className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800">
  {/* ... component content */}
</div>
```

### Adding Custom CSS

While Tailwind CSS handles most styling needs, you can add custom CSS in several ways:

1. **Using Tailwind's `@apply`** directive in global.css:

```css
/* In app/globals.css */
@layer components {
  .custom-button {
    @apply px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600;
  }
}
```

2. **Inline styles** for component-specific styling:

```tsx
<div style={{ backgroundImage: `url(${backgroundImage})` }}>
  {/* Content */}
</div>
```

3. **CSS Modules** for component-scoped styles:

Create a `ComponentName.module.css` file next to your component and import it:

```css
/* Button.module.css */
.button {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  background-color: var(--primary);
  color: white;
}
```

```tsx
import styles from './Button.module.css';

export function Button() {
  return <button className={styles.button}>Click Me</button>;
}
```

## Script Management

Bordful provides a flexible system for adding analytics, tracking, or any third-party scripts using Next.js's built-in Script component. Scripts can be easily configured in `config/config.ts`:

### Script Configuration

```typescript
// config/config.ts
scripts: {
  head: [
    // Scripts to be loaded in <head>
    {
      src: "https://analytics.com/script.js",
      strategy: "afterInteractive",
      attributes: {
        "data-website-id": "xxx",
        defer: ""  // Boolean attributes should use empty string
      }
    }
  ],
  body: [
    // Scripts to be loaded at end of <body>
    {
      src: "https://widget.com/embed.js",
      strategy: "lazyOnload",
      attributes: {
        async: ""  // Boolean attributes should use empty string
      }
    }
  ]
}
```

### Loading Strategies

Next.js provides three loading strategies for scripts:

1. **`beforeInteractive`**: Loads and executes before the page becomes interactive
   - Use for critical scripts that must load first
   - Example: Polyfills, core functionality that's needed immediately
   - Note: This blocks page interactivity, so use sparingly

2. **`afterInteractive`** (recommended for analytics): Loads after the page becomes interactive
   - Best for analytics and tracking scripts
   - Example: Google Analytics, Umami, Plausible
   - Doesn't block page loading but still loads early enough to track user behavior

3. **`lazyOnload`**: Loads during idle time
   - Use for non-critical scripts
   - Example: Chat widgets, social media embeds
   - Loads last to prioritize page performance

### Example: Adding Analytics

To add Umami Analytics:

```typescript
// config/config.ts
scripts: {
  head: [
    {
      src: "https://analytics.example.com/script.js",
      strategy: "afterInteractive",  // Best for analytics
      attributes: {
        "data-website-id": "your-website-id",
        defer: ""  // Boolean attributes should use empty string
      }
    }
  ]
}
```

### Script Attributes

You can add any HTML script attributes using the `attributes` object:

```typescript
attributes: {
  defer: "",     // Boolean attributes use empty string
  async: "",     // Boolean attributes use empty string
  "data-id": "xxx",  // Regular attributes use values
  id: "my-script",
  crossorigin: "anonymous"
  // ... any valid script attribute
}
```

This implementation:
- Uses Next.js best practices for script loading
- Provides type safety with TypeScript
- Allows easy configuration in one place
- Supports any third-party script
- Optimizes performance with proper loading strategies

## Data Source Customization

Bordful's default implementation uses Airtable as the data source. However, you can customize the data source to use your preferred database or API.

### Modifying the Data Source

To use a different data source:

1. Modify `lib/db/airtable.ts` or create a new data provider (e.g., `lib/db/postgres.ts`)
2. Implement the same interface for job data
3. Update the data fetching methods to use your new data source

### Example: Creating a Custom Data Provider

```typescript
// lib/db/custom-provider.ts
import { Job, JobWithDetail } from '@/types';

export async function getJobs(): Promise<Job[]> {
  // Implement your custom data fetching logic
  // Must return the same data structure as Airtable provider
  const response = await fetch('https://your-api.com/jobs');
  const data = await response.json();
  
  // Transform the data to match the Job type
  return data.map(item => ({
    id: item.id,
    title: item.title,
    company: item.company,
    // ... other job properties
  }));
}

export async function getJobBySlug(slug: string): Promise<JobWithDetail | null> {
  // Implement your custom data fetching logic for a single job
  const response = await fetch(`https://your-api.com/jobs/${slug}`);
  
  if (!response.ok) {
    return null;
  }
  
  const data = await response.json();
  
  // Transform the data to match the JobWithDetail type
  return {
    id: data.id,
    title: data.title,
    // ... other job detail properties
  };
}

// Implement other required methods
```

### Required Data Methods

Your custom data provider should implement the following methods:

1. `getJobs()`: Get all jobs for listing pages
2. `getJobBySlug(slug)`: Get a single job by its slug
3. `getJobById(id)`: Get a single job by its ID
4. `getFeaturedJobs(limit?)`: Get featured jobs
5. `getSimilarJobs(job, limit?)`: Get jobs similar to a given job
6. `searchJobs(query)`: Search jobs by keyword

## Theme Customization

Bordful allows you to customize the theme colors and other design elements through the configuration file:

```typescript
// config/config.ts
theme: {
  // Primary color (used for buttons, links, etc.)
  primaryColor: "#0070f3",
  
  // Secondary color
  secondaryColor: "#7928ca",
  
  // Background colors
  backgroundColor: "#ffffff",
  backgroundColorDark: "#000000",
  
  // Text colors
  textColor: "#000000",
  textColorDark: "#ffffff",
  
  // Border radius
  borderRadius: "0.5rem",
  
  // Font settings
  fontFamily: "'Inter', sans-serif",
  
  // Custom CSS
  customCSS: `
    .custom-element {
      background: linear-gradient(to right, var(--primary), var(--secondary));
    }
  `,
}
```

## Component-Specific Customization

Bordful provides dedicated documentation for customizing specific components:

- [Navigation Customization](/docs/guides/navigation.md) - Customize the navigation bar
- [Footer Customization](/docs/guides/footer.md) - Customize the footer
- [Hero Section Customization](/docs/guides/hero-section.md) - Customize the hero section
- [Pricing Page Customization](/docs/guides/pricing.md) - Customize the pricing plans
- [Contact Page Customization](/docs/guides/contact.md) - Customize the contact page

## Best Practices

1. **Use the Configuration System**: Whenever possible, use the configuration system rather than modifying the source code directly. This makes it easier to maintain your customizations when updating to new versions.

2. **Create a Theme**: Define a consistent color palette and typography system in your Tailwind configuration to ensure visual consistency.

3. **Component Consistency**: When customizing components, maintain consistency with the rest of the application's design language.

4. **Performance Considerations**: Be mindful of performance when adding third-party scripts or custom CSS. Prioritize critical resources and defer non-essential ones.

5. **Mobile Responsiveness**: Always test your customizations on multiple devices to ensure they look good on all screen sizes.

## Troubleshooting

### Common Styling Issues

1. **Tailwind Classes Not Applied**: Tailwind 4 scans source files automatically but skips files listed in `.gitignore`. Build class names from complete strings, not concatenated fragments.

2. **Custom Colors Not Working**: Check that the color is defined as a `--color-*` variable in the `@theme` block of `app/globals.css`.

3. **Dark Mode Issues**: Ensure you're using the correct dark mode variant (`dark:`) and that dark mode is properly configured in Tailwind.

### Script Loading Problems

1. **Script Not Loading**: Check the browser console for errors and ensure the script URL is correct.

2. **Script Loading Too Early/Late**: Adjust the loading strategy (`beforeInteractive`, `afterInteractive`, `lazyOnload`) as needed.

3. **Script Conflicts**: If scripts conflict with each other, try changing the loading order or strategy.

## Examples

### Custom Color Scheme Example

```css
/* app/globals.css */
@theme {
  --color-primary: #8b5cf6; /* Purple */
  --color-primary-50: #f5f3ff;
  --color-secondary: #ec4899; /* Pink */
}
```

### Custom Font Example

```css
/* app/globals.css */
@theme {
  --font-sans: 'Poppins', sans-serif;
  --font-heading: 'Montserrat', sans-serif;
}
```

```css
/* app/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Montserrat:wght@700&display=swap');

/* Then use them in your components */
h1, h2, h3, h4, h5, h6 {
  @apply font-heading;
}

body {
  @apply font-sans;
}
```

## Related Documentation

- [Configuration Guide](/docs/getting-started/configuration.md)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Next.js Script Component](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [Shadcn UI Customization](https://ui.shadcn.com/docs/theming)
- [Airtable Integration](/docs/integrations/airtable.md) 