import Script from "next/script";

const loaderCode = String.raw`
(() => {
  const ROOT_ID = "xo-vlibras-root";
  const SCRIPT_ID = "xo-vlibras-script";
  const SCRIPT_URL = "https://vlibras.gov.br/app/vlibras-plugin.js";
  const BASE_URL = "https://vlibras.gov.br/app";

  const wait = (ms) =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

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

  function restoreVisibility() {
    const { root, button, wrapper } = getElements();

    [root, button, wrapper].forEach((element) => {
      if (!(element instanceof HTMLElement)) return;

      element.style.removeProperty("display");
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
      button.setAttribute("aria-label", "Abrir tradutor VLibras");
      button.setAttribute("title", "Abrir VLibras");
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
        for (let attempt = 0; attempt < 50; attempt += 1) {
          if (window.VLibras?.Widget) {
            resolve();
            return;
          }

          await wait(200);
        }

        reject(
          new Error("A API oficial do VLibras não ficou disponível."),
        );
      };

      if (script) {
        if (window.VLibras?.Widget) {
          resolve();
          return;
        }

        script.addEventListener(
          "load",
          () => {
            void finishWhenAvailable();
          },
          { once: true },
        );

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

      script.addEventListener(
        "load",
        () => {
          void finishWhenAvailable();
        },
        { once: true },
      );

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

    await loadOfficialScript();

    if (!window.__xoVlibrasWidgetInstance) {
      window.__xoVlibrasWidgetInstance =
        new window.VLibras.Widget(BASE_URL);
    }

    for (let attempt = 0; attempt < 30; attempt += 1) {
      restoreVisibility();

      const { button } = getElements();

      if (button instanceof HTMLElement) {
        return button;
      }

      await wait(200);
    }

    throw new Error("O botão oficial do VLibras não foi criado.");
  }

  async function initializeWithRetry() {
    const delays = [0, 400, 1200, 3000, 6000];
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
      const button = await initializeWithRetry();
      restoreVisibility();

      button.focus({ preventScroll: true });
      button.click();
    } catch (error) {
      console.error("[VLibras] falha ao abrir:", error);
      window.alert(
        "O VLibras não conseguiu carregar. Verifique a internet, desative bloqueadores de conteúdo e tente novamente.",
      );
    }
  };

  const start = () => {
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
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") start();
  });
})();
`;

export default function VLibras() {
  return (
    <>
      <div id="xo-vlibras-root" {...{ vw: "true" }} className="enabled">
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
