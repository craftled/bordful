---
title: Getting Started with Bordful
description: Learn how to set up and configure your Bordful job board in minutes.
lastUpdated: "2025-05-22"
---

Bordful is a modern, open-source job board built with Next.js, Tailwind CSS, and Airtable. This guide will help you get your job board up and running quickly.

## 1. Clone the Repository

Start by cloning the Bordful repository to your local machine:

```bash
git clone https://github.com/tomaslau/bordful.git
cd bordful
```

## 2. Install Dependencies

Install the required dependencies using Bun:

```bash
# Install dependencies
bun install
```

## 3. Set Up Airtable

Bordful uses Airtable as its database. You have two options for setting up Airtable:

### Option A: Use the Template (Recommended)

- Visit the [Bordful Airtable template](https://airtable.com/apprhCjWTxfG3JX5p/shrLqfxgbensCY393/tblBFcWLWFxosr0ey)
- Click "Use this data" in the top right corner
- Note the name of your table (default is "Jobs")

### Option B: Manual Setup

Create a new Airtable base with a "Jobs" table containing these fields:

```typescript
interface Job {
  title: string;           // Single line text
  company: string;         // Single line text
  description: string;     // Long text
  location: string;        // Single line text
  type: string;            // Single select: Full-time, Part-time, Contract, Freelance
  remote: boolean;         // Checkbox
  salary_min: number;      // Number
  salary_max: number;      // Number
  currency: string;        // Single select
  posted_date: Date;       // Date
}
```

## 4. Configure Environment Variables

Create a `.env.local` file in the project root with your Airtable credentials:

```env
AIRTABLE_ACCESS_TOKEN=your_access_token
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=Jobs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Start the Development Server

Run the development server to see your job board in action:

```bash
# Start the development server
bun run dev
```

Visit `http://localhost:3000` in your browser to see your job board.

## Next Steps

Now that your job board is up and running, explore these resources to customize it:

- Add your branding and customize the theme
- Configure job filters and search options
- Set up email notifications for job alerts
- Deploy your job board to production

Check out these guides for more detailed information:

- [Airtable Setup Guide](/docs/guides/airtable-setup)
- [Theming and Customization](/docs/guides/theming-customization)
- [Job Alerts Configuration](/docs/guides/job-alerts-configuration)
- [Deployment Guide](/docs/guides/deployment) 