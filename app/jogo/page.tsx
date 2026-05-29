"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

type GameState =
  | "title"
  | "mainMenu"
  | "storyCutscene"
  | "tutorialChoice"
  | "tutorial"
  | "playing"
  | "paused";

type GameMode = "story" | "infinite";

type SpriteKey =
  | "player"
  | "normalShot"
  | "strongShot"
  | "background"
  | "menuBackground"
  | "titleBackground"
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

type Player = {
  x: number;
  y: number;
  w: number;
  h: number;
  normalCooldown: number;
  strongReadyAt: number;
};

type GameCssVars = CSSProperties & {
  "--game-menu-bg": string;
  "--game-title-bg": string;
  "--game-title-font": string;
  "--game-ui-font": string;
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

  titleBackground: {
    src: "/game/backgrounds/title-bg.png",
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

const STORY_FRAMES = [
  {
    title: "Quadro 1",
    text: "Cleber era estudante da Escola I. Ele gostava de aprender, pesquisar e descobrir a verdade.",
  },
  {
    title: "Quadro 2",
    text: "Em uma noite estranha, Cleber percebeu que sua terra estava sendo invadida pelo exército de Chocado.",
  },
  {
    title: "Quadro 3",
    text: "Robôs da desinformação saíram dos portais, espalhando mentiras por todos os lados.",
  },
  {
    title: "Quadro 4",
    text: "Cleber entrou em sua nave Space News e partiu em direção à missão: salvar a Terra.",
  },
];

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

      img.onload = () => {
        resolve(img);
      };

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

  draw(renderCtx: CanvasRenderingContext2D, assets: AssetManager) {
    const img = assets.get(this.key);

    if (!CONFIG.useSprites || !img) {
      return false;
    }

    renderCtx.drawImage(img, this.x, this.y, this.w, this.h);
    return true;
  }
}

class AnimatedSprite extends Sprite {
  frame = 0;
  elapsed = 0;

  update(delta: number) {
    const config = ASSETS[this.key];

    if (!config.frames || !config.fps) {
      return;
    }

    this.elapsed += delta;

    const frameTime = 1000 / config.fps;

    if (this.elapsed >= frameTime) {
      this.elapsed = 0;
      this.frame = (this.frame + 1) % config.frames;
    }
  }

  draw(renderCtx: CanvasRenderingContext2D, assets: AssetManager) {
    const img = assets.get(this.key);
    const config = ASSETS[this.key];

    if (
      !CONFIG.useSprites ||
      !img ||
      !config.frameWidth ||
      !config.frameHeight
    ) {
      return super.draw(renderCtx, assets);
    }

    renderCtx.drawImage(
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const mobileShootRef = useRef(false);

  const gameStateRef = useRef<GameState>("title");
  const [gameState, setGameState] = useState<GameState>("title");

  const storyIndexRef = useRef(0);
  const [storyIndex, setStoryIndex] = useState(0);

  const strongCooldownRef = useRef(0);
  const [strongCooldown, setStrongCooldown] = useState(0);

  const assetsRef = useRef(new AssetManager());

  const playerRef = useRef<Player>({
    x: 100,
    y: 320,
    w: 64,
    h: 64,
    normalCooldown: 0,
    strongReadyAt: 0,
  });

  const playerAnimRef = useRef(new AnimatedSprite("player", 100, 320, 64, 64));

  const shotsRef = useRef<Shot[]>([]);

  function setEstado(estado: GameState) {
    gameStateRef.current = estado;
    setGameState(estado);
  }

  function setHistoriaIndex(index: number) {
    storyIndexRef.current = index;
    setStoryIndex(index);
  }

  function tocarSom(src: string) {
    if (!CONFIG.useSounds) {
      return;
    }

    const audio = new Audio(src);
    audio.volume = 0.45;
    audio.play().catch(() => {});
  }

  function abrirMenuPrincipal() {
    setEstado("mainMenu");
  }

  function escolherModo(mode: GameMode) {
    if (mode === "story") {
      setHistoriaIndex(0);
      setEstado("storyCutscene");
      return;
    }

    iniciarJogo();
  }

  function avancarHistoria() {
    const atual = storyIndexRef.current;

    if (atual < STORY_FRAMES.length - 1) {
      setHistoriaIndex(atual + 1);
      return;
    }

    setEstado("tutorialChoice");
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
    if (gameStateRef.current === "playing") {
      setEstado("paused");
      return;
    }

    if (gameStateRef.current === "paused") {
      setEstado("playing");
    }
  }

  function tiroForteMobile() {
    keysRef.current["x"] = true;

    window.setTimeout(() => {
      keysRef.current["x"] = false;
    }, 80);
  }

  useEffect(() => {
    assetsRef.current.loadAll();
  }, []);

  useEffect(() => {
    const gameCanvas = canvasRef.current;

    if (!(gameCanvas instanceof HTMLCanvasElement)) {
      return;
    }

    const renderContext = gameCanvas.getContext("2d");

    if (!(renderContext instanceof CanvasRenderingContext2D)) {
      return;
    }

    const renderCtx: CanvasRenderingContext2D = renderContext;

    gameCanvas.width = CONFIG.canvasWidth;
    gameCanvas.height = CONFIG.canvasHeight;

    let animationFrame = 0;
    let lastTime = performance.now();

    function shootNormal() {
      const player = playerRef.current;

      if (player.normalCooldown > 0) {
        return;
      }

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

      if (now < player.strongReadyAt) {
        return;
      }

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

    const cooldownTimer = window.setInterval(() => {
      const player = playerRef.current;

      const restante = Math.max(
        0,
        Math.ceil((player.strongReadyAt - performance.now()) / 1000)
      );

      strongCooldownRef.current = restante;
      setStrongCooldown(restante);
    }, 250);

    function desenharFundo(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement
    ) {
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

    function desenharPlayer(ctx: CanvasRenderingContext2D, delta: number) {
      const player = playerRef.current;
      const anim = playerAnimRef.current;

      anim.x = player.x;
      anim.y = player.y;
      anim.w = player.w;
      anim.h = player.h;

      anim.update(delta);

      const desenhou = anim.draw(ctx, assetsRef.current);

      if (desenhou) {
        return;
      }

      ctx.fillStyle = CONFIG.colors.player;
      ctx.fillRect(player.x, player.y, player.w, player.h);

      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(player.x + 40, player.y + 22, 14, 14);
    }

    function desenharTiro(ctx: CanvasRenderingContext2D, shot: Shot) {
      const key: SpriteKey =
        shot.type === "strong" ? "strongShot" : "normalShot";

      const sprite = new Sprite(key, shot.x, shot.y, shot.w, shot.h);
      const desenhou = sprite.draw(ctx, assetsRef.current);

      if (desenhou) {
        return;
      }

      ctx.fillStyle =
        shot.type === "strong"
          ? CONFIG.colors.strongShot
          : CONFIG.colors.normalShot;

      ctx.fillRect(shot.x, shot.y, shot.w, shot.h);
    }

    function desenharHUD(ctx: CanvasRenderingContext2D) {
      if (gameStateRef.current !== "playing") {
        return;
      }

      ctx.save();

      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.fillRect(18, 18, 285, 100);

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

    function atualizar(delta: number, canvas: HTMLCanvasElement) {
      if (gameStateRef.current !== "playing") {
        return;
      }

      const player = playerRef.current;
      const speedFactor = delta / 16.67;

      const up = keysRef.current["arrowup"] || keysRef.current["w"];
      const down = keysRef.current["arrowdown"] || keysRef.current["s"];
      const left = keysRef.current["arrowleft"] || keysRef.current["a"];
      const right = keysRef.current["arrowright"] || keysRef.current["d"];

      if (up) {
        player.y -= CONFIG.playerSpeed * speedFactor;
      }

      if (down) {
        player.y += CONFIG.playerSpeed * speedFactor;
      }

      if (left) {
        player.x -= CONFIG.playerSpeed * speedFactor;
      }

      if (right) {
        player.x += CONFIG.playerSpeed * speedFactor;
      }

      if (keysRef.current["z"] || mobileShootRef.current) {
        shootNormal();
      }

      if (keysRef.current["x"]) {
        shootStrong();
      }

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

      const activeCanvas = gameCanvas as HTMLCanvasElement;
const activeCtx = renderCtx as CanvasRenderingContext2D;

atualizar(delta, activeCanvas);
desenharFundo(activeCtx, activeCanvas);
      for (const shot of shotsRef.current) {
        desenharTiro(renderCtx, shot);
      }

      if (
        gameStateRef.current === "playing" ||
        gameStateRef.current === "paused"
      ) {
        desenharPlayer(renderCtx, delta);
      }

      desenharHUD(renderCtx);

      animationFrame = window.requestAnimationFrame(loop);
    }

    function keyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)
      ) {
        e.preventDefault();
      }

      if (
        gameStateRef.current === "title" &&
        (key === "enter" || key === " ")
      ) {
        abrirMenuPrincipal();
      }

      if (
        gameStateRef.current === "storyCutscene" &&
        (key === "enter" || key === " ")
      ) {
        avancarHistoria();
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

    animationFrame = window.requestAnimationFrame(loop);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearInterval(cooldownTimer);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  const gameStyle: GameCssVars = {
    "--game-menu-bg": `url(${ASSETS.menuBackground.src})`,
    "--game-title-bg": `url(${ASSETS.titleBackground.src})`,
    "--game-title-font": CONFIG.fonts.title,
    "--game-ui-font": CONFIG.fonts.ui,
  };

  return (
    <main className="game-fullscreen-page" style={gameStyle}>
      <canvas ref={canvasRef} className="game-fullscreen-canvas" />

      {gameState === "title" && (
        <section
          className="game-screen game-title-screen"
          onClick={abrirMenuPrincipal}
        >
          <div className="game-title-content">
            <h1>SPACE NEWS</h1>
            <p>PRESSIONE ENTER</p>
          </div>
        </section>
      )}

      {gameState === "mainMenu" && (
        <section className="game-screen game-main-menu-screen">
          <aside className="game-retro-panel">
            <p className="game-panel-label">Menu Principal</p>

            <h2>SPACE NEWS</h2>

            <button onClick={() => escolherModo("story")}>História</button>
            <button onClick={() => escolherModo("infinite")}>Infinito</button>
            <button disabled>Opções</button>
            <button disabled>Créditos</button>
          </aside>
        </section>
      )}

      {gameState === "storyCutscene" && (
        <section className="game-screen game-cutscene-screen">
          <div className="game-cutscene-frame">
            <div className="game-cutscene-art">
              <div className="game-cutscene-layer layer-stars" />
              <div className="game-cutscene-layer layer-earth" />
              <div className="game-cutscene-layer layer-ship" />
            </div>

            <div className="game-dialog-box">
              <strong>{STORY_FRAMES[storyIndex].title}</strong>
              <p>{STORY_FRAMES[storyIndex].text}</p>

              <button onClick={avancarHistoria}>
                {storyIndex < STORY_FRAMES.length - 1
                  ? "Avançar"
                  : "Continuar"}
              </button>
            </div>
          </div>
        </section>
      )}

      {gameState === "tutorialChoice" && (
        <section className="game-screen game-main-menu-screen">
          <aside className="game-retro-panel">
            <p className="game-panel-label">Tutorial</p>

            <h2>Fazer tutorial?</h2>

            <button onClick={() => setEstado("tutorial")}>Sim</button>
            <button onClick={iniciarJogo}>Não</button>
          </aside>
        </section>
      )}

      {gameState === "tutorial" && (
        <section className="game-screen game-tutorial-screen">
          <div className="game-tutorial-card">
            <h2>Controles</h2>

            <p>WASD ou Setas: mover</p>
            <p>Z: tiro normal</p>
            <p>X: tiro forte</p>
            <p>P ou ESC: pausar</p>

            <button onClick={iniciarJogo}>Começar missão</button>
          </div>
        </section>
      )}

      {gameState === "paused" && (
        <section className="game-screen game-pause-screen">
          <div className="game-pause-card">
            <p className="game-panel-label">Jogo pausado</p>
            <h2>PAUSADO</h2>
            <button onClick={pausarOuVoltar}>Continuar</button>
          </div>
        </section>
      )}

      {gameState === "playing" && (
        <div className="game-mobile-controls">
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