import OpenAI from "openai";
import axios from "axios";
import * as cheerio from "cheerio";
import Parser from "rss-parser";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const parser = new Parser();

function limparTexto(texto: string) {
  return texto
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);
}

function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Tempo limite excedido")), ms)
    ),
  ]);
}

async function buscarRSS(texto: string) {
  try {
    const feed = await timeoutPromise(
      parser.parseURL(
        `https://news.google.com/rss/search?q=${encodeURIComponent(
          texto
        )}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
      ),
      7000
    );

    const contextoRSS = feed.items
      .slice(0, 8)
      .map((item, index) => {
        return `${index + 1}. ${item.title}
Fonte/Data: ${item.pubDate}
Link: ${item.link}`;
      })
      .join("\n\n");

    return contextoRSS || "Nenhuma notícia recente encontrada.";
  } catch {
    return "Não foi possível buscar notícias recentes.";
  }
}

async function gerarRespostaComRetry(messages: any[]) {
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    try {
      const resposta = await timeoutPromise(
        openai.chat.completions.create({
          model: "openrouter/free",
          temperature: 0,
          top_p: 0.15,
          frequency_penalty: 0,
          presence_penalty: 0,
          messages,
        }),
        25000
      );

      const conteudo = resposta.choices[0]?.message?.content;

      if (!conteudo) {
        throw new Error("Resposta vazia da IA");
      }

      return conteudo;
    } catch (erro) {
      console.error(`Erro na IA - tentativa ${tentativa}:`, erro);

      if (tentativa === 2) {
        return "Opa! 😅 Tivemos uma instabilidade ao gerar a análise.\n\nTente novamente em alguns segundos. Se continuar acontecendo, talvez o serviço de IA esteja instável no momento.";
      }
    }
  }

  return "Opa! 😅 Não foi possível gerar a análise agora.";
}
async function validarEntradaComIA(texto: string, modo: string) {
  const resposta = await gerarRespostaComRetry([
    {
      role: "system",
      content: `
Você é um filtro de entrada para uma ferramenta de checagem de informações.

Analise se a mensagem do usuário faz sentido para o modo escolhido.

Modos:
- pergunta: deve ser uma pergunta ou afirmação verificável.
- noticia: deve parecer uma notícia, relato informativo ou trecho jornalístico.
- link: deve ser uma URL válida de possível conteúdo informativo.

Responda SOMENTE com JSON puro, sem markdown:

{
  "valido": true ou false,
  "motivo": "explicação curta",
  "mensagemUsuario": "mensagem amigável se inválido"
}

Considere inválido:
- texto sem sentido;
- spam;
- conversa casual;
- poucas palavras sem informação verificável;
- conteúdo no modo errado;
- texto aleatório;
- piada sem afirmação verificável;
- pedido fora do objetivo do site.

Não seja rígido demais:
- perguntas curtas, mas verificáveis, são válidas.
- notícias sobre crimes, política, saúde, ciência ou acontecimentos são válidas.
`,
    },
    {
      role: "user",
      content: `
Modo escolhido: ${modo}
Mensagem: ${texto}
`,
    },
  ]);

  try {
    return JSON.parse(resposta);
  } catch {
    return {
      valido: false,
      motivo: "Não foi possível validar a entrada.",
      mensagemUsuario:
        "Opa! 😅 Não consegui entender se essa mensagem serve para análise.\n\nTente enviar uma pergunta, notícia ou link mais claro.",
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const textoRecebido =
      typeof body.texto === "string" ? body.texto.trim() : "";

    const modo =
      typeof body.modo === "string" ? body.modo.trim() : "";
      const validacao = await validarEntradaComIA(textoRecebido, modo);

if (!validacao.valido) {
  return Response.json({
    resposta:
      validacao.mensagemUsuario ||
      "Opa! 😅 Essa mensagem não parece adequada para esse modo de análise.",
  });
}
    if (!textoRecebido) {
      return Response.json({
        resposta:
          "Ei! 😅 Você precisa enviar uma pergunta, notícia ou link para eu analisar.",
      });
    }


    let textoUsuario = textoRecebido;
    let contextoRSS = "";
    let contexto = "";

    const formatoDinamico = `
    CONTEÚDO SENSÍVEL:
Você pode analisar notícias sobre crimes, mortes, acidentes, ataques ou violência de forma jornalística, neutra e educativa.

Não descreva violência de forma gráfica.
Não ensine como cometer crimes.
Não incentive violência.
Apenas analise credibilidade, fonte, contexto, sinais de fake news e recomendação.
IMPORTANTE:
Responda de forma organizada, visual e fácil de ler.

- NÃO use markdown
- NÃO use **
- NÃO use ##
- NÃO use ---
- NÃO use formatação markdown
- Responda apenas em texto puro
- Use apenas emojis, quebras de linha e listas simples

Use exatamente este estilo:

🧾 Classificação:
✅ Confiável / 🟡 Parcialmente Confiável / ❔ Não Confirmado / ⚠️ Suspeita / ❌ Falsa

🔍 Análise:
Explique em parágrafos curtos, com linguagem clara.

📌 Sinais encontrados:
- Use bullets curtos
- Destaque os principais pontos
- Não invente informações

✅ Recomendação:
Dê uma orientação final direta e útil.

REGRAS DE CLASSIFICAÇÃO:

- Use ❌ Falsa quando a afirmação contradiz um fato consolidado, histórico, científico, biográfico ou documental.
- Use ❌ Falsa quando houver contradição clara com fontes confiáveis ou fatos amplamente conhecidos.
- Use ⚠️ Suspeita quando houver sinais concretos de alerta, manipulação, fonte fraca ou inconsistência.
- Use ❔ Não Confirmado apenas quando a informação depende de notícia recente e não há confirmação suficiente.
- Use 🟡 Parcialmente Confiável quando parte da informação está correta, mas há exagero, contexto faltando ou detalhe errado.
- Use ✅ Confiável quando a informação é bem sustentada.

REGRA CRÍTICA:
Não confunda "não encontrei no RSS" com "não sei".
Fatos históricos, científicos e biográficos NÃO dependem de RSS.

Exemplos:
- "A Terra é plana?" → ❌ Falsa.
- "Uma notícia muito recente aconteceu?" sem confirmação suficiente → ❔ Não Confirmado.

Nunca invente fatos atuais.
Se não tiver certeza, diga claramente.
`;

    if (modo === "pergunta" || modo === "noticia") {
      contextoRSS = await buscarRSS(textoRecebido);
    }

    if (modo === "pergunta") {
      contexto = `
Você é um especialista em verificação de fatos e fake news.

O usuário fará uma pergunta direta.

Primeiro identifique o tipo da pergunta:
1. fato histórico;
2. fato científico;
3. dado biográfico;
4. acontecimento político atual;
5. notícia recente;
6. boato ou afirmação sem contexto.

Para fatos históricos, científicos e biográficos:
- use conhecimento consolidado;
- não dependa do RSS;
- classifique como falsa quando contradizer um fato bem estabelecido.

Para assuntos recentes:
- use o RSS como apoio;
- ausência de RSS não prova falsidade;
- se não houver confirmação suficiente, use ❔ Não Confirmado.

Se a pergunta for ampla, como "fulano foi preso?", explique o tipo de prisão:
- prisão preventiva;
- prisão temporária;
- prisão domiciliar;
- condenação definitiva;
- cumprimento de pena;
- detenção ou condução.

${formatoDinamico}
`;
    }

    else if (modo === "noticia") {
      contexto = `
      
Você é um especialista em identificação de fake news e desinformação.

Analise cuidadosamente a notícia enviada pelo usuário.

Use o RSS como apoio, mas não dependa apenas dele.

Verifique:
- sensacionalismo;
- fonte e autoria;
- erros de português;
- contexto e data;
- manipulação emocional;
- inconsistências;
- falta de provas;
- credibilidade geral;
- possibilidade de sátira ou humor.

Se a notícia for recente:
- seja conservador;
- não chame de falsa só por falta de confirmação;
- use ❔ Não Confirmado quando faltar confirmação;
- use ❌ Falsa apenas quando houver contradição clara ou informação incompatível com fatos confiáveis.

Se a notícia envolver crime, morte, ataque, acidente ou violência:
- não recuse automaticamente;
- trate como notícia jornalística;
- analise com linguagem neutra;
- evite detalhes gráficos;
- foque em verificação, contexto e confiabilidade.

${formatoDinamico}
`;
    }

    else if (modo === "link") {
      try {
        let url: URL;

        try {
          url = new URL(textoRecebido);
        } catch {
          return Response.json({
            resposta:
              "Opa! 😅 Isso não parece ser um link válido.\n\nTente enviar uma URL completa, começando com https://",
          });
        }

        const response = await timeoutPromise(
          axios.get(url.toString(), {
            timeout: 10000,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          }),
          12000
        );

        const $ = cheerio.load(response.data);

        $("script").remove();
        $("style").remove();
        $("nav").remove();
        $("footer").remove();

        const textoPagina = $("body").text();

        textoUsuario = limparTexto(textoPagina);

        if (!textoUsuario || textoUsuario.length < 120) {
          return Response.json({
            resposta:
              "Opa! 😅 Conseguimos abrir o link, mas não encontramos texto suficiente para analisar.\n\nTalvez o site bloqueie leitura automática ou seja uma página sem conteúdo jornalístico.",
          });
        }
      } catch (erro) {
        console.error("Erro ao ler link:", erro);

        return Response.json({
          resposta:
            "Opa! 😅 Não conseguimos acessar esse link.\n\nVerifique se ele está correto ou se o site permite leitura automática.",
        });
      }

      contexto = `
Você é um especialista em análise de fake news por link.

Você recebeu o texto extraído da página enviada pelo usuário.

Primeiro identifique se o conteúdo parece ser:
- notícia;
- matéria jornalística;
- artigo informativo;
- comunicado oficial;
- blog informativo.

Se NÃO parecer notícia ou conteúdo informativo:
responda apenas de forma natural e curta.

Exemplo:
"Opa! 😄 Esse site não parece ser um portal de notícias, então não dá pra fazer uma análise jornalística dele."

NÃO use classificação, sinais encontrados ou recomendação quando não for notícia.

Se parecer notícia ou conteúdo informativo, use o formato abaixo:

${formatoDinamico}
`;
    }

    const respostaFinal = await gerarRespostaComRetry([
      {
        role: "system",
        content: contexto,
      },
      {
        role: "user",
        content: `
Mensagem do usuário:
${textoRecebido}

Texto para análise:
${textoUsuario}

Notícias recentes via RSS:
${contextoRSS}
`,
      },
    ]);

    return Response.json({
      resposta: respostaFinal,
    });
  } catch (erro) {
    console.error("Erro geral na rota /api/analisar:", erro);

    return Response.json({
      resposta:
        "Opa! 😅 A análise falhou por instabilidade interna.\n\nTente novamente em alguns segundos.",
    });
  }
}