import type { CatalogGroup, Region, RegionStop } from "./types";
import { keyForPoster } from "../../lib/media";
import { t } from "../../lib/i18n";

// White Desert-style product page content for a single country: editorial
// chapters, a pull quote, and a numbered day-by-day journey the flight path
// lands on. Maldives is hand-authored (the flagship demo); every other
// country gets a decent generated fallback so all links work today and can
// be replaced with real copy later.

export type CountryChapter = {
  navLabel: string;
  eyebrow: string;
  title: [string, string];
  paragraphs: string[];
  slug: string;
  light?: boolean;
};

export type CountryDay = { title: string; copy: string; slug: string; details?: string[] };

export type EssentialCard = { title: string; copy: string; points: Array<[string, string]> };

export type CountryPageData = {
  country: string;
  tagline: string;
  priceLine: string;
  season: string;
  coords: string;
  heroSlug: string;
  chapters: CountryChapter[];
  quote: { text: string; attribution: string };
  days: CountryDay[];
  essentials: EssentialCard[];
};

const MALDIVES_PAGE: CountryPageData = {
  country: "Maldives",
  tagline: "One island, one house reef, and a seaplane that leaves when you do.",
  priceLine: "Private island routings · rates on request",
  season: "Nov – Apr",
  coords: "3.2°N 73.2°E",
  heroSlug: "reef-dive",
  chapters: [
    {
      navLabel: "The Atolls",
      eyebrow: "The Atolls",
      title: ["Water you can", "read by"],
      slug: "reef-dive",
      paragraphs: [
        "Twenty-six atolls scatter across the equator like a dropped string of pearls, and almost none of them ask anything of you. The Maldives we arrange is not the one on the postcards — it is quieter, further out, and built around a single question: how little do you want on the calendar?",
        "Arrival sets the tone. A seaplane lifts out of Malé and within minutes the water below turns to glass — lagoon-green, then channel-blue, then the deep ink of open ocean. Your island appears as a comma of white sand. There is no lobby. There is a jetty, a house manager who already knows your name, and a villa with the ocean on three sides."
      ]
    },
    {
      navLabel: "The Reef",
      eyebrow: "The House Reef",
      title: ["A cathedral below", "the waterline"],
      slug: "bali-coast",
      light: true,
      paragraphs: [
        "The best islands are chosen for what surrounds them. A living house reef — steps from the villa, no boat required — turns every hour of the day into a different performance: mantas on the morning current, turtles grazing at noon, reef sharks patrolling the drop-off as the light goes gold.",
        "Our resident guides dive it daily and route you to the right fifty metres of it at the right hour. Guests who have dived everywhere tell us the same thing: it is not about how far you go. It is about how well you know the water you are in."
      ]
    }
  ],
  quote: {
    text: "The Maldives does not raise its voice. It lowers yours.",
    attribution: "Field notes — The Retreat Collection"
  },
  days: [
    {
      title: "Arrival by seaplane",
      copy: "Met at Malé airside and walked straight to the seaplane lounge. Forty minutes over the atolls, a jetty greeting, and the island is yours. Dinner is barefoot on the sandbank if the tide agrees.",
      slug: "reef-dive",
      details: ["Seaplane transfer", "Jetty greeting", "Sandbank dinner"]
    },
    {
      title: "The house reef",
      copy: "A slow first morning, then a guided drift along the reef's outer wall. Mantas, if the plankton cooperates. Lunch is whatever the boat brought in; the afternoon belongs to the villa.",
      slug: "bali-coast",
      details: ["Guided reef drift", "Boat-to-table lunch", "Villa afternoon"]
    },
    {
      title: "Sandbank day",
      copy: "A private dhoni to an unnamed sandbank — an hour of ocean in every direction. A chef, a canopy, and nothing else. This is the day guests describe first when they get home.",
      slug: "alpine-ridge",
      details: ["Private dhoni", "Chef on the sand", "No other guests"]
    },
    {
      title: "The spa island",
      copy: "A short crossing to the spa's own islet. Treatments run to the sound of water on both sides of the room. The evening ends at the underwater table, four metres below the lagoon.",
      slug: "desert-ruins",
      details: ["Spa islet crossing", "Overwater treatment", "Underwater dinner"]
    },
    {
      title: "Departure, at leisure",
      copy: "No checkout time — the seaplane leaves when you do. A last swim on the house reef, coffee on the jetty, and the same forty minutes of glass-water back to Malé.",
      slug: "reef-dive",
      details: ["No checkout time", "Last reef swim", "Private transfer"]
    }
  ],
  essentials: [
    {
      title: "Getting there",
      copy: "Malé connects non-stop from every major hub. From there it is forty minutes by seaplane — met airside, walked to the private lounge, and airborne before the carousel at home has finished turning.",
      points: [
        ["From Dubai", "4h direct"],
        ["Seaplane", "40 min"],
        ["Check-in", "Private lounge"]
      ]
    },
    {
      title: "When to go",
      copy: "November to April is the dry monsoon — glassy lagoons and long light. May to October trades a little rain for mantas on the current and the year's best surf. There is no wrong month, only different water.",
      points: [
        ["Best light", "Feb – Mar"],
        ["Manta season", "May – Oct"],
        ["Quietest", "May & Nov"]
      ]
    },
    {
      title: "The water",
      copy: "Twenty-eight degrees year-round, visibility that regularly passes thirty metres, and a house reef that starts at the villa steps. Dive guides are resident, not visiting.",
      points: [
        ["Water temp", "28°C"],
        ["Visibility", "30m+"],
        ["House reef", "At the steps"]
      ]
    },
    {
      title: "Good to know",
      copy: "Dollars are accepted everywhere, the islands run half an hour ahead of Malé when the resort prefers its own clock, and the dress code, formally speaking, is barefoot.",
      points: [
        ["Time zone", "GMT +5"],
        ["Currency", "USD accepted"],
        ["Dress code", "Barefoot"]
      ]
    }
  ]
};

const AUTHORED: Record<string, CountryPageData> = {
  maldives: MALDIVES_PAGE
};

function generatePage(stop: RegionStop, group: CatalogGroup): CountryPageData {
  const lead = group.entries[0];
  const second = group.entries[1] ?? lead;
  return {
    country: stop.country,
    tagline: stop.copy,
    priceLine: t("gen.priceLine"),
    season: stop.season,
    coords: stop.coords,
    heroSlug: stop.slug,
    chapters: [
      {
        navLabel: stop.eyebrow,
        eyebrow: stop.eyebrow,
        title: stop.title,
        slug: stop.slug,
        paragraphs: [
          lead?.description ?? stop.copy,
          t("gen.chapter1Para", { country: stop.country })
        ]
      },
      {
        navLabel: t("gen.addressNav"),
        eyebrow: t("gen.addressNav"),
        title: [t("gen.addressTitle1"), t("gen.addressTitle2")],
        slug: second ? keyForPoster(second.poster) : stop.slug,
        light: true,
        paragraphs: [
          second?.description ?? t("gen.addressFallback", { location: lead?.location ?? stop.country }),
          t("gen.addressPara2", { names: group.entries.map((e) => e.name).join(" · ") })
        ]
      }
    ],
    quote: {
      text: t("gen.quote", { country: stop.country }),
      attribution: t("gen.attribution")
    },
    // signatures: the country's actual stays, one each — their own lead
    // media and portal-sourced copy. Never demo footage.
    days: group.entries.slice(0, 5).map((e) => ({
      title: e.name,
      copy: e.description ?? t("gen.dayFallback", { name: e.name, location: e.location }),
      slug: keyForPoster(e.poster),
      details: e.highlights?.slice(0, 3) ?? [e.location]
    })),
    essentials: [
      {
        title: t("gen.gettingThere"),
        copy: t("gen.gettingThereCopy", { country: stop.country }),
        points: [
          [t("gen.arrival"), t("gen.metAirside")],
          [t("gen.transfer"), t("gen.private")],
          [t("gen.checkin"), t("gen.handled")]
        ]
      },
      {
        title: t("gen.whenToGo"),
        copy: t("gen.whenCopy", { season: stop.season }),
        points: [
          [t("stop.bestSeason"), stop.season],
          [t("gen.bookedAhead"), t("gen.months36")],
          [t("gen.flexible"), t("gen.always")]
        ]
      },
      {
        title: t("gen.goodToKnow"),
        copy: t("gen.goodCopy"),
        points: [
          [t("gen.guides"), t("gen.resident")],
          [t("gen.routing"), t("gen.custom")],
          [t("gen.pace"), t("gen.yours")]
        ]
      }
    ]
  };
}

// Pages injected from the CMS at boot take precedence over the authored
// demo page, which takes precedence over the generated fallback — so a
// country goes live in Sanity the moment its page document exists, and
// keeps working (generated) until then.
const CMS_PAGES: Record<string, CountryPageData> = {};
export function setCountryPage(slug: string, page: CountryPageData) {
  CMS_PAGES[slug] = page;
}

export function getCountryPage(region: Region, slug: string) {
  const group = region.catalog.find((g) => g.id === slug);
  const stop = region.stops.find((s) => s.country.toLowerCase() === group?.label.toLowerCase());
  if (!group || !stop) return null;
  // Group ids repeat across regions (alpine/france vs coast/france), but
  // CMS pages are keyed by slug alone — only apply one whose country
  // matches THIS region's stop, so a page can never bleed into the wrong
  // continent's route.
  const cms = CMS_PAGES[slug];
  const cmsFits = cms && cms.country.toLowerCase() === stop.country.toLowerCase();
  const page = (cmsFits ? cms : undefined) ?? AUTHORED[slug] ?? generatePage(stop, group);
  return { group, stop, page };
}
