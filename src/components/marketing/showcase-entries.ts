export interface ShowcaseEntry {
  description: string;
  image: string;
  name: string;
  url: string;
}

export const SHOWCASE_DEMO: ShowcaseEntry = {
  description:
    "The live Bordful board, using the default theme and sample jobs from Bordfeed.",
  image: "/marketing/bordful-demo.png",
  name: "Bordful demo",
  url: "https://bordful.com/jobs",
};

export const SHOWCASE_COMMUNITY: ShowcaseEntry[] = [];

export const SHOWCASE_TEAM: ShowcaseEntry[] = [];
