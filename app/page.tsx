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
        body: JSON.stringify({
          texto,
          modo,
        }),
      });

      const dados = await resposta.json();
      setResultado(dados.resposta);
    } catch {
      setResultado("❌ Opa! Algo deu errado na análise. Tente novamente.");
    } finally {
      setCarregando(false);
    }
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
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      <h1 className="text-5xl font-bold mt-10 mb-4 text-center">
        Xô, falsiane!
      </h1>

      <p className="text-zinc-400 mb-8 text-center">
        Detecte fake news com IA
      </p>

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

      <section className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold">{tituloModo}</h2>
          <p className="text-zinc-400 text-sm mt-1">{dicaModo}</p>
        </div>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full h-56 bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none focus:border-blue-500 transition resize-none"
          placeholder={
            modo === "pergunta"
              ? "Faça a sua pergunta aqui..."
              : modo === "noticia"
              ? "Cole a notícia aqui..."
              : "Cole o link da notícia..."
          }
        />

        <div className="flex justify-center">
          <button
            onClick={analisar}
            disabled={carregando}
            className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-semibold transition"
          >
            {carregando ? "Analisando..." : "Analisar"}
          </button>
        </div>
      </section>

      {resultado && (
        <section className="mt-8 w-full max-w-3xl bg-zinc-900 border border-zinc-700 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🧠</span>
            <h2 className="text-xl font-bold text-blue-400">
              Resultado da análise
            </h2>
          </div>

          <div className="whitespace-pre-wrap leading-relaxed text-zinc-100">
            {resultado}
          </div>
        </section>
      )}
    </main>
  );
}