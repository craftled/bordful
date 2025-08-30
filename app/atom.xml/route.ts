import { Feed } from 'feed';
import config from '@/config';
import { formatSalary, getJobs } from '@/lib/db/airtable';
import { generateJobSlug } from '@/lib/utils/slugify';

export const revalidate = 300; // 5 minutes, matching other dynamic routes

export async function GET() {
  try {
    // Check if Atom feeds are enabled in the configuration
    if (!(config.rssFeed?.enabled && config.rssFeed?.formats?.atom)) {
      return new Response('Atom feed not enabled', { status: 404 });
    }

    const baseUrl = config.url;

    // Feed setup with configuration options
    const feed = new Feed({
      title: config.rssFeed?.title || `${config.title} | Job Feed`,
      description: config.description,
      id: baseUrl,
      link: baseUrl,
      language: 'en',
      image: `${baseUrl}/opengraph-image.png`,
      favicon: `${baseUrl}/favicon.ico`,
      copyright: `All rights reserved ${new Date().getFullYear()}`,
      updated: new Date(),
      generator: 'Bordful Job Board',
      feedLinks: {
        rss2: `${baseUrl}/feed.xml`,
        json: `${baseUrl}/feed.json`,
        atom: `${baseUrl}/atom.xml`,
      },
    });

    // Get jobs and add them to the feed
    const jobs = await getJobs();

    // Use the configured description length or default to 500
    const descriptionLength = config.rssFeed?.descriptionLength || 500;

    jobs.forEach((job) => {
      // Only include active jobs
      if (job.status === 'active') {
        const jobSlug = generateJobSlug(job.title, job.company);
        const jobUrl = `${baseUrl}/jobs/${jobSlug}`;

        // Create a rich job description with markdown formatting
        const jobDescription = `
## ${job.title} at ${job.company}

**Type:** ${job.type}
**Location:** ${job.workplace_type}${
          job.workplace_city ? ` - ${job.workplace_city}` : ''
        }${job.workplace_country ? `, ${job.workplace_country}` : ''}
**Salary:** ${job.salary ? formatSalary(job.salary, true) : 'Not specified'}
**Posted:** ${new Date(job.posted_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}

${
  job.description
    ? job.description.substring(0, descriptionLength)
    : 'No description available'
}...

**Apply Now:** ${job.apply_url}
`;

        feed.addItem({
          title: `${job.title} at ${job.company}`,
          id: jobUrl,
          link: jobUrl,
          description: jobDescription,
          content: jobDescription,
          author: [
            {
              name: job.company,
              link: job.apply_url,
            },
          ],
          date:
            job.posted_date &&
            !Number.isNaN(new Date(job.posted_date).getTime())
              ? new Date(job.posted_date)
              : new Date(),
          image: job.featured ? `${baseUrl}/featured-job.png` : undefined,
          // Add categories based on job properties - with null checks
          category: [
            { name: job.type },
            ...(Array.isArray(job.career_level)
              ? job.career_level.map((level) => ({ name: level }))
              : []),
            { name: job.workplace_type },
            ...(Array.isArray(job.languages)
              ? job.languages.map((lang) => ({ name: lang }))
              : []),
          ],
        });
      }
    });

    // Return the feed as Atom XML with proper headers
    return new Response(feed.atom1(), {
      headers: {
        'Content-Type': 'application/atom+xml; charset=utf-8',
      },
    });
  } catch (_error) {
    return new Response('Error generating Atom feed', { status: 500 });
  }
}
