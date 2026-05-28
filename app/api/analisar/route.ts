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
✅ Confiável / 🟡 Parcialmente Confiável / ❔ Não Confirmado / ⚠️ Suspeita / ❌ Falsa

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
- Ausência de resultado no RSS NÃO significa que a informação é falsa.
- Se a informação for parcialmente confirmada, use "Parcialmente Confiável".
REGRA CRÍTICA:

- Nunca classifique uma notícia recente como "Possivelmente Falsa" apenas porque o RSS não encontrou confirmação.
- Se a notícia for recente e não houver dados suficientes, use "❔ Não Confirmado".
- Use "❌ Possivelmente Falsa" somente quando houver contradição clara, fonte falsa, manipulação evidente ou informação incompatível com fontes confiáveis.
- Use "⚠️ Suspeita" apenas quando houver sinais concretos de alerta.
- Ausência de fonte NÃO é prova de falsidade.

`;

  if (body.modo === "pergunta" || body.modo === "noticia") {
    try {
      const feed = await parser.parseURL(
        `https://news.google.com/rss/search?q=${encodeURIComponent(body.texto)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`
      );

      contextoRSS = feed.items
        .slice(0, 7)
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
  }

  if (body.modo === "pergunta") {
    contexto = `
Você é um especialista em verificação de fatos e fake news.

Use as notícias recentes via RSS apenas para assuntos atuais e acontecimentos recentes.

Para fatos históricos, científicos ou conhecimentos amplamente documentados:
- use conhecimento histórico consolidado;
- NÃO dependa do RSS;
- NÃO classifique como "Não Confirmado" sem motivo;
- responda com base em consenso histórico e científico.

IMPORTANTE:
Não confunda:
- ausência de notícia recente
com
- ausência de conhecimento histórico.

Perguntas históricas não precisam aparecer no RSS para serem verificáveis.

Se o assunto for atual:
- use o RSS como apoio;
- mas NÃO trate ausência de resultado como prova de falsidade.

Não invente fatos atuais.
Não classifique como falso apenas porque encontrou poucos resultados.
Se o RSS não trouxer resultados suficientes, diga que não é possível confirmar com segurança.
Não invente fatos atuais.
Não classifique como falso apenas porque encontrou poucos resultados.

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

Use também as notícias recentes via RSS como apoio.
Se houver notícia recente confirmando a informação, NÃO classifique como falsa.
Se o texto do usuário estiver parcialmente correto, use "Parcialmente Confiável" e explique o que precisa de ajuste.
Se o RSS não encontrar nada, diga que não foi possível confirmar com segurança, mas NÃO trate ausência de resultado como prova de falsidade.

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


Para notícias recentes:
- seja conservador;
- evite acusar falsidade sem prova;
- diferencie "não encontrei confirmação" de "é falso";
- quando houver dúvida, classifique como "Não Confirmado", não como falso.

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