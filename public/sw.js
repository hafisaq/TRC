const VERSION = "trc-pwa-v7";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const CACHE_PREFIX = "trc-";

const CORE_ROUTES = [
  "/",
  "/asia/maldives/", "/asia/thailand/", "/asia/sri-lanka/", "/asia/india/", "/asia/malaysia/",
  "/alpine/switzerland/", "/alpine/france/", "/alpine/italy/", "/alpine/finland/", "/alpine/antarctica/",
  "/coast/italy/", "/coast/france/", "/coast/greece/", "/coast/spain/", "/coast/seychelles/", "/coast/indonesia/",
  "/desert/oman/", "/desert/uae/", "/desert/qatar/", "/desert/saudi-arabia/", "/desert/morocco/",
  "/coast/caribbean/", "/alpine/andes/",
  "/cities/london/", "/cities/paris/", "/cities/geneva/", "/cities/zurich/", "/cities/milan/",
  "/cities/venice/", "/cities/florence/", "/cities/vienna-salzburg/", "/cities/dusseldorf/", "/cities/new-york/"
];

const CORE_ASSETS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/media/brand/GOLD.png",
  "/media/brand/01143b.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
  "/media/poster/alpine-ridge.jpg",
  "/media/poster/bali-coast.jpg",
  "/media/poster/desert-ruins.jpg",
  "/media/poster/reef-dive.jpg"
];

const PRECACHE = [...CORE_ROUTES, ...CORE_ASSETS];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: "reload" }))))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== RUNTIME_CACHE)
              .map((key) => caches.delete(key))
          )
        ),
      "navigationPreload" in self.registration ? self.registration.navigationPreload.enable() : Promise.resolve()
    ]).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Sanity's image CDN: sized/re-encoded posters and gallery stills. URLs
  // are content-addressed (immutable), so cache-first is always correct —
  // repeat visits render media without touching the network. Films stay
  // network-only (range requests, below).
  if (url.hostname === "cdn.sanity.io" && request.destination === "image") {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  // Video/audio range requests are best left to the browser/network. Caching
  // partial media responses is fragile and can break playback on Safari.
  if (request.headers.has("range") || request.destination === "video" || request.destination === "audio") {
    event.respondWith(fetch(request));
    return;
  }

  if (["style", "script", "worker"].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (["image", "font", "manifest"].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstNavigation(event) {
  const cachedFallback = await caches.match("/offline.html");
  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;

    const response = await fetch(event.request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(event.request, response.clone());
    }
    return response;
  } catch {
    const cachedPage = await caches.match(event.request);
    if (cachedPage) return cachedPage;

    const url = new URL(event.request.url);
    const pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    const cachedRoute = await caches.match(pathname);
    return cachedRoute || cachedFallback || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  // no-cors image fetches (cdn.sanity.io) come back opaque: ok is false
  // but the bytes are fine — cache those too
  if (response.ok || response.type === "opaque") {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  return cached || (await network) || Response.error();
}
