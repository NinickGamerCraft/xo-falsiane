const CACHE_VERSION = "xo-space-news-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const APP_SHELL = [
  "/",
  "/jogo",
  "/offline.html",
  "/icons/xo-falsiane-192.png",
  "/icons/xo-falsiane-512.png",
  "/icons/space-news-192.png",
  "/icons/space-news-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL.map(async (url) => {
          const response = await fetch(url, { cache: "reload" });

          if (response.ok) {
            await cache.put(url, response);
          }
        }),
      );

      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => ![SHELL_CACHE, RUNTIME_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      ),

      self.clients.claim(),
    ]),
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isStaticAsset(request, url) {
  return (
    ["image", "font", "style", "script", "audio"].includes(
      request.destination,
    ) ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/game/") ||
    url.pathname.startsWith("/sounds/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/team/")
  );
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    return (
      (await caches.match("/offline.html")) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);

  if (response.ok && response.type !== "opaque") {
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isApiRequest(url)) {
    return;
  }

  if (request.headers.has("range")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (
    data.type === "CACHE_URLS" &&
    Array.isArray(data.urls)
  ) {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) =>
        Promise.allSettled(
          data.urls
            .filter(
              (url) =>
                typeof url === "string" &&
                url.startsWith("/"),
            )
            .map(async (url) => {
              const response = await fetch(url);

              if (response.ok) {
                await cache.put(url, response);
              }
            }),
        ),
      ),
    );
  }
});