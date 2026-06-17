"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (baseUrl: string) => unknown;
    };
    abrirVLibras?: () => void;
    __xoVlibrasInstance?: unknown;
    __xoVlibrasScriptPromise?: Promise<void>;
    __xoVlibrasInitPromise?: Promise<void>;
  }
}

const VLIBRAS_BASE_URL = "https://vlibras.gov.br/app";
const VLIBRAS_SCRIPT_URL =
  "https://vlibras.gov.br/app/vlibras-plugin.js";
const ROOT_ID = "xo-vlibras-root";
const SCRIPT_ID = "xo-vlibras-script";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function showElement(element: HTMLElement) {
  element.style.removeProperty("display");
  element.style.removeProperty("visibility");
  element.style.removeProperty("opacity");
  element.style.removeProperty("pointer-events");
  element.removeAttribute("aria-hidden");
}

function ensureOfficialMarkup() {
  let root =
    document.getElementById(ROOT_ID) ||
    document.querySelector<HTMLElement>("[vw]");

  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    root.setAttribute("vw", "");
    root.className = "enabled";
    root.dataset.xoVlibrasManaged = "true";
    document.body.appendChild(root);
  } else {
    root.id = ROOT_ID;
    root.setAttribute("vw", "");
    root.classList.add("enabled");
  }

  let accessButton =
    root.querySelector<HTMLElement>("[vw-access-button]");

  if (!accessButton) {
    accessButton = document.createElement("div");
    accessButton.setAttribute("vw-access-button", "");
    accessButton.className = "active";
    root.appendChild(accessButton);
  } else {
    accessButton.classList.add("active");
  }

  let pluginWrapper =
    root.querySelector<HTMLElement>("[vw-plugin-wrapper]");

  if (!pluginWrapper) {
    pluginWrapper = document.createElement("div");
    pluginWrapper.setAttribute("vw-plugin-wrapper", "");
    root.appendChild(pluginWrapper);
  }

  let topWrapper =
    pluginWrapper.querySelector<HTMLElement>(
      ".vw-plugin-top-wrapper",
    );

  if (!topWrapper) {
    topWrapper = document.createElement("div");
    topWrapper.className = "vw-plugin-top-wrapper";
    pluginWrapper.appendChild(topWrapper);
  }

  showElement(root);
  showElement(accessButton);
  showElement(pluginWrapper);

  accessButton.setAttribute(
    "aria-label",
    "Abrir tradutor VLibras",
  );
  accessButton.setAttribute("title", "Abrir VLibras");

  return {
    root,
    accessButton,
    pluginWrapper,
  };
}

function loadVlibrasScriptOnce(): Promise<void> {
  if (window.VLibras?.Widget) {
    return Promise.resolve();
  }

  if (window.__xoVlibrasScriptPromise) {
    return window.__xoVlibrasScriptPromise;
  }

  window.__xoVlibrasScriptPromise = new Promise<void>(
    (resolve, reject) => {
      let settled = false;
      let script =
        document.getElementById(SCRIPT_ID) as
          | HTMLScriptElement
          | null;

      if (!script) {
        script = document.querySelector<HTMLScriptElement>(
          'script[src*="vlibras-plugin.js"]',
        );
      }

      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        callback();
      };

      const handleLoad = () => {
        if (script) script.dataset.xoVlibrasState = "loaded";
        finish(resolve);
      };

      const handleError = () => {
        if (script) {
          script.dataset.xoVlibrasState = "error";
          script.remove();
        }

        finish(() => {
          reject(
            new Error(
              "Não foi possível carregar o script oficial do VLibras.",
            ),
          );
        });
      };

      const timeoutId = window.setTimeout(() => {
        if (window.VLibras?.Widget) {
          finish(resolve);
          return;
        }

        if (script) script.remove();

        finish(() => {
          reject(
            new Error(
              "O carregamento do script do VLibras excedeu o tempo limite.",
            ),
          );
        });
      }, 15_000);

      if (script) {
        script.id = SCRIPT_ID;

        if (
          window.VLibras?.Widget ||
          script.dataset.xoVlibrasState === "loaded"
        ) {
          finish(resolve);
          return;
        }

        script.addEventListener("load", handleLoad, {
          once: true,
        });
        script.addEventListener("error", handleError, {
          once: true,
        });
        return;
      }

      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = VLIBRAS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.dataset.xoVlibrasState = "loading";
      script.addEventListener("load", handleLoad, {
        once: true,
      });
      script.addEventListener("error", handleError, {
        once: true,
      });

      document.body.appendChild(script);
    },
  ).catch((error) => {
    window.__xoVlibrasScriptPromise = undefined;
    throw error;
  });

  return window.__xoVlibrasScriptPromise;
}

async function waitForWidgetConstructor(
  timeoutMs = 10_000,
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (window.VLibras?.Widget) return;
    await wait(200);
  }

  throw new Error(
    "A API window.VLibras.Widget não ficou disponível.",
  );
}

async function initVlibrasOnce() {
  if (window.__xoVlibrasInstance) {
    ensureOfficialMarkup();
    return;
  }

  if (window.__xoVlibrasInitPromise) {
    return window.__xoVlibrasInitPromise;
  }

  window.__xoVlibrasInitPromise = (async () => {
    ensureOfficialMarkup();

    await loadVlibrasScriptOnce();
    await waitForWidgetConstructor();

    if (!window.__xoVlibrasInstance) {
      window.__xoVlibrasInstance =
        new window.VLibras!.Widget(VLIBRAS_BASE_URL);
    }

    ensureOfficialMarkup();
  })().finally(() => {
    window.__xoVlibrasInitPromise = undefined;
  });

  return window.__xoVlibrasInitPromise;
}

async function initWithRetry() {
  const delays = [0, 300, 1_000, 2_500, 5_000];

  let lastError: unknown = null;

  for (const delay of delays) {
    if (delay > 0) await wait(delay);

    try {
      await initVlibrasOnce();
      return;
    } catch (error) {
      lastError = error;
      console.warn("[VLibras] tentativa falhou:", error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha desconhecida ao iniciar o VLibras.");
}

async function openVlibras() {
  await initWithRetry();

  const { accessButton } = ensureOfficialMarkup();

  accessButton.focus({ preventScroll: true });
  accessButton.click();
}

export default function VLibras() {
  const pathname = usePathname();
  const isGameRoute = pathname.startsWith("/jogo");

  useEffect(() => {
    const root = document.getElementById(ROOT_ID);

    if (isGameRoute) {
      root?.style.setProperty("display", "none", "important");
      root?.setAttribute("aria-hidden", "true");
      return;
    }

    if (root) showElement(root);
  }, [isGameRoute]);

  useEffect(() => {
    if (isGameRoute) {
      return;
    }

    let cancelled = false;

    const start = async () => {
      if (cancelled) return;

      try {
        await initWithRetry();
      } catch (error) {
        console.error(
          "[VLibras] não foi possível inicializar:",
          error,
        );
      }
    };

    window.abrirVLibras = () => {
      void openVlibras().catch((error) => {
        console.error("[VLibras] falha ao abrir:", error);
        window.alert(
          "O VLibras não conseguiu carregar agora. Verifique a conexão, desative bloqueadores de conteúdo e tente novamente.",
        );
      });
    };

    const handleOnline = () => {
      void start();
    };

    const handlePageShow = () => {
      void start();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void start();
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          void start();
        },
        { once: true },
      );
    } else {
      void start();
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener(
      "visibilitychange",
      handleVisibility,
    );

    return () => {
      cancelled = true;

      window.removeEventListener("online", handleOnline);
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );

      // Não remover DOM, script ou instância global.
    };
  }, [isGameRoute]);

  return null;
}
