export type AboutSection = { title: string; paragraphs: string[] };
export type AboutContent = {
  tagline: [string, string];
  intro: string[];
  sections: AboutSection[];
  closing: string[];
  heroSlug: string;
};

// Hydrated in place from Sanity's About page (lib/cms.ts). Nothing here
// is authored by us: the fallback is empty and the page renders whatever
// the client has published.
export const ABOUT: AboutContent = {
  tagline: ["", ""],
  intro: [],
  sections: [],
  closing: [],
  heroSlug: "alpine-ridge"
};
