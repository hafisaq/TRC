import type { Region } from "./types";


export const ASIA: Region = {
  slug: "asia",
  title: "Asia",
  intro: "Four ways into the region, each with its own pace — coastline, reef, high country, and old palaces. Placeholder stays below, standing in for the real portfolio.",
  // Centers on the Asia dot-mass in DotMap's world layout (cx 0.68, cy 0.32)
  // so the zoomed-in background actually lines up with the country stops
  // below, instead of showing empty ocean.
  focus: { cx: 0.68, cy: 0.32, zoom: 3.2 },
  stops: [
    {
      id: "asia-maldives",
      mapPos: [0.58, 0.42],
      country: "Maldives",
      eyebrow: "Reef & lagoon",
      title: ["Below the", "waterline"],
      copy: "Overwater villas and house reefs a few strokes from your door — the Maldives at its quietest, off-season.",
      coords: "3.2°N 73.2°E",
      slug: "reef-dive",
      season: "May - Oct",
      highlights: ["Overwater villa", "House reef", "Private dive guide"],
      theme: "gold"
    },
    {
      id: "asia-thailand",
      mapPos: [0.74, 0.38],
      country: "Thailand",
      eyebrow: "Coast & islands",
      title: ["Andaman", "quiet"],
      copy: "Palm-lined coves along Thailand's west coast - a private beach house, a boat on call, nothing scheduled.",
      coords: "9.5°N 98.4°E",
      slug: "bali-coast",
      season: "Nov - Apr",
      highlights: ["Private beach house", "Boat included", "Chef on call"],
      theme: "white"
    },
    {
      id: "asia-sri-lanka",
      mapPos: [0.62, 0.36],
      country: "Sri Lanka",
      eyebrow: "Hill country",
      title: ["Tea country", "mornings"],
      copy: "Colonial bungalows above the tea estates, cool air and long views — Sri Lanka's hill country at first light.",
      coords: "6.9°N 80.8°E",
      slug: "alpine-ridge",
      season: "Jan - Mar",
      highlights: ["Private bungalow", "Estate walks", "Tea tastings"],
      theme: "white"
    },
    {
      id: "asia-india",
      mapPos: [0.54, 0.3],
      country: "India",
      eyebrow: "Palaces & forts",
      title: ["Rajasthan", "at dusk"],
      copy: "Desert forts and palace courtyards across Rajasthan, with a private guide and driver for the whole route.",
      coords: "26.9°N 75.8°E",
      slug: "desert-ruins",
      season: "Oct - Mar",
      highlights: ["Palace stays", "Private driver", "Custom routing"],
      theme: "gold"
    }
  ],
  // The overflow: every country gets as many properties as needed here,
  // without touching the curated 4-stop journey above.
  catalog: [
    {
      id: "maldives",
      label: "Maldives",
      entries: [
        {
          name: "Cheval Blanc Randheli",
          location: "Noonu Atoll, Maldives",
          poster: "/media/poster/reef-dive.jpg",
          description:
            "A private island address for ultra-quiet Maldives requests: villas, spa journeys, private island buyouts, and a library of sales assets ready for advisors.",
          coordinates: "5.8°N 73.4°E",
          season: "Nov - Apr",
          highlights: ["Private island", "Spa brochure", "B2B sales deck", "Rates & offers"],
          facts: [
            { label: "Mood", value: "Barefoot maison" },
            { label: "Best for", value: "Families, couples, buyouts" },
            { label: "Arrival", value: "Seaplane transfer" },
            { label: "Asset set", value: "7 categories" }
          ],
          gallery: [
            "/media/poster/reef-dive.jpg",
            "/media/poster/bali-coast.jpg",
            "/media/poster/alpine-ridge.jpg",
            "/media/poster/desert-ruins.jpg"
          ],
          assets: [
            {
              category: "Brochures",
              title: "Brochure Spa_Cheval Blanc Randheli_EN",
              label: "Spa brochure",
              url: "https://connect.thetravelportfolio.me/wp-content/uploads/2025/01/Brochure-Spa_Cheval-Blanc-Randheli_EN.pdf"
            },
            {
              category: "Brochures",
              title: "Cheval Blanc Randheli Private Island EN",
              label: "Private island"
            },
            {
              category: "Brochures",
              title: "Cheval Blanc Randheli_Brochure B2B_EN",
              label: "B2B brochure"
            },
            {
              category: "Fact Sheets",
              title: "CBR Factsheet EN",
              label: "Key facts"
            },
            {
              category: "Images",
              title: "Villa and island image library",
              label: "Photo set"
            },
            {
              category: "Images",
              title: "Spa and dining image library",
              label: "Photo set"
            },
            {
              category: "Presentations",
              title: "Cheval Blanc Randheli advisor presentation",
              label: "Sales deck"
            },
            {
              category: "Newsletter",
              title: "Randheli seasonal newsletter",
              label: "Campaign"
            },
            {
              category: "Rates & Offers",
              title: "Current rates and private island offers",
              label: "Offer sheet"
            },
            {
              category: "Videos",
              title: "Island arrival and villa film",
              label: "Video"
            }
          ]
        },
        {
          name: "Overwater Reef Villa",
          location: "North Male Atoll",
          poster: "/media/poster/reef-dive.jpg",
          description: "A reef-led stay with quiet overwater villas, guided snorkelling, and a house reef close enough to become the daily rhythm.",
          coordinates: "4.2°N 73.5°E",
          season: "May - Oct",
          highlights: ["House reef", "Dive guide", "Overwater villas"],
          gallery: ["/media/poster/reef-dive.jpg", "/media/poster/bali-coast.jpg"],
          assets: [
            { category: "Brochures", title: "Overwater villa experience brochure", label: "Brochure" },
            { category: "Images", title: "Lagoon and villa photo set", label: "Photo set" },
            { category: "Videos", title: "House reef film", label: "Video" }
          ]
        },
        {
          name: "Private Island Residence",
          location: "Baa Atoll",
          poster: "/media/poster/bali-coast.jpg",
          description: "A buyout-style island residence for families and private groups who want total control of the pace.",
          coordinates: "5.1°N 73.0°E",
          season: "Nov - Apr",
          highlights: ["Buyout feel", "Private chef", "Family routing"],
          gallery: ["/media/poster/bali-coast.jpg", "/media/poster/reef-dive.jpg"],
          assets: [
            { category: "Brochures", title: "Private island residence brochure", label: "Brochure" },
            { category: "Rates & Offers", title: "Private residence offer sheet", label: "Offer" },
            { category: "Images", title: "Residence image set", label: "Photo set" }
          ]
        }
      ]
    },
    {
      id: "thailand",
      label: "Thailand",
      entries: [
        { name: "Amanpuri Beach Villa", location: "Phuket, Thailand", poster: "/media/poster/bali-coast.jpg", },
        { name: "Phuket Cliffside Retreat", location: "Phuket, Thailand", poster: "/media/poster/reef-dive.jpg", }
      ]
    },
    {
      id: "sri-lanka",
      label: "Sri Lanka",
      entries: [
        { name: "Ceylon Tea Estate House", location: "Nuwara Eliya", poster: "/media/poster/alpine-ridge.jpg", },
        { name: "Galle Fort Townhouse", location: "Galle, Sri Lanka", poster: "/media/poster/desert-ruins.jpg", }
      ]
    },
    {
      id: "india",
      label: "India",
      entries: [
        { name: "Rajasthan Fort Palace", location: "Jodhpur, Rajasthan", poster: "/media/poster/desert-ruins.jpg", },
        { name: "Kerala Backwater House", location: "Alleppey, Kerala", poster: "/media/poster/bali-coast.jpg", },
        { name: "Himalayan Foothill Lodge", location: "Uttarakhand", poster: "/media/poster/alpine-ridge.jpg", }
      ]
    }
  ]
};
