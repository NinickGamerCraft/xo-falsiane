import OpenAI from "openai";
import axios from "axios";
import * as cheerio from "cheerio";
import Parser from "rss-parser";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const parser = new Parser();

export async function POST(req: Request) {
  const body = await req.json();

  let textoUsuario = body.texto;
  let contextoRSS = "";
  let contexto = "";

  const formatoDinamico = `
  IMPORTANTE:
  Responda de forma organizada, visual e fácil de ler.

- NÃO use markdown
- NÃO use **
- NÃO use ##
- NÃO use ---
- NÃO use formatação markdown
- Responda apenas em texto puro
- Use apenas emojis, quebras de linha e listas simples

Use este estilo:

🧾 Classificação:
✅ Confiável / ⚠️ Suspeita / ❌ Possivelmente Falsa

🚦 Nível de risco:
🟢 Baixo / 🟡 Médio / 🔴 Alto

🔍 Análise:
Explique em parágrafos curtos, com linguagem clara.

📌 Sinais encontrados:
- Use bullets curtos
- Destaque os principais pontos
- Não invente informações

✅ Recomendação:
Dê uma orientação final direta e útil.

Regras:
- Use emojis com moderação.
- Separe os blocos com linhas em branco.
- Não escreva tudo em um parágrafo só.
- Não invente fatos.
- Se não tiver certeza, diga isso claramente.
`;

  if (body.modo === "pergunta") {
    try {
      const feed = await parser.parseURL(
        `https://news.google.com/rss/search?q=${encodeURIComponent(body.texto)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
      );

      contextoRSS = feed.items
        .slice(0, 5)
        .map((item, index) => {
          return `${index + 1}. ${item.title}
Fonte/Data: ${item.pubDate}
Link: ${item.link}`;
        })
        .join("\n\n");

      if (!contextoRSS) {
        contextoRSS = "Nenhuma notícia recente encontrada.";
      }
    } catch {
      contextoRSS = "Não foi possível buscar notícias recentes.";
    }

    contexto = `
Você é um especialista em verificação de fatos e fake news.

Use as notícias recentes via RSS como base principal.
Se o RSS não trouxer resultados suficientes, diga que não é possível confirmar com segurança.
Não invente fatos atuais.

Atenção:
Se a pergunta for ampla, como "fulano foi preso?", explique com precisão o tipo de prisão:
- prisão preventiva
- prisão temporária
- prisão domiciliar
- condenação definitiva
- cumprimento de pena
- detenção ou condução

${formatoDinamico}
`;
  }

  else if (body.modo === "noticia") {
    contexto = `
Você é um especialista em identificação de fake news e desinformação.

Analise cuidadosamente a notícia enviada pelo usuário.

Verifique:
- títulos sensacionalistas;
- letras maiúsculas exageradas;
- excesso de exclamações;
- fonte e autoria;
- erros de português;
- contexto e data;
- manipulação emocional;
- inconsistências;
- falta de provas;
- credibilidade geral;
- possibilidade de sátira ou humor.

${formatoDinamico}
`;
  }

  else if (body.modo === "link") {
    try {
      const response = await axios.get(body.texto);
      const $ = cheerio.load(response.data);

      $("script").remove();
      $("style").remove();

      const textoPagina = $("body").text();

      textoUsuario = textoPagina
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);
    } catch {
      return Response.json({
        resposta:
          "Opa! 😅 Não conseguimos acessar esse link.\n\nVerifique se ele está correto ou se o site permite leitura automática.",
      });
    }

    contexto = `
Você é um especialista em análise de fake news por link.

Você recebeu o texto extraído da página enviada pelo usuário.

Primeiro, identifique se o conteúdo parece ser:
- notícia;
- matéria jornalística;
- artigo informativo;
- comunicado oficial;
- blog informativo.

Se NÃO parecer notícia ou conteúdo informativo:
responda apenas de forma natural e curta.

Exemplo:
"Opa! 😄 Esse site não parece ser um portal de notícias, então não dá pra fazer uma análise jornalística dele."

NÃO use classificação, risco ou sinais encontrados quando não for notícia.

Se parecer notícia ou conteúdo informativo, use o formato abaixo:

${formatoDinamico}
`;
  }

  const resposta = await openai.chat.completions.create({
    model: "openrouter/free",

    messages: [
      {
        role: "system",
        content: contexto,
      },
      {
        role: "user",
        content: `
Mensagem do usuário:
${body.texto}

Texto para análise:
${textoUsuario}

Notícias recentes via RSS:
${contextoRSS}
`,
      },
    ],
  });

  return Response.json({
    resposta: resposta.choices[0].message.content,
  });
}