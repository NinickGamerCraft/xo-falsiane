"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
    abrirVLibras?: () => void;
    vlibrasIniciado?: boolean;
  }
}

const VLibrAS_SCRIPT = "https://vlibras.gov.br/app/vlibras-plugin.js";
const VLibrAS_APP = "https://vlibras.gov.br/app";

export default function VLibras() {
  const [status, setStatus] = useState<"carregando" | "pronto" | "erro">(
    "carregando",
  );
  const intervaloRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const inicializandoRef = useRef(false);
  const ultimaInicializacaoRef = useRef(0);

  const limparTentativas = useCallback(() => {
    if (intervaloRef.current !== null) {
      window.clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const iniciarVLibras = useCallback(() => {
    const raiz = document.getElementById("xo-vlibras-root");
    if (!raiz || !window.VLibras?.Widget) return false;

    const pluginJaMontado = Boolean(
      raiz.querySelector("[vw-plugin-wrapper] > *:not(.vw-plugin-top-wrapper), .vpw-container"),
    );

    if (pluginJaMontado) {
      window.vlibrasIniciado = true;
      raiz.dataset.vlibrasReady = "true";
      setStatus("pronto");
      return true;
    }

    const aguardandoMontagem =
      window.vlibrasIniciado &&
      Date.now() - ultimaInicializacaoRef.current < 5_000;
    if (aguardandoMontagem || inicializandoRef.current) return false;

    // Ao voltar de /jogo para /, o script continua na memória, mas o DOM do
    // widget anterior pode ter sido desmontado. Nesse caso, inicializamos de novo.
    window.vlibrasIniciado = false;
    inicializandoRef.current = true;

    try {
      ultimaInicializacaoRef.current = Date.now();
      new window.VLibras.Widget(VLibrAS_APP);
      window.vlibrasIniciado = true;
      setStatus("carregando");
      return false;
    } catch (error) {
      console.warn("Falha ao iniciar o VLibras:", error);
      setStatus("erro");
      return false;
    } finally {
      inicializandoRef.current = false;
    }
  }, []);

  const garantirInicializacao = useCallback(() => {
    limparTentativas();
    setStatus("carregando");

    if (iniciarVLibras()) return;

    intervaloRef.current = window.setInterval(() => {
      if (iniciarVLibras()) limparTentativas();
    }, 250);

    timeoutRef.current = window.setTimeout(() => {
      limparTentativas();
      if (!iniciarVLibras()) setStatus("erro");
    }, 15_000);
  }, [iniciarVLibras, limparTentativas]);

  const abrirVLibras = useCallback(() => {
    garantirInicializacao();

    let tentativas = 0;
    const tentarAbrir = () => {
      iniciarVLibras();
      const raiz = document.getElementById("xo-vlibras-root");
      const botao = raiz?.querySelector<HTMLElement>("[vw-access-button]");

      if (botao && raiz?.dataset.vlibrasReady === "true") {
        botao.click();
        botao.focus({ preventScroll: true });
        setStatus("pronto");
        return;
      }

      tentativas += 1;
      if (tentativas < 40) {
        window.setTimeout(tentarAbrir, 250);
        return;
      }

      setStatus("erro");
      alert(
        "O VLibras ainda não terminou de carregar. Verifique a conexão e tente novamente em alguns segundos.",
      );
    };

    window.setTimeout(tentarAbrir, 100);
  }, [garantirInicializacao, iniciarVLibras]);

  useEffect(() => {
    window.abrirVLibras = abrirVLibras;
    garantirInicializacao();

    const aoVoltarParaPagina = () => garantirInicializacao();
    const aoFicarVisivel = () => {
      if (document.visibilityState === "visible") garantirInicializacao();
    };

    window.addEventListener("pageshow", aoVoltarParaPagina);
    document.addEventListener("visibilitychange", aoFicarVisivel);

    return () => {
      limparTentativas();
      if (window.abrirVLibras === abrirVLibras) delete window.abrirVLibras;
      window.removeEventListener("pageshow", aoVoltarParaPagina);
      document.removeEventListener("visibilitychange", aoFicarVisivel);
    };
  }, [abrirVLibras, garantirInicializacao, limparTentativas]);

  return (
    <>
      <div
        id="xo-vlibras-root"
        {...{ vw: "true" }}
        className="enabled"
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
