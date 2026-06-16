import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const LEADERBOARD_KEY = "space-news:infinite:leaderboard:v1";
const MAX_STORED_ENTRIES = 100;

type LeaderboardEntry = {
  id: string;
  name: string;
  score: number;
  wave: number;
  createdAt: number;
};

async function redisCommand<T = unknown>(...command: Array<string | number>) {
  if (!REDIS_URL || !REDIS_TOKEN) {
    throw new Error("Leaderboard online não configurado.");
  }

  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command.map(String)),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Redis respondeu ${response.status}.`);
  }

  const data = (await response.json()) as { result?: T; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result as T;
}

function cleanName(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} _.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
}

function parseLeaderboard(raw: unknown) {
  const values = Array.isArray(raw) ? raw : [];
  const entries: LeaderboardEntry[] = [];

  for (let index = 0; index < values.length; index += 2) {
    try {
      const parsed = JSON.parse(String(values[index])) as LeaderboardEntry;
      if (
        parsed &&
        typeof parsed.id === "string" &&
        typeof parsed.name === "string" &&
        Number.isFinite(parsed.score) &&
        Number.isFinite(parsed.wave)
      ) {
        entries.push(parsed);
      }
    } catch {}
  }

  return entries
    .sort((a, b) => b.score - a.score || b.wave - a.wave || a.createdAt - b.createdAt)
    .slice(0, 10);
}

async function getTopEntries() {
  const result = await redisCommand<unknown[]>(
    "ZRANGE",
    LEADERBOARD_KEY,
    0,
    9,
    "REV",
    "WITHSCORES",
  );
  return parseLeaderboard(result);
}

export async function GET() {
  try {
    const entries = await getTopEntries();
    return NextResponse.json(
      { entries, online: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        entries: [],
        online: false,
        error: error instanceof Error ? error.message : "Leaderboard indisponível.",
      },
      { status: REDIS_URL && REDIS_TOKEN ? 500 : 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = cleanName(body.name);
    const score = Math.floor(Number(body.score));
    const wave = Math.floor(Number(body.wave));

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    }
    if (!Number.isFinite(score) || score < 1 || score > 50_000_000) {
      return NextResponse.json({ error: "Pontuação inválida." }, { status: 400 });
    }
    if (!Number.isFinite(wave) || wave < 1 || wave > 10_000) {
      return NextResponse.json({ error: "Wave inválida." }, { status: 400 });
    }

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientId = (forwardedFor || request.headers.get("x-real-ip") || "unknown")
      .replace(/[^a-zA-Z0-9:._-]/g, "")
      .slice(0, 80);
    const rateKey = `space-news:leaderboard:rate:${clientId}`;
    const attempts = Number(await redisCommand<number>("INCR", rateKey));
    if (attempts === 1) await redisCommand("EXPIRE", rateKey, 60);
    if (attempts > 8) {
      return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
    }

    const entry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      name,
      score,
      wave,
      createdAt: Date.now(),
    };

    // A pontuação composta mantém score como prioridade e usa wave como desempate.
    const redisScore = score * 100_000 + Math.min(wave, 99_999);
    await redisCommand("ZADD", LEADERBOARD_KEY, redisScore, JSON.stringify(entry));
    const storedCount = Number(await redisCommand<number>("ZCARD", LEADERBOARD_KEY));
    if (storedCount > MAX_STORED_ENTRIES) {
      await redisCommand("ZREMRANGEBYRANK", LEADERBOARD_KEY, 0, storedCount - MAX_STORED_ENTRIES - 1);
    }

    const entries = await getTopEntries();
    return NextResponse.json(
      { entries, online: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao registrar pontuação." },
      { status: REDIS_URL && REDIS_TOKEN ? 500 : 503 },
    );
  }
}
