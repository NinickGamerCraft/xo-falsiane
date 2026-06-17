"use client";

import { useEffect } from "react";

const PWA_VERSION = "xo-space-news-pwa-v2";
const MIGRATION_KEY = "xo-space-news.pwaVersion";
const CACHE_PREFIX = "xo-space-news-";

async function limparCachesDoProjeto() {
  if (!("caches" in window)) return;

  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .map((key) => caches.delete(key)),
  );
}

async function desregistrarServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
}

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const hostname = window.location.hostname;
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1";

    const iniciar = async () => {
      try {
        // Nunca mantenha service worker ativo no servidor de desenvolvimento.
        // O Turbopack reutiliza URLs de módulos durante o dev e um SW antigo pode
        // servir chunks incompatíveis, causando "module factory is not available".
        if (process.env.NODE_ENV !== "production" || isLocalhost) {
          await desregistrarServiceWorkers();
          await limparCachesDoProjeto();
          return;
        }

        const savedVersion = window.localStorage.getItem(MIGRATION_KEY);

        // Migração única: remove o worker/cache antigo que armazenava HTML e chunks.
        if (savedVersion !== PWA_VERSION) {
          await desregistrarServiceWorkers();
          await limparCachesDoProjeto();
          window.localStorage.setItem(MIGRATION_KEY, PWA_VERSION);

          // Uma página ainda controlada pelo worker antigo só deixa de ser controlada
          // após uma navegação/reload.
          if (navigator.serviceWorker.controller) {
            window.location.reload();
            return;
          }
        }

        if (cancelled) return;

        const registration = await navigator.serviceWorker.register(
          `/sw.js?v=${encodeURIComponent(PWA_VERSION)}`,
          {
            scope: "/",
            updateViaCache: "none",
          },
        );

        await registration.update();
      } catch (error) {
        console.warn("Não foi possível ativar o modo offline:", error);
      }
    };

    if (document.readyState === "complete") {
      void iniciar();
    } else {
      window.addEventListener("load", iniciar, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", iniciar);
    };
  }, []);

  return null;
}
