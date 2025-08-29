---
title: Troubleshooting Common Installation Issues
description: Solutions to the most common issues encountered when installing and setting up Bordful.
lastUpdated: "2025-05-22"
---

# Troubleshooting Common Installation Issues

This guide addresses the most common issues you might encounter when installing and setting up your Bordful job board, along with their solutions.

## Environment Setup Issues

### Missing Environment Variables

**Issue:** Your application fails to connect to Airtable or shows errors related to environment variables.

**Solution:**
1. Ensure you've created a `.env` file in your project root
2. Verify it contains all required variables:
   ```
   AIRTABLE_ACCESS_TOKEN=your_token_here
   AIRTABLE_BASE_ID=your_base_id_here
   AIRTABLE_TABLE_NAME=your_table_name_here
   ```
3. Check for typos in your variable names and values
4. Restart your development server after making changes to environment variables

### Wrong Airtable Credentials

**Issue:** Error messages like "Authentication failed" or "Base not found" when trying to fetch data.

**Solution:**
1. Verify your Personal Access Token has these scopes:
   - `data.records:read`
   - `schema.bases:read`
2. Confirm your base is added to the token's access list
3. Double-check your Base ID by going to [Airtable](https://airtable.com/invite/r/y2hcMqpl), opening your base, and checking the URL (it will contain `airtable.com/[YOUR_BASE_ID]`)
4. Ensure your token is still valid and has not expired

## Node.js and NPM Issues

### Incompatible Node.js Version

**Issue:** Installation fails with errors related to Node.js compatibility.

**Solution:**
1. Bordful requires Node.js v18 or later
2. Check your Node.js version with:
   ```bash
   node -v
   ```
3. If your version is below v18, install the latest LTS version from [nodejs.org](https://nodejs.org/)
4. For managing multiple Node.js versions, consider using [nvm](https://github.com/nvm-sh/nvm) (Unix/macOS) or [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows)

### NPM Dependency Errors

**Issue:** `npm install` fails with dependency conflicts or missing packages.

**Solution:**
1. Clear the package manager cache:
   ```bash
   # For Bun
   bun pm cache rm
   
   # For npm
   npm cache clean --force
   ```
2. Delete dependency files:
   ```bash
   # For Bun
   rm -rf node_modules bun.lockb
   
   # For npm
   rm -rf node_modules package-lock.json
   ```
3. Reinstall dependencies:
   ```bash
   # Using Bun (recommended)
   bun install
   
   # OR using npm
   npm install
   ```
4. If issues persist, check for global npm configuration problems:
   ```bash
   npm config list
   ```

## Configuration Issues

### Missing Configuration File

**Issue:** Error indicating the config file is missing or improperly formatted.

**Solution:**
1. Create the config file by copying the example:
   ```bash
   cp config/config.example.ts config/config.ts
   ```
2. Customize the settings as needed
3. Ensure the file has the correct TypeScript format

### TypeScript Errors in Configuration

**Issue:** TypeScript errors when building or running the development server.

**Solution:**
1. Check your config.ts file for type errors
2. Ensure all required fields are present
3. Verify that object properties match the expected types
4. Compare your file with the latest config.example.ts for any structure changes
5. Fix any type errors by adjusting your configuration values

## Next.js Build and Development Issues

### Build Fails

**Issue:** Next.js build fails with various errors.

**Solution:**
1. Check for TypeScript errors in your custom code
2. Verify that all required dependencies are installed
3. Look for path or import errors in custom components
4. For specific error messages, refer to the Next.js documentation or search for the error online
5. Try clearing the Next.js cache:
   ```bash
   rm -rf .next
   ```

### Development Server Crashes

**Issue:** The development server crashes or restarts continuously.

**Solution:**
1. Check the console output for specific error messages
2. Look for problems in your custom components or pages
3. Verify that your Airtable setup is correct
4. Ensure all environment variables are properly set
5. Check for memory issues if you have a large dataset

## Airtable Data Issues

### Missing Required Fields

**Issue:** The application shows errors related to missing fields or data.

**Solution:**
1. Compare your Airtable base structure with the required fields listed in the [Installation Guide](/docs/getting-started/installation.md)
2. Ensure all required fields have the correct types (Single line text, Number, etc.)
3. Add any missing fields to your Airtable base
4. Check field names for exact spelling matches (case-sensitive)

### Empty Job Listings

**Issue:** The job board shows no listings even though you have data in Airtable.

**Solution:**
1. Verify your jobs have "active" status in the status field
2. Check that you're using the correct table name in your environment variables
3. Ensure your Airtable Personal Access Token has read permissions
4. Verify the fields in your Airtable base match those expected by Bordful
5. Check the network tab in your browser's developer tools for API errors

## Styling and UI Issues

### Tailwind Styles Not Applied

**Issue:** The application looks unstyled or CSS is not being applied correctly.

**Solution:**
1. Ensure Tailwind CSS is properly installed and configured
2. Check for any custom Tailwind configuration issues
3. Verify that the postcss.config.mjs file exists and is correctly configured
4. Rebuild your application with a clean cache:
   ```bash
   rm -rf .next
   
   # Using Bun (recommended)
   bun run build
   bun run start
   
   # OR using npm
   npm run build
   npm start
   ```

### Custom Styling Not Working

**Issue:** Your custom styling changes in the configuration are not reflected in the UI.

**Solution:**
1. Ensure your changes are in the correct format and location in the config file
2. Verify that you're using the correct Tailwind class names
3. Check that you've restarted the development server after making changes
4. Clear your browser cache to ensure you're seeing the latest styles

## Browser and Client-side Issues

### Search Not Working

**Issue:** The client-side search functionality doesn't work or shows errors.

**Solution:**
1. Check browser console for JavaScript errors
2. Ensure your Airtable data is correctly formatted
3. Verify that the search component is properly configured
4. Try a different browser to rule out browser-specific issues

### Page Navigation Problems

**Issue:** Clicking on jobs or navigation links leads to errors or incorrect pages.

**Solution:**
1. Check for routing issues in your Next.js configuration
2. Verify that all pages are correctly implemented
3. Check for invalid URLs or slugs in your job data
4. Ensure your navigation configuration is correct

## Advanced Troubleshooting

### Debugging Server-side Issues

If you're experiencing server-side rendering issues:

1. Enable more verbose Next.js logging:
   ```bash
   # Using Bun
   DEBUG=* bun run dev
   
   # OR using npm
   DEBUG=* npm run dev
   ```
2. Check server-side console logs for errors
3. Use browser developer tools to inspect network requests and responses
4. Verify that your ISR (Incremental Static Regeneration) settings are correct

### Debugging Airtable Connectivity

For deeper Airtable connectivity issues:

1. Create a simple test script to verify Airtable API access:
   ```typescript
   // test-airtable.ts
   import { fetchJobs } from './lib/db/airtable';
   
   async function testAirtable() {
     try {
       const jobs = await fetchJobs();
       console.log('Jobs fetched successfully:', jobs.length);
     } catch (error) {
       console.error('Airtable error:', error);
     }
   }
   
   testAirtable();
   ```
2. Run with:
   ```bash
   # Using Bun
   bun run test-airtable.ts
   
   # OR using npx
   npx ts-node test-airtable.ts
   ```
3. Check the output for specific error messages or data issues

## Getting Additional Help

If you're still experiencing issues after trying these solutions:

1. Check the [GitHub Issues](https://github.com/craftled/bordful/issues) for similar problems and solutions
2. Join our community discussion on [GitHub Discussions](https://github.com/craftled/bordful/discussions)
3. Provide detailed information about your issue, including:
   - Exact error messages
   - Your environment (Node.js version, OS, etc.)
   - Steps to reproduce the issue
   - Any customizations you've made

## Common Error Codes and Their Solutions

| Error Code/Message                                 | Likely Cause                         | Solution                                                |
| -------------------------------------------------- | ------------------------------------ | ------------------------------------------------------- |
| "AIRTABLE_ACCESS_TOKEN must be provided"           | Missing environment variable         | Create or update your .env file with the token          |
| "Cannot find module..."                            | Missing dependency                   | Run `npm install` to reinstall dependencies             |
| "API rate limit exceeded"                          | Too many Airtable API requests       | Implement caching or reduce request frequency           |
| "TypeError: Cannot read property 'X' of undefined" | Missing data or wrong data structure | Check your Airtable fields and data format              |
| "Failed to compile"                                | TypeScript or Next.js build errors   | Check error details and fix the specific file mentioned |

Remember that most installation issues are related to environment variables, Airtable configuration, or missing dependencies. Double-checking these areas will resolve the majority of problems you might encounter.

## Common Installation Workflows

Here are comprehensive troubleshooting workflows for common installation scenarios:

### Fresh Installation on a New System

If you're setting up Bordful on a fresh system and encountering issues:

1. **Verify System Requirements**:
   ```bash
   node -v  # Should be v18.0.0 or higher
   
   # Check package manager
   bun --version  # Recommended: v1.0.0 or higher
   # OR
   npm -v         # Should be v9.0.0 or higher
   ```

2. **Installation Order**:
   - Clone repository
   - Install dependencies
   - Set up environment variables
   - Copy and configure config.ts
   - Start development server

3. **Common Issues**:
   - Node.js version too old → Update Node.js
   - Permission errors → Run with proper permissions or use nvm
   - Network issues → Check firewall or proxy settings

### Airtable Connection Problems

For Airtable connection issues:

1. **Authentication Flow**:
   - Create Personal Access Token with correct scopes
   - Add base to access list
   - Add token to .env file
   - Restart development server

2. **Troubleshooting Steps**:
   - Verify token permissions (should have `data.records:read` and `schema.bases:read`)
   - Check base ID format (should be in `appXXXXXXXXXXXXX` format)
   - Ensure table name is correct (case-sensitive)
   - Test token with Airtable API directly (use curl or Postman)

3. **Solutions**:
   - Regenerate token if expired
   - Check for typos in environment variables
   - Verify Airtable service status

### Configuration File Problems

If you're having issues with the configuration file:

1. **Validation Steps**:
   - Check for TypeScript errors in your editor
   - Verify all required fields are present
   - Ensure configuration is syntactically correct

2. **Common Configuration Errors**:
   - Missing trailing commas
   - Incorrect nesting of properties
   - Type mismatches (e.g., using number instead of string)
   - Using undefined properties

3. **Quick Fix**:
   - Start with a fresh config.example.ts
   - Add your customizations one section at a time
   - Test after each major section

### Development Server Won't Start

If your development server won't start:

1. **Error Pattern Analysis**:
   - Port conflicts → Change port with `--port` flag
   - Memory issues → Increase Node.js memory limit
   - Build errors → Check for syntax errors in custom code

2. **Clean Start Procedure**:
   ```bash
   # Clean environment
   rm -rf .next node_modules/.cache
   
   # Reinstall dependencies if needed
   bun install  # or npm install
   
   # Start with verbose logging
   bun run dev  # or npm run dev -- --verbose
   ```

3. **Last Resort Options**:
   - Delete node_modules and reinstall dependencies
   - Clone a fresh copy of the repository
   - Check for system-level issues (disk space, permissions)

### Deployment Problems

If you're having issues deploying to production:

1. **Pre-deployment Checklist**:
   - Verify local build works (`bun run build && bun run start` or `npm run build && npm start`)
   - Check environment variables are set in deployment platform
   - Ensure all dependencies are in package.json

2. **Platform-Specific Issues**:
   - **Vercel**: Check for Node.js version, environment variables, and build settings
   - **Netlify**: Verify build command and publish directory
   - **Self-hosted**: Check server permissions and Node.js version

3. **Post-deployment Debugging**:
   - Check deployment logs for specific errors
   - Verify API routes are working correctly
   - Test Airtable connection from deployed environment 