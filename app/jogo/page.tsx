"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

type GameState =
  | "title"
  | "mainMenu"
  | "settings"
  | "storyCutscene"
  | "tutorialChoice"
  | "tutorial"
  | "playing"
  | "paused"
  | "gameOverCutscene"
  | "gameOver";

type GameMode = "story" | "infinite";

type SpriteKey =
  | "player"
  | "playerDodge"
  | "boostFire"
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
  stretchUntil: number;
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
  stretchUntil: number;
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
  redStartY?: number;
  redTargetY?: number;
  redTravelTimeMs?: number;
};

type EnemyProjectile = {
  id: number;
  stretchUntil: number;
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
  /**
   * Use isto quando a animação for por arquivos separados, não spritesheet.
   * src = sprite parado/idle. frameSrcs = sprites de movimento/fogo.
   */
  frameSrcs?: string[];
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
  action?: "settings" | "credits";
  disabled?: boolean;
};

type WaveSpawnEvent = {
  at: number;
  kind: EnemyKind;
  y?: number;
};

type WaveState = {
  mode: GameMode | null;
  active: boolean;
  wave: number;
  waveStartedAt: number;
  queue: WaveSpawnEvent[];
  nextWaveAt: number;
  difficulty: number;
  bossWave: boolean;
  messageUntil: number;
  message: string;
};

const ASSETS: Record<SpriteKey, SpriteConfig> = {
  player: {
    // Sprite parado/idle.
    src: "/game/player/ship-idle.png",

    // 4 sprites separados para animação do fogo/movimento.
    // Não precisa montar spritesheet.
    frameSrcs: [
      "/game/player/ship-move-1.png",
      "/game/player/ship-move-2.png",
      "/game/player/ship-move-3.png",
      "/game/player/ship-move-4.png",
    ],

    frames: 4,
    fps: 10,
  },

  playerDodge: {
    src: "/game/player/ship-dodge.png",
    frameWidth: 64,
    frameHeight: 64,
    frames: 1,
    fps: 8,
  },

  boostFire: {
    src: "/game/effects/boost-fire.png",
    frameWidth: 96,
    frameHeight: 96,
    frames: 1,
    fps: 12,
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
      // Tamanho visual da nave na tela.
      width: 150,
      height: 74,

      // Hitbox configurável da nave.
      // offsetX/offsetY centralizam a hitbox dentro do sprite visual.
      hitboxWidth: 116,
      hitboxHeight: 54,
      hitboxOffsetX: 8,
      hitboxOffsetY: 10,

      maxHp: 5,
      invincibleMs: 2000,
      acceleration: 0.36,
      friction: 0.94,
      maxSpeedX: 7.5,
      maxSpeedY: 6.9,
      tiltMaxDeg: 18,
      tiltResponse: 0.18,
      stretchMax: 0.34,

      // Animação por sprites separados.
      // A nave usa ship-idle.png parada e alterna ship-move-1..4 quando estiver se mexendo.
      animationMoveThreshold: 0.18,

      strongShotRecoil: 7.5,
      strongShotShake: 8,
      strongShotShakeMs: 180,
    },

    boost: {
      enabled: true,
      keyKillsToFull: 15,
      startCharge: 7.5,
      maxCharge: 15,
      damage: 3.5,
      durationMs: 260,
      postInvincibleMs: 500,
      speed: 15.5,
      knockback: 8.5,
      particleAmount: 24,
      fireSpriteWidth: 112,
      fireSpriteHeight: 96,
      fireSpriteOpacity: 0.9,
      fireSpriteDistance: 58,
      shake: 5,
      shakeMs: 120,
    },

    dodge: {
      enabled: true,
      durationMs: 500,
      cooldownMs: 10000,
      speedImpulse: 4.5,
    },

    gameOver: {
      slowExplosionMs: 1300,
      bigExplosionMs: 1600,
      whiteFlashMs: 850,
      menuDelayMs: 3450,
      smallBurstEveryMs: 130,
      bigBurstEveryMs: 70,
      shakeIntensity: 13,
      shakeMs: 2200,
      fireParticleAmount: 42,
      finalFlashParticleAmount: 160,
    },

    score: {
      red: 100,
      black: 220,
      purple: 120,
      asteroid: 180,
      fragment: 25,
      waveClear: 500,
      bossWaveClear: 2500,
    },

    dynamicStretch: {
      enabled: true,

      // Regra: distorce só no início de uma mudança real de movimento.
      // A curva tem entrada suave, volta ao normal e NÃO reseta enquanto já está ativa.
      base: 0.068,

      // Limites gerais para não destruir o sprite.
      maxStretch: 0.2,
      maxSquash: 0.12,
      squeeze: 0.22,

      // Player: curto, sem boing. Dispara só ao começar movimento ou virar forte.
      playerPulseMs: 260,
      playerBoingStrength: 0,
      playerMultiplier: 0.95,
      playerTriggerSpeed: 0.42,
      playerTriggerAngleDeg: 72,
      playerTriggerCooldownMs: 170,
      playerPulseSpeedScale: 0.78,

      // Projéteis: duração maior e ÚNICO lugar com boing sutil no final.
      shotPulseMs: 760,
      shotBoingStrength: 0.035,
      shotMultiplier: 1.22,

      // Inimigos/asteroides: curto, sem boing. Visível, mas sem ficar deformado.
      enemyPulseMs: 280,
      enemyBoingStrength: 0,
      enemyMultiplier: 1.22,

      // Impactos/explosões pequenas.
      impactPulseMs: 200,
      impactBoingStrength: 0,
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

    infiniteWaves: {
      enabled: true,
      firstWaveDelayMs: 900,
      nextWaveDelayMs: 1800,
      spawnIntervalMs: 720,
      baseGroups: 2,
      groupsPerWave: 0.42,
      maxGroups: 20,
      purpleFromWave: 2,
      blackFromWave: 4,
      asteroidFromWave: 3,
      asteroidEvery: 3,
      bossEvery: 50,
      difficultyPerWave: 0.045,
      maxDifficulty: 3.2,
      messageMs: 1500,
    },

    enemies: {
      red: {
        width: 64,
        height: 64,
        hp: 3,
        speed: 2.3,
        waveAmplitude: 1,
        waveFrequency: 0.0032,
        shootEveryMs: 1350,
        bulletSpeed: 4.7,
        edgePadding: 92,
        verticalTravelMs: 2200,
        pairGapX: 0,
      },

      black: {
        width: 72,
        height: 72,
        hp: 5,
        appearX: 1040,
        windUpMs: 820,
        dashSpeed: 10.5,
      },

      purple: {
        width: 70,
        height: 70,
        hp: 3,
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

    abilityReady: "/sounds/ability-ready.mp3",
    boostReady: "/sounds/boost-ready.mp3",
    dodgeReady: "/sounds/dodge-ready.mp3",
    strongReady: "/sounds/strong-ready.mp3",
    boostStart: "/sounds/boost-start.mp3",
    boostHit: "/sounds/boost-hit.mp3",
    dodge: "/sounds/dodge.mp3",

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
    mobileBoost: "/game/ui/mobile-boost.png",
    mobileDodge: "/game/ui/mobile-dodge.png",
    mobileFullscreen: "/game/ui/mobile-fullscreen.png",
  },

  settings: {
    showGameplayHints: false,
    showMobileStartHint: true,
    mobileControls: "joystick",

    // Áudio
    masterVolume: 1,
    sfxVolume: 1,
    menuVolume: 0.8,
    hitVolume: 0.75,
    abilityVolume: 0.85,

    // Performance / conforto visual
    enableScreenShake: true,
    enableParticles: true,
    particleQuality: 1,
    enableLowHpAlarm: true,
    enableFlashingLights: true,
    enableAbilityReadySounds: true,
    enableBoostFireSprite: true,
    autoPauseOnBlur: true,
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
  { label: "CONFIGURAÇÕES", action: "settings" },
  { label: "CRÉDITOS", disabled: true },
];

type GameSettingKey = keyof typeof CONFIG.settings;

type GameSettingOption = {
  key: GameSettingKey;
  label: string;
  category: "ÁUDIO" | "VISUAL" | "ACESSIBILIDADE" | "MOBILE";
  kind: "toggle" | "range" | "select";
  min?: number;
  max?: number;
  step?: number;
  values?: string[];
  formatter?: (value: unknown) => string;
};

const SETTINGS_SECTIONS = [
  "ÁUDIO",
  "VISUAL",
  "ACESSIBILIDADE",
  "MOBILE",
] as const;

const SETTINGS_OPTIONS: GameSettingOption[] = [
  {
    key: "masterVolume",
    label: "Volume geral",
    category: "ÁUDIO",
    kind: "range",
    min: 0,
    max: 1,
    step: 0.1,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },
  {
    key: "sfxVolume",
    label: "Efeitos",
    category: "ÁUDIO",
    kind: "range",
    min: 0,
    max: 1,
    step: 0.1,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },
  {
    key: "menuVolume",
    label: "Menu",
    category: "ÁUDIO",
    kind: "range",
    min: 0,
    max: 1,
    step: 0.1,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },
  {
    key: "hitVolume",
    label: "Hits",
    category: "ÁUDIO",
    kind: "range",
    min: 0,
    max: 1,
    step: 0.1,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },
  {
    key: "abilityVolume",
    label: "Habilidades",
    category: "ÁUDIO",
    kind: "range",
    min: 0,
    max: 1,
    step: 0.1,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },

  {
    key: "enableParticles",
    label: "Partículas",
    category: "VISUAL",
    kind: "toggle",
  },
  {
    key: "particleQuality",
    label: "Qualidade das partículas",
    category: "VISUAL",
    kind: "range",
    min: 0.25,
    max: 1,
    step: 0.25,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },
  {
    key: "enableScreenShake",
    label: "Shake de tela",
    category: "VISUAL",
    kind: "toggle",
  },
  {
    key: "enableBoostFireSprite",
    label: "Fogo do boost",
    category: "VISUAL",
    kind: "toggle",
  },

  {
    key: "enableFlashingLights",
    label: "Luzes piscantes",
    category: "ACESSIBILIDADE",
    kind: "toggle",
  },
  {
    key: "enableLowHpAlarm",
    label: "Alarme de 1 HP",
    category: "ACESSIBILIDADE",
    kind: "toggle",
  },
  {
    key: "enableAbilityReadySounds",
    label: "Som de habilidade pronta",
    category: "ACESSIBILIDADE",
    kind: "toggle",
  },
  {
    key: "autoPauseOnBlur",
    label: "Pausar ao minimizar",
    category: "ACESSIBILIDADE",
    kind: "toggle",
  },

  {
    key: "showMobileStartHint",
    label: "Dica mobile",
    category: "MOBILE",
    kind: "toggle",
  },
];

class AssetManager {
  private images = new Map<SpriteKey, HTMLImageElement | null>();
  private frameImages = new Map<SpriteKey, (HTMLImageElement | null)[]>();

  async loadAll() {
    const entries = Object.entries(ASSETS) as [SpriteKey, SpriteConfig][];

    await Promise.all(
      entries.map(async ([key, config]) => {
        // Imagem principal: para player é o sprite parado/idle; para outros é o sprite normal/spritesheet.
        const image = await this.loadImage(config.src);
        this.images.set(key, image);

        // Frames separados: usados quando não queremos spritesheet.
        if (config.frameSrcs && config.frameSrcs.length > 0) {
          const frames = await Promise.all(
            config.frameSrcs.map((frameSrc) => this.loadImage(frameSrc)),
          );

          this.frameImages.set(key, frames);
        }
      }),
    );
  }

  get(key: SpriteKey) {
    return this.images.get(key) ?? null;
  }

  getFrame(key: SpriteKey, frameIndex: number) {
    const frames = this.frameImages.get(key);

    if (!frames || frames.length === 0) {
      return null;
    }

    const safeIndex = Math.abs(Math.floor(frameIndex)) % frames.length;
    return frames[safeIndex] ?? null;
  }

  hasFrames(key: SpriteKey) {
    const frames = this.frameImages.get(key);
    return Boolean(frames && frames.some(Boolean));
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
    const config = ASSETS[this.key];

    // Animação por arquivos separados, exemplo:
    // ship-move-1.png, ship-move-2.png, ship-move-3.png, ship-move-4.png
    const frameImage = assets.getFrame(this.key, this.frame);

    if (CONFIG.useSprites && frameImage) {
      renderCtx.drawImage(frameImage, this.x, this.y, this.w, this.h);
      return true;
    }

    const img = assets.get(this.key);

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
      this.h,
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
    dodgeUntil: 0,
    boostUntil: 0,
    boostVx: 0,
    boostVy: 0,
    normalCooldown: 0,
    strongReadyAt: 0,
    stretchUntil: 0,
    stretchVx: 1,
    stretchVy: 0,
    wasMoving: false,
    lastInputX: 0,
    lastInputY: 0,
    lastMoveAngle: 0,
    lastStretchAt: 0,
  };
}

function rectsCollide(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

function getPlayerHitbox(player: Player) {
  const cfg = CONFIG.gameplay.player;

  return {
    x: player.x + cfg.hitboxOffsetX,
    y: player.y + cfg.hitboxOffsetY,
    w: cfg.hitboxWidth,
    h: cfg.hitboxHeight,
  };
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

type StretchProfile = "player" | "shot" | "enemy" | "impact";

function getStretchSettings(profile: StretchProfile) {
  const cfg = CONFIG.gameplay.dynamicStretch;

  if (profile === "player") {
    return {
      ms: cfg.playerPulseMs,
      boing: cfg.playerBoingStrength,
      multiplier: cfg.playerMultiplier,
      decayPower: 1.55,
      boingStart: 0.78,
      attackRatio: 0.18,
    };
  }

  if (profile === "shot") {
    return {
      ms: cfg.shotPulseMs,
      boing: cfg.shotBoingStrength,
      multiplier: cfg.shotMultiplier,
      decayPower: 1.25,
      boingStart: 0.72,
      attackRatio: 0.14,
    };
  }

  if (profile === "enemy") {
    return {
      ms: cfg.enemyPulseMs,
      boing: cfg.enemyBoingStrength,
      multiplier: cfg.enemyMultiplier,
      decayPower: 1.45,
      boingStart: 0.78,
      attackRatio: 0.16,
    };
  }

  return {
    ms: cfg.impactPulseMs,
    boing: cfg.impactBoingStrength,
    multiplier: 1,
    decayPower: 1.55,
    boingStart: 0.78,
    attackRatio: 0.16,
  };
}

function getStretchPulse(
  until: number,
  profile: StretchProfile,
  now = performance.now(),
) {
  if (!CONFIG.gameplay.dynamicStretch.enabled || until <= now) {
    return 0;
  }

  const settings = getStretchSettings(profile);
  const pulseMs = Math.max(1, settings.ms);
  const remaining = clamp((until - now) / pulseMs, 0, 1);
  const progress = 1 - remaining;

  // Pulso principal com entrada suave:
  // começa em 0, sobe rápido, depois volta para 0.
  // Isso evita a sensação de "travada" e impede reset visual brusco.
  const attackRatio = clamp(settings.attackRatio ?? 0.16, 0.05, 0.45);
  const attack =
    progress < attackRatio
      ? Math.sin((progress / attackRatio) * (Math.PI / 2))
      : 1;

  const decayProgress = clamp(
    (progress - attackRatio) / Math.max(0.001, 1 - attackRatio),
    0,
    1,
  );

  const mainStretch = attack * Math.pow(1 - decayProgress, settings.decayPower);

  // Boing: só acontece em perfis que tiverem boing > 0. No CONFIG atual, só projéteis.
  if (settings.boing <= 0 || progress <= settings.boingStart) {
    return mainStretch;
  }

  const boingProgress = clamp(
    (progress - settings.boingStart) / (1 - settings.boingStart),
    0,
    1,
  );

  const boing =
    -settings.boing *
    Math.sin(boingProgress * Math.PI) *
    Math.pow(1 - boingProgress, 0.45);

  return mainStretch + boing;
}

function getVelocityStretchAmount(vx: number, vy: number, pulse = 0) {
  if (!CONFIG.gameplay.dynamicStretch.enabled || Math.abs(pulse) <= 0.001) {
    return 0;
  }

  const speed = Math.hypot(vx, vy);
  const raw = speed * CONFIG.gameplay.dynamicStretch.base * pulse;

  return clamp(
    raw,
    -CONFIG.gameplay.dynamicStretch.maxSquash,
    CONFIG.gameplay.dynamicStretch.maxStretch,
  );
}

function applyVelocityStretch(
  ctx: CanvasRenderingContext2D,
  vx: number,
  vy: number,
  multiplier = 1,
  pulse = 0,
) {
  const amount = getVelocityStretchAmount(vx, vy, pulse) * multiplier;

  if (Math.abs(amount) <= 0.001) {
    return;
  }

  const speed = Math.hypot(vx, vy);
  const angle = speed > 0.001 ? Math.atan2(vy, vx) : 0;
  const squeeze = CONFIG.gameplay.dynamicStretch.squeeze;

  const stretchScale = clamp(1 + amount, 0.72, 1.55);
  const squashScale = clamp(1 - amount * squeeze, 0.72, 1.28);

  ctx.rotate(angle);
  ctx.scale(stretchScale, squashScale);
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
  stretchMultiplier = 1.35,
  stretchPulse = 0,
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  applyVelocityStretch(ctx, vx, vy, stretchMultiplier, stretchPulse);
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
  const mobileMoveRef = useRef({ x: 0, y: 0 });
  const [mobileStick, setMobileStick] = useState({ x: 0, y: 0 });

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

  const settingsIndexRef = useRef(0);
  const [settingsIndex, setSettingsIndex] = useState(0);
  const [settingsSnapshot, setSettingsSnapshot] = useState({
    ...CONFIG.settings,
  });

  const storyIndexRef = useRef(0);
  const [storyIndex, setStoryIndex] = useState(0);

  const strongCooldownRef = useRef(0);
  const [strongCooldown, setStrongCooldown] = useState(0);

  const [playerHp, setPlayerHp] = useState(CONFIG.gameplay.player.maxHp);
  const [isLowHp, setIsLowHp] = useState(false);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const boostChargeRef = useRef(CONFIG.gameplay.boost.startCharge);
  const [boostCharge, setBoostCharge] = useState(
    CONFIG.gameplay.boost.startCharge,
  );
  const [dodgeReadyRatio, setDodgeReadyRatio] = useState(1);
  const [strongReadyRatio, setStrongReadyRatio] = useState(1);
  const lastDodgeAtRef = useRef(-9999);
  const boostHitEnemiesRef = useRef(new Set<number>());

  const currentModeRef = useRef<GameMode | null>(null);
  const waveStateRef = useRef<WaveState>({
    mode: null,
    active: false,
    wave: 0,
    waveStartedAt: 0,
    queue: [],
    nextWaveAt: 0,
    difficulty: 1,
    bossWave: false,
    messageUntil: 0,
    message: "",
  });
  const [waveUi, setWaveUi] = useState({
    mode: null as GameMode | null,
    wave: 0,
    active: false,
    bossWave: false,
    message: "",
  });

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
      CONFIG.gameplay.player.height,
    ),
  );

  const shotsRef = useRef<Shot[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const enemyProjectilesRef = useRef<EnemyProjectile[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  const shakeRef = useRef({ intensity: 0, endAt: 0 });
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const abilityReadyRef = useRef({
    boost: false,
    dodge: true,
    strong: true,
  });

  const gameOverStartedAtRef = useRef(0);
  const gameOverLastBurstAtRef = useRef(0);
  const [gameOverFlash, setGameOverFlash] = useState(false);
  const [gameOverFlashOrigin, setGameOverFlashOrigin] = useState({ x: "50%", y: "50%" });

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

  function setIndiceConfiguracao(index: number) {
    const safeIndex =
      (index + SETTINGS_OPTIONS.length) % SETTINGS_OPTIONS.length;
    settingsIndexRef.current = safeIndex;
    setSettingsIndex(safeIndex);
  }

  function atualizarConfiguracao(
    key: GameSettingKey,
    value: boolean | number | string,
  ) {
    (CONFIG.settings as Record<string, boolean | number | string>)[key] = value;
    setSettingsSnapshot({ ...CONFIG.settings });
  }

  function formatarConfiguracao(option: GameSettingOption) {
    const value = settingsSnapshot[option.key];

    if (option.formatter) {
      return option.formatter(value);
    }

    if (typeof value === "boolean") {
      return value ? "ON" : "OFF";
    }

    return String(value).toUpperCase();
  }

  function alterarConfiguracaoAtual(direction = 1) {
    const option = SETTINGS_OPTIONS[settingsIndexRef.current];
    if (!option) return;

    const currentValue = CONFIG.settings[option.key];

    if (option.kind === "toggle") {
      atualizarConfiguracao(option.key, !Boolean(currentValue));
      tocarSom(CONFIG.sounds.menuConfirm, 0.32, "menu");
      return;
    }

    if (option.kind === "range") {
      const min = option.min ?? 0;
      const max = option.max ?? 1;
      const step = option.step ?? 0.1;
      const nextValue = clamp(
        Number(currentValue) + step * direction,
        min,
        max,
      );
      atualizarConfiguracao(option.key, Number(nextValue.toFixed(2)));
      tocarSom(CONFIG.sounds.menuMove, 0.24, "menu");
      return;
    }

    if (option.kind === "select" && option.values?.length) {
      const currentIndex = option.values.indexOf(String(currentValue));
      const nextIndex =
        (currentIndex + direction + option.values.length) %
        option.values.length;
      atualizarConfiguracao(option.key, option.values[nextIndex]);
      tocarSom(CONFIG.sounds.menuMove, 0.24, "menu");
    }
  }

  function abrirConfiguracoes() {
    tocarSom(CONFIG.sounds.menuConfirm, 0.42, "menu");
    setIndiceConfiguracao(0);
    setEstado("settings");
  }

  function voltarDasConfiguracoes() {
    tocarSom(CONFIG.sounds.menuBack, 0.38, "menu");
    setEstado("mainMenu");
  }

  function setHistoriaIndex(index: number) {
    storyIndexRef.current = index;
    setStoryIndex(index);
  }

  function tocarSom(
    src: string,
    volume = 0.45,
    category: "menu" | "hit" | "ability" | "sfx" = "sfx",
  ) {
    if (!CONFIG.useSounds || !src || CONFIG.settings.masterVolume <= 0) {
      return;
    }

    const categoryVolume =
      category === "menu"
        ? CONFIG.settings.menuVolume
        : category === "hit"
          ? CONFIG.settings.hitVolume
          : category === "ability"
            ? CONFIG.settings.abilityVolume
            : CONFIG.settings.sfxVolume;

    const audio = new Audio(src);
    audio.volume = clamp(
      volume * CONFIG.settings.masterVolume * categoryVolume,
      0,
      1,
    );
    audio.play().catch(() => {});
  }

  function tocarSomHabilidadePronta(tipo: "boost" | "dodge" | "strong") {
    if (!CONFIG.settings.enableAbilityReadySounds) return;

    const src =
      tipo === "boost"
        ? CONFIG.sounds.boostReady || CONFIG.sounds.abilityReady
        : tipo === "dodge"
          ? CONFIG.sounds.dodgeReady || CONFIG.sounds.abilityReady
          : CONFIG.sounds.strongReady || CONFIG.sounds.abilityReady;

    tocarSom(src, 0.52, "ability");
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
    boostHitEnemiesRef.current.clear();
  }

  function resetarWaves(mode: GameMode | null) {
    const now = performance.now();

    waveStateRef.current = {
      mode,
      active: false,
      wave: 0,
      waveStartedAt: 0,
      queue: [],
      nextWaveAt:
        mode === "infinite"
          ? now + CONFIG.gameplay.infiniteWaves.firstWaveDelayMs
          : 0,
      difficulty: 1,
      bossWave: false,
      messageUntil:
        mode === "infinite" ? now + CONFIG.gameplay.infiniteWaves.messageMs : 0,
      message: mode === "infinite" ? "PREPARE-SE" : "",
    };

    setWaveUi({
      mode,
      wave: 0,
      active: false,
      bossWave: false,
      message: mode === "infinite" ? "PREPARE-SE" : "",
    });
  }

  function iniciarJogo(mode: GameMode = currentModeRef.current ?? "infinite") {
    solicitarFullscreen();
    currentModeRef.current = mode;

    const player = createInitialPlayer();
    playerRef.current = player;

    limparCombate();
    resetarWaves(mode);

    strongCooldownRef.current = 0;
    setStrongCooldown(0);
    scoreRef.current = 0;
    setScore(0);
    boostChargeRef.current = CONFIG.gameplay.boost.startCharge;
    setBoostCharge(CONFIG.gameplay.boost.startCharge);
    abilityReadyRef.current = {
      boost:
        CONFIG.gameplay.boost.startCharge >= CONFIG.gameplay.boost.maxCharge,
      dodge: true,
      strong: true,
    };
    setPlayerHp(player.hp);
    setIsLowHp(false);
    setGameOverFlash(false);

    setEstado("playing");
  }

  function iniciarGameOverCutscene() {
    const player = playerRef.current;
    const now = performance.now();

    setGameOverFlashOrigin({
      x: `${clamp(((player.x + player.w / 2) / CONFIG.canvasWidth) * 100, 0, 100)}%`,
      y: `${clamp(((player.y + player.h / 2) / CONFIG.canvasHeight) * 100, 0, 100)}%`,
    });

    player.vx = 0;
    player.vy = 0;
    player.boostVx = 0;
    player.boostVy = 0;
    player.normalCooldown = 999999;
    player.invincibleUntil = now + 999999;

    keysRef.current = {};
    mobileShootRef.current = false;
    resetarJoystick();
    enemyProjectilesRef.current = [];
    shotsRef.current = [];

    gameOverStartedAtRef.current = now;
    gameOverLastBurstAtRef.current = 0;
    setGameOverFlash(false);
    setIsLowHp(false);

    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
    }

    tocarSom(CONFIG.sounds.explosion || CONFIG.sounds.enemyDeath, 0.58, "hit");

    if (CONFIG.settings.enableScreenShake) {
      shakeRef.current = {
        intensity: CONFIG.gameplay.gameOver.shakeIntensity,
        endAt: now + CONFIG.gameplay.gameOver.shakeMs,
      };
    }

    setEstado("gameOverCutscene");
  }

  function receberDano(dano: number, forcarHpUm = false) {
    const player = playerRef.current;
    const now = performance.now();

    if (now < player.invincibleUntil) {
      return;
    }

    tocarSom(CONFIG.sounds.playerDamage, 0.5, "hit");
    criarParticulasHit(
      player.x + player.w / 2,
      player.y + player.h / 2,
      "#ff4d4d",
      14,
    );

    if (forcarHpUm) {
      player.hp = Math.max(1, Math.min(player.hp, 1));
    } else {
      player.hp = Math.max(0, player.hp - dano);
    }

    player.invincibleUntil = now + CONFIG.gameplay.player.invincibleMs;
    setPlayerHp(player.hp);
    setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");

    if (
      player.hp <= 1 &&
      gameStateRef.current === "playing" &&
      CONFIG.useSounds &&
      CONFIG.settings.enableLowHpAlarm
    ) {
      if (!alarmAudioRef.current) {
        const audio = new Audio(CONFIG.sounds.lowHpAlarm);
        audio.loop = true;
        audio.volume = clamp(
          0.42 * CONFIG.settings.masterVolume * CONFIG.settings.sfxVolume,
          0,
          1,
        );
        alarmAudioRef.current = audio;
      }
      alarmAudioRef.current.play().catch(() => {});
    }

    shakeRef.current = { intensity: 5, endAt: now + 160 };

    if (player.hp <= 0) {
      player.hp = 0;
      setPlayerHp(0);
      iniciarGameOverCutscene();
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
      tocarSom(CONFIG.sounds.menuConfirm, 0.4, "menu");
      setEstado("playing");
      setIsLowHp(playerRef.current.hp <= 1);
    }
  }

  function voltarAoMenuPrincipal() {
    tocarSom(CONFIG.sounds.menuBack, 0.45, "menu");
    limparCombate();
    resetarWaves(null);
    setIsLowHp(false);
    setGameOverFlash(false);
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

  function adicionarPontuacao(valor: number) {
    scoreRef.current += valor;
    setScore(scoreRef.current);
  }

  function carregarBoostPorAbate() {
    if (!CONFIG.gameplay.boost.enabled) return;

    const next = clamp(
      boostChargeRef.current + 1,
      0,
      CONFIG.gameplay.boost.maxCharge,
    );

    const wasReady = boostChargeRef.current >= CONFIG.gameplay.boost.maxCharge;
    boostChargeRef.current = next;
    setBoostCharge(next);

    if (!wasReady && next >= CONFIG.gameplay.boost.maxCharge) {
      tocarSomHabilidadePronta("boost");
      abilityReadyRef.current.boost = true;
    }
  }

  function registrarAbate(kind: EnemyKind) {
    adicionarPontuacao(CONFIG.gameplay.score[kind]);
    carregarBoostPorAbate();
  }

  function executarBoost() {
    if (!CONFIG.gameplay.boost.enabled) return;
    if (gameStateRef.current !== "playing") return;
    if (boostChargeRef.current < CONFIG.gameplay.boost.maxCharge) return;

    const player = playerRef.current;
    const now = performance.now();
    const speed = Math.hypot(player.vx, player.vy);
    const dirX = speed > 0.2 ? player.vx / speed : 1;
    const dirY = speed > 0.2 ? player.vy / speed : 0;

    player.boostUntil = now + CONFIG.gameplay.boost.durationMs;
    player.boostVx = dirX * CONFIG.gameplay.boost.speed;
    player.boostVy = dirY * CONFIG.gameplay.boost.speed;
    player.invincibleUntil = Math.max(
      player.invincibleUntil,
      player.boostUntil + CONFIG.gameplay.boost.postInvincibleMs,
    );
    player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
    player.stretchVx = player.boostVx;
    player.stretchVy = player.boostVy;

    boostHitEnemiesRef.current.clear();
    boostChargeRef.current = 0;
    setBoostCharge(0);
    abilityReadyRef.current.boost = false;

    tocarSom(CONFIG.sounds.boostStart, 0.58, "ability");
    criarExplosao(
      player.x + player.w / 2,
      player.y + player.h / 2,
      "#ffb703",
      CONFIG.gameplay.boost.particleAmount,
    );

    if (CONFIG.settings.enableScreenShake) {
      shakeRef.current = {
        intensity: CONFIG.gameplay.boost.shake,
        endAt: now + CONFIG.gameplay.boost.shakeMs,
      };
    }
  }

  function executarEsquiva() {
    if (!CONFIG.gameplay.dodge.enabled) return;
    if (gameStateRef.current !== "playing") return;

    const now = performance.now();
    if (now - lastDodgeAtRef.current < CONFIG.gameplay.dodge.cooldownMs) return;

    const player = playerRef.current;
    const speed = Math.hypot(player.vx, player.vy);
    const dirX = speed > 0.2 ? player.vx / speed : 1;
    const dirY = speed > 0.2 ? player.vy / speed : 0;

    player.dodgeUntil = now + CONFIG.gameplay.dodge.durationMs;
    player.invincibleUntil = Math.max(
      player.invincibleUntil,
      player.dodgeUntil,
    );
    player.vx += dirX * CONFIG.gameplay.dodge.speedImpulse;
    player.vy += dirY * CONFIG.gameplay.dodge.speedImpulse;
    lastDodgeAtRef.current = now;
    abilityReadyRef.current.dodge = false;
    setDodgeReadyRatio(0);
    tocarSom(CONFIG.sounds.dodge, 0.5, "ability");
  }

  function atualizarJoystick(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxDistance = rect.width * 0.36;

    const rawX = event.clientX - centerX;
    const rawY = event.clientY - centerY;
    const distance = Math.max(1, Math.hypot(rawX, rawY));
    const limitedDistance = Math.min(distance, maxDistance);

    const x = (rawX / distance) * limitedDistance;
    const y = (rawY / distance) * limitedDistance;

    mobileMoveRef.current = {
      x: clamp(x / maxDistance, -1, 1),
      y: clamp(y / maxDistance, -1, 1),
    };

    setMobileStick({ x, y });
  }

  function resetarJoystick() {
    mobileMoveRef.current = { x: 0, y: 0 };
    setMobileStick({ x: 0, y: 0 });
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
    tocarSom(CONFIG.sounds.menuBack, 0.45, "menu");
    setMenuAberto(false);
    setEscurecendo(true);

    window.setTimeout(() => {
      limparCombate();
      resetarWaves(null);
      currentModeRef.current = null;
      setEstado("title");
      setIndiceMenu(0);
      setSaindoTitulo(false);
      setEscurecendo(false);
    }, 360);
  }

  function executarEscolhaDeModo(mode: GameMode) {
    currentModeRef.current = mode;
    tocarSom(CONFIG.sounds.menuConfirm, 0.52, "menu");
    setMenuAberto(false);
    setEscurecendo(true);

    window.setTimeout(() => {
      if (mode === "story") {
        setHistoriaIndex(0);
        setEstado("storyCutscene");
      } else {
        iniciarJogo("infinite");
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

    if (!option || option.disabled) {
      tocarSom(CONFIG.sounds.menuBack, 0.35, "menu");
      return;
    }

    if (option.action === "settings") {
      abrirConfiguracoes();
      return;
    }

    if (option.mode) {
      escolherModo(option.mode);
      return;
    }

    tocarSom(CONFIG.sounds.menuBack, 0.35, "menu");
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
        CONFIG.canvasHeight / 2 - cfg.edgePadding - cfg.height / 2,
      );
      const topY = centerY - verticalRange;
      const bottomY = centerY + verticalRange;
      const sharedCooldown = cfg.shootEveryMs;

      const createRed = (
        startY: number,
        targetY: number,
        phase: number,
      ): Enemy => ({
        id: enemyIdRef.current++,
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
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
        redStartY: startY,
        redTargetY: targetY,
        redTravelTimeMs: cfg.verticalTravelMs,
      });

      enemiesRef.current.push(createRed(topY, bottomY, 0));
      enemiesRef.current.push(createRed(bottomY, topY, Math.PI));
      return;
    }

    if (kind === "black") {
      const cfg = CONFIG.gameplay.enemies.black;
      const player = playerRef.current;

      enemiesRef.current.push({
        id,
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
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
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
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
        cfg.baseSpeed - sizeTier * cfg.speedLossPerTier,
      );
      const fragmentCount = Math.max(
        2,
        Math.ceil(sizeTier * cfg.fragmentsPerTier),
      );
      const rotationDirection = Math.random() > 0.5 ? 1 : -1;

      enemiesRef.current.push({
        id,
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
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
          rotationDirection * rand(cfg.rotationSpeedMin, cfg.rotationSpeedMax),
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
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
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
    if (!CONFIG.settings.enableParticles) {
      return;
    }

    const finalAmount = Math.max(
      0,
      Math.round(amount * CONFIG.settings.particleQuality),
    );

    for (let i = 0; i < finalAmount; i++) {
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
    if (!CONFIG.settings.enableParticles) {
      return;
    }

    const finalAmount = Math.max(
      0,
      Math.round(amount * CONFIG.settings.particleQuality),
    );

    for (let i = 0; i < finalAmount; i++) {
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

  function criarParticulasBoost(player: Player, amount = 4) {
    if (!CONFIG.settings.enableParticles) return;

    const now = performance.now();
    const speed = Math.hypot(player.boostVx, player.boostVy);
    const dirX = speed > 0.001 ? player.boostVx / speed : 1;
    const dirY = speed > 0.001 ? player.boostVy / speed : 0;

    // Partículas na frente da nave, como uma bola de fogo no boost.
    const frontX = player.x + player.w / 2 + dirX * (player.w * 0.58);
    const frontY = player.y + player.h / 2 + dirY * (player.h * 0.58);

    // Partículas atrás da nave, como rastro flamejante.
    const backX = player.x + player.w / 2 - dirX * (player.w * 0.48);
    const backY = player.y + player.h / 2 - dirY * (player.h * 0.48);

    for (let i = 0; i < amount; i++) {
      const spread = rand(-0.75, 0.75);
      const forwardSpeed = rand(1.2, 4.4);
      const sideX = -dirY;
      const sideY = dirX;

      particlesRef.current.push({
        id: enemyIdRef.current++,
        x: frontX + sideX * rand(-12, 12),
        y: frontY + sideY * rand(-12, 12),
        vx: dirX * forwardSpeed + sideX * spread,
        vy: dirY * forwardSpeed + sideY * spread,
        size: rand(6, 14),
        life: rand(120, 260),
        maxLife: 260,
        color: corParticulaQuente(),
      });

      particlesRef.current.push({
        id: enemyIdRef.current++,
        x: backX + sideX * rand(-14, 14),
        y: backY + sideY * rand(-14, 14),
        vx: -dirX * rand(0.8, 3.6) + sideX * spread,
        vy: -dirY * rand(0.8, 3.6) + sideY * spread,
        size: rand(4, 11),
        life: rand(150, 320),
        maxLife: 320,
        color: corParticulaQuente(),
      });
    }
  }

  function triggerPlayerStretch(vx: number, vy: number) {
    const now = performance.now();
    const player = playerRef.current;
    const speed = Math.hypot(vx, vy);

    if (speed < CONFIG.gameplay.dynamicStretch.playerTriggerSpeed) {
      return;
    }

    // Não reinicia a distorção se ela ainda está ativa.
    // Isso remove o "boing/reset" quando troca direção várias vezes rápido.
    if (now < player.stretchUntil) {
      return;
    }

    if (
      now - player.lastStretchAt <
      CONFIG.gameplay.dynamicStretch.playerTriggerCooldownMs
    ) {
      return;
    }

    const dirX = vx / Math.max(0.001, speed);
    const dirY = vy / Math.max(0.001, speed);
    const pulseSpeed =
      Math.max(
        CONFIG.gameplay.player.maxSpeedX,
        CONFIG.gameplay.player.maxSpeedY,
      ) * CONFIG.gameplay.dynamicStretch.playerPulseSpeedScale;

    player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
    player.stretchVx = dirX * pulseSpeed;
    player.stretchVy = dirY * pulseSpeed;
    player.lastMoveAngle = Math.atan2(vy, vx);
    player.lastStretchAt = now;
  }

  function mostrarMensagemWave(message: string, bossWave = false) {
    const wave = waveStateRef.current;
    const until = performance.now() + CONFIG.gameplay.infiniteWaves.messageMs;

    wave.message = message;
    wave.messageUntil = until;
    wave.bossWave = bossWave;

    setWaveUi({
      mode: wave.mode,
      wave: wave.wave,
      active: wave.active,
      bossWave,
      message,
    });
  }

  function criarPlanoWaveInfinita(waveNumber: number): WaveSpawnEvent[] {
    const cfg = CONFIG.gameplay.infiniteWaves;
    const events: WaveSpawnEvent[] = [];
    const bossWave = waveNumber > 0 && waveNumber % cfg.bossEvery === 0;
    const groupCount = bossWave
      ? Math.min(
          cfg.maxGroups,
          cfg.baseGroups + 12 + Math.floor(waveNumber / 8),
        )
      : Math.min(
          cfg.maxGroups,
          cfg.baseGroups + Math.floor(waveNumber * cfg.groupsPerWave),
        );

    for (let i = 0; i < groupCount; i++) {
      const at = i * cfg.spawnIntervalMs;
      const roll = Math.random();
      let kind: EnemyKind = "red";

      if (bossWave) {
        if (i % 5 === 0) kind = "black";
        else if (i % 3 === 0) kind = "asteroid";
        else if (i % 2 === 0) kind = "purple";
        else kind = "red";
      } else if (waveNumber >= cfg.blackFromWave && roll > 0.78) {
        kind = "black";
      } else if (waveNumber >= cfg.asteroidFromWave && roll > 0.58) {
        kind = "asteroid";
      } else if (waveNumber >= cfg.purpleFromWave && roll > 0.36) {
        kind = "purple";
      }

      events.push({
        at,
        kind,
        y: kind === "red" ? undefined : rand(70, CONFIG.canvasHeight - 150),
      });

      if (
        !bossWave &&
        waveNumber >= cfg.asteroidFromWave &&
        waveNumber % cfg.asteroidEvery === 0 &&
        i === Math.floor(groupCount / 2)
      ) {
        events.push({
          at: at + cfg.spawnIntervalMs / 2,
          kind: "asteroid",
          y: rand(70, CONFIG.canvasHeight - 180),
        });
      }
    }

    return events.sort((a, b) => a.at - b.at);
  }

  function aplicarDificuldadeWave(inicio: number, difficulty: number) {
    const waveNumber = waveStateRef.current.wave;
    const hpBonus = Math.floor(waveNumber / 20);
    const speedScale = Math.min(2.45, 1 + Math.max(0, difficulty - 1) * 0.38);

    for (const enemy of enemiesRef.current.slice(inicio)) {
      if (enemy.kind !== "fragment") {
        enemy.hp = Math.max(1, Math.ceil(enemy.hp + hpBonus));
        enemy.maxHp = enemy.hp;
      }

      enemy.vx *= speedScale;
      enemy.vy *= speedScale;

      if (enemy.kind === "red") {
        enemy.shotCooldown = Math.max(
          430,
          enemy.shotCooldown / Math.min(2.6, difficulty),
        );
        enemy.redTravelTimeMs = Math.max(
          950,
          (enemy.redTravelTimeMs ??
            CONFIG.gameplay.enemies.red.verticalTravelMs) /
            Math.min(1.9, difficulty),
        );
      }
    }
  }

  function spawnWaveEnemy(kind: EnemyKind, difficulty: number, y?: number) {
    const before = enemiesRef.current.length;
    spawnEnemy(kind, y);
    aplicarDificuldadeWave(before, difficulty);
  }

  function iniciarWaveInfinita(waveNumber: number) {
    const now = performance.now();
    const cfg = CONFIG.gameplay.infiniteWaves;
    const difficulty = Math.min(
      cfg.maxDifficulty,
      1 + Math.max(0, waveNumber - 1) * cfg.difficultyPerWave,
    );
    const bossWave = waveNumber > 0 && waveNumber % cfg.bossEvery === 0;

    waveStateRef.current = {
      mode: "infinite",
      active: true,
      wave: waveNumber,
      waveStartedAt: now,
      queue: criarPlanoWaveInfinita(waveNumber),
      nextWaveAt: 0,
      difficulty,
      bossWave,
      messageUntil: now + cfg.messageMs,
      message: bossWave ? `BOSS WAVE ${waveNumber}` : `WAVE ${waveNumber}`,
    };

    setWaveUi({
      mode: "infinite",
      wave: waveNumber,
      active: true,
      bossWave,
      message: bossWave ? `BOSS WAVE ${waveNumber}` : `WAVE ${waveNumber}`,
    });

    tocarSom(
      bossWave ? CONFIG.sounds.bossIntro : CONFIG.sounds.waveStart,
      bossWave ? 0.6 : 0.48,
    );
  }

  function atualizarWavesInfinitas() {
    if (gameStateRef.current !== "playing") return;

    const wave = waveStateRef.current;
    if (wave.mode !== "infinite" || !CONFIG.gameplay.infiniteWaves.enabled)
      return;

    const now = performance.now();

    if (!wave.active) {
      if (wave.nextWaveAt > 0 && now >= wave.nextWaveAt) {
        iniciarWaveInfinita(wave.wave + 1);
      } else if (wave.message && now > wave.messageUntil) {
        wave.message = "";
        setWaveUi((current) => ({ ...current, message: "" }));
      }
      return;
    }

    const elapsed = now - wave.waveStartedAt;

    while (wave.queue.length > 0 && elapsed >= wave.queue[0].at) {
      const event = wave.queue.shift();
      if (event) spawnWaveEnemy(event.kind, wave.difficulty, event.y);
    }

    if (wave.message && now > wave.messageUntil) {
      wave.message = "";
      setWaveUi((current) => ({ ...current, message: "" }));
    }

    if (wave.queue.length === 0 && enemiesRef.current.length === 0) {
      wave.active = false;
      wave.nextWaveAt = now + CONFIG.gameplay.infiniteWaves.nextWaveDelayMs;
      wave.message = `WAVE ${wave.wave} CONCLUÍDA`;
      wave.messageUntil = now + CONFIG.gameplay.infiniteWaves.messageMs;

      adicionarPontuacao(
        wave.bossWave
          ? CONFIG.gameplay.score.bossWaveClear
          : CONFIG.gameplay.score.waveClear,
      );

      setWaveUi({
        mode: "infinite",
        wave: wave.wave,
        active: false,
        bossWave: false,
        message: wave.message,
      });
    }
  }

  useEffect(() => {
    assetsRef.current.loadAll();
  }, []);

  useEffect(() => {
    const shouldPlayAlarm =
      CONFIG.settings.enableLowHpAlarm &&
      playerHp <= 1 &&
      gameState === "playing";

    if (shouldPlayAlarm) {
      if (!alarmAudioRef.current) {
        const audio = new Audio(CONFIG.sounds.lowHpAlarm);
        audio.loop = true;
        audio.volume = clamp(
          0.42 * CONFIG.settings.masterVolume * CONFIG.settings.sfxVolume,
          0,
          1,
        );
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
      if (
        CONFIG.settings.autoPauseOnBlur &&
        document.hidden &&
        gameStateRef.current === "playing"
      ) {
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
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: player.x + player.w - 2,
        y: player.y + player.h / 2 - CONFIG.gameplay.shots.normal.height / 2,
        w: CONFIG.gameplay.shots.normal.width,
        h: CONFIG.gameplay.shots.normal.height,
        speed: CONFIG.gameplay.shots.normal.speed,
        damage: CONFIG.gameplay.shots.normal.damage,
        type: "normal",
      });

      tocarSom(CONFIG.sounds.normalShot, 0.45, "sfx");
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
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: player.x + player.w - 2,
        y: player.y + player.h / 2 - CONFIG.gameplay.shots.strong.height / 2,
        w: CONFIG.gameplay.shots.strong.width,
        h: CONFIG.gameplay.shots.strong.height,
        speed: CONFIG.gameplay.shots.strong.speed,
        damage: CONFIG.gameplay.shots.strong.damage,
        type: "strong",
      });

      tocarSom(CONFIG.sounds.strongShot, 0.5, "sfx");

      player.strongReadyAt = now + CONFIG.gameplay.shots.strong.cooldownMs;
      setStrongReadyRatio(0);
      player.vx -= CONFIG.gameplay.player.strongShotRecoil;
      player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
      player.stretchVx =
        -Math.max(
          CONFIG.gameplay.player.maxSpeedX,
          CONFIG.gameplay.player.maxSpeedY,
        ) * CONFIG.gameplay.dynamicStretch.playerPulseSpeedScale;
      player.stretchVy = 0;

      if (CONFIG.settings.enableScreenShake) {
        shakeRef.current = {
          intensity: CONFIG.gameplay.player.strongShotShake,
          endAt: now + CONFIG.gameplay.player.strongShotShakeMs,
        };
      }

      strongCooldownRef.current = Math.ceil(
        CONFIG.gameplay.shots.strong.cooldownMs / 1000,
      );
      setStrongCooldown(strongCooldownRef.current);
    }

    const cooldownTimer = window.setInterval(() => {
      const player = playerRef.current;
      const now = performance.now();

      const strongRemainingMs = Math.max(0, player.strongReadyAt - now);
      const restante = Math.ceil(strongRemainingMs / 1000);

      strongCooldownRef.current = restante;
      setStrongCooldown(restante);

      const strongRatio = clamp(
        1 - strongRemainingMs / CONFIG.gameplay.shots.strong.cooldownMs,
        0,
        1,
      );
      setStrongReadyRatio(strongRatio);

      const dodgeRatio = clamp(
        (now - lastDodgeAtRef.current) / CONFIG.gameplay.dodge.cooldownMs,
        0,
        1,
      );
      setDodgeReadyRatio(dodgeRatio);

      const boostReadyNow =
        boostChargeRef.current >= CONFIG.gameplay.boost.maxCharge;
      const dodgeReadyNow = dodgeRatio >= 1;
      const strongReadyNow = strongRatio >= 1;

      if (gameStateRef.current === "playing") {
        if (boostReadyNow && !abilityReadyRef.current.boost)
          tocarSomHabilidadePronta("boost");
        if (dodgeReadyNow && !abilityReadyRef.current.dodge)
          tocarSomHabilidadePronta("dodge");
        if (strongReadyNow && !abilityReadyRef.current.strong)
          tocarSomHabilidadePronta("strong");
      }

      abilityReadyRef.current.boost = boostReadyNow;
      abilityReadyRef.current.dodge = dodgeReadyNow;
      abilityReadyRef.current.strong = strongReadyNow;
    }, 120);

    function desenharFundo(
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
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
      const isDodging = now < player.dodgeUntil;
      const dodgeAsset = assetsRef.current.get("playerDodge");

      // Modelo novo sem spritesheet:
      // ship-idle.png = parado
      // ship-move-1.png até ship-move-4.png = fogo/movimento
      const playerSpeed = Math.hypot(player.vx, player.vy);
      const boosting = now < player.boostUntil;
      const shouldUseMoveFrames =
        playerSpeed > CONFIG.gameplay.player.animationMoveThreshold || boosting;

      anim.update(delta);

      const movingFrameAsset = shouldUseMoveFrames
        ? assetsRef.current.getFrame("player", anim.frame)
        : null;

      const playerIdleAsset = assetsRef.current.get("player");
      const playerAsset =
        isDodging && dodgeAsset
          ? dodgeAsset
          : (movingFrameAsset ?? playerIdleAsset);
      const playerConfig =
        isDodging && dodgeAsset ? ASSETS.playerDodge : ASSETS.player;

      ctx.save();
      ctx.translate(player.x + player.w / 2, player.y + player.h / 2);

      if (gameStateRef.current === "gameOverCutscene") {
        const elapsed = performance.now() - gameOverStartedAtRef.current;
        const intensity = clamp(elapsed / CONFIG.gameplay.gameOver.bigExplosionMs, 0, 1);
        const wobble = Math.sin(elapsed * 0.028) * 0.035 * (0.35 + intensity);
        const squeeze = Math.cos(elapsed * 0.021) * 0.025 * (0.35 + intensity);
        ctx.scale(1 + wobble, 1 - squeeze);
        ctx.rotate(Math.sin(elapsed * 0.018) * 0.035 * intensity);
      }

      if (boosting && CONFIG.settings.enableBoostFireSprite) {
        const boostFire = assetsRef.current.get("boostFire");
        const speed = Math.hypot(player.boostVx, player.boostVy);
        const dirX = speed > 0.001 ? player.boostVx / speed : 1;
        const dirY = speed > 0.001 ? player.boostVy / speed : 0;
        const angle = Math.atan2(dirY, dirX);
        const fw = CONFIG.gameplay.boost.fireSpriteWidth;
        const fh = CONFIG.gameplay.boost.fireSpriteHeight;
        const distance = CONFIG.gameplay.boost.fireSpriteDistance;

        ctx.save();
        ctx.translate(dirX * distance, dirY * distance);
        ctx.rotate(angle);
        ctx.globalAlpha = CONFIG.gameplay.boost.fireSpriteOpacity;

        if (boostFire) {
          ctx.drawImage(boostFire, -fw / 2, -fh / 2, fw, fh);
        } else {
          const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, fw * 0.45);
          gradient.addColorStop(0, "rgba(255, 244, 170, 0.95)");
          gradient.addColorStop(0.42, "rgba(255, 146, 25, 0.75)");
          gradient.addColorStop(1, "rgba(255, 80, 0, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(0, 0, fw * 0.42, fh * 0.32, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      const playerPulse = getStretchPulse(player.stretchUntil, "player");
      applyVelocityStretch(
        ctx,
        player.stretchVx,
        player.stretchVy,
        getStretchSettings("player").multiplier,
        playerPulse,
      );
      ctx.rotate((player.tilt * Math.PI) / 180);

      if (CONFIG.useSprites && playerAsset) {
        if (
          playerConfig.frames &&
          playerConfig.frames > 1 &&
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
            player.h,
          );
        } else {
          ctx.drawImage(
            playerAsset,
            -player.w / 2,
            -player.h / 2,
            player.w,
            player.h,
          );
        }
      } else {
        ctx.fillStyle = CONFIG.colors.player;
        ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);

        ctx.fillStyle = CONFIG.colors.playerDetail;
        ctx.fillRect(player.w * 0.12, -7, 14, 14);
      }

      if (isDodging && !dodgeAsset && Math.floor(now / 70) % 2 === 0) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
        ctx.restore();
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
        color,
        getStretchSettings("shot").multiplier,
        getStretchPulse(shot.stretchUntil, "shot"),
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
        fallbackColor,
        getStretchSettings("enemy").multiplier,
        getStretchPulse(enemy.stretchUntil, "enemy"),
      );

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(enemy.x, enemy.y - 10, enemy.w, 5);
      ctx.fillStyle = "#f8e7b0";
      ctx.fillRect(
        enemy.x,
        enemy.y - 10,
        enemy.w * (enemy.hp / enemy.maxHp),
        5,
      );
      ctx.restore();

      if (enemy.kind === "black" && enemy.age < enemy.windUpMs) {
        ctx.save();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.strokeRect(enemy.x - 8, enemy.y - 8, enemy.w + 16, enemy.h + 16);
        ctx.restore();
      }
    }

    function desenharEnemyProjectile(
      ctx: CanvasRenderingContext2D,
      bullet: EnemyProjectile,
    ) {
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
        CONFIG.colors.enemyBullet,
        getStretchSettings("shot").multiplier,
        getStretchPulse(bullet.stretchUntil, "shot"),
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
          particle.size,
        );
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    function desenharHUD(ctx: CanvasRenderingContext2D) {
      if (
        gameStateRef.current !== "playing" ||
        !CONFIG.settings.showGameplayHints
      ) {
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
        148,
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

            const previousY = updated.y;
            const startY = updated.redStartY ?? updated.y;
            const targetY = updated.redTargetY ?? updated.y;
            const travelTime = Math.max(
              400,
              updated.redTravelTimeMs ?? redCfg.verticalTravelMs,
            );
            const pingPong = (updated.age % (travelTime * 2)) / travelTime;
            const t = pingPong <= 1 ? pingPong : 2 - pingPong;
            const easedT = 0.5 - Math.cos(t * Math.PI) * 0.5;
            const waveOffset =
              Math.sin(
                updated.age * redCfg.waveFrequency + (updated.phase ?? 0),
              ) * redCfg.waveAmplitude;

            updated.y = startY + (targetY - startY) * easedT + waveOffset;
            updated.y = clamp(updated.y, 18, canvas.height - updated.h - 18);

            const oldVy = updated.vy;
            updated.vy = (updated.y - previousY) / Math.max(0.001, speedFactor);

            if (
              Math.abs(updated.vy) > 0.25 &&
              Math.abs(oldVy) > 0.25 &&
              Math.sign(updated.vy) !== Math.sign(oldVy)
            ) {
              updated.stretchUntil =
                performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs;
            }

            updated.shotCooldown -= delta;

            if (updated.shotCooldown <= 0) {
              updated.shotCooldown = redCfg.shootEveryMs;
              enemyProjectilesRef.current.push({
                id: enemyIdRef.current++,
                stretchUntil:
                  performance.now() +
                  CONFIG.gameplay.dynamicStretch.shotPulseMs,
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
              if (!updated.isDashing) {
                updated.stretchUntil =
                  performance.now() +
                  CONFIG.gameplay.dynamicStretch.enemyPulseMs;
              }

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
                (updated.rotation ?? 0) + (updated.rotationSpeed ?? 0) * delta;
            }
          }

          if (updated.kind === "fragment") {
            updated.x += updated.vx * speedFactor;
            updated.y += updated.vy * speedFactor;
            updated.vy += 0.015 * speedFactor;
            updated.rotation =
              (updated.rotation ?? 0) + (updated.rotationSpeed ?? 0) * delta;
          }

          return updated;
        })
        .filter(
          (enemy) =>
            enemy.x > -180 &&
            enemy.x < canvas.width + 220 &&
            enemy.y > -180 &&
            enemy.y < canvas.height + 180 &&
            enemy.hp > 0,
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
      const playerHitbox = getPlayerHitbox(player);
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
            tocarSom(CONFIG.sounds.enemyHit, 0.25, "hit");

            if (enemy.hp <= 0) {
              enemiesToRemove.add(enemy.id);
              registrarAbate(enemy.kind);

              if (enemy.kind === "asteroid") {
                spawnAsteroidFragments(enemy);
              } else {
                criarExplosao(
                  enemy.x + enemy.w / 2,
                  enemy.y + enemy.h / 2,
                  "#ffe18c",
                  16,
                );
                tocarSom(CONFIG.sounds.enemyDeath, 0.38, "hit");
              }
            }

            break;
          }
        }
      }

      const now = performance.now();
      const boosting = now < player.boostUntil;
      const intangible =
        now < player.invincibleUntil || now < player.dodgeUntil || boosting;

      if (boosting) {
        for (const enemy of enemiesRef.current) {
          if (enemiesToRemove.has(enemy.id)) continue;
          if (boostHitEnemiesRef.current.has(enemy.id)) continue;

          if (rectsCollide(playerHitbox, enemy)) {
            boostHitEnemiesRef.current.add(enemy.id);
            enemy.hp -= CONFIG.gameplay.boost.damage;
            criarExplosao(
              enemy.x + enemy.w / 2,
              enemy.y + enemy.h / 2,
              "#fb8500",
              14,
            );
            tocarSom(CONFIG.sounds.boostHit, 0.38, "hit");

            const dirX = player.boostVx || 1;
            const dirY = player.boostVy || 0;
            const len = Math.max(0.001, Math.hypot(dirX, dirY));

            if (enemy.hp <= 0) {
              enemiesToRemove.add(enemy.id);
              registrarAbate(enemy.kind);

              if (enemy.kind === "asteroid") {
                spawnAsteroidFragments(enemy);
              } else {
                tocarSom(CONFIG.sounds.enemyDeath, 0.38, "hit");
              }
            } else {
              // Se o boost não matar, empurra e NÃO aplica colisão normal depois.
              enemy.vx += (dirX / len) * CONFIG.gameplay.boost.knockback;
              enemy.vy += (dirY / len) * CONFIG.gameplay.boost.knockback;
              enemy.stretchUntil =
                performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs;
            }
          }
        }
      }

      // Durante invencibilidade/esquiva/boost, o jogador atravessa inimigos e tiros.
      // Isso corrige o bug de matar/tomar dano só por estar invencível.
      if (!intangible) {
        for (const enemy of enemiesRef.current) {
          if (enemiesToRemove.has(enemy.id)) continue;

          if (rectsCollide(playerHitbox, enemy)) {
            enemiesToRemove.add(enemy.id);

            if (enemy.kind === "asteroid") {
              receberDano(0, true);
              spawnAsteroidFragments(enemy);
            } else {
              criarParticulasHit(
                player.x + player.w / 2,
                player.y + player.h / 2,
                "#ff6b6b",
                10,
              );
              receberDano(1);
            }
          }
        }

        for (const bullet of enemyProjectilesRef.current) {
          if (rectsCollide(playerHitbox, bullet)) {
            projectilesToRemove.add(bullet.id);
            criarParticulasHit(
              bullet.x + bullet.w / 2,
              bullet.y + bullet.h / 2,
              "#ff6b6b",
              8,
            );
            receberDano(bullet.damage);
          }
        }
      }

      if (shotsToRemove.size > 0) {
        shotsRef.current = shotsRef.current.filter(
          (shot) => !shotsToRemove.has(shot.id),
        );
      }

      if (enemiesToRemove.size > 0) {
        enemiesRef.current = enemiesRef.current.filter(
          (enemy) => !enemiesToRemove.has(enemy.id),
        );
      }

      if (projectilesToRemove.size > 0) {
        enemyProjectilesRef.current = enemyProjectilesRef.current.filter(
          (bullet) => !projectilesToRemove.has(bullet.id),
        );
      }
    }

    function atualizar(delta: number, canvas: HTMLCanvasElement) {
      if (gameStateRef.current !== "playing") {
        return;
      }

      const player = playerRef.current;
      const speedFactor = delta / 16.67;

      const keyboardX =
        (keysRef.current["arrowright"] || keysRef.current["d"] ? 1 : 0) -
        (keysRef.current["arrowleft"] || keysRef.current["a"] ? 1 : 0);

      const keyboardY =
        (keysRef.current["arrowdown"] || keysRef.current["s"] ? 1 : 0) -
        (keysRef.current["arrowup"] || keysRef.current["w"] ? 1 : 0);

      const inputX = clamp(keyboardX + mobileMoveRef.current.x, -1, 1);
      const inputY = clamp(keyboardY + mobileMoveRef.current.y, -1, 1);

      if (keysRef.current["shift"]) {
        keysRef.current["shift"] = false;
        executarBoost();
      }

      if (keysRef.current["control"] || keysRef.current["ctrl"]) {
        keysRef.current["control"] = false;
        keysRef.current["ctrl"] = false;
        executarEsquiva();
      }

      const movingNow = inputX !== 0 || inputY !== 0;
      const previousVx = player.vx;
      const previousVy = player.vy;

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

      player.vx = clamp(
        player.vx,
        -CONFIG.gameplay.player.maxSpeedX,
        CONFIG.gameplay.player.maxSpeedX,
      );
      player.vy = clamp(
        player.vy,
        -CONFIG.gameplay.player.maxSpeedY,
        CONFIG.gameplay.player.maxSpeedY,
      );

      if (Math.abs(player.vx) < 0.02) player.vx = 0;
      if (Math.abs(player.vy) < 0.02) player.vy = 0;

      const previousSpeed = Math.hypot(previousVx, previousVy);
      const currentSpeed = Math.hypot(player.vx, player.vy);
      const wasReallyMoving =
        previousSpeed > CONFIG.gameplay.dynamicStretch.playerTriggerSpeed;
      const isReallyMoving =
        currentSpeed > CONFIG.gameplay.dynamicStretch.playerTriggerSpeed;

      if (!wasReallyMoving && isReallyMoving) {
        triggerPlayerStretch(player.vx, player.vy);
      } else if (wasReallyMoving && isReallyMoving) {
        const previousAngle = Math.atan2(previousVy, previousVx);
        const currentAngle = Math.atan2(player.vy, player.vx);
        const angleDiff = Math.abs(
          Math.atan2(
            Math.sin(currentAngle - previousAngle),
            Math.cos(currentAngle - previousAngle),
          ),
        );

        if (
          angleDiff >=
          (CONFIG.gameplay.dynamicStretch.playerTriggerAngleDeg * Math.PI) / 180
        ) {
          triggerPlayerStretch(player.vx, player.vy);
        }
      }

      player.wasMoving = isReallyMoving;
      player.lastInputX = movingNow ? inputX : 0;
      player.lastInputY = movingNow ? inputY : 0;

      if (performance.now() < player.boostUntil) {
        player.vx = player.boostVx;
        player.vy = player.boostVy;
        criarParticulasBoost(player, 3);
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

      atualizarWavesInfinitas();
      atualizarInimigos(delta, canvas);
      resolverColisoes();
      atualizarParticulas(delta);
      setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
    }

    function atualizarGameOverCutscene() {
      if (gameStateRef.current !== "gameOverCutscene") {
        return;
      }

      const now = performance.now();
      const elapsed = now - gameOverStartedAtRef.current;
      const player = playerRef.current;
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      const cfg = CONFIG.gameplay.gameOver;

      if (elapsed < cfg.slowExplosionMs) {
        if (now - gameOverLastBurstAtRef.current > cfg.smallBurstEveryMs) {
          gameOverLastBurstAtRef.current = now;
          criarParticulasHit(
            cx + rand(-player.w * 0.4, player.w * 0.4),
            cy + rand(-player.h * 0.4, player.h * 0.4),
            corParticulaQuente(),
            12,
          );
          tocarSom(CONFIG.sounds.enemyHit, 0.16, "hit");
        }
        return;
      }

      if (elapsed < cfg.slowExplosionMs + cfg.bigExplosionMs) {
        if (now - gameOverLastBurstAtRef.current > cfg.bigBurstEveryMs) {
          gameOverLastBurstAtRef.current = now;
          criarExplosao(
            cx + rand(-player.w * 0.62, player.w * 0.62),
            cy + rand(-player.h * 0.62, player.h * 0.62),
            corParticulaQuente(),
            cfg.fireParticleAmount,
          );
          tocarSom(CONFIG.sounds.explosion || CONFIG.sounds.enemyDeath, 0.25, "hit");
        }
        return;
      }

      if (elapsed >= cfg.slowExplosionMs + cfg.bigExplosionMs && !gameOverFlash) {
        criarExplosao(cx, cy, "#fff1a8", cfg.finalFlashParticleAmount);
        setGameOverFlash(true);
      }

      if (elapsed >= cfg.menuDelayMs) {
        setEstado("gameOver");
      }
    }

    function loop(time: number) {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      atualizar(delta, renderCanvas);
      atualizarGameOverCutscene();

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
      for (const bullet of enemyProjectilesRef.current)
        desenharEnemyProjectile(renderCtx, bullet);
      desenharParticulas(renderCtx);

      if (
        gameStateRef.current === "playing" ||
        gameStateRef.current === "paused" ||
        gameStateRef.current === "gameOverCutscene"
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
        [
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
          " ",
          "shift",
          "control",
        ].includes(key)
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
          tocarSom(CONFIG.sounds.menuMove, 0.32, "menu");
          setIndiceMenu(
            (menuIndexRef.current - 1 + MAIN_MENU_OPTIONS.length) %
              MAIN_MENU_OPTIONS.length,
          );
          return;
        }

        if (key === "arrowdown" || key === "s") {
          tocarSom(CONFIG.sounds.menuMove, 0.32, "menu");
          setIndiceMenu((menuIndexRef.current + 1) % MAIN_MENU_OPTIONS.length);
          return;
        }

        if (key === "enter" || key === " ") {
          confirmarOpcaoMenuAtual();
          return;
        }
      }

      if (gameStateRef.current === "settings") {
        if (key === "escape" || key === "q") {
          voltarDasConfiguracoes();
          return;
        }

        if (key === "arrowup" || key === "w") {
          tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
          setIndiceConfiguracao(settingsIndexRef.current - 1);
          return;
        }

        if (key === "arrowdown" || key === "s") {
          tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
          setIndiceConfiguracao(settingsIndexRef.current + 1);
          return;
        }

        if (key === "arrowleft" || key === "a") {
          alterarConfiguracaoAtual(-1);
          return;
        }

        if (key === "arrowright" || key === "d") {
          alterarConfiguracaoAtual(1);
          return;
        }

        if (key === "enter" || key === " ") {
          alterarConfiguracaoAtual(1);
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

      if (gameStateRef.current === "playing") {
        if (key === "8") spawnEnemy("red");
        if (key === "9") spawnEnemy("black");
        if (key === "0") spawnEnemy("purple");
        if (key === "-") spawnEnemy("asteroid");
      }

      if (gameStateRef.current === "gameOver") {
        if (key === "enter" || key === " ") {
          iniciarJogo(currentModeRef.current ?? "infinite");
          return;
        }

        if (key === "escape" || key === "q") {
          voltarAoMenuPrincipal();
          return;
        }
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
      className={`game-fullscreen-page ${CONFIG.settings.enableFlashingLights ? "" : "no-flashing"}`}
      style={gameStyle}
      onContextMenu={(event) => event.preventDefault()}
    >
      <canvas ref={canvasRef} className="game-fullscreen-canvas" />

      <div
        className={`game-title-bg-transition ${titleLeaving ? "show" : ""}`}
      />
      <div className={`game-screen-fade ${screenFade ? "show" : ""}`} />

      <div className="game-rotate-device-warning">
        <div>
          <strong>Vire o celular</strong>
          <span>Use o modo horizontal para jogar Space News.</span>
        </div>
      </div>

      {isLowHp && gameState === "playing" && (
        <div className="game-low-hp-vignette" />
      )}

      {(gameState === "playing" || gameState === "paused") && (
        <div className="game-life-hud">
          {lifeSlots.map((_, index) => (
            <img
              key={index}
              src={
                index < playerHp
                  ? CONFIG.uiImages.lifeFull
                  : CONFIG.uiImages.lifeEmpty
              }
              alt={index < playerHp ? "vida" : "vida perdida"}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
              onError={(event) => {
                const img = event.currentTarget;
                const fallback =
                  index < playerHp
                    ? CONFIG.uiImages.lifeFullFallback
                    : CONFIG.uiImages.lifeEmptyFallback;

                if (img.src.endsWith(fallback)) return;
                img.src = fallback;
              }}
            />
          ))}
        </div>
      )}

      {(gameState === "playing" || gameState === "paused") &&
        waveUi.mode === "infinite" && (
          <div className="game-wave-hud">
            <strong>WAVE {waveUi.wave || 1}</strong>
            <span>
              {waveUi.bossWave
                ? "BOSS"
                : waveUi.active
                  ? "EM ANDAMENTO"
                  : "PREPARANDO"}
            </span>
          </div>
        )}

      {(gameState === "playing" || gameState === "paused") &&
        waveUi.mode === "infinite" && (
          <div className="game-score-hud">
            <strong>SCORE</strong>
            <span>{score.toString().padStart(6, "0")}</span>
          </div>
        )}

      {(gameState === "playing" || gameState === "paused") && (
        <div className="game-ability-hud">
          <div
            className={`game-ability-meter dodge ${dodgeReadyRatio >= 1 ? "ready" : ""}`}
          >
            <div className="game-ability-fill">
              <span
                style={{ height: `${clamp(dodgeReadyRatio * 100, 0, 100)}%` }}
              />
              <strong>{dodgeReadyRatio >= 1 ? "READY!" : "DODGE"}</strong>
            </div>
          </div>

          <div
            className={`game-ability-meter strong ${strongReadyRatio >= 1 ? "ready" : ""}`}
          >
            <div className="game-ability-fill">
              <span
                style={{ height: `${clamp(strongReadyRatio * 100, 0, 100)}%` }}
              />
              <strong>{strongReadyRatio >= 1 ? "READY!" : "FORTE"}</strong>
            </div>
          </div>

          <div
            className={`game-ability-meter boost ${boostCharge >= CONFIG.gameplay.boost.maxCharge ? "ready" : ""}`}
          >
            <div className="game-ability-fill">
              <span
                style={{
                  height: `${clamp((boostCharge / CONFIG.gameplay.boost.maxCharge) * 100, 0, 100)}%`,
                }}
              />
              <strong>
                {boostCharge >= CONFIG.gameplay.boost.maxCharge
                  ? "READY!"
                  : "BOOST"}
              </strong>
            </div>
          </div>
        </div>
      )}

      {waveUi.message &&
        (gameState === "playing" || gameState === "paused") && (
          <div className={`game-wave-banner ${waveUi.bossWave ? "boss" : ""}`}>
            {waveUi.message}
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
            {CONFIG.settings.showMobileStartHint && (
              <span className="game-mobile-start-hint">
                toque em qualquer lugar...
              </span>
            )}
          </div>
        </section>
      )}

      {gameState === "mainMenu" && (
        <section className="game-screen game-main-menu-screen">
          <aside
            className={`game-retro-panel ${menuOpen ? "is-open" : "is-closed"}`}
          >
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
                      if (menuIndex !== index)
                        tocarSom(CONFIG.sounds.menuMove, 0.24, "menu");
                      setIndiceMenu(index);
                    }}
                    onFocus={() => setIndiceMenu(index)}
                    onClick={() => {
                      if (option.disabled) {
                        tocarSom(CONFIG.sounds.menuBack, 0.3, "menu");
                        return;
                      }

                      if (option.action === "settings") {
                        abrirConfiguracoes();
                        return;
                      }

                      if (option.mode) {
                        escolherModo(option.mode);
                      }
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

      {gameState === "settings" && (
        <section className="game-screen game-settings-screen">
          <aside className="game-settings-panel">
            <div className="game-settings-header">
              <p className="game-panel-label">CONFIGURAÇÕES</p>
              <span>ESC/Q: voltar • ↑↓ escolher • ←→ alterar</span>
            </div>

            <div className="game-settings-list">
              {SETTINGS_SECTIONS.map((section) => {
                const sectionOptions = SETTINGS_OPTIONS.map(
                  (option, index) => ({ option, index }),
                ).filter((entry) => entry.option.category === section);

                return (
                  <div className="game-settings-category" key={section}>
                    <h3>{section}</h3>

                    <div className="game-settings-category-list">
                      {sectionOptions.map(({ option, index }) => {
                        const selected = settingsIndex === index;
                        const value = settingsSnapshot[option.key];
                        const ratio =
                          option.kind === "range"
                            ? clamp(
                                (Number(value) - (option.min ?? 0)) /
                                  ((option.max ?? 1) - (option.min ?? 0)),
                                0,
                                1,
                              )
                            : typeof value === "boolean" && value
                              ? 1
                              : 0;

                        return (
                          <button
                            key={option.key}
                            type="button"
                            className={`game-setting-row ${selected ? "is-selected" : ""}`}
                            onMouseEnter={() => {
                              if (settingsIndex !== index) {
                                tocarSom(CONFIG.sounds.menuMove, 0.22, "menu");
                              }
                              setIndiceConfiguracao(index);
                            }}
                            onClick={() => alterarConfiguracaoAtual(1)}
                          >
                            <span className="game-setting-label">
                              {option.label}
                            </span>
                            <span className="game-setting-control">
                              <span className="game-setting-bar">
                                <span style={{ width: `${ratio * 100}%` }} />
                              </span>
                              <strong>{formatarConfiguracao(option)}</strong>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
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
                onClick={() => iniciarJogo(currentModeRef.current ?? "story")}
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
            <p>Teste: 8 vermelho • 9 preto • 0 roxo • - asteroide</p>

            <button
              onClick={() => iniciarJogo(currentModeRef.current ?? "story")}
            >
              COMEÇAR MISSÃO
            </button>
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

      {gameState === "gameOverCutscene" && (
        <div
          className={`game-over-white-flash ${gameOverFlash ? "show" : ""}`}
          style={{
            "--game-over-flash-x": gameOverFlashOrigin.x,
            "--game-over-flash-y": gameOverFlashOrigin.y,
          } as CSSProperties}
        />
      )}

      {gameState === "gameOver" && (
        <section className="game-screen game-over-screen">
          <div className="game-over-card">
            <p>MISSÃO FALHOU</p>
            <h1>GAME OVER</h1>
            <button onClick={() => iniciarJogo(currentModeRef.current ?? "infinite")}>
              TENTAR NOVAMENTE
            </button>
            <button onClick={voltarAoMenuPrincipal}>VOLTAR AO MENU</button>
          </div>
        </section>
      )}

      {gameState === "playing" && (
        <div
          className="game-mobile-top-actions"
          onContextMenu={(event) => event.preventDefault()}
        >
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              solicitarFullscreen();
            }}
            aria-label="fullscreen"
          >
            <img
              draggable={false}
              src={CONFIG.uiImages.mobileFullscreen}
              alt="fullscreen"
            />
          </button>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              pausarOuVoltar();
            }}
            aria-label="pause"
          >
            <img
              draggable={false}
              src={CONFIG.uiImages.mobilePause}
              alt="pause"
            />
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <div
          className="game-mobile-controls"
          onContextMenu={(event) => event.preventDefault()}
        >
          <div
            className="game-mobile-joystick"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              atualizarJoystick(event);
            }}
            onPointerMove={(event) => {
              event.preventDefault();
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                atualizarJoystick(event);
              }
            }}
            onPointerUp={(event) => {
              event.currentTarget.releasePointerCapture(event.pointerId);
              resetarJoystick();
            }}
            onPointerCancel={resetarJoystick}
            onPointerLeave={resetarJoystick}
          >
            <div
              className="game-mobile-joystick-knob"
              style={{
                transform: `translate(calc(-50% + ${mobileStick.x}px), calc(-50% + ${mobileStick.y}px))`,
              }}
            />
          </div>

          <div className="game-mobile-actions">
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                executarEsquiva();
              }}
              aria-label="esquiva"
            >
              <img
                draggable={false}
                src={CONFIG.uiImages.mobileDodge}
                alt="esquiva"
              />
            </button>

            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                executarBoost();
              }}
              disabled={boostCharge < CONFIG.gameplay.boost.maxCharge}
              aria-label="boost"
            >
              <img
                draggable={false}
                src={CONFIG.uiImages.mobileBoost}
                alt="boost"
              />
            </button>

            <button
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                mobileShootRef.current = true;
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                mobileShootRef.current = false;
              }}
              onPointerLeave={() => (mobileShootRef.current = false)}
              onPointerCancel={() => (mobileShootRef.current = false)}
            >
              <img
                draggable={false}
                src={CONFIG.uiImages.mobileShot}
                alt="tiro"
              />
            </button>

            <button
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                tiroForteMobile();
              }}
              disabled={strongCooldown > 0}
            >
              {strongCooldown > 0 ? (
                <span>{strongCooldown}s</span>
              ) : (
                <img
                  draggable={false}
                  src={CONFIG.uiImages.mobileStrong}
                  alt="tiro forte"
                />
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
