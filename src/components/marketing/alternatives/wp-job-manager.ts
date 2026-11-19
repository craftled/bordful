import { defineAlternative } from "./types";

export const wpJobManager = defineAlternative({
  slug: "wp-job-manager",
  name: "WP Job Manager",
  metaTitle: "WP Job Manager Alternative: Bordful vs WP Job Manager",
  metaDescription:
    "A sourced comparison of Bordful and WP Job Manager on license, hosting, price, payments, job supply and migration, including when to stay on WordPress.",
  heading: {
    title: "WP Job Manager alternative:",
    titleMuted: "Bordful vs WP Job Manager.",
  },
  lede: {
    text: "WP Job Manager is a free, open-source job board plugin for WordPress, built by Automattic. Bordful is an MIT-licensed job board template on Next.js, Payload and Postgres, for teams that would rather run a JavaScript app than a WordPress site.",
    sources: ["wpjm-home", "bordful-readme"],
  },
  hub: {
    summary: {
      text: "Free, open-source job board plugin for WordPress, built by Automattic.",
      sources: ["wpjm-home"],
    },
    linkLabel: "Bordful vs WP Job Manager",
  },
  stay: [
    {
      text: "Your site already runs on WordPress, and your team knows its admin, themes and plugins.",
      sources: ["wpjm-home", "wporg"],
    },
    {
      text: "You want employers to post jobs themselves through a form on your site.",
      sources: ["wpjm-github"],
    },
    {
      text: "You want paid listings with checkout on your site, through the Simple Paid Listings add-on (Stripe or PayPal, per listing) or the WC Paid Listings add-on (packages through WooCommerce). Both come in the Job Manager Pro Bundle, not the free core.",
      sources: ["wpjm-spl", "wpjm-wcpl", "wpjm-bundle"],
    },
    {
      text: "You need add-ons Bordful does not have, such as applications, resumes and bookmarks.",
      sources: ["wpjm-bundle"],
    },
  ],
  switch: [
    {
      text: "Your team works in Next.js and TypeScript and would rather not maintain WordPress and PHP.",
      sources: ["bordful-readme"],
    },
    {
      text: "You want the code and the Postgres database on your own accounts, under the MIT license.",
      sources: ["bordful-readme", "bordful-pricing"],
    },
    {
      text: "You do not want an empty board on launch day. A fresh deploy shows sample jobs, and you can connect a Bordfeed feed later.",
      sources: ["bordful-bordfeed"],
    },
    {
      text: "You are fine taking payment through a Stripe payment link and publishing paid jobs yourself in the admin.",
      sources: ["bordful-post-a-job"],
    },
  ],
  limits: [
    {
      text: "You need hosting and some developer skill: Bun, Node.js 26 and Postgres 17, or the Vercel and Neon deploy button.",
      sources: ["bordful-readme", "bordful-deploy"],
    },
    {
      text: "Payload 4 is still a beta upstream. Bordful pins it and updates it by hand.",
      sources: ["bordful-readme"],
    },
    {
      text: "Payments are a Stripe payment link plus an admin publish step, not managed checkout.",
      sources: ["bordful-post-a-job"],
    },
    {
      text: "There is no employer self-serve package flow, resume database or applicant tracking.",
      sources: ["bordful-readme", "bordful-post-a-job"],
    },
    {
      text: "Bordful 1.0 is a recent rebuild, so it has a smaller public footprint and fewer reviews than WP Job Manager, which has 70,000+ active installations and 238 reviews on WordPress.org.",
      sources: ["bordful-readme", "wporg"],
    },
  ],
  comparison: [
    {
      label: "License",
      competitor: {
        text: "Core plugin is free and open source under GPL-3.0.",
        sources: ["wpjm-github", "wporg"],
      },
      bordful: {
        text: "Free and open source under the MIT license.",
        sources: ["bordful-readme", "bordful-pricing"],
      },
    },
    {
      label: "Hosting",
      competitor: {
        text: "A plugin on your own WordPress site. Needs WordPress 6.4 or higher and PHP 7.4 or higher.",
        sources: ["wporg"],
      },
      bordful: {
        text: "A Next.js app with Postgres on your own accounts. The Deploy button sets up Vercel, Neon Postgres and Vercel Blob.",
        sources: ["bordful-readme", "bordful-deploy"],
      },
    },
    {
      label: "Stack",
      competitor: {
        text: "WordPress and PHP.",
        sources: ["wporg"],
      },
      bordful: {
        text: "Next.js, Payload 4 (a pinned beta) and Postgres.",
        sources: ["bordful-readme"],
      },
    },
    {
      label: "Price",
      competitor: {
        text: "Core plugin is free. The Job Manager Pro Bundle of add-ons starts at $159 per year.",
        sources: ["wpjm-home", "wpjm-bundle"],
      },
      bordful: {
        text: "Free. Optional Custom Setup is $999 once.",
        sources: ["bordful-pricing"],
      },
    },
    {
      label: "Job supply",
      competitor: {
        text: "Listings you add, or that employers post on your site.",
        sources: ["wpjm-github"],
      },
      bordful: {
        text: "Sample jobs on a fresh board, then an optional Bordfeed feed (Bordfeed sells its own plans) or jobs you add.",
        sources: ["bordful-bordfeed", "bordful-faq"],
      },
    },
    {
      label: "Payments and checkout",
      competitor: {
        text: "Paid listings come from add-ons: Simple Paid Listings (Stripe or PayPal, per listing) or WC Paid Listings (packages through WooCommerce).",
        sources: ["wpjm-spl", "wpjm-wcpl"],
      },
      bordful: {
        text: "Post a Job sends employers to your Stripe payment link. You publish the job in the admin. No checkout or webhook.",
        sources: ["bordful-post-a-job"],
      },
    },
    {
      label: "SEO and JobPosting markup",
      competitor: {
        text: "Adds JobPosting structured data to each job listing page. Does not submit jobs to Google.",
        sources: ["wpjm-schema"],
      },
      bordful: {
        text: "JobPosting JSON-LD on job and company pages, plus a sitemap and robots.",
        sources: ["bordful-readme"],
      },
    },
    {
      label: "Who owns the data",
      competitor: {
        text: "On your own WordPress host. Listings are stored in your WordPress database as a post type with custom fields.",
        sources: ["wpjm-post-types", "wporg"],
      },
      bordful: {
        text: "On your own accounts. Jobs and companies are stored in your own Postgres database.",
        sources: ["bordful-readme", "bordful-faq"],
      },
    },
  ],
  pricing: [
    {
      label: "Core software",
      competitor: { text: "Free.", sources: ["wporg"] },
      bordful: { text: "Free.", sources: ["bordful-pricing"] },
    },
    {
      label: "Paid extras",
      competitor: {
        text: "Job Manager Pro Bundle, from $159 to $329 depending on the license: Personal (1 site) or Developer (unlimited sites). Includes a year of support and updates.",
        sources: ["wpjm-home", "wpjm-bundle"],
      },
      bordful: {
        text: "None. Every feature is in the free template.",
        sources: ["bordful-pricing"],
      },
    },
    {
      label: "Single add-ons",
      competitor: {
        text: "No standalone add-on prices on the pages we checked. See the vendor site.",
        sources: ["wpjm-bundle", "wpjm-spl", "wpjm-wcpl"],
      },
      bordful: { text: "Not applicable.", sources: ["bordful-pricing"] },
    },
    {
      label: "Setup help",
      competitor: {
        text: "Bundle licenses include a year of support and updates.",
        sources: ["wpjm-bundle"],
      },
      bordful: {
        text: "Custom Setup, $999 once: installation, custom domain, a 1-hour consultation and 1 year of Bordfeed Pro.",
        sources: ["bordful-pricing"],
      },
    },
    {
      label: "Hosting and services",
      competitor: {
        text: "Your WordPress host.",
        sources: ["wporg"],
      },
      bordful: {
        text: "Your host and any service you turn on, such as Neon, Vercel or a Bordfeed plan.",
        sources: ["bordful-faq", "bordful-deploy"],
      },
    },
  ],
  migration: {
    intro:
      "Bordful has no WP Job Manager importer. Moving is a one-time manual or scripted job, and it is easiest when you only carry over live listings.",
    moves: [
      {
        text: "Job titles, descriptions, locations, company names, application links or emails, and expiry dates. WP Job Manager keeps these as a post type with custom fields, and Bordful jobs have a place for each.",
        sources: ["wpjm-post-types", "bordful-post-a-job"],
      },
      {
        text: "Job types. Map them to Bordful's employment type by hand. WP Job Manager categories have no one-to-one field, so decide what to keep.",
        sources: ["wpjm-post-types", "bordful-readme"],
      },
    ],
    staysBehind: [
      {
        text: "WordPress user accounts. Bordful has admin users only, and employers pay through a payment link rather than an account.",
        sources: ["wp-export", "bordful-post-a-job"],
      },
      {
        text: "Data from add-ons such as Applications, Resume Manager and Bookmarks.",
        sources: ["wpjm-bundle"],
      },
      {
        text: "Orders and packages from WooCommerce or Simple Paid Listings.",
        sources: ["wpjm-wcpl", "wpjm-spl", "bordful-post-a-job"],
      },
      {
        text: "Your WordPress theme, pages and other plugins.",
        sources: ["wp-export"],
      },
    ],
    steps: [
      {
        text: "Export your job listings from WordPress with Tools > Export. The file includes custom post types and custom fields.",
        sources: ["wp-export"],
      },
      "Map each field to a Bordful job and drop the listings that have already expired.",
      {
        text: "Add the jobs in the Payload admin, or script it against the REST API that Payload generates for each collection.",
        sources: ["payload-rest"],
      },
      "Redirect your old job URLs on your host so links and search results land on the new pages.",
    ],
  },
  faq: [
    {
      question: "Is Bordful a good WP Job Manager alternative?",
      answer:
        "It is if your team prefers Next.js, TypeScript and Postgres to WordPress and PHP, and you are happy to host the app yourself. If you rely on employers posting jobs themselves, WooCommerce packages or resume add-ons, WP Job Manager is the better fit today.",
      sources: ["bordful-readme", "wpjm-github", "wpjm-wcpl", "wpjm-bundle"],
    },
    {
      question: "Bordful vs WP Job Manager: which costs less?",
      answer:
        "Both are free at the core. WP Job Manager's Pro Bundle of add-ons starts at $159 per year. Bordful has no paid add-ons, and Custom Setup is an optional $999 one-time fee. With either, you pay for your own hosting.",
      sources: ["wpjm-home", "wpjm-bundle", "bordful-pricing", "bordful-faq"],
    },
    {
      question: "Can I import my WP Job Manager listings into Bordful?",
      answer:
        "There is no one-click importer. Export your listings with the WordPress export tool, map the fields, and add the jobs in the Payload admin or with a script against Payload's REST API. User accounts and add-on data do not carry over.",
      sources: ["wp-export", "payload-rest", "bordful-post-a-job"],
    },
    {
      question:
        "Can Bordful charge for job posts like WP Job Manager's paid listing add-ons?",
      answer:
        "Partly. Post a Job sends employers to a Stripe payment link you create, and you publish the job in the admin. There is no built-in checkout, webhook or listing package.",
      sources: ["bordful-post-a-job", "wpjm-spl", "wpjm-wcpl"],
    },
    {
      question: "Do both add JobPosting structured data for Google?",
      answer:
        "Yes. WP Job Manager adds JobPosting structured data to job listing pages, and Bordful adds JobPosting JSON-LD to its job pages and lists them in a sitemap. Neither submits jobs to Google for you.",
      sources: ["wpjm-schema", "bordful-readme"],
    },
    {
      question: "Do I need to code to run Bordful?",
      answer:
        "Some. The Deploy button sets up Vercel, Neon Postgres and Vercel Blob for you, but updates and changes happen in a Git repository. If you would rather not, Custom Setup installs it for you for $999 once.",
      sources: ["bordful-deploy", "bordful-pricing"],
    },
  ],
  sources: [
    {
      id: "wpjm-home",
      title: "WP Job Manager homepage",
      url: "https://wpjobmanager.com/",
      fact: "Open-source job board plugin for WordPress, built by Automattic. Add-on bundle from $159 per year. Free core plugin.",
      checkedOn: "2026-11-16",
    },
    {
      id: "wpjm-bundle",
      title: "Job Manager Pro Bundle",
      url: "https://wpjobmanager.com/add-ons/bundle/",
      fact: "Personal (single site) and Developer (unlimited sites) licenses. Offers from $159 to $329 USD. A year of support and updates. Nine add-ons, including Applications, Resume Manager, WC Paid Listings and Simple Paid Listings.",
      checkedOn: "2026-11-16",
    },
    {
      id: "wpjm-spl",
      title: "Simple Paid Listings add-on",
      url: "https://wpjobmanager.com/add-ons/simple-paid-listings/",
      fact: "Set a price per listing and take payment through Stripe or PayPal.",
      checkedOn: "2026-11-16",
    },
    {
      id: "wpjm-wcpl",
      title: "WC Paid Listings add-on",
      url: "https://wpjobmanager.com/add-ons/wc-paid-listings/",
      fact: "Paid listing packages powered by WooCommerce. Requires the WooCommerce plugin.",
      checkedOn: "2026-11-16",
    },
    {
      id: "wpjm-schema",
      title: "Google Job Search Integration (WP Job Manager docs)",
      url: "https://wpjobmanager.com/document/troubleshooting/google-job-search-integration/",
      fact: "Adds JobPosting structured data to every job listing page since version 1.28.0. Does not submit jobs to Google.",
      checkedOn: "2026-11-16",
    },
    {
      id: "wporg",
      title: "WP Job Manager on WordPress.org",
      url: "https://wordpress.org/plugins/wp-job-manager/",
      fact: "Free core plugin. Requires WordPress 6.4 or higher and PHP 7.4 or higher. Active installations: 70,000+. Reviews: 238.",
      checkedOn: "2026-11-20",
    },
    {
      id: "wpjm-github",
      title: "WP Job Manager on GitHub",
      url: "https://github.com/Automattic/WP-Job-Manager",
      fact: "GPL-3.0 license. Lets users post jobs directly to the site.",
      checkedOn: "2026-11-16",
    },
    {
      id: "wpjm-post-types",
      title: "WP Job Manager post type source",
      url: "https://github.com/Automattic/WP-Job-Manager/blob/trunk/includes/class-wp-job-manager-post-types.php",
      fact: "Listings are a WordPress post type with category and type taxonomies and fields for location, application, company name and expiry date.",
      checkedOn: "2026-11-16",
    },
    {
      id: "wp-export",
      title: "WordPress Tools > Export documentation",
      url: "https://wordpress.org/documentation/article/tools-export-screen/",
      fact: "Export writes a WXR (XML) file with posts, custom post types, custom fields, taxonomies and users.",
      checkedOn: "2026-11-16",
    },
    {
      id: "bordful-pricing",
      title: "Bordful pricing",
      url: "https://bordful.com/pricing",
      fact: "Open Source is free under the MIT license. Custom Setup is $999 once with installation, custom domain, a 1-hour consultation and 1 year of Bordfeed Pro.",
      checkedOn: "2026-11-16",
    },
    {
      id: "bordful-faq",
      title: "Bordful FAQ",
      url: "https://bordful.com/faq",
      fact: "You pay your host and any service you turn on. Bordfeed sells its own plans. Editors add jobs in the Payload admin.",
      checkedOn: "2026-11-16",
    },
    {
      id: "bordful-readme",
      title: "Bordful README",
      url: "https://github.com/craftled/bordful",
      fact: "Next.js, Payload and Postgres. JobPosting JSON-LD, sitemap, sample jobs from Bordfeed. Needs Bun, Node.js 26 and Postgres 17. Payload 4 is a pinned beta. MIT license.",
      checkedOn: "2026-11-16",
    },
    {
      id: "bordful-deploy",
      title: "Bordful deploy docs",
      url: "https://bordful.com/docs/deploy",
      fact: "The Deploy button sets up Vercel with Neon Postgres and Vercel Blob.",
      checkedOn: "2026-11-16",
    },
    {
      id: "bordful-bordfeed",
      title: "Bordful Bordfeed docs",
      url: "https://bordful.com/docs/bordfeed",
      fact: "A fresh board shows sample jobs. Connect Bordfeed for a feed of jobs.",
      checkedOn: "2026-11-16",
    },
    {
      id: "bordful-post-a-job",
      title: "Bordful Post a Job docs",
      url: "https://bordful.com/docs/post-a-job",
      fact: "Post a Job is a Stripe payment link plus a job you publish in the admin. No Stripe Checkout or webhook.",
      checkedOn: "2026-11-16",
    },
    {
      id: "payload-rest",
      title: "Payload REST API docs",
      url: "https://payloadcms.com/docs/rest-api/overview",
      fact: "Payload generates a REST API for every collection.",
      checkedOn: "2026-11-16",
    },
  ],
});
