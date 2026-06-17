"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
    abrirVLibras?: () => void;
    __xoVlibrasInitialized?: boolean;
  }
}

const VLIBRAS_APP_URL = "https://vlibras.gov.br/app";
const VLIBRAS_SCRIPT_URL = "https://vlibras.gov.br/app/vlibras-plugin.js";
const ROOT_ID = "xo-vlibras-root";
const SCRIPT_ID = "xo-vlibras-script";

function criarEstruturaOficial(): HTMLDivElement {
  const existente = document.getElementById(ROOT_ID) as HTMLDivElement | null;

  if (existente) {
    existente.style.removeProperty("display");
    return existente;
  }

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("vw", "");
  root.className = "enabled";

  const accessButton = document.createElement("div");
  accessButton.setAttribute("vw-access-button", "");
  accessButton.className = "active";

  const pluginWrapper = document.createElement("div");
  pluginWrapper.setAttribute("vw-plugin-wrapper", "");

  const topWrapper = document.createElement("div");
  topWrapper.className = "vw-plugin-top-wrapper";

  pluginWrapper.appendChild(topWrapper);
  root.appendChild(accessButton);
  root.appendChild(pluginWrapper);
  document.body.appendChild(root);

  return root;
}

export default function VLibras() {
  useEffect(() => {
    let cancelado = false;
    let initTimer: number | null = null;
    let openTimer: number | null = null;

    const garantirEstrutura = () => {
      const root = criarEstruturaOficial();
      root.style.removeProperty("display");
      return root;
    };

    const iniciarWidget = () => {
      if (cancelado) return false;

      const root = garantirEstrutura();

      if (window.__xoVlibrasInitialized) {
        return true;
      }

      if (!window.VLibras?.Widget) {
        return false;
      }

      try {
        new window.VLibras.Widget(VLIBRAS_APP_URL);
        window.__xoVlibrasInitialized = true;
        root.style.removeProperty("display");
        return true;
      } catch (error) {
        console.error("Falha ao iniciar o VLibras:", error);
        window.__xoVlibrasInitialized = false;
        return false;
      }
    };

    const tentarInicializar = (tentativa = 0) => {
      if (cancelado || iniciarWidget() || tentativa >= 60) return;

      initTimer = window.setTimeout(() => {
        tentarInicializar(tentativa + 1);
      }, 250);
    };

    const tentarAbrir = (tentativa = 0) => {
      if (cancelado) return;

      iniciarWidget();

      const botao = document.querySelector<HTMLElement>("[vw-access-button]");

      if (botao && window.__xoVlibrasInitialized) {
        botao.click();
        return;
      }

      if (tentativa >= 20) {
        window.alert(
          "O VLibras ainda não terminou de carregar. Verifique sua conexão e tente novamente em alguns segundos.",
        );
        return;
      }

      openTimer = window.setTimeout(() => {
        tentarAbrir(tentativa + 1);
      }, 250);
    };

    garantirEstrutura();

    const scriptExistente = document.getElementById(
      SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (window.VLibras?.Widget) {
      tentarInicializar();
    } else if (scriptExistente) {
      scriptExistente.addEventListener("load", () => tentarInicializar(), {
        once: true,
      });
      tentarInicializar();
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = VLIBRAS_SCRIPT_URL;
      script.async = true;
      script.onload = () => tentarInicializar();
      script.onerror = () => {
        console.error("Não foi possível carregar o script oficial do VLibras.");
      };
      document.body.appendChild(script);
    }

    window.abrirVLibras = () => tentarAbrir();

    const aoReconectar = () => tentarInicializar();
    window.addEventListener("online", aoReconectar);

    return () => {
      cancelado = true;

      if (initTimer !== null) window.clearTimeout(initTimer);
      if (openTimer !== null) window.clearTimeout(openTimer);

      window.removeEventListener("online", aoReconectar);
      delete window.abrirVLibras;

      const root = document.getElementById(ROOT_ID);
      if (root) root.style.display = "none";
    };
  }, []);

  // Nada é renderizado pelo React. O widget oficial é inserido no body
  // somente após a hidratação, evitando divergência servidor/cliente.
  return null;
}
