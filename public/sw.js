/* Gourmeats service worker — keeps the landing page available offline.
 *
 * Strategies:
 *  - Page navigations ("/")         → network-first (with timeout), fallback to last cached copy.
 *  - Landing data (GET /_serverFn/) → network-first, fallback to cache.
 *  - Built assets (/assets/*)       → cache-first (file names are content-hashed).
 *  - Images, fonts, icons           → stale-while-revalidate.
 *  - Admin/auth routes, non-GET, authenticated requests and Supabase API → never touched.
 *
 * Bump VERSION to force old caches to be dropped.
 */
const VERSION = "v1";
const PAGES = `gm-pages-${VERSION}`;
const DATA = `gm-data-${VERSION}`;
const ASSETS = `gm-assets-${VERSION}`;
const MEDIA = `gm-media-${VERSION}`;
const CURRENT = [PAGES, DATA, ASSETS, MEDIA];

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

const PRIVATE_PATHS = ["/admin", "/auth", "/reset-password", "/sitemap.xml"];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) =>
        Promise.all(
          PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" })).catch(() => {})),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("gm-") && !CURRENT.includes(k))
          .map((k) => caches.delete(k)),
      );
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

// The page sends the resources it loaded before the SW took control, so the
// very first visit is already enough to work offline afterwards.
self.addEventListener("message", (event) => {
  const msg = event.data;
  if (!msg || msg.type !== "CACHE_URLS" || !Array.isArray(msg.urls)) return;
  event.waitUntil(
    Promise.all(
      msg.urls.map(async (url) => {
        try {
          const req = new Request(url, {
            mode: new URL(url).origin === self.location.origin ? "same-origin" : "no-cors",
          });
          const cacheName = pickCache(req);
          if (!cacheName) return;
          const cache = await caches.open(cacheName);
          if (await cache.match(req)) return;
          const res = await fetch(req);
          if (isCacheable(res)) await cache.put(req, res);
        } catch {
          /* ignore */
        }
      }),
    ),
  );
});

function isPrivate(url) {
  return PRIVATE_PATHS.some((p) => url.pathname === p || url.pathname.startsWith(p + "/"));
}

function isCacheable(res) {
  return res && (res.ok || res.type === "opaque");
}

function pickCache(request) {
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    if (isPrivate(url)) return null;
    if (url.pathname.startsWith("/_serverFn/")) return DATA;
    if (url.pathname.startsWith("/assets/")) return ASSETS;
    if (
      /\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|webmanifest)$/i.test(url.pathname) ||
      url.pathname.startsWith("/__l5e/")
    )
      return MEDIA;
    return null;
  }

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") return MEDIA;
  // Restaurant logos / images hosted on Supabase Storage or other CDNs (never the Supabase API).
  if (
    /\.supabase\.co$/.test(url.hostname) &&
    !url.pathname.startsWith("/storage/v1/object/public/")
  )
    return null;
  if (/\.(?:png|jpe?g|webp|avif|gif|svg)(?:$|\?)/i.test(url.pathname + url.search)) return MEDIA;
  return null;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.headers.get("authorization")) return;
  if (request.headers.has("range")) return; // video/audio streaming

  const url = new URL(request.url);
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  if (request.mode === "navigate") {
    if (url.origin !== self.location.origin || isPrivate(url)) return;
    event.respondWith(handleNavigation(event));
    return;
  }

  const cacheName = pickCache(request);
  if (!cacheName) return;

  if (cacheName === DATA) event.respondWith(networkFirst(request, DATA));
  else if (cacheName === ASSETS) event.respondWith(cacheFirst(request, ASSETS));
  else event.respondWith(staleWhileRevalidate(event, request, MEDIA));
});

async function handleNavigation(event) {
  const cache = await caches.open(PAGES);
  const url = new URL(event.request.url);
  // Every public page is the landing; cache it under its path without query string (e.g. ?source=pwa).
  const key = url.origin + url.pathname;

  const network = (async () => {
    const preload = await event.preloadResponse;
    const res = preload || (await fetch(event.request));
    if (res && res.ok && (res.headers.get("content-type") || "").includes("text/html")) {
      await cache.put(key, res.clone());
    }
    return res;
  })();
  event.waitUntil(network.catch(() => {}));

  const cached = (await cache.match(key)) || (await cache.match("/"));
  if (!cached) return network;

  // Prefer fresh content, but never leave the user staring at a blank screen.
  return Promise.race([
    network.then((res) => (res && res.status < 500 ? res : cached)).catch(() => cached),
    new Promise((resolve) => setTimeout(() => resolve(cached), NETWORK_TIMEOUT_MS)),
  ]);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) await cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (isCacheable(res)) await cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(event, request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (res) => {
      if (isCacheable(res)) await cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  event.waitUntil(network);
  return cached || (await network) || Response.error();
}
