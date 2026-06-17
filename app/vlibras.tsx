"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
    abrirVLibras?: () => void;
  }
}

const VLibrAS_SCRIPT = "https://vlibras.gov.br/app/vlibras-plugin.js";
const VLibrAS_APP = "https://vlibras.gov.br/app";

export default function VLibras() {
  const [status, setStatus] = useState<"carregando" | "pronto" | "erro">(
    "carregando",
  );
  const widgetRef = useRef<unknown>(null);
  const inicializandoRef = useRef(false);
  const iniciadoEmRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const agendar = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const limparTimers = useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }, []);

  const iniciarVLibras = useCallback(() => {
    if (widgetRef.current) return true;
    if (inicializandoRef.current) return false;
    if (!window.VLibras?.Widget) return false;
    if (!document.getElementById("xo-vlibras-root")) return false;

    inicializandoRef.current = true;

    try {
      widgetRef.current = new window.VLibras.Widget(VLibrAS_APP);
      iniciadoEmRef.current = Date.now();
      setStatus("carregando");

      agendar(() => {
        if (document.querySelector("[vw-access-button]")) {
          setStatus("pronto");
        }
      }, 900);

      return true;
    } catch (error) {
      console.warn("Falha ao iniciar o VLibras:", error);
      setStatus("erro");
      return false;
    } finally {
      inicializandoRef.current = false;
    }
  }, [agendar]);

  const garantirInicializacao = useCallback(() => {
    if (iniciarVLibras()) return;

    let tentativa = 0;
    const tentar = () => {
      tentativa += 1;
      if (iniciarVLibras()) return;

      if (tentativa < 40) {
        agendar(tentar, 250);
      } else {
        setStatus("erro");
      }
    };

    agendar(tentar, 100);
  }, [agendar, iniciarVLibras]);

  const abrirVLibras = useCallback(() => {
    garantirInicializacao();

    let tentativa = 0;
    const tentarAbrir = () => {
      tentativa += 1;

      if (!widgetRef.current) {
        iniciarVLibras();
        if (tentativa < 40) {
          agendar(tentarAbrir, 250);
          return;
        }
      }

      const tempoDesdeInicio = Date.now() - iniciadoEmRef.current;
      if (tempoDesdeInicio < 750 && tentativa < 40) {
        agendar(tentarAbrir, 180);
        return;
      }

      const botao = document.querySelector<HTMLElement>("[vw-access-button]");
      if (botao) {
        botao.click();
        botao.focus({ preventScroll: true });
        setStatus("pronto");
        return;
      }

      if (tentativa < 40) {
        agendar(tentarAbrir, 250);
        return;
      }

      setStatus("erro");
      alert(
        "O VLibras não terminou de carregar. Confira a internet e tente novamente em alguns segundos.",
      );
    };

    agendar(tentarAbrir, 80);
  }, [agendar, garantirInicializacao, iniciarVLibras]);

  useEffect(() => {
    window.abrirVLibras = abrirVLibras;
    garantirInicializacao();

    const aoMostrarPagina = () => garantirInicializacao();
    const aoFicarVisivel = () => {
      if (document.visibilityState === "visible") garantirInicializacao();
    };

    window.addEventListener("pageshow", aoMostrarPagina);
    document.addEventListener("visibilitychange", aoFicarVisivel);

    return () => {
      limparTimers();
      widgetRef.current = null;
      if (window.abrirVLibras === abrirVLibras) delete window.abrirVLibras;
      window.removeEventListener("pageshow", aoMostrarPagina);
      document.removeEventListener("visibilitychange", aoFicarVisivel);
    };
  }, [abrirVLibras, garantirInicializacao, limparTimers]);

  return (
    <>
      <div
        id="xo-vlibras-root"
        {...{ vw: "true" }}
        className="enabled vlibras-container"
        data-status={status}
        aria-label="Acessibilidade em Libras"
      >
        <div {...{ "vw-access-button": "true" }} className="active" />
        <div {...{ "vw-plugin-wrapper": "true" }}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>

      <Script
        id="vlibras-plugin-script"
        src={VLibrAS_SCRIPT}
        strategy="afterInteractive"
        onLoad={garantirInicializacao}
        onReady={garantirInicializacao}
        onError={() => setStatus("erro")}
      />
    </>
  );
}
