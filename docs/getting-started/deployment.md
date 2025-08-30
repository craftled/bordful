---
title: Deployment Guide
description: Comprehensive guide to deploying your Bordful job board to various platforms including Vercel, Netlify, and Docker.
lastUpdated: "2025-05-22"
---

# Deployment Guide

This document explains how to deploy your Bordful job board to various platforms and how the configuration system works in different environments.

## Before You Deploy

### Local Build Verification

Before deploying to production, it's recommended to verify your build locally:

```bash
# Test your build locally
bun run build
bun run start
```

This ensures that your changes work correctly in a production environment before deploying to a hosting platform.

## Configuration System

Bordful uses a flexible configuration system that works differently in development and production environments.

### How Configuration Works

1. **Development Environment**:
   - The system first tries to load a custom `config.ts` file
   - If not found, it falls back to `config.example.ts`
   - This allows you to develop with your custom configuration

2. **Production Environment**:
   - In production builds, the system always uses `config.example.ts`
   - This ensures that deployments work even without a custom config file
   - For production customization, you should use environment variables

## Deployment Options

### Option 1: Deploy with Default Configuration

If you deploy the repository as-is, it will use the default configuration from `config.example.ts`. This is the simplest approach and works well for testing or if the default settings meet your needs.

### Option 2: Fork and Customize

For a customized deployment:

1. Fork the repository
2. Copy `config.example.ts` to `config.ts`
3. Customize `config.ts` with your settings
4. Commit your changes
5. Deploy your fork

This approach allows you to maintain your customizations in your own repository.

### Option 3: Environment Variables

For platforms like Vercel, Netlify, or Railway, you can use environment variables to override specific configuration values. The most important ones are:

```
NEXT_PUBLIC_APP_URL=https://your-domain.com
AIRTABLE_ACCESS_TOKEN=your_token
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=your_table_name
EMAIL_PROVIDER=your_provider
ENCHARGE_WRITE_KEY=your_key
```

## Platform-Specific Deployment

### Vercel (Recommended)

Vercel is the recommended hosting platform for Bordful as it's built with Next.js.

1. Push your code to GitHub, GitLab, or Bitbucket
2. Connect your repository to Vercel:
   - Log in to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your repository
3. Configure environment variables:
   - Add all required environment variables in the Vercel dashboard
   - Make sure to include `AIRTABLE_ACCESS_TOKEN`, `AIRTABLE_BASE_ID`, and other required variables
4. Deploy:
   - Click "Deploy"
   - Vercel will automatically build and deploy your job board

### Netlify

1. Push your code to GitHub, GitLab, or Bitbucket
2. Connect your repository to Netlify:
   - Log in to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Choose your repository
3. Configure build settings:
   - Build command: `bun run build`
   - Publish directory: `.next`
4. Configure environment variables:
   - Add all required environment variables in the Netlify dashboard
5. Add a `netlify.toml` file with build settings:

```toml
[build]
  command = "bun run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "18"
```

6. Deploy:
   - Click "Deploy site"
   - Netlify will build and deploy your job board

### Docker

A Dockerfile is included in the repository. To build and run:

```bash
# Build the Docker image
docker build -t bordful .

# Run the container
docker run -p 3000:3000 bordful
```

For production use with environment variables:

```bash
docker run -p 3000:3000 \
  -e AIRTABLE_ACCESS_TOKEN=your_token \
  -e AIRTABLE_BASE_ID=your_base_id \
  -e AIRTABLE_TABLE_NAME=your_table_name \
  -e NEXT_PUBLIC_APP_URL=https://your-domain.com \
  bordful
```

## Custom Domain Setup

Once deployed, you can add a custom domain to your job board:

1. **Purchase a domain**: Through a domain registrar like Namecheap, GoDaddy, or Google Domains
2. **Add the domain to your hosting platform**:
   - In Vercel: Go to Project → Settings → Domains → Add
   - In Netlify: Go to Site settings → Domain management → Add custom domain
3. **Configure DNS settings**: Follow the instructions provided by your hosting platform
4. **Enable HTTPS**: Most platforms handle this automatically, but verify it's enabled

## Troubleshooting

### Common Deployment Issues

1. **Missing Configuration**: If you see errors about missing configuration, check that your environment variables are set correctly.

2. **Build Errors**: If you encounter build errors related to configuration, make sure you're using the latest version of the configuration system.

3. **API Connection Issues**: If the job board can't connect to Airtable, verify your Airtable credentials and ensure your token has the correct permissions.

4. **404 Page on Routes**: If you're seeing 404 errors for pages that should exist, check your Next.js configuration and ensure all routes are properly exported.

## Best Practices

1. **Use Environment Variables for Secrets**: Never commit sensitive information like API keys to your repository.

2. **Test Locally Before Deploying**: Run a production build locally to catch any issues before deployment.

3. **Keep Your Fork Updated**: Regularly pull changes from the upstream repository to get the latest features and fixes.

4. **Set Up Continuous Deployment**: Configure your hosting platform to automatically deploy when you push to your main branch.

5. **Monitor Your Application**: Set up error tracking and performance monitoring for your production deployment.

## Next Steps

- [Configure Analytics](/docs/guides/analytics.md) - Add analytics tracking to your job board
- [Set Up Email Alerts](/docs/guides/job-alerts.md) - Configure email alerts for new job postings
- [Performance Optimization](/docs/advanced/performance-optimization.md) - Tips for optimizing your job board's performance

## Related Documentation

- [Deployment Examples](/docs/examples/index.md) - Specific examples for different platforms
- [Environment Variables](/docs/reference/environment-variables.md) - Complete reference for all environment variables
- [Configuration Guide](/docs/getting-started/configuration.md) - Comprehensive guide to Bordful configuration 