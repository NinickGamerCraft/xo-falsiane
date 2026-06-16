"use client";

import { useEffect, useMemo, useState } from "react";

type Tema = "dark" | "light";

type SpaceNewsPayload = {
  code: string;
  message: string;
  raw: string;
};

function parseSpaceNewsPayload(value: string): SpaceNewsPayload | null {
  const trimmed = value.trim();
  const match = trimmed.match(/^#(\d{6,})\s+SPACE\s+NEWS\s*-\s*(.+)$/i);
  if (!match) return null;
  return {
    code: match[1],
    message: match[2].trim(),
    raw: trimmed,
  };
}

const PORTAIS_PARA_CHECAGEM = [
  { nome: "Agência Brasil", descricao: "Noticiário público nacional", url: "https://agenciabrasil.ebc.com.br/" },
  { nome: "G1", descricao: "Notícias nacionais e regionais", url: "https://g1.globo.com/" },
  { nome: "BBC News Brasil", descricao: "Notícias e contexto internacional", url: "https://www.bbc.com/portuguese" },
  { nome: "Diário do Nordeste", descricao: "Cobertura do Ceará e do Nordeste", url: "https://diariodonordeste.verdesmares.com.br/" },
  { nome: "CNN Brasil", descricao: "Noticiário nacional e internacional", url: "https://www.cnnbrasil.com.br/" },
  { nome: "Folha de S.Paulo", descricao: "Notícias, política e sociedade", url: "https://www.folha.uol.com.br/" },
  { nome: "Estadão", descricao: "Notícias, economia e política", url: "https://www.estadao.com.br/" },
  { nome: "UOL Notícias", descricao: "Notícias e cobertura em tempo real", url: "https://noticias.uol.com.br/" },
  { nome: "Aos Fatos", descricao: "Checagem de declarações e boatos", url: "https://www.aosfatos.org/" },
  { nome: "Agência Lupa", descricao: "Verificação de informações", url: "https://lupa.uol.com.br/" },
  { nome: "Projeto Comprova", descricao: "Coalizão de veículos de checagem", url: "https://projetocomprova.com.br/" },
];

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
  const [creditoAnimando, setCreditoAnimando] = useState("");
  const [spaceSignal, setSpaceSignal] = useState<SpaceNewsPayload | null>(null);

  const equipe = [
    { nome: "Nicolas", cargo: "Programador / Compositor", img: "/team/nicolas.png", som: "nicolas" },
    { nome: "Antônio William", cargo: "Marketing / Sugestões", img: "/team/antonio.png", som: "antonio" },
    { nome: "Pedro Kaiki", cargo: "Arte / Direção de Arte", img: "/team/pedro.png", som: "pedro" },
    { nome: "Kaleb Anthony", cargo: "Designer", img: "/team/kaleb.png", som: "kaleb" },
    { nome: "Pablo Enzo", cargo: "Pesquisador / Produtor", img: "/team/pablo.png", som: "pablo" },
    { nome: "Magno", cargo: "Testador / Pesquisador", img: "/team/magno.png", som: "magno" },
  ];

  useEffect(() => {
    document.body.classList.toggle("light-mode", tema === "light");
    document.body.classList.toggle("reduce-motion", reduzirAnimacoes);
    document.body.classList.toggle("large-text", textoGrande);
  }, [tema, reduzirAnimacoes, textoGrande]);

  useEffect(() => {
    const body = document.body;
    body.classList.add("xo-page-active");

    let root = document.querySelector<HTMLElement>("[vw]");

    if (!root) {
      const container = document.createElement("div");
      container.id = "xo-vlibras-root";
      container.innerHTML = `
        <div vw class="enabled">
          <div vw-access-button class="active"></div>
          <div vw-plugin-wrapper>
            <div class="vw-plugin-top-wrapper"></div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
      root = container.querySelector<HTMLElement>("[vw]");
    }

    root?.style.removeProperty("display");
    root?.style.removeProperty("visibility");
    root?.style.removeProperty("pointer-events");

    const inicializar = () => {
      const win = window as any;
      if (win.__xoVLibrasInicializado) return true;
      if (!win.VLibras?.Widget) return false;
      try {
        new win.VLibras.Widget("https://vlibras.gov.br/app");
        win.__xoVLibrasInicializado = true;
        return true;
      } catch (error) {
        console.warn("Falha ao inicializar o VLibras:", error);
        return false;
      }
    };

    let script = document.querySelector<HTMLScriptElement>(
      "script[data-xo-vlibras], script[src*='vlibras-plugin.js']",
    );
    if (!script) {
      script = document.createElement("script");
      script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
      script.async = true;
      script.dataset.xoVlibras = "true";
      script.addEventListener("load", inicializar, { once: true });
      document.body.appendChild(script);
    } else if ((window as any).VLibras?.Widget) {
      inicializar();
    } else {
      script.addEventListener("load", inicializar, { once: true });
    }

    (window as any).abrirVLibras = () => {
      let tentativas = 0;
      const abrir = () => {
        inicializar();
        const botao = document.querySelector<HTMLElement>("[vw-access-button]");
        if (botao) {
          botao.click();
          return;
        }
        tentativas += 1;
        if (tentativas < 24) window.setTimeout(abrir, 150);
        else alert("O VLibras não conseguiu carregar. Verifique sua conexão e tente novamente.");
      };
      abrir();
    };

    return () => {
      body.classList.remove("xo-page-active");
      delete (window as any).abrirVLibras;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("xo-drawer-open", menuAberto);

    if (menuAberto) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    return () => root.classList.remove("xo-drawer-open");
  }, [menuAberto]);

  useEffect(() => {
    try {
      const pending = window.localStorage.getItem("spaceNews.pendingFakeNews");
      if (!pending) return;
      const parsed = parseSpaceNewsPayload(pending);
      if (!parsed) return;
      setModo("noticia");
      setTexto(parsed.raw);
      setSpaceSignal(parsed);
      window.localStorage.removeItem("spaceNews.pendingFakeNews");
      window.localStorage.removeItem("spaceNews.pendingFakeNewsAt");
    } catch {}
  }, []);

  const spaceSignalInTextbox = useMemo(() => parseSpaceNewsPayload(texto), [texto]);
  const isSpaceNewsInput = !!spaceSignalInTextbox;

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
    const textoBase = textoResposta.toLowerCase();

    const linhaClassificacao = textoBase
      .split("\n")
      .find((linha) => linha.includes("classificação") || linha.includes("classificacao"));

    if (!linhaClassificacao) return "neutra";

    if (linhaClassificacao.includes("❌") || linhaClassificacao.includes("falsa")) return "falsa";
    if (linhaClassificacao.includes("⚠️") || linhaClassificacao.includes("suspeita")) return "suspeita";
    if (linhaClassificacao.includes("❔") || linhaClassificacao.includes("não confirmado") || linhaClassificacao.includes("nao confirmado")) {
      return "não confirmado";
    }
    if (linhaClassificacao.includes("🟡") || linhaClassificacao.includes("parcialmente")) {
      return "parcialmente confiável";
    }
    if (linhaClassificacao.includes("✅") || linhaClassificacao.includes("confiável") || linhaClassificacao.includes("confiavel")) {
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
      const payload = parseSpaceNewsPayload(texto);
      const resposta = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto,
          modo,
          origem: payload ? "space-news" : "site",
          spaceNewsCode: payload?.code ?? null,
        }),
      });

      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        throw new Error(dados?.erro || dados?.resposta || "Falha na análise.");
      }
      const respostaFinal = dados.resposta || "Não foi possível gerar uma resposta.";

      const respostaExibida = payload
        ? [
            "📡 TRANSMISSÃO INTERCEPTADA DA SPACE NEWS",
            `Código do sinal: #${payload.code}`,
            `Conteúdo analisado: ${payload.message}`,
            "",
            "PROTOCOLO XÔ, FALSIANE! ACIONADO",
            "Este texto foi sinalizado como transmissão narrativa enviada pelo jogo Space News para checagem especial.",
            "",
            respostaFinal,
          ].join("\n")
        : respostaFinal;

      setResultado(respostaExibida);

      const classificacao = detectarClassificacao(respostaFinal);
      tocarSom(classificacao);
    } catch (erro) {
      console.error("Falha ao analisar conteúdo:", erro);
      setResultado(
        "❌ Não foi possível concluir a análise agora. Confira sua conexão e tente novamente em alguns instantes.",
      );
      tocarSom("falsa");
    } finally {
      setCarregando(false);
    }
  }

  function limpar() {
    tocarClique();
    setTexto("");
    setResultado("");
    setSpaceSignal(null);
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
      ? "Pergunta direta"
      : modo === "noticia"
      ? "Notícia escrita"
      : "Link da notícia";

  const dicaModo =
    modo === "pergunta"
      ? "Faça uma pergunta objetiva sobre uma informação que você quer verificar."
      : modo === "noticia"
      ? "Cole o texto completo ou trecho da notícia para análise."
      : "Cole o link de uma matéria ou portal de notícias.";

  return (
    <main className={`checker-bg xo-main-page min-h-screen text-white ${menuAberto ? "menu-open" : ""}`}>
      <button
        onClick={() => {
          tocarClique();
          setMenuAberto((aberto) => !aberto);
        }}
        className="floating-menu-btn floating-action"
        data-label="Menu"
        aria-label="Abrir menu"
      >
        ☰
      </button>

      <a
        href="/jogo"
        onClick={() => tocarClique()}
        className="floating-game-btn floating-action"
        data-label="Space News (Jogo!)"
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
            <span>Jogue nosso bônus: Space News</span>
          </a>

          <details className="faq-item trusted-portals">
            <summary>📰 Fontes para comparar informações</summary>
            <p>
              Nenhum portal é infalível. Compare a mesma informação em mais de uma fonte e procure documentos oficiais.
            </p>
            <div className="trusted-portals-list">
              {PORTAIS_PARA_CHECAGEM.map((portal) => (
                <a
                  key={portal.nome}
                  href={portal.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => tocarClique()}
                >
                  <strong>{portal.nome}</strong>
                  <span>{portal.descricao}</span>
                </a>
              ))}
            </div>
          </details>
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

      <div className="main-content xo-main-content">
        <section className="glass-panel xo-glass-panel w-full max-w-6xl rounded-3xl p-6 md:p-10 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20">
          <header className="text-center mb-10 header-enter xo-hero">
            <p className="xo-hero-kicker">VERIFIQUE.AI apresenta</p>
            <h1 className="xo-hero-title">Xô, falsiane!</h1>
            <p className="xo-hero-description">
              Verifique perguntas, notícias escritas e links suspeitos com ajuda de IA. Um detector educativo com visual moderno,
              leitura clara e análise rápida.
            </p>

            <div className="xo-feature-row">
              <span className="xo-feature-pill">IA de apoio</span>
              <span className="xo-feature-pill">Leitura de links</span>
              <span className="xo-feature-pill">Acessibilidade</span>
              <span className="xo-feature-pill">Integração com Space News</span>
            </div>
          </header>

          {spaceSignal && (
            <section className="xo-space-card result-enter">
              <div className="xo-space-card-top">
                <span className="xo-space-card-tag">TRANSMISSÃO INTERCEPTADA</span>
                <span className="xo-space-card-code">#{spaceSignal.code}</span>
              </div>
              <h2>Mensagem recebida da Space News</h2>
              <p>{spaceSignal.message}</p>
              <small>
                O detector entrou em modo temático. Você pode analisar essa transmissão ou editar o texto antes de enviar.
              </small>
            </section>
          )}

          <div className="xo-mode-grid">
            <button onClick={() => trocarModo("pergunta")} className={`mode-btn ${modo === "pergunta" ? "mode-active" : ""}`}>
              ❓ Pergunta Direta
            </button>
            <button onClick={() => trocarModo("noticia")} className={`mode-btn ${modo === "noticia" ? "mode-active" : ""}`}>
              📰 Notícia Escrita
            </button>
            <button onClick={() => trocarModo("link")} className={`mode-btn ${modo === "link" ? "mode-active" : ""}`}>
              🔗 Link da Notícia
            </button>
          </div>

          <section className={`work-card xo-work-card ${animacaoModo ? "mode-switch" : ""}`}>
            <div className="mb-4">
              <h2 className="text-xl font-bold">{tituloModo}</h2>
              <p className="text-zinc-400 text-sm mt-1">{dicaModo}</p>
            </div>

            {isSpaceNewsInput && spaceSignalInTextbox && (
              <div className="xo-signal-banner">
                <div>
                  <strong>SINAL DA SPACE NEWS</strong>
                  <p>O código #{spaceSignalInTextbox.code} será tratado com uma resposta temática exclusiva.</p>
                </div>
                <span>PROTOCOLO ATIVO</span>
              </div>
            )}

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
              <button onClick={analisar} disabled={carregando} className="primary-btn">
                {carregando ? "Analisando..." : "Analisar"}
              </button>
              <button onClick={limpar} className="secondary-btn">Limpar</button>
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
                  <h2 className="text-xl font-bold text-blue-400">Resultado da análise</h2>
                </div>
                <button onClick={copiarResultado} className="copy-btn">{copiado ? "Copiado!" : "Copiar"}</button>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-zinc-100">{resultado}</div>
            </section>
          )}

          <p className="xo-footer-note mt-8 text-xs text-zinc-500 text-center">
            Esta ferramenta auxilia na análise, mas não substitui checagem em fontes oficiais.
          </p>

          <footer className="mt-10 text-center text-zinc-400 text-sm xo-footer-box">
            <p>
              Criado por <span className="text-blue-400">VERIFIQUE.AI</span> • Projeto Xô, falsiane!
            </p>
            <p className="mt-1">Ferramenta educativa de combate à desinformação.</p>
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
          <section className="credits-section xo-credits-section">
            <h2>CRÉDITOS</h2>
            <p className="credits-subtitle">Equipe VERIFIQUE.AI</p>
            <div className="credits-list">
              {equipe.map((pessoa) => (
                <button
                  key={pessoa.nome}
                  className={`${creditoAnimando === pessoa.nome ? "credit-jump-play" : ""} credit-row`}
                  onClick={() => {
                    tocarAudio(pessoa.som);
                    setCreditoAnimando("");
                    setTimeout(() => setCreditoAnimando(pessoa.nome), 10);
                    setTimeout(() => setCreditoAnimando(""), 500);
                  }}
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
