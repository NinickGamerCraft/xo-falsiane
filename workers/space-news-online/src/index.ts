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
  modeVote: GameMode;
};

type ServerPlayer = {
  id: string;
  slot: PlayerSlot;
  name: string;
  color: string;
  profileColor?: string;
  cosmetics?: Record<string, string>;
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
  | { type: "join"; name?: string; device?: string; cosmetics?: Record<string, string>; profileColor?: string }
  | { type: "profile"; name?: string; device?: string; cosmetics?: Record<string, string>; profileColor?: string }
  | { type: "vote_mode"; mode?: GameMode }
  | { type: "start"; mode?: GameMode }
  | { type: "ready"; ready?: boolean }
  | { type: "input"; input?: PlayerInput; seq?: number; cosmetics?: Record<string, string>; profileColor?: string; pet?: string }
  | { type: "sync"; snapshot?: Record<string, unknown> }
  | { type: "token_collect"; slot?: number; amount?: number }
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

const VALID_MODES: GameMode[] = ["localPvp", "localCoop"];
const CANVAS_W = 1280;
const CANVAS_H = 720;
const PLAYER_W = 170;
const PLAYER_H = 100;
const MAX_HP = 5;
const ACCEL = 0.42;
const FRICTION = 0.92;
const MAX_SPEED_X = 7.4;
const MAX_SPEED_Y = 6.8;
const NORMAL_COOLDOWN = 165;
const STRONG_COOLDOWN = 1250;
const DODGE_COOLDOWN = 720;
const SERVER_TICK_MS = 1000 / 30;
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
  return VALID_MODES.includes(value as GameMode) ? (value as GameMode) : "localPvp";
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
      return json({ ok: true, service: "Space News Online", version: "2.3.0-authoritative", netModel: "server-authoritative-v230" });
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
  private selectedGameMode: GameMode = "localPvp";
  private hostSlot = 1;
  private serverTick = 0;
  private lastTickAt = 0;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private playersState = new Map<number, ServerPlayer>();
  private shots: ServerShot[] = [];
  private scores = new Map<number, number>();
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
      await this.ctx.storage.put("selectedMode", "localPvp");
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
      modeVote: "localPvp",
    };

    server.serializeAttachment(placeholder);
    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, placeholder);
    server.send(JSON.stringify({ type: "hello", room: this.roomCode, netModel: "server-authoritative-v230" }));
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
      session.name = cleanName(msg.name, `P${session.slot}`);
      session.device = String(msg.device || "unknown").slice(0, 32);
      if (msg.cosmetics && typeof msg.cosmetics === "object") session.cosmetics = msg.cosmetics;
      if (typeof msg.profileColor === "string") session.profileColor = msg.profileColor.slice(0, 24);
      ws.serializeAttachment(session);
      this.sessions.set(ws, session);
      this.ensureHost();
      this.syncSessionToState(session);
      ws.send(JSON.stringify({ type: "joined", room: this.roomCode, player: this.publicPlayer(session), slot: session.slot, netModel: "server-authoritative-v230" }));
      this.broadcast({ type: "player_joined", room: this.roomCode, player: this.publicPlayer(session), t: Date.now() }, ws);
      this.broadcastState();
      return;
    }

    if (msg.type === "profile") {
      if (msg.name) session.name = cleanName(msg.name, session.name || `P${session.slot}`);
      if (msg.device) session.device = String(msg.device || "unknown").slice(0, 32);
      if (msg.cosmetics && typeof msg.cosmetics === "object") session.cosmetics = msg.cosmetics;
      if (typeof msg.profileColor === "string") session.profileColor = msg.profileColor.slice(0, 24);
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
      session.modeVote = cleanMode(msg.mode);
      ws.serializeAttachment(session);
      this.selectedGameMode = this.selectedMode();
      this.broadcastState();
      return;
    }

    if (msg.type === "start") {
      const players = this.players();
      const canStart = players.length >= 2 && players.every((p) => p.ready);
      if (!canStart) { ws.send(JSON.stringify({ type: "error", error: "Aguarde todos ficarem READY." })); return; }
      this.selectedGameMode = cleanMode(msg.mode || this.selectedMode());
      this.startMatch(this.selectedGameMode);
      this.broadcast({ type: "game_start", room: this.roomCode, mode: this.selectedGameMode, hostSlot: 0, t: Date.now(), netModel: "server-authoritative-v230" });
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
      ws.serializeAttachment(session);
      this.syncSessionToState(session);
      return;
    }

    if (msg.type === "sync" || msg.type === "token_collect") {
      // v2.3.0: host snapshots/token relays foram aposentados. O servidor é a autoridade.
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
    this.lastTickAt = Date.now();
    this.shots = [];
    this.scores.clear();
    this.playersState.clear();
    this.visualEvents = [];
    this.visualEventId = 0;
    this.shotId = 1;
    const players = this.players();
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
        hp: MAX_HP,
        maxHp: MAX_HP,
        goldenHp: 0,
        alive: true,
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
        respawnAt: 0,
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
    this.visualEvents = [];
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
    this.updatePlayers(now, step);
    this.updateShots(now, step);
    this.resolvePlayerBumps(now);
    this.resolveShotHits(now);
    this.visualEvents = this.visualEvents.filter((event) => now - (event.t || now) < 1200).slice(-36);
    if (this.serverTick % SNAPSHOT_EVERY_TICKS === 0) this.broadcastSnapshot();
  }

  private updatePlayers(now: number, step: number) {
    for (const session of this.sessions.values()) this.syncSessionToState(session);
    for (const p of this.playersState.values()) {
      if (!p.alive) {
        if (p.respawnAt && now >= p.respawnAt) {
          p.alive = true;
          p.hp = MAX_HP;
          p.invincibleUntil = now + 1200;
          p.x = p.slot % 2 === 1 ? 130 : CANVAS_W - PLAYER_W - 130;
          p.y = p.slot <= 2 ? CANVAS_H / 2 - PLAYER_H / 2 : 380;
          p.vx = 0; p.vy = 0;
          this.addEvent("explosion", p.x + p.w / 2, p.y + p.h / 2, "#dbeafe", 7, "powerUpPickup", 0.12, "sfx");
        }
        continue;
      }
      const input = p.input;
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
        if (ix) p.vx += ix * ACCEL * step; else p.vx *= Math.pow(FRICTION, step);
        if (iy) p.vy += iy * ACCEL * step; else p.vy *= Math.pow(FRICTION, step);
      }
      p.vx = clamp(p.vx, -MAX_SPEED_X, MAX_SPEED_X);
      p.vy = clamp(p.vy, -MAX_SPEED_Y, MAX_SPEED_Y);
      p.x = clamp(p.x + p.vx * step, 0, CANVAS_W - p.w);
      p.y = clamp(p.y + p.vy * step, 0, CANVAS_H - p.h);
      p.tilt = clamp((p.vy / MAX_SPEED_Y) * 18 + (p.vx / MAX_SPEED_X) * 2, -20, 20);
      p.lastInputX = moving ? ix : 0;
      p.lastInputY = moving ? iy : 0;
      if (moving && !p.wasMoving) p.stretchUntil = now + 120;
      p.wasMoving = moving;
      if (input.shot && now >= p.normalCooldown) this.spawnShot(p, "normal", now);
      if (input.strong && now >= p.strongReadyAt) this.spawnShot(p, "strong", now);
    }
  }

  private spawnShot(p: ServerPlayer, type: "normal" | "strong", now: number) {
    const dir = p.slot % 2 === 1 ? 1 : -1;
    const strong = type === "strong";
    const speed = strong ? 18.5 : 13.2;
    const shot: ServerShot = {
      id: this.shotId++, ownerId: p.slot, bornAt: now, stretchUntil: now + (strong ? 190 : 120),
      x: dir > 0 ? p.x + p.w - 28 : p.x - (strong ? 44 : 26),
      y: p.y + p.h * 0.48 - (strong ? 12 : 7),
      w: strong ? 44 : 24, h: strong ? 24 : 14,
      speed, damage: strong ? 2 : 1, type, variant: "normal",
      vx: speed * dir, vy: strong ? (p.vy * 0.12) : (p.vy * 0.08), life: strong ? 820 : 620,
    };
    this.shots.push(shot);
    if (strong) {
      p.strongReadyAt = now + STRONG_COOLDOWN;
      p.vx -= dir * 2.5;
      this.addEvent("shockwave", shot.x, shot.y, "#fff1a8", 8, "strongShot", 0.22, "sfx", p.slot, 90);
    } else {
      p.normalCooldown = now + NORMAL_COOLDOWN;
      this.addEvent("sound", shot.x, shot.y, "#ffffff", 0, "normalShot", 0.14, "sfx", p.slot);
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
        if (p.hp <= 0) {
          p.alive = false;
          p.respawnAt = now + 1600;
          p.hp = 0;
          this.scores.set(shot.ownerId, (this.scores.get(shot.ownerId) || 0) + 1);
          this.addEvent("explosion", p.x + p.w / 2, p.y + p.h / 2, "#ffcf6e", 14, "explosion", 0.26, "hit", shot.ownerId);
        }
        break;
      }
      if (!consumed) nextShots.push(shot);
    }
    this.shots = nextShots;
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
      effects: {},
      cosmetics: p.cosmetics,
      profileColor: p.profileColor,
    }));
    const bySlot = new Map(players.map((p) => [p.slot, p]));
    const p1 = bySlot.get(1), p2 = bySlot.get(2);
    const p1Score = this.scores.get(1) || 0;
    const p2Score = this.scores.get(2) || 0;
    return {
      tick: this.serverTick,
      seq: this.serverTick,
      t: now,
      serverTime: now,
      sentAt: now,
      authoritativeSlot: 0,
      netModel: "server-authoritative-v230",
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
      wave: { mode: this.selectedGameMode, wave: 1, active: true, bossWave: false, message: "VERSUS ONLINE" },
      shots: this.shots.map((s) => ({ ...s, life: undefined })),
      enemies: [],
      enemyProjectiles: [],
      bossProjectiles: [],
      powerUps: [],
      tokens: [],
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
    this.broadcast({ type: "sync", from: 0, hostSlot: 0, snapshot: this.snapshot(), serverTime: Date.now(), t: Date.now(), priority: "server-frame", netModel: "server-authoritative-v230" });
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

  private publicPlayer(session: PlayerSession) {
    return { id: session.id, slot: session.slot, name: session.name, ready: session.ready, device: session.device, cosmetics: session.cosmetics, profileColor: session.profileColor, connected: true, host: false };
  }

  private players() {
    return [...this.sessions.values()].filter((s) => s.slot > 0).sort((a, b) => a.slot - b.slot).map((s) => this.publicPlayer(s));
  }

  private modeVotes() {
    const votes: Record<number, GameMode> = {};
    for (const session of this.sessions.values()) if (session.slot > 0) votes[session.slot] = session.modeVote || "localPvp";
    return votes;
  }

  private selectedMode(): GameMode {
    const counts = new Map<GameMode, number>();
    for (const mode of VALID_MODES) counts.set(mode, 0);
    for (const session of this.sessions.values()) if (session.slot > 0) counts.set(session.modeVote || "localPvp", (counts.get(session.modeVote || "localPvp") || 0) + 1);
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0]?.[1] ?? 0;
    const tied = ranked.filter(([, count]) => count === top && count > 0).map(([mode]) => mode);
    if (tied.length > 1) return tied[Math.floor(Date.now() / 1200) % tied.length];
    return ranked[0]?.[0] || "localPvp";
  }

  private broadcastState() {
    const players = this.players();
    const selectedMode = this.selectedMode();
    this.broadcast({ type: "room_state", room: this.roomCode, players, modeVotes: this.modeVotes(), selectedMode, hostSlot: 0, canStart: players.length >= 2 && players.every((p) => p.ready), netModel: "server-authoritative-v230", version: "2.3.0-authoritative", tick: this.serverTick, serverTick: this.serverTick, t: Date.now() });
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
