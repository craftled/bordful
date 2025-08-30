import config from '@/config';
import { generateMetadata } from '@/lib/utils/metadata';

export const metadata = generateMetadata({
  title: `Privacy & Cookies - ${config.nav.title}`,
  description:
    'Our commitment to protecting your privacy and personal information.',
  path: '/privacy',
});

// This page will be static
export const dynamic = 'force-static';

export default function PrivacyPage() {
  return (
    <main className="container py-6">
      {/* Main content - centered */}
      <article className="mx-auto max-w-[640px]">
        <div className="mb-8">
          <div className="space-y-2">
            <h1 className="font-semibold text-2xl">Privacy & Cookies Policy</h1>
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
            <h2>Introduction</h2>
            <p>
              We respect your privacy and are committed to protecting your
              personal data. This privacy policy will inform you about how we
              look after your personal data when you visit our website and tell
              you about your privacy rights and how the law protects you.
            </p>

            <h2>The Data We Collect</h2>
            <p>
              When you use our job board, we may collect and process the
              following data:
            </p>
            <ul>
              <li>Basic contact information (name, email)</li>
              <li>Job application data</li>
              <li>Usage data and analytics</li>
              <li>Cookie data</li>
            </ul>

            <h2>How We Use Your Data</h2>
            <p>We use your data to:</p>
            <ul>
              <li>Process job applications</li>
              <li>Send relevant job alerts</li>
              <li>Improve our services</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>Cookies and Similar Technologies</h2>
            <h3>What Are Cookies</h3>
            <p>
              Cookies are small text files that are placed on your computer or
              mobile device when you visit our website. They are widely used to
              make websites work more efficiently and provide a better user
              experience.
            </p>

            <h3>Types of Cookies We Use</h3>
            <h4>Essential Cookies</h4>
            <p>
              These cookies are necessary for the website to function properly.
              They enable core functionality such as security, network
              management, and accessibility.
            </p>

            <h4>Analytics Cookies</h4>
            <p>
              These cookies help us understand how visitors interact with our
              website by collecting and reporting information anonymously.
            </p>

            <h4>Preference Cookies</h4>
            <p>
              These cookies remember your settings and choices to provide a more
              personalized experience.
            </p>

            <h4>Authentication Cookies</h4>
            <p>
              These cookies help maintain your logged-in state and secure access
              to your account features.
            </p>

            <h3>Managing Cookies</h3>
            <p>
              Most web browsers allow you to control cookies through their
              settings. You can usually find these settings in the
              &ldquo;options&rdquo; or &ldquo;preferences&rdquo; menu of your
              browser. You can choose to:
            </p>
            <ul>
              <li>Accept or decline cookies when you first visit our site</li>
              <li>Delete all cookies after each browsing session</li>
              <li>Set your browser to block cookies</li>
              <li>Browse in private/incognito mode</li>
            </ul>
            <p>
              Please note that blocking cookies may affect the functionality of
              our website.
            </p>

            <h2>Your Privacy Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request transfer of your data</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data
              practices, please contact us. We&apos;re here to help you
              understand and exercise your privacy rights.
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}
