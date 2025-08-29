---
title: Configuration Guide
description: Learn how to configure and customize your Bordful job board using the flexible configuration system.
lastUpdated: "2025-05-22"
---

# Configuration Guide

Bordful uses a flexible, TypeScript-based configuration system that allows you to customize virtually every aspect of your job board without modifying the core code. This guide explains how to set up and manage your configuration.

## Quick Start

Getting started with Bordful's configuration is simple:

1. Copy the example configuration file:
   ```bash
   cp config/config.example.ts config/config.ts
   ```
2. Customize the `config.ts` file with your settings
3. The app will automatically use your custom configuration

That's it! Your job board will now reflect your custom settings.

## How the Configuration System Works

The configuration system is designed with several key principles in mind:

### Ease of Use

- Simple file copying to get started
- Well-documented options with examples
- TypeScript typing for error prevention

### Flexibility

- Customize everything from site title to component behavior
- Enable/disable features as needed
- Define custom styling and branding

### Maintainability

- Keep your customizations separate from the core code
- Pull updates without losing your settings
- TypeScript ensures type safety

## Configuration Loading Process

When your Bordful job board starts:

1. It first tries to load your custom `config.ts` file
2. If not found, it falls back to `config.example.ts`
3. TypeScript ensures type safety in both cases

## Updating Your Configuration

When pulling updates from the Bordful repository:

1. Your `config.ts` remains untouched, preserving your customizations
2. You might receive updates to `config.example.ts` with new options
3. Check `config.example.ts` for new configuration options
4. Add desired new options to your `config.ts` as needed

## Key Configuration Sections

The configuration file is organized into logical sections for easy navigation:

### Marketing & SEO

```typescript
export const config = {
  // Marketing & SEO
  badge: "The #1 Open Source Tech Job Board",
  title: "Find Your Next Tech Role",
  description: "Browse curated tech opportunities...",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  // ...
}
```

These settings control the main branding elements and SEO metadata for your job board.

### Scripts Configuration

```typescript
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

The scripts section allows you to add analytics, tracking, or any third-party scripts using Next.js's built-in Script component.

### Navigation Configuration

```typescript
nav: {
  title: "JobBoard", // Navigation bar text
  logo: {
    enabled: false, // Set to true to use a custom logo instead of icon + text
    src: "/your-logo.svg", // Path to your logo image
    width: 120, // Width of the logo in pixels
    height: 32, // Height of the logo in pixels
    alt: "Your Company Logo", // Alt text for the logo
  },
  github: {
    show: true, // Show/hide GitHub button
    url: "https://github.com/yourusername/yourrepo",
  },
  linkedin: {
    show: true, // Show/hide LinkedIn button
    url: "https://linkedin.com/company/yourcompany",
  },
  twitter: {
    show: true, // Show/hide Twitter/X button
    url: "https://x.com/yourhandle",
  },
  bluesky: {
    show: true, // Show/hide Bluesky button
    url: "https://bsky.app/profile/yourdomain.com",
  },
  postJob: {
    show: true, // Show/hide Post Job button
    label: "Post a Job", // Button text
    link: "/post", // Button URL
  },
  // Navigation menu with dropdown support
  menu: [
    { label: "Home", link: "/" },
    // Example dropdown menu
    { 
      label: "Jobs", 
      link: "/jobs",
      dropdown: true,
      items: [
        { label: "All Jobs", link: "/jobs" },
        { label: "Job Types", link: "/jobs/types" },
        { label: "Job Locations", link: "/jobs/locations" },
        { label: "Job Levels", link: "/jobs/levels" },
        { label: "Job Languages", link: "/jobs/languages" }
      ]
    },
    { label: "About", link: "/about" },
    { label: "Resources", link: "#", dropdown: true, items: [
      { label: "FAQ", link: "/faq" },
      { label: "Job Alerts", link: "/job-alerts" },
      { label: "RSS Feed", link: "/feed.xml" }
    ]},
  ],
}
```

The navigation section controls the site navigation, including dropdown menus, social links, and the post job button.

### Pricing Configuration

```typescript
pricing: {
  // Enable or disable the pricing page
  enabled: true,
  
  // Show pricing link in navigation
  showInNavigation: true,
  
  // Show pricing link in footer resources
  showInFooter: true,
  
  // Navigation label
  navigationLabel: "Pricing",
  
  // Page title and description
  title: "Simple, Transparent Pricing",
  description: "Choose the plan that's right for your job board needs.",
  
  // Currency symbol
  currencySymbol: "$",
  
  // Payment processing information
  paymentProcessingText: "Payments are processed & secured by Stripe. Price in USD. VAT may apply.",
  
  // Payment method icons to display
  paymentMethods: {
    enabled: true,
    icons: [
      { name: "visa", alt: "Visa" },
      { name: "mastercard", alt: "Mastercard" },
      { name: "amex", alt: "American Express" },
      { name: "applepay", alt: "Apple Pay" },
      { name: "googlepay", alt: "Google Pay" },
      { name: "paypal", alt: "PayPal" },
    ],
  },
  
  // Plans configuration
  plans: [
    {
      name: "Free",
      price: 0,
      billingTerm: "forever",
      description: "Perfect for getting started with basic hiring needs.",
      features: [
        "1 active job posting",
        "Basic job listing",
        "30-day visibility",
        "Standard support",
      ],
      cta: {
        label: "Get Started",
        link: "/post",
        variant: "outline", // Using button variants
      },
      badge: null, // No badge
      highlighted: false, // No highlighted border
    },
    // Additional pricing plans...
  ],
}
```

The pricing section allows you to configure your pricing plans, payment options, and related display settings.

### Contact Page Configuration

```typescript
contact: {
  // Enable or disable the contact page
  enabled: true,

  // Show contact link in navigation
  showInNavigation: true,

  // Show contact link in footer
  showInFooter: true,

  // Navigation label
  navigationLabel: "Contact",

  // Page title and description
  title: "Get in Touch",
  description: "Have questions or feedback? We'd love to hear from you.",
  
  // Support channels section
  supportChannels: {
    title: "Support Channels",
    channels: [
      {
        type: "email",
        title: "Email Support",
        description: "Our support team is available to help you with any questions or issues.",
        buttonText: "Contact via Email",
        buttonLink: "mailto:hello@bordful.com",
        icon: "Mail"
      },
      // Additional support channels...
    ]
  },
  
  // Contact information section
  contactInfo: {
    title: "Contact Information",
    description: "Here's how you can reach us directly.",
    companyName: "Bordful Inc.",
    email: "hello@bordful.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, San Francisco, CA 94105"
  }
}
```

The contact section allows you to configure your contact page settings, support channels, and contact information.

### Currency Configuration

```typescript
currency: {
  // Default currency code used when no currency is specified
  defaultCurrency: "USD" as CurrencyCode,

  // Allowed currencies for job listings
  // This list can include any valid CurrencyCode from lib/constants/currencies.ts
  // Set to null to allow all currencies, or specify a subset
  allowedCurrencies: ["USD", "EUR", "GBP", "BTC", "ETH", "USDT", "USDC"] as CurrencyCode[] | null, // null means all currencies are allowed
}
```

The currency section controls which currencies are available for job listings and sets the default currency.

### UI Configuration

```typescript
ui: {
  // Hero section background color (CSS color value)
  // Can be hex, rgb, hsl, etc. Leave empty for default.
  heroBackgroundColor: "#005450", // Example: light gray background

  // Hero section gradient background
  // Takes precedence over heroBackgroundColor when enabled
  heroGradient: {
    enabled: false, // Set to true to enable gradient background
    type: "linear", // Type of gradient: "linear" or "radial"
    direction: "to right", // For linear gradients: "to right", "to bottom", "45deg", etc.
    // For radial gradients: "circle", "ellipse at center", etc.
    colors: [
      "#005450", // Start color
      "#007a73", // Optional middle color(s)
      "#00a59c", // End color
    ],
    // Optional stops for precise control (0-100%)
    // If not provided, colors will be evenly distributed
    stops: ["0%", "50%", "100%"],
  },

  // Hero section main title color (CSS color value)
  heroTitleColor: "#fff",

  // Hero section subtitle color (CSS color value)
  heroSubtitleColor: "#fff",

  // Hero section background image
  heroBackgroundImage: {
    enabled: false,
  },
}
```

The UI section controls visual aspects of your job board, such as the hero section background, colors, and styling.

## Environment-Aware URLs

The site URL automatically adjusts based on the environment:

1. Uses `NEXT_PUBLIC_APP_URL` if provided in your environment variables
2. Falls back to `localhost:3000` in development
3. Uses the production URL in production

This ensures your job board works correctly in different environments without configuration changes.

## Advanced Configuration

### Customizing Component Behavior

You can customize the behavior of individual components by modifying their configuration options. For example:

```typescript
jobListing: {
  defaultPerPage: 10,
  perPageOptions: [10, 25, 50, 100],
  defaultSort: "newest",
  showFeaturedBadge: true,
  showCompanyLogo: true,
  showSalaryRange: true,
  truncateDescription: {
    enabled: true,
    maxLength: 250,
  }
}
```

### Adding Custom Scripts

For analytics, tracking, or third-party integrations, you can add custom scripts with different loading strategies:

```typescript
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

#### Available Loading Strategies

Next.js provides three loading strategies for scripts:

- **beforeInteractive**: Loads and executes before the page becomes interactive
  - Use for critical scripts that must load first
  - Example: Polyfills, core functionality that's needed immediately
  - Note: This blocks page interactivity, so use sparingly

- **afterInteractive** (recommended for analytics): Loads after the page becomes interactive
  - Best for analytics and tracking scripts
  - Example: Google Analytics, Umami, Plausible
  - Doesn't block page loading but still loads early enough to track user behavior

- **lazyOnload**: Loads during idle time
  - Use for non-critical scripts
  - Example: Chat widgets, social media embeds
  - Loads last to prioritize page performance

## Testing Configuration Changes

After making changes to your configuration:

1. Save the file
2. If you're running the development server, it will automatically reload
3. Verify that your changes appear as expected
4. If you encounter any issues, check the browser console for errors

## Troubleshooting

### Common Issues

1. **Configuration not applying**: 
   - Ensure you've saved the file
   - Check for TypeScript errors
   - Restart the development server

2. **Type errors**:
   - Make sure you're using the correct types
   - Import any required types at the top of your config file
   - Check for typos in property names

3. **Syntax errors**:
   - Ensure all objects and arrays are properly closed
   - Check for missing commas or extra commas
   - Verify quotation marks around strings

## Related Documentation

- [Installation Guide](/docs/getting-started/installation.md)
- [Theming Customization](/docs/guides/theming-customization.md)
- [Navigation & Footer Customization](/docs/guides/navigation.md)
- [Hero Section Customization](/docs/guides/hero-section.md)
- [Pricing Page Customization](/docs/guides/pricing.md)
- [Contact Page Customization](/docs/guides/contact.md)

## Step-by-Step Configuration Workflow

Follow this step-by-step workflow to configure your Bordful job board effectively:

### 1. Initial Setup

1. Copy the example configuration file:
   ```bash
   cp config/config.example.ts config/config.ts
   ```

2. Open the file in your code editor and review the overall structure
3. Start by setting basic information (title, description, URL)

### 2. Basic Branding

Configure your job board's basic branding:

```typescript
// Basic branding
badge: "Open Source Job Board",
title: "Find Your Next Tech Role",
description: "Browse curated tech opportunities from top companies around the world. No sign-up required.",
url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
```

### 3. Hero Section Configuration

The hero section is the prominent banner at the top of your homepage:

```typescript
// Hero section configuration
hero: {
  title: "Find Your Dream Tech Job",
  description: "Browse hundreds of jobs from top companies in tech, design, and marketing.",
  showSearchInput: true,
  searchPlaceholder: "Search jobs, skills, or companies...",
  badge: {
    text: "New Jobs Added Daily",
    variant: "secondary",
  },
},
```

### 4. Configure Navigation and Footer

Set up your site's navigation structure and footer content:

```typescript
// Navigation configuration
nav: {
  title: "Bordful",
  // Configure logo, social links, and menu items
  // See Navigation Configuration section for details
},

// Footer configuration
footer: {
  brand: {
    name: "Bordful",
    description: "The modern job board for tech teams.",
    showLogo: true,
  },
  // Configure footer columns and links
  // See Footer Configuration section for details
},
```

### 5. Job Listing Configuration

Configure how job listings appear and function:

```typescript
// Job listing configuration
jobListing: {
  jobsPerPage: 10,
  defaultSort: "newest",
  showSimilarJobs: true,
  similarJobsCount: 3,
  showExpiredJobs: false,
  // Configure card display options
  // See Job Listing Configuration section for details
},
```

### 6. Filtering System Configuration

Set up the job filtering system:

```typescript
// Filtering configuration
filtering: {
  enabled: true,
  filters: {
    jobTypes: true,
    careerLevels: true,
    remote: true,
    salary: true,
    visa: true,
    languages: true,
  },
  // Configure salary ranges and default filters
  // See Filtering System Configuration section for details
},
```

### 7. UI Customization

Configure the visual appearance of your job board:

```typescript
// UI customization
ui: {
  primaryColor: "#4f46e5", // Main brand color
  // Configure text colors, button styles, and other UI elements
  // See UI Customization section for details
},
```

### 8. Additional Features

Configure additional features like email integration, pricing page, and contact page:

```typescript
// Email provider configuration
email: {
  provider: "encharge",
  apiKey: process.env.ENCHARGE_API_KEY,
  // Configure additional email settings
  // See Email Provider Configuration section for details
},

// Pricing page configuration
pricing: {
  enabled: true,
  // Configure pricing plans and options
  // See Pricing Configuration section for details
},

// Contact page configuration
contact: {
  enabled: true,
  // Configure contact channels and information
  // See Contact Page Configuration section for details
},
```

### 9. Scripts and Analytics

Add any third-party scripts for analytics or other functionality:

```typescript
// Scripts configuration
scripts: {
  head: [
    // Scripts to load in <head>
    {
      src: "https://analytics.example.com/script.js",
      strategy: "afterInteractive",
      attributes: {
        "data-website-id": "your-id-here",
        defer: "",
      },
    },
  ],
  body: [
    // Scripts to load at end of <body>
  ],
},
```

### 10. Final Review and Testing

After completing your configuration:

1. Save your changes
2. Restart your development server:
   ```bash
   # Using Bun (recommended)
   bun run dev
   
   # OR using npm
   npm run dev
   ```
3. Verify all settings are applied correctly
4. Test each configured feature
5. Make any necessary adjustments
6. Build and deploy your job board

## Configuration Best Practices

Follow these best practices when configuring your Bordful job board:

1. **Keep Environment Variables Separate**: Use environment variables for sensitive information rather than hardcoding in config.ts
2. **Use TypeScript Autocompletion**: Take advantage of TypeScript's autocompletion to discover available options
3. **Comment Your Customizations**: Add comments for significant customizations to remind yourself of changes
4. **Test Each Section**: After configuring each section, test to make sure it works as expected
5. **Back Up Your Configuration**: Keep a backup of your configuration file when making significant changes
6. **Follow the Type Definitions**: Respect the TypeScript types to prevent runtime errors
7. **Check for New Options**: When updating Bordful, review the latest config.example.ts for new features 