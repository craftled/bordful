import config from '@/config';
import { generateMetadata } from '@/lib/utils/metadata';

export const metadata = generateMetadata({
  title: `Terms of Service - ${config.nav.title}`,
  description:
    'Our terms of service outline the rules and guidelines for using our job board platform.',
  path: '/terms',
});

// This page will be static
export const dynamic = 'force-static';

export default function TermsPage() {
  return (
    <main className="container py-6">
      {/* Main content - centered */}
      <article className="mx-auto max-w-[640px]">
        <div className="mb-8">
          <div className="space-y-2">
            <h1 className="font-semibold text-2xl">Terms of Service</h1>
            <div className="text-gray-500 text-sm">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div className="prose prose-sm prose-gray max-w-none">
          <div aria-hidden="true" className="my-8 h-px bg-gray-200" />
          <div className="markdown-content [&_a:hover]:text-zinc-800 [&_a]:text-zinc-900 [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors">
            <h2>Agreement to Terms</h2>
            <p>
              By accessing or using our job board platform, you agree to be
              bound by these Terms of Service. If you disagree with any part of
              the terms, you may not access the service.
            </p>

            <h2>Use License</h2>
            <p>
              Permission is granted to temporarily access the materials
              (information or software) on our job board platform for personal,
              non-commercial transitory viewing only.
            </p>
            <p>
              This license shall automatically terminate if you violate any of
              these restrictions and may be terminated by us at any time.
            </p>

            <h2>Job Postings</h2>
            <p>When posting jobs on our platform, you agree to:</p>
            <ul>
              <li>
                Provide accurate and complete information about the position
              </li>
              <li>Include clear job requirements and responsibilities</li>
              <li>Specify accurate compensation information</li>
              <li>Maintain and update job postings</li>
              <li>Remove filled positions promptly</li>
              <li>Comply with all applicable employment laws</li>
            </ul>

            <h2>User Obligations</h2>
            <p>As a user of our platform, you agree not to:</p>
            <ul>
              <li>Post false, inaccurate, or misleading information</li>
              <li>Violate any laws or regulations</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Distribute malicious code or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>

            <h2>Disclaimer</h2>
            <p>
              The materials on our job board platform are provided on an
              &apos;as is&apos; basis. We make no warranties, expressed or
              implied, and hereby disclaim and negate all other warranties
              including, without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights.
            </p>

            <h2>Limitations</h2>
            <p>
              In no event shall we or our suppliers be liable for any damages
              (including, without limitation, damages for loss of data or
              profit, or due to business interruption) arising out of the use or
              inability to use our platform.
            </p>

            <h2>Revisions and Errata</h2>
            <p>
              The materials appearing on our platform could include technical,
              typographical, or photographic errors. We do not warrant that any
              of the materials on our platform are accurate, complete, or
              current. We may make changes to the materials at any time without
              notice.
            </p>

            <h2>Links</h2>
            <p>
              We have not reviewed all of the sites linked to our platform and
              are not responsible for the contents of any such linked site. The
              inclusion of any link does not imply endorsement by us of the
              site. Use of any such linked website is at the user&apos;s own
              risk.
            </p>

            <h2>Modifications</h2>
            <p>
              We may revise these terms of service at any time without notice.
              By using our platform, you are agreeing to be bound by the then
              current version of these terms of service.
            </p>

            <h2>Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us. We&apos;re here to help you understand your rights and
              obligations under these terms.
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
