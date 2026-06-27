import { DurableObject } from "cloudflare:workers";

export interface Env {
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
  ALLOWED_ORIGIN?: string;
}

type GameMode = "localCoop" | "localPvp";

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
};

type HostSnapshot = Record<string, unknown> & {
  tick?: number;
  seq?: number;
  t?: number;
  sentAt?: number;
  serverTime?: number;
  netModel?: string;
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
  modeVote: GameMode;
};

type ClientMessage =
  | { type: "join"; name?: string; device?: string }
  | { type: "profile"; name?: string; device?: string }
  | { type: "vote_mode"; mode?: GameMode }
  | { type: "start"; mode?: GameMode }
  | { type: "ready"; ready?: boolean }
  | { type: "input"; input?: PlayerInput; seq?: number }
  | { type: "sync"; snapshot?: HostSnapshot }
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
};

const VALID_MODES: GameMode[] = ["localPvp", "localCoop"];

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
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

function cleanRoomCode(value: string | null) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
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
  };
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
      return json({ ok: true, service: "Space News Online", version: "1.4.0-netcode", netModel: "host-authoritative-v2" });
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
  private hostSlot = 1;
  private lastSnapshotTick = 0;
  private lastInputSeqBySlot = new Map<number, number>();

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
    if (!created) {
      return json({ error: "Sala não existe." }, { status: 404 });
    }

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

    server.send(
      JSON.stringify({
        type: "hello",
        room: this.roomCode,
        message: "Conectado. Envie { type: 'join', name: 'Ninick' }.",
      }),
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (typeof raw !== "string") return;

    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw) as ClientMessage;
    } catch {
      ws.send(JSON.stringify({ type: "error", error: "JSON inválido." }));
      return;
    }

    const session = this.sessions.get(ws) || (ws.deserializeAttachment() as PlayerSession | undefined);
    if (!session) return;
    session.lastSeen = Date.now();

    if (msg.type === "join") {
      if (session.slot === 0) {
        const usedSlots = new Set([...this.sessions.values()].map((s) => s.slot).filter(Boolean));
        const slot = [1, 2, 3, 4].find((n) => !usedSlots.has(n));
        if (!slot) {
          ws.send(JSON.stringify({ type: "error", error: "Sala cheia." }));
          ws.close(1008, "Sala cheia");
          return;
        }
        session.slot = slot;
      }

      session.name = cleanName(msg.name, `P${session.slot}`);
      session.device = String(msg.device || "unknown").slice(0, 32);
      session.modeVote = session.modeVote || "localPvp";
      ws.serializeAttachment(session);
      this.sessions.set(ws, session);
      this.ensureHost();

      ws.send(JSON.stringify({ type: "joined", room: this.roomCode, hostSlot: this.hostSlot, player: this.publicPlayer(session) }));
      this.broadcastState();
      return;
    }

    if (msg.type === "profile") {
      if (session.slot === 0) return;
      if (msg.name !== undefined) session.name = cleanName(msg.name, `P${session.slot}`);
      if (msg.device !== undefined) session.device = String(msg.device || "unknown").slice(0, 32);
      ws.serializeAttachment(session);
      this.broadcastState();
      return;
    }

    if (msg.type === "vote_mode") {
      if (session.slot === 0) return;
      session.modeVote = cleanMode(msg.mode);
      ws.serializeAttachment(session);
      await this.ctx.storage.put("selectedMode", this.selectedMode());
      this.broadcastState();
      return;
    }

    if (msg.type === "start") {
      if (session.slot === 0) return;
      const players = this.players();
      const canStart = players.length >= 2 && players.every((p) => p.ready);
      if (!canStart) {
        ws.send(JSON.stringify({ type: "error", error: "Ainda falta player ou READY." }));
        return;
      }
      const mode = cleanMode(msg.mode || this.selectedMode());
      await this.ctx.storage.put("selectedMode", mode);
      this.pauseRequestedBy = null;
      this.pauseReadySlots.clear();
      this.pauseCommitted = false;
      this.lastSnapshotTick = 0;
      this.lastInputSeqBySlot.clear();
      this.gameActive = true;
      const hostSlot = this.ensureHost();
      this.broadcast({ type: "game_start", room: this.roomCode, mode, hostSlot, t: Date.now() });
      return;
    }

    if (msg.type === "ready") {
      if (session.slot === 0) {
        ws.send(JSON.stringify({ type: "error", error: "Entre na sala antes do ready." }));
        return;
      }
      session.ready = msg.ready ?? !session.ready;
      ws.serializeAttachment(session);
      this.broadcastState();
      return;
    }

    if (msg.type === "input") {
      if (session.slot === 0) return;
      const seq = Number(msg.seq ?? 0) || 0;
      const lastSeq = this.lastInputSeqBySlot.get(session.slot) ?? 0;
      if (seq > 0 && seq < lastSeq) return;
      if (seq > 0) this.lastInputSeqBySlot.set(session.slot, seq);
      session.input = normalizeInput(msg.input);
      ws.serializeAttachment(session);
      this.broadcast({
        type: "input",
        from: session.slot,
        hostSlot: this.ensureHost(),
        seq,
        input: session.input,
        serverTime: Date.now(),
        t: Date.now(),
      });
      return;
    }

    if (msg.type === "sync") {
      // Host-authoritative v2: o host é a fonte da verdade; o Worker só relaya o quadro mais novo.
      if (session.slot !== this.ensureHost() || !this.gameActive) return;
      const rawSnapshot = msg.snapshot && typeof msg.snapshot === "object" ? msg.snapshot : {};
      const incomingTick = Number(rawSnapshot.tick ?? rawSnapshot.seq ?? 0) || this.lastSnapshotTick + 1;
      if (incomingTick <= this.lastSnapshotTick) return;
      this.lastSnapshotTick = incomingTick;
      const serverTime = Date.now();
      const snapshot: HostSnapshot = {
        ...rawSnapshot,
        tick: incomingTick,
        seq: Number(rawSnapshot.seq ?? incomingTick) || incomingTick,
        serverTime,
        netModel: "host-authoritative-v2",
      };
      this.broadcast({
        type: "sync",
        from: session.slot,
        hostSlot: this.ensureHost(),
        snapshot,
        serverTime,
        t: serverTime,
        priority: "host-frame",
        netModel: "host-authoritative-v2",
      }, ws);
      return;
    }

    if (msg.type === "pause_request") {
      if (session.slot === 0) return;
      if (!this.pauseRequestedBy) {
        this.pauseRequestedBy = session.slot;
        this.pauseCommitted = false;
        this.pauseReadySlots.clear();
      }
      this.pauseReadySlots.add(session.slot);
      this.broadcastPauseState();
      const players = this.players();
      const allReady = players.length > 0 && players.every((p) => this.pauseReadySlots.has(p.slot));
      if (allReady && !this.pauseCommitted) {
        this.pauseCommitted = true;
        this.broadcast({ type: "pause_commit", room: this.roomCode, requestedBy: this.pauseRequestedBy, readySlots: [...this.pauseReadySlots], t: Date.now() });
      }
      return;
    }

    if (msg.type === "pause_ready") {
      if (session.slot === 0 || !this.pauseRequestedBy) return;
      if (msg.ready === false) this.pauseReadySlots.delete(session.slot);
      else this.pauseReadySlots.add(session.slot);
      this.broadcastPauseState();
      const players = this.players();
      const allReady = players.length > 0 && players.every((p) => this.pauseReadySlots.has(p.slot));
      if (allReady && !this.pauseCommitted) {
        this.pauseCommitted = true;
        this.broadcast({ type: "pause_commit", room: this.roomCode, requestedBy: this.pauseRequestedBy, readySlots: [...this.pauseReadySlots], t: Date.now() });
      } else if (allReady && this.pauseCommitted) {
        this.pauseRequestedBy = null;
        this.pauseCommitted = false;
        this.pauseReadySlots.clear();
        this.broadcast({ type: "unpause_start", room: this.roomCode, t: Date.now() });
      }
      return;
    }

    if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong", t: msg.t ?? Date.now(), serverTime: Date.now() }));
      return;
    }

    if (msg.type === "lobby_return_request") {
      if (session.slot !== this.ensureHost() && this.gameActive) {
        ws.send(JSON.stringify({ type: "error", error: "Só o host pode voltar todos ao lobby por enquanto." }));
        return;
      }
      this.gameActive = false;
      this.pauseRequestedBy = null;
      this.pauseCommitted = false;
      this.pauseReadySlots.clear();
      this.broadcast({ type: "lobby_return", room: this.roomCode, requestedBy: session.slot, t: Date.now() });
      this.broadcastState();
      return;
    }

    if (msg.type === "leave") {
      ws.close(1000, "Saiu da sala");
    }
  }

  async webSocketClose(ws: WebSocket) {
    const session = this.sessions.get(ws);
    if (session?.slot) this.pauseReadySlots.delete(session.slot);
    if (session?.slot === this.pauseRequestedBy) this.pauseRequestedBy = null;
    const wasHost = Boolean(session?.slot && session.slot === this.hostSlot);
    this.sessions.delete(ws);
    if (this.gameActive && session?.slot) {
      const nextHost = this.ensureHost();
      if (wasHost && this.players().length > 0) {
        this.lastSnapshotTick = 0;
        this.broadcast({ type: "host_changed", room: this.roomCode, hostSlot: nextHost, migrated: true, t: Date.now() });
        this.broadcast({ type: "host_migrated", room: this.roomCode, oldHost: session.slot, hostSlot: nextHost, t: Date.now() });
      } else {
        this.gameActive = false;
        this.pauseRequestedBy = null;
        this.pauseCommitted = false;
        this.pauseReadySlots.clear();
        this.broadcast({ type: "player_left", room: this.roomCode, slot: session.slot, t: Date.now() });
      }
    } else {
      const nextHost = this.ensureHost();
      this.broadcast({ type: "host_changed", room: this.roomCode, hostSlot: nextHost, t: Date.now() });
    }
    this.broadcastState();
    if (this.pauseRequestedBy) this.broadcastPauseState();
  }

  async webSocketError(ws: WebSocket) {
    const session = this.sessions.get(ws);
    const wasHost = Boolean(session?.slot && session.slot === this.hostSlot);
    this.sessions.delete(ws);
    if (this.gameActive && session?.slot) {
      const nextHost = this.ensureHost();
      if (wasHost && this.players().length > 0) {
        this.lastSnapshotTick = 0;
        this.broadcast({ type: "host_changed", room: this.roomCode, hostSlot: nextHost, migrated: true, t: Date.now() });
        this.broadcast({ type: "host_migrated", room: this.roomCode, oldHost: session.slot, hostSlot: nextHost, t: Date.now() });
      } else {
        this.gameActive = false;
        this.pauseRequestedBy = null;
        this.pauseCommitted = false;
        this.pauseReadySlots.clear();
        this.broadcast({ type: "player_left", room: this.roomCode, slot: session.slot, t: Date.now() });
      }
    } else {
      const nextHost = this.ensureHost();
      this.broadcast({ type: "host_changed", room: this.roomCode, hostSlot: nextHost, t: Date.now() });
    }
    this.broadcastState();
  }

  private publicPlayer(session: PlayerSession) {
    return {
      id: session.id,
      slot: session.slot,
      name: session.name,
      ready: session.ready,
      device: session.device,
      connected: true,
      host: session.slot === this.ensureHost(),
    };
  }

  private players() {
    return [...this.sessions.values()]
      .filter((s) => s.slot > 0)
      .sort((a, b) => a.slot - b.slot)
      .map((s) => this.publicPlayer(s));
  }

  private modeVotes() {
    const votes: Record<number, GameMode> = {};
    for (const session of this.sessions.values()) {
      if (session.slot > 0) votes[session.slot] = session.modeVote || "localPvp";
    }
    return votes;
  }

  private selectedMode(): GameMode {
    const counts = new Map<GameMode, number>();
    for (const mode of VALID_MODES) counts.set(mode, 0);
    for (const session of this.sessions.values()) {
      if (session.slot > 0) counts.set(session.modeVote || "localPvp", (counts.get(session.modeVote || "localPvp") || 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const top = ranked[0]?.[1] ?? 0;
    const tied = ranked.filter(([, count]) => count === top && count > 0).map(([mode]) => mode);
    if (tied.length > 1) return tied[Math.floor(Date.now() / 1200) % tied.length];
    return ranked[0]?.[0] || "localPvp";
  }

  private broadcastState() {
    const players = this.players();
    const selectedMode = this.selectedMode();
    this.broadcast({
      type: "room_state",
      room: this.roomCode,
      players,
      modeVotes: this.modeVotes(),
      selectedMode,
      hostSlot: this.ensureHost(),
      canStart: players.length >= 2 && players.every((p) => p.ready),
      netModel: "host-authoritative-v2",
      version: "1.4.0-netcode",
      tick: this.lastSnapshotTick,
      t: Date.now(),
    });
  }

  private broadcastPauseState() {
    this.broadcast({
      type: "pause_state",
      room: this.roomCode,
      requestedBy: this.pauseRequestedBy,
      readySlots: [...this.pauseReadySlots],
      committed: this.pauseCommitted,
      t: Date.now(),
    });
  }

  private broadcast(data: unknown, except?: WebSocket) {
    const payload = JSON.stringify(data);
    for (const ws of this.sessions.keys()) {
      if (except && ws === except) continue;
      try {
        ws.send(payload);
      } catch {
        this.sessions.delete(ws);
      }
    }
  }
}
