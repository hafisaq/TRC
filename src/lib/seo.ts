// The head, kept true at runtime: the build writes each route's own
// title, description and canonical from the CMS (scripts/copy-routes.mjs);
// this sets the same from the live content once it has arrived, so the
// dev server, the Arabic version and any edit made in the Studio since
// the last build all read right in the tab, in shares and in history.
const BRAND = "The Retreat Collection";

const setMeta = (selector: string, attr: string, value: string) => {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (el) el.setAttribute(attr, value);
};

export function applySeo({ title, description }: { title: string; description?: string }) {
  document.title = title;
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[name="twitter:title"]', "content", title);
  if (description) {
    const d = description.replace(/\s+/g, " ").trim().slice(0, 158);
    setMeta('meta[name="description"]', "content", d);
    setMeta('meta[property="og:description"]', "content", d);
    setMeta('meta[name="twitter:description"]', "content", d);
  }
}

export const countryTitle = (country: string, regionTitle: string) => `${country} — ${regionTitle} | ${BRAND}`;
export const wellnessTitle = (label: string) => `${label} — ${BRAND}`;
