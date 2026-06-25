"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";

const loaderCode = String.raw`
(() => {
  const ROOT_ID = "xo-vlibras-root";
  const SCRIPT_ID = "xo-vlibras-script";
  const SCRIPT_URL = "https://vlibras.gov.br/app/vlibras-plugin.js";
  const BASE_URL = "https://vlibras.gov.br/app";

  const wait = (ms) =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

  function isGameRoute() {
    return (
      window.location.pathname.startsWith("/jogo") ||
      document.body.classList.contains("game-page-active") ||
      document.documentElement.classList.contains("xo-vlibras-route-hidden")
    );
  }

  function getElements() {
    const root = document.getElementById(ROOT_ID);
    const button =
      root?.querySelector("[vw-access-button]") ??
      document.querySelector("[vw-access-button]");
    const wrapper =
      root?.querySelector("[vw-plugin-wrapper]") ??
      document.querySelector("[vw-plugin-wrapper]");

    return { root, button, wrapper };
  }

  function applyRouteVisibility() {
    const { root } = getElements();
    if (!(root instanceof HTMLElement)) return false;

    const hidden = isGameRoute();
    root.dataset.routeHidden = hidden ? "true" : "false";

    if (hidden) {
      root.style.setProperty("display", "none", "important");
    } else {
      root.style.removeProperty("display");
    }

    return hidden;
  }

  function restoreVisibility() {
    const hidden = applyRouteVisibility();
    if (hidden) return;

    const { root, button, wrapper } = getElements();

    [root, button, wrapper].forEach((element) => {
      if (!(element instanceof HTMLElement)) return;

      element.style.removeProperty("visibility");
      element.style.removeProperty("opacity");
      element.style.removeProperty("pointer-events");
      element.removeAttribute("aria-hidden");
    });

    if (root instanceof HTMLElement) {
      root.style.setProperty("z-index", "2147483600");
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
      wrapper.style.setProperty("z-index", "2147483640");
    }
  }

  function loadOfficialScript() {
    if (window.VLibras?.Widget) return Promise.resolve();

    if (window.__xoVlibrasScriptPromise) {
      return window.__xoVlibrasScriptPromise;
    }

    window.__xoVlibrasScriptPromise = new Promise((resolve, reject) => {
      let script =
        document.getElementById(SCRIPT_ID) ||
        document.querySelector('script[src*="vlibras-plugin.js"]');

      const finishWhenAvailable = async () => {
        for (let attempt = 0; attempt < 60; attempt += 1) {
          if (window.VLibras?.Widget) {
            resolve();
            return;
          }

          await wait(200);
        }

        reject(new Error("A API oficial do VLibras não ficou disponível."));
      };

      if (script) {
        if (window.VLibras?.Widget) {
          resolve();
          return;
        }

        script.addEventListener("load", () => void finishWhenAvailable(), {
          once: true,
        });

        script.addEventListener(
          "error",
          () => {
            script.remove();
            window.__xoVlibrasScriptPromise = undefined;
            reject(new Error("Falha ao carregar o script do VLibras."));
          },
          { once: true },
        );

        void finishWhenAvailable();
        return;
      }

      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.crossOrigin = "anonymous";

      script.addEventListener("load", () => void finishWhenAvailable(), {
        once: true,
      });

      script.addEventListener(
        "error",
        () => {
          script.remove();
          window.__xoVlibrasScriptPromise = undefined;
          reject(new Error("Falha ao baixar o script do VLibras."));
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

  async function initialize() {
    restoreVisibility();
    if (isGameRoute()) return null;

    await loadOfficialScript();

    if (isGameRoute()) {
      applyRouteVisibility();
      return null;
    }

    if (!window.__xoVlibrasWidgetInstance) {
      window.__xoVlibrasWidgetInstance = new window.VLibras.Widget(BASE_URL);
    }

    for (let attempt = 0; attempt < 40; attempt += 1) {
      restoreVisibility();
      if (isGameRoute()) return null;

      const { button } = getElements();

      if (button instanceof HTMLElement) {
        return button;
      }

      await wait(200);
    }

    throw new Error("O botão oficial do VLibras não foi criado.");
  }

  async function initializeWithRetry() {
    if (isGameRoute()) {
      applyRouteVisibility();
      return null;
    }

    const delays = [0, 350, 900, 1800, 3600];
    let lastError = null;

    for (const delay of delays) {
      if (delay) await wait(delay);

      try {
        return await initialize();
      } catch (error) {
        lastError = error;
        console.warn("[VLibras] tentativa de inicialização falhou:", error);
      }
    }

    throw lastError ?? new Error("Não foi possível iniciar o VLibras.");
  }

  window.abrirVLibras = async () => {
    try {
      document.documentElement.classList.remove("xo-vlibras-route-hidden");
      document.body.classList.remove("xo-vlibras-route-hidden");
      const button = await initializeWithRetry();
      restoreVisibility();

      if (button instanceof HTMLElement) {
        button.focus({ preventScroll: true });
        button.click();
      }
    } catch (error) {
      console.error("[VLibras] falha ao abrir:", error);
      window.alert(
        "O VLibras não conseguiu carregar. Verifique a internet, desative bloqueadores de conteúdo e tente novamente.",
      );
    }
  };

  const start = () => {
    applyRouteVisibility();
    if (isGameRoute()) return;

    void initializeWithRetry().catch((error) => {
      console.error("[VLibras] falha na inicialização:", error);
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.addEventListener("online", start);
  window.addEventListener("pageshow", start);
  window.addEventListener("resize", () => void start());
  window.addEventListener("orientationchange", () => window.setTimeout(start, 250));
  window.addEventListener("xo:vlibras-route-show", start);
  window.addEventListener("xo:vlibras-route-hide", applyRouteVisibility);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") start();
  });
})();
`;

export default function VLibras() {
  const pathname = usePathname();
  const isGameRoute = pathname?.startsWith("/jogo") ?? false;

  useEffect(() => {
    document.documentElement.classList.toggle(
      "xo-vlibras-route-hidden",
      isGameRoute,
    );
    document.body.classList.toggle("xo-vlibras-route-hidden", isGameRoute);
    window.dispatchEvent(
      new Event(isGameRoute ? "xo:vlibras-route-hide" : "xo:vlibras-route-show"),
    );

    return () => {
      document.documentElement.classList.remove("xo-vlibras-route-hidden");
      document.body.classList.remove("xo-vlibras-route-hidden");
    };
  }, [isGameRoute]);

  return (
    <>
      <div
        id="xo-vlibras-root"
        data-route-hidden={isGameRoute ? "true" : "false"}
        {...{ vw: "true" }}
        className="enabled"
      >
        <div {...{ "vw-access-button": "true" }} className="active" />
        <div {...{ "vw-plugin-wrapper": "true" }}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>

      <Script id="xo-vlibras-loader" strategy="afterInteractive">
        {loaderCode}
      </Script>
    </>
  );
}
