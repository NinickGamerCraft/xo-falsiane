"use client";

import { useEffect } from "react";

const CACHE_PREFIXES = [
  "xo-space-news-",
  "xo-falsiane-",
];

function isDevelopmentHost() {
  return (
    process.env.NODE_ENV !== "production" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

async function clearProjectCaches() {
  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames
      .filter((name) =>
        CACHE_PREFIXES.some((prefix) =>
          name.startsWith(prefix),
        ),
      )
      .map((name) => caches.delete(name)),
  );
}

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const setup = async () => {
      try {
        if (isDevelopmentHost()) {
          const registrations =
            await navigator.serviceWorker.getRegistrations();

          await Promise.all(
            registrations.map((registration) =>
              registration.unregister(),
            ),
          );

          await clearProjectCaches();
          return;
        }

        const registration =
          await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
          });

        if (!cancelled) {
          await registration.update();
        }
      } catch (error) {
        console.warn(
          "[PWA] não foi possível configurar o modo offline:",
          error,
        );
      }
    };

    if (document.readyState === "complete") {
      void setup();
    } else {
      window.addEventListener(
        "load",
        () => {
          void setup();
        },
        { once: true },
      );
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
