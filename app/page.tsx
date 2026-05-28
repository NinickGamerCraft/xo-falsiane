"use client";

import { useEffect, useState } from "react";

type Tema = "dark" | "light";

export default function Home() {
  const [modo, setModo] = useState("pergunta");
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);
const [mostrarCreditos, setMostrarCreditos] = useState(false);
  const [somAtivo, setSomAtivo] = useState(true);
  const [tema, setTema] = useState<Tema>("dark");
  const [textoGrande, setTextoGrande] = useState(false);
  const [reduzirAnimacoes, setReduzirAnimacoes] = useState(false);
  const [animacaoModo, setAnimacaoModo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  const equipe = [
    { nome: "Nicolas", cargo: "Programador", img: "/team/nicolas.png", som: "nicolas" },
    { nome: "Antônio William", cargo: "Marketing", img: "/team/antonio.png", som: "antonio" },
    { nome: "Pedro Kaiki", cargo: "Arte / Direção de Arte", img: "/team/pedro.png", som: "pedro" },
    { nome: "Kaleb Anthony", cargo: "Design", img: "/team/kaleb.png", som: "kaleb" },
    { nome: "Pablo Enzo", cargo: "Sugestões", img: "/team/pablo.png", som: "pablo" },
    { nome: "Magno", cargo: "inserir texto..", img: "/team/magno.png", som: "magno" },
  ];

  useEffect(() => {
    document.body.classList.toggle("light-mode", tema === "light");
    document.body.classList.toggle("reduce-motion", reduzirAnimacoes);
    document.body.classList.toggle("large-text", textoGrande);
  }, [tema, reduzirAnimacoes, textoGrande]);

  function tocarAudio(nome: string) {
    if (!somAtivo) return;

    const audio = new Audio(`/sounds/${nome}.mp3`);
    audio.volume = 0.55;
    audio.play().catch(() => {});
  }

  function tocarSom(classificacao: string) {
    const tipo = classificacao.toLowerCase();

    if (tipo.includes("confiável") && !tipo.includes("parcial")) tocarAudio("confiavel");
    else if (tipo.includes("parcial")) tocarAudio("parcial");
    else if (tipo.includes("não confirmado")) tocarAudio("nao-confirmado");
    else if (tipo.includes("suspeita")) tocarAudio("suspeita");
    else if (tipo.includes("falsa")) tocarAudio("falsa");
  }

  function tocarClique() {
    tocarAudio("click");
  }

  function detectarClassificacao(textoResposta: string) {
    const texto = textoResposta.toLowerCase();

    const linhaClassificacao = texto
      .split("\n")
      .find((linha) => linha.includes("classificação"));

    if (!linhaClassificacao) return "neutra";

    if (linhaClassificacao.includes("❌") || linhaClassificacao.includes("falsa")) return "falsa";
    if (linhaClassificacao.includes("⚠️") || linhaClassificacao.includes("suspeita")) return "suspeita";

    if (
      linhaClassificacao.includes("❔") ||
      linhaClassificacao.includes("não confirmado") ||
      linhaClassificacao.includes("nao confirmado")
    ) {
      return "não confirmado";
    }

    if (linhaClassificacao.includes("🟡") || linhaClassificacao.includes("parcialmente")) {
      return "parcialmente confiável";
    }

    if (
      linhaClassificacao.includes("✅") ||
      linhaClassificacao.includes("confiável") ||
      linhaClassificacao.includes("confiavel")
    ) {
      return "confiável";
    }

    return "neutra";
  }

  function trocarModo(novoModo: string) {
    tocarClique();
    setModo(novoModo);
    setResultado("");
    setAnimacaoModo(true);

    setTimeout(() => setAnimacaoModo(false), 350);
  }

  async function analisar() {
    tocarAudio("swoosh");

    if (!texto.trim()) {
      setResultado("⚠️ Opa! Escreva algo antes de analisar.");
      return;
    }

    setCarregando(true);
    setResultado("");

    try {
      const resposta = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto, modo }),
      });

      const dados = await resposta.json();
      const respostaFinal = dados.resposta || "Não foi possível gerar uma resposta.";

      setResultado(respostaFinal);

      const classificacao = detectarClassificacao(respostaFinal);
      tocarSom(classificacao);
    } catch {
      setResultado("❌ Opa! Algo deu errado na análise. Tente novamente.");
      tocarSom("falsa");
    } finally {
      setCarregando(false);
    }
  }

  function limpar() {
    tocarClique();
    setTexto("");
    setResultado("");
  }

  async function copiarResultado() {
    tocarClique();
    if (!resultado) return;

    await navigator.clipboard.writeText(resultado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1600);
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
    <main className={`checker-bg min-h-screen text-white ${menuAberto ? "menu-open" : ""}`}>
      <button
        onClick={() => {
          tocarClique();
          setMenuAberto(!menuAberto);
        }}
        className="floating-menu-btn"
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <a
        href="/jogo"
        onClick={() => tocarClique()}
        className="floating-game-btn"
        aria-label="Abrir jogo"
      >
        <img src="/game-icon.png" alt="Jogo" />
      </a>

      <aside className={`side-tab ${menuAberto ? "side-tab-open" : ""}`}>
        <div className="side-header">
          <h2>☰ MENU</h2>

          <button
            onClick={() => {
              tocarClique();
              setMenuAberto(false);
            }}
            className="drawer-close"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <div className="settings-section">
          <h3 className="settings-subtitle">⚙️ CONFIGURAÇÕES</h3>

          <button
            onClick={() => {
              tocarClique();
              setSomAtivo(!somAtivo);
            }}
            className="settings-row"
          >
            {somAtivo ? "🔊 Sons ativados" : "🔇 Sons desativados"}
          </button>

          <select
            className="settings-row"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                tocarAudio(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="" disabled>
              🎵 Testar som personalizado
            </option>
            <option value="click">🖱️ Clique</option>
            <option value="swoosh">💨 Swoosh</option>
            <option value="confiavel">✅ Confiável</option>
            <option value="parcial">🟡 Parcial</option>
            <option value="nao-confirmado">❔ Não confirmado</option>
            <option value="suspeita">⚠️ Suspeita</option>
            <option value="falsa">❌ Falsa</option>
          </select>

          <button
            onClick={() => {
              tocarClique();
              setTema(tema === "dark" ? "light" : "dark");
            }}
            className="settings-row"
          >
            {tema === "dark" ? "☀️ Ativar modo claro" : "🌙 Ativar modo escuro"}
          </button>
        </div>

        <div className="settings-section">
          <h3 className="settings-subtitle">♿ ACESSIBILIDADE</h3>

          <button
            onClick={() => {
              tocarClique();
              setTextoGrande(!textoGrande);
            }}
            className="settings-row"
          >
            {textoGrande ? "🔠 Texto normal" : "🔡 Texto maior"}
          </button>

          <button
            onClick={() => {
              tocarClique();
              setReduzirAnimacoes(!reduzirAnimacoes);
            }}
            className="settings-row"
          >
            {reduzirAnimacoes ? "✨ Ativar animações" : "🧘 Reduzir animações"}
          </button>
<button
  onClick={() => {
    tocarClique();

    if ((window as any).abrirVLibras) {
      (window as any).abrirVLibras();
    } else {
      alert("VLibras ainda não carregou. Aguarde alguns segundos.");
    }
  }}
  className="settings-row"
>
  🙇 Libras
</button>
        </div>

        <div className="settings-section">
          <h3 className="settings-subtitle">EXTRA</h3>

          <a href="/jogo" onClick={() => tocarClique()} className="game-row">
            <img src="/game-icon.png" alt="Space News" />
            <span>Jogue Nosso Jogo! - Space News</span>
          </a>
        </div>

        <div className="settings-section">
          <h3 className="settings-subtitle">❓ Perguntas Frequentes</h3>

          <details className="faq-item">
            <summary>O site detecta fake news 100%?</summary>
            <p>Não. Ele auxilia na análise, mas a checagem final deve ser feita em fontes oficiais.</p>
          </details>

          <details className="faq-item">
            <summary>O site lê links?</summary>
            <p>Ele tenta ler o conteúdo do link, mas alguns sites podem bloquear leitura automática.</p>
          </details>

          <details className="faq-item">
            <summary>As respostas podem errar?</summary>
            <p>Sim. A IA pode falhar, por isso o resultado deve ser usado como apoio, não como verdade absoluta.</p>
          </details>
        </div>
      </aside>

      <div className="main-content">
        <section className="glass-panel w-full max-w-5xl rounded-3xl p-6 md:p-10 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20">
          <header className="text-center mb-10 header-enter">
            <p className="text-blue-400 font-semibold mb-2">
              VERIFIQUE.AI apresenta
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
              onClick={() => trocarModo("pergunta")}
              className={`mode-btn ${modo === "pergunta" ? "mode-active" : ""}`}
            >
              ❓ Pergunta Direta
            </button>

            <button
              onClick={() => trocarModo("noticia")}
              className={`mode-btn ${modo === "noticia" ? "mode-active" : ""}`}
            >
              📰 Notícia Escrita
            </button>

            <button
              onClick={() => trocarModo("link")}
              className={`mode-btn ${modo === "link" ? "mode-active" : ""}`}
            >
              🔗 Link da Notícia
            </button>
          </div>

          <section className={`work-card ${animacaoModo ? "mode-switch" : ""}`}>
            <div className="mb-4">
              <h2 className="text-xl font-bold">{tituloModo}</h2>
              <p className="text-zinc-400 text-sm mt-1">{dicaModo}</p>
            </div>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              aria-label="Campo para inserir pergunta, notícia ou link"
              className="main-textarea"
              placeholder={
                modo === "pergunta"
                  ? "Faça sua pergunta aqui..."
                  : modo === "noticia"
                  ? "Cole a notícia aqui..."
                  : "Cole o link da notícia..."
              }
            />

            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <button
                onClick={analisar}
                disabled={carregando}
                className="primary-btn"
              >
                {carregando ? "Analisando..." : "Analisar"}
              </button>

              <button onClick={limpar} className="secondary-btn">
                Limpar
              </button>
            </div>

            {carregando && (
              <div className="loading-box">
                <span></span>
                <span></span>
                <span></span>
                <p>Buscando sinais e verificando contexto...</p>
              </div>
            )}
          </section>

          {resultado && (
            <section className="result-card result-enter">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🧠</span>
                  <h2 className="text-xl font-bold text-blue-400">
                    Resultado da análise
                  </h2>
                </div>

                <button onClick={copiarResultado} className="copy-btn">
                  {copiado ? "Copiado!" : "Copiar"}
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
              Criado por <span className="text-blue-400">VERIFIQUE.AI</span> • Projeto Xô, falsiane!
            </p>
            <p className="mt-1">
              Ferramenta educativa de combate à desinformação.
            </p>
            <button
  onClick={() => {
    tocarClique();
    setMostrarCreditos(!mostrarCreditos);
  }}
  className="credits-toggle"
>
  {mostrarCreditos ? "Ocultar créditos" : "Ver créditos"}
</button>
          </footer>
        </section>

        {mostrarCreditos && (
          <section className="credits-section">
            <h2>CRÉDITOS</h2>
            <p className="credits-subtitle">Equipe VERIFIQUE.AI</p>

            <div className="credits-list">
              {equipe.map((pessoa) => (
                <button
                  key={pessoa.nome}
                  className="credit-row"
                  onClick={() => tocarAudio(pessoa.som)}
                >
                  <img src={pessoa.img} alt={pessoa.nome} />

                  <div>
                    <strong>{pessoa.nome}</strong>
                    <span>{pessoa.cargo}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}