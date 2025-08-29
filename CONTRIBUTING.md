# Contributing to Job Board Starter

Thank you for your interest in contributing! Here's how you can help:

## Getting Started

1. Fork the repo
2. Clone it to your machine
3. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

4. Make your changes
5. Run linting: `bun run lint` or `npm run lint`
6. Commit your changes: `git commit -m 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Submit a pull request

## Development Setup

1. Install dependencies:
```bash
# Using Bun (recommended - faster)
bun install

# OR using npm
npm install
```

2. Set up Airtable:
- Create a base with a "Jobs" table
- Get your Personal Access Token
- Add required scopes (data.records:read, schema.bases:read)

3. Create a `.env` file:
```env
AIRTABLE_ACCESS_TOKEN=your_token_here
AIRTABLE_BASE_ID=your_base_id_here
```

4. Run the development server:
```bash
# Using Bun (recommended)
bun run dev

# OR using npm
npm run dev
```

## Project Structure

```
app/
  layout.tsx          # Root layout with Geist font
  page.tsx           # Home page with job listings
  jobs/
    [id]/
      page.tsx       # Individual job page
lib/
  db/
    airtable.ts     # Airtable integration
  utils/
    formatDate.ts   # Date formatting utilities
components/
  jobs/
    JobCard.tsx     # Job listing card
    JobSearch.tsx   # Search component
```

## Code Style

- Use TypeScript
- Follow ESLint rules
- Use double quotes for strings
- Use semicolons
- Write meaningful commit messages

Thank you for contributing!