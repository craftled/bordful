/**
 * Job Board Configuration Example
 * ----------------------------
 * This is a template for your job board configuration.
 *
 * Quick Start for Users Who Fork This Repository:
 * 1. Copy this file: cp config/config.example.ts config/config.ts
 * 2. Make sure it's called config.ts
 * 3. Customize config.ts with your settings
 * 4. Commit config.ts to your repository
 *
 * IMPORTANT: The main repository does not include config.ts
 * This allows you to maintain your own configuration while
 * still being able to pull updates from the main repository.
 *
 * When updating from upstream (original bordful repo):
 * - Pull the latest changes
 * - Your config.ts will remain unchanged
 * - Check this file for new options
 * - Add desired new options to your config.ts
 */

import type { ScriptProps } from 'next/script';
import type { BadgeType } from '@/components/ui/job-badge';
import type { CurrencyCode } from '@/lib/constants/currencies';

// Available font options
export type FontFamily = 'geist' | 'inter' | 'ibm-plex-serif';

// Hero image configuration
type HeroImageConfig = {
  enabled: boolean;
  src?: string;
  alt?: string;
};

// Menu item interface for new flexible menu structure
export type MenuItem = {
  label: string;
  link: string;
  icon?: string;
  dropdown?: boolean;
  items?: MenuItem[];
  external?: boolean;
  // For accessibility
  ariaLabel?: string;
};

// Navigation configuration type
export type NavConfig = {
  title: string;
  logo: {
    enabled: boolean;
    src: string;
    width: number;
    height: number;
    alt: string;
  };
  github: { show: boolean; url: string };
  linkedin: { show: boolean; url: string };
  twitter: { show: boolean; url: string };
  bluesky: { show: boolean; url: string };
  reddit: { show: boolean; url: string };
  postJob: {
    show: boolean;
    label: string;
    link: string;
    external: boolean;
    variant: 'default' | 'primary' | 'outline' | 'secondary' | 'ghost' | 'link';
  };
  menu: MenuItem[];
};

type CustomScript = {
  src: string;
  strategy: ScriptProps['strategy'];
  attributes?: Record<string, string>;
};

// Plan type for pricing configuration
type PricingPlan = {
  name: string;
  price: number;
  billingTerm: string;
  description: string;
  features: string[];
  cta: {
    label: string;
    link: string;
    variant: string;
  };
  badge: {
    text: string;
    type?: BadgeType;
  } | null;
  highlighted: boolean;
};

// FAQ item type for FAQ configuration
type FAQItem = {
  question: string;
  answer: string;
  // Whether the answer contains markdown/rich text
  isRichText?: boolean;
};

// FAQ category type for FAQ configuration
type FAQCategory = {
  title: string;
  items: FAQItem[];
};

export const config = {
  // Font Configuration
  font: {
    // Font family to use throughout the site
    // Available options: "geist" | "inter" | "ibm-plex-serif"
    family: 'geist' as FontFamily,

    // Whether to load the font from Google Fonts (for Inter and IBM Plex Serif)
    // IMPORTANT: Must be true for IBM Plex Serif and Inter
    // Geist is self-hosted by default
    useGoogleFonts: true,

    // Font weights to load (applies to Google Fonts)
    // For Geist, the standard weights are loaded automatically
    weights: [400, 500, 600, 700],
  },

  // UI Configuration
  ui: {
    // Hero section background color (CSS color value)
    // Can be hex, rgb, hsl, etc. Leave empty for default.
    heroBackgroundColor: '#005450', // Example: light gray background

    // Hero section gradient background
    // Takes precedence over heroBackgroundColor when enabled
    heroGradient: {
      enabled: false, // Set to true to enable gradient background
      type: 'linear' as 'linear' | 'radial', // Type of gradient: "linear" or "radial"
      direction: 'to top', // For linear gradients: "to right", "to bottom", "45deg", etc.
      // For radial gradients: "circle", "ellipse at center", etc.
      colors: [
        '#005450', // Start color
        '#007a73', // Optional middle color(s)
        '#00a59c', // End color
      ],
      // Optional stops for precise control (0-100%)
      // If not provided, colors will be evenly distributed
      stops: ['0%', '50%', '100%'],
    },

    // Hero section background image
    // Takes precedence over both gradient and solid background when enabled
    heroBackgroundImage: {
      enabled: true, // Set to true to enable background image
      src: '/hero-background.jpg', // Path to image from public directory
      position: 'center', // CSS background-position value
      size: 'cover', // CSS background-size value: "cover", "contain", "100% auto", etc.
      // Optional overlay for better text readability
      overlay: {
        enabled: false, // Set to true to enable a color overlay
        color: 'rgba(0, 84, 80, 0.7)', // Semi-transparent color (RGB or RGBA)
        opacity: 0.7, // Opacity value from 0 to 1 (alternative to using rgba)
      },
    },

    // Hero section main title color (CSS color value)
    // Can be hex, rgb, hsl, etc. Leave empty for default.
    heroTitleColor: '#fff', // Example: "text-gray-900"

    // Hero section subtitle color (CSS color value)
    // Can be hex, rgb, hsl, etc. Leave empty for default.
    heroSubtitleColor: '#fff', // Example: "text-gray-600"

    // Hero section stats text color (CSS color value)
    // Can be hex, rgb, hsl, etc. Leave empty for default.
    heroStatsColor: '#fff', // Example: "text-gray-500"

    // Hero Badge variant (controls base style)
    // Options: "default", "secondary", "outline", "destructive"
    heroBadgeVariant: 'outline' as
      | 'default'
      | 'secondary'
      | 'outline'
      | 'destructive',

    // Hero Badge custom Tailwind classes (for specific color styling)
    // Example: "bg-teal-100 text-teal-800 border-teal-200"
    // heroBadgeClassName: "bg-white", // REMOVED for V1 simplicity

    // Optional: Override badge background color (CSS color value)
    heroBadgeBgColor: '#fff', // Example: "#ffffff"

    // Optional: Override badge text color (CSS color value)
    heroBadgeTextColor: '#083344', // Example: "#005450"

    // Optional: Override badge border color (CSS color value, mainly for outline variant)
    heroBadgeBorderColor: '#fff', // Example: "#ffffff"

    // Optional: Set search input background color (CSS color value)
    heroSearchBgColor: '#fff', // Example: "#ffffff"

    // Primary color used throughout the site (buttons, links, etc.)
    // Can be hex, rgb, hsl, etc. Leave empty for default.
    primaryColor: '#164e63', // Example: amber color

    // Optional: Configure an image for the right side of the hero section
    heroImage: {
      enabled: true, // Set to false to disable the image
      src: '/office.jpg', // Path to the image (place in /public folder)
      alt: 'Hero section illustration', // Alt text for accessibility
    },
  },

  // Open Graph Image Configuration
  og: {
    // Enable or disable custom OG image
    enabled: true,

    // Title to display (defaults to site title if not specified)
    title: null, // Use null to default to site title

    // Description to display (defaults to site description if not specified)
    description: null, // Use null to default to site description

    // Background color (defaults to heroBackgroundColor if not specified)
    backgroundColor: null, // Use null to default to heroBackgroundColor

    // Background color overlay opacity (0-1, where 1 is fully opaque)
    backgroundOpacity: 0.9,

    // Background image (path from public folder)
    backgroundImage: '/office.jpg',

    // Gradient overlay (bottom to top fade)
    gradient: {
      enabled: true,
      color: null, // Uses backgroundColor if not specified
      angle: 0, // Degrees - 90 means bottom to top
      startOpacity: 0, // Opacity at the top (0-1)
      endOpacity: 1, // Opacity at the bottom (0-1)
    },

    // Title color (defaults to heroTitleColor if not specified)
    titleColor: null, // Use null to default to heroTitleColor

    // Description color (defaults to heroSubtitleColor if not specified)
    descriptionColor: null, // Use null to default to heroSubtitleColor

    // Font configuration (defaults to site font if not specified)
    font: {
      // Override the font family just for OG image
      family: null, // Use null to default to site font.family
    },

    // Logo configuration
    logo: {
      // Show or hide logo in OG image
      show: true,

      // Logo source path (direct path from public folder)
      // Examples: "/bordful.svg", "/logo/my-logo.png", etc.
      src: '/bordful-light.svg',

      // Logo dimensions
      width: 185, // IMPORTANT: Use a fixed pixel value, "auto" doesn't work reliably
      height: 56, // Height in pixels

      // Logo positioning
      position: {
        top: 60, // Position from top in pixels
        left: 60, // Position from left in pixels
      },
    },

    // Job-specific OG image configuration
    jobs: {
      // Enable or disable job-specific OG images
      enabled: true,

      // Background color (defaults to heroBackgroundColor if not specified)
      backgroundColor: null, // Use null to default to heroBackgroundColor

      // Background color overlay opacity (0-1, where 1 is fully opaque)
      backgroundOpacity: 0.9,

      // Background image (path from public folder)
      backgroundImage: '/office.jpg',

      // Gradient overlay
      gradient: {
        enabled: true,
        color: null, // Uses backgroundColor if not specified
        angle: 0, // Degrees
        startOpacity: 0, // Opacity at the start (0-1)
        endOpacity: 1, // Opacity at the end (0-1)
      },

      // Title color (defaults to heroTitleColor if not specified)
      titleColor: null, // Use null to default to heroTitleColor

      // Company name color
      companyColor: null, // Use null to default to heroTitleColor

      // Details color (job type, location, salary)
      detailsColor: null, // Use null to default to heroSubtitleColor

      // Font configuration (defaults to site font if not specified)
      font: {
        // Override the font family just for job OG images
        family: null, // Use null to default to site font.family
      },

      // Logo configuration
      logo: {
        // Show or hide logo in job OG images
        show: true,

        // Logo source path (direct path from public folder)
        src: '/bordful-light.svg',

        // Logo dimensions
        width: 185, // IMPORTANT: Use a fixed pixel value
        height: 56, // Height in pixels
      },

      // Job details to display
      showSalary: true, // Show salary information if available
      showLocation: true, // Show job location
      showJobType: true, // Show job type (Full-time, Part-time, etc.)
    },
  },

  // Marketing & SEO
  badge: 'Open Source Next.js Job Board Starter Kit',
  title: 'Discover and Apply to Your Dream Jobs Today',
  description:
    'Browse curated opportunities from leading companies. Updated daily with the latest positions.',
  url:
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : 'https://demo.bordful.com'),

  // Note: Schema.org structured data now uses values from other config sections
  // - Website name uses nav.title
  // - Description uses the main description
  // - Social links are derived from navigation settings
  // - Search functionality is automatically included
  // - Publisher is derived from site branding

  // Job Alerts Configuration
  jobAlerts: {
    // Enable or disable the job alerts feature
    enabled: true,

    // Show job alerts link in navigation
    showInNavigation: true,

    // Show job alerts link in footer resources
    showInFooter: true,

    // Navigation label
    navigationLabel: 'Job Alerts',

    // Hero section configuration
    hero: {
      // Badge text in hero section
      badge: 'Job Alerts',

      // Main title in hero section
      title: 'Get Jobs Right to Your Inbox',

      // Description text in hero section
      description:
        'Subscribe to job alerts and get notified when new opportunities are posted.',
    },

    // Hero image configuration (overrides global setting)
    heroImage: {
      enabled: false, // Disable hero image on the job alerts page
      src: '', // Optional custom image path
      alt: '', // Optional custom alt text
    },

    // Form text configuration
    form: {
      // Heading text for the form section
      heading: 'Subscribe for Updates',

      // Description text under the heading
      description:
        "Get notified when new jobs are posted. We'll also subscribe you to Bordful newsletter.",

      // Form fields configuration
      fields: {
        // Name field labels and errors
        name: {
          label: 'Name *',
          placeholder: 'Your name',
          required: 'Name is required',
        },
        // Email field labels and errors
        email: {
          label: 'Email *',
          placeholder: 'your@email.com',
          required: 'Email is required',
          invalid: 'Please enter a valid email address',
        },
      },

      // Button text for the subscribe form
      buttonText: 'Subscribe to Job Alerts',

      // Loading text when form is being submitted
      loadingText: 'Subscribing...',

      // Success message heading after successful subscription
      successHeading: 'Subscription Confirmed!',

      // Success message description after successful subscription
      successDescription:
        "Thank you for subscribing to job alerts. You'll receive emails when jobs matching your interests are posted.",

      // Text for the button to subscribe with another email after success
      resetButtonText: 'Subscribe with another email',

      // Toast notification messages
      toast: {
        success: {
          title: 'Subscription successful!',
          description: "You'll now receive job alerts in your inbox.",
        },
        rateLimit: {
          title: 'Rate limit exceeded',
          description: 'Too many requests. Please try again later.',
        },
        error: {
          title: 'Something went wrong',
          description: 'Failed to subscribe to job alerts. Please try again.',
        },
      },
    },

    // The email provider to use (must match a provider in the email section)
    provider: 'encharge',
  },

  // RSS Feed Configuration
  rssFeed: {
    // Enable or disable RSS feeds
    enabled: true,

    // Show RSS feed links in navigation
    showInNavigation: true,

    // Show RSS feed links in footer
    showInFooter: true,

    // Navigation label (if showing in navigation)
    navigationLabel: 'RSS Feed',

    // Footer label (if showing in footer)
    footerLabel: 'Job Feeds',

    // Title for the RSS feed
    title: 'Latest Jobs Feed',

    // Number of job description characters to include (preview length)
    descriptionLength: 500,

    // Available formats (enable/disable specific formats)
    formats: {
      rss: true, // RSS 2.0 format
      atom: true, // Atom format
      json: true, // JSON Feed format
    },
  },

  // Currency Configuration
  // This affects currency display across the job board, including job listings and pricing
  currency: {
    // Default currency code used when no currency is specified
    defaultCurrency: 'USD' as CurrencyCode,

    // Allowed currencies for job listings
    // This list can include any valid CurrencyCode from lib/constants/currencies.ts
    // Users can specify a subset of supported currencies or allow all by setting to null
    allowedCurrencies: null as CurrencyCode[] | null, // null means all currencies are allowed
  },

  // Search Configuration
  search: {
    // Default placeholder text for search inputs
    placeholder: 'Search by role, company, or location...',

    // Debounce time in milliseconds
    debounceMs: 500,

    // Show search on all job pages (including subpages)
    showOnAllPages: true,

    // ARIA label for accessibility
    ariaLabel: 'Search jobs',
  },

  // Quick Stats Configuration
  quickStats: {
    // Enable or disable the quick stats section
    enabled: true,

    // Configure individual stat sections
    sections: {
      // Open Jobs counter
      openJobs: {
        enabled: true,
        title: 'Open Jobs',
        showNewJobsIndicator: true,
      },

      // Last Updated timestamp
      lastUpdated: {
        enabled: true,
        title: 'Last Updated',
      },

      // Trending Companies
      trending: {
        enabled: true,
        title: 'Trending',
        maxCompanies: 3,
      },
    },
  },

  // Job Listings Configuration
  jobListings: {
    // Default page title for job listings
    defaultPageTitle: 'Latest Opportunities',

    // Default number of jobs per page
    defaultPerPage: 10,

    // Default number of days a job posting is considered valid if an expiration date
    // is not explicitly provided by the source. Used in structured data (schema.org).
    defaultValidityDays: 30,

    // Available sort options
    sortOptions: ['newest', 'oldest', 'salary'] as const,

    // Default sort order
    defaultSortOrder: 'newest' as 'newest' | 'oldest' | 'salary',

    // UI Labels Configuration
    labels: {
      // Per page dropdown label
      perPage: {
        show: true,
        text: 'Jobs per page:',
      },

      // Sort order dropdown label
      sortOrder: {
        show: true,
        text: 'Sort by:',
      },
    },
  },

  // FAQ Configuration
  faq: {
    // Enable or disable the FAQ page
    enabled: true,

    // Show FAQ link in navigation
    showInNavigation: true,

    // Show FAQ link in footer resources
    showInFooter: true,

    // Navigation label
    navigationLabel: 'FAQ',

    // Badge text for hero section
    badge: 'FAQ',

    // Page title and description
    title: 'Frequently Asked Questions',
    description:
      'Find answers to common questions about our job board and services.',

    // Hero image configuration (overrides global setting)
    heroImage: {
      enabled: false, // Enable hero image on the FAQ page
      src: '/faq-hero.jpg', // Custom image path
      alt: 'Frequently Asked Questions', // Custom alt text
    },

    // SEO keywords
    keywords:
      'job board FAQ, frequently asked questions, job search help, employer questions',

    // Categories of FAQs
    categories: [
      {
        title: 'General Questions',
        items: [
          {
            question: 'What is Bordful?',
            answer:
              'Bordful is a modern, minimal job board built with Next.js, Tailwind CSS, and Airtable. It features static generation, client-side search, and a clean UI with Geist font.',
          },
          {
            question: 'Is Bordful free to use?',
            answer:
              'Yes, Bordful is an open-source project available under the MIT license. You can use it for free for both personal and commercial projects.',
          },
          {
            question: 'How often are job listings updated?',
            answer:
              'Job listings are updated in real-time using Incremental Static Regeneration (ISR) with a 5-minute revalidation period. This means new jobs appear without manual rebuilds.',
          },
        ],
      },
      {
        title: 'For Job Seekers',
        items: [
          {
            question: 'How do I search for jobs?',
            answer:
              'You can search for jobs using the search bar on the homepage. You can also filter jobs by type, career level, remote work preference, salary range, visa sponsorship status, and languages.',
          },
          {
            question: 'Can I set up job alerts?',
            answer:
              'Yes, you can subscribe to job alerts to receive notifications when new jobs matching your criteria are posted. Visit the Job Alerts page to set up your preferences.',
          },
          {
            question: 'How do I apply for a job?',
            answer:
              "Each job listing has an 'Apply' button that will direct you to the application page specified by the employer. The application process may vary depending on the employer.",
          },
        ],
      },
      {
        title: 'For Employers',
        items: [
          {
            question: 'How do I post a job?',
            answer:
              "You can post a job by clicking the 'Post a Job' button in the navigation bar. You'll need to create an account and select a pricing plan before posting your job.",
          },
          {
            question: 'What information should I include in my job posting?',
            answer:
              "A good job posting should include a clear title, company name, job type, salary range, job description, requirements, benefits, and application instructions. The more details you provide, the more qualified candidates you'll attract.",
          },
          {
            question: 'How long will my job posting be visible?',
            answer:
              'Job postings are typically visible for 30 days, depending on your selected plan. You can always extend the visibility period by upgrading your plan or renewing your posting.',
          },
        ],
      },
      {
        title: 'Technical Questions',
        items: [
          {
            question: 'What technologies does Bordful use?',
            answer:
              'Bordful is built with Next.js, Tailwind CSS, and uses Airtable as the backend.\n\n## Core Technologies\n\n* **Next.js**: For server-side rendering and static site generation\n* **Tailwind CSS**: For utility-first styling\n* **Airtable**: As a flexible backend database\n* **TypeScript**: For type safety and better developer experience\n\nIt also features Incremental Static Regeneration (ISR) for real-time updates and client-side search with memoization.',
            isRichText: true,
          },
          {
            question: 'Can I customize Bordful for my own job board?',
            answer:
              'Yes, Bordful is designed to be easily customizable. You can modify the configuration file to change the branding, navigation, and other aspects of the job board.\n\n### Key customization options:\n\n- **Branding**: Change the logo, colors, and text\n- **Navigation**: Add or remove menu items\n- **Features**: Enable or disable features like job alerts and RSS feeds\n- **Layout**: Modify the layout and styling\n\nFor more advanced customization, you can extend the codebase to add new features.\n\n```typescript\n// Example config customization\nconst config = {\n  title: "My Custom Job Board",\n  description: "Find your dream job here",\n  // ... more configuration\n};\n```',
            isRichText: true,
          },
          {
            question: 'Is Bordful SEO-friendly?',
            answer:
              'Yes, Bordful includes comprehensive SEO features such as:\n\n1. Automatic XML sitemap generation\n2. Programmatic robots.txt\n3. SEO-friendly URLs with descriptive job slugs\n4. Dynamic sitemap updates every 5 minutes\n5. Structured data for job postings\n\n> "SEO is not just about being search engine-friendly, but also about creating a better user experience."',
            isRichText: true,
          },
          {
            question: 'How do I deploy my Bordful job board?',
            answer:
              'Bordful can be deployed to various platforms, with Vercel being the recommended option.\n\n## Deployment Steps\n\n1. Fork the Bordful repository\n2. Create your `config.ts` file\n3. Connect your repository to Vercel\n4. Configure environment variables\n5. Deploy!\n\n### Environment Variables\n\n| Variable | Description | Required |\n|----------|-------------|----------|\n| `AIRTABLE_ACCESS_TOKEN` | Your Airtable API token | Yes |\n| `AIRTABLE_BASE_ID` | Your Airtable base ID | Yes |\n| `NEXT_PUBLIC_APP_URL` | Your site URL | Yes |\n\nFor more detailed instructions, please refer to the [deployment documentation](https://github.com/yourusername/bordful).',
            isRichText: true,
          },
        ],
      },
    ],
  },

  // Email Provider Configuration
  email: {
    // The email provider to use for subscriptions
    provider: process.env.EMAIL_PROVIDER || 'encharge',

    // Encharge configuration
    encharge: {
      // Your Encharge write key (from Encharge dashboard)
      writeKey: process.env.ENCHARGE_WRITE_KEY,

      // Default tags to apply to subscribers
      defaultTags: 'job-alerts-subscriber',

      // Event name for subscriptions
      eventName: 'Job Alert Subscription',
    },

    // You can add other providers here in the future:
    // mailchimp: { ... },
    // convertkit: { ... },
    // sendgrid: { ... },
  },

  // Scripts Configuration (analytics, tracking, etc.)
  scripts: {
    head: [
      // Example: Umami Analytics (loads early but non-blocking)
      {
        src: 'https://umami.craftled.com/script.js',
        strategy: 'afterInteractive',
        attributes: {
          'data-website-id': 'b93ebd4d-b4fd-49f3-9507-c32245ac447f',
          defer: '',
        },
      },
    ] as CustomScript[],
    body: [] as CustomScript[], // Scripts to load at the end of body
  },

  // Navigation
  nav: {
    title: 'Bordful', // The text shown in the navigation bar
    logo: {
      enabled: true, // Set to true to use a custom logo instead of icon + text
      src: '/bordful.svg', // Path to your logo image (place it in the public directory)
      width: 67, // Width of the logo in pixels
      height: 20, // Height of the logo in pixels
      alt: 'Bordful', // Alt text for the logo
    },
    github: {
      show: true, // Whether to show the GitHub button
      url: 'https://github.com/craftled/bordful', // Your GitHub repository URL
    },
    linkedin: {
      show: true,
      url: 'https://www.linkedin.com/company/bordful/',
    },
    twitter: {
      show: true,
      url: 'https://x.com/bordful',
    },
    bluesky: {
      show: true,
      url: 'https://bsky.app/profile/bordful.com',
    },
    reddit: {
      show: true,
      url: 'https://reddit.com/r/bordful',
    },
    postJob: {
      show: true, // Whether to show the Post Job button
      label: 'Post a Job', // Button text
      link: 'https://stripe.com', // Button link
      external: true, // Indicates the link is external (opens in a new tab)
      variant: 'primary' as
        | 'default'
        | 'primary'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link', // Button variant
    },
    menu: [
      { label: 'Home', link: '/' },
      {
        label: 'Jobs',
        link: '/jobs',
        dropdown: true,
        items: [
          { label: 'All Jobs', link: '/jobs' },
          { label: 'Job Types', link: '/jobs/types' },
          { label: 'Job Locations', link: '/jobs/locations' },
          { label: 'Job Levels', link: '/jobs/levels' },
          { label: 'Job Languages', link: '/jobs/languages' },
        ],
      },
      { label: 'About', link: '/about' },
      { label: 'Pricing', link: '/pricing' },
      { label: 'Job Alerts', link: '/job-alerts' },
      { label: 'Contact', link: '/contact' },
    ],
  } as NavConfig,

  // Footer
  footer: {
    // Brand section (reuses nav social links)
    brand: {
      show: true,
      order: 1, // Display order in footer grid (lower numbers displayed first)
      description:
        'Browse curated opportunities from leading companies. Updated daily with the latest positions.',
      // Optional logo configuration specifically for the footer
      logo: {
        enabled: true,
        // Use different image from navbar if needed (e.g., light logo for dark footer)
        src: '/bordful-light.svg', // Path to footer-specific logo (light version)
        width: 67,
        height: 20,
        alt: 'Bordful',
      },
    },

    // Custom columns - configure as many as needed
    columns: [
      {
        id: 'company',
        show: true,
        order: 2,
        title: 'Company',
        links: [
          { label: 'Home', link: '/' },
          { label: 'About', link: '/about' },
          { label: 'Changelog', link: '/changelog' },
          { label: 'Sitemap', link: '/sitemap.xml' },
        ],
        // Automatically add these feature links if they're enabled in config
        autoAddFeatures: {
          jobAlerts: true, // Add Job Alerts link if feature is enabled
          pricing: true, // Add Pricing link if feature is enabled
          faq: true, // Add FAQ link if feature is enabled
          contact: true, // Add Contact link if feature is enabled
        },
      },
      {
        id: 'jobs',
        show: true,
        order: 3,
        title: 'Jobs',
        links: [
          { label: 'All Jobs', link: '/jobs' },
          { label: 'Job Types', link: '/jobs/types' },
          { label: 'Job Locations', link: '/jobs/locations' },
          { label: 'Career Levels', link: '/jobs/levels' },
          { label: 'Job Languages', link: '/jobs/languages' },
        ],
      },
      {
        id: 'job-feeds',
        show: true,
        order: 4,
        title: 'Job Feeds',
        // Special column type that will render feed links (RSS, Atom, JSON)
        type: 'feeds',
      },
      {
        id: 'legal',
        show: true,
        order: 5,
        title: 'Legal',
        links: [
          {
            label: 'Privacy & Cookies',
            link: '/privacy',
            external: false,
          },
          {
            label: 'Terms of Service',
            link: '/terms',
            external: false,
          },
          {
            label: 'License',
            link: 'https://github.com/craftled/bordful/blob/main/LICENSE',
            external: true,
          },
        ],
      },
    ],

    // Post Job section
    postJob: {
      show: true,
      title: 'Post a Job for 30 Days for Free',
      description:
        'Reach our community of talented professionals. Get quality applications fast.',
      button: {
        label: 'Post a Job',
        link: 'https://stripe.com',
        external: true, // Indicates the footer link should open externally
      },
      learnMoreButton: {
        show: true,
        label: 'Pricing',
        link: '/pricing',
        external: false,
      },
    },

    // Copyright section
    copyright: {
      show: true,
      startYear: 2024,
      text: 'Bordful - An open-source Next.js job board template. Standing on the shoulders of giants.',
    },

    // Built with section
    builtWith: {
      show: true,
      text: 'Built with',
      name: 'Bordful',
      link: 'https://bordful.com/',
      showLogo: true,
    },

    // Styling options
    style: {
      // Background color for the footer (CSS color value)
      backgroundColor: '#0C0E12',

      // Text color for regular text in the footer (CSS color value)
      textColor: '#94979C',

      // Heading color for section titles in the footer (CSS color value)
      headingColor: '#FFFFFF',

      // Link color for footer links (CSS color value)
      linkColor: '#94979C',

      // Link hover color for footer links on hover (CSS color value)
      linkHoverColor: '#FFFFFF',

      // Border color for the top border of the footer (CSS color value)
      borderColor: '', // Empty string means use the default border color
    },
  },

  // Pricing Configuration
  pricing: {
    // Enable or disable the pricing page
    enabled: true,

    // Show pricing link in navigation
    showInNavigation: true,

    // Show pricing link in footer resources
    showInFooter: true,

    // Navigation label
    navigationLabel: 'Pricing',

    // Badge text for hero section
    badge: 'Pricing',

    // Page title and description
    title: 'Simple, Transparent Pricing',
    description: "Choose the plan that's right for your job board needs.",

    // Hero image configuration (overrides global setting)
    heroImage: {
      enabled: false, // Disable hero image on the pricing page
      src: '', // Optional custom image path
      alt: '', // Optional custom alt text
    },

    // SEO keywords
    keywords:
      'job board pricing, post job, job listing plans, recruitment pricing',

    // Currency for pricing display
    currency: 'USD' as CurrencyCode,

    // Currency symbol is now derived from the currency selected above
    // No need to manually specify the symbol anymore

    // Payment processing information (displayed below pricing cards)
    paymentProcessingText:
      'Payments are processed & secured by Stripe. Price in USD. VAT may apply.',

    // Payment method icons to display
    paymentMethods: {
      enabled: true,
      icons: [
        { name: 'visa', alt: 'Visa' },
        { name: 'mastercard', alt: 'Mastercard' },
        { name: 'amex', alt: 'American Express' },
        { name: 'applepay', alt: 'Apple Pay' },
        { name: 'googlepay', alt: 'Google Pay' },
        { name: 'paypal', alt: 'PayPal' },
      ],
    },

    // Plans configuration
    plans: [
      {
        name: 'Free',
        price: 0,
        billingTerm: 'forever',
        description: 'Perfect for getting started with basic hiring needs.',
        features: [
          '1 active job posting',
          'Basic job listing',
          '30-day visibility',
          'Standard support',
          'Basic analytics',
        ],
        cta: {
          label: 'Get Started',
          link: '/post',
          variant: 'outline', // Using button variants
        },
        badge: null,
        highlighted: false,
      },
      {
        name: 'Pro',
        price: 99,
        billingTerm: 'job posting',
        description:
          'Great for occasional hiring needs with better visibility.',
        features: [
          '3 active job postings',
          'Standard job listings',
          '30-day visibility',
          'Email support',
          'Standard analytics',
          'Company profile',
        ],
        cta: {
          label: 'Choose Basic',
          link: 'https://stripe.com',
          variant: 'outline', // Using button variants
        },
        badge: {
          text: 'Popular',
          type: 'featured',
        },
        highlighted: true,
      },
      {
        name: 'Business',
        price: 999,
        billingTerm: 'year',
        description:
          'Unlimited jobs postings for one year for serious recruiters.',
        features: [
          '5 active job postings',
          'Featured job listings',
          '30-day visibility',
          'Priority support',
          'Advanced analytics',
          'Company profile',
          'Applicant tracking',
        ],
        cta: {
          label: 'Upgrade Now',
          link: 'https://stripe.com',
          variant: 'default', // Using button variants
        },
        badge: {
          text: 'Best Value',
          type: 'featured',
        },
        highlighted: false,
      },
    ],
  },

  // Post Job Banner Configuration
  postJobBanner: {
    // Enable or disable the post job banner
    enabled: true,

    // Banner content
    title: 'Hiring? Post Your Job Ad Here',
    description: 'Reach talented professionals. Get quality applications fast.',

    // Trust indicators
    showTrustedBy: true,
    trustedByText: 'Trusted by top companies',
    companyAvatars: [
      {
        src: '/avatars/bestwriting.png',
        alt: 'Best Writing',
        fallback: 'BW',
      },
      {
        src: '/avatars/marketful.png',
        alt: 'Marketful',
        fallback: 'MF',
      },
      {
        src: '/avatars/uithings.png',
        alt: 'UI Things',
        fallback: 'UI',
      },
      {
        src: '/avatars/bestwriting.png',
        alt: 'Best Writing',
        fallback: 'BW',
      },
    ],

    // Call to action
    cta: {
      text: 'Post a Job ($59)',
      link: 'https://buy.stripe.com/fZeg1n8eg07m0lGfZn',
      external: true,
    },

    // Trust message
    trustMessage: '30-day money-back guarantee',
  },

  // Contact Page Configuration
  contact: {
    // Enable or disable the contact page
    enabled: true,

    // Show contact link in navigation
    showInNavigation: true,

    // Show contact link in footer resources
    showInFooter: true,

    // Navigation label
    navigationLabel: 'Contact',

    // Badge text for hero section
    badge: 'Contact Us',

    // Page title and description
    title: 'Get in Touch',
    description: "Have questions or feedback? We'd love to hear from you.",

    // Hero image configuration (overrides global setting)
    heroImage: {
      enabled: false, // Disable hero image on the contact page
      src: '', // Optional custom image path
      alt: '', // Optional custom alt text
    },

    // SEO keywords
    keywords: 'contact us, support, help, questions, feedback, get in touch',

    // Support channels section
    supportChannels: {
      title: 'Support Channels',
      channels: [
        {
          type: 'email',
          title: 'Email Support',
          description:
            'Our support team is available to help you with any questions or issues you might have.',
          buttonText: 'Contact via Email',
          buttonLink: 'mailto:hello@bordful.com',
          icon: 'Mail', // Lucide icon name
        },
        {
          type: 'twitter',
          title: 'Twitter/X Support',
          description:
            'Get quick responses and stay updated with our latest announcements on Twitter/X.',
          buttonText: 'Follow on Twitter/X',
          buttonLink: 'https://twitter.com/bordful',
          icon: 'Twitter', // Lucide icon name
        },
        {
          type: 'faq',
          title: 'FAQ',
          description:
            'Browse our comprehensive FAQ section to find answers to the most common questions.',
          buttonText: 'View FAQ',
          buttonLink: '/faq',
          icon: 'HelpCircle', // Lucide icon name
        },
      ],
    },

    // Contact information section
    contactInfo: {
      title: 'Contact Information',
      description: "Here's how you can reach us directly.",
      companyName: 'Bordful Inc.',
      email: 'hello@bordful.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, San Francisco, CA 94105',
    },

    // Schema.org structured data customization
    schema: {
      description:
        'Get in touch with our team for any questions or support needs.',
    },

    // Contact link configuration
    contact: {
      // Show or hide the contact link
      show: true,
      // URL for the contact page or form
      url: '/contact',
      // Label for the contact link
      label: 'Contact Us',
      // Button variant (default, outline, secondary, ghost, link)
      variant: 'default',
    },
  },

  // About Page Configuration
  about: {
    // Enable or disable the About page
    enabled: true,
    // Show or hide the About page in navigation
    showInNavigation: true,
    // Label for the about page in navigation
    label: 'About Us',
    // Badge text for the about hero
    badge: 'About Us',
    // Title for the about page hero section
    title: 'About Bordful',
    // Description for the about page
    description:
      'Learn more about our mission to connect talent with opportunity.',

    // Hero image configuration (overrides global setting)
    heroImage: {
      enabled: false, // Disable hero image on the about page
      src: '', // Optional custom image path
      alt: '', // Optional custom alt text
    },

    // Section titles and content
    sections: {
      mission: {
        title: 'Mission',
        content:
          "We're on a mission to connect talented professionals with meaningful opportunities and help organizations find the perfect candidates to drive their success.",
      },
      story: {
        title: 'Story',
        content:
          "Founded with a passion for revolutionizing the job search experience, our platform was built to address the challenges faced by both job seekers and employers in today's competitive market.",
      },
      team: {
        title: 'Team',
        content:
          'Our diverse team brings together expertise from recruitment, technology, and design to create an innovative job board solution that puts user experience first.',
      },
    },

    // Contact link configuration
    contact: {
      // Show or hide the contact link
      show: true,
      // URL for the contact page or form
      url: '/contact',
      // Label for the contact link
      label: 'Contact Us',
      // Button variant (default, outline, secondary, ghost, link)
      variant: 'default',
      // Contact section title
      title: 'Get in Touch',
      // Contact section description
      description:
        "Have questions or want to learn more about our services? We'd love to hear from you.",
    },
    // Schema.org structured data customization
    schema: {
      // Company name for the schema
      companyName: 'Bordful',
      // Description for the schema
      description:
        'Connect talented professionals with meaningful opportunities',
      // Logo URL for the schema
      logo: '/bordful.svg',
    },
  },

  // Jobs Pages Configuration
  jobsPages: {
    // Main Jobs directory page
    directory: {
      // Hero image configuration (overrides global setting)
      heroImage: {
        enabled: false, // Disable hero image on the main jobs directory page
        src: '', // Optional custom image path
        alt: '', // Optional custom alt text
      },
    },
    // Job Types page
    types: {
      // Hero image configuration (overrides global setting)
      heroImage: {
        enabled: false, // Disable hero image on the job types page
        src: '', // Optional custom image path
        alt: '', // Optional custom alt text
      },
    },
    // Job Levels page
    levels: {
      // Hero image configuration (overrides global setting)
      heroImage: {
        enabled: false, // Disable hero image on the job levels page
        src: '', // Optional custom image path
        alt: '', // Optional custom alt text
      },
    },
    // Job Locations page
    locations: {
      // Hero image configuration (overrides global setting)
      heroImage: {
        enabled: false, // Disable hero image on the job locations page
        src: '', // Optional custom image path
        alt: '', // Optional custom alt text
      },
    },
    // Job Languages page
    languages: {
      // Hero image configuration (overrides global setting)
      heroImage: {
        enabled: false, // Disable hero image on the job languages page
        src: '', // Optional custom image path
        alt: '', // Optional custom alt text
      },
    },
    // Dynamic Pages
    dynamicPages: {
      // Specific level pages (e.g., /jobs/level/senior)
      level: {
        // Hero image configuration (overrides global setting)
        heroImage: {
          enabled: false, // Disable hero image on specific level pages
          src: '', // Optional custom image path
          alt: '', // Optional custom alt text
        },
      },
      // Specific language pages (e.g., /jobs/language/en)
      language: {
        // Hero image configuration (overrides global setting)
        heroImage: {
          enabled: false, // Disable hero image on specific language pages
          src: '', // Optional custom image path
          alt: '', // Optional custom alt text
        },
      },
      // Specific type pages (e.g., /jobs/type/full-time)
      type: {
        // Hero image configuration (overrides global setting)
        heroImage: {
          enabled: false, // Disable hero image on specific type pages
          src: '', // Optional custom image path
          alt: '', // Optional custom alt text
        },
      },
      // Specific location pages (e.g., /jobs/location/remote)
      location: {
        // Hero image configuration (overrides global setting)
        heroImage: {
          enabled: false, // Disable hero image on specific location pages
          src: '', // Optional custom image path
          alt: '', // Optional custom alt text
        },
      },
    },
  },

  // Job Report Configuration
  jobReport: {
    // Enable or disable the job report feature
    enabled: true,

    // Button text
    buttonText: 'Report',

    // Email address to send reports to
    email: 'support@bordful.com',

    // Subject line for the report email
    emailSubject: 'Job Report: [Job Title]',

    // Message template for the report email
    // Available placeholders:
    // [Job Title] - The title of the job
    // [Job URL] - The full URL of the job posting
    emailMessage:
      'I would like to report the following job posting:\n\nJob Title: [Job Title]\nJob URL: [Job URL]\n\nReason for reporting:',

    // Whether to show the report button in the job details sidebar
    showInSidebar: true,
  },
} as const;

export type Config = typeof config;
export default config;
