import type { CatalogGroup, Region, RegionStop } from "./types";

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
    priceLine: "Private routings · rates on request",
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
          `Every stay in ${stop.country} is visited, vetted, and arranged directly — the route, the rooms, and the hours in between are built around the traveller, not a package.`
        ]
      },
      {
        navLabel: "The Address",
        eyebrow: "The Address",
        title: ["Rooms worth the", "flight over"],
        slug: second?.poster.replace("/media/poster/", "").replace(".jpg", "") ?? stop.slug,
        light: true,
        paragraphs: [
          second?.description ?? `From ${lead?.location ?? stop.country} outward, the collection keeps only the addresses we would send our own families to.`,
          "Placeholder editorial copy for this chapter — the final text arrives with the client's content, and drops into this layout without design changes."
        ]
      }
    ],
    quote: {
      text: `${stop.country} rewards the traveller who arrives with time to spend, not a list to finish.`,
      attribution: "Field notes — The Retreat Collection"
    },
    days: [
      { title: "Private arrival", copy: `Met on landing and routed privately to the first stay. The first evening is deliberately unscheduled — arrive, settle, breathe.`, slug: stop.slug, details: ["Met on landing", "Private transfer", "Unscheduled evening"] },
      { title: "The signature day", copy: `${stop.highlights[0] ?? "A private guide"} sets the pace. Placeholder itinerary copy standing in for the real day-by-day.`, slug: second?.poster.replace("/media/poster/", "").replace(".jpg", "") ?? stop.slug, details: [stop.highlights[0] ?? "Private guide", stop.highlights[1] ?? "Own pace"] },
      { title: "Further out", copy: "A day beyond the guidebook radius — the kind of detour that only works with a driver, a guide, and no fixed lunch reservation.", slug: "alpine-ridge", details: ["Private driver", "No fixed reservations"] },
      { title: "At leisure", copy: "Nothing on the calendar until you ask for it. The team stays close; the day stays yours.", slug: "desert-ruins", details: ["Day at leisure", "Team on call"] },
      { title: "Departure, unhurried", copy: "A late checkout as standard, a quiet transfer, and the route home already smoothed.", slug: stop.slug, details: ["Late checkout", "Smoothed route home"] }
    ],
    essentials: [
      {
        title: "Getting there",
        copy: `Routed privately from arrival onward — placeholder logistics copy for ${stop.country}, replaced by the real detail with the client's content.`,
        points: [["Arrival", "Met airside"], ["Transfer", "Private"], ["Check-in", "Handled"]]
      },
      {
        title: "When to go",
        copy: `${stop.season} is the season we plan around — placeholder climate copy standing in for the final guidance.`,
        points: [["Best season", stop.season], ["Booked ahead", "3–6 months"], ["Flexible", "Always"]]
      },
      {
        title: "Good to know",
        copy: "The practical notes — currency, timing, what to pack — arrive with the final content and drop into this card without design changes.",
        points: [["Guides", "Resident"], ["Routing", "Custom"], ["Pace", "Yours"]]
      }
    ]
  };
}

export function getCountryPage(region: Region, slug: string) {
  const group = region.catalog.find((g) => g.id === slug);
  const stop = region.stops.find((s) => s.country.toLowerCase() === group?.label.toLowerCase());
  if (!group || !stop) return null;
  const page = AUTHORED[slug] ?? generatePage(stop, group);
  return { group, stop, page };
}
