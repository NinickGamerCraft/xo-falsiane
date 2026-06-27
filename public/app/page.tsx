"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FeedbackButton from "./feedback-button";
import PWARegister from "./pwa-register";

type Tema = "system" | "dark" | "light";
type TemaResolvido = "dark" | "light";

type SpaceNewsPayload = {
  code: string;
  message: string;
  raw: string;
};

type ApiPayload = {
  resposta?: string;
  erro?: string;
  codigo?: string;
  sugestao?: string;
};

type ApiRequestError = Error & {
  status?: number;
  code?: string;
  serverMessage?: string;
  suggestion?: string;
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

const ANALYSIS_TIMEOUT_MS = 85_000;
const MOBILE_ANALYSIS_TIMEOUT_MS = 95_000;

function isMobileAnalysisClient() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  const ua = navigator.userAgent || "";
  return (
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua) ||
    navigator.maxTouchPoints > 1 ||
    Boolean(nav.connection?.saveData)
  );
}

function getConnectionProfile() {
  if (typeof navigator === "undefined") {
    return {
      mobile: false,
      saveData: false,
      effectiveType: "",
    };
  }

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  };

  return {
    mobile: isMobileAnalysisClient(),
    saveData: Boolean(nav.connection?.saveData),
    effectiveType: nav.connection?.effectiveType || "",
  };
}


const PORTAIS_PARA_CHECAGEM = [
  {
    nome: "Agência Brasil",
    descricao: "Noticiário público nacional",
    url: "https://agenciabrasil.ebc.com.br/",
  },
  {
    nome: "G1",
    descricao: "Notícias nacionais e regionais",
    url: "https://g1.globo.com/",
  },
  {
    nome: "BBC News Brasil",
    descricao: "Notícias e contexto internacional",
    url: "https://www.bbc.com/portuguese",
  },
  {
    nome: "Diário do Nordeste",
    descricao: "Cobertura do Ceará e do Nordeste",
    url: "https://diariodonordeste.verdesmares.com.br/",
  },
  {
    nome: "CNN Brasil",
    descricao: "Noticiário nacional e internacional",
    url: "https://www.cnnbrasil.com.br/",
  },
  {
    nome: "Folha de S.Paulo",
    descricao: "Notícias, política e sociedade",
    url: "https://www.folha.uol.com.br/",
  },
  {
    nome: "Estadão",
    descricao: "Notícias, economia e política",
    url: "https://www.estadao.com.br/",
  },
  {
    nome: "UOL Notícias",
    descricao: "Notícias e cobertura em tempo real",
    url: "https://noticias.uol.com.br/",
  },
  {
    nome: "Aos Fatos",
    descricao: "Checagem de declarações e boatos",
    url: "https://www.aosfatos.org/",
  },
  {
    nome: "Agência Lupa",
    descricao: "Verificação de informações",
    url: "https://lupa.uol.com.br/",
  },
  {
    nome: "Projeto Comprova",
    descricao: "Coalizão de veículos de checagem",
    url: "https://projetocomprova.com.br/",
  },
];

const FAQ_ITEMS = [
  {
    pergunta: "O site detecta fake news com 100% de certeza?",
    resposta:
      "Não. Ele ajuda a encontrar sinais de alerta e organizar uma checagem, mas nenhuma IA substitui documentos oficiais, especialistas e a comparação entre fontes confiáveis.",
  },
  {
    pergunta: "Então eu posso confiar no resultado?",
    resposta:
      "Use o resultado como ponto de partida. Leia a explicação, confira as fontes citadas e procure confirmar as informações mais importantes antes de compartilhar.",
  },
  {
    pergunta:
      "Por que a mesma pergunta pode receber respostas um pouco diferentes?",
    resposta:
      "A análise é gerada por inteligência artificial e pode variar na forma de explicar. O veredito deve continuar baseado nas evidências disponíveis, mas a redação pode mudar.",
  },
  {
    pergunta: "O que significa “Não confirmado”?",
    resposta:
      "Significa que ainda não há evidências suficientes para confirmar ou negar a informação. Isso não quer dizer automaticamente que ela seja falsa.",
  },
  {
    pergunta: "O site consegue analisar qualquer link?",
    resposta:
      "Nem sempre. Alguns sites bloqueiam leitura automática, exigem login ou carregam o texto de uma forma que impede a extração. Nesses casos, copie o trecho principal e use o modo Notícia Escrita.",
  },
  {
    pergunta:
      "Posso verificar mensagens recebidas no WhatsApp ou nas redes sociais?",
    resposta:
      "Sim. Copie o texto da mensagem e cole em Notícia Escrita. Remova dados pessoais antes de enviar e tente incluir contexto, data e origem.",
  },
  {
    pergunta: "Como saber se uma fonte é confiável?",
    resposta:
      "Observe autoria, data, transparência, correções públicas e referências. Compare a mesma informação em mais de um veículo e procure a fonte original do dado.",
  },
  {
    pergunta: "Uma notícia com muitos compartilhamentos é verdadeira?",
    resposta:
      "Não necessariamente. Popularidade não é prova. Conteúdos falsos também podem viralizar, principalmente quando provocam medo, raiva ou urgência.",
  },
  {
    pergunta: "O Xô, falsiane! substitui uma pesquisa escolar?",
    resposta:
      "Não. Ele pode ajudar a começar a pesquisa e entender o tema, mas trabalhos escolares devem usar livros, artigos, documentos e fontes indicadas pelo professor.",
  },
  {
    pergunta: "O site é gratuito?",
    resposta:
      "Sim. O projeto foi desenvolvido com finalidade educativa para ajudar no combate à desinformação.",
  },
  {
    pergunta: "O que é o Space News?",
    resposta:
      "É o jogo bônus do projeto. Ele transforma o combate à desinformação em uma aventura espacial e envia mensagens suspeitas diretamente para o detector.",
  },
  {
    pergunta: "Por que eu não devo enviar dados pessoais?",
    resposta:
      "Porque nomes completos, documentos, senhas, endereços e informações privadas não são necessários para verificar uma notícia. Envie somente o conteúdo relevante para a análise.",
  },
];

const ANALYSIS_STEPS = [
  "Preparando entrada",
  "Enviando ao servidor",
  "Aguardando verificação",
  "Consolidando resposta",
];

const XO_INTELLIGENCE_CARDS = [
  {
    icon: "🕒",
    title: "Contexto temporal",
    text: "Assuntos que mudam com o tempo passam por regras extras para evitar resposta desatualizada.",
  },
  {
    icon: "🧭",
    title: "Leitura responsável",
    text: "O detector separa fato, rumor, opinião, sátira e informação sem confirmação suficiente.",
  },
  {
    icon: "🛡️",
    title: "Sem certeza falsa",
    text: "Quando faltam provas atuais, o resultado deve reconhecer a limitação em vez de inventar conclusão.",
  },
];

export default function Home() {
  const [modo, setModo] = useState("pergunta");
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [etapaAnalise, setEtapaAnalise] = useState(0);
  const [inicioAnaliseMs, setInicioAnaliseMs] = useState<number | null>(null);
  const [tempoAnaliseMs, setTempoAnaliseMs] = useState(0);
  const [textoEnviadoPreview, setTextoEnviadoPreview] = useState("");
  const [avisoFerramenta, setAvisoFerramenta] = useState("");
  const [entradaFocada, setEntradaFocada] = useState(false);
  const [mostrarCreditos, setMostrarCreditos] = useState(false);
  const [somAtivo, setSomAtivo] = useState(true);
  const [tema, setTema] = useState<Tema>("system");
  const [temaResolvido, setTemaResolvido] = useState<TemaResolvido>("dark");
  const [online, setOnline] = useState(true);
  const [textoGrande, setTextoGrande] = useState(false);
  const [reduzirAnimacoes, setReduzirAnimacoes] = useState(false);
  const [leitorAutomatico, setLeitorAutomatico] = useState(false);
  const [leituraAtiva, setLeituraAtiva] = useState(false);
  const [animacaoModo, setAnimacaoModo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const [creditoAnimando, setCreditoAnimando] = useState("");
  const [spaceSignal, setSpaceSignal] = useState<SpaceNewsPayload | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});
  const audioUnlockedRef = useRef(false);
  const leitorAutomaticoRef = useRef(false);

  const equipe = [
    {
      nome: "Nicolas",
      cargo: "Programador / Compositor",
      img: "/team/nicolas.png",
      som: "nicolas",
    },
    {
      nome: "Antônio William",
      cargo: "Marketing / Sugestões",
      img: "/team/antonio.png",
      som: "antonio",
    },
    {
      nome: "Pedro Kaiki",
      cargo: "Arte / Direção de Arte",
      img: "/team/pedro.png",
      som: "pedro",
    },
    {
      nome: "Kaleb Anthony",
      cargo: "Designer",
      img: "/team/kaleb.png",
      som: "kaleb",
    },
    {
      nome: "Pablo Enzo",
      cargo: "Pesquisador / Produtor",
      img: "/team/pablo.png",
      som: "pablo",
    },
    {
      nome: "Magno",
      cargo: "Testador / Pesquisador",
      img: "/team/magno.png",
      som: "magno",
    },
  ];

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem("xo-falsiane.theme");
      if (salvo === "system" || salvo === "dark" || salvo === "light") {
        setTema(salvo);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem("xo-falsiane.reader");
      const ativo = salvo === "on";
      leitorAutomaticoRef.current = ativo;
      setLeitorAutomatico(ativo);
    } catch {}
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const aplicarTema = () => {
      const resolvido: TemaResolvido =
        tema === "system" ? (media.matches ? "dark" : "light") : tema;

      setTemaResolvido(resolvido);
      document.body.classList.toggle("light-mode", resolvido === "light");
      document.body.classList.toggle("dark-mode", resolvido === "dark");
      document.documentElement.style.colorScheme = resolvido;
    };

    aplicarTema();
    if (tema === "system") media.addEventListener("change", aplicarTema);

    try {
      window.localStorage.setItem("xo-falsiane.theme", tema);
    } catch {}

    return () => media.removeEventListener("change", aplicarTema);
  }, [tema]);

  useEffect(() => {
    document.body.classList.toggle("reduce-motion", reduzirAnimacoes);
    document.body.classList.toggle("large-text", textoGrande);
  }, [reduzirAnimacoes, textoGrande]);

  useEffect(() => {
    const atualizarConexao = () => setOnline(navigator.onLine);
    atualizarConexao();
    window.addEventListener("online", atualizarConexao);
    window.addEventListener("offline", atualizarConexao);
    return () => {
      window.removeEventListener("online", atualizarConexao);
      window.removeEventListener("offline", atualizarConexao);
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    body.classList.remove("game-page-active");
    body.classList.add("xo-page-active");
    return () => body.classList.remove("xo-page-active");
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
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

  useEffect(() => {
    const nomes = [
      "click",
      "swoosh",
      "confiavel",
      "parcial",
      "nao-confirmado",
      "suspeita",
      "falsa",
      ...equipe.map((item) => item.som),
    ];

    nomes.forEach((nome) => {
      if (audioElementsRef.current[nome]) return;
      const audio = new Audio(`/sounds/${nome}.mp3`);
      audio.preload = "auto";
      audioElementsRef.current[nome] = audio;
    });
  }, []);

  function obterAudio(nome: string) {
    if (!audioElementsRef.current[nome]) {
      const audio = new Audio(`/sounds/${nome}.mp3`);
      audio.preload = "auto";
      audioElementsRef.current[nome] = audio;
    }
    return audioElementsRef.current[nome];
  }

  function destravarAudio() {
    if (audioUnlockedRef.current || !somAtivo) return;
    const audio = obterAudio("click");
    const volumeOriginal = audio.volume;
    const mutedOriginal = audio.muted;
    audio.volume = 0;
    audio.muted = true;
    const tentativa = audio.play();

    if (!tentativa) {
      audio.volume = volumeOriginal;
      audio.muted = mutedOriginal;
      return;
    }

    tentativa
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = volumeOriginal;
        audio.muted = mutedOriginal;
        audioUnlockedRef.current = true;
      })
      .catch(() => {
        audio.volume = volumeOriginal;
        audio.muted = mutedOriginal;
      });
  }

  const spaceSignalInTextbox = useMemo(
    () => parseSpaceNewsPayload(texto),
    [texto],
  );
  const isSpaceNewsInput = !!spaceSignalInTextbox;

  const textoLimpo = texto.trim();
  const qualidadeEntrada = useMemo(() => {
    if (!textoLimpo) {
      return {
        label: "Aguardando conteúdo",
        level: "empty",
        detail: "Digite uma informação verificável.",
      };
    }

    if (modo === "link") {
      return textoLimpo.startsWith("http://") ||
        textoLimpo.startsWith("https://")
        ? {
            label: "Link pronto para leitura",
            level: "good",
            detail: "A página será aberta pelo servidor.",
          }
        : {
            label: "Link incompleto",
            level: "warn",
            detail: "Use http:// ou https://.",
          };
    }

    const palavras = textoLimpo.split(/\s+/).filter(Boolean).length;
    if (palavras < 3) {
      return {
        label: "Pouco contexto",
        level: "warn",
        detail: "Adicione nomes, data ou local.",
      };
    }

    if (palavras >= 45 || textoLimpo.length > 260) {
      return {
        label: "Conteúdo robusto",
        level: "good",
        detail: "Há contexto suficiente para uma análise melhor.",
      };
    }

    return {
      label: "Entrada utilizável",
      level: "ok",
      detail: "A análise pode começar.",
    };
  }, [modo, textoLimpo]);

  useEffect(() => {
    if (!resultado || !leitorAutomaticoRef.current) return;

    const timer = window.setTimeout(() => {
      lerEmVozAlta(resultado);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [resultado]);

  useEffect(() => {
    leitorAutomaticoRef.current = leitorAutomatico;
    try {
      window.localStorage.setItem("xo-falsiane.reader", leitorAutomatico ? "on" : "off");
    } catch {}

    if (!leitorAutomatico && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setLeituraAtiva(false);
    }
  }, [leitorAutomatico]);

  useEffect(() => {
    if (!carregando || inicioAnaliseMs === null) {
      setEtapaAnalise(0);
      setTempoAnaliseMs(0);
      return;
    }

    const atualizar = () => {
      const elapsed = Date.now() - inicioAnaliseMs;
      setTempoAnaliseMs(elapsed);

      if (elapsed < 650) setEtapaAnalise(0);
      else if (elapsed < 1800) setEtapaAnalise(1);
      else if (elapsed < 9000) setEtapaAnalise(2);
      else setEtapaAnalise(3);
    };

    atualizar();
    const timer = window.setInterval(atualizar, 250);

    return () => window.clearInterval(timer);
  }, [carregando, inicioAnaliseMs]);

  function prepararTextoParaLeitura(valor: string) {
    return valor
      .replace(/[✅🟡❔⚠️❌🧾🔍🧠📌ℹ️📡💬🧭⏳🛠️🔐🚦]/g, " ")
      .replace(/#{1,6}/g, " ")
      .replace(/[-•]{1,2}\s+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4200);
  }

  function lerEmVozAlta(valor = resultado || texto) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      mostrarAvisoFerramenta("Leitura por voz não é suportada neste navegador.");
      return;
    }

    const conteudo = prepararTextoParaLeitura(valor);
    if (!conteudo) {
      mostrarAvisoFerramenta("Não há texto para ler agora.");
      return;
    }

    window.speechSynthesis.cancel();
    const fala = new SpeechSynthesisUtterance(conteudo);
    fala.lang = "pt-BR";
    fala.rate = 0.96;
    fala.pitch = 1;
    fala.volume = 1;
    const vozes = window.speechSynthesis.getVoices();
    const vozPtBr = vozes.find((voz) => /pt[-_]BR/i.test(voz.lang));
    const vozPt = vozPtBr || vozes.find((voz) => /^pt/i.test(voz.lang));
    if (vozPt) fala.voice = vozPt;

    fala.onstart = () => setLeituraAtiva(true);
    fala.onend = () => setLeituraAtiva(false);
    fala.onerror = () => setLeituraAtiva(false);
    window.speechSynthesis.speak(fala);
  }

  function pararLeitura() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setLeituraAtiva(false);
  }

  function tocarAudio(nome: string) {
    if (!somAtivo) return;

    const base = obterAudio(nome);
    const audio = base.paused ? base : (base.cloneNode(true) as HTMLAudioElement);
    audio.volume = 0.55;
    try {
      audio.currentTime = 0;
    } catch {}
    audio.play().catch(() => {});
  }

  function tocarClique() {
    destravarAudio();
    tocarAudio("click");
  }

  function tocarSom(classificacao: string) {
    const tipo = classificacao.toLowerCase();

    if (tipo.includes("confiável") && !tipo.includes("parcial"))
      tocarAudio("confiavel");
    else if (tipo.includes("parcial")) tocarAudio("parcial");
    else if (tipo.includes("não confirmado")) tocarAudio("nao-confirmado");
    else if (tipo.includes("suspeita")) tocarAudio("suspeita");
    else if (tipo.includes("falsa")) tocarAudio("falsa");
  }

  function mostrarAvisoFerramenta(mensagem: string) {
    setAvisoFerramenta(mensagem);
    window.setTimeout(() => setAvisoFerramenta(""), 2200);
  }

  function detectarModoAutomatico() {
    tocarClique();
    const valor = texto.trim();

    if (!valor) {
      mostrarAvisoFerramenta("Digite ou cole algo primeiro.");
      return;
    }

    if (/^https?:\/\//i.test(valor)) {
      setModo("link");
      mostrarAvisoFerramenta("Modo alterado para Link da Notícia.");
      return;
    }

    const palavras = valor.split(/\s+/).filter(Boolean).length;
    if (palavras >= 42 || valor.length >= 260) {
      setModo("noticia");
      mostrarAvisoFerramenta("Modo alterado para Notícia Escrita.");
      return;
    }

    setModo("pergunta");
    mostrarAvisoFerramenta("Modo alterado para Pergunta Direta.");
  }

  function limparFormatacaoEntrada() {
    tocarClique();
    const normalizado = texto
      .replace(/\u00a0/g, " ")
      .replace(/[\t\r ]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    setTexto(normalizado);
    mostrarAvisoFerramenta(
      normalizado ? "Formatação limpa sem apagar o conteúdo." : "Nada para limpar.",
    );
  }

  async function colarDaAreaDeTransferencia() {
    tocarClique();

    try {
      const conteudo = await navigator.clipboard.readText();
      if (!conteudo.trim()) {
        mostrarAvisoFerramenta("A área de transferência está vazia.");
        return;
      }

      setTexto(conteudo.trim());
      mostrarAvisoFerramenta("Conteúdo colado no campo de análise.");
    } catch {
      mostrarAvisoFerramenta("O navegador bloqueou o acesso à área de transferência.");
    }
  }

  function detectarClassificacao(textoResposta: string) {
    const textoBase = textoResposta.toLowerCase();

    const linhaClassificacao = textoBase
      .split("\n")
      .find(
        (linha) =>
          linha.includes("classificação") || linha.includes("classificacao"),
      );

    if (!linhaClassificacao) return "neutra";

    if (
      linhaClassificacao.includes("❌") ||
      linhaClassificacao.includes("falsa")
    )
      return "falsa";
    if (
      linhaClassificacao.includes("⚠️") ||
      linhaClassificacao.includes("suspeita")
    )
      return "suspeita";
    if (
      linhaClassificacao.includes("❔") ||
      linhaClassificacao.includes("não confirmado") ||
      linhaClassificacao.includes("nao confirmado")
    ) {
      return "não confirmado";
    }
    if (
      linhaClassificacao.includes("🟡") ||
      linhaClassificacao.includes("parcialmente")
    ) {
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
    destravarAudio();
    tocarAudio("swoosh");

    if (!texto.trim()) {
      const mensagensVazias: Record<string, string> = {
        pergunta:
          "O campo de pergunta está vazio. Escreva o que você deseja confirmar antes de analisar.",
        noticia:
          "Ainda não há uma notícia para verificar. Cole um trecho com contexto suficiente.",
        link: "Cole o endereço completo da página que você deseja analisar.",
      };
      setResultado(
        `⚠️ ${mensagensVazias[modo] || "Digite algo para analisar."}`,
      );
      return;
    }

    if (!navigator.onLine) {
      setResultado(
        modo === "link"
          ? "📡 Você está sem internet, então não consigo abrir esse link agora. Reconecte-se e pressione Analisar novamente."
          : "📡 Você está sem internet, então a análise não pode ser enviada ao servidor. O conteúdo digitado continuará salvo nesta tela.",
      );
      return;
    }

    setEtapaAnalise(0);
    setInicioAnaliseMs(Date.now());
    setTempoAnaliseMs(0);
    setTextoEnviadoPreview(texto.trim());
    setCarregando(true);
    setResultado("");
    const controller = new AbortController();
    const connectionProfile = getConnectionProfile();
    const timeoutMs = connectionProfile.mobile
      ? MOBILE_ANALYSIS_TIMEOUT_MS
      : ANALYSIS_TIMEOUT_MS;
    const timeoutId = window.setTimeout(() => {
      controller.abort(
        new DOMException(
          "A análise ultrapassou o tempo limite configurado.",
          "AbortError",
        ),
      );
    }, timeoutMs);

    try {
      const payload = parseSpaceNewsPayload(texto);
      const resposta = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          texto,
          modo,
          origem: payload ? "space-news" : "site",
          spaceNewsCode: payload?.code ?? null,
          // Mobile não usa mais modo rápido automaticamente: isso causava respostas diferentes do PC.
          // Só usa modo econômico quando o próprio navegador informa economia de dados.
          preferFast: connectionProfile.saveData,
          clientProfile: connectionProfile,
        }),
      });

      const dados = (await resposta.json().catch(() => ({}))) as ApiPayload;
      if (!resposta.ok) {
        const mensagemServidor =
          typeof dados?.erro === "string"
            ? dados.erro
            : typeof dados?.resposta === "string"
              ? dados.resposta
              : "A análise não pôde ser concluída.";
        const codigo = typeof dados.codigo === "string" ? dados.codigo : "";
        const sugestao =
          typeof dados.sugestao === "string" ? dados.sugestao.trim() : "";
        const mensagemComSugestao = [mensagemServidor, sugestao]
          .filter(Boolean)
          .join("\n\n");

        // Erros de validação são respostas normais da interface, não falhas de execução.
        if (resposta.status === 400 || resposta.status === 422) {
          if (
            codigo === "campo_link_incorreto" ||
            codigo === "link_invalido" ||
            codigo === "campo_pergunta_incorreto" ||
            codigo === "campo_noticia_incorreto"
          ) {
            setResultado(`🧭 ${mensagemComSugestao}`);
          } else if (
            codigo === "texto_aleatorio" ||
            codigo === "conteudo_sem_valor" ||
            codigo === "conteudo_inadequado"
          ) {
            setResultado(`💬 ${mensagemComSugestao}`);
          } else {
            setResultado(
              `⚠️ ${mensagemComSugestao || "Revise o conteúdo enviado e tente novamente."}`,
            );
          }
          return;
        }

        const apiError = new Error(mensagemServidor) as ApiRequestError;
        apiError.status = resposta.status;
        apiError.code = codigo;
        apiError.serverMessage = mensagemServidor;
        apiError.suggestion = sugestao;
        throw apiError;
      }
      const respostaFinal =
        typeof dados.resposta === "string" && dados.resposta.trim()
          ? dados.resposta
          : "⚠️ A análise terminou sem conteúdo. Tente novamente com mais contexto.";

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

      setEtapaAnalise(3);
      setResultado(respostaExibida);

      const classificacao = detectarClassificacao(respostaFinal);
      tocarSom(classificacao);
    } catch (erro) {
      const foiTimeout =
        erro instanceof DOMException && erro.name === "AbortError";
      const possibleApiError = erro as ApiRequestError;
      const possibleStatus = Number(possibleApiError?.status || 0);

      if (!foiTimeout && (!possibleStatus || possibleStatus >= 500)) {
        console.error("Falha inesperada ao analisar conteúdo:", erro);
      }

      const apiError = erro as ApiRequestError;
      const status = Number(apiError?.status || 0);
      const codigo = String(apiError?.code || "");
      const sugestao = String(apiError?.suggestion || "").trim();
      const mensagemServidor =
        typeof apiError?.serverMessage === "string"
          ? apiError.serverMessage.trim()
          : erro instanceof Error
            ? erro.message.trim()
            : "";
      const mensagemComSugestao = [mensagemServidor, sugestao]
        .filter(Boolean)
        .join("\n\n");

      if (!navigator.onLine) {
        setResultado(
          "📡 A conexão caiu durante a análise. Reconecte-se e tente novamente; o conteúdo digitado não foi apagado.",
        );
      } else if (foiTimeout || status === 504 || codigo === "ia_timeout") {
        setResultado(
          "⏳ A análise ultrapassou o tempo de espera. Ativei um modo mais leve para celular/conexão lenta; tente novamente com uma entrada um pouco menor ou aguarde alguns segundos.",
        );
      } else if (
        codigo === "campo_link_incorreto" ||
        codigo === "link_invalido" ||
        codigo === "campo_pergunta_incorreto" ||
        codigo === "campo_noticia_incorreto"
      ) {
        setResultado(`🧭 ${mensagemComSugestao}`);
      } else if (
        codigo === "texto_aleatorio" ||
        codigo === "conteudo_sem_valor" ||
        codigo === "conteudo_inadequado"
      ) {
        setResultado(`💬 ${mensagemComSugestao}`);
      } else if (status === 400 || status === 422) {
        setResultado(
          `⚠️ ${mensagemComSugestao || "Revise o conteúdo enviado e tente novamente."}`,
        );
      } else if (status === 429 || codigo === "ia_rate_limit") {
        setResultado(
          "🚦 Muitas análises chegaram ao mesmo tempo. Espere alguns segundos antes de tentar novamente.",
        );
      } else if (
        codigo === "ia_invalid_response" ||
        codigo === "ia_resposta_invalida"
      ) {
        setResultado(
          "🧩 A resposta automática veio incoerente ou fora do formato e foi bloqueada para evitar uma análise confusa. Reformule a entrada ou tente novamente.",
        );
      } else if (status === 401 || status === 403 || codigo === "ia_auth") {
        setResultado(
          "🔐 O serviço de análise não conseguiu se autenticar. A configuração da OpenRouter precisa ser revisada no servidor.",
        );
      } else if (
        status === 502 ||
        status === 503 ||
        codigo === "ia_provider" ||
        codigo === "ia_network"
      ) {
        setResultado(
          `🛠️ ${mensagemComSugestao || "O serviço de IA está temporariamente indisponível. Tente novamente em alguns segundos."}`,
        );
      } else if (status >= 500 || codigo === "erro_interno") {
        setResultado(
          `🛠️ ${mensagemComSugestao || "O servidor encontrou uma falha inesperada durante esta análise."}`,
        );
      } else if (mensagemComSugestao) {
        setResultado(`⚠️ ${mensagemComSugestao}`);
      } else {
        setResultado(
          "❌ A análise não foi concluída. Verifique o conteúdo, a conexão e tente novamente.",
        );
      }
      tocarSom("falsa");
    } finally {
      window.clearTimeout(timeoutId);
      setCarregando(false);
      setInicioAnaliseMs(null);
    }
  }

  function limpar() {
    tocarClique();
    setTexto("");
    setResultado("");
    setTextoEnviadoPreview("");
    setAvisoFerramenta("");
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

  const tempoAnaliseSegundos = Math.max(1, Math.ceil(tempoAnaliseMs / 1000));
  const textoPreviewAnalise = textoEnviadoPreview || textoLimpo;

  return (
    <main
      className={`checker-bg xo-main-page xo-page-mounted min-h-screen text-white ${menuAberto ? "menu-open" : ""}`}
    >
      {!menuAberto && (
        <button
          onClick={() => {
            tocarClique();
            setMenuAberto(true);
          }}
          className="floating-menu-btn floating-action"
          data-label="Menu"
          aria-label="Abrir menu"
        >
          ☰
        </button>
      )}

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

          <label className="settings-select-label">
            <span>🎨 Tema</span>
            <select
              className="settings-row theme-select"
              value={tema}
              onChange={(event) => {
                tocarClique();
                setTema(event.target.value as Tema);
              }}
              aria-label="Selecionar tema visual"
            >
              <option value="system">Automático — dispositivo</option>
              <option value="light">Claro — branco e azul</option>
              <option value="dark">Escuro — preto e azul</option>
            </select>
            <small>
              Atual:{" "}
              {tema === "system"
                ? `automático (${temaResolvido === "dark" ? "escuro" : "claro"})`
                : tema === "dark"
                  ? "escuro"
                  : "claro"}
            </small>
          </label>
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
              setLeitorAutomatico(!leitorAutomatico);
            }}
            className="settings-row"
          >
            {leitorAutomatico ? "📖 Leitura automática ligada" : "📖 Leitura automática"}
          </button>

          <button
            onClick={() => {
              tocarClique();
              if (leituraAtiva) pararLeitura();
              else lerEmVozAlta(resultado || texto || "Digite um texto ou gere uma análise para ouvir a leitura.");
            }}
            className="settings-row"
          >
            {leituraAtiva ? "⏹️ Parar leitura" : "🔊 Ler agora"}
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

          <details className="faq-item about-project">
            <summary>ℹ️ Sobre o projeto</summary>
            <div className="about-project-content">
              <p>
                O <strong>Xô, falsiane!</strong> é uma ferramenta educativa
                criada para ajudar pessoas a analisar perguntas, notícias
                escritas e links suspeitos com apoio de inteligência artificial.
              </p>
              <div className="about-project-grid">
                <article>
                  <strong>Objetivo</strong>
                  <span>
                    Estimular a checagem antes do compartilhamento e explicar
                    sinais comuns de desinformação.
                  </span>
                </article>
                <article>
                  <strong>Como funciona</strong>
                  <span>
                    O usuário envia um conteúdo, recebe uma análise organizada e
                    pode comparar o resultado com portais e fontes oficiais.
                  </span>
                </article>
                <article>
                  <strong>Space News</strong>
                  <span>
                    O jogo bônus transforma o combate à desinformação em uma
                    aventura espacial integrada ao detector.
                  </span>
                </article>
                <article>
                  <strong>Uso responsável</strong>
                  <span>
                    A IA auxilia, mas não substitui documentos oficiais,
                    especialistas ou uma pesquisa completa.
                  </span>
                </article>
              </div>
            </div>
          </details>

          <details className="faq-item trusted-portals">
            <summary>📰 Fontes para comparar informações</summary>
            <p>
              Nenhum portal é infalível. Compare a mesma informação em mais de
              uma fonte e procure documentos oficiais.
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

          {FAQ_ITEMS.map((item) => (
            <details className="faq-item" key={item.pergunta}>
              <summary>{item.pergunta}</summary>
              <p>{item.resposta}</p>
            </details>
          ))}
        </div>
      </aside>

      <div className="main-content xo-main-content">
        <section className="glass-panel xo-glass-panel w-full max-w-6xl rounded-3xl p-6 md:p-10 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20">
          <header className="text-center mb-10 header-enter xo-hero">
            <p className="xo-hero-kicker">Plataforma de verificação educacional</p>
            <h1 className="xo-hero-title">Xô, falsiane!</h1>
            <p className="xo-hero-description">
              Analise perguntas, textos e links com foco em contexto,
              clareza e checagem responsável.
            </p>
          </header>

          <section
            className="xo-intelligence-grid"
            aria-label="Camadas de análise do detector"
          >
            {XO_INTELLIGENCE_CARDS.map((card, index) => (
              <article
                className="xo-intelligence-card"
                key={card.title}
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <span>{card.icon}</span>
                <div>
                  <strong>{card.title}</strong>
                  <p>{card.text}</p>
                </div>
              </article>
            ))}
          </section>

          {!online && (
            <div className="xo-offline-banner" role="status">
              <strong>📡 Você está offline</strong>
              <span>
                A análise por IA ficará disponível quando a conexão voltar.
              </span>
            </div>
          )}

          {spaceSignal && (
            <section className="xo-space-card result-enter">
              <div className="xo-space-card-top">
                <span className="xo-space-card-tag">
                  TRANSMISSÃO INTERCEPTADA
                </span>
                <span className="xo-space-card-code">#{spaceSignal.code}</span>
              </div>
              <h2>Mensagem recebida da Space News</h2>
              <p>{spaceSignal.message}</p>
              <small>
                O detector entrou em modo temático. Você pode analisar essa
                transmissão ou editar o texto antes de enviar.
              </small>
            </section>
          )}

          <div className="xo-mode-grid">
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

          <section
            className={`work-card xo-work-card ${animacaoModo ? "mode-switch" : ""} ${carregando ? "is-submitting" : ""}`}
          >

            {isSpaceNewsInput && spaceSignalInTextbox && (
              <div className="xo-signal-banner">
                <div>
                  <strong>SINAL DA SPACE NEWS</strong>
                  <p>
                    O código #{spaceSignalInTextbox.code} será tratado com uma
                    resposta temática exclusiva.
                  </p>
                </div>
                <span>PROTOCOLO ATIVO</span>
              </div>
            )}

            <div
              className={`xo-input-inspector ${entradaFocada ? "is-focused" : ""} is-${qualidadeEntrada.level}`}
            >
              <div>
                <strong>{qualidadeEntrada.label}</strong>
                <span>{qualidadeEntrada.detail}</span>
              </div>
              <small>
                {texto.length.toLocaleString("pt-BR")} / 12.000 caracteres
              </small>
            </div>

            <textarea
              readOnly={carregando}
              value={texto}
              onFocus={() => setEntradaFocada(true)}
              onBlur={() => setEntradaFocada(false)}
              onChange={(e) => setTexto(e.target.value)}
              aria-label="Campo para inserir pergunta, notícia ou link"
              className={`main-textarea xo-main-textarea ${carregando ? "is-text-submitting" : ""}`}
              placeholder={
                modo === "pergunta"
                  ? "Faça sua pergunta aqui..."
                  : modo === "noticia"
                    ? "Cole a notícia aqui..."
                    : "Cole o link da notícia..."
              }
            />

            <div className="xo-quick-tools" aria-label="Ferramentas rápidas">
              <button
                type="button"
                className="xo-tool-button"
                onClick={detectarModoAutomatico}
              >
                <span aria-hidden="true">◎</span>
                Detectar modo
              </button>
              <button
                type="button"
                className="xo-tool-button"
                onClick={limparFormatacaoEntrada}
              >
                <span aria-hidden="true">⌁</span>
                Limpar conteúdo
              </button>
              <button
                type="button"
                className="xo-tool-button"
                onClick={colarDaAreaDeTransferencia}
              >
                <span aria-hidden="true">↧</span>
                Colar conteúdo
              </button>
              {avisoFerramenta && (
                <span className="xo-tool-notice">{avisoFerramenta}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 justify-center mt-6">
              <button
                onClick={analisar}
                disabled={carregando}
                className="primary-btn xo-primary-animated"
              >
                {carregando ? "Analisando..." : "Analisar"}
              </button>
              <button onClick={limpar} className="secondary-btn">
                Limpar
              </button>
            </div>

            {carregando && (
              <div
                className="xo-processing-card"
                role="status"
                aria-live="polite"
                aria-busy="true"
                data-stage={etapaAnalise}
              >
                <div className="xo-processing-topline">
                  <span>Verificação em andamento</span>
                  <strong>{tempoAnaliseSegundos}s</strong>
                </div>

                <div className="xo-processing-main">
                  <div className="xo-processing-copy">
                    <strong>{ANALYSIS_STEPS[etapaAnalise]}</strong>
                    <p>
                      A análise está aguardando o servidor, leitura de link/RSS
                      quando necessário e retorno do modelo. O painel acompanha a
                      requisição real sem inventar progresso.
                    </p>
                  </div>
                  <div className="xo-processing-signal" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>

                <div className="xo-processing-flow" aria-hidden="true">
                  {ANALYSIS_STEPS.map((step, index) => (
                    <span
                      key={step}
                      className={
                        index < etapaAnalise
                          ? "is-done"
                          : index === etapaAnalise
                            ? "is-active"
                            : ""
                      }
                    />
                  ))}
                </div>

                <div className="xo-processing-steps" aria-label="Etapas da análise">
                  {ANALYSIS_STEPS.map((step, index) => (
                    <div
                      key={step}
                      className={
                        index < etapaAnalise
                          ? "is-done"
                          : index === etapaAnalise
                            ? "is-active"
                            : ""
                      }
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{step}</strong>
                    </div>
                  ))}
                </div>

                <div className="xo-submitted-preview">
                  <span>Conteúdo enviado</span>
                  <p>{textoPreviewAnalise.slice(0, 240)}</p>
                </div>
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
                <div className="xo-result-actions">
                  <button
                    type="button"
                    onClick={() => (leituraAtiva ? pararLeitura() : lerEmVozAlta(resultado))}
                    className="copy-btn"
                  >
                    {leituraAtiva ? "Parar" : "Ouvir"}
                  </button>
                  <button onClick={copiarResultado} className="copy-btn">
                    {copiado ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-zinc-100">
                {resultado}
              </div>
            </section>
          )}

          <p className="xo-footer-note mt-8 text-xs text-zinc-500 text-center">
            Esta ferramenta auxilia na análise, mas não substitui checagem em
            fontes oficiais.
          </p>

          <footer className="mt-10 text-center text-zinc-400 text-sm xo-footer-box">
            <p>
              Criado por <span className="text-blue-400">VERIFIQUE.AI</span> •
              Projeto Xô, falsiane!
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
      <PWARegister />
      <FeedbackButton contexto="Xô, falsiane!" />
    </main>
  );
}
