"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
    __xoVlibrasScriptPromise?: Promise<void>;
    __xoVlibrasWidgetInstance?: unknown;
    abrirVLibras?: () => Promise<void>;
  }
}

const ROOT_ID = "xo-vlibras-root";
const SCRIPT_ID = "xo-vlibras-script";
const SCRIPT_URL = "https://vlibras.gov.br/app/vlibras-plugin.js";
const BASE_URL = "https://vlibras.gov.br/app";

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function getVlibrasElements() {
  const root = document.getElementById(ROOT_ID);
  const button =
    root?.querySelector("[vw-access-button]") ??
    document.querySelector("[vw-access-button]");
  const wrapper =
    root?.querySelector("[vw-plugin-wrapper]") ??
    document.querySelector("[vw-plugin-wrapper]");

  return { root, button, wrapper };
}

function isGameRouteNow() {
  return (
    window.location.pathname.startsWith("/jogo") ||
    document.body.classList.contains("game-page-active") ||
    document.documentElement.classList.contains("xo-vlibras-route-hidden") ||
    document.body.classList.contains("xo-vlibras-route-hidden")
  );
}

function applyVlibrasVisibility() {
  const { root } = getVlibrasElements();
  if (!(root instanceof HTMLElement)) return true;

  const hidden = isGameRouteNow();
  root.dataset.routeHidden = hidden ? "true" : "false";

  if (hidden) {
    root.style.setProperty("display", "none", "important");
    root.setAttribute("aria-hidden", "true");
    return true;
  }

  root.style.removeProperty("display");
  root.removeAttribute("aria-hidden");
  return false;
}

function restoreVlibrasOfficialUi() {
  if (applyVlibrasVisibility()) return;

  const { root, button, wrapper } = getVlibrasElements();

  [root, button, wrapper].forEach((element) => {
    if (!(element instanceof HTMLElement)) return;
    element.style.removeProperty("visibility");
    element.style.removeProperty("opacity");
    element.style.removeProperty("pointer-events");
    element.removeAttribute("aria-hidden");
  });

  if (root instanceof HTMLElement) {
    root.dataset.routeHidden = "false";
    root.style.setProperty("z-index", "2147483600", "important");
  }

  if (button instanceof HTMLElement) {
    button.style.setProperty("pointer-events", "auto", "important");
    button.style.setProperty("touch-action", "manipulation", "important");
    button.style.setProperty("-webkit-tap-highlight-color", "transparent");
    button.setAttribute("aria-label", "Abrir tradutor VLibras");
    button.setAttribute("title", "Abrir VLibras");
    if (!button.getAttribute("tabindex")) button.setAttribute("tabindex", "0");
  }

  if (wrapper instanceof HTMLElement) {
    wrapper.style.setProperty("z-index", "2147483640", "important");
  }
}

async function loadOfficialVlibrasScript() {
  if (window.VLibras?.Widget) return;
  if (window.__xoVlibrasScriptPromise) return window.__xoVlibrasScriptPromise;

  window.__xoVlibrasScriptPromise = new Promise<void>((resolve, reject) => {
    let settled = false;

    const finishWhenAvailable = async () => {
      for (let attempt = 0; attempt < 70; attempt += 1) {
        if (window.VLibras?.Widget) {
          settled = true;
          resolve();
          return;
        }
        await wait(180);
      }

      settled = true;
      reject(new Error("A API oficial do VLibras não ficou disponível."));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `#${SCRIPT_ID}, script[src*="vlibras-plugin.js"]`,
    );

    if (existing) {
      if (window.VLibras?.Widget) {
        settled = true;
        resolve();
        return;
      }

      existing.addEventListener("load", () => void finishWhenAvailable(), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => {
          existing.remove();
          window.__xoVlibrasScriptPromise = undefined;
          reject(new Error("Falha ao carregar o script oficial do VLibras."));
        },
        { once: true },
      );

      void finishWhenAvailable();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.addEventListener("load", () => void finishWhenAvailable(), {
      once: true,
    });
    script.addEventListener(
      "error",
      () => {
        if (settled) return;
        script.remove();
        window.__xoVlibrasScriptPromise = undefined;
        reject(new Error("Falha ao baixar o script oficial do VLibras."));
      },
      { once: true },
    );

    document.body.appendChild(script);
  }).catch((error) => {
    window.__xoVlibrasScriptPromise = undefined;
    throw error;
  });

  return window.__xoVlibrasScriptPromise;
}

async function initializeVlibras() {
  restoreVlibrasOfficialUi();
  if (isGameRouteNow()) return null;

  await loadOfficialVlibrasScript();

  if (isGameRouteNow()) {
    applyVlibrasVisibility();
    return null;
  }

  if (!window.__xoVlibrasWidgetInstance) {
    window.__xoVlibrasWidgetInstance = new window.VLibras!.Widget(BASE_URL);
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    restoreVlibrasOfficialUi();
    if (isGameRouteNow()) return null;

    const { button } = getVlibrasElements();
    if (button instanceof HTMLElement) return button;

    await wait(160);
  }

  throw new Error("O botão oficial do VLibras não foi criado.");
}

async function initializeVlibrasWithRetry() {
  if (isGameRouteNow()) {
    applyVlibrasVisibility();
    return null;
  }

  const delays = [0, 250, 750, 1500, 3000];
  let lastError: unknown = null;

  for (const delay of delays) {
    if (delay) await wait(delay);
    try {
      return await initializeVlibras();
    } catch (error) {
      lastError = error;
      console.warn("[VLibras] tentativa de inicialização falhou:", error);
    }
  }

  throw lastError ?? new Error("Não foi possível iniciar o VLibras.");
}

export default function VLibras() {
  const pathname = usePathname();
  const isGameRoute = pathname?.startsWith("/jogo") ?? false;
  const isGameRouteRef = useRef(isGameRoute);

  useEffect(() => {
    isGameRouteRef.current = isGameRoute;
    document.documentElement.classList.toggle(
      "xo-vlibras-route-hidden",
      isGameRoute,
    );
    document.body.classList.toggle("xo-vlibras-route-hidden", isGameRoute);
    applyVlibrasVisibility();

    if (!isGameRoute) {
      window.setTimeout(() => {
        void initializeVlibrasWithRetry().catch((error) => {
          console.error("[VLibras] falha na inicialização:", error);
        });
      }, 80);
    }
  }, [isGameRoute]);

  useEffect(() => {
    let disposed = false;
    let retryTimer = 0;

    const start = () => {
      if (disposed) return;
      applyVlibrasVisibility();
      if (isGameRouteNow()) return;

      void initializeVlibrasWithRetry().catch((error) => {
        console.error("[VLibras] falha na inicialização:", error);
      });
    };

    window.abrirVLibras = async () => {
      if (isGameRouteRef.current || window.location.pathname.startsWith("/jogo")) {
        return;
      }

      try {
        document.documentElement.classList.remove("xo-vlibras-route-hidden");
        document.body.classList.remove("xo-vlibras-route-hidden");
        const button = await initializeVlibrasWithRetry();
        restoreVlibrasOfficialUi();

        if (button instanceof HTMLElement) {
          button.focus({ preventScroll: true });
          button.click();
        }
      } catch (error) {
        console.error("[VLibras] falha ao abrir:", error);
        window.alert(
          "O VLibras não conseguiu carregar. Verifique a internet, bloqueadores de conteúdo e tente novamente.",
        );
      }
    };

    const scheduleStart = () => {
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(start, 220);
    };

    start();

    window.addEventListener("online", scheduleStart);
    window.addEventListener("pageshow", scheduleStart);
    window.addEventListener("resize", scheduleStart, { passive: true });
    window.addEventListener("orientationchange", scheduleStart, {
      passive: true,
    });
    document.addEventListener("visibilitychange", scheduleStart);

    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      window.removeEventListener("online", scheduleStart);
      window.removeEventListener("pageshow", scheduleStart);
      window.removeEventListener("resize", scheduleStart);
      window.removeEventListener("orientationchange", scheduleStart);
      document.removeEventListener("visibilitychange", scheduleStart);
    };
  }, []);

  return (
    <div
      id={ROOT_ID}
      data-route-hidden={isGameRoute ? "true" : "false"}
      {...{ vw: "true" }}
      className="enabled"
    >
      <div {...{ "vw-access-button": "true" }} className="active" />
      <div {...{ "vw-plugin-wrapper": "true" }}>
        <div className="vw-plugin-top-wrapper" />
      </div>
    </div>
  );
}
