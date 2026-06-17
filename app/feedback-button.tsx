"use client";

import { useMemo, useState } from "react";

type FeedbackButtonProps = {
  contexto: "Xô, falsiane!" | "Space News";
  compacto?: boolean;
};

const FEEDBACK_EMAIL = "verifique.ai@gmail.com";

export default function FeedbackButton({
  contexto,
  compacto = false,
}: FeedbackButtonProps) {
  const [aberto, setAberto] = useState(false);
  const [categoria, setCategoria] = useState("Bug");
  const [mensagem, setMensagem] = useState("");
  const [copiado, setCopiado] = useState(false);

  const relatorio = useMemo(() => {
    if (typeof window === "undefined") return "";
    return [
      `Projeto: ${contexto}`,
      `Categoria: ${categoria}`,
      `Página: ${window.location.href}`,
      `Online: ${navigator.onLine ? "sim" : "não"}`,
      `Navegador: ${navigator.userAgent}`,
      "",
      mensagem.trim() || "Descreva aqui o que aconteceu.",
    ].join("\n");
  }, [categoria, contexto, mensagem]);

  function abrirEmail() {
    const assunto = encodeURIComponent(`[Feedback] ${contexto} — ${categoria}`);
    const corpo = encodeURIComponent(relatorio);
    window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${assunto}&body=${corpo}`;
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(relatorio);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`xo-feedback-fab ${compacto ? "is-game" : ""}`}
        onClick={() => setAberto(true)}
        aria-label={`Enviar feedback sobre ${contexto}`}
      >
        <span aria-hidden="true">✦</span>
        <strong>Feedback</strong>
      </button>

      {aberto && (
        <div
          className="xo-feedback-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAberto(false);
          }}
        >
          <section
            className={`xo-feedback-modal ${compacto ? "is-game" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
          >
            <button
              type="button"
              className="xo-feedback-close"
              onClick={() => setAberto(false)}
              aria-label="Fechar feedback"
            >
              ×
            </button>

            <p className="xo-feedback-kicker">CANAL DE MELHORIAS</p>
            <h2 id="feedback-title">Conte o que aconteceu</h2>
            <p>
              Envie um bug, sugestão ou comentário sobre <strong>{contexto}</strong>.
            </p>

            <label>
              Categoria
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
              >
                <option>Bug</option>
                <option>Sugestão</option>
                <option>Acessibilidade</option>
                <option>Desempenho</option>
                <option>Outro</option>
              </select>
            </label>

            <label>
              Mensagem
              <textarea
                value={mensagem}
                onChange={(event) => setMensagem(event.target.value)}
                placeholder="Explique o que você fez, o que esperava e o que aconteceu."
                maxLength={1600}
              />
            </label>

            <div className="xo-feedback-actions">
              <button type="button" onClick={abrirEmail} disabled={!mensagem.trim()}>
                Abrir e-mail
              </button>
              <button type="button" onClick={copiar}>
                {copiado ? "Copiado!" : "Copiar relatório"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
