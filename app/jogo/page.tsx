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
  | "gameOver"
  | "victory";

type GameMode = "story" | "infinite";

type TutorialStep = "move" | "shot" | "strong" | "boost" | "dodge" | "done";

type DanielExpression = "normal" | "alert" | "happy" | "fear" | "serious";

type SpriteKey =
  | "player"
  | "playerDodge"
  | "boostFire"
  | "powerRegen"
  | "powerFireRate"
  | "powerTripleRegen"
  | "powerShield"
  | "powerPowerShot"
  | "powerHomingShot"
  | "powerFlames"
  | "powerGoldenHeart"
  | "powerRandomBox"
  | "powerBadFlashbang"
  | "powerBadDamage"
  | "powerBadInvert"
  | "powerBadSlow"
  | "powerHomingProjectile"
  | "powerShot"
  | "homingShot"
  | "normalShot"
  | "strongShot"
  | "background"
  | "menuBackground"
  | "titleBackground"
  | "portal"
  | "chocado"
  | "bossServo"
  | "enemyRed"
  | "enemyBlack"
  | "enemyBlackWindup"
  | "enemyPurple"
  | "enemyAlien"
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
  variant?: "normal" | "power" | "homing" | "powerHoming";
  vx?: number;
  vy?: number;
};

type EnemyKind = "red" | "black" | "purple" | "alien" | "asteroid" | "fragment";

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
  redDirection?: number;
  redBurstShotsLeft?: number;
  redBurstTimer?: number;
  redBurstZone?: "start" | "target" | "middle";
  redPauseTimer?: number;
  redHoldY?: number;
  alienFleeing?: boolean;
  alienTrailTimer?: number;
  alienBeamWidth?: number;
  alienBeamHeight?: number;
  tilt?: number;
  knockedBack?: boolean;
  knockedAt?: number;

  // Flags usadas apenas no tutorial roteirizado.
  // Elas impedem que dano/knockback contem como sucesso errado.
  tutorialStep?: TutorialStep;
  removedByStrong?: boolean;
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

type PowerUpKind =
  | "regen"
  | "tripleRegen"
  | "fireRate"
  | "shield"
  | "powerShot"
  | "homingShot"
  | "flames"
  | "goldenHeart"
  | "randomBox";

type PowerUp = {
  id: number;
  kind: PowerUpKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  wavePhase: number;
  bornAt: number;
};

type StatusEffectKind = PowerUpKind | "badFlashbang" | "badInvert" | "badSlow";

type ActivePowerUpUi = {
  kind: StatusEffectKind;
  label: string;
  icon: string;
  remainingMs?: number;
};

type Shockwave = {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
};

type BossProjectileKind = "servo" | "servoWave" | "laser" | "aimLaser" | "orb";

type BossProjectile = {
  id: number;
  kind: BossProjectileKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  maxLife: number;
  angle?: number;
  activeAt?: number;
  homingUntil?: number;
  speed?: number;
  startY?: number;
  targetY?: number;
  travelMs?: number;
  phase?: number;
  locked?: boolean;
  aimX?: number;
  aimY?: number;
  returnAt?: number;
  returning?: boolean;
};

type BossState = {
  active: boolean;
  intro: boolean;
  defeated: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  age: number;
  introStartedAt: number;
  battleStartedAt: number;
  nextAttackAt: number;
  attackIndex: number;
  roarDone: boolean;
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
  goldenHp: number;
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
  capturedUntil: number;
  throwUntil: number;
  capturedEnemyId: number | null;
  throwVx: number;
  throwVy: number;
  wallImpactArmed: boolean;
  alienCaptureCooldownUntil: number;
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

  powerRegen: { src: "/game/powerups/regen.png" },
  powerFireRate: { src: "/game/powerups/fire-rate.png" },
  powerTripleRegen: { src: "/game/powerups/triple-regen.png" },
  powerShield: { src: "/game/powerups/shield.png" },
  powerPowerShot: { src: "/game/powerups/power-shot.png" },
  powerHomingShot: { src: "/game/powerups/homing-shot.png" },
  powerFlames: { src: "/game/ui/flames.png" },
  powerGoldenHeart: { src: "/game/powerups/golden-heart.png" },
  powerRandomBox: { src: "/game/powerups/random-box.png" },
  powerBadFlashbang: { src: "/game/powerups/bad-flashbang.png" },
  powerBadDamage: { src: "/game/powerups/bad-damage.png" },
  powerBadInvert: { src: "/game/powerups/bad-invert.png" },
  powerBadSlow: { src: "/game/powerups/bad-slow.png" },

  powerShot: { src: "/game/shots/power-shot.png" },
  homingShot: { src: "/game/shots/homing-shot.png" },
  powerHomingProjectile: { src: "/game/shots/power-homing-shot.png" },
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
    // Boss em sprites separados, não spritesheet.
    // Coloque estes arquivos em public/game/bosses/.
    src: "/game/bosses/chocado-1.png",
    frameSrcs: [
      "/game/bosses/chocado-1.png",
      "/game/bosses/chocado-2.png",
      "/game/bosses/chocado-3.png",
      "/game/bosses/chocado-4.png",
      "/game/bosses/chocado-5.png",
      "/game/bosses/chocado-6.png",
    ],
    frames: 6,
    fps: 7,
  },

  bossServo: {
    src: "/game/bosses/chocado-servo.png",
    frameWidth: 48,
    frameHeight: 48,
    frames: 1,
    fps: 8,
  },

  enemyRed: {
    // Inimigo vermelho sem spritesheet: 1 idle + 4 frames separados.
    src: "/game/enemies/red-idle.png",
    frameSrcs: [
      "/game/enemies/red-move-1.png",
      "/game/enemies/red-move-2.png",
      "/game/enemies/red-move-3.png",
      "/game/enemies/red-move-4.png",
    ],
    frames: 4,
    fps: 8,
  },

  enemyBlack: {
    // Inimigo preto em resolução visual 256x129, com animação de movimento por arquivos separados.
    src: "/game/enemies/black-idle.png",
    frameSrcs: [
      "/game/enemies/black-move-1.png",
      "/game/enemies/black-move-2.png",
      "/game/enemies/black-move-3.png",
      "/game/enemies/black-move-4.png",
    ],
    frames: 4,
    fps: 10,
  },

  enemyBlackWindup: {
    // Dois frames separados para o windup/piscada antes do dash.
    src: "/game/enemies/black-windup-1.png",
    frameSrcs: [
      "/game/enemies/black-windup-1.png",
      "/game/enemies/black-windup-2.png",
    ],
    frames: 2,
    fps: 8,
  },

  enemyPurple: {
    // O roxo agora é sprite único, sem spritesheet.
    src: "/game/enemies/purple.png",
  },

  enemyAlien: {
    // Alien sem spritesheet: 4 imagens separadas. O sprite já inclui nave + feixe.
    src: "/game/enemies/alien-green-1.png",
    frameSrcs: [
      "/game/enemies/alien-green-1.png",
      "/game/enemies/alien-green-2.png",
      "/game/enemies/alien-green-3.png",
      "/game/enemies/alien-green-4.png",
    ],
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
      width: 170,
      height: 100,

      // Hitbox configurável da nave.
      // offsetX/offsetY centralizam a hitbox dentro do sprite visual.
      hitboxWidth: 148,
      hitboxHeight: 74,
      hitboxOffsetX: 11,
      hitboxOffsetY: 13,

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
      damageChargeGain: 0.2,
      damage: 3.5,
      hitBounceBack: 46,
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
      durationMs: 850,
      cooldownMs: 10000,
      speedImpulse: 4.5,
    },

    gameOver: {
      slowExplosionMs: 1250,
      bigExplosionMs: 1350,
      whiteFlashMs: 850,
      menuDelayMs: 3300,
      smallBurstEveryMs: 180,
      bigBurstEveryMs: 120,
      shakeIntensity: 9,
      shakeMs: 1800,
      fireParticleAmount: 12,
      finalFlashParticleAmount: 72,
      maxParticlesOnDeath: 95,
      explosionSound: "/sounds/game-over-explosion.mp3",
    },

    score: {
      red: 100,
      black: 220,
      purple: 120,
      alien: 260,
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
        width: 30,
        height: 30,
        speed: 8.2,
        damage: 1,
        // Velocidade de DISPARO: menor = atira mais rápido.
        cooldownFrames: 18,
      },

      strong: {
        width: 60,
        height: 60,
        speed: 12,
        damage: 5,
        cooldownMs: 8000,
        shockwaveRadius: 520,
        shockwaveKnockback: 14.5,
        shockwaveSpin: 0.024,
        shockwaveDamage: 2.2,
        shockwaveDamageScore: 42,
      },
    },

    powerups: {
      width: 66,
      height: 66,
      // Power-up flutua no mapa; não deve vir automaticamente para o player.
      speed: 3.15,
      bossSpeed: 4.35,
      waveAmplitude: 42,
      waveFrequency: 0.0072,
      lifeMs: 18500,
      trailAmount: 14,
      collectGlowMs: 720,

      // Power-ups aparecem no mapa; nada é entregue automaticamente.
      // Chances balanceadas: no Chocado são menores para não trivializar o boss.
      regenChanceOnKill: 0.026,
      regenChanceOnBossDamage: 0.010,
      tripleRegenChanceLowHp: 0.055,
      tripleRegenChanceOnBossDamage: 0.012,
      fireRateChanceOnKill: 0.038,
      fireRateChanceOnBossDamage: 0.015,
      shieldChanceOnKill: 0.026,
      shieldChanceOnBossDamage: 0.012,
      powerShotChanceOnKill: 0.032,
      powerShotChanceOnBossDamage: 0.014,
      homingShotChanceOnKill: 0.028,
      homingShotChanceOnBossDamage: 0.012,
      goldenHeartChanceOnKill: 0.0007,
      goldenHeartChanceOnBossDamage: 0.0005,
      randomBoxChanceOnKill: 0.022,
      randomBoxChanceOnBossDamage: 0.010,
      goldenHeartMax: 2,
      randomBadChance: 0.38,
      randomComboChance: 0.16,
      flashbangVoiceDelayMs: 1000,
      flashbangWhiteMs: 3800,
      flashbangBlurMs: 8200,
      invertScreenMs: 5500,
      randomBadSlowMs: 6500,
      randomBadSlowMultiplier: 0.48,

      flamesChanceOnKill: 0.025,
      flamesChanceOnBossDamage: 0.011,
      flamesDurationMs: 15000,
      flamesRange: 350,
      flamesHomingRange: 420,
      flamesConeWidth: 74,
      flamesDamagePerSecond: 9,
      flamesParticleAmount: 28,

      fireRateDurationMs: 10000,
      powerShotDurationMs: 10000,
      homingShotDurationMs: 10000,
      powerShotDamageMultiplier: 3,
      powerShotWidth: 48,
      powerShotHeight: 48,
      powerShotCooldownMultiplier: 1.28,
      homingTurnRate: 0.11,
      fireRateCooldownMultiplier: 0.48,
      bossDamageSpawnCooldownMs: 2400,
    },

    infiniteWaves: {
      enabled: true,
      firstWaveDelayMs: 900,
      nextWaveDelayMs: 1800,
      spawnIntervalMs: 1080,
      baseGroups: 2,
      groupsPerWave: 0.18,
      maxGroups: 10,
      purpleFromWave: 1,
      blackFromWave: 4,
      asteroidFromWave: 3,
      alienFromWave: 6,
      asteroidEvery: 3,
      bossEvery: 50,
      difficultyPerWave: 0.032,
      maxDifficulty: 2.55,
      messageMs: 1500,
    },

    storyWaves: {
      enabled: true,
      normalWaves: 15,
      bossWave: 16,
      firstWaveDelayMs: 1000,
      nextWaveDelayMs: 2100,
      // História deve ser mais longa que o infinito, mas sem lotar a tela.
      // Mais grupos + intervalo maior = wave dura mais sem virar bagunça.
      spawnIntervalMs: 1260,
      baseGroups: 4,
      groupsPerWave: 0.48,
      maxGroups: 14,
      blackFromWave: 4,
      asteroidFromWave: 5,
      alienFromWave: 8,
      difficultyPerWave: 0.024,
      maxDifficulty: 1.58,
      messageMs: 1800,
      finalVictoryDelayMs: 2100,
    },

    boss: {
      chocado: {
        width: 360,
        height: 650,
        hp: 500,
        introBarMs: 1800,
        introRoarMs: 900,
        floatAmplitude: 16,
        floatSpeed: 0.0022,
        attackDelayMs: 1200,
        servoCountMin: 8,
        servoCountMax: 14,
        servoSpeed: 3.95,
        servoHomingMs: 3600,
        servoBulletLifeMs: 18000,
        servoReturnAtMs: 12500,
        servoReturnDamage: 10,
        servoDamage: 1,
        servoWaveCountMin: 28,
        servoWaveCountMax: 42,
        servoWaveSpeed: 3.95,
        servoWaveSize: 20,
        servoWaveTravelMs: 1900,
        servoWaveLifeMs: 7600,
        laserTelegraphMs: 850,
        laserActiveMs: 1450,
        laserDamage: 1,
        laserThicknessX: 100,
        laserThicknessTriple: 82,
        laserShake: 3.8,
        aimLaserWindupMs: 1850,
        aimLaserLockBeforeMs: 430,
        aimLaserActiveMs: 1850,
        aimLaserThickness: 116,
        aimLaserLength: 1800,
        aimLaserFollow: 0.115,
        aimLaserShake: 6.5,

        // Ajuste fino dos pontos de origem dos ataques do Chocado.
        // Use estes offsets quando trocar/ajustar os sprites dele.
        // Valores positivos: direita/baixo. Valores negativos: esquerda/cima.
        attackOffsets: {
          servoPair: {
            x: 52,
            topY: 70,
            bottomY: -110,
            spacing: 42,
          },
          laserX: {
            x: 0,
            y: 0,
          },
          tripleLaser: {
            x: 0,
            y: 0,
            lanesY: [126, 360, 594],
          },
          cannon: {
            x: 30,
            topY: 115,
            middleY: 0,
            bottomY: -135,
          },
          servoWave: {
            x: 38,
            topY: 66,
            bottomY: -96,
            topTargetY: -28,
            bottomTargetY: 28,
          },
          aimLaser: {
            x: 28,
            y: 0,
          },
        },

        cannonOrbSpeed: 5.2,
        cannonOrbDamage: 1,
        enragedHp: 200,
        enragedAttackRate: 0.68,
      },
    },

    enemies: {
      red: {
        width: 160,
        height: 100,
        hp: 3,
        speed: 2.3,
        waveAmplitude: 1,
        waveFrequency: 0.0032,
        shootEveryMs: 980,
        bulletSpeed: 7.8,
        edgePadding: 4,
        verticalTravelMs: 2600,
        pairGapX: 0,
        burstShots: 3,
        // Vermelho para nas pontas e atira espaçado, não tudo colado.
        endpointPauseMs: 200,
        burstGapMs: 55,
      },

      black: {
        // Tamanho visual final do inimigo preto dentro da escala do jogo.
        width: 130,
        height: 100,
        hp: 5,
        appearX: 1040,
        windUpMs: 820,
        dashSpeed: 10.5,
      },

      purple: {
        width: 100,
        height: 100,
        hp: 3,
        speed: 3.4,
      },

      alien: {
        // O sprite do alien já deve incluir o feixe de abdução.
        // Portanto o tamanho abaixo deve cobrir a nave + o feixe inteiro.
        width: 220,
        height: 120,
        hp: 6,
        speed: 2.15,
        captureMs: 850,
        throwDefaultMs: 1000,
        throwMinMs: 220,
        throwDamage: 1,
        throwImpactShake: 7,
        captureCooldownMs: 1800,
        escapeSpeedX: 7.2,
        escapeSpeedY: 4.8,
        escapeTrailAmount: 3,
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
    tutorialWarning: "/sounds/tutorial/tutorial-warning.mp3",

    abilityReady: "/sounds/ability-ready.mp3",
    powerUpPickup: "/sounds/powerup-pickup.mp3",
    powerUpSpawn: "/sounds/powerup-spawn.mp3",
    powerUpTrail: "/sounds/powerup-trail.mp3",
    flamesStart: "/sounds/flames-start.mp3",
    flamesLoop: "/sounds/flames-loop.mp3",
    flamesHit: "/sounds/flames-hit.mp3",
    goldenHeart: "/sounds/golden-heart.mp3",
    randomPowerUp: "/sounds/random-powerup.mp3",
    badPowerUp: "/sounds/bad-powerup.mp3",
    flashbangVoice: "/sounds/flashbang-voice.mp3",
    flashbang: "/sounds/flashbang.mp3",
    invertScreen: "/sounds/invert-screen.mp3",
    damagePowerDown: "/sounds/damage-powerdown.mp3",
    slowPowerDown: "/sounds/slow-powerdown.mp3",
    shieldBreak: "/sounds/shield-break.mp3",
    boostReady: "/sounds/boost-ready.mp3",
    dodgeReady: "/sounds/dodge-ready.mp3",
    strongReady: "/sounds/strong-ready.mp3",
    boostStart: "/sounds/boost-start.mp3",
    boostHit: "/sounds/boost-hit.mp3",
    dodge: "/sounds/dodge.mp3",

    normalShot: "/sounds/game-shot.mp3",
    strongShot: "/sounds/game-strong-shot.mp3",
    explosion: "/sounds/game-explosion.mp3",
    gameOverExplosion: "/sounds/game-over-explosion.mp3",
    enemyShot: "/sounds/enemy-shot.mp3",
    enemyHit: "/sounds/enemy-hit.mp3",
    enemyDeath: "/sounds/enemy-death.mp3",
    playerDamage: "/sounds/player-damage.mp3",
    lowHpAlarm: "/sounds/low-hp-alarm.mp3",
    asteroidBreak: "/sounds/asteroid-break.mp3",
    waveStart: "/sounds/wave-start.mp3",
    bossIntro: "/sounds/boss-intro.mp3",
    chocadoRoar: "/sounds/chocado-roar.mp3",
    chocadoServo: "/sounds/chocado-servo.mp3",
    chocadoLaser: "/sounds/chocado-laser.mp3",
    chocadoCannon: "/sounds/chocado-cannon.mp3",
    chocadoDefeat: "/sounds/chocado-defeat.mp3",
    chocadoMusic: "/sounds/chocado-music.mp3",
    gameOverFinalExplosion: "/sounds/game-over-final-explosion.mp3",
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
    powerRegen: "/game/powerups/regen.png",
    powerFireRate: "/game/powerups/fire-rate.png",
    powerTripleRegen: "/game/powerups/triple-regen.png",
    powerShield: "/game/powerups/shield.png",
    powerPowerShot: "/game/powerups/power-shot.png",
    powerHomingShot: "/game/powerups/homing-shot.png",
    powerFlames: "/game/ui/flames.png",
    danielNormalClosed: "/game/ui/daniel/normal-closed.png",
    danielNormalTalk: "/game/ui/daniel/normal-talk.png",
    danielAlertClosed: "/game/ui/daniel/alert-closed.png",
    danielAlertTalk: "/game/ui/daniel/alert-talk.png",
    danielHappyClosed: "/game/ui/daniel/happy-closed.png",
    danielHappyTalk: "/game/ui/daniel/happy-talk.png",
    danielFearClosed: "/game/ui/daniel/fear-closed.png",
    danielFearTalk: "/game/ui/daniel/fear-talk.png",
    danielSeriousClosed: "/game/ui/daniel/serious-closed.png",
    danielSeriousTalk: "/game/ui/daniel/serious-talk.png",
    powerGoldenHeart: "/game/powerups/golden-heart.png",
    powerRandomBox: "/game/powerups/random-box.png",
    powerBadFlashbang: "/game/powerups/bad-flashbang.png",
    powerBadDamage: "/game/powerups/bad-damage.png",
    powerBadInvert: "/game/powerups/bad-invert.png",
    powerBadSlow: "/game/powerups/bad-slow.png",
    heartGolden: "/game/ui/heart-golden.png",
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
    text: "Cleber era estudante da Escola I. Ele vivia pesquisando, comparando fontes e tentando descobrir a verdade por trás das notícias.",
  },
  {
    title: "Quadro 2",
    text: "Ao lado dele estava Daniel, seu melhor amigo e gênio da tecnologia. Daniel criou o sistema de comunicação da Space News para guiar Cleber em tempo real.",
  },
  {
    title: "Quadro 3",
    text: "Em uma noite estranha, os sinais da cidade começaram a falhar. Portais surgiram no céu e a Terra entrou em alerta.",
  },
  {
    title: "Quadro 4",
    text: "O exército de Chocado começou a invadir tudo com robôs da desinformação, espalhando mentiras em velocidade absurda.",
  },
  {
    title: "Quadro 5",
    text: "Daniel assumiu a comunicação da missão: 'Cleber, eu vou te guiar daqui. Fica vivo e confia nos meus alertas!'",
  },
  {
    title: "Quadro 6",
    text: "Cleber entrou na nave Space News. Daniel abriu o canal de suporte, e a missão para salvar a Terra finalmente começou.",
  },
];

const GAME_OVER_TAUNTS = [
  "VOCE QUASE CONVENCEU OS ROBOS... QUASE.",
  "A FAKE NEWS VENCEU ESSA RODADA.",
  "CHOCADO PRINTOU ESSA JOGADA.",
  "DICA: DESVIAR TAMBEM CONTA COMO ESTRATEGIA.",
  "CLEBER VAI PRECISAR DE UM CAFE DEPOIS DESSA.",
  "ESSA NAVE NAO PASSOU NA VISTORIA.",
  "O EXERCITO DA DESINFORMACAO AGRADECE SUA COLABORACAO INVOLUNTARIA.",
  "VOCE FOI REFUTADO EM ALTA VELOCIDADE.",
  "A TERRA PEDIU REEMBOLSO.",
  "FOI UMA TENTATIVA. UMA TENTATIVA BEM EXPLOSIVA.",
  "NA PROXIMA, TENTE NAO VIRAR ESTATISTICA.",
  "PARABENS: VOCE ACHOU UM JEITO NOVO DE EXPLODIR.",
];

const HOLD_VARIANT_MS = 1500;
const BOOST_HOLD_MAX_MS = 2400;
const AIM_FADE_MS = 420;

const MAIN_MENU_OPTIONS: MenuOption[] = [
  { label: "HISTÓRIA", mode: "story" },
  { label: "INFINITO", mode: "infinite" },
  { label: "CONFIGURAÇÕES", action: "settings" },
  { label: "CRÉDITOS", disabled: true },
];

const TUTORIAL_ORDER: TutorialStep[] = ["move", "shot", "strong", "boost", "dodge", "done"];

const TUTORIAL_DANIEL_TEXT: Record<TutorialStep, { expression: DanielExpression; pc: string; mobile: string }> = {
  move: {
    expression: "normal",
    pc: "Daniel na escuta. Estou alinhando a rota da Space News. Leve a nave para cima, para baixo e para os lados com WASD ou setas. Sem pressa: quero ver controle estável.",
    mobile: "Daniel na escuta. Estou alinhando a rota da Space News. Arraste o joystick e sinta a nave responder. Sem pressa: quero ver controle estável.",
  },
  shot: {
    expression: "serious",
    pc: "Contato de treino chegando pela direita. É um drone roxo. Agora só o tiro normal está liberado: aperte Z e derrube ele no movimento.",
    mobile: "Contato de treino chegando pela direita. É um drone roxo. Agora só o tiro normal está liberado: toque no botão de tiro e derrube ele no movimento.",
  },
  strong: {
    expression: "alert",
    pc: "Formação tripla detectada. Esses três drones vão cruzar sua linha. Use X e limpa o grupo com o tiro forte. Tiro normal não vai contar aqui.",
    mobile: "Formação tripla detectada. Esses três drones vão cruzar sua linha. Use o tiro forte e limpa o grupo. Tiro normal não vai contar aqui.",
  },
  boost: {
    expression: "serious",
    pc: "Robô preto em rota de colisão. Segura firme e use SHIFT para atravessar com boost. Se errar, eu puxo a nave de volta para a posição segura.",
    mobile: "Robô preto em rota de colisão. Use o botão de boost para atravessar. Se errar, eu puxo a nave de volta para a posição segura.",
  },
  dodge: {
    expression: "fear",
    pc: "Mais um vindo rápido! Agora não é para bater: use CTRL no timing e sinta os i-frames da esquiva. Eu aumentei a janela para você pegar o ritmo.",
    mobile: "Mais um vindo rápido! Agora não é para bater: use a esquiva no timing e sinta os i-frames. Eu aumentei a janela para você pegar o ritmo.",
  },
  done: {
    expression: "happy",
    pc: "Perfeito, Cleber. Controles calibrados. Vou aproximar a câmera da nave e liberar a rota de combate. A primeira wave entra sem corte seco.",
    mobile: "Perfeito, Cleber. Controles calibrados. Vou aproximar a câmera da nave e liberar a rota de combate. A primeira wave entra sem corte seco.",
  },
};

function getDanielIcon(expression: DanielExpression, talking: boolean) {
  const suffix = talking ? "Talk" : "Closed";
  const key = `daniel${expression[0].toUpperCase()}${expression.slice(1)}${suffix}` as keyof typeof CONFIG.uiImages;
  return CONFIG.uiImages[key] || CONFIG.uiImages.danielNormalClosed;
}

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

const ASSET_VERSION = "space-news-20260603-glow-hitbox-cursor";

function assetUrl(src: string) {
  if (src.startsWith("data:")) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${ASSET_VERSION}`;
}

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
      img.src = assetUrl(src);

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
    goldenHp: 0,
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
    capturedUntil: 0,
    throwUntil: 0,
    capturedEnemyId: null,
    throwVx: 0,
    throwVy: 0,
    wallImpactArmed: false,
    alienCaptureCooldownUntil: 0,
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


function drawShotFallbackSprite(
  ctx: CanvasRenderingContext2D,
  shot: Shot,
  color: string,
) {
  const vx = shot.vx ?? shot.speed;
  const vy = shot.vy ?? 0;
  const angle = Math.atan2(vy, vx);

  ctx.save();
  ctx.translate(shot.x + shot.w / 2, shot.y + shot.h / 2);
  applyVelocityStretch(
    ctx,
    vx,
    vy,
    getStretchSettings("shot").multiplier,
    getStretchPulse(shot.stretchUntil, "shot"),
  );
  ctx.rotate(angle);

  if (shot.variant === "homing" || shot.variant === "powerHoming") {
    const glow = shot.variant === "powerHoming" ? "#f0abfc" : "#22d3ee";
    const core = shot.variant === "powerHoming" ? "#fdf4ff" : "#ecfeff";

    ctx.globalAlpha = 0.32;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(-shot.w * 0.08, 0, shot.w * 0.76, shot.h * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(shot.w * 0.5, 0);
    ctx.lineTo(-shot.w * 0.28, -shot.h * 0.42);
    ctx.lineTo(-shot.w * 0.08, 0);
    ctx.lineTo(-shot.w * 0.28, shot.h * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(shot.w * 0.34, 0);
    ctx.lineTo(-shot.w * 0.12, -shot.h * 0.22);
    ctx.lineTo(-shot.w * 0.02, 0);
    ctx.lineTo(-shot.w * 0.12, shot.h * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = core;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-shot.w * 0.28, 0, shot.h * 0.34, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.stroke();

    ctx.restore();
    return;
  }

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-shot.w / 2, -shot.h / 2, shot.w, shot.h, Math.max(2, shot.h * 0.18));
  ctx.fill();
  ctx.restore();
}

export default function JogoPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const customCursorRef = useRef<HTMLDivElement | null>(null);

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
  const settingsReturnStateRef = useRef<GameState>("mainMenu");

  const storyIndexRef = useRef(0);
  const [storyIndex, setStoryIndex] = useState(0);

  const tutorialStepRef = useRef<TutorialStep>("move");
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>("move");
  const tutorialMoveStartedAtRef = useRef(0);
  const tutorialStepStartedAtRef = useRef(0);
  const tutorialTargetSpawnedRef = useRef(false);
  const tutorialResetRef = useRef({
    active: false,
    startAt: 0,
    durationMs: 720,
    fromX: 0,
    fromY: 0,
    toX: 120,
    toY: CONFIG.canvasHeight / 2 - CONFIG.gameplay.player.height / 2,
  });
  const tutorialAutoStartRef = useRef<number | null>(null);
  const [tutorialLaunchZoom, setTutorialLaunchZoom] = useState(false);
  const [danielMouthOpen, setDanielMouthOpen] = useState(false);

  const strongCooldownRef = useRef(0);
  const [strongCooldown, setStrongCooldown] = useState(0);

  const [playerHp, setPlayerHp] = useState(CONFIG.gameplay.player.maxHp);
  const [goldenHp, setGoldenHp] = useState(0);
  const [randomVisualEffect, setRandomVisualEffect] = useState({
    flashWhite: false,
    flashBlur: false,
    inverted: false,
  });
  const flashWhiteStartRef = useRef(0);
  const flashWhiteUntilRef = useRef(0);
  const flashBlurStartRef = useRef(0);
  const flashBlurUntilRef = useRef(0);
  const invertedStartRef = useRef(0);
  const invertedUntilRef = useRef(0);
  const [visualEffectNow, setVisualEffectNow] = useState(0);
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

  const boostAimRef = useRef({
    active: false,
    startAt: 0,
    startCharge: 0,
    variantActive: false,
    chargeRatio: 0,
    dirX: 1,
    dirY: 0,
  });

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
  const shockwavesRef = useRef<Shockwave[]>([]);
  const bossProjectilesRef = useRef<BossProjectile[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const powerUpIdRef = useRef(0);
  const fireRateUntilRef = useRef(0);
  const powerShotUntilRef = useRef(0);
  const homingShotUntilRef = useRef(0);
  const flamesUntilRef = useRef(0);
  const flamesLoopAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastFlamesHitSoundAtRef = useRef(0);
  const lastBossPowerUpAtRef = useRef(0);
  const [activePowerUpsUi, setActivePowerUpsUi] = useState<ActivePowerUpUi[]>([]);
  const shieldActiveRef = useRef(false);
  const [, setShieldActive] = useState(false);
  const powerGlowRef = useRef({ color: "", endAt: 0 });
  const audioPoolRef = useRef(new Map<string, HTMLAudioElement[]>());
  const powerUpTrailAudiosRef = useRef(new Map<number, HTMLAudioElement>());
  const audioPoolIndexRef = useRef(new Map<string, number>());
  const slowPlayerUntilRef = useRef(0);
  const bossProjectileIdRef = useRef(0);
  const bossRef = useRef<BossState>({
    active: false,
    intro: false,
    defeated: false,
    x: 0,
    y: 0,
    w: CONFIG.gameplay.boss.chocado.width,
    h: CONFIG.gameplay.boss.chocado.height,
    hp: CONFIG.gameplay.boss.chocado.hp,
    maxHp: CONFIG.gameplay.boss.chocado.hp,
    age: 0,
    introStartedAt: 0,
    battleStartedAt: 0,
    nextAttackAt: 0,
    attackIndex: -1,
    roarDone: false,
  });

  const shakeRef = useRef({ intensity: 0, endAt: 0 });
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const bossMusicAudioRef = useRef<HTMLAudioElement | null>(null);
  const pauseStartedAtRef = useRef(0);
  const backgroundOffsetRef = useRef(0);
  const abilityReadyRef = useRef({
    boost: false,
    dodge: true,
    strong: true,
  });

  const gameOverStartedAtRef = useRef(0);
  const gameOverLastBurstAtRef = useRef(0);
  const [gameOverFlash, setGameOverFlash] = useState(false);
  const [gameOverFlashOrigin, setGameOverFlashOrigin] = useState({
    x: "50%",
    y: "50%",
  });
  const [gameOverTaunt, setGameOverTaunt] = useState(GAME_OVER_TAUNTS[0]);
  const [gameOverWave, setGameOverWave] = useState(0);
  const [flashSnapshot, setFlashSnapshot] = useState("");

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
    settingsReturnStateRef.current =
      gameStateRef.current === "paused" ? "paused" : "mainMenu";
    setIndiceConfiguracao(0);
    setEstado("settings");
  }

  function voltarDasConfiguracoes() {
    tocarSom(CONFIG.sounds.menuBack, 0.38, "menu");
    setEstado(settingsReturnStateRef.current);
  }

  function setHistoriaIndex(index: number) {
    storyIndexRef.current = index;
    setStoryIndex(index);
  }


  function criarAlvoTutorial(step: TutorialStep) {
    const baseX = CONFIG.canvasWidth - 300;
    const centerY = CONFIG.canvasHeight / 2;

    enemiesRef.current = [];

    if (step === "shot") {
      const id = enemyIdRef.current++;
      enemiesRef.current = [
        {
          id,
          stretchUntil: performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
          kind: "purple",
          x: CONFIG.canvasWidth + 110,
          y: centerY - 50,
          w: CONFIG.gameplay.enemies.purple.width,
          h: CONFIG.gameplay.enemies.purple.height,
          vx: -1.65,
          vy: 0,
          hp: 1,
          maxHp: 1,
          age: 0,
          waveBaseY: centerY,
          shotCooldown: 999999,
          windUpMs: 0,
          isDashing: false,
          phase: 0,
          tutorialStep: "shot",
          removedByStrong: false,
        },
      ];
      tutorialTargetSpawnedRef.current = true;
      return;
    }

    if (step === "strong") {
      enemiesRef.current = [-1, 0, 1].map((row) => {
        const id = enemyIdRef.current++;
        return {
          id,
          stretchUntil: performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
          kind: "purple" as EnemyKind,
          x: CONFIG.canvasWidth + 100 + Math.abs(row) * 42,
          y: centerY - 50 + row * 118,
          w: CONFIG.gameplay.enemies.purple.width,
          h: CONFIG.gameplay.enemies.purple.height,
          vx: -1.25,
          vy: 0,
          hp: 3,
          maxHp: 3,
          age: 0,
          waveBaseY: centerY + row * 118,
          shotCooldown: 999999,
          windUpMs: 0,
          isDashing: false,
          phase: row,
          tutorialStep: "strong",
          removedByStrong: false,
        };
      });
      tutorialTargetSpawnedRef.current = true;
      return;
    }

    if (step === "boost" || step === "dodge") {
      const id = enemyIdRef.current++;
      enemiesRef.current = [
        {
          id,
          stretchUntil: performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
          kind: "black",
          x: CONFIG.canvasWidth + 120,
          y: centerY - CONFIG.gameplay.enemies.black.height / 2,
          w: CONFIG.gameplay.enemies.black.width,
          h: CONFIG.gameplay.enemies.black.height,
          vx: step === "boost" ? -3.1 : -4.25,
          vy: 0,
          hp: 999,
          maxHp: 999,
          age: 0,
          waveBaseY: centerY,
          shotCooldown: 999999,
          windUpMs: 0,
          isDashing: true,
          knockedBack: false,
        },
      ];
      tutorialTargetSpawnedRef.current = true;
    }
  }

  function prepararPassoTutorial(step: TutorialStep) {
    tutorialStepStartedAtRef.current = performance.now();
    tutorialMoveStartedAtRef.current = 0;
    tutorialTargetSpawnedRef.current = false;
    setTutorialLaunchZoom(false);
    shotsRef.current = [];
    powerUpsRef.current = [];
    enemyProjectilesRef.current = [];
    bossProjectilesRef.current = [];

    if (step === "shot" || step === "strong" || step === "boost" || step === "dodge") {
      criarAlvoTutorial(step);
    }

    if (step === "boost") {
      boostChargeRef.current = CONFIG.gameplay.boost.maxCharge;
      setBoostCharge(CONFIG.gameplay.boost.maxCharge);
    }

    if (step === "dodge") {
      lastDodgeAtRef.current = -999999;
      setDodgeReadyRatio(1);
    }

    if (step === "done") {
      enemiesRef.current = [];
    }
  }

  function setPassoTutorial(step: TutorialStep) {
    if (tutorialAutoStartRef.current !== null) {
      window.clearTimeout(tutorialAutoStartRef.current);
      tutorialAutoStartRef.current = null;
    }

    tutorialStepRef.current = step;
    prepararPassoTutorial(step);
    setTutorialStep(step);

    if (step === "done") {
      setTutorialLaunchZoom(true);
      tutorialAutoStartRef.current = window.setTimeout(() => {
        if (gameStateRef.current === "tutorial" && tutorialStepRef.current === "done") {
          setTutorialLaunchZoom(false);
          iniciarJogo(currentModeRef.current ?? "story");
        }
      }, 2450);
    }
  }

  function avancarPassoTutorial() {
    const currentIndex = TUTORIAL_ORDER.indexOf(tutorialStepRef.current);
    const nextStep = TUTORIAL_ORDER[Math.min(currentIndex + 1, TUTORIAL_ORDER.length - 1)];
    setPassoTutorial(nextStep);

    if (nextStep === "boost") {
      boostChargeRef.current = CONFIG.gameplay.boost.maxCharge;
      setBoostCharge(CONFIG.gameplay.boost.maxCharge);
    }

    if (nextStep === "dodge") {
      lastDodgeAtRef.current = -999999;
      setDodgeReadyRatio(1);
    }
  }

  function resetarTutorialSuave() {
    if (gameStateRef.current !== "tutorial" || tutorialStepRef.current === "done") return;

    const player = playerRef.current;
    const now = performance.now();
    tutorialResetRef.current = {
      active: true,
      startAt: now,
      durationMs: 720,
      fromX: player.x,
      fromY: player.y,
      toX: 120,
      toY: CONFIG.canvasHeight / 2 - player.h / 2,
    };

    player.vx = 0;
    player.vy = 0;
    player.tilt = 0;
    player.invincibleUntil = Math.max(player.invincibleUntil, now + 1200);
    boostAimRef.current.active = false;
    boostAimRef.current.variantActive = false;
    mobileShootRef.current = false;
    shotsRef.current = [];
    enemyProjectilesRef.current = [];
    bossProjectilesRef.current = [];
    tocarSom(CONFIG.sounds.tutorialWarning || CONFIG.sounds.menuBack || CONFIG.sounds.playerDamage, 0.35, "menu");
  }

  function acaoTutorialPermitida(action: "shot" | "strong" | "boost" | "dodge") {
    if (gameStateRef.current !== "tutorial") return true;
    const allowed = tutorialStepRef.current === action;
    if (!allowed) {
      resetarTutorialSuave();
    }
    return allowed;
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

    const finalVolume = clamp(
      volume * CONFIG.settings.masterVolume * categoryVolume,
      0,
      1,
    );

    let pool = audioPoolRef.current.get(src);
    if (!pool) {
      pool = Array.from({ length: 14 }, () => {
        const audio = new Audio(src);
        audio.preload = "auto";
        return audio;
      });
      audioPoolRef.current.set(src, pool);
      audioPoolIndexRef.current.set(src, 0);
    }

    const nextIndex = audioPoolIndexRef.current.get(src) ?? 0;
    const audio = pool[nextIndex % pool.length];
    audioPoolIndexRef.current.set(src, (nextIndex + 1) % pool.length);

    try {
      audio.currentTime = 0;
      audio.volume = finalVolume;
      audio.play().catch(() => {});
    } catch {
      const fallback = new Audio(src);
      fallback.preload = "auto";
      fallback.volume = finalVolume;
      fallback.play().catch(() => {});
    }
  }

  function tocarLoopPowerUpTrail(id: number) {
    if (
      !CONFIG.useSounds ||
      !CONFIG.sounds.powerUpTrail ||
      CONFIG.settings.masterVolume <= 0
    ) {
      return;
    }

    if (powerUpTrailAudiosRef.current.has(id)) return;

    const audio = new Audio(CONFIG.sounds.powerUpTrail);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = clamp(
      0.18 * CONFIG.settings.masterVolume * CONFIG.settings.sfxVolume,
      0,
      1,
    );

    powerUpTrailAudiosRef.current.set(id, audio);
    audio.play().catch(() => {});
  }

  function pararLoopPowerUpTrail(id: number) {
    const audio = powerUpTrailAudiosRef.current.get(id);
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    powerUpTrailAudiosRef.current.delete(id);
  }

  function pararTodosPowerUpTrails() {
    for (const audio of powerUpTrailAudiosRef.current.values()) {
      audio.pause();
      audio.currentTime = 0;
    }

    powerUpTrailAudiosRef.current.clear();
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

  function pararMusicaChocado(reset = true) {
    const audio = bossMusicAudioRef.current;
    if (!audio) return;
    audio.pause();
    if (reset) audio.currentTime = 0;
  }

  function tocarMusicaChocado() {
    if (!CONFIG.useSounds || !CONFIG.sounds.chocadoMusic) return;

    if (!bossMusicAudioRef.current) {
      const audio = new Audio(CONFIG.sounds.chocadoMusic);
      audio.loop = true;
      audio.volume = clamp(
        0.55 * CONFIG.settings.masterVolume * CONFIG.settings.sfxVolume,
        0,
        1,
      );
      bossMusicAudioRef.current = audio;
    }

    bossMusicAudioRef.current.play().catch(() => {});
  }

  function deslocarTemposDeJogo(elapsed: number) {
    if (elapsed <= 0) return;

    const player = playerRef.current;
    const shiftIfFuture = (value: number) => (value > 0 ? value + elapsed : value);

    player.invincibleUntil = shiftIfFuture(player.invincibleUntil);
    player.dodgeUntil = shiftIfFuture(player.dodgeUntil);
    player.boostUntil = shiftIfFuture(player.boostUntil);
    player.strongReadyAt = shiftIfFuture(player.strongReadyAt);
    player.stretchUntil = shiftIfFuture(player.stretchUntil);
    player.capturedUntil = shiftIfFuture(player.capturedUntil);
    player.throwUntil = shiftIfFuture(player.throwUntil);
    player.alienCaptureCooldownUntil = shiftIfFuture(player.alienCaptureCooldownUntil);

    fireRateUntilRef.current = shiftIfFuture(fireRateUntilRef.current);
    powerShotUntilRef.current = shiftIfFuture(powerShotUntilRef.current);
    homingShotUntilRef.current = shiftIfFuture(homingShotUntilRef.current);
    flamesUntilRef.current = shiftIfFuture(flamesUntilRef.current);
    lastBossPowerUpAtRef.current = shiftIfFuture(lastBossPowerUpAtRef.current);
    powerGlowRef.current.endAt = shiftIfFuture(powerGlowRef.current.endAt);
    shakeRef.current.endAt = shiftIfFuture(shakeRef.current.endAt);

    const wave = waveStateRef.current;
    wave.waveStartedAt = shiftIfFuture(wave.waveStartedAt);
    wave.messageUntil = shiftIfFuture(wave.messageUntil);
    wave.nextWaveAt = shiftIfFuture(wave.nextWaveAt);
    // IMPORTANTE: queue.at e relativo ao inicio da wave.
    // Como waveStartedAt ja foi deslocado, nao devemos somar elapsed na queue.
    // Fazer os dois causava softlock quando pausava perto do fim da wave.

    const boss = bossRef.current;
    boss.introStartedAt = shiftIfFuture(boss.introStartedAt);
    boss.battleStartedAt = shiftIfFuture(boss.battleStartedAt);
    boss.nextAttackAt = shiftIfFuture(boss.nextAttackAt);

    bossProjectilesRef.current = bossProjectilesRef.current.map((projectile) => ({
      ...projectile,
      activeAt: projectile.activeAt ? projectile.activeAt + elapsed : projectile.activeAt,
      homingUntil: projectile.homingUntil ? projectile.homingUntil + elapsed : projectile.homingUntil,
      returnAt: projectile.returnAt ? projectile.returnAt + elapsed : projectile.returnAt,
    }));

    enemiesRef.current = enemiesRef.current.map((enemy) => ({
      ...enemy,
    }));
  }

  function limparCombate() {
    shotsRef.current = [];
    boostAimRef.current.active = false;
    keysRef.current["shift"] = false;
    keysRef.current["x"] = false;
    enemiesRef.current = [];
    enemyProjectilesRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];
    bossProjectilesRef.current = [];
    powerUpsRef.current = [];
    pararTodosPowerUpTrails();
    fireRateUntilRef.current = 0;
    powerShotUntilRef.current = 0;
    homingShotUntilRef.current = 0;
    flamesUntilRef.current = 0;
    if (flamesLoopAudioRef.current) {
      flamesLoopAudioRef.current.pause();
      flamesLoopAudioRef.current.currentTime = 0;
    }
    setActivePowerUpsUi([]);
    shieldActiveRef.current = false;
    setShieldActive(false);
    powerGlowRef.current = { color: "", endAt: 0 };
    bossRef.current.active = false;
    bossRef.current.intro = false;
    bossRef.current.defeated = false;
    const player = playerRef.current;
    player.capturedUntil = 0;
    player.throwUntil = 0;
    player.capturedEnemyId = null;
    player.throwVx = 0;
    player.throwVy = 0;
    player.wallImpactArmed = false;
    shakeRef.current = { intensity: 0, endAt: 0 };
    boostHitEnemiesRef.current.clear();
    pararMusicaChocado(true);
  }

  function resetarWaves(mode: GameMode | null) {
    const now = performance.now();
    const isInfinite = mode === "infinite";
    const isStory = mode === "story";
    const firstDelay = isInfinite
      ? CONFIG.gameplay.infiniteWaves.firstWaveDelayMs
      : isStory
        ? CONFIG.gameplay.storyWaves.firstWaveDelayMs
        : 0;
    const messageMs = isInfinite
      ? CONFIG.gameplay.infiniteWaves.messageMs
      : isStory
        ? CONFIG.gameplay.storyWaves.messageMs
        : 0;
    const initialMessage = isInfinite
      ? "PREPARE-SE"
      : isStory
        ? "MISSÃO HISTÓRIA"
        : "";

    waveStateRef.current = {
      mode,
      active: false,
      wave: 0,
      waveStartedAt: 0,
      queue: [],
      nextWaveAt: mode ? now + firstDelay : 0,
      difficulty: 1,
      bossWave: false,
      messageUntil: mode ? now + messageMs : 0,
      message: initialMessage,
    };

    setWaveUi({
      mode,
      wave: 0,
      active: false,
      bossWave: false,
      message: initialMessage,
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
    setGoldenHp(player.goldenHp);
    setRandomVisualEffect({ flashWhite: false, flashBlur: false, inverted: false });
    slowPlayerUntilRef.current = 0;
    setIsLowHp(false);
    setGameOverFlash(false);
    setFlashSnapshot("");
    setGameOverTaunt(GAME_OVER_TAUNTS[0]);
    setGameOverWave(0);

    setEstado("playing");
  }

  function iniciarTutorialInterativo() {
    solicitarFullscreen();
    currentModeRef.current = currentModeRef.current ?? "story";

    const player = createInitialPlayer();
    player.x = 120;
    player.y = CONFIG.canvasHeight / 2 - player.h / 2;
    playerRef.current = player;

    limparCombate();
    resetarWaves(null);
    scoreRef.current = 0;
    setScore(0);
    strongCooldownRef.current = 0;
    setStrongCooldown(0);
    player.strongReadyAt = 0;
    boostChargeRef.current = CONFIG.gameplay.boost.maxCharge;
    setBoostCharge(CONFIG.gameplay.boost.maxCharge);
    lastDodgeAtRef.current = -999999;
    setDodgeReadyRatio(1);
    setStrongReadyRatio(1);
    setPlayerHp(player.hp);
    setGoldenHp(player.goldenHp);
    tutorialResetRef.current.active = false;
    setTutorialLaunchZoom(false);
    setPassoTutorial("move");
    setIsLowHp(false);
    setEstado("tutorial");
  }

  function iniciarGameOverCutscene() {
    const player = playerRef.current;
    const now = performance.now();
    const waveDied = Math.max(0, waveStateRef.current.wave);

    setGameOverWave(waveDied);
    setGameOverTaunt(
      GAME_OVER_TAUNTS[Math.floor(Math.random() * GAME_OVER_TAUNTS.length)],
    );

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

    tocarSom(CONFIG.sounds.gameOverExplosion || CONFIG.sounds.explosion || CONFIG.sounds.enemyDeath, 0.68, "hit");

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

    if (gameStateRef.current === "tutorial") {
      resetarTutorialSuave();
      return;
    }

    if (shieldActiveRef.current) {
      shieldActiveRef.current = false;
      setShieldActive(false);
      player.invincibleUntil = now + 650;
      tocarSom(CONFIG.sounds.shieldBreak || CONFIG.sounds.playerDamage, 0.55, "ability");
      criarExplosao(player.x + player.w / 2, player.y + player.h / 2, "#a7f3d0", 22);
      shakeRef.current = { intensity: 4, endAt: now + 140 };
      return;
    }

    if (player.goldenHp > 0) {
      player.goldenHp = Math.max(0, player.goldenHp - Math.max(1, Math.ceil(dano)));
      setGoldenHp(player.goldenHp);
      player.invincibleUntil = now + CONFIG.gameplay.player.invincibleMs;
      tocarSom(CONFIG.sounds.goldenHeart || CONFIG.sounds.playerDamage, 0.45, "ability");
      criarParticulasHit(
        player.x + player.w / 2,
        player.y + player.h / 2,
        "#ffd166",
        18,
      );
      shakeRef.current = { intensity: 3.5, endAt: now + 130 };
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
      pauseStartedAtRef.current = performance.now();
      pararMusicaChocado(false);
      setEstado("paused");
      setIsLowHp(false);
      return;
    }

    if (gameStateRef.current === "paused") {
      const elapsed = performance.now() - pauseStartedAtRef.current;
      deslocarTemposDeJogo(elapsed);
      pauseStartedAtRef.current = 0;
      tocarSom(CONFIG.sounds.menuConfirm, 0.4, "menu");
      if (bossRef.current.active && bossRef.current.hp > 0 && !bossRef.current.defeated) {
        tocarMusicaChocado();
      }
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

  function carregarBoostPorDano(dano: number) {
    if (!CONFIG.gameplay.boost.enabled || dano <= 0) return;

    const ganho = dano * CONFIG.gameplay.boost.damageChargeGain;
    const next = clamp(
      boostChargeRef.current + ganho,
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
  }

  function normalizarDirecao(dirX: number, dirY: number) {
    const len = Math.hypot(dirX, dirY);
    if (len <= 0.001) return { x: 1, y: 0 };
    return { x: dirX / len, y: dirY / len };
  }

  function atualizarDirecaoMira(inputX: number, inputY: number) {
    if (inputX === 0 && inputY === 0) return;
    const dir = normalizarDirecao(inputX, inputY);

    if (boostAimRef.current.active) {
      boostAimRef.current.dirX = dir.x;
      boostAimRef.current.dirY = dir.y;
    }
  }

  function iniciarMiraBoost() {
    if (!CONFIG.gameplay.boost.enabled) return;
    if (gameStateRef.current !== "playing" && gameStateRef.current !== "tutorial") return;
    if (!acaoTutorialPermitida("boost")) return;
    if (boostAimRef.current.active) return;
    if (boostChargeRef.current < CONFIG.gameplay.boost.maxCharge) return;

    const player = playerRef.current;
    const inputDir = normalizarDirecao(
      player.lastInputX || player.vx || 1,
      player.lastInputY || player.vy || 0,
    );

    boostAimRef.current = {
      active: true,
      startAt: performance.now(),
      startCharge: boostChargeRef.current,
      variantActive: false,
      chargeRatio: 0,
      dirX: inputDir.x,
      dirY: inputDir.y,
    };
  }

  function soltarMiraBoost(auto = false) {
    const aim = boostAimRef.current;
    if (!aim.active) return;

    const now = performance.now();
    const heldMs = now - aim.startAt;
    const isHoldVariant = aim.variantActive || heldMs >= HOLD_VARIANT_MS;

    const dirX = aim.dirX;
    const dirY = aim.dirY;
    const chargeRatio = auto
      ? 1
      : isHoldVariant
        ? clamp(aim.chargeRatio, 0.24, 1)
        : 1;

    boostAimRef.current.active = false;
    boostAimRef.current.variantActive = false;
    boostAimRef.current.chargeRatio = 0;

    executarBoost(dirX, dirY, chargeRatio, true);
  }

  function executarBoost(
    dirXParam = 1,
    dirYParam = 0,
    chargeRatio = 1,
    ignoreFullChargeCheck = false,
  ) {
    if (!CONFIG.gameplay.boost.enabled) return;
    if (gameStateRef.current !== "playing" && gameStateRef.current !== "tutorial") return;
    if (!acaoTutorialPermitida("boost")) return;

    if (!ignoreFullChargeCheck && boostChargeRef.current < CONFIG.gameplay.boost.maxCharge) {
      return;
    }

    const player = playerRef.current;
    const now = performance.now();
    const dir = normalizarDirecao(dirXParam, dirYParam);
    const power = clamp(chargeRatio, 0.22, 1);
    const durationMultiplier = 0.55 + power * 1.55;

    player.boostUntil = now + CONFIG.gameplay.boost.durationMs * durationMultiplier;
    player.boostVx = dir.x * CONFIG.gameplay.boost.speed;
    player.boostVy = dir.y * CONFIG.gameplay.boost.speed;
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
      Math.round(CONFIG.gameplay.boost.particleAmount * (0.75 + power)),
    );

    if (CONFIG.settings.enableScreenShake) {
      shakeRef.current = {
        intensity: CONFIG.gameplay.boost.shake * (0.75 + power),
        endAt: now + CONFIG.gameplay.boost.shakeMs,
      };
    }

    if (gameStateRef.current === "tutorial" && tutorialStepRef.current === "boost") {
      avancarPassoTutorial();
    }
  }

  function executarEsquiva() {
    if (!CONFIG.gameplay.dodge.enabled) return;
    if (gameStateRef.current !== "playing" && gameStateRef.current !== "tutorial") return;
    if (!acaoTutorialPermitida("dodge")) return;

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

    if (gameStateRef.current === "tutorial" && tutorialStepRef.current === "dodge") {
      avancarPassoTutorial();
    }
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
      const topY = cfg.edgePadding;
      const bottomY = CONFIG.canvasHeight - cfg.height - cfg.edgePadding;
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
        redDirection: targetY > startY ? 1 : -1,
        redBurstShotsLeft: 0,
        redBurstTimer: 0,
        redPauseTimer: 0,
        redHoldY: startY,
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

    if (kind === "alien") {
      const cfg = CONFIG.gameplay.enemies.alien;

      enemiesRef.current.push({
        id,
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
        kind: "alien",
        x: CONFIG.canvasWidth + 100,
        y: clamp(spawnY, 50, CONFIG.canvasHeight - cfg.height - 50),
        w: cfg.width,
        h: cfg.height,
        vx: -cfg.speed,
        vy: rand(-0.18, 0.18),
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

  function criarParticulasAlienFuga(x: number, y: number, amount = 3) {
    if (!CONFIG.settings.enableParticles) return;
    const finalAmount = Math.max(
      1,
      Math.floor(amount * CONFIG.settings.particleQuality),
    );

    for (let i = 0; i < finalAmount; i++) {
      particlesRef.current.push({
        id: enemyIdRef.current++,
        x: x + rand(-10, 10),
        y: y + rand(-12, 12),
        vx: rand(-2.8, -0.8),
        vy: rand(-1.7, 1.7),
        size: rand(4, 10),
        life: rand(160, 320),
        maxLife: 320,
        color: Math.random() > 0.45 ? "#a7ff83" : "#5dff7a",
      });
    }
  }

  function aplicarKnockbackInimigo(
    enemy: Enemy,
    originX: number,
    originY: number,
    force: number,
    spinStrength = 0.012,
  ) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    const dx = cx - originX;
    const dy = cy - originY;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    const dirX = dx / len;
    const dirY = dy / len;

    // Knockback agora também pode jogar o inimigo para cima/baixo.
    // Se o impacto vier quase horizontal, damos um leve impulso vertical aleatório
    // para deixar a gameplay mais viva e menos presa só no eixo X.
    const verticalDir =
      Math.abs(dirY) < 0.22 ? (Math.random() > 0.5 ? 0.62 : -0.62) : dirY;

    // No espaço: o knockback vira velocidade constante.
    // Isso deixa o impacto mais divertido e evita inimigos presos fora da tela.
    enemy.vx = dirX * force;
    enemy.vy = verticalDir * force * 0.78;
    enemy.isDashing = true;
    enemy.knockedBack = true;
    enemy.knockedAt = performance.now();
    enemy.rotation = enemy.rotation ?? 0;
    enemy.rotationSpeed =
      spinStrength *
      (verticalDir >= 0 ? 1 : -1) *
      (0.85 + Math.random() * 0.55);
    enemy.stretchUntil =
      performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs;
  }

  function aplicarShockwaveDeTiroForte(originX: number, originY: number) {
    const strongCfg = CONFIG.gameplay.shots.strong;
    const radius = strongCfg.shockwaveRadius ?? 230;
    const force = strongCfg.shockwaveKnockback ?? 8.5;
    const spin = strongCfg.shockwaveSpin ?? 0.018;

    shockwavesRef.current.push({
      id: enemyIdRef.current++,
      x: originX,
      y: originY,
      radius,
      life: 360,
      maxLife: 360,
    });
    criarExplosao(originX, originY, "#fff1a8", 18);

    for (const enemy of enemiesRef.current) {
      const cx = enemy.x + enemy.w / 2;
      const cy = enemy.y + enemy.h / 2;
      const distance = Math.hypot(cx - originX, cy - originY);

      if (distance > radius) continue;

      if (
        gameStateRef.current === "tutorial" &&
        tutorialStepRef.current === "strong" &&
        enemy.kind === "purple" &&
        enemy.tutorialStep === "strong"
      ) {
        enemy.removedByStrong = true;
      }

      const falloff = clamp(1 - distance / radius, 0.18, 1);
      const damage = (strongCfg.shockwaveDamage ?? 0) * falloff;
      if (damage > 0 && enemy.hp > 0) {
        const applied = Math.min(damage, enemy.hp);
        enemy.hp -= damage;
        carregarBoostPorDano(applied);
        adicionarPontuacao(Math.ceil(applied * (strongCfg.shockwaveDamageScore ?? 25)));
        criarParticulasHit(cx, cy, "#fff1a8", 6);
      }

      aplicarKnockbackInimigo(
        enemy,
        originX,
        originY,
        force * falloff,
        spin * falloff,
      );
    }

    if (CONFIG.settings.enableScreenShake) {
      shakeRef.current = {
        intensity: 4.5,
        endAt: performance.now() + 130,
      };
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

  function spawnBossChocado() {
    const now = performance.now();
    const cfg = CONFIG.gameplay.boss.chocado;

    bossProjectilesRef.current = [];
    enemiesRef.current = enemiesRef.current.filter(
      (enemy) => enemy.kind === "asteroid" || enemy.kind === "fragment",
    );

    bossRef.current = {
      active: true,
      intro: true,
      defeated: false,
      x: CONFIG.canvasWidth - cfg.width - 8,
      y: (CONFIG.canvasHeight - cfg.height) / 2,
      w: cfg.width,
      h: cfg.height,
      hp: cfg.hp,
      maxHp: cfg.hp,
      age: 0,
      introStartedAt: now,
      battleStartedAt: 0,
      nextAttackAt: now + cfg.introBarMs + cfg.introRoarMs + cfg.attackDelayMs,
      attackIndex: -1,
      roarDone: false,
    };

    mostrarMensagemWave("CHOCADO CHEGOU", true);
    tocarSom(CONFIG.sounds.bossIntro, 0.62, "sfx");
    tocarMusicaChocado();
  }

  function bossEstaAtivo() {
    return bossRef.current.active && bossRef.current.hp > 0;
  }

  function mostrarMensagemWave(message: string, bossWave = false) {
    const wave = waveStateRef.current;
    const messageMs = wave.mode === "story"
      ? CONFIG.gameplay.storyWaves.messageMs
      : CONFIG.gameplay.infiniteWaves.messageMs;
    const until = performance.now() + messageMs;

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
    if (bossWave) return [];
    const groupCount = bossWave
      ? 0
      : Math.min(
          cfg.maxGroups,
          cfg.baseGroups + Math.floor(waveNumber * cfg.groupsPerWave),
        );

    // Lanes mais espaçadas: evita que os inimigos nasçam grudados e lotem a tela.
    const lanes = [86, 190, 300, 410, 520, 620];
    const shuffled = [...lanes].sort(() => Math.random() - 0.5);
    const mirrorLane = (lane: number) =>
      clamp(CONFIG.canvasHeight - lane - 70, 62, CONFIG.canvasHeight - 132);
    const pickLane = (i: number) => shuffled[i % shuffled.length];

    let time = 0;

    for (let i = 0; i < groupCount; i++) {
      const lane = pickLane(i);
      const mirror = mirrorLane(lane);
      const roll = Math.random();
      const earlyWave = waveNumber <= 3;

      // No começo, o jogo favorece roxos, mas ainda varia.
      // Depois, mistura formações simétricas e threats especiais.
      if (earlyWave) {
        if (roll < 0.68) {
          events.push({ at: time, kind: "purple", y: lane });
          if (Math.random() < 0.28) {
            events.push({ at: time + 430, kind: "purple", y: mirror });
          }
        } else if (roll < 0.86) {
          events.push({ at: time, kind: "red" });
        } else {
          events.push({ at: time, kind: "purple", y: lane });
          events.push({ at: time + 540, kind: "red" });
        }
      } else if (roll < 0.24) {
        // Par espelhado espaçado: ameaça dupla, mas sem empilhar inimigos.
        events.push({ at: time, kind: "purple", y: lane });
        events.push({ at: time + 520, kind: "purple", y: mirror });
      } else if (roll < 0.44) {
        // Vermelho ocupa a tela verticalmente.
        events.push({ at: time, kind: "red" });
      } else if (roll < 0.58 && waveNumber >= cfg.blackFromWave) {
        // Preto aparece isolado para não virar parede de inimigos.
        events.push({ at: time, kind: "black", y: lane });
      } else if (roll < 0.72 && waveNumber >= cfg.alienFromWave) {
        // Alien quase sempre sozinho; apoio só quando houver espaço.
        events.push({ at: time, kind: "alien", y: lane });
        if (Math.random() < 0.24) {
          events.push({ at: time + 680, kind: "purple", y: mirror });
        }
      } else {
        // Formação mista com atraso maior entre inimigos.
        events.push({ at: time, kind: "purple", y: lane });
        if (waveNumber >= cfg.blackFromWave && Math.random() < 0.22) {
          events.push({ at: time + 700, kind: "black", y: mirror });
        } else {
          events.push({ at: time + 620, kind: "purple", y: mirror });
        }
      }

      // Asteroides são hazards independentes: aparecem junto da wave,
      // mas não contam para finalizar e continuam após a wave acabar.
      if (
        waveNumber >= cfg.asteroidFromWave &&
        i % 4 === 2 &&
        Math.random() < 0.42
      ) {
        events.push({ at: time + 720, kind: "asteroid", y: mirror });
      }

      time += Math.max(
        880,
        cfg.spawnIntervalMs - Math.min(120, waveNumber * 3),
      );
    }

    return events.sort((a, b) => a.at - b.at);
  }

  function criarPlanoWaveHistoria(waveNumber: number): WaveSpawnEvent[] {
    const cfg = CONFIG.gameplay.storyWaves;
    const events: WaveSpawnEvent[] = [];

    if (waveNumber >= cfg.bossWave) return events;

    const groupCount = Math.min(
      cfg.maxGroups,
      cfg.baseGroups + Math.floor(waveNumber * cfg.groupsPerWave),
    );

    const lanes = [92, 178, 264, 352, 440, 532, 616];
    const shuffled = [...lanes].sort(() => Math.random() - 0.5);
    const mirrorLane = (lane: number) =>
      clamp(CONFIG.canvasHeight - lane - 78, 70, CONFIG.canvasHeight - 138);
    const pickLane = (i: number) => shuffled[i % shuffled.length];

    let time = 0;

    for (let i = 0; i < groupCount; i++) {
      const lane = pickLane(i);
      const mirror = mirrorLane(lane);
      const roll = Math.random();

      if (waveNumber <= 2) {
        events.push({ at: time, kind: "purple", y: lane });
        if (i % 2 === 1) {
          events.push({ at: time + 720, kind: "purple", y: mirror });
        }
      } else if (waveNumber <= 5) {
        if (roll < 0.55) {
          events.push({ at: time, kind: "purple", y: lane });
          events.push({ at: time + 700, kind: "purple", y: mirror });
        } else if (roll < 0.78) {
          events.push({ at: time, kind: "red" });
        } else {
          events.push({ at: time, kind: "black", y: lane });
        }
      } else if (waveNumber <= 10) {
        if (roll < 0.25) {
          events.push({ at: time, kind: "red" });
        } else if (roll < 0.48) {
          events.push({ at: time, kind: "black", y: lane });
        } else if (roll < 0.66 && waveNumber >= cfg.alienFromWave) {
          events.push({ at: time, kind: "alien", y: lane });
        } else {
          events.push({ at: time, kind: "purple", y: lane });
          events.push({ at: time + 780, kind: "purple", y: mirror });
        }
      } else {
        if (roll < 0.22) {
          events.push({ at: time, kind: "red" });
        } else if (roll < 0.42) {
          events.push({ at: time, kind: "black", y: lane });
        } else if (roll < 0.60) {
          events.push({ at: time, kind: "alien", y: lane });
        } else {
          events.push({ at: time, kind: "purple", y: lane });
          events.push({ at: time + 820, kind: "black", y: mirror });
        }
      }

      if (
        waveNumber >= cfg.asteroidFromWave &&
        i % 4 === 2 &&
        Math.random() < 0.3
      ) {
        events.push({ at: time + 880, kind: "asteroid", y: mirror });
      }

      // No modo história o spawn é mais espaçado para a wave ser longa,
      // mas sem colocar inimigos em cima uns dos outros.
      time += Math.max(1120, cfg.spawnIntervalMs - Math.min(80, waveNumber * 3));
    }

    return events.sort((a, b) => a.at - b.at);
  }

  function iniciarWaveHistoria(waveNumber: number) {
    const now = performance.now();
    const cfg = CONFIG.gameplay.storyWaves;
    const bossWave = waveNumber >= cfg.bossWave;
    const difficulty = Math.min(
      cfg.maxDifficulty,
      1 + Math.max(0, waveNumber - 1) * cfg.difficultyPerWave,
    );
    const message = bossWave
      ? "BOSS FINAL: CHOCADO"
      : `WAVE ${waveNumber}/${cfg.normalWaves}`;

    waveStateRef.current = {
      mode: "story",
      active: true,
      wave: waveNumber,
      waveStartedAt: now,
      queue: criarPlanoWaveHistoria(waveNumber),
      nextWaveAt: 0,
      difficulty,
      bossWave,
      messageUntil: now + cfg.messageMs,
      message,
    };

    setWaveUi({
      mode: "story",
      wave: waveNumber,
      active: true,
      bossWave,
      message,
    });

    tocarSom(
      bossWave ? CONFIG.sounds.bossIntro : CONFIG.sounds.waveStart,
      bossWave ? 0.64 : 0.48,
    );

    if (bossWave) {
      spawnBossChocado();
    }
  }

  function concluirModoHistoria() {
    const now = performance.now();
    limparCombate();
    waveStateRef.current = {
      ...waveStateRef.current,
      active: false,
      queue: [],
      nextWaveAt: 0,
      bossWave: false,
      message: "TERRA SALVA",
      messageUntil: now + CONFIG.gameplay.storyWaves.messageMs,
    };
    setWaveUi({
      mode: "story",
      wave: CONFIG.gameplay.storyWaves.bossWave,
      active: false,
      bossWave: false,
      message: "TERRA SALVA",
    });
    tocarSom(CONFIG.sounds.chocadoDefeat || CONFIG.sounds.menuConfirm, 0.75, "sfx");
    window.setTimeout(() => {
      if (gameStateRef.current === "playing") {
        setEstado("victory");
      }
    }, CONFIG.gameplay.storyWaves.finalVictoryDelayMs);
  }

  function aplicarDificuldadeWave(inicio: number, difficulty: number) {
    const waveNumber = waveStateRef.current.wave;
    const hpBonus = Math.floor(waveNumber / 32);
    const speedScale = Math.min(1.55, 1 + Math.max(0, difficulty - 1) * 0.18);

    for (const enemy of enemiesRef.current.slice(inicio)) {
      if (enemy.kind !== "fragment") {
        enemy.hp = Math.max(1, Math.ceil(enemy.hp + hpBonus));
        enemy.maxHp = enemy.hp;
      }

      enemy.vx *= speedScale;
      enemy.vy *= speedScale;

      if (enemy.kind === "red") {
        enemy.shotCooldown = Math.max(
          520,
          enemy.shotCooldown / Math.min(2.05, difficulty),
        );
        enemy.redTravelTimeMs = Math.max(
          1120,
          (enemy.redTravelTimeMs ??
            CONFIG.gameplay.enemies.red.verticalTravelMs) /
            Math.min(1.55, difficulty),
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

    if (bossWave) {
      spawnBossChocado();
    }
  }

  function atualizarWavesInfinitas() {
    if (gameStateRef.current !== "playing") return;

    const wave = waveStateRef.current;
    const mode = wave.mode;
    if (!mode) return;

    const isInfinite = mode === "infinite";
    const isStory = mode === "story";

    if (isInfinite && !CONFIG.gameplay.infiniteWaves.enabled) return;
    if (isStory && !CONFIG.gameplay.storyWaves.enabled) return;

    const now = performance.now();
    const cfg = isInfinite
      ? CONFIG.gameplay.infiniteWaves
      : CONFIG.gameplay.storyWaves;

    if (!wave.active) {
      if (wave.nextWaveAt > 0 && now >= wave.nextWaveAt) {
        if (isStory) {
          iniciarWaveHistoria(wave.wave + 1);
        } else {
          iniciarWaveInfinita(wave.wave + 1);
        }
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

    if (wave.queue.length === 0) {
      enemiesRef.current = enemiesRef.current.filter((enemy) => {
        if (enemy.kind === "asteroid" || enemy.kind === "fragment") return true;
        const margin = 220;
        return (
          enemy.x > -enemy.w - margin &&
          enemy.x < CONFIG.canvasWidth + enemy.w + margin &&
          enemy.y > -enemy.h - margin &&
          enemy.y < CONFIG.canvasHeight + enemy.h + margin
        );
      });
    }

    const bossAliveForWave = bossEstaAtivo();
    const waveEnemiesAlive =
      bossAliveForWave ||
      enemiesRef.current.some((enemy) => {
        if (enemy.kind === "asteroid" || enemy.kind === "fragment") {
          return false;
        }

        const margin = 80;
        const visibleEnough =
          enemy.x > -enemy.w - margin &&
          enemy.x < CONFIG.canvasWidth + enemy.w + margin &&
          enemy.y > -enemy.h - margin &&
          enemy.y < CONFIG.canvasHeight + enemy.h + margin;

        return visibleEnough && enemy.hp > 0;
      });

    if (wave.queue.length === 0 && !waveEnemiesAlive) {
      const completedWave = wave.wave;
      const completedBossWave = wave.bossWave;

      wave.active = false;
      wave.queue = [];
      wave.bossWave = false;
      wave.nextWaveAt = now + cfg.nextWaveDelayMs;

      if (isStory && completedBossWave) {
        adicionarPontuacao(CONFIG.gameplay.score.bossWaveClear);
        wave.nextWaveAt = 0;
        wave.message = "CHOCADO DERROTADO";
        wave.messageUntil = now + CONFIG.gameplay.storyWaves.messageMs;
        setWaveUi({
          mode: "story",
          wave: completedWave,
          active: false,
          bossWave: false,
          message: wave.message,
        });
        concluirModoHistoria();
        return;
      }

      if (isStory && completedWave >= CONFIG.gameplay.storyWaves.normalWaves) {
        wave.nextWaveAt = now + CONFIG.gameplay.storyWaves.nextWaveDelayMs;
        wave.message = "CHEFE FINAL SE APROXIMA";
      } else {
        wave.message = isStory
          ? `WAVE ${completedWave}/${CONFIG.gameplay.storyWaves.normalWaves} CONCLUIDA`
          : `WAVE ${completedWave} CONCLUÍDA`;
      }

      wave.messageUntil = now + cfg.messageMs;

      adicionarPontuacao(
        completedBossWave
          ? CONFIG.gameplay.score.bossWaveClear
          : CONFIG.gameplay.score.waveClear,
      );

      setWaveUi({
        mode,
        wave: completedWave,
        active: false,
        bossWave: false,
        message: wave.message,
      });
    }
  }



  function powerUpIcon(kind: PowerUpKind) {
    if (kind === "regen") return CONFIG.uiImages.powerRegen;
    if (kind === "tripleRegen") return CONFIG.uiImages.powerTripleRegen;
    if (kind === "shield") return CONFIG.uiImages.powerShield;
    if (kind === "powerShot") return CONFIG.uiImages.powerPowerShot;
    if (kind === "homingShot") return CONFIG.uiImages.powerHomingShot;
    if (kind === "flames") return CONFIG.uiImages.powerFlames;
    if (kind === "goldenHeart") return CONFIG.uiImages.powerGoldenHeart;
    if (kind === "randomBox") return CONFIG.uiImages.powerRandomBox;
    return CONFIG.uiImages.powerFireRate;
  }

  function powerUpLabel(kind: PowerUpKind) {
    if (kind === "regen") return "+1 HP";
    if (kind === "tripleRegen") return "+3 HP";
    if (kind === "shield") return "SHIELD";
    if (kind === "powerShot") return "POWER";
    if (kind === "homingShot") return "HOMING";
    if (kind === "flames") return "FLAMES";
    if (kind === "goldenHeart") return "+2 GOLD";
    if (kind === "randomBox") return "???";
    return "TIRO+";
  }

  function powerUpColor(kind: PowerUpKind) {
    if (kind === "fireRate") return "#38bdf8";
    if (kind === "powerShot") return "#f59e0b";
    if (kind === "homingShot") return "#22d3ee";
    if (kind === "flames") return "#fb923c";
    if (kind === "shield") return "#a7f3d0";
    if (kind === "tripleRegen") return "#ff4d6d";
    if (kind === "goldenHeart") return "#ffd166";
    if (kind === "randomBox") return "#c084fc";
    return "#ff6b6b";
  }

  function spawnPowerUp(kind: PowerUpKind, x: number, y: number, fromBoss = false) {
    const cfg = CONFIG.gameplay.powerups;

    // Nasce diretamente do ponto onde o inimigo morreu/foi acertado.
    // Só corrige para não nascer fora da tela ou preso dentro do Chocado.
    const safeLeft = 150;
    const safeRight = CONFIG.canvasWidth - cfg.width - 150;
    const safeTop = 100;
    const safeBottom = CONFIG.canvasHeight - cfg.height - 100;

    const spawnX = fromBoss
      ? clamp(x - cfg.width - 76, CONFIG.canvasWidth - 570, CONFIG.canvasWidth - 360)
      : clamp(x - cfg.width / 2, safeLeft, safeRight);
    const spawnY = clamp(y - cfg.height / 2, safeTop, safeBottom);
    const id = powerUpIdRef.current++;

    powerUpsRef.current.push({
      id,
      kind,
      x: spawnX,
      y: spawnY,
      w: cfg.width,
      h: cfg.height,
      vx: -(fromBoss ? cfg.bossSpeed : cfg.speed),
      vy: rand(-0.55, 0.55),
      age: 0,
      life: cfg.lifeMs,
      wavePhase: rand(0, Math.PI * 2),
      bornAt: performance.now(),
    });

    tocarSom(CONFIG.sounds.powerUpSpawn || CONFIG.sounds.abilityReady, 0.42, "ability");
    tocarLoopPowerUpTrail(id);
  }

  function tentarSpawnPowerUp(x: number, y: number, bossDamage = false) {
    if (gameStateRef.current === "tutorial") return;
    const player = playerRef.current;
    const cfg = CONFIG.gameplay.powerups;
    const now = performance.now();

    const rollTimedPower = (boss = false): PowerUpKind | null => {
      const options: Array<{ kind: PowerUpKind; chance: number }> = [
        { kind: "fireRate", chance: boss ? cfg.fireRateChanceOnBossDamage : cfg.fireRateChanceOnKill },
        { kind: "powerShot", chance: boss ? cfg.powerShotChanceOnBossDamage : cfg.powerShotChanceOnKill },
        { kind: "homingShot", chance: boss ? cfg.homingShotChanceOnBossDamage : cfg.homingShotChanceOnKill },
        { kind: "flames", chance: boss ? cfg.flamesChanceOnBossDamage : cfg.flamesChanceOnKill },
      ];

      for (const option of options.sort(() => Math.random() - 0.5)) {
        if (Math.random() < option.chance) return option.kind;
      }

      return null;
    };

    const rollPower = (boss = false): PowerUpKind | null => {
      const tripleChance = boss ? cfg.tripleRegenChanceOnBossDamage : cfg.tripleRegenChanceLowHp;
      if (player.hp <= 2 && Math.random() < tripleChance) return "tripleRegen";
      if (player.hp < CONFIG.gameplay.player.maxHp && Math.random() < (boss ? cfg.regenChanceOnBossDamage : cfg.regenChanceOnKill)) return "regen";
      const canSpawnGoldenHeart = player.hp >= CONFIG.gameplay.player.maxHp && player.goldenHp <= 0;
      if (canSpawnGoldenHeart && Math.random() < (boss ? cfg.goldenHeartChanceOnBossDamage : cfg.goldenHeartChanceOnKill)) return "goldenHeart";
      if (Math.random() < (boss ? cfg.randomBoxChanceOnBossDamage : cfg.randomBoxChanceOnKill)) return "randomBox";
      if (!shieldActiveRef.current && Math.random() < (boss ? cfg.shieldChanceOnBossDamage : cfg.shieldChanceOnKill)) return "shield";
      return rollTimedPower(boss);
    };

    if (bossDamage) {
      if (now - lastBossPowerUpAtRef.current < cfg.bossDamageSpawnCooldownMs) return;
      const bossKind = rollPower(true);
      if (bossKind) {
        lastBossPowerUpAtRef.current = now;
        spawnPowerUp(bossKind, x, y, true);
      }
      return;
    }

    const kind = rollPower(false);
    if (kind) spawnPowerUp(kind, x, y, false);
  }

  function ativarFlashbangAleatorio() {
    const cfg = CONFIG.gameplay.powerups;
    const delay = cfg.flashbangVoiceDelayMs ?? 1000;

    flashWhiteStartRef.current = 0;
    flashWhiteUntilRef.current = 0;
    flashBlurStartRef.current = 0;
    flashBlurUntilRef.current = 0;

    setRandomVisualEffect((current) => ({
      ...current,
      flashWhite: false,
      flashBlur: false,
    }));

    // Primeiro toca a voz do flashbang. Depois de 1s vem o estouro visual/sonoro.
    tocarSom(CONFIG.sounds.flashbangVoice || CONFIG.sounds.badPowerUp, 1, "ability");

    window.setTimeout(() => {
      const start = performance.now();
      const whiteMs = cfg.flashbangWhiteMs ?? 2000;
      const blurMs = cfg.flashbangBlurMs ?? 5600;

      try {
        const canvas = canvasRef.current;
        if (canvas) {
          setFlashSnapshot(canvas.toDataURL("image/png"));
        }
      } catch {
        setFlashSnapshot("");
      }

      flashWhiteStartRef.current = start;
      flashWhiteUntilRef.current = start + whiteMs;
      flashBlurStartRef.current = start;
      flashBlurUntilRef.current = start + whiteMs + blurMs;

      setVisualEffectNow(start);
      tocarSom(CONFIG.sounds.flashbang || CONFIG.sounds.badPowerUp, 1, "sfx");

      setRandomVisualEffect((current) => ({
        ...current,
        flashWhite: true,
        flashBlur: true,
      }));

      window.setTimeout(() => {
        setRandomVisualEffect((current) => ({ ...current, flashWhite: false }));
      }, whiteMs);

      window.setTimeout(() => {
        setRandomVisualEffect((current) => ({ ...current, flashBlur: false }));
        setFlashSnapshot("");
      }, whiteMs + blurMs);
    }, delay);
  }

  function ativarTelaInvertidaAleatoria() {
    const now = performance.now();
    const duration = CONFIG.gameplay.powerups.invertScreenMs;
    const wasInactive = invertedUntilRef.current <= now;

    if (wasInactive) {
      invertedStartRef.current = now;
    }

    invertedUntilRef.current = Math.max(invertedUntilRef.current, now) + duration;
    setVisualEffectNow(now);
    tocarSom(CONFIG.sounds.invertScreen || CONFIG.sounds.badPowerUp, 0.85, "sfx");

    setRandomVisualEffect((current) => ({ ...current, inverted: true }));

    window.setTimeout(() => {
      if (performance.now() >= invertedUntilRef.current) {
        setRandomVisualEffect((current) => ({ ...current, inverted: false }));
      }
    }, duration + 80);
  }

  function ativarLentidaoAleatoria() {
    slowPlayerUntilRef.current = Math.max(slowPlayerUntilRef.current, performance.now()) +
      CONFIG.gameplay.powerups.randomBadSlowMs;
    tocarSom(CONFIG.sounds.slowPowerDown || CONFIG.sounds.badPowerUp, 0.5, "sfx");
  }

  function aplicarPowerUpAleatorio() {
    const cfg = CONFIG.gameplay.powerups;
    const roll = Math.random();

    tocarSom(CONFIG.sounds.randomPowerUp || CONFIG.sounds.powerUpPickup, 0.56, "ability");

    if (roll < cfg.randomComboChance) {
      aplicarPowerUp("fireRate");
      aplicarPowerUp(Math.random() < 0.34 ? "powerShot" : Math.random() < 0.5 ? "homingShot" : "flames");
      if (Math.random() < 0.25) aplicarPowerUp("shield");
      return;
    }

    if (roll < cfg.randomComboChance + cfg.randomBadChance) {
      const badRoll = Math.random();

      tocarSom(CONFIG.sounds.badPowerUp || CONFIG.sounds.playerDamage, 0.5, "hit");

      if (badRoll < 0.28) {
        ativarFlashbangAleatorio();
        return;
      }

      if (badRoll < 0.52) {
        receberDano(1);
        tocarSom(CONFIG.sounds.damagePowerDown || CONFIG.sounds.playerDamage, 0.45, "hit");
        return;
      }

      if (badRoll < 0.76) {
        ativarTelaInvertidaAleatoria();
        return;
      }

      ativarLentidaoAleatoria();
      return;
    }

    const goodOptions: PowerUpKind[] = [
      "fireRate",
      "powerShot",
      "homingShot",
      "flames",
    ];

    if (!shieldActiveRef.current) {
      goodOptions.push("shield");
    }

    if (playerRef.current.hp < CONFIG.gameplay.player.maxHp) {
      goodOptions.push("regen");
    }

    if (playerRef.current.hp <= 2) {
      goodOptions.push("tripleRegen");
    }

    if (playerRef.current.hp >= CONFIG.gameplay.player.maxHp && playerRef.current.goldenHp <= 0) {
      // MUITO raro até dentro do random.
      if (Math.random() < 0.035) {
        goodOptions.push("goldenHeart");
      }
    }

    aplicarPowerUp(goodOptions[Math.floor(Math.random() * goodOptions.length)]);
  }

  function aplicarPowerUp(kind: PowerUpKind) {
    const player = playerRef.current;
    const now = performance.now();
    const glowColor = powerUpColor(kind);
    powerGlowRef.current = {
      color: glowColor,
      endAt: now + CONFIG.gameplay.powerups.collectGlowMs,
    };

    tocarSom(CONFIG.sounds.powerUpPickup || CONFIG.sounds.abilityReady, 0.5, "ability");
    criarParticulasHit(player.x + player.w / 2, player.y + player.h / 2, glowColor, 18);

    if (kind === "randomBox") {
      aplicarPowerUpAleatorio();
      return;
    }

    if (kind === "goldenHeart") {
      if (player.hp < CONFIG.gameplay.player.maxHp || player.goldenHp > 0) {
        return;
      }

      player.goldenHp = Math.min(
        CONFIG.gameplay.powerups.goldenHeartMax,
        player.goldenHp + 2,
      );
      setGoldenHp(player.goldenHp);
      tocarSom(CONFIG.sounds.goldenHeart || CONFIG.sounds.powerUpPickup, 0.72, "ability");
      return;
    }

    if (kind === "regen") {
      player.hp = Math.min(CONFIG.gameplay.player.maxHp, player.hp + 1);
      setPlayerHp(player.hp);
      setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
      return;
    }

    if (kind === "tripleRegen") {
      player.hp = Math.min(CONFIG.gameplay.player.maxHp, player.hp + 3);
      setPlayerHp(player.hp);
      setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
      return;
    }

    if (kind === "shield") {
      shieldActiveRef.current = true;
      setShieldActive(true);
      return;
    }

    if (kind === "powerShot") {
      powerShotUntilRef.current = Math.max(powerShotUntilRef.current, now) +
        CONFIG.gameplay.powerups.powerShotDurationMs;
      return;
    }

    if (kind === "homingShot") {
      homingShotUntilRef.current = Math.max(homingShotUntilRef.current, now) +
        CONFIG.gameplay.powerups.homingShotDurationMs;
      return;
    }

    if (kind === "flames") {
      flamesUntilRef.current = Math.max(flamesUntilRef.current, now) +
        CONFIG.gameplay.powerups.flamesDurationMs;
      tocarSom(CONFIG.sounds.flamesStart || CONFIG.sounds.powerUpPickup, 0.58, "ability");
      return;
    }

    fireRateUntilRef.current = Math.max(fireRateUntilRef.current, now) +
      CONFIG.gameplay.powerups.fireRateDurationMs;
  }

  function atualizarPowerUpUi() {
    const now = performance.now();
    const active: ActivePowerUpUi[] = [];

    if (shieldActiveRef.current) {
      active.push({
        kind: "shield",
        label: "SHIELD",
        icon: CONFIG.uiImages.powerShield,
      });
    }

    if (fireRateUntilRef.current > now) {
      active.push({
        kind: "fireRate",
        label: "TIRO+",
        icon: CONFIG.uiImages.powerFireRate,
        remainingMs: fireRateUntilRef.current - now,
      });
    }

    if (powerShotUntilRef.current > now) {
      active.push({
        kind: "powerShot",
        label: "POWER",
        icon: CONFIG.uiImages.powerPowerShot,
        remainingMs: powerShotUntilRef.current - now,
      });
    }

    if (homingShotUntilRef.current > now) {
      active.push({
        kind: "homingShot",
        label: "HOMING",
        icon: CONFIG.uiImages.powerHomingShot,
        remainingMs: homingShotUntilRef.current - now,
      });
    }

    if (flamesUntilRef.current > now) {
      active.push({
        kind: "flames",
        label: "FLAMES",
        icon: CONFIG.uiImages.powerFlames,
        remainingMs: flamesUntilRef.current - now,
      });
    }

    if (flashBlurUntilRef.current > now) {
      active.push({
        kind: "badFlashbang",
        label: "FLASH",
        icon: CONFIG.uiImages.powerBadFlashbang,
        remainingMs: flashBlurUntilRef.current - now,
      });
    }

    if (invertedUntilRef.current > now) {
      active.push({
        kind: "badInvert",
        label: "INVERT",
        icon: CONFIG.uiImages.powerBadInvert,
        remainingMs: invertedUntilRef.current - now,
      });
    }

    if (slowPlayerUntilRef.current > now) {
      active.push({
        kind: "badSlow",
        label: "SLOW",
        icon: CONFIG.uiImages.powerBadSlow,
        remainingMs: slowPlayerUntilRef.current - now,
      });
    }

    setActivePowerUpsUi(active);
  }

  function cooldownTiroNormalAtual() {
    const now = performance.now();
    const flamesActive = flamesUntilRef.current > now;
    if (flamesActive) return 2;
    const fireRateActive = fireRateUntilRef.current > now;
    const powerShotActive = powerShotUntilRef.current > now;
    const multiplier =
      (fireRateActive ? CONFIG.gameplay.powerups.fireRateCooldownMultiplier : 1) *
      (powerShotActive ? CONFIG.gameplay.powerups.powerShotCooldownMultiplier : 1);

    return Math.max(
      6,
      Math.round(CONFIG.gameplay.shots.normal.cooldownFrames * multiplier),
    );
  }

  useEffect(() => {
    assetsRef.current.loadAll();
  }, []);

  useEffect(() => {
    // Evita que o VLibras do site principal apareça dentro do jogo.
    // Ele continua funcionando normalmente em /, mas fica oculto em /jogo.
    document.body.classList.add("game-page-active");

    const hideVlibras = () => {
      const selectors = [
        "[vw]",
        "[vw-access-button]",
        ".vlibras-container",
        "div[vw-plugin-wrapper]",
      ];

      for (const selector of selectors) {
        document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
          element.dataset.spaceNewsHidden = "true";
          element.style.setProperty("display", "none", "important");
          element.style.setProperty("pointer-events", "none", "important");
        });
      }
    };

    hideVlibras();
    const timer = window.setInterval(hideVlibras, 700);

    return () => {
      document.body.classList.remove("game-page-active");
      window.clearInterval(timer);

      document.querySelectorAll<HTMLElement>("[data-space-news-hidden='true']").forEach((element) => {
        element.style.removeProperty("display");
        element.style.removeProperty("pointer-events");
        delete element.dataset.spaceNewsHidden;
      });
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now();

      if (
        flashWhiteUntilRef.current > now ||
        flashBlurUntilRef.current > now ||
        invertedUntilRef.current > now ||
        randomVisualEffect.flashWhite ||
        randomVisualEffect.flashBlur ||
        randomVisualEffect.inverted
      ) {
        setVisualEffectNow(now);
      }
    }, 33);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    randomVisualEffect.flashWhite,
    randomVisualEffect.flashBlur,
    randomVisualEffect.inverted,
  ]);


  useEffect(() => {
    const shouldTalk = gameState === "tutorial" || gameState === "tutorialChoice";

    if (!shouldTalk) {
      setDanielMouthOpen(false);
      return;
    }

    const timer = window.setInterval(() => {
      setDanielMouthOpen((current) => !current);
    }, 135);

    return () => window.clearInterval(timer);
  }, [gameState, tutorialStep]);

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

    function aplicarPixelArt(ctx: CanvasRenderingContext2D) {
      ctx.imageSmoothingEnabled = false;

      const pixelCtx = ctx as CanvasRenderingContext2D & {
        webkitImageSmoothingEnabled?: boolean;
        mozImageSmoothingEnabled?: boolean;
        msImageSmoothingEnabled?: boolean;
      };

      pixelCtx.webkitImageSmoothingEnabled = false;
      pixelCtx.mozImageSmoothingEnabled = false;
      pixelCtx.msImageSmoothingEnabled = false;
    }

    renderCanvas.width = CONFIG.canvasWidth;
    renderCanvas.height = CONFIG.canvasHeight;
    aplicarPixelArt(renderCtx);

    let animationFrame = 0;
    let lastTime = performance.now();

    function encontrarAlvoMaisProximo(x: number, y: number) {
      let best: { x: number; y: number; distance: number } | null = null;

      for (const enemy of enemiesRef.current) {
        if (enemy.hp <= 0 || enemy.kind === "fragment") continue;
        const cx = enemy.x + enemy.w / 2;
        const cy = enemy.y + enemy.h / 2;
        const distance = Math.hypot(cx - x, cy - y);
        if (!best || distance < best.distance) {
          best = { x: cx, y: cy, distance };
        }
      }

      const boss = bossRef.current;
      if (boss.active && !boss.intro && boss.hp > 0) {
        const bossBox = getBossHitbox();
        const cx = bossBox.x + bossBox.w * 0.22;
        const cy = bossBox.y + bossBox.h / 2;
        const distance = Math.hypot(cx - x, cy - y);
        if (!best || distance < best.distance) {
          best = { x: cx, y: cy, distance };
        }
      }

      return best;
    }

    function usarFlames() {
      const player = playerRef.current;
      const now = performance.now();
      const cfg = CONFIG.gameplay.powerups;
      const powerActive = powerShotUntilRef.current > now;
      const homingActive = homingShotUntilRef.current > now;
      const baseX = player.x + player.w - 8;
      const baseY = player.y + player.h / 2;
      let dir = { x: 1, y: 0 };
      const target = homingActive ? encontrarAlvoMaisProximo(baseX, baseY) : null;

      if (target) {
        const dx = target.x - baseX;
        const dy = target.y - baseY;
        const len = Math.max(0.001, Math.hypot(dx, dy));
        if (len <= cfg.flamesHomingRange) {
          dir = { x: dx / len, y: dy / len };
        }
      }

      const range = cfg.flamesRange * (powerActive ? 1.18 : 1);
      const cone = cfg.flamesConeWidth * (powerActive ? 1.45 : 1);
      const damage = (cfg.flamesDamagePerSecond / 30) * (powerActive ? 3 : 1);
      const killed = new Set<number>();

      const damageEnemy = (enemy: Enemy) => {
        if (enemy.hp <= 0 || killed.has(enemy.id)) return;
        const cx = enemy.x + enemy.w / 2;
        const cy = enemy.y + enemy.h / 2;
        const dx = cx - baseX;
        const dy = cy - baseY;
        const forward = dx * dir.x + dy * dir.y;
        if (forward < -12 || forward > range) return;

        // Hitbox do Flames: cápsula/cone controlado, não um retângulo gigante.
        // Isso evita acertar inimigo muito acima/abaixo só porque a partícula apareceu perto.
        const side = Math.abs(dx * -dir.y + dy * dir.x);
        const enemyRadius = Math.max(10, Math.min(enemy.w, enemy.h) * 0.34);
        const allowedSide = 18 + cone * (0.16 + 0.42 * (forward / range)) + enemyRadius;
        if (side > allowedSide) return;

        const applied = Math.min(damage, Math.max(0, enemy.hp));
        enemy.hp -= damage;
        carregarBoostPorDano(applied);
        if (enemy.kind === "asteroid" && enemy.hp <= enemy.maxHp / 2) enemy.cracked = true;
        criarParticulasHit(cx, cy, powerActive ? "#ff7a18" : "#fb923c", 3);
        if (enemy.hp <= 0) {
          killed.add(enemy.id);
          registrarAbate(enemy.kind);
          tentarSpawnPowerUp(cx, cy);
          if (enemy.kind === "asteroid") {
            spawnAsteroidFragments(enemy);
          } else {
            criarExplosao(cx, cy, "#fb923c", 12);
            tocarSom(CONFIG.sounds.enemyDeath, 0.34, "hit");
          }
        }
      };

      enemiesRef.current.forEach(damageEnemy);
      if (killed.size > 0) {
        enemiesRef.current = enemiesRef.current.filter((enemy) => !killed.has(enemy.id));
      }

      const boss = bossRef.current;
      if (boss.active && !boss.intro && boss.hp > 0) {
        const box = getBossHitbox();
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;
        const dx = cx - baseX;
        const dy = cy - baseY;
        const forward = dx * dir.x + dy * dir.y;
        const side = Math.abs(dx * -dir.y + dy * dir.x);
        if (forward >= -18 && forward <= range && side <= cone * 0.72) {
          const applied = Math.min(damage, Math.max(0, boss.hp));
          boss.hp -= damage;
          carregarBoostPorDano(applied);
          criarParticulasHit(baseX + dir.x * Math.min(range, forward), baseY + dir.y * Math.min(range, forward), "#ff7a18", 3);
          if (boss.hp <= 0) boss.hp = 0;
        }
      }

      // Chama densa: muitas partículas coladas, sem branco, com glow quente.
      const particleQuality = CONFIG.settings.enableParticles ? CONFIG.settings.particleQuality : 0;
      const isMobileLike = window.matchMedia("(pointer: coarse)").matches;
      const particleAmount = Math.round(
        Math.min(
          isMobileLike ? 12 : 24,
          cfg.flamesParticleAmount * (powerActive ? 1.12 : 1) * particleQuality,
        ),
      );
      const flameColors = ["#ff2f00", "#ff5a00", "#ff7a18", "#fb923c", "#f97316", "#facc15"];
      for (let i = 0; i < particleAmount; i += 1) {
        const progress = Math.pow(Math.random(), 0.62);
        const dist = 18 + progress * range;
        const widthAtPoint = cone * (0.12 + 0.78 * progress);
        const spread = rand(-widthAtPoint, widthAtPoint);
        const jitter = rand(-5, 5);
        const px = baseX + dir.x * dist + -dir.y * spread + dir.x * jitter;
        const py = baseY + dir.y * dist + dir.x * spread + dir.y * jitter;
        const core = Math.random() < 0.36;
        const ember = Math.random() < 0.18;
        const color = flameColors[Math.floor(Math.random() * flameColors.length)];

        particlesRef.current.push({
          id: enemyIdRef.current++,
          x: px,
          y: py,
          vx: dir.x * rand(0.7, 4.4) + -dir.y * rand(-2.2, 2.2),
          vy: dir.y * rand(0.7, 4.4) + dir.x * rand(-2.2, 2.2) + rand(-1.9, 0.35),
          size: core ? rand(8, powerActive ? 18 : 14) : ember ? rand(3, 6) : rand(5, powerActive ? 14 : 11),
          life: core ? rand(150, 290) : rand(220, 520),
          maxLife: 520,
          color,
        });

      }

      const maxLiveParticles = isMobileLike ? 90 : 170;
      if (particlesRef.current.length > maxLiveParticles) {
        particlesRef.current = particlesRef.current.slice(-maxLiveParticles);
      }

      if (now - lastFlamesHitSoundAtRef.current > 180) {
        lastFlamesHitSoundAtRef.current = now;
        tocarSom(CONFIG.sounds.flamesLoop || CONFIG.sounds.normalShot, 0.22, "sfx");
      }
    }

    function shootNormal() {
      const player = playerRef.current;

      if (!acaoTutorialPermitida("shot")) {
        return;
      }

      if (player.normalCooldown > 0) {
        return;
      }

      const now = performance.now();
      if (flamesUntilRef.current > now) {
        usarFlames();
        player.normalCooldown = cooldownTiroNormalAtual();
        return;
      }
      const powerActive = powerShotUntilRef.current > now;
      const homingActive = homingShotUntilRef.current > now;
      const shotSpeed = CONFIG.gameplay.shots.normal.speed;
      const shotW = powerActive
        ? CONFIG.gameplay.powerups.powerShotWidth
        : CONFIG.gameplay.shots.normal.width;
      const shotH = powerActive
        ? CONFIG.gameplay.powerups.powerShotHeight
        : CONFIG.gameplay.shots.normal.height;

      shotsRef.current.push({
        id: shotIdRef.current++,
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: player.x + player.w - 2,
        y: player.y + player.h / 2 - shotH / 2,
        w: shotW,
        h: shotH,
        speed: shotSpeed,
        damage:
          CONFIG.gameplay.shots.normal.damage *
          (powerActive ? CONFIG.gameplay.powerups.powerShotDamageMultiplier : 1),
        type: "normal",
        variant: powerActive && homingActive ? "powerHoming" : powerActive ? "power" : homingActive ? "homing" : "normal",
        vx: shotSpeed,
        vy: 0,
      });

      tocarSom(CONFIG.sounds.normalShot, 0.45, "sfx");
      player.normalCooldown = cooldownTiroNormalAtual();

      // No tutorial, o passo de tiro normal só avança quando o alvo de treino for destruído.
    }

    function shootStrong(dirXParam = 1, dirYParam = 0) {
      const player = playerRef.current;
      const now = performance.now();
      const dir = normalizarDirecao(dirXParam, dirYParam);

      if (!acaoTutorialPermitida("strong")) {
        return;
      }

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
        vx: dir.x * CONFIG.gameplay.shots.strong.speed,
        vy: dir.y * CONFIG.gameplay.shots.strong.speed,
      });

      tocarSom(CONFIG.sounds.strongShot, 0.5, "sfx");

      player.strongReadyAt = now + CONFIG.gameplay.shots.strong.cooldownMs;
      setStrongReadyRatio(0);
      player.vx -= dir.x * CONFIG.gameplay.player.strongShotRecoil;
      player.vy -= dir.y * CONFIG.gameplay.player.strongShotRecoil;
      player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
      player.stretchVx =
        -dir.x *
        Math.max(
          CONFIG.gameplay.player.maxSpeedX,
          CONFIG.gameplay.player.maxSpeedY,
        ) * CONFIG.gameplay.dynamicStretch.playerPulseSpeedScale;
      player.stretchVy =
        -dir.y *
        Math.max(
          CONFIG.gameplay.player.maxSpeedX,
          CONFIG.gameplay.player.maxSpeedY,
        ) * CONFIG.gameplay.dynamicStretch.playerPulseSpeedScale;

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

      // No tutorial, o passo de tiro forte só avança quando o alvo blindado for destruído.
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
      delta: number,
    ) {
      const estadoAtual = gameStateRef.current;
      const deveDesenharGameplayBg =
        estadoAtual === "playing" ||
        estadoAtual === "tutorial" ||
        estadoAtual === "paused" ||
        estadoAtual === "gameOverCutscene" ||
        estadoAtual === "gameOver";

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!deveDesenharGameplayBg) {
        return;
      }

      const bg = assetsRef.current.get("background");

      if (CONFIG.useSprites && bg) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // O arquivo space.png é um panorama 1028x256.
        // Ele é escalado pela altura do canvas e repetido em loop horizontal.
        const sourceW = 1028;
        const sourceH = 256;
        const scale = canvas.height / sourceH;
        const tileW = sourceW * scale;
        const tileH = canvas.height;
        const speed = 34; // px por segundo, em coordenada de tela.
        if (gameStateRef.current === "playing" || gameStateRef.current === "tutorial") {
          backgroundOffsetRef.current =
            (backgroundOffsetRef.current + (speed * delta) / 1000) % tileW;
        }
        const offset = -backgroundOffsetRef.current;

        for (let x = offset - tileW; x < canvas.width + tileW; x += tileW) {
          ctx.drawImage(bg, Math.round(x), 0, Math.ceil(tileW), tileH);
        }

        ctx.restore();
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
      const chargingAbility =
        boostAimRef.current.active && gameStateRef.current === "playing";
      const chargeShake = chargingAbility ? 1 + Math.sin(now * 0.018) * 0.7 : 0;
      const chargeJitterX = chargingAbility ? Math.sin(now * 0.075) * chargeShake : 0;
      const chargeJitterY = chargingAbility ? Math.cos(now * 0.068) * chargeShake : 0;
      ctx.translate(
        player.x + player.w / 2 + chargeJitterX,
        player.y + player.h / 2 + chargeJitterY,
      );

      if (gameStateRef.current === "gameOverCutscene") {
        const elapsed = performance.now() - gameOverStartedAtRef.current;
        const intensity = clamp(
          elapsed / CONFIG.gameplay.gameOver.bigExplosionMs,
          0,
          1,
        );
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

      if (shieldActiveRef.current) {
        const t = now * 0.006;
        const rX = player.w * (0.68 + Math.sin(t) * 0.018);
        const rY = player.h * (0.74 + Math.cos(t * 1.2) * 0.02);
        ctx.save();
        ctx.globalAlpha = 0.48 + Math.sin(t * 2) * 0.12;
        ctx.strokeStyle = "#a7f3d0";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#67e8f9";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.14;
        ctx.fillStyle = "#67e8f9";
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    }

    function desenharTiro(ctx: CanvasRenderingContext2D, shot: Shot) {
      const key: SpriteKey =
        shot.type === "strong"
          ? "strongShot"
          : shot.variant === "powerHoming"
            ? "powerHomingProjectile"
            : shot.variant === "power"
              ? "powerShot"
              : shot.variant === "homing"
              ? "homingShot"
              : "normalShot";

      const img = assetsRef.current.get(key);
      const color =
        shot.type === "strong"
          ? CONFIG.colors.strongShot
          : shot.variant === "powerHoming"
            ? "#f0abfc"
            : shot.variant === "power"
              ? "#f59e0b"
              : shot.variant === "homing"
              ? "#22d3ee"
              : CONFIG.colors.normalShot;

      if (!img) {
        drawShotFallbackSprite(ctx, shot, color);
        return;
      }

      drawVelocityStretchedImage(
        ctx,
        img,
        shot.x,
        shot.y,
        shot.w,
        shot.h,
        shot.vx ?? shot.speed,
        shot.vy ?? 0,
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
      if (kind === "alien") return "enemyAlien";
      if (kind === "fragment") return "asteroidFragment";
      return "asteroid";
    }

    function desenharEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy) {
      const key: SpriteKey =
        enemy.kind === "asteroid" && enemy.cracked
          ? "asteroidCracked"
          : enemy.kind === "black" && enemy.age < enemy.windUpMs
            ? "enemyBlackWindup"
            : getEnemySpriteKey(enemy.kind);

      const config = ASSETS[key];
      let img = assetsRef.current.get(key);

      // Animação por imagens separadas.
      // Se o inimigo tiver frameSrcs, o jogo alterna entre os arquivos individuais.
      if (assetsRef.current.hasFrames(key) && config.frames && config.fps) {
        const frameMs = 1000 / config.fps;
        const frameIndex = Math.floor(enemy.age / frameMs);
        img = assetsRef.current.getFrame(key, frameIndex) ?? img;
      }

      const rotation =
        (enemy.rotation ?? 0) + ((enemy.tilt ?? 0) * Math.PI) / 180;
      const fallbackColor =
        enemy.kind === "red"
          ? CONFIG.colors.redEnemy
          : enemy.kind === "black"
            ? CONFIG.colors.blackEnemy
            : enemy.kind === "purple"
              ? CONFIG.colors.purpleEnemy
              : enemy.kind === "alien"
                ? "#22c55e"
                : enemy.kind === "fragment"
                  ? "#b79a6b"
                  : CONFIG.colors.asteroid;

      // O sprite do alien já inclui o feixe, então não desenhamos feixe extra.

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

    function atualizarShockwaves(delta: number) {
      shockwavesRef.current = shockwavesRef.current
        .map((wave) => ({ ...wave, life: wave.life - delta }))
        .filter((wave) => wave.life > 0);
    }

    function desenharShockwaves(ctx: CanvasRenderingContext2D) {
      ctx.save();
      for (const wave of shockwavesRef.current) {
        const progress = 1 - clamp(wave.life / wave.maxLife, 0, 1);
        const radius = wave.radius * progress;
        const alpha = Math.pow(1 - progress, 1.35);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#fff1a8";
        ctx.lineWidth = 8;
        ctx.shadowColor = "#ffb703";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function getBossHitbox() {
      const boss = bossRef.current;
      return {
        x: boss.x + boss.w * 0.12,
        y: boss.y + boss.h * 0.06,
        w: boss.w * 0.78,
        h: boss.h * 0.88,
      };
    }

    function spawnBossServoPair(count: number) {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const player = playerRef.current;
      const safeCount = Math.max(2, count + (count % 2));
      const pairs = safeCount / 2;

      for (let i = 0; i < pairs; i++) {
        const offsets = cfg.attackOffsets.servoPair;
        const spacing = offsets.spacing;
        const topY = boss.y + offsets.topY + i * spacing;
        const bottomY = boss.y + boss.h + offsets.bottomY - i * spacing;
        const spawnX = boss.x + offsets.x;
        const waveDelay = Math.floor(i / 2) * 260;

        for (const y of [topY, bottomY]) {
          const dx = player.x + player.w / 2 - spawnX;
          const dy = player.y + player.h / 2 - y;
          const len = Math.max(1, Math.hypot(dx, dy));
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "servo",
            x: spawnX,
            y,
            w: 34,
            h: 34,
            vx: (dx / len) * cfg.servoSpeed,
            vy: (dy / len) * cfg.servoSpeed,
            damage: cfg.servoDamage,
            life: cfg.servoBulletLifeMs + waveDelay,
            maxLife: cfg.servoBulletLifeMs + waveDelay,
            activeAt: performance.now() + waveDelay,
            homingUntil: performance.now() + waveDelay + cfg.servoHomingMs,
            returnAt: performance.now() + waveDelay + cfg.servoReturnAtMs,
            speed: cfg.servoSpeed,
          });
        }
      }

      tocarSom(CONFIG.sounds.chocadoServo, 0.5, "sfx");
    }

    function spawnBossLaser(pattern: "x" | "triple") {
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const life = cfg.laserTelegraphMs + cfg.laserActiveMs;

      if (pattern === "x") {
        const offsets = cfg.attackOffsets.laserX;
        const centerX = CONFIG.canvasWidth / 2 + offsets.x;
        const centerY = CONFIG.canvasHeight / 2 + offsets.y;
        for (const angle of [0.43, -0.43]) {
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "laser",
            x: centerX,
            y: centerY,
            w: 1740,
            h: cfg.laserThicknessX,
            vx: 0,
            vy: 0,
            damage: cfg.laserDamage,
            life,
            maxLife: life,
            angle,
            activeAt: now + cfg.laserTelegraphMs,
          });
        }
      } else {
        const offsets = cfg.attackOffsets.tripleLaser;
        const lanes = offsets.lanesY.map((laneY) => laneY + offsets.y);
        for (const y of lanes) {
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "laser",
            x: CONFIG.canvasWidth / 2 + offsets.x,
            y,
            w: 1740,
            h: cfg.laserThicknessTriple,
            vx: 0,
            vy: 0,
            damage: cfg.laserDamage,
            life,
            maxLife: life,
            angle: 0,
            activeAt: now + cfg.laserTelegraphMs,
          });
        }
      }

      tocarSom(CONFIG.sounds.chocadoLaser, 0.55, "sfx");
    }

    function spawnBossCannonBurst() {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const offsets = cfg.attackOffsets.cannon;
      const cannons = [
        boss.y + offsets.topY,
        boss.y + boss.h / 2 + offsets.middleY,
        boss.y + boss.h + offsets.bottomY,
      ];
      const now = performance.now();
      let delay = 0;

      for (let volley = 0; volley < 4; volley++) {
        for (const y of cannons) {
          const wobble = (volley - 1.5) * 0.45;
          const angle = Math.PI + wobble * 0.18;
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "orb",
            x: boss.x + offsets.x,
            y,
            w: volley === 1 ? 34 : 26,
            h: volley === 1 ? 34 : 26,
            vx: Math.cos(angle) * cfg.cannonOrbSpeed,
            vy: Math.sin(angle) * cfg.cannonOrbSpeed,
            damage: cfg.cannonOrbDamage,
            life: 5200 + delay,
            maxLife: 5200 + delay,
            activeAt: now + delay,
          });
        }
        delay += 180;
      }

      tocarSom(CONFIG.sounds.chocadoCannon, 0.5, "sfx");
    }

    function spawnBossServoWaveAttack() {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const count = Math.max(
        2,
        Math.floor(rand(cfg.servoWaveCountMin, cfg.servoWaveCountMax + 1) / 2) * 2,
      );
      const pairs = count / 2;
      const offsets = cfg.attackOffsets.servoWave;
      const topStart = boss.y + offsets.topY;
      const bottomStart = boss.y + boss.h + offsets.bottomY;
      const topTarget = CONFIG.canvasHeight - cfg.servoWaveSize + offsets.topTargetY;
      const bottomTarget = offsets.bottomTargetY;
      const spawnX = boss.x + offsets.x;

      for (let i = 0; i < pairs; i++) {
        const delay = i * 110;
        for (const variant of [0, 1]) {
          const fromTop = variant === 0;
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "servoWave",
            x: spawnX + i * 4,
            y: fromTop ? topStart : bottomStart,
            w: cfg.servoWaveSize,
            h: cfg.servoWaveSize,
            vx: -cfg.servoWaveSpeed,
            vy: 0,
            damage: cfg.servoDamage,
            life: cfg.servoWaveLifeMs + delay,
            maxLife: cfg.servoWaveLifeMs + delay,
            activeAt: now + delay,
            speed: cfg.servoWaveSpeed,
            startY: fromTop ? topStart : bottomStart,
            targetY: fromTop ? topTarget : bottomTarget,
            travelMs: cfg.servoWaveTravelMs,
            phase: fromTop ? 0 : Math.PI,
          });
        }
      }
      tocarSom(CONFIG.sounds.chocadoServo, 0.55, "sfx");
    }

    function spawnBossAimedLaser() {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const player = playerRef.current;
      const offsets = cfg.attackOffsets.aimLaser;
      const originX = boss.x + offsets.x;
      const originY = boss.y + boss.h / 2 + offsets.y;
      const dx = player.x + player.w / 2 - originX;
      const dy = player.y + player.h / 2 - originY;

      bossProjectilesRef.current.push({
        id: bossProjectileIdRef.current++,
        kind: "aimLaser",
        x: originX,
        y: originY,
        w: cfg.aimLaserLength,
        h: cfg.aimLaserThickness,
        vx: 0,
        vy: 0,
        damage: cfg.laserDamage,
        life: cfg.aimLaserWindupMs + cfg.aimLaserActiveMs,
        maxLife: cfg.aimLaserWindupMs + cfg.aimLaserActiveMs,
        angle: Math.atan2(dy, dx),
        aimX: player.x + player.w / 2,
        aimY: player.y + player.h / 2,
        activeAt: now + cfg.aimLaserWindupMs,
        locked: false,
      });
      tocarSom(CONFIG.sounds.chocadoLaser, 0.46, "sfx");
    }

    function iniciarProximoAtaqueDoBoss() {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const enraged = boss.hp <= cfg.enragedHp;
      const rate = enraged ? cfg.enragedAttackRate : 1;
      const now = performance.now();

      // Ataques randomizados, evitando repetir o mesmo padrão duas vezes seguidas.
      const previousAttack = boss.attackIndex;
      const possibleAttacks = [0, 1, 2, 3].filter(
        (attackId) => attackId !== previousAttack,
      );
      const attack = possibleAttacks[
        Math.floor(Math.random() * possibleAttacks.length)
      ];

      if (attack === 0) {
        const evenCount = Math.max(
          2,
          Math.floor(rand(cfg.servoCountMin, cfg.servoCountMax + 1) / 2) * 2,
        );
        spawnBossServoPair(evenCount);
        boss.nextAttackAt = now + rand(2200, 3100) * rate;
      } else if (attack === 1) {
        spawnBossLaser(Math.random() < 0.5 ? "x" : "triple");
        boss.nextAttackAt =
          now + (cfg.laserTelegraphMs + cfg.laserActiveMs + rand(850, 1450)) * rate;
      } else if (attack === 2) {
        spawnBossServoWaveAttack();
        boss.nextAttackAt = now + rand(2700, 3800) * rate;
      } else {
        spawnBossAimedLaser();
        boss.nextAttackAt =
          now + (cfg.aimLaserWindupMs + cfg.aimLaserActiveMs + rand(800, 1400)) * rate;
      }

      boss.attackIndex = attack;
    }

    function atualizarBoss(delta: number) {
      const boss = bossRef.current;
      if (!boss.active) return;

      const now = performance.now();
      const cfg = CONFIG.gameplay.boss.chocado;
      boss.age += delta;
      boss.y =
        (CONFIG.canvasHeight - boss.h) / 2 +
        Math.sin(boss.age * cfg.floatSpeed) * cfg.floatAmplitude;

      if (boss.intro) {
        const introElapsed = now - boss.introStartedAt;
        if (introElapsed >= cfg.introBarMs && !boss.roarDone) {
          boss.roarDone = true;
          tocarSom(CONFIG.sounds.chocadoRoar, 0.72, "sfx");
          if (CONFIG.settings.enableScreenShake) {
            shakeRef.current = { intensity: 12, endAt: now + cfg.introRoarMs };
          }
        }
        if (introElapsed >= cfg.introBarMs + cfg.introRoarMs) {
          boss.intro = false;
          boss.battleStartedAt = now;
          boss.nextAttackAt = now + cfg.attackDelayMs;
          mostrarMensagemWave("BATALHA INICIADA", true);
        }
      } else if (now >= boss.nextAttackAt) {
        iniciarProximoAtaqueDoBoss();
      }

      if (boss.hp <= 0 && !boss.defeated) {
        boss.defeated = true;
        boss.active = false;
        bossProjectilesRef.current = [];
        pararMusicaChocado(true);
        tocarSom(
          CONFIG.sounds.chocadoDefeat || CONFIG.sounds.enemyDeath,
          0.72,
          "hit",
        );
        criarExplosao(boss.x + boss.w / 2, boss.y + boss.h / 2, "#ffe18c", 72);
        adicionarPontuacao(CONFIG.gameplay.score.bossWaveClear);
        mostrarMensagemWave("CHOCADO DERROTADO", true);
      }
    }

    function atualizarBossProjectiles(delta: number) {
      const now = performance.now();
      const speedFactor = delta / 16.67;
      const player = playerRef.current;

      bossProjectilesRef.current = bossProjectilesRef.current
        .map((projectile) => {
          const updated = { ...projectile, life: projectile.life - delta };
          if (updated.activeAt && now < updated.activeAt && updated.kind !== "laser" && updated.kind !== "aimLaser") {
            return updated;
          }

          if (updated.kind === "servo") {
            const boss = bossRef.current;
            const shouldReturn = Boolean(updated.returnAt && now >= updated.returnAt && boss.active && boss.hp > 0);
            if (shouldReturn) {
              updated.returning = true;
              const targetX = boss.x + boss.w * 0.28;
              const targetY = boss.y + boss.h * 0.5;
              const dx = targetX - (updated.x + updated.w / 2);
              const dy = targetY - (updated.y + updated.h / 2);
              const len = Math.max(1, Math.hypot(dx, dy));
              const speed = (updated.speed ?? CONFIG.gameplay.boss.chocado.servoSpeed) * 1.22;
              updated.vx += ((dx / len) * speed - updated.vx) * 0.13;
              updated.vy += ((dy / len) * speed - updated.vy) * 0.13;
            } else if (updated.homingUntil && now < updated.homingUntil) {
              const dx = player.x + player.w / 2 - (updated.x + updated.w / 2);
              const dy = player.y + player.h / 2 - (updated.y + updated.h / 2);
              const len = Math.max(1, Math.hypot(dx, dy));
              const speed = updated.speed ?? CONFIG.gameplay.boss.chocado.servoSpeed;
              updated.vx += ((dx / len) * speed - updated.vx) * 0.105;
              updated.vy += ((dy / len) * speed - updated.vy) * 0.105;
            }
          }

          if (updated.kind === "servoWave") {
            const travelMs = Math.max(350, updated.travelMs ?? 1800);
            const activeElapsed = Math.max(
              0,
              now - (updated.activeAt ?? now),
            );
            const ping = (activeElapsed % (travelMs * 2)) / travelMs;
            const t = ping <= 1 ? ping : 2 - ping;
            const eased = 0.5 - Math.cos(t * Math.PI) * 0.5;
            const startY = updated.startY ?? updated.y;
            const targetY = updated.targetY ?? updated.y;
            const nextY = startY + (targetY - startY) * eased;
            updated.vy = (nextY - updated.y) / Math.max(0.001, speedFactor);
            updated.y = nextY;
          }

          if (updated.kind === "aimLaser") {
            const activeAt = updated.activeAt ?? now;
            const active = now >= activeAt;
            const cfg = CONFIG.gameplay.boss.chocado;
            const lockAt = activeAt - (cfg.aimLaserLockBeforeMs ?? 380);

            if (!active && now < lockAt) {
              const targetX = player.x + player.w / 2;
              const targetY = player.y + player.h / 2;
              const follow = cfg.aimLaserFollow;
              updated.aimX = (updated.aimX ?? targetX) + (targetX - (updated.aimX ?? targetX)) * follow;
              updated.aimY = (updated.aimY ?? targetY) + (targetY - (updated.aimY ?? targetY)) * follow;

              const dx = updated.aimX - updated.x;
              const dy = updated.aimY - updated.y;
              const target = Math.atan2(dy, dx);
              const current = updated.angle ?? target;
              const diff = Math.atan2(Math.sin(target - current), Math.cos(target - current));
              updated.angle = current + diff * Math.min(0.2, follow * 1.45);
            } else if (!active) {
              updated.locked = true;
            } else {
              if (CONFIG.settings.enableScreenShake) {
                shakeRef.current = {
                  intensity: cfg.aimLaserShake,
                  endAt: performance.now() + 95,
                };
              }
            }
          }

          if (updated.kind === "laser") {
            const active = !updated.activeAt || now >= updated.activeAt;
            if (active && CONFIG.settings.enableScreenShake) {
              shakeRef.current = {
                intensity: CONFIG.gameplay.boss.chocado.laserShake ?? 3.2,
                endAt: performance.now() + 70,
              };
            }
          }

          if (updated.kind !== "laser" && updated.kind !== "aimLaser") {
            updated.x += updated.vx * speedFactor;
            if (updated.kind !== "servoWave") {
              updated.y += updated.vy * speedFactor;
            }
          }

          return updated;
        })
        .filter((projectile) => {
          if (projectile.kind === "servo" && projectile.returning && bossRef.current.active && bossRef.current.hp > 0) {
            const bossHitbox = getBossHitbox();
            if (rectsCollide(projectile, bossHitbox)) {
              const dano = CONFIG.gameplay.boss.chocado.servoReturnDamage;
              bossRef.current.hp = Math.max(0, bossRef.current.hp - dano);
              carregarBoostPorDano(dano);
              criarExplosao(projectile.x + projectile.w / 2, projectile.y + projectile.h / 2, "#ffb703", 14);
              tocarSom(CONFIG.sounds.enemyHit, 0.35, "hit");
              return false;
            }
          }
          if (projectile.life <= 0) return false;
          if (projectile.kind === "laser" || projectile.kind === "aimLaser") return true;
          return (
            projectile.x > -180 &&
            projectile.x < CONFIG.canvasWidth + 180 &&
            projectile.y > -180 &&
            projectile.y < CONFIG.canvasHeight + 180
          );
        });
    }

    function desenharBoss(ctx: CanvasRenderingContext2D) {
      const boss = bossRef.current;
      if (!boss.active) return;

      const cfg = CONFIG.gameplay.boss.chocado;
      const bossFrameIndex = Math.floor(
        (boss.age / Math.max(1, 1000 / (ASSETS.chocado.fps ?? 7))) %
          Math.max(1, ASSETS.chocado.frames ?? 1),
      );
      const img =
        assetsRef.current.getFrame("chocado", bossFrameIndex) ??
        assetsRef.current.get("chocado");
      const progress = boss.intro
        ? clamp(
            (performance.now() - boss.introStartedAt) / cfg.introBarMs,
            0,
            1,
          )
        : clamp(boss.hp / boss.maxHp, 0, 1);

      ctx.save();
      ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
      ctx.rotate(Math.sin(boss.age * 0.003) * 0.018);

      if (CONFIG.useSprites && img) {
        ctx.drawImage(img, -boss.w / 2, -boss.h / 2, boss.w, boss.h);
      } else {
        ctx.fillStyle = "#3a1028";
        ctx.fillRect(-boss.w / 2, -boss.h / 2, boss.w, boss.h);
        ctx.fillStyle = "#f8e7b0";
        ctx.fillRect(-boss.w / 2 - 24, -boss.h * 0.32, 62, 28);
        ctx.fillRect(-boss.w / 2 - 24, -14, 86, 32);
        ctx.fillRect(-boss.w / 2 - 24, boss.h * 0.32, 62, 28);
      }
      ctx.restore();

      // Barra de vida do boss no topo.
      const barW = 760;
      const barH = 24;
      const barX = (CONFIG.canvasWidth - barW) / 2;
      const barY = 20;
      ctx.save();
      ctx.fillStyle = "rgba(8, 3, 10, 0.88)";
      ctx.fillRect(barX - 10, barY - 4, barW + 20, 78);
      ctx.strokeStyle = "#f8e7b0";
      ctx.lineWidth = 4;
      ctx.strokeRect(barX - 10, barY - 4, barW + 20, 78);
      ctx.fillStyle = "#fff7e6";
      ctx.font = `30px ${CONFIG.fonts.menu}`;
      ctx.textAlign = "center";
      ctx.fillText("CHOCADO", CONFIG.canvasWidth / 2, barY + 4);
      ctx.fillStyle = "#1b0612";
      ctx.fillRect(barX, barY + 18, barW, barH);
      const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      gradient.addColorStop(0, "#ff3355");
      gradient.addColorStop(0.55, "#ffb703");
      gradient.addColorStop(1, "#fff1a8");
      ctx.fillStyle = gradient;
      ctx.fillRect(barX, barY + 18, barW * progress, barH);
      ctx.strokeStyle = "#f8e7b0";
      ctx.strokeRect(barX, barY + 18, barW, barH);
      ctx.fillStyle = "#f8e7b0";
      ctx.font = `18px ${CONFIG.fonts.ui}`;
      const hpText = boss.intro
        ? "CARREGANDO..."
        : `${Math.ceil(Math.max(0, boss.hp))} / ${boss.maxHp} HP`;
      ctx.fillText(hpText, CONFIG.canvasWidth / 2, barY + 66);
      ctx.restore();
    }

    function desenharBossProjectile(
      ctx: CanvasRenderingContext2D,
      projectile: BossProjectile,
    ) {
      const now = performance.now();
      const active = !projectile.activeAt || now >= projectile.activeAt;
      if (!active && projectile.kind !== "laser" && projectile.kind !== "aimLaser") {
        return;
      }

      if (projectile.kind === "laser" || projectile.kind === "aimLaser") {
        const isAim = projectile.kind === "aimLaser";
        const activeTime = Math.max(0, performance.now() - (projectile.activeAt ?? 0));
        const pulse = active ? 1 + Math.sin(activeTime * (isAim ? 0.11 : 0.095)) * (isAim ? 0.26 : 0.18) : 1;
        const drawHeight = projectile.h * pulse;

        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(projectile.angle ?? 0);
        if (isAim) {
          ctx.translate(projectile.w / 2, 0);
        }
        ctx.globalAlpha = active ? 0.94 : isAim ? 0 : 0.24;
        if (active || !isAim) {
          ctx.fillStyle = active ? "#ffd166" : "#fff1a8";
          ctx.fillRect(
            -projectile.w / 2,
            -drawHeight / 2,
            projectile.w,
            drawHeight,
          );
          ctx.fillStyle = active ? "#fff7e6" : "#f8e7b0";
          ctx.fillRect(-projectile.w / 2, -Math.max(5, drawHeight * 0.08), projectile.w, Math.max(10, drawHeight * 0.16));
        }

        if (!active && isAim) {
          ctx.restore();
          ctx.save();
          const t = performance.now() * 0.006;
          const aimX = projectile.aimX ?? playerRef.current.x + playerRef.current.w / 2;
          const aimY = projectile.aimY ?? playerRef.current.y + playerRef.current.h / 2;
          const lockBefore = CONFIG.gameplay.boss.chocado.aimLaserLockBeforeMs ?? 430;
          const isLockedDanger = Boolean(projectile.activeAt && now >= projectile.activeAt - lockBefore);
          const aimColor = isLockedDanger ? "#ff2d2d" : "#ffd166";
          ctx.globalAlpha = isLockedDanger ? 1 : 0.92;
          ctx.strokeStyle = aimColor;
          ctx.shadowColor = aimColor;
          ctx.shadowBlur = isLockedDanger ? 24 : 15;
          ctx.lineWidth = isLockedDanger ? 7 : 5;
          ctx.setLineDash([14, 10]);
          ctx.lineDashOffset = -t * 24;
          ctx.beginPath();
          ctx.arc(aimX, aimY, (isLockedDanger ? 50 : 44) + Math.sin(t * (isLockedDanger ? 11 : 5)) * (isLockedDanger ? 8 : 5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(aimX - 34, aimY);
          ctx.lineTo(aimX + 34, aimY);
          ctx.moveTo(aimX, aimY - 34);
          ctx.lineTo(aimX, aimY + 34);
          ctx.stroke();
          ctx.restore();
          return;
        }
        ctx.restore();
        return;
      }

      const img =
        projectile.kind === "servo" || projectile.kind === "servoWave"
          ? assetsRef.current.get("bossServo")
          : assetsRef.current.get("enemyBullet");
      const color = projectile.kind === "servo" || projectile.kind === "servoWave" ? "#ffb703" : "#ff4d6d";
      drawVelocityStretchedImage(
        ctx,
        img,
        projectile.x,
        projectile.y,
        projectile.w,
        projectile.h,
        projectile.vx,
        projectile.vy,
        Math.atan2(projectile.vy, projectile.vx),
        color,
        getStretchSettings("shot").multiplier,
        getStretchPulse(performance.now() + 60, "shot"),
      );
    }

    function rectHitsRotatedBeam(
      rect: { x: number; y: number; w: number; h: number },
      beam: BossProjectile,
    ) {
      const angle = -(beam.angle ?? 0);
      const points = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.w, y: rect.y },
        { x: rect.x, y: rect.y + rect.h },
        { x: rect.x + rect.w, y: rect.y + rect.h },
        { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 },
      ];

      return points.some((point) => {
        const originCenterX = beam.kind === "aimLaser" ? beam.x + Math.cos(beam.angle ?? 0) * (beam.w / 2) : beam.x;
        const originCenterY = beam.kind === "aimLaser" ? beam.y + Math.sin(beam.angle ?? 0) * (beam.w / 2) : beam.y;
        const dx = point.x - originCenterX;
        const dy = point.y - originCenterY;
        const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
        const ry = dx * Math.sin(angle) + dy * Math.cos(angle);
        return Math.abs(rx) <= beam.w / 2 && Math.abs(ry) <= beam.h / 2;
      });
    }

    function atualizarPowerUps(delta: number, canvas: HTMLCanvasElement) {
      if (gameStateRef.current !== "playing") return;

      const speedFactor = delta / 16.67;
      const cfg = CONFIG.gameplay.powerups;
      const previousIds = new Set<number>(powerUpsRef.current.map((power) => power.id));

      const updatedPowerUps = powerUpsRef.current
        .map((power) => ({
          ...power,
          age: power.age + delta,
          life: power.life - delta,
          x: power.x + power.vx * speedFactor,
          y:
            power.y +
            Math.sin((power.age + delta) * cfg.waveFrequency + power.wavePhase) *
              cfg.waveAmplitude *
              0.035 *
              speedFactor,
        }))
        .filter(
          (power) =>
            power.life > 0 &&
            power.x > -140 &&
            power.x < canvas.width + 140 &&
            power.y > -110 &&
            power.y < canvas.height + 110,
        );

      const currentIds = new Set<number>(updatedPowerUps.map((power) => power.id));

      for (const id of previousIds) {
        if (!currentIds.has(id)) {
          pararLoopPowerUpTrail(id);
        }
      }

      powerUpsRef.current = updatedPowerUps;
    }

    function desenharPowerUps(ctx: CanvasRenderingContext2D) {
      ctx.save();
      const cfg = CONFIG.gameplay.powerups;
      const now = performance.now();

      for (const power of powerUpsRef.current) {
        const key: SpriteKey | null =
          power.kind === "regen"
            ? "powerRegen"
            : power.kind === "tripleRegen"
              ? "powerTripleRegen"
              : power.kind === "shield"
                ? "powerShield"
                : power.kind === "powerShot"
                  ? "powerPowerShot"
                  : power.kind === "homingShot"
                    ? "powerHomingShot"
                    : power.kind === "goldenHeart"
                      ? "powerGoldenHeart"
                      : power.kind === "randomBox"
                        ? "powerRandomBox"
                        : power.kind === "flames"
                          ? null
                          : "powerFireRate";

        const img = key ? assetsRef.current.get(key) : null;
        const color = powerUpColor(power.kind);
        const pulse = 1 + Math.sin(power.age * 0.012) * 0.1;
        const spawnProgress = clamp((now - power.bornAt) / 920, 0, 1);
        const spawnWobble =
          Math.sin(spawnProgress * Math.PI * 6) *
          Math.pow(1 - spawnProgress, 0.75) *
          0.36;
        const idleWobble = Math.sin(power.age * 0.01 + power.wavePhase) * 0.045;
        const visibleScale = clamp(0.38 + spawnProgress * 0.62 + spawnWobble + idleWobble, 0.38, 1.42);
        const wobbleRotation =
          Math.sin(spawnProgress * Math.PI * 5) *
          Math.pow(1 - spawnProgress, 0.85) *
          0.28 + Math.sin(power.age * 0.007 + power.wavePhase) * 0.035;

        // Trail pixelada da cor do power-up.
        for (let i = 0; i < cfg.trailAmount; i++) {
          const t = (i + 1) / cfg.trailAmount;
          ctx.globalAlpha = (1 - t) * 0.5;
          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.fillRect(
            power.x + power.w / 2 + i * 10,
            power.y + power.h / 2 + Math.sin(power.age * 0.006 - i) * 9 - 4,
            Math.max(5, power.w * (0.2 - t * 0.08)),
            Math.max(5, power.h * (0.2 - t * 0.08)),
          );
        }

        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        ctx.save();
        ctx.translate(power.x + power.w / 2, power.y + power.h / 2);
        ctx.rotate(wobbleRotation);
        ctx.scale(pulse * visibleScale, pulse * visibleScale);

        // Base brilhante para o power-up nunca ficar invisível,
        // mesmo se o sprite custom for escuro/transparente.
        ctx.globalAlpha = 0.24;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.fillRect(-power.w / 2 - 8, -power.h / 2 - 8, power.w + 16, power.h + 16);

        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = "#fff7e6";
        ctx.lineWidth = 3;
        ctx.strokeRect(-power.w / 2 - 7, -power.h / 2 - 7, power.w + 14, power.h + 14);

        ctx.globalAlpha = 1;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;

        if (img) {
          ctx.drawImage(img, -power.w / 2, -power.h / 2, power.w, power.h);
        } else if (power.kind === "flames") {
          // Flames não precisa de sprite no mapa: é um power-up feito de fogo vivo.
          const flameTime = power.age * 0.02;
          for (let i = 0; i < 18; i += 1) {
            const angle = flameTime + (i / 18) * Math.PI * 2;
            const radius = 12 + Math.sin(flameTime * 1.7 + i) * 7;
            const fx = Math.cos(angle) * radius + rand(-2, 2);
            const fy = Math.sin(angle) * radius * 0.7 + rand(-3, 3);
            const size = rand(7, 15);
            ctx.globalAlpha = rand(0.55, 0.95);
            ctx.fillStyle = i % 3 === 0 ? "#ff2f00" : i % 3 === 1 ? "#facc15" : "#f97316";
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 18;
            ctx.fillRect(fx - size / 2, fy - size / 2, size, size);
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#ff7a18";
          ctx.shadowColor = "#ff5a00";
          ctx.shadowBlur = 24;
          ctx.fillRect(-8, -18, 16, 32);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(-power.w / 2, -power.h / 2, power.w, power.h);
          ctx.fillStyle = "#08030a";
          ctx.font = `26px ${CONFIG.fonts.ui}`;
          ctx.textAlign = "center";
          const label =
            power.kind === "fireRate"
              ? "F"
              : power.kind === "powerShot"
                ? "P"
                : power.kind === "homingShot"
                  ? "H"
                  : power.kind === "shield"
                    ? "S"
                    : "+";
          ctx.fillText(label, 0, 10);
        }

        ctx.shadowBlur = 0;
        ctx.restore();
      }

      ctx.restore();
    }

    function resolverPowerUps() {
      const player = playerRef.current;
      const playerHitbox = getPlayerHitbox(player);
      const collected = new Set<number>();

      for (const power of powerUpsRef.current) {
        const pickupBox = {
          x: power.x + power.w * 0.14,
          y: power.y + power.h * 0.14,
          w: power.w * 0.72,
          h: power.h * 0.72,
        };

        if (rectsCollide(playerHitbox, pickupBox)) {
          collected.add(power.id);
          pararLoopPowerUpTrail(power.id);
          aplicarPowerUp(power.kind);
          criarParticulasHit(power.x + power.w / 2, power.y + power.h / 2, powerUpColor(power.kind), 12);
        }
      }

      if (collected.size > 0) {
        powerUpsRef.current = powerUpsRef.current.filter((power) => !collected.has(power.id));
      }
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

      // Glow otimizado: nada de shadowBlur por partícula.
      // shadowBlur em dezenas de partículas derruba FPS; aqui o brilho é simulado
      // com quadrados maiores e transparentes, bem mais barato no Canvas 2D.
      for (const particle of particlesRef.current) {
        const alpha = clamp(particle.life / particle.maxLife, 0, 1);
        const isFire =
          particle.color === "#ff2f00" ||
          particle.color === "#ff5a00" ||
          particle.color === "#ff7a18" ||
          particle.color === "#fb923c" ||
          particle.color === "#f97316" ||
          particle.color === "#facc15";

        if (isFire) {
          ctx.globalCompositeOperation = "lighter";

          ctx.globalAlpha = alpha * 0.13;
          ctx.fillStyle = particle.color;
          const glowSize = particle.size * 2.6;
          ctx.fillRect(
            particle.x - glowSize / 2,
            particle.y - glowSize / 2,
            glowSize,
            glowSize,
          );

          ctx.globalAlpha = alpha * 0.62;
          const coreSize = particle.size * 1.18;
          ctx.fillRect(
            particle.x - coreSize / 2,
            particle.y - coreSize / 2,
            coreSize,
            coreSize,
          );

          ctx.globalCompositeOperation = "source-over";
          continue;
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size,
        );
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

    function desenharIndicadorMira(renderCtx: CanvasRenderingContext2D) {
      if (gameStateRef.current !== "playing") return;

      const player = playerRef.current;
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;

      const drawLine = (
        dirX: number,
        dirY: number,
        color: string,
        label: string,
        length: number,
        alpha: number,
        progress?: number,
      ) => {
        renderCtx.save();
        renderCtx.globalAlpha = clamp(alpha, 0, 1);
        renderCtx.strokeStyle = color;
        renderCtx.fillStyle = color;
        renderCtx.lineWidth = 4;
        renderCtx.setLineDash([18, 12]);
        renderCtx.shadowColor = color;
        renderCtx.shadowBlur = 12;
        renderCtx.beginPath();
        renderCtx.moveTo(cx, cy);
        renderCtx.lineTo(cx + dirX * length, cy + dirY * length);
        renderCtx.stroke();
        renderCtx.setLineDash([]);
        renderCtx.beginPath();
        renderCtx.arc(cx + dirX * length, cy + dirY * length, 10, 0, Math.PI * 2);
        renderCtx.fill();

        if (typeof progress === "number") {
          const barW = 160;
          const barH = 12;
          const bx = cx + dirX * 70 + 12;
          const by = cy + dirY * 70 + 18;
          renderCtx.fillStyle = "rgba(8, 3, 10, 0.78)";
          renderCtx.fillRect(bx, by, barW, barH);
          renderCtx.strokeStyle = color;
          renderCtx.lineWidth = 2;
          renderCtx.strokeRect(bx, by, barW, barH);
          renderCtx.fillStyle = color;
          renderCtx.fillRect(bx + 2, by + 2, (barW - 4) * clamp(progress, 0, 1), barH - 4);
        }

        renderCtx.font = `22px ${CONFIG.fonts.ui}`;
        renderCtx.fillStyle = color;
        renderCtx.fillText(label, cx + dirX * 70 + 12, cy + dirY * 70 - 12);
        renderCtx.restore();
      };

      const now = performance.now();

      if (boostAimRef.current.active && boostAimRef.current.variantActive) {
        const aim = boostAimRef.current;
        const alpha = clamp((now - (aim.startAt + HOLD_VARIANT_MS)) / AIM_FADE_MS, 0, 0.92);
        const ratio = clamp(aim.chargeRatio, 0, 1);
        drawLine(
          aim.dirX,
          aim.dirY,
          "#ffcf33",
          `BOOST ${Math.round(ratio * 100)}%`,
          260 + ratio * 420,
          alpha,
          ratio,
        );
      }
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

          // Knockback livre: quando um inimigo é lançado por boost/shockwave,
          // ele deixa temporariamente o padrão dele e segue em linha reta no espaço.
          // Assim ele pode sair da tela e ser despawnado sem travar a wave.
          if (
            updated.knockedBack &&
            updated.kind !== "asteroid" &&
            updated.kind !== "fragment"
          ) {
            updated.x += updated.vx * speedFactor;
            updated.y += updated.vy * speedFactor;
            updated.rotation =
              (updated.rotation ?? 0) + (updated.rotationSpeed ?? 0) * delta;
            return updated;
          }

          if (updated.kind === "red") {
            const fireRedBullet = () => {
              enemyProjectilesRef.current.push({
                id: enemyIdRef.current++,
                stretchUntil:
                  performance.now() +
                  CONFIG.gameplay.dynamicStretch.shotPulseMs,
                x: updated.x - 22,
                y: updated.y + updated.h / 2 - 7,
                w: 44,
                h: 30,
                vx: -redCfg.bulletSpeed,
                vy: 0,
                damage: 1,
              });
              tocarSom(CONFIG.sounds.enemyShot, 0.25);
            };

            // Se recebeu knockback de boost/shockwave, sai do trilho e pode ser lançado
            // também para cima/baixo.
            if (updated.isDashing) {
              updated.x += updated.vx * speedFactor;
              updated.y += updated.vy * speedFactor;
              updated.vx *= Math.pow(0.985, speedFactor);
              updated.vy *= Math.pow(0.985, speedFactor);
              updated.rotation =
                (updated.rotation ?? 0) + (updated.rotationSpeed ?? 0) * delta;
              return updated;
            }

            const pauseTimer = updated.redPauseTimer ?? 0;

            if (pauseTimer > 0) {
              // Congela o movimento inteiro por um tempinho nas pontas.
              // A idade é compensada para o ping-pong não continuar andando por trás.
              updated.age -= delta;
              updated.redPauseTimer = Math.max(0, pauseTimer - delta);
              updated.y = clamp(
                updated.redHoldY ?? updated.y,
                0,
                canvas.height - updated.h,
              );
              updated.vy = 0;

              updated.redBurstTimer = Math.max(
                0,
                (updated.redBurstTimer ?? 0) - delta,
              );
              if (
                (updated.redBurstShotsLeft ?? 0) > 0 &&
                (updated.redBurstTimer ?? 0) <= 0
              ) {
                updated.redBurstShotsLeft =
                  (updated.redBurstShotsLeft ?? 0) - 1;
                updated.redBurstTimer = redCfg.burstGapMs;
                fireRedBullet();
              }

              return updated;
            }

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

            // Movimento vertical de ponta a ponta da tela.
            updated.y = startY + (targetY - startY) * easedT + waveOffset;
            updated.y = clamp(updated.y, 0, canvas.height - updated.h);

            updated.vy = (updated.y - previousY) / Math.max(0.001, speedFactor);
            const currentDirection = Math.sign(
              updated.vy || updated.redDirection || 1,
            );
            const zone: "start" | "target" | "middle" =
              t <= 0.018 ? "start" : t >= 0.982 ? "target" : "middle";

            if (zone !== "middle" && zone !== updated.redBurstZone) {
              updated.stretchUntil =
                performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs;
              updated.redBurstShotsLeft = redCfg.burstShots;
              updated.redBurstTimer = 0;
              updated.redPauseTimer = redCfg.endpointPauseMs;
              updated.redHoldY = updated.y;
              updated.redDirection = currentDirection;
            }

            updated.redBurstZone = zone;
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

          if (
            updated.kind === "purple" ||
            updated.kind === "asteroid" ||
            updated.kind === "alien"
          ) {
            updated.x += updated.vx * speedFactor;
            updated.y += updated.vy * speedFactor;

            if (updated.kind === "alien") {
              if (updated.alienFleeing) {
                updated.rotation = 0;
                updated.tilt = (updated.tilt ?? 0) * 0.985;
                updated.alienTrailTimer =
                  (updated.alienTrailTimer ?? 0) - delta;
                if ((updated.alienTrailTimer ?? 0) <= 0) {
                  updated.alienTrailTimer = 34;
                  criarParticulasAlienFuga(
                    updated.x + updated.w * 0.2,
                    updated.y + updated.h / 2,
                    CONFIG.gameplay.enemies.alien.escapeTrailAmount,
                  );
                }
              } else {
                updated.y +=
                  Math.sin(updated.age * 0.0022) * 0.65 * speedFactor;
                updated.y = clamp(
                  updated.y,
                  26,
                  canvas.height - updated.h - 26,
                );
              }
            }

            if (updated.kind === "asteroid") {
              updated.rotation =
                (updated.rotation ?? 0) + (updated.rotationSpeed ?? 0) * delta;
            }
          }

          if (updated.kind === "fragment") {
            updated.x += updated.vx * speedFactor;
            updated.y += updated.vy * speedFactor;
            // Sem gravidade no espaço: fragmentos seguem velocidade constante.
            updated.rotation =
              (updated.rotation ?? 0) + (updated.rotationSpeed ?? 0) * delta;
          }

          return updated;
        })
        .filter((enemy) => {
          if (enemy.hp <= 0) return false;

          const isHazard =
            enemy.kind === "asteroid" || enemy.kind === "fragment";
          const marginX = isHazard ? 300 : enemy.knockedBack ? 40 : 120;
          const marginY = isHazard ? 260 : enemy.knockedBack ? 40 : 120;

          return (
            enemy.x > -enemy.w - marginX &&
            enemy.x < canvas.width + enemy.w + marginX &&
            enemy.y > -enemy.h - marginY &&
            enemy.y < canvas.height + enemy.h + marginY
          );
        });

      enemyProjectilesRef.current = enemyProjectilesRef.current
        .map((bullet) => ({
          ...bullet,
          x: bullet.x + bullet.vx * speedFactor,
          y: bullet.y + bullet.vy * speedFactor,
        }))
        .filter((bullet) => bullet.x > -80 && bullet.x < canvas.width + 120);
    }

    function iniciarCapturaAlien(enemy: Enemy) {
      const player = playerRef.current;
      const now = performance.now();
      if (player.capturedEnemyId !== null) return;
      if (now < player.alienCaptureCooldownUntil) return;
      if (enemy.alienFleeing) return;

      const cfg = CONFIG.gameplay.enemies.alien;
      const px = player.x + player.w / 2;

      // O alien sempre arremessa o player contra a parede ESQUERDA.
      // Quanto menor a distância da parede, menor o tempo de arremesso, evitando combo infinito.
      const distanceToLeft = Math.max(28, px);
      const throwMs = clamp(
        (distanceToLeft / CONFIG.canvasWidth) * cfg.throwDefaultMs,
        cfg.throwMinMs,
        cfg.throwDefaultMs,
      );
      const speed = Math.max(10, distanceToLeft / Math.max(1, throwMs / 16.67));

      player.capturedEnemyId = enemy.id;
      player.capturedUntil = now + cfg.captureMs;
      player.throwUntil = player.capturedUntil + throwMs;
      player.throwVx = -speed;
      player.throwVy = 0;
      player.wallImpactArmed = true;
      player.alienCaptureCooldownUntil =
        player.throwUntil + cfg.captureCooldownMs;
      player.vx = 0;
      player.vy = 0;

      // Coloca o player na frente do alien imediatamente para evitar bugs de sobreposição.
      player.x = enemy.x - player.w * 0.72;
      player.y = enemy.y + enemy.h / 2 - player.h / 2;
      player.invincibleUntil = Math.max(
        player.invincibleUntil,
        player.throwUntil + 250,
      );
      player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
      player.stretchVx = -4.5;
      player.stretchVy = 0;

      enemy.vx = 0;
      enemy.vy = 0;
      enemy.isDashing = false;
      tocarSom(CONFIG.sounds.enemyHit, 0.22, "hit");
    }

    function atualizarCapturaAlien(delta: number, canvas: HTMLCanvasElement) {
      const player = playerRef.current;
      if (player.capturedEnemyId === null) return false;

      const now = performance.now();
      const alien = enemiesRef.current.find(
        (enemy) => enemy.id === player.capturedEnemyId,
      );
      const speedFactor = delta / 16.67;

      if (now < player.capturedUntil && alien) {
        const angle = now * 0.012;
        // Mantém o player na frente do alien; só o sprite rotaciona para dar dinamismo.
        player.x = alien.x - player.w * 0.58;
        player.y = alien.y + alien.h / 2 - player.h / 2;
        player.vx = 0;
        player.vy = 0;
        player.tilt += 14.5 * speedFactor;
        player.stretchUntil = now + 90;
        player.stretchVx = Math.cos(angle) * 1.6;
        player.stretchVy = Math.sin(angle) * 1.0;
        return true;
      }

      if (now < player.throwUntil) {
        player.x += player.throwVx * speedFactor;
        player.y += player.throwVy * speedFactor;
        player.vx = player.throwVx;
        player.vy = player.throwVy;
        player.tilt += 0.45;
        player.stretchUntil = now + 120;
        player.stretchVx = player.throwVx;
        player.stretchVy = player.throwVy;

        const hitWall =
          player.x <= 0 ||
          player.x >= canvas.width - player.w ||
          player.y <= 0 ||
          player.y >= canvas.height - player.h;

        if (hitWall && player.wallImpactArmed) {
          player.x = clamp(player.x, 0, canvas.width - player.w);
          player.y = clamp(player.y, 0, canvas.height - player.h);
          player.wallImpactArmed = false;
          player.capturedEnemyId = null;
          player.throwUntil = 0;
          player.capturedUntil = 0;
          player.vx = 0;
          player.vy = 0;
          player.invincibleUntil = 0;
          player.alienCaptureCooldownUntil =
            now + CONFIG.gameplay.enemies.alien.captureCooldownMs;

          if (alien) {
            const fleeY = alien.y + alien.h / 2 < canvas.height / 2 ? -1 : 1;
            alien.alienFleeing = true;
            alien.isDashing = true;
            // Depois de arremessar o player, o alien foge para a ESQUERDA
            // na diagonal mais próxima, sem girar feito doido.
            alien.vx = -CONFIG.gameplay.enemies.alien.escapeSpeedX;
            alien.vy = fleeY * CONFIG.gameplay.enemies.alien.escapeSpeedY;
            alien.rotationSpeed = 0;
            alien.tilt = fleeY * 8;
            alien.stretchUntil =
              now + CONFIG.gameplay.dynamicStretch.enemyPulseMs * 2;
          }

          criarExplosao(
            player.x + player.w / 2,
            player.y + player.h / 2,
            "#ffe18c",
            18,
          );
          if (CONFIG.settings.enableScreenShake) {
            shakeRef.current = {
              intensity: CONFIG.gameplay.enemies.alien.throwImpactShake,
              endAt: now + 260,
            };
          }
          receberDano(CONFIG.gameplay.enemies.alien.throwDamage);
        }
        return true;
      }

      player.capturedEnemyId = null;
      player.throwUntil = 0;
      player.capturedUntil = 0;
      return false;
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
            if (gameStateRef.current === "tutorial" && tutorialStepRef.current === "strong" && shot.type !== "strong") {
              shotsToRemove.add(shot.id);
              criarParticulasHit(shot.x + shot.w / 2, shot.y + shot.h / 2, "#93c5fd", 4);
              break;
            }
            const danoAplicado = Math.min(shot.damage, Math.max(0, enemy.hp));
            enemy.hp -= shot.damage;
            carregarBoostPorDano(danoAplicado);
            shotsToRemove.add(shot.id);
            if (enemy.kind === "asteroid" && enemy.hp <= enemy.maxHp / 2) {
              enemy.cracked = true;
            }
            const hitX = shot.x + shot.w / 2;
            const hitY = shot.y + shot.h / 2;
            criarParticulasHit(hitX, hitY);
            tocarSom(CONFIG.sounds.enemyHit, 0.25, "hit");

            if (shot.type === "strong") {
              aplicarShockwaveDeTiroForte(hitX, hitY);

              if (
                gameStateRef.current === "tutorial" &&
                tutorialStepRef.current === "strong" &&
                enemy.kind === "purple" &&
                enemy.tutorialStep === "strong"
              ) {
                enemy.removedByStrong = true;
                enemy.hp = 0;
              }
            }

            if (enemy.hp <= 0 || enemy.removedByStrong) {
              enemiesToRemove.add(enemy.id);
              registrarAbate(enemy.kind);
              if (gameStateRef.current !== "tutorial") {
                tentarSpawnPowerUp(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
              }

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

      const boss = bossRef.current;
      const bossHitbox = getBossHitbox();
      if (boss.active && !boss.intro && boss.hp > 0) {
        for (const shot of shotsRef.current) {
          if (shotsToRemove.has(shot.id)) continue;
          if (rectsCollide(shot, bossHitbox)) {
            const hitX = shot.x + shot.w / 2;
            const hitY = shot.y + shot.h / 2;
            const danoAplicadoBoss = Math.min(shot.damage, Math.max(0, boss.hp));
            boss.hp -= shot.damage;
            carregarBoostPorDano(danoAplicadoBoss);
            tentarSpawnPowerUp(hitX, hitY, true);
            shotsToRemove.add(shot.id);
            criarParticulasHit(hitX, hitY, "#ffe18c", 10);
            tocarSom(CONFIG.sounds.enemyHit, 0.25, "hit");
            if (shot.type === "strong") {
              aplicarShockwaveDeTiroForte(hitX, hitY);
            }
            if (boss.hp <= 0) {
              boss.hp = 0;
            }
          }
        }
      }

      if (boss.active && !boss.intro && boss.hp > 0 && rectsCollide(playerHitbox, bossHitbox)) {
        const hitCenterY = player.y + player.h / 2;
        const bossCenterY = bossHitbox.y + bossHitbox.h / 2;
        const bossLeft = bossHitbox.x;

        if (boosting && !boostHitEnemiesRef.current.has(-9999)) {
          boostHitEnemiesRef.current.add(-9999);
          const danoBoostBoss = Math.min(CONFIG.gameplay.boost.damage, Math.max(0, boss.hp));
          boss.hp -= CONFIG.gameplay.boost.damage;
          carregarBoostPorDano(danoBoostBoss);
          tentarSpawnPowerUp(bossHitbox.x, hitCenterY, true);
          criarExplosao(bossHitbox.x, hitCenterY, "#fb8500", 18);
          tocarSom(CONFIG.sounds.boostHit, 0.45, "hit");
          aplicarShockwaveDeTiroForte(bossHitbox.x, hitCenterY);
        }

        // Barreira física: o jogador não entra no corpo do Chocado.
        player.x = Math.min(player.x, bossLeft - CONFIG.gameplay.player.hitboxOffsetX - player.w * 0.08);
        player.vx = Math.min(player.vx, -3.6);
        player.vy += hitCenterY < bossCenterY ? -1.4 : 1.4;
      }

      // Alien captura pelo sprite inteiro, mesmo que o player esteja em i-frame/boost.
      // Isso evita o bug de atravessar o alien sem interação.
      if (player.capturedEnemyId === null) {
        for (const enemy of enemiesRef.current) {
          if (enemy.kind !== "alien") continue;
          if (enemy.alienFleeing) continue;
          if (enemiesToRemove.has(enemy.id)) continue;

          if (rectsCollide(playerHitbox, enemy)) {
            iniciarCapturaAlien(enemy);
            break;
          }
        }
      }

      if (boosting) {
        for (const enemy of enemiesRef.current) {
          if (enemiesToRemove.has(enemy.id)) continue;
          if (boostHitEnemiesRef.current.has(enemy.id)) continue;

          if (rectsCollide(playerHitbox, enemy)) {
            if (enemy.kind === "alien") {
              if (
                !enemy.alienFleeing &&
                performance.now() >= player.alienCaptureCooldownUntil
              ) {
                iniciarCapturaAlien(enemy);
              }
              continue;
            }

            boostHitEnemiesRef.current.add(enemy.id);
            const danoBoostAplicado = Math.min(
              CONFIG.gameplay.boost.damage,
              Math.max(0, enemy.hp),
            );
            enemy.hp -= CONFIG.gameplay.boost.damage;
            carregarBoostPorDano(danoBoostAplicado);
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
            const impactX = player.x + player.w / 2;
            const impactY = player.y + player.h / 2;

            // Knockback sempre acontece no contato do boost, mesmo se o alvo sobreviver.
            aplicarKnockbackInimigo(
              enemy,
              impactX,
              impactY,
              CONFIG.gameplay.boost.knockback,
              0.024,
            );

            // O player rebate levemente para não ficar preso dentro do objeto.
            player.x -= (dirX / len) * CONFIG.gameplay.boost.hitBounceBack;
            player.y -= (dirY / len) * (CONFIG.gameplay.boost.hitBounceBack * 0.42);
            player.vx = -(dirX / len) * 5.2;
            player.vy = -(dirY / len) * 3.0;
            player.boostUntil = Math.min(player.boostUntil, now + 45);

            if (enemy.hp <= 0) {
              enemiesToRemove.add(enemy.id);
              registrarAbate(enemy.kind);
              if (gameStateRef.current !== "tutorial") {
                tentarSpawnPowerUp(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
              }

              if (enemy.kind === "asteroid") {
                spawnAsteroidFragments(enemy);
              } else {
                tocarSom(CONFIG.sounds.enemyDeath, 0.38, "hit");
              }
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
            if (enemy.kind === "alien") {
              if (
                !enemy.alienFleeing &&
                performance.now() >= player.alienCaptureCooldownUntil
              ) {
                iniciarCapturaAlien(enemy);
              }
              continue;
            }

            if (gameStateRef.current === "tutorial") {
              resetarTutorialSuave();
              break;
            }

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
            if (gameStateRef.current === "tutorial") {
              resetarTutorialSuave();
              break;
            }

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

      if (!intangible) {
        for (const projectile of bossProjectilesRef.current) {
          const active =
            !projectile.activeAt || performance.now() >= projectile.activeAt;
          if (!active) continue;
          const hit =
            projectile.kind === "laser" || projectile.kind === "aimLaser"
              ? rectHitsRotatedBeam(playerHitbox, projectile)
              : rectsCollide(playerHitbox, projectile);
          if (hit) {
            if (projectile.kind !== "laser" && projectile.kind !== "aimLaser") {
              projectilesToRemove.add(projectile.id);
            }
            receberDano(projectile.damage);
            break;
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
        bossProjectilesRef.current = bossProjectilesRef.current.filter(
          (projectile) => !projectilesToRemove.has(projectile.id),
        );
      }
    }

    function atualizar(delta: number, canvas: HTMLCanvasElement) {
      const isTutorialMode = gameStateRef.current === "tutorial";
      if (gameStateRef.current !== "playing" && !isTutorialMode) {
        return;
      }

      const player = playerRef.current;
      const speedFactor = delta / 16.67;
      const slowMultiplier = performance.now() < slowPlayerUntilRef.current
        ? CONFIG.gameplay.powerups.randomBadSlowMultiplier
        : 1;
      const effectiveAcceleration = CONFIG.gameplay.player.acceleration * slowMultiplier;
      const effectiveMaxSpeedX = CONFIG.gameplay.player.maxSpeedX * slowMultiplier;
      const effectiveMaxSpeedY = CONFIG.gameplay.player.maxSpeedY * slowMultiplier;

      if (isTutorialMode && tutorialResetRef.current.active) {
        const reset = tutorialResetRef.current;
        const progress = clamp((performance.now() - reset.startAt) / reset.durationMs, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        player.x = reset.fromX + (reset.toX - reset.fromX) * eased;
        player.y = reset.fromY + (reset.toY - reset.fromY) * eased;
        player.vx = 0;
        player.vy = 0;
        player.tilt *= 0.82;

        if (progress >= 1) {
          tutorialResetRef.current.active = false;
          prepararPassoTutorial(tutorialStepRef.current);
        }

        atualizarParticulas(delta);
        atualizarPowerUpUi();
        setIsLowHp(false);
        return;
      }

      // Se o alien capturou/arremessou o player, trava controles e resolve só essa cutscene.
      // Atualizamos inimigos antes para o player acompanhar o alien corretamente.
      if (player.capturedEnemyId !== null) {
        atualizarWavesInfinitas();
        atualizarInimigos(delta, canvas);
        atualizarBoss(delta);
        atualizarBossProjectiles(delta);
        atualizarCapturaAlien(delta, canvas);
        atualizarPowerUps(delta, canvas);
        resolverPowerUps();
        atualizarParticulas(delta);
        atualizarPowerUpUi();
        atualizarShockwaves(delta);
        setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
        return;
      }

      const keyboardX =
        (keysRef.current["arrowright"] || keysRef.current["d"] ? 1 : 0) -
        (keysRef.current["arrowleft"] || keysRef.current["a"] ? 1 : 0);

      const keyboardY =
        (keysRef.current["arrowdown"] || keysRef.current["s"] ? 1 : 0) -
        (keysRef.current["arrowup"] || keysRef.current["w"] ? 1 : 0);

      let inputX = clamp(keyboardX + mobileMoveRef.current.x, -1, 1);
      let inputY = clamp(keyboardY + mobileMoveRef.current.y, -1, 1);

      const nowForHold = performance.now();

      if (keysRef.current["shift"] && (!isTutorialMode || tutorialStepRef.current === "boost")) {
        iniciarMiraBoost();
      } else if (boostAimRef.current.active) {
        soltarMiraBoost(false);
      }

      if (boostAimRef.current.active) {
        const aim = boostAimRef.current;
        const heldMs = nowForHold - aim.startAt;

        if (heldMs >= HOLD_VARIANT_MS) {
          aim.variantActive = true;
          atualizarDirecaoMira(inputX, inputY);
          aim.chargeRatio = clamp((heldMs - HOLD_VARIANT_MS) / BOOST_HOLD_MAX_MS, 0, 1);
        }

        inputX = 0;
        inputY = 0;
        player.vx *= 0.72;
        player.vy *= 0.72;

        if (aim.variantActive && aim.chargeRatio >= 1) {
          soltarMiraBoost(true);
        }
      }

      if (keysRef.current["x"] && (!isTutorialMode || tutorialStepRef.current === "strong")) {
        shootStrong(1, 0);
      }

      if ((keysRef.current["control"] || keysRef.current["ctrl"]) && (!isTutorialMode || tutorialStepRef.current === "dodge")) {
        keysRef.current["control"] = false;
        keysRef.current["ctrl"] = false;
        executarEsquiva();
      }

      const movingNow = inputX !== 0 || inputY !== 0;
      const previousVx = player.vx;
      const previousVy = player.vy;

      if (inputX !== 0) {
        player.vx += inputX * effectiveAcceleration * speedFactor;
      } else {
        player.vx *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
      }

      if (inputY !== 0) {
        player.vy += inputY * effectiveAcceleration * speedFactor;
      } else {
        player.vy *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
      }

      player.vx = clamp(
        player.vx,
        -effectiveMaxSpeedX,
        effectiveMaxSpeedX,
      );
      player.vy = clamp(
        player.vy,
        -effectiveMaxSpeedY,
        effectiveMaxSpeedY,
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

      if ((keysRef.current["z"] || mobileShootRef.current) && (!isTutorialMode || tutorialStepRef.current === "shot")) {
        shootNormal();
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
        player.normalCooldown = Math.max(0, player.normalCooldown - speedFactor);
      }

      shotsRef.current = shotsRef.current
        .map((shot) => {
          let vx = shot.vx ?? shot.speed;
          let vy = shot.vy ?? 0;

          if (shot.variant === "homing" || shot.variant === "powerHoming") {
            const target = encontrarAlvoMaisProximo(shot.x + shot.w / 2, shot.y + shot.h / 2);
            if (target) {
              const dx = target.x - (shot.x + shot.w / 2);
              const dy = target.y - (shot.y + shot.h / 2);
              const len = Math.max(0.001, Math.hypot(dx, dy));
              const desiredVx = (dx / len) * shot.speed;
              const desiredVy = (dy / len) * shot.speed;
              const turn = CONFIG.gameplay.powerups.homingTurnRate;
              vx += (desiredVx - vx) * turn;
              vy += (desiredVy - vy) * turn;
              const currentLen = Math.max(0.001, Math.hypot(vx, vy));
              vx = (vx / currentLen) * shot.speed;
              vy = (vy / currentLen) * shot.speed;
            }
          }

          return {
            ...shot,
            vx,
            vy,
            x: shot.x + vx * speedFactor,
            y: shot.y + vy * speedFactor,
          };
        })
        .filter(
          (shot) =>
            shot.x + shot.w > 0 &&
            shot.x < canvas.width &&
            shot.y + shot.h > 0 &&
            shot.y < canvas.height,
        );

      if (isTutorialMode) {
        const nowTutorial = performance.now();

        if (tutorialStepRef.current === "move" && movingNow && Math.hypot(player.vx, player.vy) > 0.22) {
          if (tutorialMoveStartedAtRef.current <= 0) {
            tutorialMoveStartedAtRef.current = nowTutorial;
          }

          if (nowTutorial - tutorialMoveStartedAtRef.current > 650) {
            avancarPassoTutorial();
          }
        } else if (tutorialStepRef.current === "move") {
          tutorialMoveStartedAtRef.current = 0;
        }

        // Tutorial roteirizado: mantém o jogo rodando, mas só valida a ação ensinada.
        if (tutorialStepRef.current === "boost" || tutorialStepRef.current === "dodge") {
          resolverColisoes();
        }

        if (tutorialStepRef.current === "shot" || tutorialStepRef.current === "strong") {
          resolverColisoes();

          const currentTutorialStep = tutorialStepRef.current;
          const targetsLeft = enemiesRef.current.filter((enemy) => {
            if (enemy.kind !== "purple") return false;
            if (enemy.tutorialStep !== currentTutorialStep) return false;

            if (currentTutorialStep === "strong") {
              return enemy.hp > 0 && !enemy.removedByStrong && enemy.x > -enemy.w - 80;
            }

            return enemy.hp > 0;
          }).length;

          if (tutorialTargetSpawnedRef.current && targetsLeft <= 0) {
            tutorialTargetSpawnedRef.current = false;
            setTimeout(() => {
              if (
                gameStateRef.current === "tutorial" &&
                tutorialStepRef.current === currentTutorialStep
              ) {
                avancarPassoTutorial();
              }
            }, 420);
          }
        }

        // Pequena animação dos alvos de treino sem ativar a IA real das waves.
        enemiesRef.current = enemiesRef.current.map((enemy) => {
          if (enemy.kind === "black") {
            const playerCenterY = player.y + player.h / 2;
            const targetY = clamp(
              playerCenterY - enemy.h / 2,
              80,
              canvas.height - enemy.h - 80,
            );
            const nextX = enemy.x + enemy.vx * speedFactor;
            const nextY = enemy.y + (targetY - enemy.y) * 0.018 * speedFactor;

            if (nextX < -enemy.w - 40) {
              setTimeout(() => {
                if (gameStateRef.current === "tutorial") prepararPassoTutorial(tutorialStepRef.current);
              }, 120);
            }

            return {
              ...enemy,
              age: enemy.age + delta,
              x: nextX,
              y: nextY,
              stretchUntil: performance.now() + 80,
            };
          }

          const nextX = enemy.x + enemy.vx * speedFactor;
          if (nextX < -enemy.w - 60) {
            if (tutorialStepRef.current === "strong" && enemy.tutorialStep === "strong") {
              enemy.removedByStrong = true;
              enemy.hp = 0;
            } else {
              setTimeout(() => {
                if (gameStateRef.current === "tutorial") resetarTutorialSuave();
              }, 80);
            }
          }

          return {
            ...enemy,
            age: enemy.age + delta,
            x: nextX,
            y: enemy.waveBaseY - enemy.h / 2 + Math.sin((performance.now() + enemy.id * 97) * 0.003) * 12,
            rotation: (enemy.rotation ?? 0) + (enemy.rotationSpeed ?? 0) * delta,
          };
        });

        atualizarParticulas(delta);
        atualizarPowerUpUi();
        return;
      }

      atualizarWavesInfinitas();
      atualizarInimigos(delta, canvas);
      atualizarBoss(delta);
      atualizarBossProjectiles(delta);
      atualizarPowerUps(delta, canvas);
      resolverColisoes();
      resolverPowerUps();
      atualizarParticulas(delta);
      atualizarPowerUpUi();
      atualizarShockwaves(delta);
      setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
    }

    function criarParticulasGameOver(
      cx: number,
      cy: number,
      amount: number,
      explosive = false,
    ) {
      if (!CONFIG.settings.enableParticles) return;
      const player = playerRef.current;
      const finalAmount = Math.min(
        CONFIG.gameplay.gameOver.maxParticlesOnDeath,
        Math.max(0, Math.round(amount * CONFIG.settings.particleQuality)),
      );

      for (let i = 0; i < finalAmount; i++) {
        // Nasce dentro do corpo da nave, não do meio da tela.
        const sx = player.x + rand(player.w * 0.12, player.w * 0.88);
        const sy = player.y + rand(player.h * 0.18, player.h * 0.82);
        const dx = sx - cx;
        const dy = sy - cy;
        const baseAngle = Math.atan2(dy, dx);
        const angle = baseAngle + rand(-0.95, 0.95);
        const speed = explosive ? rand(5.5, 16) : rand(1.8, 7.2);

        particlesRef.current.push({
          id: enemyIdRef.current++,
          x: sx,
          y: sy,
          vx: Math.cos(angle) * speed + rand(-1.2, 1.2),
          vy: Math.sin(angle) * speed + rand(-1.2, 1.2),
          // Pixels quadrados brilhantes. Nada de efeito redondo.
          size: explosive ? rand(5, 14) : rand(3, 9),
          life: explosive ? rand(520, 980) : rand(260, 560),
          maxLife: explosive ? 980 : 560,
          color: corParticulaQuente(),
        });
      }

      particlesRef.current = particlesRef.current.slice(
        -CONFIG.gameplay.gameOver.maxParticlesOnDeath,
      );
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
          player.stretchUntil = now + 210;
          player.stretchVx = rand(-2.6, 2.6);
          player.stretchVy = rand(-2.0, 2.0);
          criarParticulasGameOver(
            cx + rand(-player.w * 0.34, player.w * 0.34),
            cy + rand(-player.h * 0.34, player.h * 0.34),
            8,
            false,
          );
          tocarSom(CONFIG.sounds.enemyHit, 0.1, "hit");
        }
        return;
      }

      if (elapsed < cfg.slowExplosionMs + cfg.bigExplosionMs) {
        if (now - gameOverLastBurstAtRef.current > cfg.bigBurstEveryMs) {
          gameOverLastBurstAtRef.current = now;
          player.stretchUntil = now + 250;
          player.stretchVx = rand(-5.2, 5.2);
          player.stretchVy = rand(-3.8, 3.8);
          criarParticulasGameOver(
            cx + rand(-player.w * 0.44, player.w * 0.44),
            cy + rand(-player.h * 0.44, player.h * 0.44),
            cfg.fireParticleAmount,
            true,
          );
          tocarSom(
            CONFIG.sounds.gameOverExplosion || CONFIG.sounds.explosion,
            0.2,
            "hit",
          );
        }
        return;
      }

      if (
        elapsed >= cfg.slowExplosionMs + cfg.bigExplosionMs &&
        !gameOverFlash
      ) {
        setGameOverFlashOrigin({
          x: `${clamp((cx / CONFIG.canvasWidth) * 100, 0, 100)}%`,
          y: `${clamp((cy / CONFIG.canvasHeight) * 100, 0, 100)}%`,
        });
        criarParticulasGameOver(cx, cy, cfg.finalFlashParticleAmount, true);
        tocarSom(
          CONFIG.sounds.gameOverFinalExplosion || CONFIG.sounds.gameOverExplosion || CONFIG.sounds.explosion,
          0.55,
          "hit",
        );
        setGameOverFlash(true);
      }

      if (elapsed >= cfg.menuDelayMs) {
        setEstado("gameOver");
      }
    }

    function loop(time: number) {
      const delta = Math.min(32, time - lastTime);
      lastTime = time;

      aplicarPixelArt(renderCtx);
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

      desenharFundo(renderCtx, renderCanvas, delta);

      for (const shot of shotsRef.current) desenharTiro(renderCtx, shot);
      for (const enemy of enemiesRef.current) desenharEnemy(renderCtx, enemy);
      desenharBoss(renderCtx);
      for (const bullet of enemyProjectilesRef.current)
        desenharEnemyProjectile(renderCtx, bullet);
      for (const projectile of bossProjectilesRef.current)
        desenharBossProjectile(renderCtx, projectile);
      desenharPowerUps(renderCtx);
      desenharShockwaves(renderCtx);
      desenharIndicadorMira(renderCtx);
      desenharParticulas(renderCtx);

      if (
        gameStateRef.current === "playing" ||
        gameStateRef.current === "tutorial" ||
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
        if (key === "r") {
          iniciarJogo(currentModeRef.current ?? "infinite");
          return;
        }

        if (key === "7") {
          const wave = waveStateRef.current;
          enemiesRef.current = [];
          enemyProjectilesRef.current = [];
          bossProjectilesRef.current = [];
          shotsRef.current = [];
          wave.queue = [];

          if (wave.mode === "story") {
            const storyCfg = CONFIG.gameplay.storyWaves;
            const nextStoryWave = Math.min(
              storyCfg.bossWave,
              Math.max(1, (wave.wave || 0) + 1),
            );

            // No modo história o skip nunca passa da wave do boss.
            if (wave.wave >= storyCfg.bossWave) {
              mostrarMensagemWave("DERROTE O CHOCADO", true);
              return;
            }

            iniciarWaveHistoria(nextStoryWave);
            return;
          }

          iniciarWaveInfinita((wave.wave || 0) + 1);
          return;
        }

        if (key === "6") {
          const player = playerRef.current;
          player.hp = CONFIG.gameplay.player.maxHp;
          player.invincibleUntil = performance.now() + 700;
          setPlayerHp(player.hp);
          setIsLowHp(false);
          return;
        }

        if (key === "=" || key === "+") {
          for (const enemy of enemiesRef.current) {
            registrarAbate(enemy.kind);
            criarExplosao(
              enemy.x + enemy.w / 2,
              enemy.y + enemy.h / 2,
              "#ffe18c",
              8,
            );
          }
          enemiesRef.current = [];
          enemyProjectilesRef.current = [];
          return;
        }

        if (key === "8") spawnEnemy("red");
        if (key === "9") spawnEnemy("black");
        if (key === "0") spawnEnemy("purple");
        if (key === "5") spawnEnemy("alien");
        if (key === "4") {
          waveStateRef.current.bossWave = true;
          waveStateRef.current.active = true;
          waveStateRef.current.queue = [];
          setWaveUi((current) => ({
            ...current,
            bossWave: true,
            active: true,
            message: "BOSS WAVE TESTE",
          }));
          spawnBossChocado();
        }
        if (key === "-") spawnEnemy("asteroid");
        if (key === "1") spawnPowerUp("goldenHeart", playerRef.current.x + playerRef.current.w, playerRef.current.y + playerRef.current.h / 2);
        if (key === "2") spawnPowerUp("randomBox", playerRef.current.x + playerRef.current.w, playerRef.current.y + playerRef.current.h / 2);
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

      if (gameStateRef.current === "victory") {
        if (key === "enter" || key === " ") {
          voltarAoMenuPrincipal();
          return;
        }
      }

      if (key === "p" || key === "escape") {
        pausarOuVoltar();
      }
    }

    function keyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;

      if (key === "shift") {
        soltarMiraBoost(false);
      }
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

  const normalLifeSlots = Array.from({ length: CONFIG.gameplay.player.maxHp });
  const goldenLifeSlots = Array.from({ length: goldenHp });

  const nowForVisualEffects = visualEffectNow;

  const flashWhiteDuration = Math.max(1, flashWhiteUntilRef.current - flashWhiteStartRef.current);
  const flashWhiteProgress = flashWhiteStartRef.current > 0
    ? clamp((nowForVisualEffects - flashWhiteStartRef.current) / flashWhiteDuration, 0, 1)
    : 0;
  const flashWhiteOpacity = flashWhiteProgress <= 0
    ? 0
    : flashWhiteProgress < 0.78
      ? 1
      : Math.pow(1 - ((flashWhiteProgress - 0.78) / 0.22), 1.35);

  const flashBlurDuration = Math.max(1, flashBlurUntilRef.current - flashBlurStartRef.current);
  const flashBlurProgress = flashBlurStartRef.current > 0
    ? clamp((nowForVisualEffects - flashBlurStartRef.current) / flashBlurDuration, 0, 1)
    : 0;
  const flashBlurOpacity = flashBlurProgress <= 0
    ? 0
    : flashBlurProgress < 0.16
      ? flashBlurProgress / 0.16
      : Math.pow(1 - ((flashBlurProgress - 0.16) / 0.84), 1.1);
  const flashBlurAmount = 2 + 22 * Math.pow(1 - flashBlurProgress, 0.9);
  const flashBrightness = 1 + 1.45 * Math.pow(1 - flashBlurProgress, 1.25);

  const flashWhiteStyle: CSSProperties = {
    opacity: flashWhiteOpacity,
  };

  const flashAfterimageStyle: CSSProperties = {
    opacity: flashBlurOpacity,
    backdropFilter: `blur(${flashBlurAmount}px) brightness(${flashBrightness}) contrast(1.35) saturate(0.72)`,
    WebkitBackdropFilter: `blur(${flashBlurAmount}px) brightness(${flashBrightness}) contrast(1.35) saturate(0.72)`,
  };

  useEffect(() => {
    const root = document.documentElement;

    const isTouchDevice =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches ||
      navigator.maxTouchPoints > 0;

    // Cursor pixel só no desktop. No mobile/touch ele atrapalha a tela e os controles.
    if (isTouchDevice) {
      root.classList.remove("game-custom-cursor-enabled");
      customCursorRef.current?.classList.remove("is-visible");
      return;
    }

    root.classList.add("game-custom-cursor-enabled");

    const pointerSelector = [
      "button",
      "a",
      "[role='button']",
      "summary",
      "label",
      "input[type='button']",
      "input[type='submit']",
      ".game-menu-option",
      ".game-dialog-box button",
      ".game-tutorial-card button",
      ".game-pause-card button",
      ".game-mobile-controls button",
      ".game-mobile-top-actions button",
    ].join(",");

    function moveCursor(event: MouseEvent) {
      const cursor = customCursorRef.current;
      if (!cursor) return;

      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.classList.add("is-visible");

      const target = event.target instanceof Element ? event.target : null;
      cursor.classList.toggle(
        "is-pointer",
        Boolean(target?.closest(pointerSelector)),
      );
    }

    function hideCursor() {
      customCursorRef.current?.classList.remove("is-visible");
    }

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mouseleave", hideCursor);
    window.addEventListener("blur", hideCursor);

    return () => {
      root.classList.remove("game-custom-cursor-enabled");
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseleave", hideCursor);
      window.removeEventListener("blur", hideCursor);
    };
  }, []);

  return (
    <main
      className={`game-fullscreen-page game-state-${gameState} ${tutorialLaunchZoom ? "game-tutorial-launch-zoom" : ""} ${CONFIG.settings.enableFlashingLights ? "" : "no-flashing"} ${randomVisualEffect.inverted ? "game-screen-rotated" : ""}`}
      style={gameStyle}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div ref={customCursorRef} className="game-custom-cursor" aria-hidden="true" />

      <canvas
        ref={canvasRef}
        className={`game-fullscreen-canvas ${
          gameState === "playing" ||
          gameState === "tutorial" ||
          gameState === "paused" ||
          gameState === "gameOverCutscene" ||
          gameState === "gameOver"
            ? "is-gameplay-visible"
            : "is-menu-hidden"
        }`}
      />

      {gameState === "title" && (
        <img
          className="game-bg-image game-bg-image-title"
          src={assetUrl(ASSETS.titleBackground.src)}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}

      {(gameState === "mainMenu" ||
        gameState === "settings" ||
        gameState === "tutorialChoice") && (
        <img
          className="game-bg-image game-bg-image-menu"
          src={assetUrl(ASSETS.menuBackground.src)}
          alt=""
          aria-hidden="true"
          draggable={false}
        />
      )}

      <div
        className={`game-title-bg-transition ${titleLeaving ? "show" : ""}`}
      />
      <div className={`game-screen-fade ${screenFade ? "show" : ""}`} />

      {randomVisualEffect.flashBlur && (
        <div
          className="game-flash-afterimage"
          style={flashAfterimageStyle}
          aria-hidden="true"
        >
          {flashSnapshot && <img src={flashSnapshot} alt="" />}
        </div>
      )}

      {randomVisualEffect.flashWhite && (
        <div
          className="game-flash-white"
          style={flashWhiteStyle}
          aria-hidden="true"
        />
      )}

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
          {normalLifeSlots.map((_, index) => {
            const heartIsFull = index < playerHp;
            const heartSrc = heartIsFull
              ? CONFIG.uiImages.lifeFull
              : CONFIG.uiImages.lifeEmpty;
            const heartFallback = heartIsFull
              ? CONFIG.uiImages.lifeFullFallback
              : CONFIG.uiImages.lifeEmptyFallback;

            return (
              <img
                key={`normal-${index}-${heartIsFull ? "full" : "empty"}`}
                className={`game-normal-heart ${heartIsFull ? "is-full" : "is-empty"}`}
                data-heart-state={heartIsFull ? "full" : "empty"}
                src={assetUrl(heartSrc)}
                alt={heartIsFull ? "vida" : "vida perdida"}
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                onError={(event) => {
                  const img = event.currentTarget;

                  if (img.dataset.fallbackApplied === "true") return;

                  img.dataset.fallbackApplied = "true";
                  img.src = assetUrl(heartFallback);
                }}
              />
            );
          })}

          {goldenLifeSlots.map((_, index) => (
            <img
              key={`golden-${index}`}
              className="game-golden-heart"
              src={assetUrl(CONFIG.uiImages.heartGolden)}
              alt="vida dourada"
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
              onError={(event) => {
                const img = event.currentTarget;
                img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cpath fill='%23ffd166' d='M32 56S6 40 6 21C6 11 13 6 22 6c5 0 8 2 10 6 2-4 5-6 10-6 9 0 16 5 16 15 0 19-26 35-26 35z'/%3E%3Cpath fill='%23fff3bf' d='M18 14c-4 2-6 5-6 10 0 3 1 6 3 8-1-10 5-16 14-16-3-3-7-4-11-2z'/%3E%3C/svg%3E";
              }}
            />
          ))}
        </div>
      )}

      {(gameState === "playing" || gameState === "paused") &&
        activePowerUpsUi.length > 0 && (
          <div className="game-powerup-hud">
            {activePowerUpsUi.map((power) => (
              <div className="game-powerup-slot" key={power.kind}>
                <img src={power.icon} alt={power.label} draggable={false} />
                {power.remainingMs !== undefined && (
                  <span>{Math.ceil(power.remainingMs / 1000)}S</span>
                )}
              </div>
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
            <span>DICA: Daniel vai te avisar quando o perigo estiver perto.</span>
          </div>
        </section>
      )}

      {gameState === "settings" && (
        <section className="game-screen game-settings-screen">
          <aside className="game-settings-panel">
            <div className="game-settings-header">
              <p className="game-panel-label">CONFIGURAÇÕES</p>
              <button
                type="button"
                className="game-settings-close"
                onClick={voltarDasConfiguracoes}
                aria-label="Fechar configurações"
              >
                X
              </button>
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
                              {option.kind === "toggle" ? (
                                <strong
                                  className={`game-setting-toggle ${value ? "is-on" : "is-off"}`}
                                >
                                  {value ? "✓ CORRETO" : "✕ ERRADO"}
                                </strong>
                              ) : (
                                <>
                                  <span className="game-setting-bar">
                                    <span
                                      style={{ width: `${ratio * 100}%` }}
                                    />
                                  </span>
                                  <strong>
                                    {formatarConfiguracao(option)}
                                  </strong>
                                </>
                              )}
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
        <section className="game-screen game-tutorial-choice-screen">
          <div className="game-launch-preview" aria-hidden="true">
            <div className="game-launch-earth" />
            <div className="game-launch-ship" />
            <div className="game-launch-trail" />
          </div>

          <div className="game-daniel-choice-panel">
            <div className="game-daniel-dialog is-choice">
              <img
                className="game-daniel-icon"
                src={assetUrl(getDanielIcon("normal", danielMouthOpen))}
                alt="Daniel"
                draggable={false}
              />
              <div className="game-daniel-text">
                <strong>DANIEL</strong>
                <p>Cleber, Daniel na escuta! Antes de encarar os robôs da desinformação, quer fazer um tutorial rápido?</p>
              </div>
            </div>

            <div className="game-tutorial-choice-buttons">
              <button type="button" onClick={iniciarTutorialInterativo}>
                FAZER TUTORIAL
              </button>
              <button
                type="button"
                onClick={() => iniciarJogo(currentModeRef.current ?? "story")}
              >
                PULAR E COMEÇAR
              </button>
            </div>
          </div>
        </section>
      )}

      {gameState === "tutorial" && (
        <section className="game-tutorial-overlay">
          <div className="game-tutorial-task">
            <span>PASSO {Math.min(TUTORIAL_ORDER.indexOf(tutorialStep) + 1, TUTORIAL_ORDER.length - 1)}/{TUTORIAL_ORDER.length - 1}</span>
            <strong>
              {tutorialStep === "move" && "MOVIMENTE A NAVE"}
              {tutorialStep === "shot" && "DISPARE O TIRO NORMAL"}
              {tutorialStep === "strong" && "USE O TIRO FORTE"}
              {tutorialStep === "boost" && "TESTE O BOOST"}
              {tutorialStep === "dodge" && "FAÇA UMA ESQUIVA"}
              {tutorialStep === "done" && "TUTORIAL CONCLUÍDO"}
            </strong>
          </div>

          <div className="game-daniel-dialog game-daniel-tutorial-dialog">
            <img
              className="game-daniel-icon"
              src={assetUrl(getDanielIcon(TUTORIAL_DANIEL_TEXT[tutorialStep].expression, danielMouthOpen))}
              alt="Daniel"
              draggable={false}
            />
            <div className="game-daniel-text">
              <strong>DANIEL</strong>
              <p>
                {typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
                  ? TUTORIAL_DANIEL_TEXT[tutorialStep].mobile
                  : TUTORIAL_DANIEL_TEXT[tutorialStep].pc}
              </p>
              {tutorialStep === "done" && (
                <span className="game-tutorial-auto-start">Rota de combate liberada.</span>
              )}
            </div>
          </div>
        </section>
      )}

      {gameState === "paused" && (
        <section className="game-screen game-pause-screen">
          <div className="game-pause-card">
            <p className="game-panel-label">JOGO PAUSADO</p>
            <h2>PAUSADO</h2>
            <button onClick={pausarOuVoltar}>CONTINUAR</button>
            <button onClick={abrirConfiguracoes}>CONFIGURAÇÕES</button>
            <button onClick={voltarAoMenuPrincipal}>VOLTAR AO MENU</button>
          </div>
        </section>
      )}

      {(gameState === "gameOverCutscene" || gameState === "gameOver") && (
        <div
          className={`game-over-white-flash ${gameOverFlash ? "show" : ""}`}
          style={
            {
              "--game-over-flash-x": gameOverFlashOrigin.x,
              "--game-over-flash-y": gameOverFlashOrigin.y,
            } as CSSProperties
          }
        />
      )}

      {gameState === "gameOver" && (
        <section className="game-screen game-over-screen">
          <div className="game-over-card">
            <p>{gameOverTaunt}</p>
            <span className="game-over-wave">VOCE CAIU NA WAVE {gameOverWave}</span>
            <h1>GAME OVER</h1>
            <button
              onClick={() => iniciarJogo(currentModeRef.current ?? "infinite")}
            >
              TENTAR NOVAMENTE
            </button>
            <button onClick={voltarAoMenuPrincipal}>VOLTAR AO MENU</button>
          </div>
        </section>
      )}

      {gameState === "victory" && (
        <section className="game-screen game-victory-screen">
          <div className="game-victory-card">
            <p>MISSÃO CONCLUÍDA</p>
            <span>A TERRA FOI SALVA DA DESINFORMAÇÃO</span>
            <h1>VITÓRIA!</h1>
            <button onClick={() => iniciarJogo("story")}>JOGAR HISTÓRIA DE NOVO</button>
            <button onClick={voltarAoMenuPrincipal}>VOLTAR AO MENU</button>
          </div>
        </section>
      )}

      {(gameState === "playing" || gameState === "tutorial") && (
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

      {(gameState === "playing" || gameState === "tutorial") && (
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
              disabled={gameState === "tutorial" && tutorialStep !== "dodge"}
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
                keysRef.current["shift"] = true;
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                keysRef.current["shift"] = false;
              }}
              onPointerLeave={() => {
                keysRef.current["shift"] = false;
              }}
              onPointerCancel={() => {
                keysRef.current["shift"] = false;
              }}
              disabled={boostCharge < CONFIG.gameplay.boost.maxCharge || (gameState === "tutorial" && tutorialStep !== "boost")}
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
              disabled={gameState === "tutorial" && tutorialStep !== "shot"}
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
                keysRef.current["x"] = true;
              }}
              onPointerUp={(event) => {
                event.preventDefault();
                keysRef.current["x"] = false;
              }}
              onPointerLeave={() => {
                keysRef.current["x"] = false;
              }}
              onPointerCancel={() => {
                keysRef.current["x"] = false;
              }}
              disabled={strongCooldown > 0 || (gameState === "tutorial" && tutorialStep !== "strong")}
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
