"use client";

import { useEffect, useRef, useState } from "react";

type GameState = "menu" | "playing" | "paused";

type Shot = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  damage: number;
  type: "normal" | "strong";
};

const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 720,

  playerSpeed: 6,

  normalShotSpeed: 8,
  normalShotCooldownFrames: 12,
  normalShotDamage: 1,

  strongShotSpeed: 6,
  strongShotDamage: 5,
  strongShotCooldownMs: 8000,

  sprites: {
    player: "/game/player.png",
    normalShot: "/game/shot-normal.png",
    strongShot: "/game/shot-strong.png",
    background: "/game/background.png",
  },

  sounds: {
    normalShot: "/sounds/game-shot.mp3",
    strongShot: "/sounds/game-strong-shot.mp3",
  },

  useSprites: true,
  useSounds: true,
};

export default function JogoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const mobileShootRef = useRef(false);
  const gameStateRef = useRef<GameState>("menu");
  const strongCooldownRef = useRef(0);

  const playerRef = useRef({
    x: 100,
    y: 320,
    w: 52,
    h: 40,
    normalCooldown: 0,
    strongReadyAt: 0,
  });

  const shotsRef = useRef<Shot[]>([]);

  const spritesRef = useRef<Record<string, HTMLImageElement | null>>({
    player: null,
    normalShot: null,
    strongShot: null,
    background: null,
  });

  const [gameState, setGameState] = useState<GameState>("menu");
  const [strongCooldown, setStrongCooldown] = useState(0);

  function setEstado(estado: GameState) {
    gameStateRef.current = estado;
    setGameState(estado);
  }

  function tocarSom(src: string) {
    if (!CONFIG.useSounds) return;

    const audio = new Audio(src);
    audio.volume = 0.45;
    audio.play().catch(() => {});
  }

  function iniciarJogo() {
    playerRef.current = {
      x: 100,
      y: 320,
      w: 52,
      h: 40,
      normalCooldown: 0,
      strongReadyAt: 0,
    };

    shotsRef.current = [];
    strongCooldownRef.current = 0;
    setStrongCooldown(0);

    setEstado("playing");
  }

  function pausarOuVoltar() {
    if (gameStateRef.current === "playing") {
      setEstado("paused");
    } else if (gameStateRef.current === "paused") {
      setEstado("playing");
    }
  }

  function tiroForteMobile() {
    keysRef.current["x"] = true;

    setTimeout(() => {
      keysRef.current["x"] = false;
    }, 80);
  }

  useEffect(() => {
    function carregarImagem(src: string) {
      return new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    }

    async function carregarAssets() {
      spritesRef.current.player = await carregarImagem(CONFIG.sprites.player);
      spritesRef.current.normalShot = await carregarImagem(CONFIG.sprites.normalShot);
      spritesRef.current.strongShot = await carregarImagem(CONFIG.sprites.strongShot);
      spritesRef.current.background = await carregarImagem(CONFIG.sprites.background);
    }

    carregarAssets();
  }, []);

  useEffect(() => {
    const canvasAtual = canvasRef.current;
    if (!canvasAtual) return;

    const contexto = canvasAtual.getContext("2d");
    if (!contexto) return;

    const canvas = canvasAtual;
    const ctx = contexto;

    canvas.width = CONFIG.canvasWidth;
    canvas.height = CONFIG.canvasHeight;

    let animationFrame = 0;
    let lastTime = performance.now();

    function shootNormal() {
      const player = playerRef.current;

      if (player.normalCooldown > 0) return;

      shotsRef.current.push({
        x: player.x + player.w,
        y: player.y + player.h / 2 - 4,
        w: 24,
        h: 8,
        speed: CONFIG.normalShotSpeed,
        damage: CONFIG.normalShotDamage,
        type: "normal",
      });

      tocarSom(CONFIG.sounds.normalShot);
      player.normalCooldown = CONFIG.normalShotCooldownFrames;
    }

    function shootStrong() {
      const player = playerRef.current;
      const now = performance.now();

      if (now < player.strongReadyAt) return;

      shotsRef.current.push({
        x: player.x + player.w,
        y: player.y + player.h / 2 - 12,
        w: 58,
        h: 24,
        speed: CONFIG.strongShotSpeed,
        damage: CONFIG.strongShotDamage,
        type: "strong",
      });

      tocarSom(CONFIG.sounds.strongShot);

      player.strongReadyAt = now + CONFIG.strongShotCooldownMs;
      strongCooldownRef.current = Math.ceil(CONFIG.strongShotCooldownMs / 1000);
      setStrongCooldown(strongCooldownRef.current);
    }

    const cooldownTimer = setInterval(() => {
      const player = playerRef.current;

      const restante = Math.max(
        0,
        Math.ceil((player.strongReadyAt - performance.now()) / 1000)
      );

      strongCooldownRef.current = restante;
      setStrongCooldown(restante);
    }, 250);

    function desenharFundo() {
      const bg = spritesRef.current.background;

      if (CONFIG.useSprites && bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(96, 165, 250, 0.35)";

      for (let i = 0; i < 70; i++) {
        const x = (i * 173) % canvas.width;
        const y = (i * 91) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    function desenharPlayer() {
      const player = playerRef.current;
      const sprite = spritesRef.current.player;

      if (CONFIG.useSprites && sprite) {
        ctx.drawImage(sprite, player.x, player.y, player.w, player.h);
        return;
      }

      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(player.x, player.y, player.w, player.h);

      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(player.x + 34, player.y + 12, 12, 12);
    }

    function desenharTiro(shot: Shot) {
      const sprite =
        shot.type === "strong"
          ? spritesRef.current.strongShot
          : spritesRef.current.normalShot;

      if (CONFIG.useSprites && sprite) {
        ctx.drawImage(sprite, shot.x, shot.y, shot.w, shot.h);
        return;
      }

      ctx.fillStyle = shot.type === "strong" ? "#facc15" : "#60a5fa";
      ctx.fillRect(shot.x, shot.y, shot.w, shot.h);
    }

    function desenharHUD() {
      ctx.fillStyle = "white";
      ctx.font = "24px monospace";
      ctx.fillText("Z: tiro normal", 24, 38);

      ctx.fillText(
        strongCooldownRef.current > 0
          ? `X: forte ${strongCooldownRef.current}s`
          : "X: forte pronto",
        24,
        70
      );

      ctx.fillText("P: pausar", 24, 102);
    }

    function atualizar(delta: number) {
      // if (gameStateRef.current !== "playing") return;

      const player = playerRef.current;
      const speedFactor = delta / 16.67;

      const up = keysRef.current["arrowup"] || keysRef.current["w"];
      const down = keysRef.current["arrowdown"] || keysRef.current["s"];
      const left = keysRef.current["arrowleft"] || keysRef.current["a"];
      const right = keysRef.current["arrowright"] || keysRef.current["d"];

      if (up) player.y -= CONFIG.playerSpeed * speedFactor;
      if (down) player.y += CONFIG.playerSpeed * speedFactor;
      if (left) player.x -= CONFIG.playerSpeed * speedFactor;
      if (right) player.x += CONFIG.playerSpeed * speedFactor;

      if (keysRef.current["z"] || mobileShootRef.current) shootNormal();
      if (keysRef.current["x"]) shootStrong();

      player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
      player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

      if (player.normalCooldown > 0) {
        player.normalCooldown -= 1;
      }

      shotsRef.current = shotsRef.current
        .map((shot) => ({
          ...shot,
          x: shot.x + shot.speed * speedFactor,
        }))
        .filter((shot) => shot.x < canvas.width + 100);
    }

    function loop(time: number) {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      atualizar(delta);

      desenharFundo();

      for (const shot of shotsRef.current) {
        desenharTiro(shot);
      }

      desenharPlayer();
      desenharHUD();

      if (gameStateRef.current === "paused") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.font = "64px monospace";
        ctx.fillText("PAUSADO", canvas.width / 2 - 140, canvas.height / 2);
      }

      animationFrame = requestAnimationFrame(loop);
    }

    function keyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
      }

      if (key === "p" || key === "escape") {
        pausarOuVoltar();
      }
    }

    function keyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;
    }

    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    animationFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(cooldownTimer);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  return (
    <main className="game-page">
      <div className="game-wrapper">
        <h1>🚀 Space News</h1>

        <div className="game-area">
          <canvas ref={canvasRef} className="game-canvas" />

          {gameState === "menu" && (
            <div className="game-menu-layer">
              <h2>Defenda a Terra!</h2>
              <p>Portais falsos querem espalhar fake news pelo planeta.</p>
              <button onClick={iniciarJogo}>Jogar!</button>
            </div>
          )}

          {gameState === "paused" && (
            <div className="game-menu-layer">
              <h2>Jogo pausado</h2>
              <button onClick={pausarOuVoltar}>Continuar</button>
            </div>
          )}
        </div>

        <div className="game-controls-mobile">
          <button
            onTouchStart={() => {
              mobileShootRef.current = true;
            }}
            onTouchEnd={() => {
              mobileShootRef.current = false;
            }}
            onMouseDown={() => {
              mobileShootRef.current = true;
            }}
            onMouseUp={() => {
              mobileShootRef.current = false;
            }}
          >
            🔫 Tiro
          </button>

          <button onClick={tiroForteMobile} disabled={strongCooldown > 0}>
            💥 Forte {strongCooldown > 0 ? `${strongCooldown}s` : ""}
          </button>

          <button onClick={pausarOuVoltar}>⏸ Pause</button>
        </div>

        <p>WASD ou Setas para mover • Z tiro normal • X tiro forte • P pausa</p>
      </div>
    </main>
  );
}