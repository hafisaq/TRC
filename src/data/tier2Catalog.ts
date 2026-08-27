// Mock data standing in for the partner's full property catalog (see the
// reference brochure/site structure: continent tabs -> property cards, each
// with its own downloadable PDF). Names and copy below are placeholders —
// swap in real partner content per property once it's supplied. Thumbnails
// reuse the four existing tier2 posters/videos since no per-property media
// exists yet; `brochureUrl` points at the one sample PDF supplied as a
// reference for how "Download Brochure" should behave.

export type CatalogEntry = {
  name: string;
  location: string;
  poster: string;
  brochureUrl: string;
};

export type CatalogRegion = {
  id: string;
  label: string;
  entries: CatalogEntry[];
};

const SAMPLE_BROCHURE = "/media/brochures/sample-experience-brochure.pdf";

export const CATALOG: CatalogRegion[] = [
  {
    id: "africa",
    label: "Africa",
    entries: [
      { name: "Savute Plains Camp", location: "Botswana", poster: "/media/poster/desert-ruins.jpg", brochureUrl: SAMPLE_BROCHURE },
      { name: "Kloof House", location: "Cape Town, South Africa", poster: "/media/poster/bali-coast.jpg", brochureUrl: SAMPLE_BROCHURE },
      { name: "Namib Star Camp", location: "Namibia", poster: "/media/poster/desert-ruins.jpg", brochureUrl: SAMPLE_BROCHURE }
    ]
  },
  {
    id: "americas",
    label: "Americas",
    entries: [
      { name: "Patagonia Ridge Lodge", location: "Chile", poster: "/media/poster/alpine-ridge.jpg", brochureUrl: SAMPLE_BROCHURE },
      { name: "Sacred Valley House", location: "Peru", poster: "/media/poster/reef-dive.jpg", brochureUrl: SAMPLE_BROCHURE }
    ]
  },
  {
    id: "asia",
    label: "Asia",
    entries: [
      { name: "Andaman Coast Villa", location: "Thailand", poster: "/media/poster/bali-coast.jpg", brochureUrl: SAMPLE_BROCHURE },
      { name: "Kyoto Garden House", location: "Japan", poster: "/media/poster/reef-dive.jpg", brochureUrl: SAMPLE_BROCHURE },
      { name: "Rajasthan Fort Suites", location: "India", poster: "/media/poster/desert-ruins.jpg", brochureUrl: SAMPLE_BROCHURE }
    ]
  },
  {
    id: "europe",
    label: "Europe",
    entries: [
      { name: "Alpine Ridge Chalet", location: "Switzerland", poster: "/media/poster/alpine-ridge.jpg", brochureUrl: SAMPLE_BROCHURE },
      { name: "Seville Courtyard House", location: "Spain", poster: "/media/poster/reef-dive.jpg", brochureUrl: SAMPLE_BROCHURE }
    ]
  },
  {
    id: "middle-east",
    label: "Middle East",
    entries: [
      { name: "Wahiba Dune Camp", location: "Oman", poster: "/media/poster/desert-ruins.jpg", brochureUrl: SAMPLE_BROCHURE },
      { name: "Al Ula Cliff House", location: "Saudi Arabia", poster: "/media/poster/alpine-ridge.jpg", brochureUrl: SAMPLE_BROCHURE }
    ]
  }
];
