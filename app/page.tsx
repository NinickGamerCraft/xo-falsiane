"use client";

import { useState } from "react";

export default function Home() {
  const [modo, setModo] = useState("pergunta");
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function analisar() {
    if (!texto.trim()) {
      setResultado("⚠️ Opa! Escreva algo antes de analisar.");
      return;
    }

    setCarregando(true);
    setResultado("🔎 Analisando... aguarde um instante.");

    try {
      const resposta = await fetch("/api/analisar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ texto, modo }),
      });

      const dados = await resposta.json();
      setResultado(dados.resposta);
    } catch {
      setResultado("❌ Opa! Algo deu errado na análise. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function limpar() {
    setTexto("");
    setResultado("");
  }

  async function copiarResultado() {
    if (!resultado) return;
    await navigator.clipboard.writeText(resultado);
  }

  const tituloModo =
    modo === "pergunta"
      ? "❓ Pergunta direta"
      : modo === "noticia"
      ? "📰 Notícia escrita"
      : "🔗 Link da notícia";

  const dicaModo =
    modo === "pergunta"
      ? "Faça uma pergunta objetiva sobre uma informação que você quer verificar."
      : modo === "noticia"
      ? "Cole o texto completo ou trecho da notícia para análise."
      : "Cole o link de uma matéria ou portal de notícias.";

  return (
    <main className="checker-bg min-h-screen text-white flex flex-col items-center px-6 py-10">
      <section className="glass-panel w-full max-w-5xl rounded-3xl p-6 md:p-10">
        <header className="text-center mb-10">
          <p className="text-blue-400 font-semibold mb-2">
            NonFakeable apresenta
          </p>

          <h1 className="text-5xl md:text-6xl font-black mb-4">
            Xô, falsiane!
          </h1>

          <p className="text-zinc-400 max-w-2xl mx-auto">
            Verifique perguntas, notícias escritas e links suspeitos com ajuda de IA.
          </p>
        </header>

        <div className="flex gap-4 mb-8 flex-wrap justify-center">
          <button
            onClick={() => {
              setModo("pergunta");
              setResultado("");
            }}
            className={`px-4 py-2 rounded-xl transition ${
              modo === "pergunta"
                ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            ❓ Pergunta Direta
          </button>

          <button
            onClick={() => {
              setModo("noticia");
              setResultado("");
            }}
            className={`px-4 py-2 rounded-xl transition ${
              modo === "noticia"
                ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            📰 Notícia Escrita
          </button>

          <button
            onClick={() => {
              setModo("link");
              setResultado("");
            }}
            className={`px-4 py-2 rounded-xl transition ${
              modo === "link"
                ? "bg-blue-600 shadow-lg shadow-blue-600/30"
                : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            🔗 Link da Notícia
          </button>
        </div>

        <section className="bg-black/40 border border-zinc-800 rounded-2xl p-5">
          <div className="mb-4">
            <h2 className="text-xl font-bold">{tituloModo}</h2>
            <p className="text-zinc-400 text-sm mt-1">{dicaModo}</p>
          </div>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            aria-label="Campo para inserir pergunta, notícia ou link"
            className="w-full h-56 bg-zinc-950 border border-zinc-700 rounded-xl p-4 outline-none focus:border-blue-500 transition resize-none"
            placeholder={
              modo === "pergunta"
                ? "Ex: Jair Bolsonaro já foi preso?"
                : modo === "noticia"
                ? "Cole a notícia aqui..."
                : "Cole o link da notícia..."
            }
          />

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <button
              onClick={analisar}
              disabled={carregando}
              aria-label="Analisar conteúdo enviado"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition"
            >
              {carregando ? "Analisando..." : "Analisar"}
            </button>

            <button
              onClick={limpar}
              className="bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-xl font-semibold transition"
            >
              Limpar
            </button>
          </div>
        </section>

        {resultado && (
          <section className="mt-8 bg-zinc-950/80 border border-zinc-700 p-6 rounded-2xl">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                <h2 className="text-xl font-bold text-blue-400">
                  Resultado da análise
                </h2>
              </div>

              <button
                onClick={copiarResultado}
                className="text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg transition"
              >
                Copiar
              </button>
            </div>

            <div className="whitespace-pre-wrap leading-relaxed text-zinc-100">
              {resultado}
            </div>
          </section>
        )}

        <p className="mt-8 text-xs text-zinc-500 text-center">
          Esta ferramenta auxilia na análise, mas não substitui checagem em fontes oficiais.
        </p>

        <footer className="mt-10 text-center text-zinc-500 text-sm">
          <p>
            Criado por <span className="text-blue-400">NonFakeable</span> • Projeto Xô, falsiane!
          </p>
          <p className="mt-1">
            Ferramenta educativa de combate à desinformação.
          </p>
        </footer>
      </section>
    </main>
  );
}