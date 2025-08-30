---
title: Installation Guide
description: A step-by-step guide to installing and setting up your Bordful job board.
lastUpdated: "2025-05-22"
---

# Installation Guide

This guide provides detailed instructions for installing and setting up your Bordful job board from scratch. Follow these steps to get your job board up and running quickly.

## Prerequisites

Before you begin, ensure you have the following:

- [Bun](https://bun.sh/) (v1.0 or later) - includes Node.js runtime
- Package manager: [Bun](https://bun.sh/)
- An [Airtable](https://airtable.com/invite/r/y2hcMqpl) account
- Basic knowledge of JavaScript/TypeScript and React
- Git installed on your system

## Step 1: Clone the Repository

Start by cloning the Bordful repository to your local machine:

```bash
git clone https://github.com/craftled/bordful
cd bordful
```

## Step 2: Install Dependencies

Install the required dependencies using Bun:

```bash
# Install dependencies
bun install
```

This will install all the necessary packages defined in the `package.json` file, including Next.js, Tailwind CSS, and other dependencies.

## Step 3: Set Up Airtable

Bordful uses Airtable as its backend database. You have two options for setting up your Airtable base:

### Option A: Quick Setup with Template (Recommended)

1. Visit the [demo base template](https://airtable.com/apprhCjWTxfG3JX5p/shrLqfxgbensCY393/tblBFcWLWFxosr0ey)
2. Click "Use this data" in the top right corner
3. Make a note of your table name (default is "Jobs") - you'll need this for the `AIRTABLE_TABLE_NAME` environment variable
4. The template includes demo data and all required fields properly configured

### Option B: Manual Setup

If you prefer to set up your Airtable base manually:

1. Create a new base in Airtable
2. Create a table with your desired name (default is "Jobs") with these fields:

```
title: Single line text
company: Single line text
type: Single select (Full-time, Part-time, Contract, Freelance)
salary_min: Number
salary_max: Number
salary_currency: Single select (USD, EUR, GBP, USDT, USDC, BTC, ETH, etc.)
salary_unit: Single select (hour, day, week, month, year, project)
description: Long text (with rich text enabled)
benefits: Long text (plain text, recommended format: "• Benefit 1\n• Benefit 2\n• Benefit 3", max 500 characters)
application_requirements: Long text (plain text, comma-separated format, max 500 characters)
apply_url: URL
posted_date: Date
valid_through: Date (application deadline date)
job_identifier: Single line text (unique identifier/reference code for the job)
job_source_name: Single line text (the name of the job source platform, e.g. "LinkedIn Jobs", "Workable", "Figma Careers")
status: Single select (active, inactive)
workplace_type: Single select (On-site, Hybrid, Remote, Not specified)
remote_region: Single select (Worldwide, Americas Only, Europe Only, Asia-Pacific Only, US Only, EU Only, UK/EU Only, US/Canada Only)
timezone_requirements: Single line text
workplace_city: Single line text
workplace_country: Single select (from ISO 3166 country list)
career_level: Multiple select (Internship, Entry Level, Associate, Junior, Mid Level, Senior, Staff, Principal, Lead, Manager, Senior Manager, Director, Senior Director, VP, SVP, EVP, C-Level, Founder, Not Specified)
visa_sponsorship: Single select (Yes, No, Not specified)
featured: Checkbox
languages: Multiple select (format: "Language Name (code)", e.g. "English (en)", "Spanish (es)", "French (fr)")
```

#### Schema.org Enhanced Fields (Optional but Recommended for SEO)

```
skills: Long text (skills required for the position)
qualifications: Long text (specific qualifications needed)
education_requirements: Long text (educational background needed)
experience_requirements: Long text (experience needed for the position)
responsibilities: Long text (key responsibilities of the role)
industry: Single line text (industry associated with the job)
occupational_category: Single line text (preferably using O*NET-SOC codes, e.g. "15-1252.00 Software Developers")
```

#### Important Notes

- **Currency Format**: For `salary_currency`, it's recommended to use the format "CODE (Name)" such as "USD (United States Dollar)" or "BTC (Bitcoin)" for clarity. The system supports both traditional fiat currencies and cryptocurrencies.
- **Schema.org Fields**: The additional schema.org fields are optional but highly recommended for improved SEO and Google Jobs integration. See [Schema.org Implementation](/docs/advanced/schema-implementation.md) for more details.

### Airtable API Setup (For Both Options)

After setting up your Airtable base:

1. Create a Personal Access Token at [https://airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Add these scopes to your token:
   - `data.records:read`
   - `schema.bases:read`
3. Add your base to the token's access list
4. Copy your Access Token and Base ID for the next step

## Step 4: Environment Setup

Configure your environment variables to connect Bordful to your Airtable base:

1. Copy the `.env.example` file to `.env` (keep the example file for reference):

```bash
cp .env.example .env  # or copy manually if you're on Windows
```

2. Fill in your Airtable credentials in the `.env` file:

```env
AIRTABLE_ACCESS_TOKEN=your_token_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=your_table_name_here (defaults to "Jobs" if not specified)
```

> **Note**: Keep the `.env.example` file intact. If you need to start fresh or share the project, you'll have a reference for the required environment variables.

## Step 5: Configuration Setup

Bordful uses a flexible configuration system that allows you to customize various aspects of your job board:

1. Copy the example configuration file:

```bash
cp config/config.example.ts config/config.ts
```

2. Open `config/config.ts` in your code editor and customize the settings as needed:
   - Update site title and description
   - Configure navigation and social links
   - Set up your hero section
   - Customize job listing options
   - And more...

For detailed configuration options, see [Configuration Reference](/docs/reference/configuration-options.md).

For detailed information about setting up Airtable, see [Airtable Setup Guide](/docs/getting-started/airtable-setup.md).

## Step 6: Start the Development Server

Now that you've set up your environment and configuration, start the development server:

```bash
# Start the development server
bun run dev
```

Visit `http://localhost:3000` in your browser to see your job board in action!

## Step 7: Verify Your Setup

After starting the development server, check the following to ensure everything is working correctly:

1. Visit the homepage and verify that job listings appear
2. Click on a job to view the job details page
3. Test the filters and search functionality
4. Check that the navigation and footer are displaying correctly

If you encounter any issues, see the [Installation Troubleshooting](/docs/troubleshooting/installation-issues.md) guide for solutions to common problems.

## Next Steps

Now that your Bordful job board is up and running, you might want to:

1. [Customize the theme and branding](/docs/guides/theming-customization.md)
2. [Configure the hero section](/docs/guides/hero-section.md)
3. [Set up navigation and footer](/docs/guides/navigation.md)
4. [Configure the pricing page](/docs/guides/pricing.md)
5. [Set up email provider integration](/docs/guides/email-integration.md)
6. [Deploy your job board](/docs/guides/deployment.md)

## Local Build Verification

Before deploying to production, it's recommended to verify your build locally:

```bash
# Test your production build
bun run build
bun run start
```

This ensures that your changes work correctly in a production environment before deploying to a hosting service like Vercel or Netlify.

## Related Documentation

- [Configuration Guide](/docs/reference/configuration-options.md)
- [Airtable Setup Guide](/docs/getting-started/airtable-setup.md)
- [Deployment Guide](/docs/guides/deployment.md)
- [Theming Customization](/docs/guides/theming-customization.md) 