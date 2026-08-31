import type { Region } from "./types";

// Mountain & Ice — the second continent. Unlike Asia there is no bundled
// demo content: stops and catalog arrive entirely from the CMS at boot,
// and the home selector section simply doesn't render if hydration fails
// (offline, CMS outage). Honest absence beats placeholder footage.
export const ALPINE: Region = {
  slug: "alpine",
  title: "Mountain & ice",
  intro:
    "Alpine chalets, Arctic wilderness, and the far south when the season allows. Days built around light — first tracks at dawn, a slow lunch on a sun terrace, nothing scheduled after four.",
  // Centered between the Alps and Lapland on the DotMap world layout.
  focus: { cx: 0.5, cy: 0.3, zoom: 2.4 },
  stops: [],
  catalog: []
};
