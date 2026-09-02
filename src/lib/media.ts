// Media indirection: components ask for a poster/film by KEY instead of
// hardcoding /media/... paths. For the bundled demo content the key is a
// demo slug and resolves to the local files, exactly as before. When
// content hydrates from Sanity, each media slot registers its CDN URLs
// under a unique key — the same components then serve CMS-managed media
// with zero further changes.
const posters = new Map<string, string>();
const films = new Map<string, string>();
// film lookup for content that carries a poster URL/path instead of a key
// (stay galleries, dossier lead media)
const filmByPoster = new Map<string, string>();
// Sanity's ~20px base64 LQIP per image — painted as a blurred background
// behind every media shell so a cold load never shows a blank frame
const lqips = new Map<string, string>();
const lqipByPoster = new Map<string, string>();

export function registerMedia(key: string, urls: { poster?: string; film?: string; lqip?: string }) {
  if (urls.poster) {
    posters.set(key, urls.poster);
    if (urls.film) filmByPoster.set(urls.poster, urls.film);
    if (urls.lqip) lqipByPoster.set(urls.poster, urls.lqip);
  }
  if (urls.film) films.set(key, urls.film);
  if (urls.lqip) lqips.set(key, urls.lqip);
}

// Inline style for a media container: the LQIP as an instant blurred
// backdrop (undefined when none is known — demo content, missing metadata)
export const lqipStyle = (key: string): { backgroundImage: string; backgroundSize: string; backgroundPosition: string } | undefined => {
  const l = lqips.get(key) ?? lqipByPoster.get(posters.get(key) ?? "");
  return l ? { backgroundImage: `url(${l})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined;
};

export const lqipStyleForPoster = (poster: string) => {
  const l = lqipByPoster.get(poster);
  return l ? { backgroundImage: `url(${l})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined;
};

// For .media-shell containers: sets the --lqip var the shell's ::before
// paints under the fading image (see main.css)
import type { CSSProperties } from "react";
export const lqipVar = (key: string): CSSProperties | undefined => {
  const l = lqips.get(key) ?? lqipByPoster.get(posters.get(key) ?? "");
  return l ? ({ "--lqip": `url(${l})` } as CSSProperties) : undefined;
};
export const lqipVarForPoster = (poster: string): CSSProperties | undefined => {
  const l = lqipByPoster.get(poster);
  return l ? ({ "--lqip": `url(${l})` } as CSSProperties) : undefined;
};

// Sanity's image CDN resizes/re-encodes on the fly — a raw 2560px
// original (~600KB+) becomes a ~100-200KB WebP/AVIF sized to what the
// layout actually needs. Applied to any cdn.sanity.io image URL; local
// demo files pass through untouched.
export const imgSized = (url: string, w = 1600) =>
  url.includes("cdn.sanity.io/images") && !url.includes("?")
    ? `${url}?auto=format&q=75&w=${w}`
    : url;

export const posterUrl = (key: string, w = 1600) => imgSized(posters.get(key) ?? `/media/poster/${key}.jpg`, w);

export const videoUrl = (key: string) => films.get(key) ?? `/media/video/${key}.mp4`;

// For poster paths/URLs: the matching film if one is registered, else the
// demo convention (poster path -> sibling mp4).
export const videoForPoster = (poster: string) =>
  filmByPoster.get(poster) ??
  poster.replace("/media/poster/", "/media/video/").replace(/\.(jpg|jpeg|png|webp)$/i, ".mp4");

// Derive a registry key from a poster path/URL: demo paths map back to
// their slug; anything else (a CMS URL) registers itself under a stable
// key so slug-driven components can carry it.
let anonN = 0;
const keyByPoster = new Map<string, string>();
export function keyForPoster(poster: string): string {
  const demo = poster.match(/^\/media\/poster\/([a-z0-9-]+)\.[a-z]+$/i);
  if (demo) return demo[1];
  let key = keyByPoster.get(poster);
  if (!key) {
    key = `p-${(anonN++).toString(36)}`;
    keyByPoster.set(poster, key);
    registerMedia(key, { poster, film: videoForPoster(poster) });
  }
  return key;
}

// The registered film for a poster, or undefined — lets components render
// a playing film for CMS entries that have one and a still otherwise.
export const filmForPoster = (poster: string) => filmByPoster.get(poster);

// Whether a media key has real footage: registered CMS keys must carry a
// film explicitly; bare demo slugs are presumed to have their bundled mp4.
export const hasFilm = (key: string) => films.has(key) || !posters.has(key);
