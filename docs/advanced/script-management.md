---
title: Script Management & Analytics
description: Configure and optimize script loading and analytics integration in your Bordful job board.
lastUpdated: "2025-05-22"
---

Bordful uses Next.js's built-in Script component for optimal script loading and performance, allowing you to integrate analytics, tracking, and third-party services with minimal performance impact.

## Key Features

- Optimized script loading with Next.js Script component
- Multiple loading strategies for different use cases
- Support for all script attributes and properties
- Pre-configured analytics integration
- Non-blocking script loading for optimal performance

## Configuration

Scripts can be configured in `config/config.ts`:

```typescript
scripts: {
  head: [
    // Scripts to load in the <head> section
    {
      src: "your-script-url",
      strategy: "afterInteractive", // or "beforeInteractive", "lazyOnload"
      attributes: {
        // Additional script attributes
        "data-custom": "value",
        defer: "", // Boolean attributes should use empty string
      },
    },
  ],
  body: [
    // Scripts to load at the end of <body>
  ],
}
```

## Loading Strategies

Next.js provides three loading strategies for scripts, allowing you to optimize performance based on each script's priority:

### 1. `beforeInteractive`

Scripts loaded with this strategy will execute before the page becomes interactive:

- **Use for**: Critical scripts that must load before page interaction
- **Examples**: Polyfills, core functionality, critical user experience scripts
- **Performance Impact**: Can delay page interactivity, use sparingly
- **Implementation**:

```typescript
scripts: {
  head: [
    {
      src: "https://polyfill.io/v3/polyfill.min.js",
      strategy: "beforeInteractive",
      attributes: {
        "data-features": "IntersectionObserver",
      },
    },
  ],
}
```

### 2. `afterInteractive` (Default)

Scripts loaded with this strategy will execute after the page becomes interactive:

- **Use for**: Analytics, tracking scripts, non-critical functionality
- **Examples**: Google Analytics, Umami, Plausible, Tag Manager
- **Performance Impact**: Minimal impact on initial page load
- **Implementation**:

```typescript
scripts: {
  head: [
    {
      src: "https://analytics.example.com/script.js",
      strategy: "afterInteractive", // This is the default
      attributes: {
        "data-website-id": "your-website-id",
        defer: "",
      },
    },
  ],
}
```

### 3. `lazyOnload`

Scripts loaded with this strategy will load during browser idle time:

- **Use for**: Low-priority scripts, widgets, social media embeds
- **Examples**: Chat widgets, feedback forms, social share buttons
- **Performance Impact**: Minimal to none, loads only when browser is idle
- **Implementation**:

```typescript
scripts: {
  body: [
    {
      src: "https://chat-widget.example.com/embed.js",
      strategy: "lazyOnload",
      attributes: {
        async: "",
        "data-widget-id": "your-widget-id",
      },
    },
  ],
}
```

## Script Attributes

You can add any HTML script attributes using the `attributes` object:

```typescript
attributes: {
  defer: "",     // Boolean attributes use empty string
  async: "",     // Boolean attributes use empty string
  "data-id": "xxx",  // Regular attributes use values
  id: "my-script",
  crossorigin: "anonymous",
  integrity: "sha384-...",
  // ... any valid script attribute
}
```

## Analytics Integration

Bordful comes pre-configured for Umami Analytics, but you can easily integrate other analytics platforms:

### Umami Analytics

```typescript
scripts: {
  head: [
    {
      src: "https://analytics.yourdomain.com/script.js",
      strategy: "afterInteractive",
      attributes: {
        "data-website-id": "your-umami-id",
        defer: "",
      },
    },
  ],
}
```

### Google Analytics

```typescript
scripts: {
  head: [
    {
      src: "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX",
      strategy: "afterInteractive",
      attributes: {
        async: "",
      },
    },
    {
      // Inline script for Google Analytics
      strategy: "afterInteractive",
      dangerouslySetInnerHTML: {
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `,
      },
    },
  ],
}
```

### Plausible Analytics

```typescript
scripts: {
  head: [
    {
      src: "https://plausible.io/js/script.js",
      strategy: "afterInteractive",
      attributes: {
        "data-domain": "yourdomain.com",
        defer: "",
      },
    },
  ],
}
```

## Implementation Details

The script configuration is processed by the `ScriptLoader` component in `components/analytics/script-loader.tsx`, which:

1. Reads the script configuration from `config.ts`
2. Renders `next/script` components with the appropriate parameters
3. Places scripts in either the head or body based on configuration
4. Applies the specified loading strategy and attributes

Example implementation:

```tsx
// Example simplified ScriptLoader component
import Script from 'next/script';
import { config } from '@/config';

export function ScriptLoader() {
  return (
    <>
      {/* Head scripts */}
      {config.scripts?.head?.map((script, i) => (
        <Script
          key={`head-script-${i}`}
          src={script.src}
          strategy={script.strategy || 'afterInteractive'}
          {...script.attributes}
          dangerouslySetInnerHTML={script.dangerouslySetInnerHTML}
        />
      ))}

      {/* Body scripts (rendered at the end of the document) */}
      {config.scripts?.body?.map((script, i) => (
        <Script
          key={`body-script-${i}`}
          src={script.src}
          strategy={script.strategy || 'lazyOnload'}
          {...script.attributes}
          dangerouslySetInnerHTML={script.dangerouslySetInnerHTML}
        />
      ))}
    </>
  );
}
```

## Best Practices

1. **Use the Appropriate Strategy**: Choose the right loading strategy based on the script's purpose and priority
2. **Minimize `beforeInteractive` Scripts**: These can delay page interactivity
3. **Use Empty String for Boolean Attributes**: For attributes like `async` or `defer`, use empty string (`""`)
4. **Separate Head and Body Scripts**: Place critical scripts in `head` array, non-critical in `body` array
5. **Include Version Numbers**: For scripts that support versioning, include the version in the URL for better caching
- **Content Security Policy:** Bordful sends a strict CSP from `next.config.ts`. When you add a script from a new domain (for example Google Analytics or Plausible), add that origin to `script-src` and `connect-src` in `next.config.ts`, otherwise the browser will block it.

## Advanced Usage

### Inline Scripts

For inline scripts that don't have a source URL:

```typescript
scripts: {
  head: [
    {
      strategy: "afterInteractive",
      dangerouslySetInnerHTML: {
        __html: `
          console.log('Hello from inline script');
          // Your custom JavaScript here
        `,
      },
    },
  ],
}
```

### Conditional Loading

You can conditionally load scripts based on environment variables:

```typescript
scripts: {
  head: [
    // Only load in production
    ...(process.env.NODE_ENV === 'production' ? [
      {
        src: "https://analytics.example.com/script.js",
        strategy: "afterInteractive",
      }
    ] : []),
  ],
}
```

## Related Documentation

- [Analytics Integration](/docs/integrations/analytics-integration.md)
- [Performance Optimization](/docs/advanced/performance-optimization.md)
- [Next.js Script Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/scripts) 