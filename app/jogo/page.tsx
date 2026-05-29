"use client";

import { useEffect, useRef, useState } from "react";

type GameState = "menu" | "playing" | "paused";

type SpriteKey =
  | "player"
  | "normalShot"
  | "strongShot"
  | "background"
  | "menuBackground"
  | "portal"
  | "chocado";

type Shot = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  damage: number;
  type: "normal" | "strong";
};

type SpriteConfig = {
  src: string;
  frameWidth?: number;
  frameHeight?: number;
  frames?: number;
  fps?: number;
};

const ASSETS: Record<SpriteKey, SpriteConfig> = {
  player: {
    src: "/game/player/ship.png",
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 8,
  },

  normalShot: {
    src: "/game/shots/normal.png",
  },

  strongShot: {
    src: "/game/shots/strong.png",
  },

  background: {
    src: "/game/backgrounds/space.png",
  },

  menuBackground: {
    src: "/game/backgrounds/menu-bg.png",
  },

  portal: {
    src: "/game/enemies/portal-sheet.png",
    frameWidth: 64,
    frameHeight: 64,
    frames: 4,
    fps: 8,
  },

  chocado: {
    src: "/game/bosses/chocado-sheet.png",
    frameWidth: 128,
    frameHeight: 128,
    frames: 6,
    fps: 7,
  },
};

const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 720,

  playerSpeed: 6,

  normalShotSpeed: 7,
  normalShotCooldownFrames: 14,
  normalShotDamage: 1,

  strongShotSpeed: 5,
  strongShotDamage: 5,
  strongShotCooldownMs: 8000,

  useSprites: true,
  useSounds: true,

  fonts: {
    title: "SpaceNewsTitle",
    ui: "SpaceNewsUI",
  },

  menu: {
    title: "SPACE NEWS",
    subtitle: "Defenda a Terra!",
    description:
      "Portais falsos querem invadir o planeta e espalhar fake news.",
    playButton: "JOGAR!",
    controls: "WASD / Setas: mover • Z: tiro • X: tiro forte • P/ESC: pause",
  },

  sounds: {
    normalShot: "/sounds/game-shot.mp3",
    strongShot: "/sounds/game-strong-shot.mp3",
  },

  colors: {
    fallbackBackground: "#020617",
    player: "#60a5fa",
    normalShot: "#60a5fa",
    strongShot: "#facc15",
  },
};

class AssetManager {
  private images = new Map<SpriteKey, HTMLImageElement | null>();

  async loadAll() {
    const entries = Object.entries(ASSETS) as [SpriteKey, SpriteConfig][];

    await Promise.all(
      entries.map(async ([key, config]) => {
        const image = await this.loadImage(config.src);
        this.images.set(key, image);
      })
    );
  }

  get(key: SpriteKey) {
    return this.images.get(key) ?? null;
  }

  private loadImage(src: string) {
    return new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.src = src;

      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Asset não encontrado: ${src}`);
        resolve(null);
      };
    });
  }
}

class Sprite {
  key: SpriteKey;
  x: number;
  y: number;
  w: number;
  h: number;

  constructor(key: SpriteKey, x: number, y: number, w: number, h: number) {
    this.key = key;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }

  draw(ctx: CanvasRenderingContext2D, assets: AssetManager) {
    const img = assets.get(this.key);

    if (!CONFIG.useSprites || !img) return false;

    ctx.drawImage(img, this.x, this.y, this.w, this.h);
    return true;
  }
}

class AnimatedSprite extends Sprite {
  frame = 0;
  elapsed = 0;

  update(delta: number) {
    const config = ASSETS[this.key];

    if (!config.frames || !config.fps) return;

    this.elapsed += delta;

    const frameTime = 1000 / config.fps;

    if (this.elapsed >= frameTime) {
      this.elapsed = 0;
      this.frame = (this.frame + 1) % config.frames;
    }
  }

  draw(ctx: CanvasRenderingContext2D, assets: AssetManager) {
    const img = assets.get(this.key);
    const config = ASSETS[this.key];

    if (
      !CONFIG.useSprites ||
      !img ||
      !config.frameWidth ||
      !config.frameHeight
    ) {
      return super.draw(ctx, assets);
    }

    ctx.drawImage(
      img,
      this.frame * config.frameWidth,
      0,
      config.frameWidth,
      config.frameHeight,
      this.x,
      this.y,
      this.w,
      this.h
    );

    return true;
  }
}

export default function JogoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const mobileShootRef = useRef(false);

  const gameStateRef = useRef<GameState>("menu");
  const [gameState, setGameState] = useState<GameState>("menu");

  const strongCooldownRef = useRef(0);
  const [strongCooldown, setStrongCooldown] = useState(0);

  const assetsRef = useRef(new AssetManager());

  const playerRef = useRef({
    x: 100,
    y: 320,
    w: 64,
    h: 64,
    normalCooldown: 0,
    strongReadyAt: 0,
  });

  const playerAnimRef = useRef(
    new AnimatedSprite("player", 100, 320, 64, 64)
  );

  const shotsRef = useRef<Shot[]>([]);

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
      w: 64,
      h: 64,
      normalCooldown: 0,
      strongReadyAt: 0,
    };

    shotsRef.current = [];
    strongCooldownRef.current = 0;
    setStrongCooldown(0);
    setEstado("playing");
  }

  function pausarOuVoltar() {
    if (gameStateRef.current === "playing") setEstado("paused");
    else if (gameStateRef.current === "paused") setEstado("playing");
  }

  function tiroForteMobile() {
    keysRef.current["x"] = true;

    setTimeout(() => {
      keysRef.current["x"] = false;
    }, 80);
  }

  useEffect(() => {
    assetsRef.current.loadAll();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = CONFIG.canvasWidth;
    canvas.height = CONFIG.canvasHeight;

    let animationFrame = 0;
    let lastTime = performance.now();

    function shootNormal() {
      const player = playerRef.current;
      if (player.normalCooldown > 0) return;

      shotsRef.current.push({
        x: player.x + player.w - 4,
        y: player.y + player.h / 2 - 4,
        w: 28,
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
        x: player.x + player.w - 4,
        y: player.y + player.h / 2 - 13,
        w: 64,
        h: 26,
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
      const bg = assetsRef.current.get("background");

      if (CONFIG.useSprites && bg) {
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.fillStyle = CONFIG.colors.fallbackBackground;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(96, 165, 250, 0.35)";

      for (let i = 0; i < 120; i++) {
        const x = (i * 173) % canvas.width;
        const y = (i * 91) % canvas.height;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    function desenharPlayer(delta: number) {
      const player = playerRef.current;
      const anim = playerAnimRef.current;

      anim.x = player.x;
      anim.y = player.y;
      anim.w = player.w;
      anim.h = player.h;

      anim.update(delta);

      const desenhou = anim.draw(ctx, assetsRef.current);

      if (desenhou) return;

      ctx.fillStyle = CONFIG.colors.player;
      ctx.fillRect(player.x, player.y, player.w, player.h);

      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(player.x + 40, player.y + 22, 14, 14);
    }

    function desenharTiro(shot: Shot) {
      const key = shot.type === "strong" ? "strongShot" : "normalShot";

      const sprite = new Sprite(key, shot.x, shot.y, shot.w, shot.h);
      const desenhou = sprite.draw(ctx, assetsRef.current);

      if (desenhou) return;

      ctx.fillStyle =
        shot.type === "strong"
          ? CONFIG.colors.strongShot
          : CONFIG.colors.normalShot;

      ctx.fillRect(shot.x, shot.y, shot.w, shot.h);
    }

    function desenharHUD() {
      if (gameStateRef.current !== "playing") return;

      ctx.save();

      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(18, 18, 260, 100);

      ctx.fillStyle = "white";
      ctx.font = `24px ${CONFIG.fonts.ui}`;

      ctx.fillText("Z: tiro normal", 34, 50);

      ctx.fillText(
        strongCooldownRef.current > 0
          ? `X: forte ${strongCooldownRef.current}s`
          : "X: forte pronto",
        34,
        80
      );

      ctx.fillText("P/ESC: pausar", 34, 110);

      ctx.restore();
    }

    function atualizar(delta: number) {
      if (gameStateRef.current !== "playing") return;

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
        .filter((shot) => shot.x < canvas.width + 120);
    }

    function loop(time: number) {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      atualizar(delta);

      desenharFundo();

      for (const shot of shotsRef.current) {
        desenharTiro(shot);
      }

      desenharPlayer(delta);
      desenharHUD();

      animationFrame = requestAnimationFrame(loop);
    }

    function keyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
      ) {
        e.preventDefault();
      }

      if (key === "p" || key === "escape") {
        pausarOuVoltar();
      }
    }

    function keyUp(e: KeyboardEvent) {
      keysRef.current[e.key.toLowerCase()] = false;
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
    <main
      className="game-fullscreen-page"
      style={
        {
          "--game-menu-bg": `url(${ASSETS.menuBackground.src})`,
          "--game-title-font": CONFIG.fonts.title,
          "--game-ui-font": CONFIG.fonts.ui,
        } as React.CSSProperties
      }
    >
      <canvas ref={canvasRef} className="game-fullscreen-canvas" />

      {gameState === "menu" && (
        <section className="game-overlay game-menu-screen">
          <div className="game-menu-card">
            <p className="game-present">VERIFIQUE.AI apresenta</p>

            <h1>{CONFIG.menu.title}</h1>

            <h2>{CONFIG.menu.subtitle}</h2>

            <p className="game-menu-description">{CONFIG.menu.description}</p>

            <button onClick={iniciarJogo} className="game-play-button">
              {CONFIG.menu.playButton}
            </button>

            <p className="game-menu-controls">{CONFIG.menu.controls}</p>
          </div>
        </section>
      )}

      {gameState === "paused" && (
        <section className="game-overlay game-pause-screen">
          <div className="game-pause-card">
            <p className="game-present">Jogo pausado</p>

            <h1>PAUSADO</h1>

            <button onClick={pausarOuVoltar} className="game-play-button">
              CONTINUAR
            </button>
          </div>
        </section>
      )}

      {gameState === "playing" && (
        <div className="game-mobile-controls">
          <button
            onTouchStart={() => (mobileShootRef.current = true)}
            onTouchEnd={() => (mobileShootRef.current = false)}
            onMouseDown={() => (mobileShootRef.current = true)}
            onMouseUp={() => (mobileShootRef.current = false)}
          >
            🔫
          </button>

          <button onClick={tiroForteMobile} disabled={strongCooldown > 0}>
            {strongCooldown > 0 ? `${strongCooldown}s` : "💥"}
          </button>

          <button onClick={pausarOuVoltar}>⏸</button>
        </div>
      )}
    </main>
  );
}