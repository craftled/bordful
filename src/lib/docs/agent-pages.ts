// Markdown builders for the static marketing pages. Pure functions over the
// same exported data modules the React pages render, so the HTML and the
// markdown cannot drift. Server only.
//
// Every page body starts with `# Title`, then the llms.txt directive, then
// the page content with absolute links: internal pages that serve markdown
// link to their `.md` URL, everything else to the absolute URL the HTML uses.

import {
  ALTERNATIVES,
  ALTERNATIVES_CUSTOM_SETUP_NOTE,
  ALTERNATIVES_HUB,
  ALTERNATIVES_HUB_CTA,
  ALTERNATIVES_PAGE_CTA,
  ALTERNATIVES_PAGE_LABELS,
  factsCheckedOn,
  formatCheckedOn,
} from "@/components/marketing/alternatives/registry";
import type {
  Alternative,
  Claim,
  Source,
} from "@/components/marketing/alternatives/types";
import {
  CHANGELOG_PAGE_HEADER,
  changelogDateLabel,
  changelogEntries,
} from "@/components/marketing/changelog-entries";
import {
  FAQ_CATEGORIES,
  FAQ_PAGE_CTA,
  FAQ_PAGE_HEADER,
  FAQ_PAGE_TABS_HEADER,
  FAQ_SECTION_HEADER,
  faqPlainAnswers,
  questions,
} from "@/components/marketing/faq";
import {
  FEATURES_GRID_HEADER,
  FEATURES_PAGE_CTA,
  FEATURES_PAGE_HERO,
  FEATURES_PAGE_STATS,
} from "@/components/marketing/features-content";
import { FEATURES_PAGE_ITEMS } from "@/components/marketing/features-page-grid";
import {
  HOME_BENTO,
  HOME_BENTO_EXAMPLE,
  HOME_FINAL_CTA,
  HOME_HERO,
  HOME_JOB_POSTING_CODE,
  HOME_STATEMENT,
  HOME_TECH_STACK,
  HOME_TIMELINE,
  HOME_WALKTHROUGH,
} from "@/components/marketing/home-content";
import {
  ABOUT_CONTENT,
  type LegalPageContent,
  type LegalPart,
  PRIVACY_CONTENT,
  TERMS_CONTENT,
} from "@/components/marketing/legal-content";
import { CUSTOM_SETUP_URL, DEPLOY_URL } from "@/components/marketing/links";
import {
  PRICING_PAGE_CTA,
  PRICING_PAGE_HEADER,
  PRICING_PAYMENT_NOTE,
  PRICING_SECTION_HEADER,
  plans,
} from "@/components/marketing/pricing";
import {
  SHOWCASE_GROUPS,
  SHOWCASE_PAGE_CTA,
  SHOWCASE_PAGE_HEADER,
} from "@/components/marketing/showcase-content";
import {
  SHOWCASE_COMMUNITY,
  SHOWCASE_DEMO,
  SHOWCASE_TEAM,
  type ShowcaseEntry,
} from "@/components/marketing/showcase-entries";
import {
  GITHUB_URL,
  MARKETING_DESCRIPTION,
  SHOWCASE_ISSUE_URL,
} from "@/components/marketing/site";

import { llmsTxtDirective } from "./agent-docs-paths";

export interface AgentPage {
  description: string;
  markdown: (siteUrl: string) => string;
  section: string;
  title: string;
}

const TRAILING_NEWLINES = /\n+$/u;

function link(label: string, href: string): string {
  return `[${label}](${href})`;
}

// An internal link to the page's HTML URL. The page also serves its markdown
// at the same path plus ".md" (markdownPathFor), but the markdown links to
// the HTML URL: agents that follow it send their own Accept header.
function internalLink(
  label: string,
  htmlPath: string,
  siteUrl: string
): string {
  return link(label, `${siteUrl}${htmlPath}`);
}

// Joins legal parts the way the React pages render them: plain text runs and
// inline links, with the spaces written into the parts themselves.
function legalPartsMarkdown(parts: readonly LegalPart[]): string {
  return parts
    .map((part) =>
      typeof part === "string" ? part : link(part.label, part.href)
    )
    .join("");
}

function shell(
  title: string,
  siteUrl: string,
  lines: readonly string[]
): string {
  const body = [`# ${title}`, "", llmsTxtDirective(siteUrl), "", ...lines].join(
    "\n"
  );
  return `${body.replace(TRAILING_NEWLINES, "")}\n`;
}

// -- Home ---------------------------------------------------------------------

function homeMarkdown(siteUrl: string): string {
  const example = HOME_BENTO_EXAMPLE;
  const lines: string[] = [
    HOME_HERO.lede,
    "",
    `- ${link(HOME_HERO.links.deploy, DEPLOY_URL)}`,
    `- ${internalLink(`${HOME_HERO.links.demo} ↗`, "/jobs", siteUrl)}`,
    "",
    `## ${HOME_TECH_STACK.heading}`,
    "",
    `${HOME_TECH_STACK.builtOnLabel}: ${HOME_TECH_STACK.items
      .map((item) => item.name)
      .join(", ")}`,
    "",
    HOME_STATEMENT.map((part) => part.text).join(" "),
    "",
    `## ${HOME_WALKTHROUGH.heading}`,
    "",
    ...HOME_WALKTHROUGH.steps.map(
      (step) => `- **${step.label}**: ${step.description}`
    ),
    "",
    `## ${HOME_TIMELINE.heading.join(" ")}`,
    "",
    ...HOME_TIMELINE.steps.map(
      (step) => `- **${step.when}, ${step.title}**: ${step.body}`
    ),
    "",
    `## ${HOME_BENTO.heading.join(" ")}`,
    "",
    `- **${HOME_BENTO.cards.alerts.title}**: ${HOME_BENTO.cards.alerts.description}`,
    `- **${HOME_BENTO.cards.brand.title}**: ${HOME_BENTO.cards.brand.description}`,
    `- **${HOME_BENTO.cards.paid.title}**: ${HOME_BENTO.cards.paid.description} Example price ${example.priceLabel} for a ${example.durationDays}-day listing, ${example.paidThrough}. ${example.note}`,
    `- **${HOME_BENTO.cards.seo.title}**: ${HOME_BENTO.cards.seo.description}`,
    "",
    `${HOME_BENTO.cards.seo.title}, so a public job carries data like this:`,
    "",
    "```json",
    ...HOME_JOB_POSTING_CODE.split("\n"),
    "```",
    "",
    `## ${PRICING_SECTION_HEADER.title} ${PRICING_SECTION_HEADER.titleMuted}`,
    "",
  ];

  for (const plan of plans) {
    lines.push(
      `### ${plan.name}, ${plan.price} ${plan.home.unit}`,
      "",
      plan.home.description,
      "",
      ...plan.home.features.map((feature) =>
        typeof feature === "string"
          ? `- ${feature}`
          : `- ${feature.label} (${feature.value})`
      ),
      "",
      `- ${plan.home.href === DEPLOY_URL ? link(plan.home.cta, DEPLOY_URL) : link(plan.home.cta, CUSTOM_SETUP_URL)}`,
      ""
    );
  }

  lines.push(
    PRICING_PAYMENT_NOTE,
    "",
    `## ${FAQ_SECTION_HEADER.title} ${FAQ_SECTION_HEADER.titleMuted}`,
    "",
    ...questions.map((item) => {
      const answer =
        item.text ?? (typeof item.answer === "string" ? item.answer : "");
      return `- **${item.short ?? item.question}**: ${answer}`;
    }),
    "",
    `## ${HOME_FINAL_CTA.heading.join(" ")}`,
    "",
    HOME_FINAL_CTA.phoneLede,
    "",
    `- ${link(HOME_FINAL_CTA.links.deploy, DEPLOY_URL)}`,
    `- ${link(HOME_FINAL_CTA.links.github, GITHUB_URL)}`,
    `- ${link(HOME_FINAL_CTA.links.clone, DEPLOY_URL)}`,
    `- ${internalLink(`${HOME_FINAL_CTA.links.demo} ↗`, "/jobs", siteUrl)}`
  );

  return shell(HOME_HERO.heading.join(" "), siteUrl, lines);
}

// -- Pricing ------------------------------------------------------------------

function pricingMarkdown(siteUrl: string): string {
  const lines: string[] = [
    PRICING_PAGE_HEADER.description,
    "",
    `- ${link("Clone now", GITHUB_URL)}`,
    `- ${internalLink("Live demo", "/jobs", siteUrl)}`,
    "",
  ];

  for (const plan of plans) {
    lines.push(
      `## ${plan.name}, ${plan.price}`,
      "",
      plan.description,
      "",
      ...plan.features.map((feature) =>
        typeof feature === "string"
          ? `- ${feature}`
          : `- ${feature.label} (${feature.value})`
      ),
      "",
      `- ${plan.href === GITHUB_URL ? link(plan.cta, GITHUB_URL) : link(plan.cta, CUSTOM_SETUP_URL)}`,
      ""
    );
  }

  lines.push(
    PRICING_PAYMENT_NOTE,
    "",
    `## ${FAQ_PAGE_HEADER.title} ${FAQ_PAGE_HEADER.titleMuted}`,
    "",
    FAQ_PAGE_HEADER.description,
    "",
    ...faqPlainAnswers().map(
      (item) => `- **${item.question}**: ${item.answer}`
    ),
    "",
    `## ${PRICING_PAGE_CTA.heading.join(" ")}`,
    "",
    PRICING_PAGE_CTA.description,
    "",
    `- ${link("Clone now", GITHUB_URL)}`,
    `- ${internalLink("Live demo", "/jobs", siteUrl)}`
  );

  return shell(
    `${PRICING_PAGE_HEADER.title} ${PRICING_PAGE_HEADER.titleMuted}`,
    siteUrl,
    lines
  );
}

// -- Features -----------------------------------------------------------------

function featuresMarkdown(siteUrl: string): string {
  const lines: string[] = [
    FEATURES_PAGE_HERO.lede,
    "",
    `- ${link(FEATURES_PAGE_HERO.links.clone, GITHUB_URL)}`,
    `- ${internalLink(FEATURES_PAGE_HERO.links.demo, "/jobs", siteUrl)}`,
    "",
    "Bordful at a glance:",
    "",
    ...FEATURES_PAGE_STATS.map((stat) => `- **${stat.label}**: ${stat.value}`),
    "",
    `## ${FEATURES_GRID_HEADER.heading.join(" ")}`,
    "",
    FEATURES_GRID_HEADER.lede,
    "",
  ];

  for (const feature of FEATURES_PAGE_ITEMS) {
    lines.push(`### ${feature.title}`, "", feature.description, "");
  }

  lines.push(
    `## ${FEATURES_PAGE_CTA.heading.join(" ")}`,
    "",
    FEATURES_PAGE_CTA.description,
    "",
    `- ${link(FEATURES_PAGE_HERO.links.clone, GITHUB_URL)}`,
    `- ${internalLink(FEATURES_PAGE_HERO.links.demo, "/jobs", siteUrl)}`
  );

  return shell(FEATURES_PAGE_HERO.heading.join(" "), siteUrl, lines);
}

// -- FAQ ----------------------------------------------------------------------

function faqMarkdown(siteUrl: string): string {
  const answers = faqPlainAnswers();
  const lines: string[] = [FAQ_PAGE_TABS_HEADER.lede, "", "By category:", ""];

  for (const category of FAQ_CATEGORIES) {
    lines.push(`### ${category.label}`, "");
    const items = answers.filter((item) =>
      (category.questions as readonly string[]).includes(item.question)
    );
    for (const item of items) {
      lines.push(`- **${item.question}**: ${item.answer}`);
    }
    lines.push("");
  }

  lines.push(
    `## ${FAQ_PAGE_CTA.heading.join(" ")}`,
    "",
    FAQ_PAGE_CTA.description,
    "",
    ...FAQ_PAGE_CTA.actions.map((action) =>
      "external" in action && action.external
        ? `- ${link(action.label, action.href)}`
        : `- ${internalLink(action.label, action.href, siteUrl)}`
    )
  );

  return shell(FAQ_PAGE_TABS_HEADER.heading.join(" "), siteUrl, lines);
}

// -- Showcase -----------------------------------------------------------------

function showcaseEntryLines(entries: readonly ShowcaseEntry[]): string[] {
  return entries.flatMap((entry) => [
    `### ${link(entry.name, entry.url)}`,
    "",
    entry.description,
    "",
  ]);
}

function showcaseMarkdown(siteUrl: string): string {
  // The shell already carries SHOWCASE_PAGE_HEADER.heading as the H1 (the
  // HTML page renders it as its h1 too); do not repeat it as a section
  // heading the page does not render.
  const lines: string[] = [
    SHOWCASE_PAGE_HEADER.description,
    "",
    ...showcaseEntryLines([SHOWCASE_DEMO]),
    `## ${SHOWCASE_GROUPS.community}`,
    "",
    ...(SHOWCASE_COMMUNITY.length > 0
      ? showcaseEntryLines(SHOWCASE_COMMUNITY)
      : [SHOWCASE_GROUPS.empty, ""]),
    ...(SHOWCASE_TEAM.length > 0
      ? [
          "## Built by the team behind Bordful",
          "",
          ...showcaseEntryLines(SHOWCASE_TEAM),
        ]
      : []),
    `## ${SHOWCASE_PAGE_CTA.heading.join(" ")}`,
    "",
    SHOWCASE_PAGE_CTA.description,
    "",
    `- ${link("Open an issue", SHOWCASE_ISSUE_URL)}`,
  ];

  return shell(SHOWCASE_PAGE_HEADER.heading.join(" "), siteUrl, lines);
}

// -- Changelog ----------------------------------------------------------------

function changelogMarkdown(_siteUrl: string): string {
  const lines: string[] = [
    CHANGELOG_PAGE_HEADER.description,
    "",
    ...changelogEntries.flatMap((entry) => [
      `## v${entry.version}${entry.href ? ` ([${entry.title}](${entry.href}))` : ` ${entry.title}`}`,
      "",
      changelogDateLabel(entry),
      "",
      ...entry.bullets.map((bullet) => `- ${bullet}`),
      "",
    ]),
  ];

  return shell(CHANGELOG_PAGE_HEADER.heading.join(" "), _siteUrl, lines);
}

// -- About / Privacy / Terms ---------------------------------------------------

function aboutMarkdown(_siteUrl: string): string {
  const lines: string[] = [
    ...ABOUT_CONTENT.paragraphs.map((paragraph) =>
      legalPartsMarkdown(paragraph)
    ),
    "",
  ];

  for (const card of ABOUT_CONTENT.cards) {
    if (card.links) {
      lines.push(
        `## ${card.title}`,
        "",
        ...(card.links ?? []).map((item) => `- ${link(item.label, item.href)}`),
        ""
      );
    } else {
      lines.push(
        `## ${card.title}`,
        "",
        legalPartsMarkdown(card.parts ?? []),
        ""
      );
    }
  }

  return shell(ABOUT_CONTENT.heading.join(" "), _siteUrl, lines);
}

function legalMarkdown(content: LegalPageContent): (siteUrl: string) => string {
  return (siteUrl: string) => {
    const lines: string[] = [
      content.lede,
      "",
      `Last updated: ${content.lastUpdated}`,
      "",
    ];

    for (const [index, block] of content.blocks.entries()) {
      lines.push(`## ${index + 1}. ${block.title}`, "");
      for (const paragraph of block.paragraphs) {
        lines.push(legalPartsMarkdown(paragraph), "");
      }
      for (const bullet of block.bullets ?? []) {
        lines.push(`- ${legalPartsMarkdown(bullet)}`);
      }
      if ((block.bullets ?? []).length > 0) {
        lines.push("");
      }
    }

    return shell(content.heading, siteUrl, lines);
  };
}

// -- Alternatives ---------------------------------------------------------------

function sourceFor(page: Alternative, id: string): Source | undefined {
  return page.sources.find((source) => source.id === id);
}

function sourceNumber(page: Alternative, id: string): number {
  return page.sources.findIndex((source) => source.id === id) + 1;
}

// A claim's text with links to its sources: `Free to use. (source 1)`.
// The [1] markers the React page renders next to each claim are in-page
// anchor links (marked data-markdown-ignore there); every source is also
// listed in full under "Sources" at the bottom of the markdown.
function claimMarkdown(
  claim: Pick<Claim, "sources" | "text">,
  page: Alternative
): string {
  const sources = claim.sources
    .map((id) => {
      const source = sourceFor(page, id);
      return source ? link(`source ${sourceNumber(page, id)}`, source.url) : "";
    })
    .filter((part) => part.length > 0)
    .join(", ");
  return `${claim.text}${sources ? ` (${sources})` : ""}`;
}

function comparisonSection(
  page: Alternative,
  rows: readonly { bordful: Claim; competitor: Claim; label: string }[]
): string[] {
  return rows.flatMap((row) => [
    `### ${row.label}`,
    "",
    `- ${page.name}: ${claimMarkdown(row.competitor, page)}`,
    `- Bordful: ${claimMarkdown(row.bordful, page)}`,
    "",
  ]);
}

function sourcesSection(page: Alternative, checkedOn: string): string[] {
  return [
    `## ${ALTERNATIVES_PAGE_LABELS.sources}`,
    "",
    `${ALTERNATIVES_PAGE_LABELS.factsChecked} ${checkedOn}${ALTERNATIVES_PAGE_LABELS.factsCheckedSuffix}`,
    "",
    ...page.sources.flatMap((source) => [
      `- ${link(source.title, source.url)}: ${source.fact}`,
      `  Checked ${formatCheckedOn(source.checkedOn)}.`,
    ]),
    "",
  ];
}

function alternativeMarkdown(page: Alternative): (siteUrl: string) => string {
  const labels = ALTERNATIVES_PAGE_LABELS;
  return (siteUrl: string) => {
    const checkedOn = formatCheckedOn(factsCheckedOn(page));
    const lines: string[] = [
      page.lede.text,
      "",
      `- ${link("Deploy to Vercel", DEPLOY_URL)}`,
      `- ${link("Custom Setup, $999 once", CUSTOM_SETUP_URL)}`,
      "",
      ALTERNATIVES_CUSTOM_SETUP_NOTE,
      "",
      `## ${labels.stayPrefix} ${page.name} ${labels.staySuffix}`,
      "",
      ...page.stay.map((claim) => `- ${claimMarkdown(claim, page)}`),
      "",
      `## ${labels.switch}`,
      "",
      ...page.switch.map((claim) => `- ${claimMarkdown(claim, page)}`),
      "",
      `## ${labels.limits}`,
      "",
      ...page.limits.map((claim) => `- ${claimMarkdown(claim, page)}`),
      "",
      `## ${page.name} and Bordful ${labels.compared}`,
      "",
      ...comparisonSection(page, page.comparison),
      `${labels.sourcesNote} ${checkedOn}.`,
      "",
      `## Pricing ${labels.compared}`,
      "",
      ...comparisonSection(page, page.pricing),
      `${labels.pricesNote} ${checkedOn}.`,
      "",
      `## Moving from ${page.name} ${labels.migrationTitleMuted}`,
      "",
      page.migration.intro,
      "",
      `### ${labels.moves}`,
      "",
      ...page.migration.moves.map((claim) => `- ${claimMarkdown(claim, page)}`),
      "",
      `### ${labels.staysBehind}`,
      "",
      ...page.migration.staysBehind.map(
        (claim) => `- ${claimMarkdown(claim, page)}`
      ),
      "",
      `### ${labels.path}`,
      "",
      ...page.migration.steps.map((step) =>
        typeof step === "string"
          ? `- ${step}`
          : `- ${claimMarkdown(step, page)}`
      ),
      "",
      `## ${labels.faqTitle} ${labels.faqTitleMuted}`,
      "",
      labels.faqDescription,
      "",
      ...page.faq.map(
        (item) =>
          `- **${item.question}**: ${claimMarkdown(
            { sources: item.sources, text: item.answer },
            page
          )}`
      ),
      "",
      `All alternatives: ${internalLink("Alternatives and Comparisons", "/alternatives", siteUrl)}`,
      "",
      `## ${ALTERNATIVES_PAGE_CTA.title} ${ALTERNATIVES_PAGE_CTA.titleMuted}`,
      "",
      ALTERNATIVES_PAGE_CTA.description,
      "",
      `- ${link("Deploy to Vercel", DEPLOY_URL)}`,
      `- ${link("Custom Setup, $999 once", CUSTOM_SETUP_URL)}`,
      "",
      ...sourcesSection(page, checkedOn),
    ];

    return shell(
      `${page.heading.title} ${page.heading.titleMuted}`,
      siteUrl,
      lines
    );
  };
}

function alternativesHubMarkdown(siteUrl: string): string {
  const lines: string[] = [ALTERNATIVES_HUB.intro, ""];

  for (const page of ALTERNATIVES) {
    const source = sourceFor(page, page.hub.summary.sources[0] ?? "");
    lines.push(
      `## ${page.name}`,
      "",
      page.hub.summary.text,
      "",
      `Source: ${
        source
          ? `${link(source.title, source.url)}, checked ${formatCheckedOn(source.checkedOn)}.`
          : ""
      }`,
      "",
      `- ${internalLink(page.hub.linkLabel, `/alternatives/${page.slug}`, siteUrl)}`,
      ""
    );
  }

  lines.push(
    `## ${ALTERNATIVES_HUB_CTA.title} ${ALTERNATIVES_HUB_CTA.titleMuted}`,
    "",
    ALTERNATIVES_HUB_CTA.description,
    "",
    `- ${link("Deploy to Vercel", DEPLOY_URL)}`,
    `- ${link("Custom Setup, $999 once", CUSTOM_SETUP_URL)}`
  );

  return shell(
    `${ALTERNATIVES_HUB.heading.title} ${ALTERNATIVES_HUB.heading.titleMuted}`,
    siteUrl,
    lines
  );
}

// -- The registry ---------------------------------------------------------------
// Keyed by HTML path; agent-docs-paths.ts lists the same paths and
// agent-pages.test.ts asserts the two stay in sync.

export const AGENT_PAGES: Readonly<Record<string, AgentPage>> = {
  "/": {
    description: MARKETING_DESCRIPTION,
    markdown: homeMarkdown,
    section: "Product",
    title: "Home",
  },
  "/features": {
    description:
      "The board, filters, email alerts, Post a Job, theming, feeds and SEO, the Bordfeed sync, and the admin. Everything Bordful does today.",
    markdown: featuresMarkdown,
    section: "Product",
    title: "Features",
  },
  "/faq": {
    description:
      "Short answers about the Bordful template, Bordfeed, posting your own jobs, and updating a fork.",
    markdown: faqMarkdown,
    section: "Product",
    title: "FAQ",
  },
  "/pricing": {
    description:
      "Simple pricing for your job board. Bordful is open source and free to use commercially. Custom setup is a one-time fee and includes 1 year of Bordfeed Pro.",
    markdown: pricingMarkdown,
    section: "Product",
    title: "Pricing",
  },
  "/showcase": {
    description:
      "The live Bordful demo, and room for community boards that choose to be listed.",
    markdown: showcaseMarkdown,
    section: "Product",
    title: "Showcase",
  },
  "/changelog": {
    description: "What changed in Bordful.",
    markdown: changelogMarkdown,
    section: "Product",
    title: "Changelog",
  },
  "/about": {
    description:
      "Bordful is an open-source job board template built by Craftled. Bordfeed powers the jobs.",
    markdown: aboutMarkdown,
    section: "Product",
    title: "About",
  },
  "/alternatives": {
    description: ALTERNATIVES_HUB.metaDescription,
    markdown: alternativesHubMarkdown,
    section: "Alternatives",
    title: ALTERNATIVES_HUB.metaTitle,
  },
  "/privacy": {
    description: PRIVACY_CONTENT.lede,
    markdown: legalMarkdown(PRIVACY_CONTENT),
    section: "Optional",
    title: "Privacy Policy",
  },
  "/terms": {
    description: TERMS_CONTENT.lede,
    markdown: legalMarkdown(TERMS_CONTENT),
    section: "Optional",
    title: "Terms of Service",
  },
  ...Object.fromEntries(
    ALTERNATIVES.map((page) => [
      `/alternatives/${page.slug}`,
      {
        description: page.metaDescription,
        markdown: alternativeMarkdown(page),
        section: "Alternatives",
        title: page.metaTitle,
      },
    ])
  ),
};

// The markdown version of one static page, or null for an unknown path.
export function pageMarkdown(path: string, siteUrl: string): string | null {
  const page = AGENT_PAGES[path];
  return page ? page.markdown(siteUrl) : null;
}

// The description a page's metadata and llms.txt both show.
export function agentPageDescription(path: string): string {
  return AGENT_PAGES[path]?.description ?? "";
}
