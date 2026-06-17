const CACHE_VERSION = "xo-space-news-v2";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const CACHE_PREFIX = "xo-space-news-";

const OFFLINE_URL = "/offline.html";

const APP_SHELL = [
  OFFLINE_URL,
  "/icons/xo-falsiane-192.png",
  "/icons/xo-falsiane-512.png",
  "/icons/space-news-192.png",
  "/icons/space-news-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);

      await Promise.allSettled(
        APP_SHELL.map(async (url) => {
          const response = await fetch(url, {
            cache: "reload",
          });

          if (response.ok) {
            await cache.put(url, response.clone());
          }
        }),
      );

      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(CACHE_PREFIX) &&
              key !== SHELL_CACHE &&
              key !== RUNTIME_CACHE,
          )
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    })(),
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith("/api/");
}

function isNextDataRequest(request, url) {
  return (
    url.pathname.startsWith("/_next/webpack-hmr") ||
    url.searchParams.has("_rsc") ||
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1"
  );
}

function isRuntimeAsset(request, url) {
  return (
    ["image", "font", "audio"].includes(request.destination) ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/game/") ||
    url.pathname.startsWith("/sounds/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/team/")
  );
}

async function navigationNetworkOnly(request) {
  try {
    return await fetch(request, {
      cache: "no-store",
    });
  } catch {
    return (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

async function immutableCacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  if (cached) return cached;

  const response = await fetch(request);

  if (response.ok && response.type !== "opaque") {
    await cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;
  if (request.headers.has("range")) return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return;
  if (isNextDataRequest(request, url)) return;

  // Nunca armazene HTML/RSC do Next.
  // HTML antigo pode apontar para chunks que já não existem.
  if (request.mode === "navigate") {
    event.respondWith(navigationNetworkOnly(request));
    return;
  }

  // Guarda somente assets estáticos e públicos.
  if (isRuntimeAsset(request, url)) {
    event.respondWith(immutableCacheFirst(request));
  }
});

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "CACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);

        await Promise.allSettled(
          data.urls
            .filter(
              (url) =>
                typeof url === "string" &&
                url.startsWith("/") &&
                !url.startsWith("/api/") &&
                !url.includes("?_rsc="),
            )
            .map(async (url) => {
              const response = await fetch(url, {
                cache: "no-cache",
              });

              if (response.ok && response.type !== "opaque") {
                await cache.put(url, response.clone());
              }
            }),
        );
      })(),
    );
  }
});