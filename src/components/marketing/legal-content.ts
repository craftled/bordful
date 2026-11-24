// Copy for the /about, /privacy and /terms marketing pages. Pure data, shared
// with the agent-readable markdown versions (src/lib/docs/agent-pages.ts), so
// the React pages and the generated markdown cannot drift.
//
// A "part" is a run of text or an inline link; pages join the parts of a
// paragraph and the markdown builder renders the same parts as inline
// markdown links.

import { BORDFEED_ABOUT_URL, GITHUB_URL, SOCIAL_LINKS } from "./site";

export type LegalPart = string | { href: string; label: string };

export interface LegalBlock {
  bullets?: readonly LegalPart[][];
  paragraphs: readonly LegalPart[][];
  title: string;
}

export interface LegalPageContent {
  blocks: readonly LegalBlock[];
  heading: string;
  lastUpdated: string;
  lede: string;
}

const MIT_LICENSE_URL = "https://opensource.org/license/mit";
const SUPPORT_EMAIL = "support@bordful.com";

export interface AboutCard {
  links?: readonly { href: string; label: string }[];
  parts?: readonly LegalPart[];
  title: string;
}

export interface AboutContent {
  cards: readonly AboutCard[];
  eyebrow: string;
  heading: readonly [string, string];
  paragraphs: readonly LegalPart[][];
}

export const ABOUT_CONTENT: AboutContent = {
  eyebrow: "About",
  heading: [
    "An open-source job board",
    "you can deploy, fill, and make your own.",
  ],
  paragraphs: [
    [
      "Bordful is an open-source job board template. Deploy it and a board with real sample jobs from Bordfeed is live in about two minutes. From there you can connect your own Bordfeed feed, post jobs through a Stripe payment link, and send email alerts with Resend.",
    ],
    [
      "The board also publishes RSS and JSON feeds, and each public job can carry JobPosting JSON-LD.",
    ],
  ],
  cards: [
    {
      title: "Craftled",
      parts: [
        "Craftled builds Bordful. The code is released under the ",
        { href: MIT_LICENSE_URL, label: "MIT license" },
        ". The repository is on ",
        { href: GITHUB_URL, label: "GitHub" },
        ".",
      ],
    },
    {
      title: "Bordfeed",
      parts: [
        "Bordfeed powers the jobs: the sample set on a fresh board, and the feed you connect when you want ongoing listings. ",
        { href: BORDFEED_ABOUT_URL, label: "Bordfeed" },
      ],
    },
    {
      title: "Elsewhere",
      links: SOCIAL_LINKS.map((link) => ({
        href: link.href,
        label: link.label,
      })),
    },
  ],
};

export const PRIVACY_CONTENT: LegalPageContent = {
  heading: "Privacy Policy",
  lede: "How we handle your data and protect your privacy.",
  lastUpdated: "October 23, 2026",
  blocks: [
    {
      title: "Introduction",
      paragraphs: [
        [
          "This privacy policy explains how Bordful collects, uses, and protects any information when you use our open-source job board software. We're committed to ensuring your privacy is protected.",
        ],
      ],
    },
    {
      title: "Data Collection",
      paragraphs: [
        [
          "As an open-source software, Bordful itself doesn't collect any data. However, when you deploy your job board, you may collect:",
        ],
      ],
      bullets: [
        ["Job listings stored in the database you deploy"],
        ["Email addresses of job alert subscribers (if enabled)"],
        ["Usage analytics (if you implement them)"],
        ["User submitted information"],
      ],
    },
    {
      title: "Your Responsibilities",
      paragraphs: [["When deploying Bordful, you are responsible for:"]],
      bullets: [
        ["Creating your own privacy policy"],
        ["Complying with data protection laws in your jurisdiction"],
        ["Securing user data in your database"],
        ["Managing user consent and data rights"],
      ],
    },
    {
      title: "Third-Party Services",
      paragraphs: [
        ["Bordful integrates with third-party services that may collect data:"],
        [
          "Please review their respective privacy policies to understand how they handle data.",
        ],
      ],
      bullets: [
        ["Vercel: hosting"],
        ["Bordfeed: jobs feed and Connect Bordfeed (if connected)"],
        ["Resend: job alert emails (if enabled)"],
        ["Stripe: Post a Job payments (if enabled)"],
      ],
    },
    {
      title: "Security",
      paragraphs: [
        [
          "While we've implemented security best practices in our code, you are responsible for securing your deployment, including:",
        ],
      ],
      bullets: [
        ["Keeping dependencies updated"],
        ["Configuring proper access controls"],
        ["Protecting API keys and credentials"],
      ],
    },
    {
      title: "Updates",
      paragraphs: [
        [
          "We may update this privacy policy to reflect changes in our software or legal requirements. We recommend checking this page periodically for any changes.",
        ],
      ],
    },
    {
      title: "Contact",
      paragraphs: [
        [
          "If you have any questions about this privacy policy, please contact us at ",
          { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL },
          ".",
        ],
      ],
    },
  ],
};

export const TERMS_CONTENT: LegalPageContent = {
  heading: "Terms of Service",
  lede: "Please read these terms carefully before using Bordful.",
  lastUpdated: "October 23, 2026",
  blocks: [
    {
      title: "Acceptance of Terms",
      paragraphs: [
        [
          "By accessing and using Bordful, you agree to be bound by these terms of service. If you disagree with any part of these terms, you may not use our software.",
        ],
      ],
    },
    {
      title: "Use License",
      paragraphs: [
        [
          "Bordful is open source software released under the MIT License. You are free to:",
        ],
        [
          "The only requirement is that the original copyright and license notice must be included in all copies or substantial portions of the software.",
        ],
      ],
      bullets: [
        ["Modify and distribute the code"],
        ["Use for commercial purposes"],
        ["Sublicense and sell copies"],
        ["Integrate with other software"],
      ],
    },
    {
      title: "Your Responsibilities",
      paragraphs: [["When using Bordful, you are responsible for:"]],
      bullets: [
        ["Maintaining the security of your deployment"],
        ["Complying with data protection laws in your jurisdiction"],
        ["Managing your own job board content and user data"],
        [
          "Ensuring proper use of third-party services you connect, including your host",
        ],
      ],
    },
    {
      title: "Disclaimer",
      paragraphs: [
        [
          'Bordful is provided "as is", without warranty of any kind, express or implied. We do not warrant that the software will be error-free, uninterrupted, secure, or meet your specific requirements. In no event shall the authors be liable for any claim, damages, or other liability arising from the use of the software.',
        ],
      ],
    },
    {
      title: "Limitations",
      paragraphs: [["You may not use Bordful:"]],
      bullets: [
        ["For any illegal purposes"],
        ["To violate any laws in your jurisdiction"],
        ["To infringe upon intellectual property rights"],
        ["To transmit harmful code or malware"],
      ],
    },
    {
      title: "Third-Party Services",
      paragraphs: [
        [
          "Bordful can connect to third-party services such as your host, Bordfeed (jobs feed and Connect Bordfeed, if connected), Resend (job alert emails, if enabled), and Stripe (Post a Job payments, if enabled). Your use of these services is subject to their respective terms of service and privacy policies. We are not responsible for the practices or policies of these third-party services.",
        ],
      ],
    },
    {
      title: "Revisions",
      paragraphs: [
        [
          "We may revise these terms of service at any time without notice. By using Bordful you agree to be bound by the current version of these terms of service. We recommend checking this page periodically for changes.",
        ],
      ],
    },
    {
      title: "Contact",
      paragraphs: [
        [
          "If you have any questions about these terms, please contact us at ",
          { href: `mailto:${SUPPORT_EMAIL}`, label: SUPPORT_EMAIL },
          ".",
        ],
      ],
    },
  ],
};
