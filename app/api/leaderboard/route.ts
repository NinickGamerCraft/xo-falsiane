import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// v4 reseta o ranking e passa a sobrescrever recorde por perfil local.
const LEADERBOARD_KEY = "space-news:infinite:leaderboard:v4";
const MAX_STORED_ENTRIES = 100;

const BLOCKED_INITIALS = new Set([
  "SEX", "XXX", "CUM", "ASS", "FUK", "FUC", "FCK", "DIC", "DCK", "TIT", "PUS", "COC", "PQP", "FDP", "BCT", "CUZ", "PUT", "PNC", "VTC", "FOD", "NIG", "FAG", "KYS", "NAZ", "KKK",
]);

const RESERVED_INITIALS = new Set(["ADM", "DEV", "MOD", "BOT", "SYS", "API", "CPU", "CEO", "STA"]);

type LeaderboardEntry = {
  id: string;
  profileId: string;
  name: string;
  score: number;
  wave: number;
  createdAt: number;
  updatedAt?: number;
};

type StoredLeaderboardEntry = LeaderboardEntry & { member: string };

async function redisCommand<T = unknown>(...command: Array<string | number>) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error("Leaderboard online não configurado.");

  const response = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command.map(String)),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Redis respondeu ${response.status}.`);
  const data = (await response.json()) as { result?: T; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result as T;
}

function normalizeInitials(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[\s._-]+/g, "");
}

function validateInitials(value: unknown) {
  const initials = normalizeInitials(value);
  if (!/^[A-Z]{3}$/.test(initials)) return { initials: "", error: "Use exatamente 3 letras de A a Z." };
  if (BLOCKED_INITIALS.has(initials)) return { initials: "", error: "Essas iniciais não são permitidas. Escolha outras 3 letras." };
  if (RESERVED_INITIALS.has(initials)) return { initials: "", error: "Essas iniciais são reservadas pelo sistema." };
  return { initials, error: "" };
}

function normalizeProfileId(value: unknown) {
  return String(value ?? "").replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 80);
}

function scoreFor(entry: Pick<LeaderboardEntry, "score" | "wave">) {
  return entry.score * 100_000 + Math.min(entry.wave, 99_999);
}

function parseLeaderboard(raw: unknown) {
  const values = Array.isArray(raw) ? raw : [];
  const entries: StoredLeaderboardEntry[] = [];

  for (let index = 0; index < values.length; index += 2) {
    const member = String(values[index] ?? "");
    try {
      const parsed = JSON.parse(member) as Partial<LeaderboardEntry>;
      const validation = validateInitials(parsed?.name);
      const profileId = normalizeProfileId(parsed?.profileId || parsed?.id);
      if (
        parsed &&
        typeof parsed.id === "string" &&
        profileId &&
        validation.initials &&
        Number.isFinite(parsed.score) &&
        Number.isFinite(parsed.wave)
      ) {
        entries.push({
          id: parsed.id,
          profileId,
          name: validation.initials,
          score: Math.floor(Number(parsed.score)),
          wave: Math.floor(Number(parsed.wave)),
          createdAt: Number(parsed.createdAt || Date.now()),
          updatedAt: parsed.updatedAt ? Number(parsed.updatedAt) : undefined,
          member,
        });
      }
    } catch {}
  }

  return entries.sort((a, b) => b.score - a.score || b.wave - a.wave || a.createdAt - b.createdAt);
}

async function getStoredEntries(start = 0, stop = 99) {
  const result = await redisCommand<unknown[]>("ZRANGE", LEADERBOARD_KEY, start, stop, "REV", "WITHSCORES");
  return parseLeaderboard(result);
}

async function getTopEntries() {
  return (await getStoredEntries(0, 9)).map(({ member: _member, ...entry }) => entry);
}

export async function GET() {
  try {
    const entries = await getTopEntries();
    return NextResponse.json({ entries, online: true, profileSynced: true, version: "v4" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ entries: [], online: false, error: error instanceof Error ? error.message : "Leaderboard indisponível." }, { status: REDIS_URL && REDIS_TOKEN ? 500 : 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const validation = validateInitials(body.name);
    const name = validation.initials;
    const profileId = normalizeProfileId(body.profileId);
    const score = Math.floor(Number(body.score));
    const wave = Math.floor(Number(body.wave));

    if (!profileId) return NextResponse.json({ error: "Perfil local ausente. Reabra o jogo e tente novamente." }, { status: 400 });
    if (!name) return NextResponse.json({ error: validation.error }, { status: 400 });
    if (!Number.isFinite(score) || score < 1 || score > 50_000_000) return NextResponse.json({ error: "Pontuação inválida." }, { status: 400 });
    if (!Number.isFinite(wave) || wave < 1 || wave > 10_000) return NextResponse.json({ error: "Wave inválida." }, { status: 400 });

    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const clientId = (forwardedFor || request.headers.get("x-real-ip") || "unknown").replace(/[^a-zA-Z0-9:._-]/g, "").slice(0, 80);
    const rateKey = `space-news:leaderboard:v4:rate:${clientId}`;
    const attempts = Number(await redisCommand<number>("INCR", rateKey));
    if (attempts === 1) await redisCommand("EXPIRE", rateKey, 60);
    if (attempts > 8) return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });

    const currentEntries = await getStoredEntries(0, MAX_STORED_ENTRIES - 1);
    const previous = currentEntries.find((entry) => entry.profileId === profileId);
    const better = !previous || score > previous.score || (score === previous.score && wave > previous.wave);

    if (previous && !better) {
      const entries = (await getTopEntries());
      return NextResponse.json({ entries, online: true, keptPrevious: true }, { headers: { "Cache-Control": "no-store" } });
    }

    if (previous?.member) await redisCommand("ZREM", LEADERBOARD_KEY, previous.member);

    const entry: LeaderboardEntry = {
      id: previous?.id || crypto.randomUUID(),
      profileId,
      name,
      score,
      wave,
      createdAt: previous?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await redisCommand("ZADD", LEADERBOARD_KEY, scoreFor(entry), JSON.stringify(entry));

    const storedCount = Number(await redisCommand<number>("ZCARD", LEADERBOARD_KEY));
    if (storedCount > MAX_STORED_ENTRIES) {
      await redisCommand("ZREMRANGEBYRANK", LEADERBOARD_KEY, 0, storedCount - MAX_STORED_ENTRIES - 1);
    }

    const entries = await getTopEntries();
    return NextResponse.json({ entries, online: true, profileSynced: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao registrar pontuação." }, { status: REDIS_URL && REDIS_TOKEN ? 500 : 503 });
  }
}
