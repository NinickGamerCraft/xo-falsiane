import { DurableObject } from "cloudflare:workers";

export interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  ALLOWED_ORIGIN?: string;
}

type GameMode = "localCoop" | "localPvp";
type PlayerSlot = 1 | 2 | 3 | 4;

type PlayerInput = {
  left?: boolean;
  right?: boolean;
  up?: boolean;
  down?: boolean;
  shot?: boolean;
  strong?: boolean;
  boost?: boolean;
  dodge?: boolean;
  pause?: boolean;
  pet?: boolean;
};

type PlayerSession = {
  id: string;
  slot: number;
  name: string;
  ready: boolean;
  device: string;
  connectedAt: number;
  lastSeen: number;
  input: Required<PlayerInput>;
  cosmetics?: Record<string, string>;
  profileColor?: string;
  profileSummary?: Record<string, unknown>;
  modeVote: GameMode;
};

type ServerPlayer = {
  id: string;
  slot: PlayerSlot;
  name: string;
  color: string;
  profileColor?: string;
  cosmetics?: Record<string, string>;
  profileSummary?: Record<string, unknown>;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  tilt: number;
  hp: number;
  maxHp: number;
  goldenHp: number;
  alive: boolean;
  invincibleUntil: number;
  dodgeUntil: number;
  boostUntil: number;
  boostVx: number;
  boostVy: number;
  normalCooldown: number;
  strongReadyAt: number;
  stretchUntil: number;
  stretchVx: number;
  stretchVy: number;
  wasMoving: boolean;
  lastInputX: number;
  lastInputY: number;
  lastMoveAngle: number;
  lastStretchAt: number;
  respawnAt: number;
  petCooldownUntil: number;
  petActiveUntil: number;
  input: Required<PlayerInput>;
};

type ServerShot = {
  id: number;
  ownerId: PlayerSlot;
  bornAt: number;
  stretchUntil: number;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  damage: number;
  type: "normal" | "strong";
  variant?: "normal" | "power" | "homing" | "powerHoming";
  vx: number;
  vy: number;
  life: number;
};

type ServerToken = {
  id: number;
  x: number; y: number; w: number; h: number;
  vx: number; vy: number;
  age: number; life: number;
  wavePhase: number; bornAt: number;
  value: number; frameOffset: number;
  pattern?: "line" | "zigzag" | "cross" | "triple" | "arc" | "burst";
  patternIndex?: number;
  targetSlot?: PlayerSlot;
  magnetDelay?: number;
  burst?: boolean;
};

type ServerPowerUp = {
  id: number;
  kind: "regen" | "fireRate" | "shield" | "powerShot" | "homingShot" | "flames" | "goldenHeart" | "randomBox";
  x: number; y: number; w: number; h: number;
  vx: number; vy: number;
  age: number; life: number; wavePhase: number; bornAt: number;
};


type ServerEnemy = {
  id: number;
  stretchUntil: number;
  kind: "red" | "black" | "purple" | "alien" | "asteroid" | "fragment";
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  age: number;
  waveBaseY: number;
  shotCooldown: number;
  windUpMs: number;
  isDashing: boolean;
  rotation?: number;
  rotationSpeed?: number;
  phase?: number;
  redStartY?: number;
  redTargetY?: number;
  redTravelTimeMs?: number;
  redDirection?: number;
  redBurstShotsLeft?: number;
  redBurstTimer?: number;
  redPauseTimer?: number;
  redHoldY?: number;
};

type OnlineVisualEvent = {
  id: number;
  kind: "sound" | "explosion" | "hit" | "shockwave" | "tokenBurst" | "bump";
  x?: number;
  y?: number;
  color?: string;
  amount?: number;
  sound?: string;
  volume?: number;
  category?: "menu" | "hit" | "ability" | "sfx";
  radius?: number;
  slot?: PlayerSlot;
  t?: number;
};

type ClientMessage =
  | { type: "join"; name?: string; device?: string; cosmetics?: Record<string, string>; profileColor?: string; profileSummary?: Record<string, unknown> }
  | { type: "profile"; name?: string; device?: string; cosmetics?: Record<string, string>; profileColor?: string; profileSummary?: Record<string, unknown> }
  | { type: "vote_mode"; mode?: GameMode }
  | { type: "start"; mode?: GameMode }
  | { type: "ready"; ready?: boolean }
  | { type: "input"; input?: PlayerInput; seq?: number; cosmetics?: Record<string, string>; profileColor?: string; profileSummary?: Record<string, unknown>; pet?: string }
  | { type: "sync"; snapshot?: Record<string, unknown> }
  | { type: "token_collect"; slot?: number; amount?: number }
  | { type: "coop_token_collect"; slot?: number; tokenIds?: number[]; amount?: number; seq?: number }
  | { type: "coop_token_spawn"; slot?: number; tokens?: Record<string, unknown>[]; seq?: number }
  | { type: "coop_powerup_spawn"; slot?: number; power?: Record<string, unknown>; seq?: number }
  | { type: "coop_powerup_collect"; slot?: number; kind?: string; powerId?: number; seq?: number }
  | { type: "coop_pet_ability"; slot?: number; pet?: string; seq?: number }
  | { type: "coop_revive"; slot?: number; seq?: number }
  | { type: "coop_wave_start"; slot?: number; wave?: number; seed?: number; seq?: number }
  | { type: "coop_enemy_spawn"; slot?: number; enemies?: Record<string, unknown>[]; seq?: number }
  | { type: "coop_world_resync"; slot?: number; world?: Record<string, unknown>; seq?: number }
  | { type: "pause_request" }
  | { type: "pause_ready"; ready?: boolean }
  | { type: "ping"; t?: number }
  | { type: "lobby_return_request" }
  | { type: "leave" };

const EMPTY_INPUT: Required<PlayerInput> = {
  left: false,
  right: false,
  up: false,
  down: false,
  shot: false,
  strong: false,
  boost: false,
  dodge: false,
  pause: false,
  pet: false,
};

const VALID_MODES: GameMode[] = ["localCoop"];
const CANVAS_W = 1280;
const CANVAS_H = 720;
const PLAYER_W = 170;
const PLAYER_H = 100;
const MAX_HP = 5;
const ACCEL = 0.36;
const FRICTION = 0.94;
const MAX_SPEED_X = 7.5;
const MAX_SPEED_Y = 6.8;
const NORMAL_COOLDOWN = 300;
const STRONG_COOLDOWN = 8000;
const DODGE_COOLDOWN = 720;
const TOKEN_SPAWN_MS = 7200;
const POWERUP_SPAWN_MS = 11000;
const SERVER_TICK_MS = 1000 / 60;
const SNAPSHOT_EVERY_TICKS = 1;

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      ...init.headers,
    },
  });
}

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function cleanRoomCode(value: string | null) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

function cleanName(value: unknown, fallback: string) {
  const name = String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}0-9 _.-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  return name.length >= 2 ? name : fallback;
}

function cleanMode(value: unknown): GameMode {
  return VALID_MODES.includes(value as GameMode) ? (value as GameMode) : "localCoop";
}

function normalizeInput(input: PlayerInput | undefined): Required<PlayerInput> {
  return {
    left: Boolean(input?.left),
    right: Boolean(input?.right),
    up: Boolean(input?.up),
    down: Boolean(input?.down),
    shot: Boolean(input?.shot),
    strong: Boolean(input?.strong),
    boost: Boolean(input?.boost),
    dodge: Boolean(input?.dodge),
    pause: Boolean(input?.pause),
    pet: Boolean(input?.pet),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function websocketUrl(request: Request, room: string) {
  const url = new URL(request.url);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `/room/${room}/ws`;
  url.search = "";
  return url.toString();
}

async function roomFetch(env: Env, room: string, path: string, init?: RequestInit) {
  const id = env.GAME_ROOM.idFromName(room);
  const stub = env.GAME_ROOM.get(id);
  return stub.fetch(new Request(`https://space-news.local/room/${room}${path}`, init));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return json({ ok: true });

    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "Space News Online", version: "2.5.3-pets-shop", netModel: "dual-sim-pets-shop-profile-v253" });
    }

    if (url.pathname === "/create") {
      for (let attempt = 0; attempt < 8; attempt++) {
        const room = randomRoomCode();
        const created = await roomFetch(env, room, "/create", { method: "POST" });
        if (created.ok) return json({ room, wsUrl: websocketUrl(request, room) });
      }
      return json({ error: "Não consegui gerar sala." }, { status: 500 });
    }

    if (url.pathname === "/check") {
      const room = cleanRoomCode(url.searchParams.get("room"));
      if (!room) return json({ exists: false, room: "" });
      const response = await roomFetch(env, room, "/check");
      const data = await response.json().catch(() => ({ exists: false }));
      return json({ room, exists: Boolean((data as { exists?: boolean }).exists) });
    }

    const match = url.pathname.match(/^\/room\/([A-Z0-9]{3,12})\/ws$/i);
    if (match) {
      const room = cleanRoomCode(match[1]);
      const id = env.GAME_ROOM.idFromName(room);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }

    return json({ error: "Rota não encontrada." }, { status: 404 });
  },
};

export class GameRoom extends DurableObject<Env> {
  private sessions = new Map<WebSocket, PlayerSession>();
  private roomCode = "ROOM";
  private pauseRequestedBy: number | null = null;
  private pauseReadySlots = new Set<number>();
  private pauseCommitted = false;
  private gameActive = false;
  private selectedGameMode: GameMode = "localCoop";
  private hostSlot = 1;
  private serverTick = 0;
  private matchSeed = 0;
  private lastTickAt = 0;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private playersState = new Map<number, ServerPlayer>();
  private shots: ServerShot[] = [];
  private tokens: ServerToken[] = [];
  private powerUps: ServerPowerUp[] = [];
  private enemies: ServerEnemy[] = [];
  private tokenId = 1;
  private powerUpId = 1;
  private enemyId = 1;
  private nextTokenSpawnAt = 0;
  private nextPowerUpSpawnAt = 0;
  private nextEnemyWaveAt = 0;
  private waveNumber = 1;
  private scores = new Map<number, number>();
  private activeVersusSlots: PlayerSlot[] = [];
  private visualEvents: OnlineVisualEvent[] = [];
  private visualEventId = 0;
  private shotId = 1;
  private lastInputSeqBySlot = new Map<number, number>();
  private pendingDisconnectTimers = new Map<number, ReturnType<typeof setTimeout>>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    for (const ws of ctx.getWebSockets()) {
      const session = ws.deserializeAttachment() as PlayerSession | undefined;
      if (session) this.sessions.set(ws, session);
    }
  }

  private ensureHost() {
    const slots = [...this.sessions.values()].map((s) => s.slot).filter((slot) => slot > 0).sort((a, b) => a - b);
    if (!slots.includes(this.hostSlot)) this.hostSlot = slots[0] || 1;
    return this.hostSlot;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const roomMatch = url.pathname.match(/^\/room\/([A-Z0-9]{3,12})(?:\/ws|\/create|\/check)?$/i);
    this.roomCode = cleanRoomCode(roomMatch?.[1] || "ROOM") || "ROOM";

    if (url.pathname.endsWith("/create")) {
      const alreadyCreated = await this.ctx.storage.get<boolean>("created");
      if (alreadyCreated) return json({ ok: false, exists: true }, { status: 409 });
      await this.ctx.storage.put("created", true);
      await this.ctx.storage.put("createdAt", Date.now());
      await this.ctx.storage.put("selectedMode", "localCoop");
      return json({ ok: true, room: this.roomCode });
    }

    if (url.pathname.endsWith("/check")) {
      const exists = Boolean(await this.ctx.storage.get<boolean>("created"));
      return json({ exists, room: this.roomCode, players: this.players().length });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ error: "Use WebSocket nesta rota." }, { status: 426 });
    }

    const created = Boolean(await this.ctx.storage.get<boolean>("created"));
    if (!created) return json({ error: "Sala não existe." }, { status: 404 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];

    const placeholder: PlayerSession = {
      id: crypto.randomUUID(),
      slot: 0,
      name: "---",
      ready: false,
      device: "unknown",
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      input: { ...EMPTY_INPUT },
      modeVote: "localCoop",
    };

    server.serializeAttachment(placeholder);
    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, placeholder);
    server.send(JSON.stringify({ type: "hello", room: this.roomCode, netModel: "dual-sim-pets-shop-profile-v253" }));
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== "string") return;
    let msg: ClientMessage;
    try { msg = JSON.parse(raw) as ClientMessage; } catch { ws.send(JSON.stringify({ type: "error", error: "JSON inválido." })); return; }

    const session = this.sessions.get(ws) || (ws.deserializeAttachment() as PlayerSession | undefined);
    if (!session) return;
    session.lastSeen = Date.now();

    if (msg.type === "join") {
      if (session.slot === 0) {
        const used = new Set([...this.sessions.values()].map((s) => s.slot).filter(Boolean));
        const slot = [1, 2, 3, 4].find((n) => !used.has(n));
        if (!slot) { ws.send(JSON.stringify({ type: "error", error: "Sala cheia." })); ws.close(1008, "Sala cheia"); return; }
        session.slot = slot;
      }
      const requestedName = cleanName(msg.name, `P${session.slot}`);
      const duplicatedName = [...this.sessions.values()].some((other) => other.id !== session.id && cleanName(other.name, "").toUpperCase() === requestedName.toUpperCase());
      if (duplicatedName) {
        ws.send(JSON.stringify({ type: "error", error: "Nome já está em uso nesta sala." }));
        ws.send(JSON.stringify({ type: "name_rejected", reason: "duplicate", name: requestedName }));
        return;
      }
      session.name = requestedName;
      session.device = String(msg.device || "unknown").slice(0, 32);
      if (msg.cosmetics && typeof msg.cosmetics === "object") session.cosmetics = msg.cosmetics;
      if (typeof msg.profileColor === "string") session.profileColor = msg.profileColor.slice(0, 24);
      if (msg.profileSummary && typeof msg.profileSummary === "object") session.profileSummary = this.sanitizeProfileSummary(msg.profileSummary);
      ws.serializeAttachment(session);
      this.sessions.set(ws, session);
      this.ensureHost();
      this.syncSessionToState(session);
      ws.send(JSON.stringify({ type: "joined", room: this.roomCode, player: this.publicPlayer(session), slot: session.slot, netModel: "dual-sim-pets-shop-profile-v253" }));
      this.broadcast({ type: "player_joined", room: this.roomCode, player: this.publicPlayer(session), t: Date.now() }, ws);
      this.broadcastState();
      return;
    }

    if (msg.type === "profile") {
      if (msg.name) {
        const requestedName = cleanName(msg.name, session.name || `P${session.slot}`);
        const duplicatedName = [...this.sessions.values()].some((other) => other.id !== session.id && cleanName(other.name, "").toUpperCase() === requestedName.toUpperCase());
        if (duplicatedName) {
          ws.send(JSON.stringify({ type: "error", error: "Nome já está em uso nesta sala." }));
          ws.send(JSON.stringify({ type: "name_rejected", reason: "duplicate", name: requestedName }));
          return;
        }
        session.name = requestedName;
      }
      if (msg.device) session.device = String(msg.device || "unknown").slice(0, 32);
      if (msg.cosmetics && typeof msg.cosmetics === "object") session.cosmetics = msg.cosmetics;
      if (typeof msg.profileColor === "string") session.profileColor = msg.profileColor.slice(0, 24);
      if (msg.profileSummary && typeof msg.profileSummary === "object") session.profileSummary = this.sanitizeProfileSummary(msg.profileSummary);
      ws.serializeAttachment(session);
      this.sessions.set(ws, session);
      this.syncSessionToState(session);
      this.broadcastState();
      return;
    }

    if (msg.type === "ready") {
      session.ready = Boolean(msg.ready);
      ws.serializeAttachment(session);
      this.broadcast({ type: "ready_changed", room: this.roomCode, slot: session.slot, ready: session.ready, t: Date.now() });
      this.broadcastState();
      return;
    }

    if (msg.type === "vote_mode") {
      const players = this.players();
      const readyForMode = players.length >= 2 && players.every((p) => p.ready);
      if (!readyForMode) { ws.send(JSON.stringify({ type: "error", error: "A votação libera quando todos estiverem READY." })); return; }
      session.modeVote = "localCoop";
      ws.serializeAttachment(session);
      this.selectedGameMode = this.selectedMode();
      this.broadcastState();
      return;
    }

    if (msg.type === "start") {
      const players = this.players();
      const canStart = players.length >= 2 && players.every((p) => p.ready);
      if (!canStart) { ws.send(JSON.stringify({ type: "error", error: "Aguarde todos ficarem READY." })); return; }
      this.selectedGameMode = "localCoop";
      this.startMatch(this.selectedGameMode);
      const netModel = "dual-sim-pets-shop-profile-v253";
      // Together não usa mais host-authoritative pesado: cada cliente roda sua simulação local,
      // enquanto o Worker ordena inputs/eventos determinísticos para manter power-ups, moedas e waves iguais.
      const startHostSlot = this.selectedGameMode === "localCoop" ? 0 : 0;
      this.broadcast({ type: "game_start", room: this.roomCode, mode: this.selectedGameMode, hostSlot: startHostSlot, t: Date.now(), netModel, seed: this.matchSeed });
      this.broadcastState();
      return;
    }

    if (msg.type === "input") {
      if (session.slot <= 0) return;
      const seq = Math.max(0, Math.floor(Number(msg.seq || 0)));
      const lastSeq = this.lastInputSeqBySlot.get(session.slot) || 0;
      if (seq && seq < lastSeq) return;
      if (seq) this.lastInputSeqBySlot.set(session.slot, seq);
      session.input = normalizeInput(msg.input);
      if (msg.cosmetics && typeof msg.cosmetics === "object") session.cosmetics = msg.cosmetics;
      if (typeof msg.profileColor === "string") session.profileColor = msg.profileColor.slice(0, 24);
      if (msg.profileSummary && typeof msg.profileSummary === "object") session.profileSummary = this.sanitizeProfileSummary(msg.profileSummary);
      ws.serializeAttachment(session);
      this.syncSessionToState(session);
      if (this.gameActive && this.selectedGameMode === "localCoop") {
        // v2.4.8: inputs são relayados para todos; cada tela simula localmente com a mesma base.
        this.broadcast({
          type: "input",
          from: session.slot,
          seq,
          input: session.input,
          cosmetics: session.cosmetics,
          profileColor: session.profileColor,
          profileSummary: session.profileSummary,
          t: Date.now(),
          serverTick: this.serverTick,
          netModel: "dual-sim-pets-shop-profile-v253",
        }, ws);
      }
      return;
    }

    if (msg.type === "sync") {
      // v2.4.8: Together não aceita snapshot de player/host.
      // Isso remove o efeito do P2 sendo puxado para trás. O sync do coop é por input + eventos.
      if (this.selectedGameMode === "localCoop") return;
      return;
    }

    if (msg.type === "token_collect") {
      // Token do perfil continua local/cliente; não relaya para evitar duplicar recompensa.
      return;
    }

    if (msg.type === "coop_token_collect") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || session.slot || 0);
      if (slot !== session.slot || slot < 1 || slot > 4) return;
      const tokenIds = Array.isArray(msg.tokenIds)
        ? msg.tokenIds.map((id) => Math.floor(Number(id))).filter((id) => Number.isFinite(id) && id > 0).slice(0, 16)
        : [];
      this.broadcast({ type: "coop_token_collect", room: this.roomCode, from: session.slot, slot, tokenIds, amount: Math.max(0, Math.floor(Number(msg.amount || 0))), seq: Number(msg.seq || 0), t: Date.now(), netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "coop_token_spawn") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || session.slot || 0);
      if (slot !== session.slot || slot < 1 || slot > 4) return;
      const tokens = Array.isArray(msg.tokens) ? msg.tokens.slice(0, 20) : [];
      this.broadcast({ type: "coop_token_spawn", room: this.roomCode, from: session.slot, slot, tokens, seq: Number(msg.seq || 0), t: Date.now(), netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "coop_powerup_spawn") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || session.slot || 0);
      if (slot !== session.slot || slot < 1 || slot > 4 || !msg.power || typeof msg.power !== "object") return;
      this.broadcast({ type: "coop_powerup_spawn", room: this.roomCode, from: session.slot, slot, power: msg.power, seq: Number(msg.seq || 0), t: Date.now(), netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "coop_powerup_collect") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || session.slot || 0);
      const kind = String(msg.kind || "");
      if (slot !== session.slot || slot < 1 || slot > 4 || !kind) return;
      this.broadcast({ type: "coop_powerup_collect", room: this.roomCode, from: session.slot, slot, kind, powerId: Number(msg.powerId || 0), seq: Number(msg.seq || 0), t: Date.now(), netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "coop_pet_ability") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || session.slot || 0);
      const pet = String(msg.pet || "").slice(0, 48);
      if (slot !== session.slot || slot < 1 || slot > 4 || !pet) return;
      this.broadcast({ type: "coop_pet_ability", room: this.roomCode, from: session.slot, slot, pet, seq: Number(msg.seq || 0), t: Date.now(), netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "coop_revive") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || 0);
      if (slot < 1 || slot > 4) return;
      this.broadcast({ type: "coop_revive", room: this.roomCode, from: session.slot, slot, seq: Number(msg.seq || 0), t: Date.now(), netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "coop_wave_start") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || session.slot || 0);
      if (slot !== session.slot || slot < 1 || slot > 4) return;
      this.broadcast({ type: "coop_wave_start", room: this.roomCode, from: session.slot, slot, wave: Math.max(1, Math.floor(Number(msg.wave || 1))), seed: Number(msg.seed || this.matchSeed || 0), seq: Number(msg.seq || 0), t: Date.now(), serverTick: this.serverTick, netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "coop_enemy_spawn") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || session.slot || 0);
      if (slot !== session.slot || slot < 1 || slot > 4) return;
      const enemies = Array.isArray(msg.enemies) ? msg.enemies.slice(0, 16) : [];
      this.broadcast({ type: "coop_enemy_spawn", room: this.roomCode, from: session.slot, slot, enemies, seq: Number(msg.seq || 0), t: Date.now(), serverTick: this.serverTick, netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "coop_world_resync") {
      if (this.selectedGameMode !== "localCoop") return;
      const slot = Number(msg.slot || session.slot || 0);
      if (slot !== session.slot || slot < 1 || slot > 4 || !msg.world || typeof msg.world !== "object") return;
      this.broadcast({ type: "coop_world_resync", room: this.roomCode, from: session.slot, slot, world: msg.world, seq: Number(msg.seq || 0), t: Date.now(), serverTick: this.serverTick, netModel: "dual-sim-pets-shop-profile-v253" }, ws);
      return;
    }

    if (msg.type === "pause_request") {
      if (session.slot === 0) return;
      if (!this.pauseRequestedBy) { this.pauseRequestedBy = session.slot; this.pauseCommitted = false; this.pauseReadySlots.clear(); }
      this.pauseReadySlots.add(session.slot);
      this.broadcastPauseState();
      const players = this.players();
      const allReady = players.length > 0 && players.every((p) => this.pauseReadySlots.has(p.slot));
      if (allReady && !this.pauseCommitted) { this.pauseCommitted = true; this.broadcast({ type: "pause_commit", room: this.roomCode, requestedBy: this.pauseRequestedBy, readySlots: [...this.pauseReadySlots], t: Date.now() }); }
      return;
    }

    if (msg.type === "pause_ready") {
      if (session.slot === 0 || !this.pauseRequestedBy) return;
      if (msg.ready === false) this.pauseReadySlots.delete(session.slot); else this.pauseReadySlots.add(session.slot);
      this.broadcastPauseState();
      const players = this.players();
      const allReady = players.length > 0 && players.every((p) => this.pauseReadySlots.has(p.slot));
      if (allReady && !this.pauseCommitted) { this.pauseCommitted = true; this.broadcast({ type: "pause_commit", room: this.roomCode, requestedBy: this.pauseRequestedBy, readySlots: [...this.pauseReadySlots], t: Date.now() }); }
      else if (allReady && this.pauseCommitted) { this.pauseRequestedBy = null; this.pauseCommitted = false; this.pauseReadySlots.clear(); this.broadcast({ type: "unpause_start", room: this.roomCode, t: Date.now() }); }
      return;
    }

    if (msg.type === "ping") { ws.send(JSON.stringify({ type: "pong", t: msg.t ?? Date.now(), serverTime: Date.now() })); return; }

    if (msg.type === "lobby_return_request") {
      this.stopMatch();
      this.broadcast({ type: "lobby_return", room: this.roomCode, requestedBy: session.slot, t: Date.now() });
      this.broadcastState();
      return;
    }

    if (msg.type === "leave") ws.close(1000, "Saiu da sala");
  }

  private startMatch(mode: GameMode) {
    this.stopTickTimer();
    this.gameActive = true;
    this.selectedGameMode = mode;
    this.serverTick = 0;
    this.matchSeed = Math.floor(Date.now() % 2147483647);
    this.lastTickAt = Date.now();
    this.shots = [];
    this.tokens = [];
    this.powerUps = [];
    this.enemies = [];
    this.tokenId = 1;
    this.powerUpId = 1;
    this.enemyId = 1;
    this.waveNumber = 0;
    this.nextTokenSpawnAt = Date.now() + 5200;
    this.nextPowerUpSpawnAt = Date.now() + 7500;
    this.nextEnemyWaveAt = mode === "localCoop" ? Date.now() + 1200 : Number.MAX_SAFE_INTEGER;
    this.scores.clear();
    this.playersState.clear();
    this.visualEvents = [];
    this.visualEventId = 0;
    this.shotId = 1;
    const players = this.players();
    this.activeVersusSlots = mode === "localPvp" ? players.slice(0, 2).map((p) => p.slot as PlayerSlot) : players.map((p) => p.slot as PlayerSlot);
    const count = Math.max(2, players.length);
    for (const pub of players) {
      const session = [...this.sessions.values()].find((s) => s.slot === pub.slot);
      const idx = Math.max(0, pub.slot - 1);
      const leftSide = idx % 2 === 0;
      const row = Math.floor(idx / 2);
      const player: ServerPlayer = {
        id: pub.id,
        slot: pub.slot as PlayerSlot,
        name: pub.name,
        color: pub.profileColor || ["#60a5fa", "#f97316", "#22c55e", "#e879f9"][idx] || "#60a5fa",
        profileColor: pub.profileColor,
        cosmetics: pub.cosmetics,
        x: leftSide ? 130 : CANVAS_W - PLAYER_W - 130,
        y: count <= 2 ? CANVAS_H / 2 - PLAYER_H / 2 : 210 + row * 170,
        w: PLAYER_W,
        h: PLAYER_H,
        vx: 0,
        vy: 0,
        tilt: 0,
        hp: (mode === "localPvp" && !this.activeVersusSlots.includes(pub.slot as PlayerSlot)) ? 0 : MAX_HP,
        maxHp: MAX_HP,
        goldenHp: 0,
        alive: mode === "localPvp" ? this.activeVersusSlots.includes(pub.slot as PlayerSlot) : true,
        invincibleUntil: Date.now() + 1400,
        dodgeUntil: 0,
        boostUntil: 0,
        boostVx: 0,
        boostVy: 0,
        normalCooldown: 0,
        strongReadyAt: Date.now() + 1000,
        stretchUntil: 0,
        stretchVx: 0,
        stretchVy: 0,
        wasMoving: false,
        lastInputX: 0,
        lastInputY: 0,
        lastMoveAngle: 0,
        lastStretchAt: 0,
        respawnAt: (mode === "localPvp" && !this.activeVersusSlots.includes(pub.slot as PlayerSlot)) ? Number.MAX_SAFE_INTEGER : 0,
        petCooldownUntil: 0,
        petActiveUntil: 0,
        input: session?.input || { ...EMPTY_INPUT },
      };
      this.playersState.set(player.slot, player);
      this.scores.set(player.slot, 0);
    }
    this.startTickTimer();
  }

  private stopMatch() {
    this.gameActive = false;
    this.stopTickTimer();
    this.playersState.clear();
    this.shots = [];
    this.tokens = [];
    this.powerUps = [];
    this.visualEvents = [];
    this.activeVersusSlots = [];
  }

  private startTickTimer() {
    this.stopTickTimer();
    this.tickTimer = setInterval(() => this.tick(), SERVER_TICK_MS);
  }

  private stopTickTimer() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    this.tickTimer = null;
  }

  private syncSessionToState(session: PlayerSession) {
    const player = this.playersState.get(session.slot);
    if (!player) return;
    player.name = session.name;
    player.input = session.input;
    player.cosmetics = session.cosmetics;
    player.profileColor = session.profileColor;
    player.color = session.profileColor || player.color;
  }

  private tick() {
    if (!this.gameActive) return;
    const now = Date.now();
    const dtMs = Math.min(66, Math.max(8, now - (this.lastTickAt || now)));
    this.lastTickAt = now;
    const step = dtMs / 16.67;
    this.serverTick += 1;

    if (this.selectedGameMode === "localCoop") {
      // v2.4.8: Together online é dual-sim/event-sync.
      // O Worker não corrige posição de player; só ordena inputs e eventos do mundo.
      if (this.serverTick % 18 === 0) {
        this.broadcast({ type: "heartbeat", room: this.roomCode, serverTick: this.serverTick, t: now, netModel: "dual-sim-pets-shop-profile-v253" });
      }
      return;
    }

    this.spawnAmbientPickups(now);
    this.updatePlayers(now, step);
    this.updateShots(now, step);
    this.updatePickups(now, step);
    this.resolvePlayerBumps(now);
    this.resolveShotHits(now);
    this.resolveShotHitsEnemies(now);
    this.resolveEnemyContact(now);
    this.resolvePickupCollect(now);
    this.visualEvents = this.visualEvents.filter((event) => now - (event.t || now) < 1200).slice(-36);
    if (this.serverTick % SNAPSHOT_EVERY_TICKS === 0) this.broadcastSnapshot();
  }

  private petId(p: ServerPlayer) {
    return String(p.cosmetics?.pet || "");
  }

  private petBuffs(p: ServerPlayer) {
    const pet = this.petId(p);
    const buffs = { speed: 0, shotSpeed: 0, damage: 0, tokenBonus: 0, maxHp: 0 };
    if (pet === "pet-blue-comet") { buffs.speed += 0.025; buffs.shotSpeed += 0.025; }
    if (pet === "pet-red-jumper") { buffs.damage += 0.025; buffs.tokenBonus += 0.025; }
    if (pet === "pet-star") buffs.speed += 0.02;
    if (pet === "pet-comet") { buffs.maxHp += 1; buffs.speed -= 0.02; }
    if (pet === "pet-black-hole") { buffs.damage += 0.04; buffs.speed -= 0.03; }
    if (pet === "pet-earth") buffs.maxHp += 1;
    if (pet === "pet-white-hole") { buffs.speed += 0.03; buffs.damage -= 0.02; }
    if (pet === "pet-wormhole") { buffs.speed += 0.03; buffs.shotSpeed += 0.03; buffs.maxHp -= 1; }
    if (pet === "pet-milky-way") { buffs.speed += 0.015; buffs.damage += 0.02; buffs.tokenBonus += 0.03; }
    if (p.cosmetics?.middle === "middle-extra-arms") { buffs.shotSpeed += 0.1; buffs.speed -= 0.04; buffs.maxHp += 1; }
    return buffs;
  }

  private spawnAmbientPickups(now: number) {
    // Versus: tokens/power-ups só aparecem por dano, igual o pedido. Together: spawns naturais.
    if (this.selectedGameMode === "localCoop" && now >= this.nextTokenSpawnAt && this.tokens.length < 28) {
      this.spawnTokenWave(now);
      this.nextTokenSpawnAt = now + TOKEN_SPAWN_MS + Math.floor(Math.random() * 3600);
    }
    if (this.selectedGameMode === "localCoop" && now >= this.nextPowerUpSpawnAt && this.powerUps.length < 4) {
      this.spawnPowerUp(now);
      this.nextPowerUpSpawnAt = now + POWERUP_SPAWN_MS + Math.floor(Math.random() * 6500);
    }
  }

  private spawnTokenWave(now: number) {
    const patterns = ["line", "zigzag", "triple", "cross", "arc"] as const;
    const pattern = patterns[Math.floor(Math.random() * patterns.length)] || "line";
    const startX = CANVAS_W + 48;
    const baseY = 130 + Math.random() * (CANVAS_H - 260);
    const points: Array<{ x: number; y: number }> = [];
    if (pattern === "line") {
      for (let i = 0; i < 8; i++) points.push({ x: startX + i * 42, y: baseY });
    } else if (pattern === "zigzag") {
      for (let i = 0; i < 9; i++) points.push({ x: startX + i * 40, y: clamp(baseY + (i % 2 ? 30 : -30), 70, CANVAS_H - 80) });
    } else if (pattern === "triple") {
      for (let i = 0; i < 5; i++) for (const off of [-48, 0, 48]) points.push({ x: startX + i * 44, y: clamp(baseY + off, 70, CANVAS_H - 80) });
    } else if (pattern === "cross") {
      for (let i = 0; i < 5; i++) { points.push({ x: startX + i * 46, y: baseY }); points.push({ x: startX + 92, y: clamp(baseY + (i - 2) * 38, 70, CANVAS_H - 80) }); }
    } else {
      for (let i = 0; i < 8; i++) { const t = i / 7; points.push({ x: startX + i * 40, y: clamp(baseY - Math.sin(t * Math.PI) * 58 + 20, 70, CANVAS_H - 80) }); }
    }
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      this.tokens.push({ id: this.tokenId++, x: p.x, y: p.y, w: 23, h: 23, vx: -2.35, vy: 0, age: -i * 12, life: 10500, wavePhase: Math.random() * Math.PI * 2, bornAt: now, value: 1, frameOffset: i % 4, pattern, patternIndex: i });
    }
    this.tokens = this.tokens.slice(-38);
  }

  private spawnPowerUp(now: number) {
    const kinds: ServerPowerUp["kind"][] = ["regen", "shield", "fireRate", "powerShot", "homingShot", "goldenHeart", "randomBox"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)] || "regen";
    this.powerUps.push({ id: this.powerUpId++, kind, x: CANVAS_W + 64, y: 120 + Math.random() * (CANVAS_H - 240), w: 42, h: 42, vx: -1.55, vy: 0, age: 0, life: 11500, wavePhase: Math.random() * Math.PI * 2, bornAt: now });
  }

  private updatePickups(now: number, step: number) {
    this.tokens = this.tokens.map((t) => {
      let vx = t.vx, vy = t.vy;
      const age = t.age + 16.67 * step;
      if (t.targetSlot && age > (t.magnetDelay || 160)) {
        const target = this.playersState.get(t.targetSlot);
        if (target?.alive) {
          const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
          const tx = target.x + target.w / 2, ty = target.y + target.h / 2;
          const dx = tx - cx, dy = ty - cy;
          const len = Math.max(1, Math.hypot(dx, dy));
          vx += (dx / len) * 0.34 * step;
          vy += (dy / len) * 0.34 * step;
          const max = 6.2;
          const sp = Math.hypot(vx, vy);
          if (sp > max) { vx = (vx / sp) * max; vy = (vy / sp) * max; }
        }
      }
      return { ...t, age, life: t.life - 16.67 * step, vx, vy, x: t.x + vx * step, y: t.y + vy * step + (t.burst ? 0 : Math.sin((t.age + t.wavePhase * 100) * 0.01) * 0.12) };
    }).filter((t) => t.life > 0 && t.x > -80).slice(this.selectedGameMode === "localPvp" ? -24 : -48);
    this.powerUps = this.powerUps.map((p) => ({ ...p, age: p.age + 16.67 * step, life: p.life - 16.67 * step, x: p.x + p.vx * step })).filter((p) => p.life > 0 && p.x > -80).slice(-8);
  }

  private resolvePickupCollect(now: number) {
    const players = [...this.playersState.values()].filter((p) => p.alive);
    const nextTokens: ServerToken[] = [];
    for (const token of this.tokens) {
      const collector = players.find((p) => this.overlap(token, p));
      if (!collector) { nextTokens.push(token); continue; }
      const bonus = this.petBuffs(collector).tokenBonus;
      const amount = Math.max(1, Math.round(token.value * (1 + bonus)));
      this.broadcast({ type: "token_collect", room: this.roomCode, slot: collector.slot, amount, t: now });
      this.addEvent("sound", collector.x + collector.w / 2, collector.y + collector.h / 2, "#ffd166", 0, "tokenCollect", 0.16, "sfx", collector.slot);
    }
    this.tokens = nextTokens;

    const nextPowerUps: ServerPowerUp[] = [];
    for (const power of this.powerUps) {
      const collector = players.find((p) => this.overlap(power, p));
      if (!collector) { nextPowerUps.push(power); continue; }
      if (power.kind === "regen") collector.hp = Math.min(collector.maxHp, collector.hp + 1);
      if (power.kind === "goldenHeart") collector.goldenHp = Math.min(2, collector.goldenHp + 1);
      if (power.kind === "shield") collector.invincibleUntil = Math.max(collector.invincibleUntil, now + 4200);
      if (power.kind === "fireRate") collector.normalCooldown = Math.max(now, collector.normalCooldown - 360);
      if (power.kind === "powerShot") collector.strongReadyAt = Math.min(collector.strongReadyAt, now + 180);
      if (power.kind === "homingShot") collector.strongReadyAt = Math.min(collector.strongReadyAt, now + 120);
      if (power.kind === "randomBox") { collector.hp = Math.min(collector.maxHp, collector.hp + 1); collector.strongReadyAt = Math.min(collector.strongReadyAt, now + 160); }
      this.addEvent("tokenBurst", power.x + power.w / 2, power.y + power.h / 2, "#8be9ff", 4, "powerUpPickup", 0.2, "sfx", collector.slot, 54);
    }
    this.powerUps = nextPowerUps;
  }

  private activatePetAbility(p: ServerPlayer, now: number) {
    const pet = this.petId(p);
    if (!pet || now < p.petCooldownUntil) return;
    p.petCooldownUntil = now + 52000;
    p.petActiveUntil = now + 10000;
    if (pet === "pet-blue-comet") {
      p.invincibleUntil = Math.max(p.invincibleUntil, now + 10000);
      this.addEvent("shockwave", p.x + p.w / 2, p.y + p.h / 2, "#fde047", 10, "petSuperSpark", 0.35, "ability", p.slot, 130);
    } else if (pet === "pet-red-jumper") {
      for (const target of this.playersState.values()) if (target.slot !== p.slot && target.alive && Math.hypot((target.x + target.w / 2) - (p.x + p.w / 2), (target.y + target.h / 2) - (p.y + p.h / 2)) < 220) { target.hp -= 1; target.invincibleUntil = now + 300; }
      this.addEvent("explosion", p.x + p.w / 2, p.y + p.h / 2, "#ff8066", 10, "petActivate", 0.25, "ability", p.slot);
    } else if (pet === "pet-black-hole") {
      for (const target of this.playersState.values()) if (target.slot !== p.slot && target.alive) { target.vx += ((p.x - target.x) / 220) * 1.2; target.vy += ((p.y - target.y) / 220) * 1.2; }
      this.addEvent("shockwave", p.x + p.w / 2, p.y + p.h / 2, "#7c3aed", 8, "petActivate", 0.25, "ability", p.slot, 115);
    } else {
      p.invincibleUntil = Math.max(p.invincibleUntil, now + 850);
      p.strongReadyAt = Math.min(p.strongReadyAt, now + 120);
      this.addEvent("shockwave", p.x + p.w / 2, p.y + p.h / 2, "#dbeafe", 6, "petActivate", 0.22, "ability", p.slot, 80);
    }
  }

  private updatePlayers(now: number, step: number) {
    for (const session of this.sessions.values()) this.syncSessionToState(session);
    for (const p of this.playersState.values()) {
      const waitingVersus = this.selectedGameMode === "localPvp" && this.activeVersusSlots.length >= 2 && !this.activeVersusSlots.includes(p.slot);
      if (waitingVersus) { p.alive = false; p.hp = 0; p.respawnAt = Number.MAX_SAFE_INTEGER; continue; }
      if (!p.alive) {
        if (p.respawnAt && now >= p.respawnAt) {
          p.alive = true;
          p.hp = p.maxHp;
          p.invincibleUntil = now + 1200;
          p.x = p.slot % 2 === 1 ? 130 : CANVAS_W - PLAYER_W - 130;
          p.y = p.slot <= 2 ? CANVAS_H / 2 - PLAYER_H / 2 : 380;
          p.vx = 0; p.vy = 0;
          this.addEvent("explosion", p.x + p.w / 2, p.y + p.h / 2, "#dbeafe", 7, "powerUpPickup", 0.12, "sfx");
        }
        continue;
      }
      const input = p.input;
      const buffs = this.petBuffs(p);
      p.maxHp = clamp(MAX_HP + buffs.maxHp, 3, 7);
      if (p.hp > p.maxHp) p.hp = p.maxHp;
      if (input.pet) this.activatePetAbility(p, now);
      const speedMul = 1 + buffs.speed + (now < p.petActiveUntil && this.petId(p) === "pet-blue-comet" ? 0.16 : 0);
      const shotMul = 1 + buffs.shotSpeed + (now < p.petActiveUntil && this.petId(p) === "pet-blue-comet" ? 0.14 : 0);
      const damageMul = 1 + buffs.damage;
      const ix = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      const iy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      const moving = ix !== 0 || iy !== 0;
      if (input.dodge && now > p.dodgeUntil + DODGE_COOLDOWN) {
        const mag = Math.hypot(ix, iy) || 1;
        p.vx += (ix / mag) * 8.4;
        p.vy += (iy / mag) * 7.6;
        p.dodgeUntil = now + 220;
        p.invincibleUntil = Math.max(p.invincibleUntil, now + 260);
        p.stretchUntil = now + 180;
        this.addEvent("bump", p.x + p.w / 2, p.y + p.h / 2, "#bfdbfe", 4, "dodge", 0.12, "sfx", p.slot);
      }
      if (input.boost && now > p.boostUntil + 620) {
        const mag = Math.hypot(ix, iy) || 1;
        p.boostVx = (ix / mag || (p.slot % 2 === 1 ? 1 : -1)) * 12.6;
        p.boostVy = (iy / mag) * 10.8;
        p.boostUntil = now + 180;
        p.invincibleUntil = Math.max(p.invincibleUntil, now + 160);
      }
      if (now < p.boostUntil) {
        p.vx = p.boostVx; p.vy = p.boostVy;
      } else {
        if (ix) p.vx += ix * ACCEL * speedMul * step; else p.vx *= Math.pow(FRICTION, step);
        if (iy) p.vy += iy * ACCEL * speedMul * step; else p.vy *= Math.pow(FRICTION, step);
      }
      p.vx = clamp(p.vx, -MAX_SPEED_X * speedMul, MAX_SPEED_X * speedMul);
      p.vy = clamp(p.vy, -MAX_SPEED_Y * speedMul, MAX_SPEED_Y * speedMul);
      p.x = clamp(p.x + p.vx * step, 0, CANVAS_W - p.w);
      p.y = clamp(p.y + p.vy * step, 0, CANVAS_H - p.h);
      p.tilt = clamp((p.vy / MAX_SPEED_Y) * 18 + (p.vx / MAX_SPEED_X) * 2, -20, 20);
      p.lastInputX = moving ? ix : 0;
      p.lastInputY = moving ? iy : 0;
      if (moving && !p.wasMoving) p.stretchUntil = now + 120;
      p.wasMoving = moving;
      if (input.shot && now >= p.normalCooldown) this.spawnShot(p, "normal", now, shotMul, damageMul);
      if (input.strong && now >= p.strongReadyAt) this.spawnShot(p, "strong", now, shotMul, damageMul);
    }
  }

  private spawnShot(p: ServerPlayer, type: "normal" | "strong", now: number, shotMul = 1, damageMul = 1) {
    const dir = p.slot % 2 === 1 ? 1 : -1;
    const strong = type === "strong";
    const speed = (strong ? 12 : 8.2) * shotMul;
    const shotW = strong ? 60 : 30;
    const shotH = strong ? 60 : 30;
    const shot: ServerShot = {
      id: this.shotId++, ownerId: p.slot, bornAt: now, stretchUntil: now + (strong ? 190 : 120),
      x: dir > 0 ? p.x + p.w - 2 : p.x - shotW + 2,
      y: p.y + p.h / 2 - shotH / 2,
      w: shotW, h: shotH,
      speed, damage: Math.max(1, Math.round((strong ? 5 : 1) * damageMul)), type, variant: "normal",
      vx: speed * dir, vy: strong ? (p.vy * 0.12) : (p.vy * 0.08), life: strong ? 820 : 620,
    };
    this.shots.push(shot);
    if (strong) {
      p.strongReadyAt = now + STRONG_COOLDOWN;
      p.vx -= dir * 2.5;
      this.addEvent("shockwave", shot.x, shot.y, "#fff1a8", 8, "strongShot", 0.38, "sfx", p.slot, 220);
    } else {
      p.normalCooldown = now + Math.max(170, NORMAL_COOLDOWN / shotMul);
      this.addEvent("sound", shot.x, shot.y, "#ffffff", 0, "normalShot", 0.32, "sfx", p.slot);
    }
  }

  private updateShots(now: number, step: number) {
    this.shots = this.shots
      .map((s) => ({ ...s, x: s.x + s.vx * step, y: s.y + s.vy * step, life: s.life - (1000 / 60) * step }))
      .filter((s) => s.life > 0 && s.x + s.w > -80 && s.x < CANVAS_W + 80 && s.y + s.h > -80 && s.y < CANVAS_H + 80)
      .slice(-80);
  }

  private resolvePlayerBumps(now: number) {
    const players = [...this.playersState.values()].filter((p) => p.alive);
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const a = players[i], b = players[j];
        if (!this.overlap(a, b)) continue;
        const ax = a.x + a.w / 2, ay = a.y + a.h / 2;
        const bx = b.x + b.w / 2, by = b.y + b.h / 2;
        const dx = ax - bx, dy = ay - by;
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len, ny = dy / len;
        a.x = clamp(a.x + nx * 12, 0, CANVAS_W - a.w);
        a.y = clamp(a.y + ny * 8, 0, CANVAS_H - a.h);
        b.x = clamp(b.x - nx * 12, 0, CANVAS_W - b.w);
        b.y = clamp(b.y - ny * 8, 0, CANVAS_H - b.h);
        a.vx += nx * 2.2; a.vy += ny * 1.8;
        b.vx -= nx * 2.2; b.vy -= ny * 1.8;
        a.stretchUntil = b.stretchUntil = now + 160;
        this.addEvent("bump", (ax + bx) / 2, (ay + by) / 2, "#fef3c7", 6, "hit", 0.15, "hit");
      }
    }
  }

  private resolveShotHits(now: number) {
    const nextShots: ServerShot[] = [];
    for (const shot of this.shots) {
      let consumed = false;
      for (const p of this.playersState.values()) {
        if (this.selectedGameMode === "localCoop") continue;
        if (!p.alive || p.slot === shot.ownerId || now < p.invincibleUntil) continue;
        if (!this.overlap(shot, p)) continue;
        consumed = true;
        p.hp -= shot.damage;
        p.invincibleUntil = now + 420;
        p.vx += shot.vx > 0 ? 4.6 : -4.6;
        p.vy += shot.vy * 0.2;
        p.stretchUntil = now + 170;
        this.addEvent("hit", p.x + p.w / 2, p.y + p.h / 2, "#ffd166", 8, "enemyHit", 0.18, "hit", shot.ownerId);
        this.addEvent("shockwave", p.x + p.w / 2, p.y + p.h / 2, "#fde68a", 7, undefined, 0, "hit", shot.ownerId, shot.type === "strong" ? 92 : 48);
        if (Math.random() < (shot.type === "strong" ? 0.86 : 0.58)) this.spawnDamageTokenBurst(p.x + p.w / 2, p.y + p.h / 2, shot.ownerId, now, shot.type === "strong");
        this.maybeDropPvpPowerUp(p.x + p.w / 2, p.y + p.h / 2, now);
        if (p.hp <= 0) {
          p.alive = false;
          p.respawnAt = now + 1600;
          p.hp = 0;
          this.scores.set(shot.ownerId, (this.scores.get(shot.ownerId) || 0) + 1);
          this.rotateVersusAfterElimination(p.slot, shot.ownerId as PlayerSlot, now);
          this.addEvent("explosion", p.x + p.w / 2, p.y + p.h / 2, "#ffcf6e", 14, "explosion", 0.26, "hit", shot.ownerId);
        }
        break;
      }
      if (!consumed) nextShots.push(shot);
    }
    this.shots = nextShots;
  }

  private spawnDamageTokenBurst(x: number, y: number, owner: PlayerSlot, now: number, strong = false) {
    if (this.selectedGameMode !== "localPvp") return;
    const amount = strong ? 3 : 1;
    for (let i = 0; i < amount; i++) {
      const angle = -Math.PI + (i / Math.max(1, amount - 1)) * Math.PI * 0.8 + (Math.random() - 0.5) * 0.35;
      const speed = strong ? 3.2 : 2.55;
      this.tokens.push({
        id: this.tokenId++, x: x - 12 + Math.random() * 24, y: y - 12 + Math.random() * 24,
        w: 19, h: 19, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.35,
        age: 0, life: 2100, wavePhase: Math.random() * Math.PI * 2, bornAt: now,
        value: 1, frameOffset: i % 4, pattern: "burst", patternIndex: i, targetSlot: owner, magnetDelay: 180, burst: true,
      });
    }
    this.tokens = this.tokens.slice(-22);
    this.addEvent("tokenBurst", x, y, "#ffd45a", amount, "tokenBurst", 0.12, "sfx", owner, strong ? 58 : 42);
  }

  private maybeDropPvpPowerUp(x: number, y: number, now: number) {
    if (this.selectedGameMode !== "localPvp") return;
    if (this.powerUps.length >= 2) return;
    if (Math.random() > 0.16) return;
    const kinds: ServerPowerUp["kind"][] = ["regen", "shield", "fireRate", "powerShot", "homingShot", "randomBox"];
    const kind = kinds[Math.floor(Math.random() * kinds.length)] || "regen";
    this.powerUps.push({ id: this.powerUpId++, kind, x: clamp(x - 20, 80, CANVAS_W - 120), y: clamp(y - 20, 70, CANVAS_H - 90), w: 42, h: 42, vx: 0, vy: 0, age: 0, life: 8500, wavePhase: Math.random() * Math.PI * 2, bornAt: now });
  }


  private updateCoopEnemies(now: number, step: number) {
    if (now >= this.nextEnemyWaveAt && this.enemies.length === 0) {
      this.waveNumber += 1;
      this.spawnCoopWave(now);
      this.nextEnemyWaveAt = now + 6200 + Math.min(4200, this.waveNumber * 480);
    }
    this.enemies = this.enemies
      .map((enemy) => {
        const wave = Math.sin((enemy.age + (enemy.phase ?? 0) * 1000) * 0.004) * 1.2;
        return {
          ...enemy,
          age: enemy.age + 16.67 * step,
          x: enemy.x + enemy.vx * step,
          y: clamp(enemy.y + (enemy.vy + wave * 0.08) * step, 50, CANVAS_H - enemy.h - 50),
          rotation: (enemy.rotation || 0) + (enemy.rotationSpeed || 0) * 16.67 * step,
        };
      })
      .filter((enemy) => enemy.hp > 0 && enemy.x > -enemy.w - 80)
      .slice(-26);
  }

  private spawnCoopWave(now: number) {
    const count = clamp(3 + Math.floor(this.waveNumber * 0.55), 3, 10);
    for (let i = 0; i < count; i++) {
      const kind: ServerEnemy["kind"] = i % 5 === 0 ? "asteroid" : i % 3 === 0 ? "purple" : "red";
      const w = kind === "asteroid" ? 76 : 62;
      const h = kind === "asteroid" ? 76 : 48;
      const hp = kind === "asteroid" ? 3 : kind === "purple" ? 2 : 1;
      const y = 82 + ((i * 97 + this.waveNumber * 37) % Math.max(120, CANVAS_H - 170));
      this.enemies.push({
        id: this.enemyId++,
        stretchUntil: 0,
        kind,
        x: CANVAS_W + 90 + i * 92,
        y,
        w,
        h,
        vx: -(1.45 + Math.min(1.2, this.waveNumber * 0.045) + Math.random() * 0.35),
        vy: 0,
        hp,
        maxHp: hp,
        age: 0,
        waveBaseY: y,
        shotCooldown: 0,
        windUpMs: 0,
        isDashing: false,
        rotation: 0,
        rotationSpeed: kind === "asteroid" ? 0.0025 : 0,
        phase: Math.random() * Math.PI * 2,
      });
    }
    this.addEvent("sound", CANVAS_W / 2, 120, "#fff1a8", 0, "waveStart", 0.22, "sfx");
  }

  private resolveShotHitsEnemies(now: number) {
    if (this.selectedGameMode !== "localCoop" || this.enemies.length === 0) return;
    const nextShots: ServerShot[] = [];
    for (const shot of this.shots) {
      let hit = false;
      for (const enemy of this.enemies) {
        if (!this.overlap(shot, enemy)) continue;
        hit = true;
        enemy.hp -= shot.damage;
        enemy.stretchUntil = now + 160;
        this.addEvent("hit", enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffe18c", 6, "enemyHit", 0.15, "hit", shot.ownerId);
        if (enemy.hp <= 0) {
          this.scores.set(shot.ownerId, (this.scores.get(shot.ownerId) || 0) + 1);
          this.spawnDamageTokenBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, shot.ownerId, now, shot.type === "strong");
          this.addEvent("explosion", enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffcf6e", 10, "enemyDeath", 0.2, "hit", shot.ownerId);
        }
        break;
      }
      if (!hit) nextShots.push(shot);
    }
    this.shots = nextShots;
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
  }

  private resolveEnemyContact(now: number) {
    if (this.selectedGameMode !== "localCoop") return;
    for (const enemy of this.enemies) {
      for (const p of this.playersState.values()) {
        if (!p.alive || now < p.invincibleUntil) continue;
        if (!this.overlap(enemy, p)) continue;
        p.hp -= 1;
        p.invincibleUntil = now + 980;
        p.vx -= 4.2;
        p.stretchUntil = now + 180;
        this.addEvent("hit", p.x + p.w / 2, p.y + p.h / 2, "#ff8a3d", 8, "enemyHit", 0.18, "hit", p.slot);
        if (p.hp <= 0) {
          p.hp = 0; p.alive = false; p.respawnAt = now + 1800;
          this.addEvent("explosion", p.x + p.w / 2, p.y + p.h / 2, "#ffcf6e", 12, "explosion", 0.24, "hit", p.slot);
        }
      }
    }
  }

  private rotateVersusAfterElimination(deadSlot: PlayerSlot, killerSlot: PlayerSlot, now: number) {
    if (this.selectedGameMode !== "localPvp") return;
    const allSlots = [...this.playersState.keys()].sort((a, b) => a - b) as PlayerSlot[];
    if (allSlots.length <= 2) return;
    const waiting = allSlots.filter((slot) => !this.activeVersusSlots.includes(slot));
    const nextSlot = waiting[0];
    const dead = this.playersState.get(deadSlot);
    if (dead) { dead.alive = false; dead.hp = 0; dead.respawnAt = Number.MAX_SAFE_INTEGER; }
    if (!nextSlot) return;
    this.activeVersusSlots = [killerSlot, nextSlot];
    const next = this.playersState.get(nextSlot);
    if (next) {
      const killer = this.playersState.get(killerSlot);
      const sideLeft = !killer || killer.x > CANVAS_W / 2;
      next.alive = true;
      next.hp = next.maxHp;
      next.respawnAt = 0;
      next.invincibleUntil = now + 1400;
      next.x = sideLeft ? 130 : CANVAS_W - PLAYER_W - 130;
      next.y = CANVAS_H / 2 - PLAYER_H / 2;
      next.vx = 0; next.vy = 0;
      this.addEvent("explosion", next.x + next.w / 2, next.y + next.h / 2, "#dbeafe", 9, "powerUpPickup", 0.16, "sfx", next.slot);
    }
  }

  private overlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private addEvent(kind: OnlineVisualEvent["kind"], x: number, y: number, color = "#fff1a8", amount = 6, sound?: string, volume = 0.16, category: OnlineVisualEvent["category"] = "sfx", slot?: PlayerSlot, radius?: number) {
    this.visualEvents.push({ id: ++this.visualEventId, kind, x, y, color, amount, sound, volume, category, slot, radius, t: Date.now() });
    this.visualEvents = this.visualEvents.slice(-48);
  }

  private snapshot() {
    const now = Date.now();
    const players = [...this.playersState.values()].sort((a, b) => a.slot - b.slot);
    const activeSlots = this.selectedGameMode === "localPvp" ? this.activeVersusSlots : players.map((p) => p.slot);
    const waitingSlots = players.map((p) => p.slot).filter((slot) => !activeSlots.includes(slot));
    const runtimePlayers = players.map((p) => ({
      id: p.id,
      slot: p.slot,
      clientId: p.id,
      name: p.name,
      color: p.color,
      isHost: false,
      player: this.publicPlayerState(p),
      hp: p.hp,
      maxHp: p.maxHp,
      goldenHp: p.goldenHp,
      alive: p.alive,
      ghost: !p.alive,
      reviveProgress: p.alive ? 0 : clamp(1 - Math.max(0, p.respawnAt - now) / 1600, 0, 1),
      input: p.input,
      effects: { petActive: now < p.petActiveUntil, petCooldownUntil: p.petCooldownUntil },
      score: this.scores.get(p.slot) || 0,
      active: activeSlots.includes(p.slot),
      waiting: waitingSlots.includes(p.slot),
      cosmetics: p.cosmetics,
      profileColor: p.profileColor,
    }));
    const bySlot = new Map(players.map((p) => [p.slot, p]));
    const p1 = bySlot.get(1), p2 = bySlot.get(2);
    const p1Score = this.scores.get(1) || 0;
    const p2Score = this.scores.get(2) || 0;
    const scoresBySlot = Object.fromEntries([...this.scores.entries()].map(([slot, value]) => [String(slot), value]));
    return {
      tick: this.serverTick,
      seq: this.serverTick,
      t: now,
      serverTime: now,
      sentAt: now,
      authoritativeSlot: 0,
      netModel: "dual-sim-pets-shop-profile-v253",
      mode: this.selectedGameMode,
      state: this.gameActive ? "playing" : "mainMenu",
      players: runtimePlayers,
      p1: p1 ? this.publicPlayerState(p1) : undefined,
      p2: p2 ? this.publicPlayerState(p2) : null,
      p1Hp: p1?.hp ?? 0,
      p2Hp: p2?.hp ?? 0,
      p1Gold: p1?.goldenHp ?? 0,
      p2Gold: p2?.goldenHp ?? 0,
      score: Math.max(p1Score, p2Score),
      localP1Score: p1Score,
      localP2Score: p2Score,
      localPvpRound: 1,
      scoresBySlot,
      activeSlots,
      waitingSlots,
      wave: { mode: this.selectedGameMode, wave: this.waveNumber, active: true, bossWave: false, message: this.selectedGameMode === "localCoop" ? `WAVE ${this.waveNumber}` : "VERSUS ONLINE" },
      shots: this.shots.map((s) => ({ ...s, life: undefined })),
      enemies: this.enemies.map((e) => ({ ...e })),
      enemyProjectiles: [],
      bossProjectiles: [],
      powerUps: this.powerUps.map((p) => ({ ...p })),
      tokens: this.tokens.map((t) => ({ ...t })),
      events: this.visualEvents,
      p1DodgeActive: p1 ? now < p1.dodgeUntil : false,
      p2DodgeActive: p2 ? now < p2.dodgeUntil : false,
      p1BoostActive: p1 ? now < p1.boostUntil : false,
      p2BoostActive: p2 ? now < p2.boostUntil : false,
      p1ShieldActive: p1 ? now < p1.invincibleUntil : false,
      p2ShieldActive: p2 ? now < p2.invincibleUntil : false,
      p1Effects: {},
      p2Effects: {},
    };
  }

  private publicPlayerState(p: ServerPlayer) {
    return {
      x: p.x, y: p.y, w: p.w, h: p.h, vx: p.vx, vy: p.vy, tilt: p.tilt,
      hp: p.hp, goldenHp: p.goldenHp, invincibleUntil: p.invincibleUntil, dodgeUntil: p.dodgeUntil,
      boostUntil: p.boostUntil, boostVx: p.boostVx, boostVy: p.boostVy,
      normalCooldown: p.normalCooldown, strongReadyAt: p.strongReadyAt,
      stretchUntil: p.stretchUntil, stretchVx: p.stretchVx, stretchVy: p.stretchVy,
      wasMoving: p.wasMoving, lastInputX: p.lastInputX, lastInputY: p.lastInputY,
      lastMoveAngle: p.lastMoveAngle, lastStretchAt: p.lastStretchAt,
      capturedUntil: 0, throwUntil: 0, capturedEnemyId: null, throwVx: 0, throwVy: 0,
      wallImpactArmed: false, alienCaptureCooldownUntil: 0,
    };
  }

  private broadcastSnapshot() {
    this.broadcast({ type: "sync", from: 0, hostSlot: 0, snapshot: this.snapshot(), serverTime: Date.now(), t: Date.now(), priority: "server-frame", netModel: "dual-sim-pets-shop-profile-v253" });
  }

  private clearPendingDisconnect(slot: number) {
    const timer = this.pendingDisconnectTimers.get(slot);
    if (timer) clearTimeout(timer);
    this.pendingDisconnectTimers.delete(slot);
  }

  private beginDisconnectTimeout(session: PlayerSession) {
    const slot = session.slot;
    if (!slot) return;
    this.clearPendingDisconnect(slot);
    const timeoutMs = 12000;
    const remainingNow = this.players().length;
    this.broadcast({ type: "player_timeout_start", room: this.roomCode, slot, name: session.name, timeoutMs, remainingPlayers: remainingNow, t: Date.now() });
    const timer = setTimeout(() => { this.pendingDisconnectTimers.delete(slot); this.finalizePlayerLeft(slot); }, timeoutMs);
    this.pendingDisconnectTimers.set(slot, timer);
  }

  private finalizePlayerLeft(slot: number) {
    this.playersState.delete(slot);
    const remainingPlayers = this.players().length;
    const shouldReturnToLobby = this.gameActive && remainingPlayers <= 1;
    if (shouldReturnToLobby) this.stopMatch();
    this.broadcast({ type: "player_left", room: this.roomCode, slot, remainingPlayers, shouldReturnToLobby, continueMatch: this.gameActive && remainingPlayers > 1, t: Date.now() });
    this.broadcastState();
  }

  private handleSocketGone(ws: WebSocket) {
    const session = this.sessions.get(ws);
    if (session?.slot) { this.pauseReadySlots.delete(session.slot); this.clearPendingDisconnect(session.slot); }
    if (session?.slot === this.pauseRequestedBy) this.pauseRequestedBy = null;
    this.sessions.delete(ws);
    if (this.gameActive && session?.slot) this.beginDisconnectTimeout(session);
    else {
      this.ensureHost();
      if (session?.slot) this.broadcast({ type: "player_left", room: this.roomCode, slot: session.slot, remainingPlayers: this.players().length, shouldReturnToLobby: false, continueMatch: false, t: Date.now() });
      this.broadcastState();
    }
    if (this.pauseRequestedBy) this.broadcastPauseState();
  }

  async webSocketClose(ws: WebSocket) { this.handleSocketGone(ws); }
  async webSocketError(ws: WebSocket) { this.handleSocketGone(ws); }

  private sanitizeProfileSummary(value: Record<string, unknown>) {
    const stats = typeof value.stats === "object" && value.stats ? value.stats as Record<string, unknown> : {};
    const equipped = typeof value.equipped === "object" && value.equipped ? value.equipped as Record<string, unknown> : {};
    return {
      id: String(value.id || "").slice(0, 64),
      name: String(value.name || "Player").slice(0, 16),
      color: String(value.color || value.profileColor || "#60a5fa").slice(0, 24),
      friendCode: String(value.friendCode || "").slice(0, 16),
      tokens: Math.max(0, Math.min(999999, Math.floor(Number(value.tokens || 0)))),
      friendsCount: Math.max(0, Math.min(999, Math.floor(Number(value.friendsCount || 0)))),
      requestsCount: Math.max(0, Math.min(999, Math.floor(Number(value.requestsCount || 0)))),
      achievementsUnlocked: Math.max(0, Math.min(999, Math.floor(Number(value.achievementsUnlocked || 0)))),
      achievementsTotal: Math.max(0, Math.min(999, Math.floor(Number(value.achievementsTotal || 0)))),
      equipped: {
        front: typeof equipped.front === "string" ? String(equipped.front).slice(0, 80) : undefined,
        middle: typeof equipped.middle === "string" ? String(equipped.middle).slice(0, 80) : undefined,
        pet: typeof equipped.pet === "string" ? String(equipped.pet).slice(0, 80) : undefined,
        recolor: typeof equipped.recolor === "string" ? String(equipped.recolor).slice(0, 80) : undefined,
      },
      stats: {
        runsStarted: Math.max(0, Math.floor(Number(stats.runsStarted || 0))),
        enemiesKilled: Math.max(0, Math.floor(Number(stats.enemiesKilled || 0))),
        deaths: Math.max(0, Math.floor(Number(stats.deaths || 0))),
        tokensCollected: Math.max(0, Math.floor(Number(stats.tokensCollected || 0))),
        bestInfiniteWave: Math.max(0, Math.floor(Number(stats.bestInfiniteWave || 0))),
        bestInfiniteScore: Math.max(0, Math.floor(Number(stats.bestInfiniteScore || 0))),
        chocadosKilled: Math.max(0, Math.floor(Number(stats.chocadosKilled || 0))),
      },
      updatedAt: Math.max(0, Number(value.updatedAt || Date.now())),
    };
  }

  private publicPlayer(session: PlayerSession) {
    return { id: session.id, slot: session.slot, name: session.name, ready: session.ready, device: session.device, cosmetics: session.cosmetics, profileColor: session.profileColor, profileSummary: session.profileSummary, connected: true, host: false };
  }

  private players() {
    return [...this.sessions.values()].filter((s) => s.slot > 0).sort((a, b) => a.slot - b.slot).map((s) => this.publicPlayer(s));
  }

  private modeVotes() {
    const votes: Record<number, GameMode> = {};
    for (const session of this.sessions.values()) if (session.slot > 0) votes[session.slot] = "localCoop";
    return votes;
  }

  private selectedMode(): GameMode {
    const counts = new Map<GameMode, number>();
    for (const mode of VALID_MODES) counts.set(mode, 0);
    for (const session of this.sessions.values()) if (session.slot > 0) counts.set("localCoop", (counts.get("localCoop") || 0) + 1);
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0]?.[1] ?? 0;
    const tied = ranked.filter(([, count]) => count === top && count > 0).map(([mode]) => mode);
    if (tied.length > 1) return tied.includes(this.selectedGameMode) ? this.selectedGameMode : tied[0];
    return "localCoop";
  }

  private broadcastState() {
    const players = this.players();
    const selectedMode = this.selectedMode();
    const roomHostSlot = 0;
    this.broadcast({ type: "room_state", room: this.roomCode, players, modeVotes: this.modeVotes(), selectedMode, hostSlot: roomHostSlot, canStart: players.length >= 2 && players.every((p) => p.ready), netModel: "dual-sim-pets-shop-profile-v253", version: "2.5.3-pets-shop", tick: this.serverTick, serverTick: this.serverTick, t: Date.now() });
  }

  private broadcastPauseState() {
    this.broadcast({ type: "pause_state", room: this.roomCode, requestedBy: this.pauseRequestedBy, readySlots: [...this.pauseReadySlots], committed: this.pauseCommitted, t: Date.now() });
  }

  private broadcast(data: unknown, except?: WebSocket) {
    const payload = JSON.stringify(data);
    for (const ws of this.sessions.keys()) {
      if (except && ws === except) continue;
      try { ws.send(payload); } catch { this.sessions.delete(ws); }
    }
  }
}
