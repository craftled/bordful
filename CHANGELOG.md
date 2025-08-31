# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.58] - 2025-08-31

### Fixed
- Added explicit width/height attributes to all `<img>` elements for better Core Web Vitals
- Converted `forEach` loops to `for...of` loops for improved performance
- Resolved all type safety issues from previous phases
- Fixed build warnings related to config file loading

### Changed
- Enhanced image performance by preventing layout shifts with explicit dimensions
- Improved array iteration performance with modern loop constructs
- Optimized static generation with 49/49 pages successfully generated

## [0.1.57] - 2025-08-30

### Changed
- Centralized magic number constants into `lib/constants/defaults.ts` for better maintainability
- Moved regex literals to top-level constants for improved performance optimization
- Enhanced type annotations with explicit types for better code clarity and type safety
- Simplified parameter assignment by using local variables instead of mutating function parameters
- Improved code structure with more DRY (Don't Repeat Yourself) patterns and pragmatic simplifications

### Fixed
- Fixed regex literal performance issues by moving to module-level constants
- Resolved parameter assignment warnings with proper local variable usage
- Eliminated implicit any type warnings with explicit type annotations
- Fixed import organization and formatting issues

## [0.1.56] - 2025-08-30

### Changed
- Migrated from ESLint/Prettier to Ultracite/Biome for lightning-fast linting and formatting
- Updated package.json scripts to use `bunx ultracite lint` and `bunx ultracite format`
- Updated all code comments from ESLint disable to Biome ignore comments
- Enhanced VS Code configuration with Biome formatter and linter settings
- Updated documentation across README.md, CONTRIBUTING.md, and all docs files
- Added Cursor AI rules (9 rule files) for enhanced AI-assisted development

### Removed
- Removed ESLint and Prettier dependencies
- Cleaned up ESLint/Prettier references from all documentation files
- Removed npm package manager references in favor of Bun-only approach

## [0.1.55] - 2025-08-29

### Changed
- Migrated from npm to Bun for faster package management and builds
- Updated package.json scripts to use Bun with `--bun` flag for optimal performance
- Enhanced documentation across all files to recommend Bun as primary package manager
- Updated guides, docs, and README with Bun instructions
- Added Bun lockfile (bun.lockb) to .gitignore for proper version control

### Removed
- Removed package-lock.json and npm-managed node_modules
- Cleaned up npm-specific references in favor of Bun recommendations

## [0.1.54] - 2025-08-05

### Changed
- Updated Next.js to 15.4.5 with React 19.1.1 for latest performance improvements
- Upgraded React Markdown to 10.1.0 for performance improvements
- Enhanced data validation with robust error handling for invalid dates and missing fields
- Improved build stability by adding defensive programming throughout the application

### Fixed
- Fixed date handling in job metadata generation and RSS/Atom feeds
- Enhanced slug generation with null/undefined checks for missing job data
- Improved structured data generation with proper date validation
- Fixed job type handling in metadata generation for jobs with missing type fields

## [0.1.53] - 2025-05-05

### Fixed
- Fixed Cumulative Layout Shift (CLS) issues with images:
  - Added explicit width and height styles to the navigation logo image
  - Replaced `maxHeight` and `width: "auto"` with fixed pixel dimensions in the footer logo
  - Fixed social icons in navigation to use explicit pixel dimensions instead of relative classes
  - Reduced layout shifts caused by missing image dimensions during page load
  - Improved overall CLS score for better page performance

## [0.1.52] - 2025-05-05

### Fixed
- Improved semantic HTML structure in sidebar components:
  - Changed filter category headings in JobFilters sidebar from h2 to h3 elements
  - Changed detail section headings in JobDetailsSidebar from h2 to h3 elements
  - Made "Job Details" heading size consistent with "Filters" heading
  - Enhanced SEO and accessibility with proper heading hierarchy
  - Maintained visual appearance with consistent styling

## [0.1.51] - 2025-05-05

### Fixed
- Enhanced markdown rendering with robust stack-based list tracking:
  - Implemented advanced stack-based approach for tracking list hierarchy
  - Fixed complex nested list rendering with bolded headers and sublists
  - Added intelligent context-aware list item formatting
  - Improved handling of mixed formatting (bold headers followed by nested lists)
  - Enhanced indentation management based on list hierarchy depth
  - Added special treatment for paragraph spacing around bolded headers
  - Preserved list hierarchy across multiple nesting levels
  - Fixed regression issues with complex list structures

## [0.1.50] - 2025-05-05

### Changed
- Optimized job description markdown rendering:
  - Implemented single-pass processing for better performance
  - Enhanced paragraph formatting to render each line as a separate paragraph
  - Consolidated multiple functions into a cleaner, more maintainable solution
  - Removed redundant code and simplified logic
  - Improved handling of special line types (lists, headings, code blocks)
  - Reduced memory usage with fewer intermediate data structures

## [0.1.49] - 2025-05-04

### Fixed
- Improved Markdown preprocessing for job descriptions with targeted fixes

## [0.1.48] - 2025-04-24

### Fixed
- Enhanced Markdown rendering for job descriptions with improved formatting:
  - Implemented robust preprocessing for Airtable markdown content to handle common formatting issues
  - Fixed issues with bold text containing trailing spaces (`**text **` → `**text**`)
  - Added proper handling of paragraphs mixed with ordered and unordered lists
  - Ensured proper spacing between section headings and list items
  - Fixed formatting of section headings within list items
  - Added proper indentation for content following headings in lists
  - Configured remarkStringify with optimal settings for consistent output
  - Maintained compatibility with existing well-rendered job posts
  - Followed CommonMark specification for standardized rendering
  - Improved overall readability of job descriptions with consistent formatting

## [0.1.47] - 2025-04-24

### Fixed
- Fixed job-specific OG image generation that was broken after markdown processing centralization:
  - Changed the runtime from `edge` to `nodejs` to ensure full environment variable access
  - Replaced direct Airtable API client with centralized `getJobs()` function for consistent behavior
  - Restored `generateJobSlug` usage for job matching to maintain consistency with the rest of the application
  - Added improved error handling and logging for better diagnostics
  - Fixed route handler approach with proper job data fetching and rendering

## [0.1.46] - 2025-04-23

### Changed
- Centralized Markdown cleaning into a new `normalizeMarkdown` utility (unified + remark-based), replacing the old `cleanMarkdownFormatting` and `processAirtableMarkdown` functions.
- Updated `getJobs` and `getJob` in `lib/db/airtable.ts` to use `normalizeMarkdown` for job descriptions.
- Removed the obsolete `cleanMarkdownFormatting` implementation and deleted `lib/utils/airtableMarkdown.ts`.
- Simplified the ReactMarkdown usage in `app/jobs/[slug]/page.tsx` to render the pre-cleaned `job.description` directly.
- Refactored component overrides to eliminate unsupported props and reduce complexity.
- Installed dependencies: `unified`, `remark-parse`, `remark-gfm`, and `remark-stringify`.
- Reduced client bundle size and improved maintainability by moving all Markdown parsing to server-side only.

## [0.1.45] - 2025-04-23

### Changed
- Enhanced Airtable markdown rendering for job descriptions:
  - Created a dedicated utility module for handling Airtable's markdown format
  - Implemented a truly pattern-agnostic solution that works with any job description content
  - Removed all hardcoded content patterns in favor of structural pattern detection
  - Created a comprehensive line-by-line processor that handles all formatting variations
  - Added intelligent state tracking to properly manage list hierarchies and indentation
  - Implemented smart heuristics to detect headers vs. list items based on structure, not content
  - Added pre-processing and post-processing steps for more reliable formatting
  - Improved paragraph detection and formatting with proper spacing between paragraphs
  - Fixed issues with bolded text being confused as list items
  - Properly handled italic text that should be rendered as bold (common in Airtable)
  - Fixed list item indentation based on context rather than specific content
  - Added support for Airtable's specific rich text format features
  - Improved handling of checkboxes with proper rendering as interactive elements
  - Enhanced code block and inline code styling with better visual presentation
  - Added support for blockquotes with proper styling
  - Fixed handling of Airtable's trailing newline character in API responses
  - Improved list formatting for both bullet and numbered lists with proper nesting
  - Enhanced spacing and formatting consistency across all markdown elements
  - Made links open in new tabs with proper security attributes
  - Fixed specific formatting issues with asterisks in list items
  - Fixed nested list indentation for better readability
  - Added special handling for section headers in lists
  - Improved handling of emoji characters in formatted text
  - Added special handling for bold list items with normal subitems
  - Enhanced ReactMarkdown component to properly style bold list items
  - Increased indentation for nested lists for better visual hierarchy

## [0.1.44] - 2025-04-22

### Added
- Added Twitter site metadata for improved Twitter card integration:
  - Implemented automatic Twitter handle extraction from config-specified Twitter URL
  - Added `twitter:site` metadata tag with proper @ prefix
  - Made Twitter site tag conditional on Twitter social link being enabled
  - Enhanced social sharing functionality with improved Twitter card validation
  - Maintained compatibility for users without Twitter presence

## [0.1.43] - 2025-04-22

### Fixed
- Fixed navbar dropdown menu z-index issue:
  - Increased dropdown menu z-index from 10 to 50 to ensure proper layering above hero sections
  - Added relative positioning with z-index 40 to the header element for proper stacking context
  - Resolved issue with dropdown menu items being unclickable when overlapping with hero content
  - Ensured consistent behavior across all pages with different hero section configurations

## [0.1.42] - 2025-04-22

### Added
- Enhanced job alerts form with comprehensive text customization:
  - Added configurable text options for entire job alerts page
  - Made hero section text fully customizable (badge, title, description)
  - Added form field customization (labels, placeholders, validation messages)
  - Added success message and button text customization options
  - Added toast notification message configuration
  - Enhanced user experience with consistent white-labeling capabilities
  - Updated documentation with detailed configuration options
  - Maintained backward compatibility with fallbacks for all text fields

## [0.1.41] - 2025-04-21

### Fixed
- Fixed robots.txt configuration to allow scraping of Open Graph images:
  - Updated robots.txt rules to specifically allow `/api/og/*` paths
  - Maintained security by keeping other API routes protected
  - Enabled proper social media preview generation from external sites
  - Fixed issue where external sites couldn't scrape OG images due to robots.txt restrictions

## [0.1.40] - 2025-04-20

### Added
- Added new `job_source_name` field to the Airtable schema:
  - Added field for storing job source platform names (e.g., "LinkedIn Jobs", "Workable", "Figma Careers")
  - Updated Job interface with new optional field in `lib/db/airtable.ts`
  - Updated `JobDetailsSidebarProps` interface to include the new field
  - Made Job Source section in sidebar conditional to only appear when job_source_name is provided
  - Updated documentation in README.md and schema-implementation.md

## [0.1.39] - 2025-04-20

### Added
- Made default job validity duration configurable (`jobs.defaultValidityDays`):
  - Added `defaultValidityDays` setting to `config.example.ts` (default: 30 days).
  - Updated `JobSchema` component (`components/ui/job-schema.tsx`) to use the configured value for the `validThrough` property in structured data when an explicit expiration date is not provided.

## [0.1.38] - 2025-04-19

### Changed
- Enhanced Markdown job description formatting (`cleanMarkdownFormatting`):
  - Improved handling of bold text within list items, including cases with trailing spaces.
  - Added robust paragraph break detection to correctly separate standalone bold text and sentences (like mottos) without hardcoding specific phrases.
  - Ensured consistent spacing around bold headers and between list items and bold text.
  - Refined regex patterns for better accuracy and robustness against various Markdown inconsistencies from Airtable.

## [0.1.37] - 2025-04-18

### Changed
- Enhanced job filters mobile experience:
  - Made filters collapsible on mobile for better space utilization
  - Added expandable/collapsible toggle next to "Filters" heading
  - Added visual affordance with chevron indicators for expandable sections
  - Removed redundant toggle controls for cleaner UI
  - Fixed extra spacing issues when filters are collapsed
  - Maintained desktop experience with filters always visible
- Improved post job banner placement:
  - Implemented responsive post job banner placement strategy
  - Displayed below pagination on mobile screens for better content hierarchy
  - Maintained traditional sidebar placement on desktop for space efficiency
  - Enhanced mobile-first content focusing on primary job listings first
  - Created consistent banner visibility across different device sizes

## [0.1.36] - 2025-04-18

### Added
- Added configurable job report functionality:
  - Added report button in job details sidebar
  - Implemented mailto link with customizable email and subject
  - Added prefilled message template with job details
  - Made all aspects configurable through `jobReport` config section

## [0.1.35] - 2025-04-15

### Added
- Added hero section background customization options:
  - Added background image support with overlay capabilities:
    - Configurable image source, position, and size
    - Semi-transparent color overlay for better text contrast
    - Responsive design with optimal image size recommendations
    - Performance optimization best practices
  - Implemented both linear and radial gradient options:
    - Added configuration for gradient type (linear/radial), direction, colors, and stops
    - Created intelligent color stop handling with optional percentage values
  - Maintained backward compatibility with solid background color
  - Enhanced visual depth with layered background options
  - Implemented proper precedence (image > gradient > solid color)
  - Made all background settings fully configurable via config file

## [0.1.34] - 2025-04-15

### Added
- Implemented Google-compliant 404 handling for inactive job posts:
  - Added status checks to ensure inactive jobs return 404 responses as per Google's structured data guidelines
  - Enhanced job not-found page with clearer messaging about expired or removed job listings
  - Updated "Back to Jobs" button to use consistent primary color and styling from other site buttons
  - Improved error messages to explain that jobs may be removed when positions are filled
  - Added consistent status checking across all job-related API routes and pages
  - Updated Open Graph API routes to return 404 for inactive jobs
  - Enhanced getJob() function to properly filter inactive jobs
  - Added explicit status filter to generateStaticParams() for job detail pages

## [0.1.33] - 2025-04-15

### Added
- Added job-specific OG image generation for enhanced social sharing:
  - Created new API route `/api/og/jobs/[slug]` for dynamic job-specific OG images
  - Implemented company name display above job title for better branding
  - Added job details display (job type, location) when available
  - Integrated with existing OG image styling and configuration
  - Added intelligent job type extraction from job titles when Airtable data is unavailable
  - Enhanced title case formatting for proper capitalization
  - Made all aspects customizable through `config.og.jobs` settings
  - Followed Next.js best practices for file-based API routes
  - Used Edge Runtime for optimal performance
  - Added proper error handling and fallback mechanisms

## [0.1.32] - 2025-04-13

### Added
- Enhanced OpenGraph image generation with DRY code optimization:
  - Created centralized shared style constants for dimensions, fonts, and z-indices
  - Added reusable `fetchImageAsDataURI` helper function for both logo and background images
  - Improved type safety with proper TypeScript interfaces for all config options
  - Created comprehensive constants system for consistent styling
  - Consolidated duplicated image handling code
  - Enhanced maintainability with organized code sections and better comments
  - Removed redundant style definitions for better consistency

## [0.1.31] - 2025-04-13

### Added
- Added layered background image support to OpenGraph images:
  - Added `backgroundImage` config option to specify image path from public folder
  - Added `backgroundOpacity` option (0-1) to control color overlay transparency
  - Implemented HEX to RGBA color conversion for semi-transparent overlays
  - Added support for both local and remote background images
  - Maintained proper z-index layering (background → color overlay → content)
  - Enhanced visual depth with multi-layered design
  - Error handling for missing or invalid background images
- Added gradient overlay support to OpenGraph images:
  - Added `gradient` configuration with customizable properties
  - Implemented bottom-to-top fade effect with brand color
  - Added controls for gradient angle, start opacity, and end opacity
  - Created custom linear gradient generator with proper color handling
  - Enhanced visual depth with layered background elements
  - Made gradient configurable and optional via config file
  - Added proper z-index prioritization between layers

### Fixed
- Fixed OpenGraph (OG) image logo display issues:
  - Changed default logo width behavior to use fixed pixel values (185px) instead of "auto"
  - Added documentation warning about Satori's limitation with "auto" width values
  - Updated example configuration to use recommended fixed width values
  - Fixed logo rendering issues by explicitly setting dimensions
- Fixed OG image rendering error with Satori:
  - Added explicit `display: flex` to nested div elements
  - Added proper flex properties to all container elements
  - Simplified layout structure to avoid nested containers
  - Fixed zIndex property to use unitless value
  - Resolved issues with background image and overlay rendering
  - Removed unnecessary div wrappers to improve compatibility
  - Ensured compatibility with Vercel's OG image renderer
- Fixed text wrapping in OG images:
  - Increased headline max-width from 900px to 1080px
  - Increased description max-width from 800px to 1080px
  - Optimized text container to use full available content width (accounting for 60px padding)
  - Improved text layout to allow more content per line
  - Maintained readability while maximizing text container capacity

### Changed
- Enhanced OpenGraph image layout:
  - Repositioned headline and description to bottom left corner
  - Changed text alignment from center to left
  - Added consistent 60px padding on all sides
  - Improved typography with adjusted max-width constraints
  - Created more balanced composition with logo at top, text at bottom
  - Enhanced readability with better text positioning
  - Maintained proper spacing between title and description

## [0.1.30] - 2025-04-13

### Added
- Enhanced OpenGraph (OG) image logo support:
  - Added direct logo configuration with `show`, `src`, `width`, `height`, and `position` options
  - Added support for PNG, JPG, and other image formats in addition to SVG
  - Improved logo rendering with proper aspect ratio preservation
  - Added support for absolute URLs in logo source
  - Fixed TypeScript type definitions for better consistency
  - Enhanced error handling with detailed error messages
  - Improved documentation with examples in config file
  - Added proper content-type detection for different image formats

## [0.1.29] - 2025-04-12

### Added
- Added footer logo to dynamic Open Graph (OG) image (`/api/og`):
  - Fetches logo SVG specified in `config.footer.brand.logo.src`.
  - Removes internal `width` and `height` attributes from SVG markup to allow CSS control.
  - Renders logo in the top-left corner with 60px padding.
  - Sets explicit `height` (56px) and calculated `width` (based on aspect ratio) via CSS on the `<img>` tag to ensure correct rendering in Satori/`@vercel/og`.

## [0.1.28] - 2025-04-12

### Added
- Improved dynamic Open Graph (OG) image generation:
  - Fixed custom font loading (Inter, IBM Plex Serif) by fetching directly from Google Fonts using `@vercel/og`'s supported method.
  - Adjusted headline font weight in OG image to 800 for better visual consistency with the homepage.

## [0.1.27] - 2025-04-12

### Added
- Dynamic OG image generation for the homepage:
  - Created an API route with Vercel OG for generating Open Graph images
  - Uses the website title, description, and brand colors from config
  - Applies the font family specified in the configuration
  - Enhances social sharing with customized preview images

## [0.1.26] - 2025-04-11

### Changed
- Enhanced hero section responsiveness and layout:
  - Fixed excessive left spacing on mobile for about, pricing, and contact pages
  - Improved mobile-first approach with better padding control
  - Maintained proper 50/50 split on desktop while optimizing mobile layout
  - Removed redundant margin on mobile for cleaner spacing
  - Enhanced container padding with responsive breakpoints
  - Optimized content width and spacing across all screen sizes

## [0.1.25] - 2025-04-09

### Changed
- Enhanced UI consistency and mobile responsiveness across the site:
  - Improved job post page layout on mobile by centering "Apply before" date below the apply button
  - Updated footer to left-align "Built with" line and logo on smaller screens
  - Made "View all" buttons on /jobs page consistent with other site buttons (size, capitalization)
  - Enhanced button hover effects with solid backgrounds for better visibility
  - Removed moving animations on button hover for more stable UI
  - Updated toast notifications with solid backgrounds to ensure readability on dark backgrounds
  - Improved job-alerts subscription form styling to match the rest of the site
  - Made input fields smaller and consistent with other forms
  - Updated contact page boxes to match site styling and removed Card components
  - Replaced Lucide Twitter icon with SVG from assets folder
  - Made contact page layout full-width with 4 cards in one row
  - Positioned contact information as the first card in the grid

## [0.1.24] - 2025-04-09

### Changed
- Enhanced navigation mobile responsiveness:
  - Added Post Job button next to hamburger menu on small screens
  - Improved responsive breakpoint from md (768px) to lg (1024px) for better layout stability
  - Prevented content wrapping and social icon scaling with whitespace-nowrap
  - Implemented binary responsive approach - full desktop or mobile view with no problematic in-between states
  - Maintained visual consistency with desktop button styling
  - Improved mobile UX by making primary CTA immediately accessible
  - Ensured proper spacing and alignment with compact styling
  - Created comprehensive documentation in `docs/navbar-customization.md`
  - Updated mobile menu to avoid duplicate Post Job buttons
- Improved social icons implementation:
  - Moved RSS icon to `/assets/social/` folder for consistency with other social icons
  - Refactored social platform configuration with better TypeScript type safety
  - Enhanced platform configuration with dedicated enabled/getUrl functions
  - Removed Lucide RSS icon dependency in favor of SVG
  - Unified rendering approach for all social links including RSS
- Enhanced similar jobs component in sidebar:
  - Fixed text wrapping by adding proper flex-wrap to job metadata
  - Reduced job title size from text-sm to text-xs for better space efficiency
  - Added tighter line height with leading-tight for more compact display
  - Decreased metadata text to 10px for improved information density
  - Fixed typo in CSS class and reduced spacing between elements
  - Improved overall layout consistency with more compact styling

## [0.1.23] - 2025-04-08

### Changed
- Refactored navigation component with improved DRY principles:
  - Created custom `useDropdownMenu` hook for centralized dropdown state management
  - Improved TypeScript type safety with proper interface definitions for social platforms
  - Unified navigation item rendering for both mobile and desktop with single source of truth
  - Enhanced social media icon implementation with centralized configuration
  - Optimized hover effects for dropdown menus with delayed transitions
  - Improved accessibility with better ARIA attributes and keyboard navigation
  - Enhanced maintainability with proper component structure and organization

## [0.1.22] - 2025-04-08

### Changed
- Enhanced Post Job banner for UI consistency:
  - Updated Post Job button to match navbar and footer button styling
  - Added Briefcase icon to maintain visual consistency across all Post Job buttons
  - Applied responsive sizing with better touch targets for mobile devices
  - Ensured consistent spacing and alignment with other Call-to-Action buttons
  - Improved accessibility with proper ARIA attributes

## [0.1.21] - 2025-04-08

### Changed
- Enhanced footer responsiveness with optimized breakpoints:
  - Added earlier two-column layout at 300px for better mobile space utilization
  - Improved medium screen layouts with custom 960px breakpoint
  - Optimized column progression (1 → 2 → 3 → 4 → 5/6) for smoother transitions
  - Enhanced brand column layout with better proportions (3-7 split at md, 3-9 at 960px)
  - Improved touch targets for buttons on smaller screens
  - Maintained consistent styling across all screen sizes
  - Fine-tuned grid spacing for optimal content density

## [0.1.20] - 2025-04-08

### Changed
- Enhanced button styling for better UI consistency:
  - Updated button sizing to use "xs" size to match other site buttons
  - Added proper spacing and alignment with gap-1.5 class
  - Added appropriate icons for each button type
  - Used ArrowUpRight for Pricing button for better context
  - Added Briefcase icon to Post a Job button in both footer and navbar
  - Ensured consistent spacing (ml-1) between text and icons across all buttons
  - Applied consistent icon placement and styling across the entire application
  - Maintained consistent visual style with Apply Now and Contact page buttons

## [0.1.19] - 2025-04-08

### Changed
- Enhanced feed format indicators in footer:
  - Replaced bulky badges with subtle outline style format indicators
  - Reduced visual prominence with smaller text size and lighter opacity
  - Improved visual hierarchy to emphasize feed type over format
  - Created more elegant styling with minimalist border and compact sizing
  - Maintained consistent alignment and spacing with feed type names

## [0.1.18] - 2025-04-08

### Changed
- Enhanced footer layout and structure:
  - Implemented asymmetric grid layout with brand column on left and other columns on right
  - Added dedicated footer logo configuration separate from navbar
  - Optimized column spacing for better fit and readability
  - Improved responsiveness with progressive column display (1-6 columns based on screen size)
  - Made brand column sticky on desktop for better visibility
  - Enhanced vertical spacing between elements for better hierarchy

## [0.1.17] - 2025-04-07

### Added
- Enhanced footer customization with flexible column system:
  - Replaced hardcoded columns with fully customizable user-defined columns
  - Added support for custom link columns with configurable title and content
  - Added special column type for feed links (RSS, Atom, JSON)
  - Maintained support for automatic addition of feature links (Job Alerts, Pricing, FAQ, Contact)
  - Implemented proper TypeScript interfaces for better type safety
  - Made all footer columns fully responsive across all screen sizes
  - Ensured backward compatibility with existing implementations
  - Fixed boolean type handling for show/hide toggles
  - Added proper order control for column arrangement

## [0.1.16] - 2025-04-06

### Added
- Enhanced hero image configuration with per-page controls:
  - Added ability to enable/disable hero image on specific pages
  - Added support for page-specific custom hero images
  - Made hero image settings fully configurable via `config.example.ts`
  - Added comprehensive configuration for all key pages:
    - About, FAQ, and Contact pages
    - Pricing page
    - Job Alerts page
    - Jobs directory and category pages (types, levels, locations, languages)
    - Dynamic job detail pages (/jobs/level/[level], /jobs/language/[language], etc.)
  - Updated all page components to use the centralized configuration
  - Implemented optional fallback to global image settings
  - Maintained backward compatibility with existing implementations

### Changed
- Enhanced button styling consistency throughout the application:
  - Updated buttons on the FAQ page with primary color and arrow icon
  - Applied primary color styling to About page contact buttons
  - Updated Contact page buttons (SupportChannelCard and "Return Home") to use primary color
  - Enhanced email and phone links in ContactInfoSection to use primary color
  - Updated "View Jobs" buttons on category cards to use primary color when hovered
  - Ensured visual consistency across all interactive elements using the configured primary color

## [0.1.15] - 2025-04-06

### Changed
- Enhanced button styling consistency throughout the application:
  - Updated buttons on the FAQ page with primary color and arrow icon
  - Applied primary color styling to About page contact buttons
  - Updated Contact page buttons (SupportChannelCard and "Return Home") to use primary color
  - Enhanced email and phone links in ContactInfoSection to use primary color
  - Updated "View Jobs" buttons on category cards to use primary color when hovered
  - Ensured visual consistency across all interactive elements using the configured primary color

## [0.1.14] - 2025-04-06

### Added
- Added `heroSearchBgColor` config option for search input background
- Updated `JobSearchInput` component to apply this configuration using inline styles
- Added configurable hero section image (`ui.heroImage` in config)
- Updated `HeroSection` component to display image on the right with responsive layout

## [0.1.13] - 2025-04-05

### Added
- Enhanced hero section customization:
  - Added `heroTitleColor` config option for main title color
  - Added `heroSubtitleColor` config option for subtitle color
  - Added `heroStatsColor` config option for quick stats text color
  - Added `heroBadgeVariant` config option for badge base style (outline, default, etc.)
  - Added `heroBadgeBgColor`, `heroBadgeTextColor`, `heroBadgeBorderColor` config options for badge color overrides
  - Updated HeroSection component to apply these configurations using inline styles

## [0.1.12] - 2025-04-03

### Added
- Enhanced color customization with primary color support:
  - Added `primaryColor` configuration in UI settings
  - Implemented consistent primary color usage across all CTA buttons
  - Updated "Post a Job" buttons in navbar, footer and sidebar banner
  - Enhanced featured badges on job listings with primary color
  - Applied primary color to "Apply Now" buttons on job cards and detail pages
  - Added Button component support for primary color variant
  - Created comprehensive documentation in `docs/theming-customization.md`
  - Implemented DRY approach using centralized color configuration
  - Added support for Tailwind color patterns (e.g., `slate-500`) in configuration
  - Created color resolver utility that handles both CSS colors and Tailwind colors

## [0.1.11] - 2025-04-02

### Fixed
- Fixed font configuration implementation:
  - Resolved Geist font loading issues
  - Improved font initialization in the application layout
  - Enhanced font class assignment and configuration handling
  - Ensured proper font fallback behavior
  - Verified Google Fonts integration with preconnect links

### Added
- Added background customization functionality:
  - Implemented configurable background styles
  - Added support for custom background colors
  - Enhanced theme consistency across components

## [0.1.10] - 2025-04-01

### Added
- Enhanced font configuration with multiple font options:
  - Added support for Geist, Inter, and IBM Plex Serif fonts
  - Created font utility with dynamic font loading based on configuration
  - Implemented proper Google Fonts integration for Inter and IBM Plex Serif
  - Added font-specific CSS variables and Tailwind configuration
  - Optimized font loading with proper fallbacks and error handling
  - Added conditional body styling for serif fonts

## [0.1.9] - 2025-03-31

### Changed
- Enhanced mobile responsiveness:
  - Improved JobCard component for better mobile display
  - Added text truncation with line-clamp for job titles
  - Fixed metadata overflow with proper wrapping and whitespace handling
  - Optimized filter controls layout for small screens
  - Implemented responsive select widths with proper spacing
  - Improved touch targets for mobile users
  - Simplified date display on small screens
  - Enhanced filter selection UI with horizontal scrolling

## [0.1.8] - 2025-03-30

### Changed
- Enhanced job page UI consistency:
  - Fixed styling inconsistencies on the `/jobs` page to match other job pages
  - Standardized spacing and layout in the `/jobs/locations` page
  - Moved search fields to the hero section on all job detail pages for consistency with homepage
  - Added "use client" directive to JobSearchInput component
  - Improved breadcrumb and hero section alignment across all job pages
  - Implemented 3-column grid layout consistently on all category pages

## [0.1.7] - 2025-03-30

### Added
- Enhanced Pricing page configurability:
  - Added configurable badge text for hero section
  - Added SEO keywords configuration

## [0.1.6] - 2025-03-30

### Added
- Enhanced FAQ page configurability:
  - Added configurable badge text for hero section
  - Added SEO keywords configuration

## [0.1.5] - 2025-03-30

### Added
- Full Contact page customization:
  - Added configurable badge text for hero section
  - Added SEO keywords configuration
  - Added schema description configuration
  - Standardized page structure for consistency

## [0.1.4] - 2025-03-30

### Added
- Complete About page customization:
  - Added configurable section titles
  - Made all content sections fully customizable
  - Enhanced contact section with configurable title and description
  - Improved styling consistency with other pages

## [0.1.3] - 2025-03-30

### Added
- Enhanced About page configurability:
  - Added configurable badge text for the About page hero section
  - Introduced structured data schema customization options
  - Added configurable Contact Us section with show/hide toggle
  - Full customization of About page content sections

### Changed
- Improved white-label compatibility:
  - Removed hardcoded "Bordful" references from schema components
  - Enhanced schema implementation for better customization
  - Updated logo references to use navigation configuration
  - Improved DRY principles in schema implementation
  - Made logo property optional in schema with conditional rendering
  - Eliminated hardcoded logo paths for better customization

## [0.1.2] - 2025-03-30
### Fixed
- Fixed schema.org implementation to properly handle missing configuration
- Enhanced About page rendering with dynamic fallbacks

## [0.1.1] - 2025-03-30
### Added
- Enhanced About page configurability:
  - Added configurable badge text for the About page hero section
  - Introduced structured data schema customization options
  - Added configurable Contact Us section with show/hide toggle
  - Full customization of About page content sections

### Changed
- Refactored search functionality with DRY principles:
  - Created reusable `JobSearchInput` component for consistent UI
  - Implemented type-safe `useJobSearch` hook using nuqs for URL state
  - Extracted filtering logic to `filterJobsBySearch` utility function
  - Improved debouncing with 500ms delay for better typing experience
  - Added search to JobsLayout for consistent experience across pages
  - Enhanced accessibility with proper ARIA labels and keyboard navigation
  - Removed duplicate code from HomePage and JobSearch components
  - Maintained backward compatibility with existing implementations

## [0.1.0] - 2025-03-29

### Changed
- Improved contextual filtering on job subpages:
  - Fixed filter counts to accurately reflect the current filtered context
  - Ensured subpage filters (location, type, etc.) show correct counts for the specific subset of jobs
  - Modified JobsLayout to pass the already-filtered jobs to filter components
  - Enhanced user experience with more accurate filter representation
- Refactored navigation component with DRY principles:
  - Created reusable NavLink, SocialLink, and DropdownItem components
  - Improved dropdown menu hover behavior with 300ms close delay
  - Fixed "Jobs" dropdown disappearing issue with better hover detection
  - Enhanced TypeScript support with proper interfaces and types
  - Reduced code duplication with centralized rendering functions
  - Improved maintenance by centralizing styling and active link detection
  - Maintained full compatibility with configuration system

## [0.0.99] - 2025-03-28

### Changed
- Refactored sort order dropdown with nuqs integration:
  - Created reusable `SortOrderSelect` component for consistent UI
  - Implemented type-safe `useSortOrder` hook using nuqs
  - Removed duplicate code from HomePage and JobsLayout
  - Improved URL parameter handling with proper defaults
  - Enhanced type safety with TypeScript interfaces
  - Optimized performance with efficient URL updates
  - Maintained accessibility with proper ARIA attributes
  - Added loading state to prevent multiple rapid selections
  - Added error handling for invalid values
- Refactored pagination with nuqs integration:
  - Created reusable `PaginationControl` component for consistent UI
  - Implemented type-safe `usePagination` hook using nuqs
  - Removed duplicate pagination logic from HomePage and JobsLayout
  - Improved URL parameter handling with proper defaults
  - Enhanced type safety with TypeScript interfaces
  - Optimized performance with efficient URL updates
  - Maintained accessibility with proper ARIA attributes
  - Added loading state for better user experience
  - Reduced code duplication and improved maintainability
- Refactored Job Type filters with improved DRY principles:
  - Created reusable `FilterItem` component to eliminate duplicate markup
  - Implemented URL-based state management with nuqs for shareable filters
  - Utilized constants from lib/constants instead of hardcoded values
  - Enhanced code maintainability with Object.entries() pattern
  - Improved user experience with persistent filter selections across page reloads
  - Added browser history support for back/forward navigation with filters
  - Aligned filter state management with existing pagination and sorting patterns
- Extended filter system to job subpages for unified filtering experience:
  - Integrated optimized filter components in JobsLayout used by all job subpages
  - Added consistent filtering capabilities across all pages (home, job types, career levels, etc.)
  - Implemented smart filter handling to properly filter already-filtered job listings
  - Maintained proper type safety with TypeScript for all filter operations
  - Enhanced user experience by allowing additional filtering on category-specific pages
  - Reduced code duplication by reusing the same components across the entire application
  - Ensured URL parameters work consistently between main job page and subpages

## [0.0.98] - 2025-03-25

### Changed
- Enhanced jobs per page selector with nuqs integration:
  - Created reusable `JobsPerPageSelect` component for consistent UI
  - Implemented type-safe `useJobsPerPage` hook using nuqs
  - Added NuqsAdapter to root layout for URL state management
  - Removed duplicate code from HomePage and JobsLayout
  - Improved URL parameter handling with proper defaults
  - Enhanced type safety with TypeScript interfaces
  - Optimized performance with efficient URL updates
  - Maintained accessibility with proper ARIA attributes
  - Fixed ESLint error by removing unused handleJobsPerPageChange function
  - Added loading state to prevent multiple rapid selections
  - Added error handling for invalid values
  - Enhanced accessibility with descriptive ARIA labels
- Bumped Next.js to 15.2.4

## [0.0.97] - 2025-03-25

### Added
- Added configurable post job banner:
  - New `postJobBanner` section in config file
  - Trust indicators with company avatars
  - Customizable CTA with pricing
  - Trust message support
  - Fully responsive design
  - Added comprehensive documentation in `/docs/post-job-banner.md`

## [0.0.96] - 2025-03-24

### Changed
- Enhanced job-specific meta descriptions for better SEO and UX:
  - Improved format to "[Company] is hiring [job type] [job title]"
  - Intelligently formatted workplace information by type:
    - Remote: "Remote position in [Region]" or "Remote position (Worldwide)"
    - Hybrid: "Hybrid position in [City, Country]"
    - On-site: "in [City, Country]"
  - Added salary information and application deadlines when available
  - Removed redundant information to create concise, impactful descriptions
  - Enhanced text parsing to clean job titles and improve readability
  - Implemented dynamic description building with proper sentence structure
  - Fixed grammar and punctuation issues for cleaner, more natural descriptions
  - Optimized character length for better visibility in search results

## [0.0.95] - 2025-03-24

### Added
- Added ItemList schema to jobs directory page:
  - Improves structured data representation of job categories
  - Implements proper ListItem elements with positions and URLs
  - Uses schema-dts for type safety
  - Enhances SEO for job category pages
- Added AboutPage schema with rich structured data:
  - Implements Organization information with proper context
  - Uses schema-dts for type safety and validation
  - Enhances SEO for the About page
  - Integrates with configuration system
- Added ContactPage schema with comprehensive contact information:
  - Includes contact details in structured format
  - Uses schema-dts types for validation
  - Enhances discoverability of company contact information
  - Improves SEO for Contact page

### Changed
- Enhanced SearchAction schema with multiple search targets:
  - Added dedicated job search action for improved job discovery
  - Implemented both general site search and job-specific search actions
  - Added clear descriptions for each search type
  - Improved Google search integration with proper query-input formatting
  - Maintained schema-dts type safety with careful casting
- Refactored BreadcrumbList schema to use schema-dts types:
  - Enhanced type safety for breadcrumb implementation
  - Maintains backward compatibility with existing usage
  - Aligned with the project's schema-dts implementation pattern
  - Improved code maintainability
- Updated job directory page metadata and structure:
  - Improved description
  - Added OpenGraph type
  - Simplified container layout
- Improved About and Contact pages:
  - Enhanced integration with configuration system
  - Added proper metadata for SEO
  - Implemented consistent layout and styling
  - Added fallback content when configuration is missing

## [0.0.94] - 2025-03-23

### Changed
- Simplified WebSite schema implementation for easier configuration:
  - Removed dedicated schema configuration section from config file
  - Now derives schema data from existing configuration values
  - Uses navigation title for WebSite name
  - Automatically includes search action functionality
  - Derives social links from navigation social media settings
  - Uses logo configuration for publisher logo
  - Improves maintainability by reducing configuration duplication
  - Enhanced type safety with schema-dts
- Refactored FAQPage schema implementation to use schema-dts:
  - Added proper TypeScript typing for structured data
  - Improved type safety with Question and Answer types
  - Maintains the same functionality with better code quality
  - Consistent with the WebSite schema implementation approach

## [0.0.93] - 2025-03-22

### Added
- Implemented configurable WebSite schema using schema-dts type definitions:
  - Added global structured data for improved search engine visibility
  - Implemented SearchAction schema for potential Google Sitelinks Searchbox integration
  - Created flexible publisher configuration with Organization and Person support
  - Added social profile linking with sameAs property
  - Integrated with config system for easy site-wide schema customization
  - Added comprehensive documentation in schema-implementation.md
  - Enhanced SEO optimization across the entire website
  - Used schema-dts for type safety and validation

## [0.0.92] - 2025-03-22

### Fixed
- Enhanced education credential formatting for schema.org compliance:
  - Added intelligent mapping from free-text education fields to standard schema.org credential categories
  - Implemented credential category detection for Bachelor, Master, Doctoral, and other degree types
  - Fixed "Invalid enum value" warning in Google's Rich Results Test
  - Added comprehensive documentation for educational credential formatting

### Changed
- Improved maintainability of schema.org credential mapping:
  - Refactored education credential parsing to use a configurable mapping system
  - Replaced hardcoded conditionals with a flexible keyword-based mapping approach
  - Added extensible configuration map for education credential types
  - Improved code maintainability and readability with the new approach

## [0.0.91] - 2025-03-22

### Fixed
- Fixed schema.org validation issues for Rich Results Test:
  - Updated educationRequirements to use EducationalOccupationalCredential type
  - Enhanced experienceRequirements with OccupationalExperienceRequirements type
  - Added intelligent experience duration parser to extract months from text descriptions
  - Improved schema.org compliance for Google Jobs integration

## [0.0.90] - 2025-03-22

### Added
- Integrated schema-dts package for enhanced schema.org typing:
  - Added TypeScript type definitions for Schema.org JSON-LD structured data
  - Implemented proper type safety for all JobPosting structured data
  - Added discriminated type unions for schema.org entities
  - Enhanced developer experience with auto-completion for schema properties
  - Improved error detection during development with compile-time type checking
  - Refactored job-schema.tsx component with proper schema-dts types
  - Updated documentation to reflect schema-dts usage and benefits
  - Added conditional property rendering for proper schema validation

### Changed
- Enhanced schema.org implementation with better type safety:
  - Improved handling of optional properties with conditional rendering
  - Updated salary formatting function with proper QuantitativeValue typing
  - Enhanced location and country formatting with schema-dts types
  - Removed type assertions where proper typing could be implemented
  - Improved maintainability with standardized schema.org type patterns

## [0.0.89] - 2025-03-21

### Added
- Enhanced schema.org JobPosting markup with additional structured data fields:
  - Added support for `skills`, `qualifications`, `educationRequirements`, and `experienceRequirements` fields
  - Added `industry` and `occupationalCategory` fields for better job classification
  - Added `jobBenefits` field to leverage existing benefits data
  - Added `responsibilities` field for more comprehensive job descriptions
  - Added `eligibilityToWorkRequirement` field to properly represent visa sponsorship status
  - Implemented schema.org-compliant field mapping for all new properties
  - Added proper type handling for empty or undefined fields
  - Extended Job interface with new optional structured data fields

### Fixed
- Enhanced schema.org JobPosting markup for better SEO and rich result validation:
  - Removed misleading `sameAs` property from hiringOrganization object
  - Fixed URL property placement to proper root level for correct structured data
  - Improved handling of `applicantLocationRequirements` for remote jobs to pass Google's Rich Results Test
  - Added worldwide location support for remote jobs without region specification
  - Ensured `directApply` property is correctly formatted as a boolean value
  - Fixed critical validation errors reported by Google's structured data testing tool

## [0.0.88] - 2025-03-20

### Added
- Enhanced job details page with additional application information:
  - Added application deadline display in sidebar with relative time indicator (e.g., "in 6 days")
  - Added job identifier display in sidebar for better reference
  - Added "Apply before" reminder text next to the Apply Now button
  - Added amber notice for past deadlines indicating jobs might still accept applications
- Improved job schema markup implementation:
  - Updated JobSchema component to set directApply property to false
  - Enhanced SEO for external application links to properly indicate third-party application process
  - Made schema.org job posting markup more accurately reflect application flow

### Fixed
- Fixed visa sponsorship badge display issues:
  - Added `normalizeVisaSponsorship` function for consistent badge display
  - Implemented case-insensitive matching for "Yes" and "No" values
  - Added fallback to "Not specified" for invalid or missing values
  - Ensured consistent badge styling across all job displays
- Fixed "On-site" workplace type badge styling:
  - Added specific mapping from "On-site" to "onsite" badge type
  - Resolved issue with hyphenated workplace type not matching badge style definitions
  - Ensured consistent styling for all workplace type badges

## [0.0.87] - 2025-03-19

### Fixed
- Fixed build issues with unused imports and params handling:
  - Removed unused imports in JobsLayout.tsx (JobFilters, Badge, useDebounce, Button, Input, Search icons)
  - Fixed dynamic route parameter handling in job detail pages by properly awaiting params object
  - Resolved ESLint errors related to no-unused-vars TypeScript rule
  - Enhanced stability of breadcrumb implementation with proper async patterns

## [0.0.86] - 2025-03-19

### Changed
- Optimized breadcrumb implementation with server components:
  - Migrated client-side breadcrumbs to Next.js server components
  - Reduced client-side JavaScript bundle size
  - Eliminated hydration costs and content layout shifts
  - Fixed inconsistent breadcrumb hierarchy in category pages
  - Maintained color styling distinction between active/inactive items
  - Enhanced performance by moving breadcrumb generation to the server
  - Improved accessibility and SEO with proper semantic markup

## [0.0.85] - 2025-03-18

### Changed
- Improved breadcrumb implementation with loading optimization:
  - Enhanced layout stability by adding skeleton placeholders matching breadcrumb dimensions
  - Implemented fade-in transitions for smooth visual updates
  - Added proper hydration safety with client-side mount detection
  - Prevented layout shifts with path-aware placeholder structure
  - Optimized loading states with delayed transitions to prevent flashing
  - Improved error handling for dynamic route data fetching
  - Enhanced responsiveness across all device sizes

### Fixed
- Fixed schema.org breadcrumb markup to use proper format for Google's Rich Results Test:
  - Updated breadcrumb schema generation to exactly match Google's recommended JSON-LD structure
  - Used simple URL strings for non-final items and omitted the item property for final breadcrumb
  - Fixed "Invalid URL" warnings by using proper absolute URLs
  - Added proper TypeScript definitions for ListItem schema objects
  - Ensured full compliance with Google's structured data guidelines

## [0.0.84] - 2025-03-18

### Added
- Enhanced breadcrumb navigation system for improved user experience and SEO:
  - Implemented schema.org breadcrumb markup for search engine optimization
  - Created reusable breadcrumb components with proper semantic structure
  - Added client-side automatic breadcrumb generation based on current routes
  - Implemented server-side caching for breadcrumb data
  - Added performance optimizations with React.memo and useMemo
  - Implemented comprehensive error handling for all breadcrumb generation steps
  - Added consistent styling with the rest of the application
  - Ensured mobile responsiveness with appropriate text sizing
  - Provided graceful fallbacks for loading and error states
  - Maintained consistent data flow with efficient prop passing
  - Added proper accessibility with ARIA attributes

## [0.0.83] - 2025-03-18

### Added
- Added application requirements feature:
  - New `application_requirements` field in Airtable for listing job prerequisites
  - Compact, focused placement before Apply button to ensure visibility
  - Lightweight UI with subtle amber highlighting for attention without distraction
  - Character limits (1,000 max) for consistent display
  - Recommended comma-separated format for standardization

## [0.0.82] - 2025-03-16

### Added
- Added job benefits and perks feature:
  - New benefits field in Airtable for capturing perks and benefits
  - Benefits display in job detail sidebar with dedicated section
  - Collapsible text interface for longer benefit lists
  - Character limits (1,000 max) for consistent display
  - Icon-based visual indicator for benefits section
  - UI consistency with existing show more/less patterns

## [0.0.81] - 2025-03-16

### Added
- Added cryptocurrency and stablecoin support:
  - Added support for major cryptocurrencies (BTC, ETH, XRP, etc.)
  - Added USD-pegged stablecoins (USDT, USDC, USDS, PYUSD, TUSD)
  - Implemented proper cryptocurrency symbol display (₿ for Bitcoin, Ξ for Ethereum)
  - Set exchange rates for cryptocurrency price normalization
  - Updated documentation with comprehensive cryptocurrency information

## [0.0.80] - 2025-03-14

### Added
- Enhanced salary display features:
  - Added consistent scale formatting for salary ranges (k/M)
  - Implemented intelligent spacing for currency symbols
  - Added USD approximation display for non-USD salaries
  - Improved readability of salary displays across all currencies
  - Enhanced salary formatting for high-value currencies
  - Added proper spacing rules for currency symbols based on script type

## [0.0.79] - 2025-03-14

### Added
- Enhanced currency support with 50 common global currencies:
  - Created centralized currency constants system with complete ISO currency data
  - Added support for all major global currencies with proper symbols and formatting
  - Implemented currency conversion system for salary normalization and comparison
  - Enhanced salary display with proper currency symbols for all supported currencies
  - Added configuration options for default currency and allowed currencies
  - Updated pricing page to use the expanded currency system
  - Created comprehensive documentation for currency management
  - Added utility functions for currency lookup and conversion

## [0.0.78] - 2025-03-13

### Added
- Added configurable contact page with comprehensive features:
  - Support channels section with customizable cards for different contact methods
  - Detailed contact information section with company details
  - Fully customizable via config file with enable/disable options
  - Consistent styling with the rest of the application
  - SEO optimization with proper metadata
  - Responsive design for all screen sizes

## [0.0.77] - 2025-03-12

### Added
- Enhanced FAQ page with comprehensive features:
  - Implemented client-side search functionality with URL persistence
  - Added anchor links for direct navigation to specific FAQ categories
  - Integrated rich text support with markdown rendering
  - Added FAQ schema markup for improved SEO
  - Implemented stable accordion item IDs for reliable expand/collapse functionality
  - Added copy-to-clipboard feature for section links
  - Enhanced styling with consistent design language

### Changed
- Improved FAQ component organization and styling:
  - Optimized search field width to match answer boxes
  - Enhanced Contact Us section with consistent button styling
  - Added table support in markdown content with responsive design
  - Improved accessibility with proper ARIA labels and keyboard navigation
  - Enhanced mobile responsiveness with optimized layout

## [0.0.76] - 2025-03-11

### Added
- Enhanced pricing page configuration with more flexibility:
  - Simplified billing term structure with customizable text (e.g., "month", "year", "job posting")
  - Added customizable badge system with support for different badge types
  - Decoupled border highlighting from badges with new `highlighted` property
  - Improved type safety by importing badge types from components
  - Added comprehensive documentation for pricing page customization

### Changed
- Improved pricing page component:
  - Enhanced code organization with better separation of concerns
  - Optimized formatting logic with dedicated helper functions
  - Improved responsive design for better mobile experience
  - Reduced code duplication for better maintainability

## [0.0.75] - 2025-03-11

### Added
- Enhanced pricing page with improved UI and payment information:
  - Added "Best Value" badge to Pro plan for better plan differentiation
  - Added payment processing information text with configurable content
  - Implemented payment method icons (Visa, Mastercard, Amex, Apple Pay, Google Pay, PayPal)
  - Added hover effects on payment icons for better interactivity
  - Made all payment-related elements configurable through config file

### Changed
- Improved pricing page layout and consistency:
  - Standardized button sizes to match navigation buttons
  - Made buttons full width within pricing cards for better visual balance
  - Aligned badge positioning to match job cards for consistent design language
  - Removed FAQ section for cleaner, more focused layout
  - Enhanced spacing and alignment throughout pricing cards
  - Optimized visual hierarchy with consistent styling patterns

## [0.0.74] - 2025-03-11

### Added
- Added configurable pricing page:
  - Created new `/pricing` route with responsive design
  - Implemented pricing plans configuration in config file
  - Added Free and Pro plan options with feature lists
  - Integrated with existing UI components
  - Added FAQ section with common pricing questions
  - Enhanced navigation with conditional pricing links
  - Added SEO metadata for pricing page
  - Implemented popular plan highlighting

## [0.0.73] - 2025-03-11

### Added
- Added Jobs section to footer:
  - Created dedicated column for job-related links
  - Added links to all jobs, job types, locations, levels, and languages
  - Enhanced site navigation with consistent job category access
  - Improved discoverability of job-related pages

### Changed
- Optimized footer layout for better space utilization:
  - Reduced vertical and horizontal spacing between elements
  - Adjusted grid to accommodate 5 columns instead of 4
  - Decreased spacing between list items for more compact appearance
  - Standardized spacing values throughout the footer component
  - Improved mobile and desktop layout consistency

### Fixed
- Resolved React hydration error in footer component:
  - Fixed server/client rendering mismatch with copyright years
  - Improved conditional rendering consistency
  - Refactored job links into a reusable array
  - Enhanced client-side initialization of dynamic content
  - Eliminated "text content did not match" warnings

## [0.0.72] - 2025-03-10

### Added
- Made language badges in job details sidebar clickable, linking to language-specific job listings
  - Improved internal linking and user navigation with interactive language tags
  - Enhanced discoverability of language-specific job pages through contextual linking
- Made career level badges in job details sidebar clickable, linking to level-specific job listings
  - Implemented smart linking that excludes "Not Specified" career levels
  - Added visual hover effects only to interactive elements
  - Improved UX by providing clear visual affordances for clickable elements
- Fixed route parameter handling for Next.js 15.2.1
  - Updated dynamic route pages to properly await params
  - Enhanced error handling for invalid routes
  - Ensured consistent behavior across language, level, and type pages

## [0.0.71] - 2025-03-09

### Added
- Enhanced language system with comprehensive ISO 639-1 support:
  - Added support for all 184 ISO 639-1 language codes
  - Implemented "Language Name (code)" format in Airtable for human readability
  - Created bidirectional mapping between codes and full language names
  - Added utility functions for language code extraction and normalization
  - Enhanced language filtering with alphabetical sorting
  - Improved SEO with standard language codes in URLs
  - Added robust internationalization foundation
  - Implemented flexible language matching algorithm
  - Enhanced developer experience with comprehensive language type definitions
  - Optimized language data storage with two-letter codes

## [0.0.70] - 2025-03-08

### Changed
- Enhanced job filters with improved state management:
  - Added custom hooks for array and boolean filters
  - Optimized filter performance and reduced re-renders
  - Fixed "Clear all" functionality for language filters
  - Added missing "Freelance" job type option
  - Improved filter synchronization with URL parameters

## [0.0.69] - 2025-02-27

### Fixed
- Fixed configuration loading in production by removing development-only check:
  - Custom `config.ts` now loads in all environments
  - Ensures consistent configuration between development and production
  - Resolves issue with example config being used in production

## [0.0.68] - 2025-02-27

### Changed
- Updated Next.js to version 15.2.0

## [0.0.67] - 2025-02-27

### Added
- Added comprehensive RSS feed system:
  - Created route handlers for RSS 2.0, Atom, and JSON Feed formats
  - Implemented client-side null checks for robust error handling
  - Added RSS feed link tags in HTML head for better discoverability
  - Added RSS icon in navigation and footer for easy access
  - Included detailed job metadata in feeds (title, company, location, salary)
  - Added support for featured job highlights in feed
  - Added job categories including type, career level, and languages
  - Implemented 5-minute feed revalidation to match site content
  - Added configuration options for enabling/disabling feed features
  - Enhanced feeds with content summaries and formatted descriptions
  - Implemented proper MIME types for each feed format

## [0.0.66] - 2025-02-27

### Changed
- Improved canonical URLs implementation for better SEO:
  - Added `metadataBase` URL in root layout for proper URL resolution
  - Standardized canonical URL format using relative paths
  - Updated dynamic page metadata to include proper canonical references
  - Added missing canonical URLs to `/jobs/types`, `/jobs/locations`, `/jobs/levels`, `/jobs/languages`, `/privacy`, and `/terms` pages
  - Improved SEO by preventing duplicate content issues
  - Implemented robots meta tag with comprehensive crawler directives
  - Added X-Robots-Tag HTTP headers for enhanced crawler control
  - Configured specific rules for different file types (images, PDFs)
  - Added hreflang tags with fully-qualified URLs for proper language targeting
  - Implemented simplified language links with generic English ('en') and fallback ('x-default')
  - Enhanced hreflang implementation with proper page-specific tags
  - Fixed duplicate hreflang tags to ensure clean HTML output
  - Followed Google's best practices for international SEO

### Fixed
- Fixed TypeScript type errors in locations page:
  - Added proper type handling for country and city data
  - Resolved type safety issues with dynamic location names
  - Improved object update pattern for better type safety
  - Eliminated ESLint warnings by removing explicit 'any' types
  - Used consistent approach for both country and city data handling

## [0.0.65] - 2025-02-27

### Changed
- Standardized job listing pages:
  - Unified sorting and pagination across all job pages
  - Consistent URL parameters (per_page, sort)
  - Enhanced responsive layout and styling
  - Improved loading states and empty results handling

### Added
- Added location-based job browsing:
  - New /jobs/locations page with comprehensive location directory
  - Individual location pages with filtered job listings
  - Support for remote and country-specific job searches
  - Consistent layout and functionality with other job pages

## [0.0.64] - 2025-02-06

### Added
- Added `/jobs` page with category browsing:
  - Job types, locations, and career levels
  - Dynamic data aggregation
  - Centralized constants for career levels and locations
  - Accessible UI components

## [0.0.63] - 2025-02-06

### Added
- Added `/jobs` page:
  - Added ARIA labels and landmarks for accessibility
  - Improved semantic HTML structure
  - Optimized category cards
  - Added dynamic data revalidation (5 min)
  - Enhanced mobile responsiveness

## [0.0.62] - 2025-02-06

### Added
- Added Airtable template for quick setup
- Added `.env.example` file for easier environment configuration

### Changed
- Updated README with Airtable template link
- Improved environment setup documentation
- Enhanced setup instructions with template-first approach
- Added note about preserving `.env.example` for reference

## [0.0.61] - 2025-02-04

### Changed
- Enhanced homepage and job post page responsive layouts:
  - Optimized layout breakpoints for better space utilization
  - Adjusted sidebar to start at medium screens (768px) instead of large screens
  - Refined sidebar widths (240px to 260px) for better content balance
  - Improved main content and sidebar proportions
  - Enhanced layout flexibility on medium-sized screens
  - Unified layout structure between homepage and job post pages
  - Standardized content width and spacing across both pages
  - Improved mobile UX by prioritizing job content and reordering sidebar sections
  - Optimized content flow on mobile with job details followed by similar jobs

## [0.0.60] - 2025-02-03

### Changed
- Improved navigation responsiveness and styling:
  - Adjusted mobile menu breakpoint for better usability
  - Enhanced active link styling with subtle background
  - Updated X (Twitter) icon to match footer design
  - Optimized spacing between navigation items
  - Consistent hover effects across desktop and mobile
  - Reduced icon sizes in collapsed menu

## [0.0.59] - 2025-02-03

### Changed
- Updated Privacy & Terms pages layout and styling:
  - Centered content layout for better readability
  - Consistent styling with job post pages
  - Improved typography and spacing
  - Enhanced markdown content formatting
  - Combined Cookie Policy into Privacy Policy page
  - Updated footer links to reflect merged pages

## [0.0.58] - 2025-02-03

### Changed
- Enhanced footer configuration with centralized controls
- Added configuration options for all footer sections (brand, resources, legal, post job)
- Added customizable copyright section with dynamic year range
- Added configurable "Built By" section with optional logo
- Improved code maintainability with configuration-driven footer
- Added show/hide toggles for all footer sections
- Added external link support for legal links

## [0.0.57] - 2025-02-03

### Changed
- Enhanced navigation configuration with centralized social media controls
- Added configuration options for LinkedIn, Twitter, and Bluesky social links
- Added customizable "Post Job" button with show/hide, label, and link options
- Moved all navigation menu items to config file for single source of truth
- Updated navigation component to use dynamic configuration values
- Improved code maintainability with configuration-driven navigation

## [0.0.56] - 2025-01-26

### Changed
- Migrated Next.js configuration from JavaScript to TypeScript for better type safety and consistency