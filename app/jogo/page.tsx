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
  | "chocado"
  | "enemyRed"
  | "enemyBlack"
  | "enemyPurple"
  | "enemyBullet"
  | "asteroid"
  | "asteroidCracked"
  | "asteroidFragment";

type Shot = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  damage: number;
  type: "normal" | "strong";
};

type EnemyKind = "red" | "black" | "purple" | "asteroid" | "fragment";

type Enemy = {
  id: number;
  kind: EnemyKind;
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
  sizeTier?: number;
  fragmentCount?: number;
  cracked?: boolean;
  phase?: number;
};

type EnemyProjectile = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  damage: number;
};

type Particle = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
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
  hp: number;
  invincibleUntil: number;
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

  normalShot: { src: "/game/shots/normal.png" },
  strongShot: { src: "/game/shots/strong.png" },
  background: { src: "/game/backgrounds/space.png" },
  menuBackground: { src: "/game/backgrounds/menu-bg.png" },
  titleBackground: { src: "/game/backgrounds/title-bg.png" },

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

  enemyRed: {
    src: "/game/enemies/red-sheet.png",
    frameWidth: 64,
    frameHeight: 64,
    frames: 4,
    fps: 8,
  },

  enemyBlack: {
    src: "/game/enemies/black-sheet.png",
    frameWidth: 64,
    frameHeight: 64,
    frames: 4,
    fps: 10,
  },

  enemyPurple: {
    src: "/game/enemies/purple-sheet.png",
    frameWidth: 64,
    frameHeight: 64,
    frames: 4,
    fps: 8,
  },

  enemyBullet: { src: "/game/shots/enemy-bullet.png" },

  asteroid: { src: "/game/obstacles/asteroid.png" },

  asteroidCracked: { src: "/game/obstacles/asteroid-cracked.png" },

  asteroidFragment: { src: "/game/obstacles/asteroid-fragment.png" },
};

const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 720,

  useSprites: true,
  useSounds: true,
  forceFullscreen: true,

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
      maxHp: 5,
      invincibleMs: 2000,
      acceleration: 0.36,
      friction: 0.94,
      maxSpeedX: 7.5,
      maxSpeedY: 6.9,
      tiltMaxDeg: 18,
      tiltResponse: 0.18,
      stretchMax: 0.34,
      strongShotRecoil: 7.5,
      strongShotShake: 8,
      strongShotShakeMs: 180,
    },

    dynamicStretch: {
      enabled: true,
      base: 0.055,
      max: 0.42,
      squeeze: 0.42,
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

    enemies: {
      red: {
        width: 64,
        height: 64,
        hp: 5,
        speed: 2.3,
        waveAmplitude: 1,
        waveFrequency: 0.0032,
        shootEveryMs: 1350,
        bulletSpeed: 4.7,
        edgePadding: 92,
        pairGapX: 0,
      },

      black: {
        width: 72,
        height: 72,
        hp: 8,
        appearX: 1040,
        windUpMs: 820,
        dashSpeed: 10.5,
      },

      purple: {
        width: 70,
        height: 70,
        hp: 5,
        speed: 3.4,
      },

      asteroid: {
        sizeTierMin: 3,
        sizeTierMax: 12,
        sizeUnit: 16,
        hpPerTier: 0.5,
        baseSpeed: 2.8,
        speedLossPerTier: 0.08,
        minSpeed: 1.35,
        fragmentsPerTier: 0.55,
        fragmentBaseSize: 24,
        fragmentHp: 1,
        fragmentSpeedMin: 2.2,
        fragmentSpeedMax: 5.3,
        rotationSpeedMin: 0.0015,
        rotationSpeedMax: 0.006,
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
    enemyShot: "/sounds/enemy-shot.mp3",
    enemyHit: "/sounds/enemy-hit.mp3",
    enemyDeath: "/sounds/enemy-death.mp3",
    playerDamage: "/sounds/player-damage.mp3",
    lowHpAlarm: "/sounds/low-hp-alarm.mp3",
    asteroidBreak: "/sounds/asteroid-break.mp3",
    waveStart: "/sounds/wave-start.mp3",
    bossIntro: "/sounds/boss-intro.mp3",
  },

  uiImages: {
    lifeFull: "/game/ui/heart-full.png",
    lifeEmpty: "/game/ui/heart-empty.png",
    lifeFullFallback: "/game/ui/life-full.png",
    lifeEmptyFallback: "/game/ui/life-empty.png",
    mobileUp: "/game/ui/mobile-up.png",
    mobileDown: "/game/ui/mobile-down.png",
    mobileLeft: "/game/ui/mobile-left.png",
    mobileRight: "/game/ui/mobile-right.png",
    mobileShot: "/game/ui/mobile-shot.png",
    mobileStrong: "/game/ui/mobile-strong.png",
    mobilePause: "/game/ui/mobile-pause.png",
  },

  colors: {
    fallbackBackground: "#020617",
    player: "#60a5fa",
    playerDetail: "#dbeafe",
    normalShot: "#60a5fa",
    strongShot: "#facc15",
    redEnemy: "#ef4444",
    blackEnemy: "#111827",
    purpleEnemy: "#a855f7",
    asteroid: "#8b7355",
    enemyBullet: "#ff6b6b",
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
    hp: CONFIG.gameplay.player.maxHp,
    invincibleUntil: 0,
    normalCooldown: 0,
    strongReadyAt: 0,
  };
}

function rectsCollide(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getVelocityStretchAmount(vx: number, vy: number) {
  if (!CONFIG.gameplay.dynamicStretch.enabled) {
    return 0;
  }

  const speed = Math.hypot(vx, vy);
  return clamp(speed * CONFIG.gameplay.dynamicStretch.base, 0, CONFIG.gameplay.dynamicStretch.max);
}

function applyVelocityStretch(ctx: CanvasRenderingContext2D, vx: number, vy: number, multiplier = 1) {
  const amount = getVelocityStretchAmount(vx, vy) * multiplier;

  if (amount <= 0.001) {
    return;
  }

  const angle = Math.atan2(vy, vx || 0.0001);
  const squeeze = CONFIG.gameplay.dynamicStretch.squeeze;

  ctx.rotate(angle);
  ctx.scale(1 + amount, Math.max(0.58, 1 - amount * squeeze));
  ctx.rotate(-angle);
}

function drawVelocityStretchedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  vx: number,
  vy: number,
  rotation = 0,
  fallbackColor = "#ffffff",
  stretchMultiplier = 1.35
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  applyVelocityStretch(ctx, vx, vy, stretchMultiplier);
  ctx.rotate(rotation);

  if (CONFIG.useSprites && img) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  }

  ctx.restore();
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

  const [playerHp, setPlayerHp] = useState(CONFIG.gameplay.player.maxHp);
  const [isLowHp, setIsLowHp] = useState(false);

  const assetsRef = useRef(new AssetManager());
  const enemyIdRef = useRef(0);
  const shotIdRef = useRef(0);

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
  const enemiesRef = useRef<Enemy[]>([]);
  const enemyProjectilesRef = useRef<EnemyProjectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const shakeRef = useRef({ intensity: 0, endAt: 0 });
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

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

  async function solicitarFullscreen() {
    if (!CONFIG.forceFullscreen) {
      return;
    }

    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Alguns navegadores bloqueiam fullscreen fora de gesto do usuário.
    }
  }

  function limparCombate() {
    shotsRef.current = [];
    enemiesRef.current = [];
    enemyProjectilesRef.current = [];
    particlesRef.current = [];
    shakeRef.current = { intensity: 0, endAt: 0 };
  }

  function iniciarJogo() {
    solicitarFullscreen();

    const player = createInitialPlayer();
    playerRef.current = player;

    limparCombate();

    strongCooldownRef.current = 0;
    setStrongCooldown(0);
    setPlayerHp(player.hp);
    setIsLowHp(false);

    setEstado("playing");
  }

  function receberDano(dano: number, forcarHpUm = false) {
    const player = playerRef.current;
    const now = performance.now();

    if (now < player.invincibleUntil) {
      return;
    }

    tocarSom(CONFIG.sounds.playerDamage, 0.5);
    criarParticulasHit(player.x + player.w / 2, player.y + player.h / 2, "#ff4d4d", 14);

    if (forcarHpUm) {
      player.hp = Math.max(1, Math.min(player.hp, 1));
    } else {
      player.hp = Math.max(0, player.hp - dano);
    }

    player.invincibleUntil = now + CONFIG.gameplay.player.invincibleMs;
    setPlayerHp(player.hp);
    setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");

    if (player.hp <= 1 && gameStateRef.current === "playing" && CONFIG.useSounds) {
      if (!alarmAudioRef.current) {
        const audio = new Audio(CONFIG.sounds.lowHpAlarm);
        audio.loop = true;
        audio.volume = 0.42;
        alarmAudioRef.current = audio;
      }
      alarmAudioRef.current.play().catch(() => {});
    }

    shakeRef.current = { intensity: 5, endAt: now + 160 };

    if (player.hp <= 0) {
      player.hp = CONFIG.gameplay.player.maxHp;
      player.x = 100;
      player.y = 320;
      player.vx = 0;
      player.vy = 0;
      player.invincibleUntil = now + 2500;
      setPlayerHp(player.hp);
      setIsLowHp(false);
      setEstado("paused");
    }
  }

  function pausarOuVoltar() {
    if (gameStateRef.current === "playing") {
      tocarSom(CONFIG.sounds.pause, 0.45);
      setEstado("paused");
      setIsLowHp(false);
      return;
    }

    if (gameStateRef.current === "paused") {
      tocarSom(CONFIG.sounds.menuConfirm, 0.4);
      setEstado("playing");
      setIsLowHp(playerRef.current.hp <= 1);
    }
  }

  function voltarAoMenuPrincipal() {
    tocarSom(CONFIG.sounds.menuBack, 0.45);
    limparCombate();
    setIsLowHp(false);
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
    solicitarFullscreen();

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
      limparCombate();
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

  function spawnEnemy(kind: EnemyKind, y?: number) {
    const id = enemyIdRef.current++;
    const spawnY = y ?? rand(80, CONFIG.canvasHeight - 140);

    if (kind === "red") {
      const cfg = CONFIG.gameplay.enemies.red;
      const centerY = (CONFIG.canvasHeight - cfg.height) / 2;
      const verticalRange = Math.max(
        40,
        CONFIG.canvasHeight / 2 - cfg.edgePadding - cfg.height / 2
      );
      const topY = centerY - verticalRange;
      const bottomY = centerY + verticalRange;
      const sharedCooldown = cfg.shootEveryMs;

      const createRed = (startY: number, phase: number): Enemy => ({
        id: enemyIdRef.current++,
        kind: "red",
        x: CONFIG.canvasWidth + 80,
        y: startY,
        w: cfg.width,
        h: cfg.height,
        vx: -cfg.speed,
        vy: 0,
        hp: cfg.hp,
        maxHp: cfg.hp,
        age: 0,
        waveBaseY: centerY,
        shotCooldown: sharedCooldown,
        windUpMs: 0,
        isDashing: false,
        phase,
      });

      enemiesRef.current.push(createRed(topY, -Math.PI / 2));
      enemiesRef.current.push(createRed(bottomY, Math.PI / 2));
      return;
    }

    if (kind === "black") {
      const cfg = CONFIG.gameplay.enemies.black;
      const player = playerRef.current;

      enemiesRef.current.push({
        id,
        kind: "black",
        x: cfg.appearX,
        y: spawnY,
        w: cfg.width,
        h: cfg.height,
        vx: 0,
        vy: 0,
        hp: cfg.hp,
        maxHp: cfg.hp,
        age: 0,
        waveBaseY: spawnY,
        shotCooldown: 0,
        windUpMs: cfg.windUpMs,
        isDashing: false,
      });

      const last = enemiesRef.current[enemiesRef.current.length - 1];
      const dx = player.x - last.x;
      const dy = player.y - last.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      last.vx = (dx / length) * cfg.dashSpeed;
      last.vy = (dy / length) * cfg.dashSpeed;
      return;
    }

    if (kind === "purple") {
      const cfg = CONFIG.gameplay.enemies.purple;

      enemiesRef.current.push({
        id,
        kind: "purple",
        x: CONFIG.canvasWidth + 70,
        y: spawnY,
        w: cfg.width,
        h: cfg.height,
        vx: -cfg.speed,
        vy: 0,
        hp: cfg.hp,
        maxHp: cfg.hp,
        age: 0,
        waveBaseY: spawnY,
        shotCooldown: 0,
        windUpMs: 0,
        isDashing: false,
      });
      return;
    }

    if (kind === "asteroid") {
      const cfg = CONFIG.gameplay.enemies.asteroid;
      const sizeTier = Math.floor(rand(cfg.sizeTierMin, cfg.sizeTierMax + 1));
      const size = sizeTier * cfg.sizeUnit;
      const hp = Math.max(2, Math.ceil(sizeTier * cfg.hpPerTier));
      const speed = Math.max(
        cfg.minSpeed,
        cfg.baseSpeed - sizeTier * cfg.speedLossPerTier
      );
      const fragmentCount = Math.max(2, Math.ceil(sizeTier * cfg.fragmentsPerTier));
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;

      enemiesRef.current.push({
        id,
        kind: "asteroid",
        x: CONFIG.canvasWidth + size,
        y: clamp(spawnY, 40, CONFIG.canvasHeight - size - 40),
        w: size,
        h: size,
        vx: -speed,
        vy: rand(-0.22, 0.22),
        hp,
        maxHp: hp,
        age: 0,
        waveBaseY: spawnY,
        shotCooldown: 0,
        windUpMs: 0,
        isDashing: false,
        rotation: rand(0, Math.PI * 2),
        rotationSpeed:
          rotationDirection *
          rand(cfg.rotationSpeedMin, cfg.rotationSpeedMax),
        sizeTier,
        fragmentCount,
        cracked: false,
      });
    }
  }

  function spawnAsteroidFragments(enemy: Enemy) {
    const cfg = CONFIG.gameplay.enemies.asteroid;
    const fragmentCount = enemy.fragmentCount ?? 4;
    const tier = enemy.sizeTier ?? 6;
    const fragmentSize = clamp(cfg.fragmentBaseSize + tier * 2, 24, 52);

    tocarSom(CONFIG.sounds.asteroidBreak, 0.55);
    criarExplosao(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#d6b27a", 18);

    for (let i = 0; i < fragmentCount; i++) {
      const angle = rand(Math.PI * 0.65, Math.PI * 1.35);
      const speed = rand(cfg.fragmentSpeedMin, cfg.fragmentSpeedMax);

      enemiesRef.current.push({
        id: enemyIdRef.current++,
        kind: "fragment",
        x: enemy.x + enemy.w / 2 - fragmentSize / 2,
        y: enemy.y + enemy.h / 2 - fragmentSize / 2,
        w: fragmentSize,
        h: fragmentSize,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hp: cfg.fragmentHp,
        maxHp: cfg.fragmentHp,
        age: 0,
        waveBaseY: enemy.y,
        shotCooldown: 0,
        windUpMs: 0,
        isDashing: true,
        rotation: rand(0, Math.PI * 2),
        rotationSpeed: rand(-0.012, 0.012),
        sizeTier: Math.max(1, Math.floor(tier / 3)),
        fragmentCount: 0,
        cracked: false,
      });
    }
  }

  function corParticulaQuente() {
    const palette = ["#ffd166", "#ffb703", "#fb8500", "#ff7a18", "#fff1a8"];
    return palette[Math.floor(rand(0, palette.length))];
  }

  function criarParticulasHit(x: number, y: number, color = "", amount = 9) {
    for (let i = 0; i < amount; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.0, 4.1);

      particlesRef.current.push({
        id: enemyIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(3, 9),
        life: rand(180, 360),
        maxLife: 360,
        color: color || corParticulaQuente(),
      });
    }
  }

  function criarExplosao(x: number, y: number, color = "", amount = 26) {
    for (let i = 0; i < amount; i++) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(1.8, 7.2);

      particlesRef.current.push({
        id: enemyIdRef.current++,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: rand(4, 13),
        life: rand(260, 560),
        maxLife: 560,
        color: color || corParticulaQuente(),
      });
    }
  }

  useEffect(() => {
    assetsRef.current.loadAll();
  }, []);

  useEffect(() => {
    const shouldPlayAlarm = playerHp <= 1 && gameState === "playing";

    if (shouldPlayAlarm) {
      if (!alarmAudioRef.current) {
        const audio = new Audio(CONFIG.sounds.lowHpAlarm);
        audio.loop = true;
        audio.volume = 0.42;
        alarmAudioRef.current = audio;
      }

      alarmAudioRef.current.play().catch(() => {});
    } else if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }
  }, [playerHp, gameState]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden && gameStateRef.current === "playing") {
        tocarSom(CONFIG.sounds.pause, 0.35);
        setEstado("paused");
        setIsLowHp(false);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
        id: shotIdRef.current++,
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
        id: shotIdRef.current++,
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
      const now = performance.now();
      const invincible = now < player.invincibleUntil;

      if (invincible && Math.floor(now / 100) % 2 === 0) {
        return;
      }

      const anim = playerAnimRef.current;
      const playerAsset = assetsRef.current.get("player");
      const playerConfig = ASSETS.player;
      anim.update(delta);

      ctx.save();
      ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
      applyVelocityStretch(ctx, player.vx, player.vy, 1.15);
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

      const img = assetsRef.current.get(key);
      const color =
        shot.type === "strong"
          ? CONFIG.colors.strongShot
          : CONFIG.colors.normalShot;

      drawVelocityStretchedImage(
        ctx,
        img,
        shot.x,
        shot.y,
        shot.w,
        shot.h,
        shot.speed,
        0,
        0,
        color
      );
    }

    function getEnemySpriteKey(kind: EnemyKind): SpriteKey {
      if (kind === "red") return "enemyRed";
      if (kind === "black") return "enemyBlack";
      if (kind === "purple") return "enemyPurple";
      if (kind === "fragment") return "asteroidFragment";
      return "asteroid";
    }

    function desenharEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
      const key: SpriteKey =
        enemy.kind === "asteroid" && enemy.cracked
          ? "asteroidCracked"
          : getEnemySpriteKey(enemy.kind);

      const img = assetsRef.current.get(key);
      const rotation = enemy.rotation ?? 0;
      const fallbackColor =
        enemy.kind === "red"
          ? CONFIG.colors.redEnemy
          : enemy.kind === "black"
            ? CONFIG.colors.blackEnemy
            : enemy.kind === "purple"
              ? CONFIG.colors.purpleEnemy
              : enemy.kind === "fragment"
                ? "#b79a6b"
                : CONFIG.colors.asteroid;

      drawVelocityStretchedImage(
        ctx,
        img,
        enemy.x,
        enemy.y,
        enemy.w,
        enemy.h,
        enemy.vx,
        enemy.vy,
        rotation,
        fallbackColor
      );

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.w, 5);
      ctx.fillStyle = "#f8e7b0";
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.w * (enemy.hp / enemy.maxHp), 5);
      ctx.restore();

      if (enemy.kind === "black" && enemy.age < enemy.windUpMs) {
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(enemy.x - 8, enemy.y - 8, enemy.w + 16, enemy.h + 16);
        ctx.restore();
      }
    }

    function desenharEnemyProjectile(ctx: CanvasRenderingContext2D, bullet: EnemyProjectile) {
      const img = assetsRef.current.get("enemyBullet");
      drawVelocityStretchedImage(
        ctx,
        img,
        bullet.x,
        bullet.y,
        bullet.w,
        bullet.h,
        bullet.vx,
        bullet.vy,
        0,
        CONFIG.colors.enemyBullet
      );
    }

    function atualizarParticulas(delta: number) {
      const speedFactor = delta / 16.67;

      particlesRef.current = particlesRef.current
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx * speedFactor,
          y: particle.y + particle.vy * speedFactor,
          vy: particle.vy + 0.035 * speedFactor,
          life: particle.life - delta,
        }))
        .filter((particle) => particle.life > 0);
    }

    function desenharParticulas(ctx: CanvasRenderingContext2D) {
      ctx.save();

      for (const particle of particlesRef.current) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size
        );
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    function desenharHUD(ctx: CanvasRenderingContext2D) {
      if (gameStateRef.current !== "playing") {
        return;
      }

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
      ctx.fillRect(18, 82, 340, 112);
      ctx.fillStyle = "white";
      ctx.font = `24px ${CONFIG.fonts.ui}`;
      ctx.fillText("Z: tiro normal", 34, 116);
      ctx.fillText(
        strongCooldownRef.current > 0
          ? `X: forte ${strongCooldownRef.current}s`
          : "X: forte pronto",
        34,
        148
      );
      ctx.fillText("8/9/0/-: testes", 34, 180);
      ctx.restore();
    }

    function atualizarInimigos(delta: number, canvas: HTMLCanvasElement) {
      if (gameStateRef.current !== "playing") {
        return;
      }

      const speedFactor = delta / 16.67;
      const redCfg = CONFIG.gameplay.enemies.red;

      enemiesRef.current = enemiesRef.current
        .map((enemy) => {
          const updated = { ...enemy, age: enemy.age + delta };

          if (updated.kind === "red") {
            updated.x += updated.vx * speedFactor;

            const centerY = (canvas.height - updated.h) / 2;
            const amplitude = Math.max(
              40,
              canvas.height / 2 - redCfg.edgePadding - updated.h / 2
            );

            const previousY = updated.y;
            updated.y =
              centerY +
              Math.sin(updated.age * redCfg.waveFrequency + (updated.phase ?? 0)) *
                amplitude;
            updated.y = clamp(updated.y, 18, canvas.height - updated.h - 18);
            updated.vy = (updated.y - previousY) / Math.max(0.001, speedFactor);
            updated.shotCooldown -= delta;

            if (updated.shotCooldown <= 0) {
              updated.shotCooldown = redCfg.shootEveryMs;
              enemyProjectilesRef.current.push({
                id: enemyIdRef.current++,
                x: updated.x - 18,
                y: updated.y + updated.h / 2 - 7,
                w: 18,
                h: 14,
                vx: -redCfg.bulletSpeed,
                vy: 0,
                damage: 1,
              });
              tocarSom(CONFIG.sounds.enemyShot, 0.26);
            }
          }

          if (updated.kind === "black") {
            if (updated.age >= updated.windUpMs) {
              updated.isDashing = true;
              updated.x += updated.vx * speedFactor;
              updated.y += updated.vy * speedFactor;
            }
          }

          if (updated.kind === "purple" || updated.kind === "asteroid") {
            updated.x += updated.vx * speedFactor;
            updated.y += updated.vy * speedFactor;

            if (updated.kind === "asteroid") {
              updated.rotation =
                (updated.rotation ?? 0) +
                (updated.rotationSpeed ?? 0) * delta;
            }
          }

          if (updated.kind === "fragment") {
            updated.x += updated.vx * speedFactor;
            updated.y += updated.vy * speedFactor;
            updated.vy += 0.015 * speedFactor;
            updated.rotation =
              (updated.rotation ?? 0) +
              (updated.rotationSpeed ?? 0) * delta;
          }

          return updated;
        })
        .filter(
          (enemy) =>
            enemy.x > -180 &&
            enemy.x < canvas.width + 220 &&
            enemy.y > -180 &&
            enemy.y < canvas.height + 180 &&
            enemy.hp > 0
        );

      enemyProjectilesRef.current = enemyProjectilesRef.current
        .map((bullet) => ({
          ...bullet,
          x: bullet.x + bullet.vx * speedFactor,
          y: bullet.y + bullet.vy * speedFactor,
        }))
        .filter((bullet) => bullet.x > -80 && bullet.x < canvas.width + 120);
    }

    function resolverColisoes() {
      const player = playerRef.current;
      const enemiesToRemove = new Set<number>();
      const shotsToRemove = new Set<number>();
      const projectilesToRemove = new Set<number>();

      for (const shot of shotsRef.current) {
        for (const enemy of enemiesRef.current) {
          if (enemiesToRemove.has(enemy.id)) continue;

          if (rectsCollide(shot, enemy)) {
            enemy.hp -= shot.damage;
            shotsToRemove.add(shot.id);
            if (enemy.kind === "asteroid" && enemy.hp <= enemy.maxHp / 2) {
              enemy.cracked = true;
            }
            criarParticulasHit(shot.x + shot.w / 2, shot.y + shot.h / 2);
            tocarSom(CONFIG.sounds.enemyHit, 0.25);

            if (enemy.hp <= 0) {
              enemiesToRemove.add(enemy.id);

              if (enemy.kind === "asteroid") {
                spawnAsteroidFragments(enemy);
              } else {
                criarExplosao(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffe18c", 16);
                tocarSom(CONFIG.sounds.enemyDeath, 0.38);
              }
            }

            break;
          }
        }
      }

      for (const enemy of enemiesRef.current) {
        if (enemiesToRemove.has(enemy.id)) continue;

        if (rectsCollide(player, enemy)) {
          enemiesToRemove.add(enemy.id);

          if (enemy.kind === "asteroid") {
            receberDano(0, true);
            spawnAsteroidFragments(enemy);
          } else {
            criarParticulasHit(player.x + player.w / 2, player.y + player.h / 2, "#ff6b6b", 10);
            receberDano(1);
          }
        }
      }

      for (const bullet of enemyProjectilesRef.current) {
        if (rectsCollide(player, bullet)) {
          projectilesToRemove.add(bullet.id);
          criarParticulasHit(bullet.x + bullet.w / 2, bullet.y + bullet.h / 2, "#ff6b6b", 8);
          receberDano(bullet.damage);
        }
      }

      if (shotsToRemove.size > 0) {
        shotsRef.current = shotsRef.current.filter((shot) => !shotsToRemove.has(shot.id));
      }

      if (enemiesToRemove.size > 0) {
        enemiesRef.current = enemiesRef.current.filter((enemy) => !enemiesToRemove.has(enemy.id));
      }

      if (projectilesToRemove.size > 0) {
        enemyProjectilesRef.current = enemyProjectilesRef.current.filter(
          (bullet) => !projectilesToRemove.has(bullet.id)
        );
      }
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
        player.vx += inputX * CONFIG.gameplay.player.acceleration * speedFactor;
      } else {
        player.vx *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
      }

      if (inputY !== 0) {
        player.vy += inputY * CONFIG.gameplay.player.acceleration * speedFactor;
      } else {
        player.vy *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
      }

      player.vx = clamp(player.vx, -CONFIG.gameplay.player.maxSpeedX, CONFIG.gameplay.player.maxSpeedX);
      player.vy = clamp(player.vy, -CONFIG.gameplay.player.maxSpeedY, CONFIG.gameplay.player.maxSpeedY);

      if (Math.abs(player.vx) < 0.02) player.vx = 0;
      if (Math.abs(player.vy) < 0.02) player.vy = 0;

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

      const verticalTilt =
        (player.vy / CONFIG.gameplay.player.maxSpeedY) *
        CONFIG.gameplay.player.tiltMaxDeg;
      const horizontalAssist =
        (player.vx / CONFIG.gameplay.player.maxSpeedX) *
        (CONFIG.gameplay.player.tiltMaxDeg * 0.18);
      const targetTilt = verticalTilt + horizontalAssist;

      player.tilt +=
        (targetTilt - player.tilt) * CONFIG.gameplay.player.tiltResponse;

      if (player.normalCooldown > 0) {
        player.normalCooldown -= 1;
      }

      shotsRef.current = shotsRef.current
        .map((shot) => ({ ...shot, x: shot.x + shot.speed * speedFactor }))
        .filter((shot) => shot.x < canvas.width + 160);

      atualizarInimigos(delta, canvas);
      resolverColisoes();
      atualizarParticulas(delta);
      setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
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

      for (const shot of shotsRef.current) desenharTiro(renderCtx, shot);
      for (const enemy of enemiesRef.current) desenharEnemy(renderCtx, enemy);
      for (const bullet of enemyProjectilesRef.current) desenharEnemyProjectile(renderCtx, bullet);
      desenharParticulas(renderCtx);

      if (gameStateRef.current === "playing" || gameStateRef.current === "paused") {
        desenharPlayer(renderCtx, delta);
      }

      renderCtx.restore();
      desenharHUD(renderCtx);

      animationFrame = window.requestAnimationFrame(loop);
    }

    function keyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysRef.current[key] = true;

      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) {
        e.preventDefault();
      }

      if (gameStateRef.current === "title" && (key === "enter" || key === " ")) {
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
          setIndiceMenu((menuIndexRef.current - 1 + MAIN_MENU_OPTIONS.length) % MAIN_MENU_OPTIONS.length);
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

      if (gameStateRef.current === "storyCutscene" && (key === "enter" || key === " ")) {
        avancarHistoria();
        return;
      }

      if (gameStateRef.current === "playing") {
        if (key === "8") spawnEnemy("red");
        if (key === "9") spawnEnemy("black");
        if (key === "0") spawnEnemy("purple");
        if (key === "-") spawnEnemy("asteroid");
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
    "--game-prompt-font": CONFIG.fonts.prompt,
    "--game-menu-font": CONFIG.fonts.menu,
    "--game-ui-font": CONFIG.fonts.ui,
  };

  const lifeSlots = Array.from({ length: CONFIG.gameplay.player.maxHp });

  return (
    <main
      className="game-fullscreen-page"
      style={gameStyle}
      onContextMenu={(event) => event.preventDefault()}
    >
      <canvas ref={canvasRef} className="game-fullscreen-canvas" />

      <div className={`game-title-bg-transition ${titleLeaving ? "show" : ""}`} />
      <div className={`game-screen-fade ${screenFade ? "show" : ""}`} />

      {isLowHp && gameState === "playing" && <div className="game-low-hp-vignette" />}

      {(gameState === "playing" || gameState === "paused") && (
        <div className="game-life-hud">
          {lifeSlots.map((_, index) => (
            <img
              key={index}
              src={index < playerHp ? CONFIG.uiImages.lifeFull : CONFIG.uiImages.lifeEmpty}
              alt={index < playerHp ? "vida" : "vida perdida"}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
              onError={(event) => {
                const img = event.currentTarget;
                const fallback = index < playerHp
                  ? CONFIG.uiImages.lifeFullFallback
                  : CONFIG.uiImages.lifeEmptyFallback;

                if (img.src.endsWith(fallback)) return;
                img.src = fallback;
              }}
            />
          ))}
        </div>
      )}

      {gameState === "title" && (
        <section
          className={`game-screen game-title-screen ${titleLeaving ? "is-leaving" : ""}`}
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
          <aside className={`game-retro-panel ${menuOpen ? "is-open" : "is-closed"}`}>
            <p className="game-panel-label">MENU PRINCIPAL</p>

            <div className="game-retro-menu-list">
              {MAIN_MENU_OPTIONS.map((option, index) => {
                const selected = menuIndex === index;

                return (
                  <button
                    key={option.label}
                    type="button"
                    className={`game-menu-option ${selected ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}`}
                    onMouseEnter={() => {
                      if (menuIndex !== index) tocarSom(CONFIG.sounds.menuMove, 0.24);
                      setIndiceMenu(index);
                    }}
                    onFocus={() => setIndiceMenu(index)}
                    onClick={() => {
                      if (!option.disabled && option.mode) escolherModo(option.mode);
                      else tocarSom(CONFIG.sounds.menuBack, 0.3);
                    }}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <p className="game-menu-help">ESC/Q: voltar</p>
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
                {storyIndex < STORY_FRAMES.length - 1 ? "Avançar" : "Continuar"}
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
              <button type="button" className="game-menu-option is-selected" onClick={() => setEstado("tutorial")}>
                FAZER TUTORIAL
              </button>

              <button type="button" className="game-menu-option" onClick={iniciarJogo}>
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
            <p>Teste: 8 vermelho • 9 preto • 0 roxo • - asteroide</p>

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
          <div className="game-mobile-dpad">
            <button
              className="mobile-up"
              onPointerDown={() => (keysRef.current["arrowup"] = true)}
              onPointerUp={() => (keysRef.current["arrowup"] = false)}
              onPointerLeave={() => (keysRef.current["arrowup"] = false)}
              onPointerCancel={() => (keysRef.current["arrowup"] = false)}
            >
              <img draggable={false} src={CONFIG.uiImages.mobileUp} alt="cima" />
            </button>
            <button
              className="mobile-left"
              onPointerDown={() => (keysRef.current["arrowleft"] = true)}
              onPointerUp={() => (keysRef.current["arrowleft"] = false)}
              onPointerLeave={() => (keysRef.current["arrowleft"] = false)}
              onPointerCancel={() => (keysRef.current["arrowleft"] = false)}
            >
              <img draggable={false} src={CONFIG.uiImages.mobileLeft} alt="esquerda" />
            </button>
            <button
              className="mobile-right"
              onPointerDown={() => (keysRef.current["arrowright"] = true)}
              onPointerUp={() => (keysRef.current["arrowright"] = false)}
              onPointerLeave={() => (keysRef.current["arrowright"] = false)}
              onPointerCancel={() => (keysRef.current["arrowright"] = false)}
            >
              <img draggable={false} src={CONFIG.uiImages.mobileRight} alt="direita" />
            </button>
            <button
              className="mobile-down"
              onPointerDown={() => (keysRef.current["arrowdown"] = true)}
              onPointerUp={() => (keysRef.current["arrowdown"] = false)}
              onPointerLeave={() => (keysRef.current["arrowdown"] = false)}
              onPointerCancel={() => (keysRef.current["arrowdown"] = false)}
            >
              <img draggable={false} src={CONFIG.uiImages.mobileDown} alt="baixo" />
            </button>
          </div>

          <div className="game-mobile-actions">
            <button
              onPointerDown={() => (mobileShootRef.current = true)}
              onPointerUp={() => (mobileShootRef.current = false)}
              onPointerLeave={() => (mobileShootRef.current = false)}
              onPointerCancel={() => (mobileShootRef.current = false)}
            >
              <img draggable={false} src={CONFIG.uiImages.mobileShot} alt="tiro" />
            </button>

            <button onClick={tiroForteMobile} disabled={strongCooldown > 0}>
              {strongCooldown > 0 ? <span>{strongCooldown}s</span> : <img draggable={false} src={CONFIG.uiImages.mobileStrong} alt="tiro forte" />}
            </button>

            <button onClick={pausarOuVoltar}>
              <img draggable={false} src={CONFIG.uiImages.mobilePause} alt="pause" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
