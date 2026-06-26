var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
import { DurableObject } from "cloudflare:workers";
var EMPTY_INPUT = {
  left: false,
  right: false,
  up: false,
  down: false,
  shot: false,
  strong: false,
  boost: false,
  dodge: false
};
var VALID_MODES = ["localPvp", "localCoop", "localScore"];
function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      ...init.headers
    }
  });
}
__name(json, "json");
function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
__name(randomRoomCode, "randomRoomCode");
function cleanRoomCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}
__name(cleanRoomCode, "cleanRoomCode");
function cleanName(value, fallback) {
  const name = String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}0-9 _.-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 16);
  return name.length >= 2 ? name : fallback;
}
__name(cleanName, "cleanName");
function cleanMode(value) {
  return VALID_MODES.includes(value) ? value : "localPvp";
}
__name(cleanMode, "cleanMode");
function normalizeInput(input) {
  return {
    left: Boolean(input?.left),
    right: Boolean(input?.right),
    up: Boolean(input?.up),
    down: Boolean(input?.down),
    shot: Boolean(input?.shot),
    strong: Boolean(input?.strong),
    boost: Boolean(input?.boost),
    dodge: Boolean(input?.dodge)
  };
}
__name(normalizeInput, "normalizeInput");
function websocketUrl(request, room) {
  const url = new URL(request.url);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `/room/${room}/ws`;
  url.search = "";
  return url.toString();
}
__name(websocketUrl, "websocketUrl");
async function roomFetch(env, room, path, init) {
  const id = env.GAME_ROOM.idFromName(room);
  const stub = env.GAME_ROOM.get(id);
  return stub.fetch(new Request(`https://space-news.local/room/${room}${path}`, init));
}
__name(roomFetch, "roomFetch");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return json({ ok: true });
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "Space News Online", version: "0.3.0" });
    }
    if (url.pathname === "/create") {
      for (let attempt = 0; attempt < 8; attempt++) {
        const room = randomRoomCode();
        const created = await roomFetch(env, room, "/create", { method: "POST" });
        if (created.ok) return json({ room, wsUrl: websocketUrl(request, room) });
      }
      return json({ error: "N\xE3o consegui gerar sala." }, { status: 500 });
    }
    if (url.pathname === "/check") {
      const room = cleanRoomCode(url.searchParams.get("room"));
      if (!room) return json({ exists: false, room: "" });
      const response = await roomFetch(env, room, "/check");
      const data = await response.json().catch(() => ({ exists: false }));
      return json({ room, exists: Boolean(data.exists) });
    }
    const match = url.pathname.match(/^\/room\/([A-Z0-9]{3,12})\/ws$/i);
    if (match) {
      const room = cleanRoomCode(match[1]);
      const id = env.GAME_ROOM.idFromName(room);
      const stub = env.GAME_ROOM.get(id);
      return stub.fetch(request);
    }
    return json({ error: "Rota n\xE3o encontrada." }, { status: 404 });
  }
};
var GameRoom = class extends DurableObject {
  static {
    __name(this, "GameRoom");
  }
  sessions = /* @__PURE__ */ new Map();
  roomCode = "ROOM";
  constructor(ctx, env) {
    super(ctx, env);
    for (const ws of ctx.getWebSockets()) {
      const session = ws.deserializeAttachment();
      if (session) this.sessions.set(ws, session);
    }
  }
  async fetch(request) {
    const url = new URL(request.url);
    const roomMatch = url.pathname.match(/^\/room\/([A-Z0-9]{3,12})(?:\/ws|\/create|\/check)?$/i);
    this.roomCode = cleanRoomCode(roomMatch?.[1] || "ROOM") || "ROOM";
    if (url.pathname.endsWith("/create")) {
      const alreadyCreated = await this.ctx.storage.get("created");
      if (alreadyCreated) return json({ ok: false, exists: true }, { status: 409 });
      await this.ctx.storage.put("created", true);
      await this.ctx.storage.put("createdAt", Date.now());
      await this.ctx.storage.put("selectedMode", "localPvp");
      return json({ ok: true, room: this.roomCode });
    }
    if (url.pathname.endsWith("/check")) {
      const exists = Boolean(await this.ctx.storage.get("created"));
      return json({ exists, room: this.roomCode, players: this.players().length });
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ error: "Use WebSocket nesta rota." }, { status: 426 });
    }
    const created = Boolean(await this.ctx.storage.get("created"));
    if (!created) {
      return json({ error: "Sala n\xE3o existe." }, { status: 404 });
    }
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const placeholder = {
      id: crypto.randomUUID(),
      slot: 0,
      name: "---",
      ready: false,
      device: "unknown",
      connectedAt: Date.now(),
      lastSeen: Date.now(),
      input: { ...EMPTY_INPUT },
      modeVote: "localPvp"
    };
    server.serializeAttachment(placeholder);
    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, placeholder);
    server.send(
      JSON.stringify({
        type: "hello",
        room: this.roomCode,
        message: "Conectado. Envie { type: 'join', name: 'Ninick' }."
      })
    );
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string") return;
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      ws.send(JSON.stringify({ type: "error", error: "JSON inv\xE1lido." }));
      return;
    }
    const session = this.sessions.get(ws) || ws.deserializeAttachment();
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
      ws.send(JSON.stringify({ type: "joined", room: this.roomCode, player: this.publicPlayer(session) }));
      this.broadcastState();
      return;
    }
    if (msg.type === "profile") {
      if (session.slot === 0) return;
      if (msg.name !== void 0) session.name = cleanName(msg.name, `P${session.slot}`);
      if (msg.device !== void 0) session.device = String(msg.device || "unknown").slice(0, 32);
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
      this.broadcast({ type: "game_start", room: this.roomCode, mode, t: Date.now() });
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
      session.input = normalizeInput(msg.input);
      ws.serializeAttachment(session);
      this.broadcast({
        type: "input",
        from: session.slot,
        seq: msg.seq ?? 0,
        input: session.input,
        t: Date.now()
      });
      return;
    }
    if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong", t: msg.t ?? Date.now(), serverTime: Date.now() }));
      return;
    }
    if (msg.type === "leave") {
      ws.close(1e3, "Saiu da sala");
    }
  }
  async webSocketClose(ws) {
    this.sessions.delete(ws);
    this.broadcastState();
  }
  async webSocketError(ws) {
    this.sessions.delete(ws);
    this.broadcastState();
  }
  publicPlayer(session) {
    return {
      id: session.id,
      slot: session.slot,
      name: session.name,
      ready: session.ready,
      device: session.device,
      connected: true
    };
  }
  players() {
    return [...this.sessions.values()].filter((s) => s.slot > 0).sort((a, b) => a.slot - b.slot).map((s) => this.publicPlayer(s));
  }
  modeVotes() {
    const votes = {};
    for (const session of this.sessions.values()) {
      if (session.slot > 0) votes[session.slot] = session.modeVote || "localPvp";
    }
    return votes;
  }
  selectedMode() {
    const counts = /* @__PURE__ */ new Map();
    for (const mode of VALID_MODES) counts.set(mode, 0);
    for (const session of this.sessions.values()) {
      if (session.slot > 0) counts.set(session.modeVote || "localPvp", (counts.get(session.modeVote || "localPvp") || 0) + 1);
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return ranked[0]?.[0] || "localPvp";
  }
  broadcastState() {
    const players = this.players();
    const selectedMode = this.selectedMode();
    this.broadcast({
      type: "room_state",
      room: this.roomCode,
      players,
      modeVotes: this.modeVotes(),
      selectedMode,
      canStart: players.length >= 2 && players.every((p) => p.ready),
      t: Date.now()
    });
  }
  broadcast(data) {
    const payload = JSON.stringify(data);
    for (const ws of this.sessions.keys()) {
      try {
        ws.send(payload);
      } catch {
        this.sessions.delete(ws);
      }
    }
  }
};
export {
  GameRoom,
  index_default as default
};
//# sourceMappingURL=index.js.map
