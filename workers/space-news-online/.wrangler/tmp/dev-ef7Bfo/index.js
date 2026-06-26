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
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
__name(randomRoomCode, "randomRoomCode");
function cleanRoomCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}
__name(cleanRoomCode, "cleanRoomCode");
function cleanName(value, fallback) {
  const name = String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  return name.length >= 2 ? name.padEnd(3, "X") : fallback;
}
__name(cleanName, "cleanName");
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
var src_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return json({ ok: true });
    if (url.pathname === "/" || url.pathname === "/health") {
      return json({ ok: true, service: "Space News Online", version: "0.1.0" });
    }
    if (url.pathname === "/create") {
      const room = randomRoomCode();
      return json({ room, wsUrl: websocketUrl(request, room) });
    }
    const match = url.pathname.match(/^\/room\/([A-Z0-9]{3,8})\/ws$/i);
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
    const roomMatch = url.pathname.match(/^\/room\/([A-Z0-9]{3,8})\/ws$/i);
    this.roomCode = cleanRoomCode(roomMatch?.[1] || "ROOM") || "ROOM";
    if (request.headers.get("Upgrade") !== "websocket") {
      return json({ error: "Use WebSocket nesta rota." }, { status: 426 });
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
      input: { ...EMPTY_INPUT }
    };
    server.serializeAttachment(placeholder);
    this.ctx.acceptWebSocket(server);
    this.sessions.set(server, placeholder);
    server.send(
      JSON.stringify({
        type: "hello",
        room: this.roomCode,
        message: "Conectado. Envie { type: 'join', name: 'AAA' }."
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
      ws.serializeAttachment(session);
      this.sessions.set(ws, session);
      ws.send(JSON.stringify({ type: "joined", room: this.roomCode, player: this.publicPlayer(session) }));
      this.broadcastState();
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
  broadcastState() {
    const players = this.players();
    this.broadcast({
      type: "room_state",
      room: this.roomCode,
      players,
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

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-qeAS98/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-qeAS98/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  GameRoom,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
