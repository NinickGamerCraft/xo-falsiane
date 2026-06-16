"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
    vlibrasIniciado?: boolean;
    abrirVLibras?: () => void;
  }
}

export default function VLibras() {
  const [carregado, setCarregado] = useState(false);
  const retryRef = useRef<number | null>(null);

  function iniciarVLibras() {
    if (!window.VLibras?.Widget) return false;

    try {
      if (!window.vlibrasIniciado) {
        new window.VLibras.Widget("https://vlibras.gov.br/app");
        window.vlibrasIniciado = true;
      }
      return true;
    } catch (error) {
      console.warn("Falha ao iniciar o VLibras:", error);
      return false;
    }
  }

  function abrirWidget(tentativa = 0) {
    iniciarVLibras();

    const botao = document.querySelector<HTMLElement>("[vw-access-button]");
    if (botao) {
      botao.style.removeProperty("display");
      botao.style.removeProperty("visibility");
      botao.style.removeProperty("opacity");
      botao.style.removeProperty("pointer-events");

      requestAnimationFrame(() => {
        botao.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
        botao.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
        botao.click();
      });
      return;
    }

    if (tentativa < 24) {
      retryRef.current = window.setTimeout(
        () => abrirWidget(tentativa + 1),
        250,
      );
      return;
    }

    alert(
      "O VLibras ainda não terminou de carregar. Verifique a conexão e tente novamente.",
    );
  }

  useEffect(() => {
    window.abrirVLibras = () => abrirWidget();

    return () => {
      if (retryRef.current !== null) window.clearTimeout(retryRef.current);
      delete window.abrirVLibras;
      // Permite reinicializar ao voltar do Space News para a página principal.
      window.vlibrasIniciado = false;
    };
  }, []);

  return (
    <>
      <div
        id="xo-vlibras-root"
        {...{ vw: "true" }}
        className="enabled vlibras-container"
        data-ready={carregado ? "true" : "false"}
      >
        <div {...{ "vw-access-button": "true" }} className="active" />
        <div {...{ "vw-plugin-wrapper": "true" }}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>

      <Script
        id="vlibras-plugin"
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onLoad={() => {
          setCarregado(true);
          iniciarVLibras();
        }}
        onReady={() => {
          setCarregado(true);
          iniciarVLibras();
        }}
        onError={() => setCarregado(false)}
      />
    </>
  );
}
