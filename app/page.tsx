"use client";

import { useState } from "react";

export default function Home() {

  const [modo, setModo] = useState("pergunta");
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");

  async function analisar() {

    setResultado("Analisando sua Notícia...");

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
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center p-6">

      <h1 className="text-5xl font-bold mt-10 mb-4">
        Xô, falsiane!
      </h1>

      <p className="text-zinc-400 mb-8">
        Detecte fake news com IA
      </p>

      <div className="flex gap-4 mb-8 flex-wrap justify-center">

        <button
          onClick={() => setModo("pergunta")}
          className={`px-4 py-2 rounded-xl ${
            modo === "pergunta"
              ? "bg-blue-600"
              : "bg-zinc-800"
          }`}
        >
          Pergunta Direta
        </button>

        <button
          onClick={() => setModo("noticia")}
          className={`px-4 py-2 rounded-xl ${
            modo === "noticia"
              ? "bg-blue-600"
              : "bg-zinc-800"
          }`}
        >
          Notícia Escrita
        </button>

        <button
          onClick={() => setModo("link")}
          className={`px-4 py-2 rounded-xl ${
            modo === "link"
              ? "bg-blue-600"
              : "bg-zinc-800"
          }`}
        >
          Link da Notícia
        </button>

      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="w-full max-w-3xl h-56 bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none"
        placeholder={
          modo === "pergunta"
            ? "Ex: É verdade que..."
            : modo === "noticia"
            ? "Cole a notícia aqui..."
            : "Cole o link da notícia..."
        }
      />

      <button
        onClick={analisar}
        className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
      >
        Analisar
      </button>

      <div className="mt-8 w-full max-w-3xl bg-zinc-900 p-6 rounded-xl whitespace-pre-wrap">
        {resultado}
      </div>

    </main>
  );
}