"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    VLibras?: {
      Widget: new (url: string) => unknown;
    };
    abrirVLibras?: () => void;
  }
}

const VLibrAS_APP_URL = "https://vlibras.gov.br/app";
const VLibrAS_SCRIPT_URL = "https://vlibras.gov.br/app/vlibras-plugin.js";

export default function VLibras() {
  const iniciouRef = useRef(false);
  const abrirQuandoProntoRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  const procurarBotaoEabrir = useCallback((tentativa = 0) => {
    const botao = document.querySelector<HTMLElement>("[vw-access-button]");

    if (botao) {
      botao.click();
      abrirQuandoProntoRef.current = false;
      return;
    }

    if (tentativa >= 40) {
      abrirQuandoProntoRef.current = false;
      window.alert(
        "O VLibras não terminou de carregar. Verifique sua conexão ou bloqueadores de conteúdo e tente novamente.",
      );
      return;
    }

    timerRef.current = window.setTimeout(
      () => procurarBotaoEabrir(tentativa + 1),
      150,
    );
  }, []);

  const iniciarWidget = useCallback(() => {
    if (iniciouRef.current) return true;
    if (!window.VLibras?.Widget) return false;
    if (!document.querySelector("[vw]")) return false;

    try {
      new window.VLibras.Widget(VLibrAS_APP_URL);
      iniciouRef.current = true;

      if (abrirQuandoProntoRef.current) {
        procurarBotaoEabrir();
      }

      return true;
    } catch (error) {
      console.error("Falha ao iniciar o VLibras:", error);
      iniciouRef.current = false;
      return false;
    }
  }, [procurarBotaoEabrir]);

  const abrirWidget = useCallback(() => {
    abrirQuandoProntoRef.current = true;

    const botao = document.querySelector<HTMLElement>("[vw-access-button]");
    if (botao) {
      botao.click();
      abrirQuandoProntoRef.current = false;
      return;
    }

    iniciarWidget();
    procurarBotaoEabrir();
  }, [iniciarWidget, procurarBotaoEabrir]);

  useEffect(() => {
    window.abrirVLibras = abrirWidget;

    // Caso o script já esteja no cache quando a página montar.
    iniciarWidget();

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      if (window.abrirVLibras === abrirWidget) {
        delete window.abrirVLibras;
      }
    };
  }, [abrirWidget, iniciarWidget]);

  return (
    <>
      {/* Estrutura oficial do VLibras. Não estilizar nem esconder o botão. */}
      <div {...{ vw: "true" }} className="enabled">
        <div {...{ "vw-access-button": "true" }} className="active" />
        <div {...{ "vw-plugin-wrapper": "true" }}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>

      <Script
        id="vlibras-plugin"
        src={VLibrAS_SCRIPT_URL}
        strategy="afterInteractive"
        onLoad={() => {
  iniciarWidget();
}}
onReady={() => {
  iniciarWidget();
}}
        onError={() => {
          iniciouRef.current = false;
          console.error("Não foi possível baixar o script oficial do VLibras.");
        }}
      />
    </>
  );
}
