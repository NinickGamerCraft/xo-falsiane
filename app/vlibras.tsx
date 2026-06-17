"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
    abrirVLibras?: () => void;
    __xoVLibrasWidget?: unknown;
    __xoVLibrasBooting?: boolean;
  }
}

const SCRIPT_ID = "xo-vlibras-plugin-script";
const SCRIPT_SRC = "https://vlibras.gov.br/app/vlibras-plugin.js";
const APP_URL = "https://vlibras.gov.br/app";

function encontrarBotaoOficial() {
  return document.querySelector<HTMLElement>("[vw-access-button]");
}

function dispararCliqueCompleto(elemento: HTMLElement) {
  const opcoes: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    view: window,
  };

  try {
    elemento.dispatchEvent(new PointerEvent("pointerdown", opcoes));
    elemento.dispatchEvent(new MouseEvent("mousedown", opcoes));
    elemento.dispatchEvent(new PointerEvent("pointerup", opcoes));
    elemento.dispatchEvent(new MouseEvent("mouseup", opcoes));
  } catch {}

  HTMLElement.prototype.click.call(elemento);
}

export default function VLibras() {
  const [estado, setEstado] = useState<"carregando" | "pronto" | "erro">(
    "carregando",
  );
  const montadoRef = useRef(true);
  const tentativasWidgetRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const agendar = useCallback((funcao: () => void, atraso: number) => {
    const timer = window.setTimeout(funcao, atraso);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const marcarProntoQuandoExistir = useCallback(() => {
    const botao = encontrarBotaoOficial();
    const wrapper = document.querySelector("[vw-plugin-wrapper]");

    if (botao && wrapper) {
      if (montadoRef.current) setEstado("pronto");
      return true;
    }

    return false;
  }, []);

  const iniciarWidget = useCallback(() => {
    if (!window.VLibras?.Widget) return false;
    if (!document.getElementById("xo-vlibras-root")) return false;
    if (marcarProntoQuandoExistir()) return true;
    if (window.__xoVLibrasBooting) return false;

    window.__xoVLibrasBooting = true;
    tentativasWidgetRef.current += 1;

    try {
      window.__xoVLibrasWidget = new window.VLibras.Widget(APP_URL);
    } catch (erro) {
      console.warn("Não foi possível iniciar o VLibras:", erro);
    } finally {
      window.__xoVLibrasBooting = false;
    }

    return true;
  }, [marcarProntoQuandoExistir]);

  const garantirScript = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (window.VLibras?.Widget) {
        resolve();
        return;
      }

      const existente = document.getElementById(SCRIPT_ID) as
        | HTMLScriptElement
        | null;

      const aoCarregar = () => resolve();
      const aoFalhar = () => reject(new Error("Falha ao carregar o VLibras"));

      if (existente) {
        existente.addEventListener("load", aoCarregar, { once: true });
        existente.addEventListener("error", aoFalhar, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.addEventListener("load", aoCarregar, { once: true });
      script.addEventListener("error", aoFalhar, { once: true });
      document.body.appendChild(script);
    });
  }, []);

  const inicializar = useCallback(async () => {
    if (!montadoRef.current) return;
    setEstado("carregando");

    try {
      await garantirScript();
      iniciarWidget();

      let tentativa = 0;
      const verificar = () => {
        tentativa += 1;

        if (marcarProntoQuandoExistir()) return;

        if (tentativa === 12 && tentativasWidgetRef.current < 3) {
          // Algumas navegações do Next deixam uma instância global sem DOM.
          window.__xoVLibrasWidget = undefined;
          iniciarWidget();
        }

        if (tentativa < 45) {
          agendar(verificar, 220);
        } else if (montadoRef.current) {
          setEstado("erro");
        }
      };

      verificar();
    } catch {
      if (montadoRef.current) setEstado("erro");
    }
  }, [agendar, garantirScript, iniciarWidget, marcarProntoQuandoExistir]);

  const abrir = useCallback(async () => {
    if (!marcarProntoQuandoExistir()) {
      await inicializar();
    }

    let tentativa = 0;
    const tentarAbrir = () => {
      tentativa += 1;
      const botao = encontrarBotaoOficial();

      if (botao) {
        dispararCliqueCompleto(botao);
        if (montadoRef.current) setEstado("pronto");
        return;
      }

      if (tentativa < 35) {
        agendar(tentarAbrir, 220);
      } else {
        if (montadoRef.current) setEstado("erro");
        alert(
          "O VLibras não conseguiu abrir. Verifique sua conexão, desative bloqueadores de conteúdo e tente novamente.",
        );
      }
    };

    tentarAbrir();
  }, [agendar, inicializar, marcarProntoQuandoExistir]);

  useEffect(() => {
    montadoRef.current = true;
    window.abrirVLibras = abrir;

    const observador = new MutationObserver(() => {
      marcarProntoQuandoExistir();
    });
    observador.observe(document.body, { childList: true, subtree: true });

    inicializar();

    const aoVoltar = () => inicializar();
    const aoReconectar = () => inicializar();
    window.addEventListener("pageshow", aoVoltar);
    window.addEventListener("online", aoReconectar);

    return () => {
      montadoRef.current = false;
      observador.disconnect();
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current = [];
      if (window.abrirVLibras === abrir) delete window.abrirVLibras;
      window.removeEventListener("pageshow", aoVoltar);
      window.removeEventListener("online", aoReconectar);
    };
  }, [abrir, inicializar, marcarProntoQuandoExistir]);

  return (
    <>
      <div
        id="xo-vlibras-root"
        {...{ vw: "true" }}
        className="enabled vlibras-container"
        aria-label="Tradutor de Português para Libras"
      >
        <div {...{ "vw-access-button": "true" }} className="active" />
        <div {...{ "vw-plugin-wrapper": "true" }}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>

      <button
        type="button"
        className={`xo-vlibras-launcher is-${estado}`}
        onClick={abrir}
        aria-label="Abrir tradução com VLibras"
      >
        <span className="xo-vlibras-launcher-icon" aria-hidden="true">
          🤟
        </span>
        <span>
          <strong>VLibras</strong>
          <small>
            {estado === "pronto"
              ? "Disponível"
              : estado === "erro"
                ? "Tentar novamente"
                : "Carregando..."}
          </small>
        </span>
      </button>
    </>
  );
}
