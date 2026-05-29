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
  vx: number;
  vy: number;
  tilt: number;
  normalCooldown: number;
  strongReadyAt: number;
};

type GameCssVars = CSSProperties & {
  "--game-menu-bg": string;
  "--game-title-bg": string;
  "--game-title-font": string;
  "--game-prompt-font": string;
  "--game-menu-font": string;
  "--game-ui-font": string;
};

type MenuOption = {
  label: string;
  mode?: GameMode;
  disabled?: boolean;
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

  useSprites: true,
  useSounds: true,

  fonts: {
    title: "Pixel Game",
    prompt: "ByteBounce",
    menu: "Pixel Game",
    ui: "ByteBounce",
  },

  transitions: {
    titleExitMs: 900,
    menuOpenDelayMs: 120,
    modeSelectMs: 650,
    fadeOutMs: 260,
  },

  gameplay: {
    player: {
      width: 72,
      height: 72,
      acceleration: 0.42,
      friction: 0.86,
      maxSpeedX: 7.2,
      maxSpeedY: 6.6,
      tiltMaxDeg: 16,
      tiltResponse: 0.16,
      strongShotRecoil: 7.5,
      strongShotShake: 8,
      strongShotShakeMs: 180,
    },

    shots: {
      normal: {
        width: 60,
        height: 60,
        speed: 8.2,
        damage: 1,
        cooldownFrames: 28,
      },

      strong: {
        width: 72,
        height: 72,
        speed: 10,
        damage: 5,
        cooldownMs: 8000,
      },
    },
  },

  sounds: {
    menuMove: "/sounds/menu-move.mp3",
    menuConfirm: "/sounds/menu-confirm.mp3",
    menuBack: "/sounds/menu-back.mp3",
    pause: "/sounds/game-pause.mp3",
    cutsceneNext: "/sounds/cutscene-next.mp3",
    transition: "/sounds/game-transition.mp3",

    normalShot: "/sounds/game-shot.mp3",
    strongShot: "/sounds/game-strong-shot.mp3",
    explosion: "/sounds/game-explosion.mp3",
    enemyHit: "/sounds/enemy-hit.mp3",
    enemyDeath: "/sounds/enemy-death.mp3",
    playerDamage: "/sounds/player-damage.mp3",
    waveStart: "/sounds/wave-start.mp3",
    bossIntro: "/sounds/boss-intro.mp3",
  },

  colors: {
    fallbackBackground: "#020617",
    player: "#60a5fa",
    playerDetail: "#dbeafe",
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

const MAIN_MENU_OPTIONS: MenuOption[] = [
  { label: "HISTÓRIA", mode: "story" },
  { label: "INFINITO", mode: "infinite" },
  { label: "CONFIGURAÇÕES", disabled: true },
  { label: "CRÉDITOS", disabled: true },
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

function createInitialPlayer(): Player {
  return {
    x: 100,
    y: 320,
    w: CONFIG.gameplay.player.width,
    h: CONFIG.gameplay.player.height,
    vx: 0,
    vy: 0,
    tilt: 0,
    normalCooldown: 0,
    strongReadyAt: 0,
  };
}

export default function JogoPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const mobileShootRef = useRef(false);

  const gameStateRef = useRef<GameState>("title");
  const [gameState, setGameState] = useState<GameState>("title");

  const titleLeavingRef = useRef(false);
  const [titleLeaving, setTitleLeaving] = useState(false);

  const menuOpenRef = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const screenFadeRef = useRef(false);
  const [screenFade, setScreenFade] = useState(false);

  const menuIndexRef = useRef(0);
  const [menuIndex, setMenuIndex] = useState(0);

  const storyIndexRef = useRef(0);
  const [storyIndex, setStoryIndex] = useState(0);

  const strongCooldownRef = useRef(0);
  const [strongCooldown, setStrongCooldown] = useState(0);

  const assetsRef = useRef(new AssetManager());

  const playerRef = useRef<Player>(createInitialPlayer());
  const playerAnimRef = useRef(
    new AnimatedSprite(
      "player",
      0,
      0,
      CONFIG.gameplay.player.width,
      CONFIG.gameplay.player.height
    )
  );

  const shotsRef = useRef<Shot[]>([]);

  const shakeRef = useRef({
    intensity: 0,
    endAt: 0,
  });

  function setEstado(estado: GameState) {
    gameStateRef.current = estado;
    setGameState(estado);
  }

  function setSaindoTitulo(valor: boolean) {
    titleLeavingRef.current = valor;
    setTitleLeaving(valor);
  }

  function setMenuAberto(valor: boolean) {
    menuOpenRef.current = valor;
    setMenuOpen(valor);
  }

  function setEscurecendo(valor: boolean) {
    screenFadeRef.current = valor;
    setScreenFade(valor);
  }

  function setIndiceMenu(index: number) {
    menuIndexRef.current = index;
    setMenuIndex(index);
  }

  function setHistoriaIndex(index: number) {
    storyIndexRef.current = index;
    setStoryIndex(index);
  }

  function tocarSom(src: string, volume = 0.45) {
    if (!CONFIG.useSounds || !src) {
      return;
    }

    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  }

  function iniciarJogo() {
    playerRef.current = createInitialPlayer();
    shotsRef.current = [];
    strongCooldownRef.current = 0;
    setStrongCooldown(0);
    setEstado("playing");
  }

  function pausarOuVoltar() {
    if (gameStateRef.current === "playing") {
      tocarSom(CONFIG.sounds.pause, 0.45);
      setEstado("paused");
      return;
    }

    if (gameStateRef.current === "paused") {
      tocarSom(CONFIG.sounds.menuConfirm, 0.4);
      setEstado("playing");
    }
  }

  function voltarAoMenuPrincipal() {
    tocarSom(CONFIG.sounds.menuBack, 0.45);

    shotsRef.current = [];
    strongCooldownRef.current = 0;
    setStrongCooldown(0);

    setEstado("mainMenu");
    setIndiceMenu(0);
    setEscurecendo(false);

    window.setTimeout(() => {
      setMenuAberto(true);
    }, 80);
  }

  function tiroForteMobile() {
    keysRef.current["x"] = true;

    window.setTimeout(() => {
      keysRef.current["x"] = false;
    }, 80);
  }

  function abrirMenuPrincipal() {
    if (gameStateRef.current !== "title" || titleLeavingRef.current) {
      return;
    }

    tocarSom(CONFIG.sounds.transition, 0.55);
    setSaindoTitulo(true);

    window.setTimeout(() => {
      setEstado("mainMenu");
      setIndiceMenu(0);
      setSaindoTitulo(false);

      window.setTimeout(() => {
        setMenuAberto(true);
      }, CONFIG.transitions.menuOpenDelayMs);
    }, CONFIG.transitions.titleExitMs);
  }

  function voltarParaTitulo() {
    tocarSom(CONFIG.sounds.menuBack, 0.45);

    setMenuAberto(false);
    setEscurecendo(true);

    window.setTimeout(() => {
      setEstado("title");
      setIndiceMenu(0);
      setSaindoTitulo(false);
      setEscurecendo(false);
    }, 360);
  }

  function executarEscolhaDeModo(mode: GameMode) {
    tocarSom(CONFIG.sounds.menuConfirm, 0.52);

    setMenuAberto(false);
    setEscurecendo(true);

    window.setTimeout(() => {
      if (mode === "story") {
        setHistoriaIndex(0);
        setEstado("storyCutscene");
      } else {
        iniciarJogo();
      }

      window.setTimeout(() => {
        setEscurecendo(false);
      }, 160);
    }, CONFIG.transitions.modeSelectMs);
  }

  function escolherModo(mode: GameMode) {
    executarEscolhaDeModo(mode);
  }

  function confirmarOpcaoMenuAtual() {
    const option = MAIN_MENU_OPTIONS[menuIndexRef.current];

    if (!option || option.disabled || !option.mode) {
      tocarSom(CONFIG.sounds.menuBack, 0.35);
      return;
    }

    escolherModo(option.mode);
  }

  function avancarHistoria() {
    tocarSom(CONFIG.sounds.cutsceneNext, 0.45);

    const atual = storyIndexRef.current;

    if (atual < STORY_FRAMES.length - 1) {
      setHistoriaIndex(atual + 1);
      return;
    }

    setEstado("tutorialChoice");
  }

  useEffect(() => {
    assetsRef.current.loadAll();
  }, []);

  useEffect(() => {
    const canvasFromRef = canvasRef.current;

    if (!canvasFromRef) {
      return;
    }

    const contextFromCanvas = canvasFromRef.getContext("2d");

    if (!contextFromCanvas) {
      return;
    }

    const renderCanvas: HTMLCanvasElement = canvasFromRef;
    const renderCtx: CanvasRenderingContext2D = contextFromCanvas;

    renderCanvas.width = CONFIG.canvasWidth;
    renderCanvas.height = CONFIG.canvasHeight;

    let animationFrame = 0;
    let lastTime = performance.now();

    function shootNormal() {
      const player = playerRef.current;

      if (player.normalCooldown > 0) {
        return;
      }

      shotsRef.current.push({
        x: player.x + player.w - 2,
        y: player.y + player.h / 2 - CONFIG.gameplay.shots.normal.height / 2,
        w: CONFIG.gameplay.shots.normal.width,
        h: CONFIG.gameplay.shots.normal.height,
        speed: CONFIG.gameplay.shots.normal.speed,
        damage: CONFIG.gameplay.shots.normal.damage,
        type: "normal",
      });

      tocarSom(CONFIG.sounds.normalShot);
      player.normalCooldown = CONFIG.gameplay.shots.normal.cooldownFrames;
    }

    function shootStrong() {
      const player = playerRef.current;
      const now = performance.now();

      if (now < player.strongReadyAt) {
        return;
      }

      shotsRef.current.push({
        x: player.x + player.w - 2,
        y: player.y + player.h / 2 - CONFIG.gameplay.shots.strong.height / 2,
        w: CONFIG.gameplay.shots.strong.width,
        h: CONFIG.gameplay.shots.strong.height,
        speed: CONFIG.gameplay.shots.strong.speed,
        damage: CONFIG.gameplay.shots.strong.damage,
        type: "strong",
      });

      tocarSom(CONFIG.sounds.strongShot);

      player.strongReadyAt = now + CONFIG.gameplay.shots.strong.cooldownMs;

      player.vx -= CONFIG.gameplay.player.strongShotRecoil;

      shakeRef.current = {
        intensity: CONFIG.gameplay.player.strongShotShake,
        endAt: now + CONFIG.gameplay.player.strongShotShakeMs,
      };

      strongCooldownRef.current = Math.ceil(
        CONFIG.gameplay.shots.strong.cooldownMs / 1000
      );
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
      const playerAsset = assetsRef.current.get("player");
      const playerConfig = ASSETS.player;

      anim.update(delta);

      ctx.save();
      ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
      ctx.rotate((player.tilt * Math.PI) / 180);

      if (
        CONFIG.useSprites &&
        playerAsset &&
        playerConfig.frameWidth &&
        playerConfig.frameHeight
      ) {
        ctx.drawImage(
          playerAsset,
          anim.frame * playerConfig.frameWidth,
          0,
          playerConfig.frameWidth,
          playerConfig.frameHeight,
          -player.w / 2,
          -player.h / 2,
          player.w,
          player.h
        );
      } else {
        ctx.fillStyle = CONFIG.colors.player;
        ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);

        ctx.fillStyle = CONFIG.colors.playerDetail;
        ctx.fillRect(player.w * 0.12, -7, 14, 14);
      }

      ctx.restore();
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

      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      ctx.fillRect(18, 18, 340, 112);

      ctx.fillStyle = "white";
      ctx.font = `24px ${CONFIG.fonts.ui}`;

      ctx.fillText("Z: tiro normal", 34, 52);

      ctx.fillText(
        strongCooldownRef.current > 0
          ? `X: forte ${strongCooldownRef.current}s`
          : "X: forte pronto",
        34,
        84
      );

      ctx.fillText("P/ESC: pausar", 34, 116);

      ctx.restore();
    }

    function atualizar(delta: number, canvas: HTMLCanvasElement) {
      if (gameStateRef.current !== "playing") {
        return;
      }

      const player = playerRef.current;
      const speedFactor = delta / 16.67;

      const inputX =
        (keysRef.current["arrowright"] || keysRef.current["d"] ? 1 : 0) -
        (keysRef.current["arrowleft"] || keysRef.current["a"] ? 1 : 0);

      const inputY =
        (keysRef.current["arrowdown"] || keysRef.current["s"] ? 1 : 0) -
        (keysRef.current["arrowup"] || keysRef.current["w"] ? 1 : 0);

      if (inputX !== 0) {
        player.vx +=
          inputX * CONFIG.gameplay.player.acceleration * speedFactor;
      } else {
        player.vx *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
      }

      if (inputY !== 0) {
        player.vy +=
          inputY * CONFIG.gameplay.player.acceleration * speedFactor;
      } else {
        player.vy *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
      }

      player.vx = Math.max(
        -CONFIG.gameplay.player.maxSpeedX,
        Math.min(CONFIG.gameplay.player.maxSpeedX, player.vx)
      );

      player.vy = Math.max(
        -CONFIG.gameplay.player.maxSpeedY,
        Math.min(CONFIG.gameplay.player.maxSpeedY, player.vy)
      );

      if (Math.abs(player.vx) < 0.02) {
        player.vx = 0;
      }

      if (Math.abs(player.vy) < 0.02) {
        player.vy = 0;
      }

      player.x += player.vx * speedFactor;
      player.y += player.vy * speedFactor;

      if (keysRef.current["z"] || mobileShootRef.current) {
        shootNormal();
      }

      if (keysRef.current["x"]) {
        shootStrong();
      }

      if (player.x < 0) {
        player.x = 0;
        player.vx = 0;
      }

      if (player.x > canvas.width - player.w) {
        player.x = canvas.width - player.w;
        player.vx = 0;
      }

      if (player.y < 0) {
        player.y = 0;
        player.vy = 0;
      }

      if (player.y > canvas.height - player.h) {
        player.y = canvas.height - player.h;
        player.vy = 0;
      }

      const targetTilt =
        (player.vx / CONFIG.gameplay.player.maxSpeedX) *
        CONFIG.gameplay.player.tiltMaxDeg;

      player.tilt +=
        (targetTilt - player.tilt) * CONFIG.gameplay.player.tiltResponse;

      if (player.normalCooldown > 0) {
        player.normalCooldown -= 1;
      }

      shotsRef.current = shotsRef.current
        .map((shot) => ({
          ...shot,
          x: shot.x + shot.speed * speedFactor,
        }))
        .filter((shot) => shot.x < canvas.width + 160);
    }

    function loop(time: number) {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      atualizar(delta, renderCanvas);

      const shake = shakeRef.current;
      const shaking = performance.now() < shake.endAt;

      renderCtx.save();

      if (shaking) {
        const x = (Math.random() - 0.5) * shake.intensity;
        const y = (Math.random() - 0.5) * shake.intensity;
        renderCtx.translate(x, y);
      }

      desenharFundo(renderCtx, renderCanvas);

      for (const shot of shotsRef.current) {
        desenharTiro(renderCtx, shot);
      }

      if (
        gameStateRef.current === "playing" ||
        gameStateRef.current === "paused"
      ) {
        desenharPlayer(renderCtx, delta);
      }

      renderCtx.restore();

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
        return;
      }

      if (gameStateRef.current === "mainMenu") {
        if (key === "escape" || key === "q") {
          voltarParaTitulo();
          return;
        }

        if (key === "arrowup" || key === "w") {
          tocarSom(CONFIG.sounds.menuMove, 0.32);

          setIndiceMenu(
            (menuIndexRef.current - 1 + MAIN_MENU_OPTIONS.length) %
              MAIN_MENU_OPTIONS.length
          );
          return;
        }

        if (key === "arrowdown" || key === "s") {
          tocarSom(CONFIG.sounds.menuMove, 0.32);
          setIndiceMenu((menuIndexRef.current + 1) % MAIN_MENU_OPTIONS.length);
          return;
        }

        if (key === "enter" || key === " ") {
          confirmarOpcaoMenuAtual();
          return;
        }
      }

      if (
        gameStateRef.current === "storyCutscene" &&
        (key === "enter" || key === " ")
      ) {
        avancarHistoria();
        return;
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


  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && gameStateRef.current === "playing") {
        tocarSom(CONFIG.sounds.pause, 0.35);
        setEstado("paused");
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const gameStyle: GameCssVars = {
    "--game-menu-bg": `url(${ASSETS.menuBackground.src})`,
    "--game-title-bg": `url(${ASSETS.titleBackground.src})`,
    "--game-title-font": CONFIG.fonts.title,
    "--game-prompt-font": CONFIG.fonts.prompt,
    "--game-menu-font": CONFIG.fonts.menu,
    "--game-ui-font": CONFIG.fonts.ui,
  };

  return (
    <main className="game-fullscreen-page" style={gameStyle}>
      <canvas ref={canvasRef} className="game-fullscreen-canvas" />

      <div
        className={`game-title-bg-transition ${titleLeaving ? "show" : ""}`}
      />

      <div className={`game-screen-fade ${screenFade ? "show" : ""}`} />

      {gameState === "title" && (
        <section
          className={`game-screen game-title-screen ${
            titleLeaving ? "is-leaving" : ""
          }`}
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
          <aside
            className={`game-retro-panel ${menuOpen ? "is-open" : "is-closed"}`}
          >
            <p className="game-panel-label">MENU PRINCIPAL</p>
            <p className="game-menu-help">ESC/Q: voltar</p>

            <div className="game-retro-menu-list">
              {MAIN_MENU_OPTIONS.map((option, index) => {
                const selected = menuIndex === index;

                return (
                  <button
                    key={option.label}
                    type="button"
                    className={`game-menu-option ${
                      selected ? "is-selected" : ""
                    } ${option.disabled ? "is-disabled" : ""}`}
                    onMouseEnter={() => {
                      if (menuIndex !== index) {
                        tocarSom(CONFIG.sounds.menuMove, 0.24);
                      }

                      setIndiceMenu(index);
                    }}
                    onFocus={() => setIndiceMenu(index)}
                    onClick={() => {
                      if (!option.disabled && option.mode) {
                        escolherModo(option.mode);
                      } else {
                        tocarSom(CONFIG.sounds.menuBack, 0.3);
                      }
                    }}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="game-menu-logo">
            <strong>SPACE NEWS</strong>
            <span>agora com 90% menos fake news!</span>
          </div>
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
          <aside className="game-retro-panel is-open">
            <p className="game-panel-label">TUTORIAL</p>

            <div className="game-retro-menu-list">
              <button
                type="button"
                className="game-menu-option is-selected"
                onClick={() => setEstado("tutorial")}
              >
                FAZER TUTORIAL
              </button>

              <button
                type="button"
                className="game-menu-option"
                onClick={iniciarJogo}
              >
                PULAR E COMEÇAR
              </button>
            </div>
          </aside>
        </section>
      )}

      {gameState === "tutorial" && (
        <section className="game-screen game-tutorial-screen">
          <div className="game-tutorial-card">
            <h2>CONTROLES</h2>

            <p>WASD ou Setas: mover</p>
            <p>Z: tiro normal</p>
            <p>X: tiro forte</p>
            <p>P ou ESC: pausar</p>

            <button onClick={iniciarJogo}>COMEÇAR MISSÃO</button>
          </div>
        </section>
      )}

      {gameState === "paused" && (
        <section className="game-screen game-pause-screen">
          <div className="game-pause-card">
            <p className="game-panel-label">JOGO PAUSADO</p>
            <h2>PAUSADO</h2>

            <button onClick={pausarOuVoltar}>CONTINUAR</button>
            <button onClick={voltarAoMenuPrincipal}>VOLTAR AO MENU</button>
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