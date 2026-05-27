"use client";

import { useState } from "react";

export default function Home() {

  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");

  async function analisarNoticia() {

    setResultado("Analisando...");

    const resposta = await fetch("/api/analisar", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        texto,
      }),
    });

    const dados = await resposta.json();

    setResultado(dados.resposta);
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">

      <h1 className="text-5xl font-bold mb-4">
        Xô, falsiane!
      </h1>

      <p className="text-zinc-400 mb-8">
        Descubra se uma notícia pode ser falsa
      </p>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="w-full max-w-2xl h-52 bg-zinc-900 border border-zinc-700 rounded-xl p-4 outline-none"
        placeholder="Cole aqui a notícia..."
      />

      <button
        onClick={analisarNoticia}
        className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
      >
        Verificar notícia
      </button>

      <div className="mt-8 w-full max-w-2xl bg-zinc-900 p-6 rounded-xl whitespace-pre-wrap">
        {resultado}
      </div>

    </main>
  );
}