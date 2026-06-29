"use client";

/*
  SPACE NEWS V10 — RELEASE POLIDA / SUPORTE NOVO

  Assets novos suportados/recomendados:
  - /game/ui/mobile-pause.png também usado como pause do PC.
  - /sounds/daniel/radio-open.mp3
  - /sounds/daniel/radio-close.mp3
  - /sounds/daniel/boss-warning-01.mp3
  - /sounds/daniel/boss-phase2-01.mp3
  - /sounds/daniel/victory-01.mp3
  - /sounds/chocado-grab.mp3
  - /sounds/chocado-dash.mp3
  - /sounds/chocado-release.mp3
  - /sounds/chocado-phase-two.mp3
  - /sounds/chocado-defeat-burst.mp3
  - /sounds/chocado-final-explosion.mp3
  - /sounds/chocado-orb.mp3
  - /sounds/chocado-laser-charge.mp3
  - /sounds/chocado-laser-fire.mp3
  - /sounds/chocado-serpent.mp3
  - /sounds/chocado-wall.mp3

  CSS V7 faz o rollback visual da HUD e corrige:
  - barras legíveis quando READY
  - powerups perto das barras
  - pause PC dourado com imagem
  - Daniel maior, sem barra azul
  - textos pixel e acentos com fallbacks corretos
*/

// SPACE NEWS V6 HUD CLEAN PATCH: HUD visual rollback is handled in globals.css.

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";


function PWARegister() {
  // Fallback local para evitar build quebrado se app/pwa-register não existir
  // ou se o arquivo for colado no diretório errado. O PWA real continua no site.
  return null;
}

function FeedbackButton({ contexto, compacto }: { contexto?: string; compacto?: boolean }) {
  const label = compacto ? "Feedback" : `Feedback${contexto ? ` · ${contexto}` : ""}`;
  return (
    <a
      href={`mailto:?subject=${encodeURIComponent(`Feedback ${contexto || "Space News"}`)}`}
      className="sn-feedback-fallback"
      aria-label={label}
    >
      ✦ <span>{label}</span>
    </a>
  );
}

function isIOSLikeDevice() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenCapableDocument = Document & {
  webkitFullscreenElement?: Element | null;
};

type GameState =
  | "title"
  | "mainMenu"
  | "multiplayerMenu"
  | "localLobby"
  | "localModeSelect"
  | "onlineLobby"
  | "settings"
  | "extras"
  | "storyCutscene"
  | "tutorialChoice"
  | "tutorial"
  | "playing"
  | "paused"
  | "gameOverCutscene"
  | "gameOver"
  | "victory";

type GameMode = "story" | "infinite" | "localCoop" | "localScore" | "localPvp";
type PlayerSlot = 1 | 2 | 3 | 4;


type ExtraSection = "home" | "credits" | "wiki" | "records";

type LeaderboardEntry = {
  id: string;
  profileId?: string;
  name: string;
  score: number;
  wave: number;
  createdAt: number;
};

type OnlineProfileSummary = {
  id?: string;
  name?: string;
  color?: string;
  friendCode?: string;
  tokens?: number;
  friendsCount?: number;
  requestsCount?: number;
  achievementsUnlocked?: number;
  achievementsTotal?: number;
  equipped?: EquippedCosmetics;
  stats?: Partial<LocalProfileStats>;
  updatedAt?: number;
};

type OnlinePlayer = {
  id?: string;
  slot: number;
  name: string;
  ready: boolean;
  device?: string;
  connected?: boolean;
  host?: boolean;
  cosmetics?: EquippedCosmetics;
  profileColor?: string;
  profileSummary?: OnlineProfileSummary;
};

type OnlineFlow = "choose" | "create" | "join";
type OnlineFeedback = "idle" | "loading" | "success" | "error";
type InputDeviceChoice = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

type OnlineInputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  shot: boolean;
  strong: boolean;
  boost: boolean;
  dodge: boolean;
  pause: boolean;
  pet: boolean;
};

const EMPTY_ONLINE_INPUT_STATE: OnlineInputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  shot: false,
  strong: false,
  boost: false,
  dodge: false,
  pause: false,
  pet: false,
};

type OnlineRuntimePlayerSnapshot = {
  id: string;
  slot: PlayerSlot;
  clientId?: string;
  name: string;
  color: string;
  isLocal?: boolean;
  isHost?: boolean;
  player: Partial<Player>;
  hp: number;
  maxHp: number;
  goldenHp: number;
  alive: boolean;
  ghost: boolean;
  reviveProgress: number;
  input: OnlineInputState;
  effects: OnlineEffectSnapshot;
  cosmetics?: EquippedCosmetics;
  profileColor?: string;
  score?: number;
  active?: boolean;
  waiting?: boolean;
};

type OnlineGameplaySnapshot = {
  /** Tick autoritativo do host. Snapshots velhos são descartados para evitar “voltar no tempo”. */
  tick: number;
  /** Date.now() do host no momento do envio. */
  t: number;
  /** Date.now() adicionado pelo Worker ao relayar o snapshot. */
  serverTime?: number;
  /** Date.now() do host preservado para estimar atraso. */
  sentAt?: number;
  /** performance.now() local de quando o cliente recebeu o snapshot. Evita usar relógio do Worker para interpolação. */
  receivedAt?: number;
  seq?: number;
  authoritativeSlot?: PlayerSlot;
  netModel?: "server-tick-input-v1" | string;
  mode: GameMode | null;
  state: GameState;
  players?: OnlineRuntimePlayerSnapshot[];
  p1?: Partial<Player>;
  p2?: Partial<Player> | null;
  p1Hp?: number;
  p2Hp?: number;
  p1Gold?: number;
  p2Gold?: number;
  score?: number;
  localP1Score?: number;
  localP2Score?: number;
  localPvpRound?: number;
  scoresBySlot?: Record<string, number>;
  activeSlots?: number[];
  waitingSlots?: number[];
  wave?: Partial<WaveState>;
  shots?: Shot[];
  enemies?: Enemy[];
  enemyProjectiles?: EnemyProjectile[];
  bossProjectiles?: BossProjectile[];
  powerUps?: PowerUp[];
  tokens?: TokenPickup[];
  boss?: Partial<BossState>;
  events?: OnlineVisualEvent[];
  p1ShieldActive?: boolean;
  p2ShieldActive?: boolean;
  p1DodgeActive?: boolean;
  p2DodgeActive?: boolean;
  p1BoostActive?: boolean;
  p2BoostActive?: boolean;
  p1Effects?: OnlineEffectSnapshot;
  p2Effects?: OnlineEffectSnapshot;
};

type OnlineEffectSnapshot = {
  shieldMs?: number;
  fireRateMs?: number;
  powerShotMs?: number;
  homingShotMs?: number;
  flamesMs?: number;
  petActive?: boolean;
  petCooldownUntil?: number;
};

type OnlineVisualEventKind =
  | "sound"
  | "explosion"
  | "hit"
  | "shockwave"
  | "tokenBurst"
  | "bump";

type OnlineVisualEvent = {
  id: number;
  kind: OnlineVisualEventKind;
  x?: number;
  y?: number;
  color?: string;
  amount?: number;
  sound?: string;
  volume?: number;
  category?: "menu" | "hit" | "ability" | "sfx";
  radius?: number;
  slot?: PlayerSlot;
  t?: number;
};

type TutorialStep = "move" | "shot" | "strong" | "boost" | "dodge" | "done";

type DanielExpression = "normal" | "alert" | "happy" | "fear" | "serious";

type MobileControlId =
  | "joystick"
  | "shot"
  | "strong"
  | "boost"
  | "dodge"
  | "pet"
  | "pause"
  | "fullscreen";

type MobileControlPlacement = {
  x: number;
  y: number;
  scale: number;
};

type MobileControlLayoutMap = Record<MobileControlId, MobileControlPlacement>;

type BossIntroStage =
  | "idle"
  | "falseClear"
  | "sensor"
  | "approach"
  | "grab"
  | "drag"
  | "throw"
  | "impact"
  | "battle";

type BossDefeatStage = "idle" | "overload" | "collapse" | "final" | "done";

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
  | "bossOrb"
  | "bossWarning"
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
  ownerId?: PlayerSlot;
  bornAt?: number;
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

type DamageNumber = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  value: number;
  color: string;
  life: number;
  maxLife: number;
  crit?: boolean;
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
  blockedPlayer?: 1 | 2 | 3 | 4;
  blockedUntil?: number;
};

type TokenPickup = {
  id: number;
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
  value: number;
  frameOffset: number;
  targetSlot?: PlayerSlot;
  magnetDelay?: number;
  burst?: boolean;
  collectScale?: number;
  pattern?: "line" | "zigzag" | "arc" | "cluster" | "burst";
  patternIndex?: number;
};

type LocalFriend = {
  id: string;
  name: string;
  code?: string;
  status?: "pending" | "accepted" | "blocked";
  lastRoom?: string;
  lastSeenAt: number;
};

type LocalFriendRequest = {
  id: string;
  code: string;
  name: string;
  direction: "sent" | "received";
  createdAt: number;
};

type LocalProfileStats = {
  playTimeMs: number;
  runsStarted: number;
  enemiesKilled: number;
  deaths: number;
  chocadosKilled: number;
  pvpDamage: number;
  pvpWins: number;
  tokensCollected: number;
  bestInfiniteWave: number;
  bestInfiniteScore: number;
};

type LocalAchievement = {
  id: string;
  title: string;
  description: string;
  unlockedAt?: number;
};

type LocalNotification = {
  id: string;
  kind: "update" | "friend" | "shop" | "achievement" | "system";
  title: string;
  message: string;
  createdAt: number;
  readAt?: number;
  action?: "profile" | "friends" | "shop" | "achievements" | "messages";
};

type ProfileTab = "overview" | "stats" | "achievements" | "friends" | "messages";
type ShopPanelTab = "store" | "inventory";
type ShopRarityFilter = "all" | ShopItem["rarity"];

type ShopSlot = "front" | "middle" | "pet" | "recolor";

type ShopBuffs = {
  speed?: number;
  shotSpeed?: number;
  damage?: number;
  maxHp?: number;
  size?: number;
  regenSeconds?: number;
  magnet?: number;
  extraEnemies?: number;
  dodgeCooldown?: number;
  flames?: number;
  defense?: number;
  waveSkipChance?: number;
  freezeOnStart?: number;
  tokenBonus?: number;
};

type ShopItem = {
  id: string;
  name: string;
  slot: ShopSlot;
  price: number;
  rarity: "basic" | "rare" | "epic" | "event" | "legendary";
  description: string;
  asset: string;
  dodgeAsset?: string;
  frames?: string[];
  moveFrames?: string[];
  buffs?: ShopBuffs;
  passive?: string;
  special?: string;
  disabled?: boolean;
  tag?: string;
};

type EquippedCosmetics = {
  front?: string;
  middle?: string;
  pet?: string;
  recolor?: string;
};

type LocalProfile = {
  id: string;
  name: string;
  color: string;
  friendCode: string;
  tokens: number;
  friends: LocalFriend[];
  friendRequests: LocalFriendRequest[];
  stats: LocalProfileStats;
  achievements: LocalAchievement[];
  notifications: LocalNotification[];
  inventory: string[];
  equipped: EquippedCosmetics;
  createdAt: number;
  updatedAt: number;
};

type OnlineEventOverlayState = {
  id: number;
  title: string;
  message: string;
  kind: "info" | "warning" | "danger" | "success";
  until: number;
  countdownUntil?: number;
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
  stretchUntil?: number;
  telegraphSoundPlayed?: boolean;
  angleStart?: number;
  angleEnd?: number;
  sweepStartAt?: number;
  sweepDurationMs?: number;
  visualVariant?: "default" | "phase2" | "prism" | "mine" | "shard";
  driftAmplitude?: number;
  driftFrequency?: number;
  baseY?: number;
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
  phaseTwoAnnounced?: boolean;
};

type BossIntroSequence = {
  active: boolean;
  startAt: number;
  stage: BossIntroStage;
  lastStage: BossIntroStage;
  playerStartX: number;
  playerStartY: number;
  bossTargetX: number;
  baseBackgroundOffset: number;
  impactTriggered: boolean;
};

type BossDefeatSequence = {
  active: boolean;
  startAt: number;
  stage: BossDefeatStage;
  lastBurstAt: number;
  finalTriggered: boolean;
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

type PlayerRuntime = {
  id: string;
  slot: PlayerSlot;
  clientId?: string;
  name: string;
  color: string;
  isLocal: boolean;
  isHost: boolean;

  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  facing: 1 | -1;

  hp: number;
  maxHp: number;
  lives: number;
  goldenLives: number;

  alive: boolean;
  ghost: boolean;
  reviveProgress: number;

  invulnerableUntil: number;
  shieldUntil: number;

  dodgeCooldown: number;
  strongCooldown: number;
  boostEnergy: number;

  powerups: {
    fireRateUntil?: number;
    powerShotUntil?: number;
    homingUntil?: number;
    flamesUntil?: number;
    shieldUntil?: number;
  };

  input: OnlineInputState;

  /** Ponte temporária com o sistema antigo. Enquanto o canvas é quebrado em módulos, todos os slots usam o mesmo Player base. */
  runtime: Player;
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
  action?: "settings" | "extras" | "multiplayer" | "profile" | "shop";
  disabled?: boolean;
  hint?: string;
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
  powerFlames: { src: "/game/powerups/flames.png" },
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

  bossOrb: { src: "/game/bosses/chocado-orb.png" },

  bossWarning: { src: "/game/bosses/chocado-warning.png" },

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

const TOKEN_FRAME_SRCS = [
  "/game/tokens/token-0.png",
  "/game/tokens/token-1.png",
  "/game/tokens/token-2.png",
  "/game/tokens/token-3.png",
];
const TOKEN_SPRITE_SHEET_SRC = "";
const TOKEN_COLLECT_SOUND_SRC = "/sounds/tokens/token-collect.wav";
const TOKEN_BURST_SOUND_SRC = "/sounds/tokens/token-burst.wav";

const CONFIG = {
  canvasWidth: 1280,
  canvasHeight: 720,

  useSprites: true,
  useSounds: true,
  forceFullscreen: true,

  fonts: {
    title: "Pixel Game",
    prompt: "Born2BSporty",
    menu: "Pixel Game",
    ui: "Born2BSporty",
  },

  transitions: {
    titleExitMs: 360,
    menuOpenDelayMs: 70,
    modeSelectMs: 260,
    fadeOutMs: 140,
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
      regenChanceOnBossDamage: 0.01,
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
      randomBoxChanceOnBossDamage: 0.01,
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
        introBarMs: 650,
        introRoarMs: 420,
        floatAmplitude: 16,
        floatSpeed: 0.0022,
        attackDelayMs: 1850,
        servoCountMin: 4,
        servoCountMax: 7,
        servoSpeed: 3.05,
        servoHomingMs: 3600,
        servoBulletLifeMs: 18000,
        servoReturnAtMs: 12500,
        servoReturnDamage: 5,
        servoDamage: 1,
        servoWaveCountMin: 10,
        servoWaveCountMax: 16,
        servoWaveSpeed: 2.85,
        servoWaveSize: 20,
        servoWaveTravelMs: 1900,
        servoWaveLifeMs: 7600,
        laserTelegraphMs: 850,
        laserActiveMs: 1450,
        laserDamage: 1,
        laserThicknessX: 58,
        laserThicknessTriple: 46,
        laserShake: 3.8,
        aimLaserWindupMs: 1850,
        aimLaserLockBeforeMs: 430,
        aimLaserActiveMs: 1850,
        aimLaserThickness: 62,
        aimLaserLength: 1800,
        aimLaserFollow: 0.055,
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

        cannonOrbSpeed: 3.55,
        cannonOrbDamage: 1,
        enragedHp: 250,
        enragedAttackRate: 1.0,
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

    menuAmbience: "/sounds/ambient/menu-ambience.mp3",
    spaceAmbience: "/sounds/ambient/space-ambience.mp3",
    storyMusic: "/sounds/music/story-theme.mp3",
    infiniteMusic: "/sounds/music/infinite-theme.mp3",
    victoryMusic: "/sounds/music/victory-theme.mp3",
    gameOverMusic: "/sounds/music/game-over-theme.mp3",

    abilityReady: "/sounds/ability-ready.mp3",
    powerUpPickup: "/sounds/powerup-pickup.mp3",
    tokenCollect: TOKEN_COLLECT_SOUND_SRC,
    tokenBurst: TOKEN_BURST_SOUND_SRC,
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
    chocadoOrb: "/sounds/chocado-orb.mp3",
    chocadoPhaseTwo: "/sounds/chocado-phase-two.mp3",
    chocadoWarning: "/sounds/chocado-warning.mp3",
    chocadoHit: "/sounds/chocado-hit.mp3",
    chocadoBarrier: "/sounds/chocado-barrier.mp3",
    chocadoOrbFan: "/sounds/chocado-orb-fan.mp3",
    chocadoSerpent: "/sounds/chocado-serpent.mp3",
    chocadoWall: "/sounds/chocado-wall.mp3",
    chocadoAimLock: "/sounds/chocado-aim-lock.mp3",
    chocadoTipOpen: "/sounds/chocado-tip-open.mp3",
    bossUiBeep: "/sounds/boss-ui-beep.mp3",
    chocadoDefeat: "/sounds/chocado-defeat.mp3",
    chocadoMusic: "/sounds/chocado-music.mp3",
    danielRadioOpen: "/sounds/daniel/radio-open.mp3",
    danielRadioClose: "/sounds/daniel/radio-close.mp3",
    danielRadioStatic: "/sounds/daniel/radio-static-short.mp3",
    danielBossIntroVoice: "/sounds/daniel/boss-intro-01.mp3",
    danielBossPhaseVoice: "/sounds/daniel/boss-phase2-01.mp3",
    danielVictoryVoice: "/sounds/daniel/victory-01.mp3",
    danielTutorialMoveVoice: "/sounds/daniel/tutorial-move.mp3",
    danielTutorialShotVoice: "/sounds/daniel/tutorial-shot.mp3",
    danielTutorialStrongVoice: "/sounds/daniel/tutorial-strong.mp3",
    danielTutorialBoostVoice: "/sounds/daniel/tutorial-boost.mp3",
    danielTutorialDodgeVoice: "/sounds/daniel/tutorial-dodge.mp3",
    danielTutorialDoneVoice: "/sounds/daniel/tutorial-done.mp3",
    chocadoGrab: "/sounds/chocado-grab.mp3",
    chocadoDash: "/sounds/chocado-dash.mp3",
    chocadoRelease: "/sounds/chocado-release.mp3",
    chocadoLaserCharge: "/sounds/chocado-laser-charge.mp3",
    chocadoLaserFire: "/sounds/chocado-laser-fire.mp3",
    chocadoDefeatBurst: "/sounds/chocado-defeat-burst.mp3",
    chocadoFinalExplosion: "/sounds/chocado-final-explosion.mp3",
    chocadoIdleLoop: "/sounds/chocado/chocado-idle-loop.mp3",
    chocadoPhaseTwoLoop: "/sounds/chocado/chocado-phase2-loop.mp3",
    chocadoPrismCharge: "/sounds/chocado/chocado-prism-charge.mp3",
    chocadoPrismFire: "/sounds/chocado/chocado-prism-fire.mp3",
    chocadoCorePulse: "/sounds/chocado/chocado-core-pulse.mp3",
    chocadoMineDeploy: "/sounds/chocado/chocado-mine-deploy.mp3",
    chocadoCrossBurst: "/sounds/chocado/chocado-cross-burst.mp3",
    chocadoServoReturn: "/sounds/chocado/chocado-servo-return.mp3",
    chocadoImpact: "/sounds/chocado/chocado-impact.mp3",
    chocadoDeathRumble: "/sounds/chocado/chocado-death-rumble.mp3",
    chocadoHitOne: "/sounds/chocado/chocado-hit-1.mp3",
    chocadoHitTwo: "/sounds/chocado/chocado-hit-2.mp3",
    chocadoHitThree: "/sounds/chocado/chocado-hit-3.mp3",
    victoryFanfare: "/sounds/victory-fanfare.mp3",
    fakeNewsIntercepted: "/sounds/fake-news-intercepted.mp3",
    fakeNewsTransmit: "/sounds/fake-news-transmit.mp3",
    gameOverFinalExplosion: "/sounds/game-over-final-explosion.mp3",
    petSuperSpark: "/sounds/pets/super-faisca.mp3",
    petActivate: "/sounds/pets/pet-activate.mp3",
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
    mobilePet: "/game/ui/mobile-pet.png",
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
    mobileLayout: "compact",
    mobileScale: 1.02,
    mobileOpacity: 0.92,
    mobileButtonGap: 10,
    mobileMirror: false,
    pcMoveLayout: "both",
    pcShootKey: "z",
    pcStrongKey: "x",
    pcBoostKey: "shift",
    pcDodgeKey: "control",
    gamepadEnabled: true,
    gamepadMoveStick: "left",
    gamepadDeadzone: 0.18,
    gamepadShootButton: "1|7",
    gamepadStrongButton: "2|6",
    gamepadBoostButton: "0|5",
    gamepadDodgeButton: "3|4",
    gamepadPauseButton: "9",
    gamepadConfirmButton: "0",
    gamepadBackButton: "1",

    // Áudio
    masterVolume: 1,
    musicVolume: 0.9,
    sfxVolume: 0.62,
    menuVolume: 0.65,
    hitVolume: 0.55,
    abilityVolume: 0.65,

    // Performance / conforto visual
    enableScreenShake: true,
    enableParticles: true,
    particleQuality: 1,
    enableLowHpAlarm: true,
    enableFlashingLights: true,
    enableAbilityReadySounds: true,
    enableBoostFireSprite: true,
    showFps: false,
    performanceMode: "auto",
    fpsLimit: "unlimited",
    autoPauseOnBlur: true,
    resumeCountdown: "3",
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

const CHOCADO_FINAL_FAKE_NEWS = [
  "ALERTA FALSO: cientistas juram que pombos foram treinados para comandar satélites com telepatia.",
  "BOATO ABSURDO: uma nova lei obrigaria todo mundo a entregar a senha do Wi-Fi para provar cidadania digital.",
  "FAKE NEWS CLÁSSICA: refrigerante de cola teria sido aprovado como remédio oficial para aumentar QI em 300%.",
  "MENTIRA INTERGALÁCTICA: robôs professores chegariam amanhã e cancelariam todas as aulas humanas do planeta.",
  "ENGANAÇÃO TOTAL: aplicativo misterioso prometeria prever o futuro com 99% de precisão usando apenas selfie borrada.",
  "RUMOR INVENTADO: satélite secreto estaria escolhendo manualmente onde vai chover para sabotar cidades rivais.",
  "FICÇÃO VIRAL: cidade invisível teria sido encontrada no Atlântico e já cobraria IPTU dos visitantes.",
  "DISPARATE DIGITAL: desligar o Wi-Fi por 10 segundos supostamente removeria vírus, azar e boleto atrasado.",
  "BOATO DE PÂNICO: videogames seriam proibidos depois das 22h por uma superportaria assinada na Lua.",
  "FAKE MÉDICA: bebida caseira feita com alho, café e glitter curaria qualquer doença em menos de cinco minutos.",
];

const HOLD_VARIANT_MS = 1500;
const BOOST_HOLD_MAX_MS = 2400;
const AIM_FADE_MS = 420;

const MAIN_MENU_OPTIONS: MenuOption[] = [
  { label: "HISTÓRIA", mode: "story", hint: "Campanha principal" },
  { label: "INFINITO", mode: "infinite", hint: "Sobreviva o máximo possível" },
  { label: "MULTIPLAYER", action: "multiplayer", hint: "Local e online" },
  { label: "CONFIGURAÇÕES", action: "settings" },
  { label: "SHOP", action: "shop", hint: "Comprar e equipar cosméticos" },
  { label: "EXTRA", action: "extras" },
];

const MULTIPLAYER_BRANCH_OPTIONS = [
  { label: "LOCAL", description: "Mesmo aparelho: teclado, touch e controles." },
  { label: "ONLINE", description: "Criar sala ou entrar com código pelo Worker.", disabled: false },
];

const LOCAL_MODE_OPTIONS: Array<{ label: string; mode: GameMode; description: string; disabled?: boolean }> = [
  { label: "TOGETHER", mode: "localCoop", description: "Coop de sobrevivência contra as waves." },
  // v2.4.9: Versus cortado temporariamente do local/online para publicar o Together estável.
  // O código do modo continua guardado para voltar depois, mas a UI e o start não liberam.
];

const LOCAL_PLAYER_COLORS = ["#60a5fa", "#f97316", "#22c55e", "#e879f9"];
const SPACE_NEWS_VERSION = "2.5.5";


const INPUT_DEVICE_CHOICES: InputDeviceChoice[] = [
  { id: "touch", label: "TOUCH", description: "Tela sensível ao toque detectada", icon: "☝" },
  { id: "keyboard", label: "TECLADO", description: "WASD/SETAS + binds atuais", icon: "⌨" },
  { id: "gamepad", label: "CONTROLE", description: "Controle detectado pelo navegador", icon: "🎮" },
];

function labelModoMultiplayer(mode: GameMode) {
  if (mode === "localCoop") return "TOGETHER";
  if (mode === "localScore") return "DISPUTA";
  if (mode === "localPvp") return "VERSUS";
  if (mode === "infinite") return "INFINITO";
  return "HISTÓRIA";
}

function descricaoModoMultiplayer(mode: GameMode) {
  if (mode === "localCoop") return "Jogue junto e sobreviva.";
  if (mode === "localScore") return "Modo removido.";
  if (mode === "localPvp") return "Versus bloqueado temporariamente; Together fica liberado para publicação.";
  return "Modo especial.";
}

const LEADERBOARD_KEY = "spaceNews.infiniteLeaderboard.v2";
const DEBUG_SEQUENCE = "170626";

const BLOCKED_INITIALS = new Set([
  "SEX",
  "XXX",
  "CUM",
  "ASS",
  "FUK",
  "FUC",
  "FCK",
  "DIC",
  "DCK",
  "TIT",
  "PUS",
  "COC",
  "PQP",
  "FDP",
  "BCT",
  "CUZ",
  "PUT",
  "PNC",
  "VTC",
  "FOD",
  "NIG",
  "FAG",
  "KYS",
  "NAZ",
  "KKK",
]);

const RESERVED_INITIALS = new Set([
  "ADM",
  "DEV",
  "MOD",
  "BOT",
  "SYS",
  "API",
  "CPU",
  "CEO",
  "STA",
]);

function normalizeArcadeInitials(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

function validateArcadeInitials(value: string) {
  const initials = normalizeArcadeInitials(value);
  if (initials.length !== 3) return "Digite exatamente 3 letras.";
  if (BLOCKED_INITIALS.has(initials)) {
    return "Essas iniciais não são permitidas.";
  }
  if (RESERVED_INITIALS.has(initials)) return "Essas iniciais são reservadas.";
  return "";
}

const EXTRA_CREATORS = [
  {
    name: "Nicolas",
    role: "Programador / Compositor",
    initials: "NI",
    image: "/team/nicolas.png",
  },
  {
    name: "Antônio William",
    role: "Marketing / Sugestões",
    initials: "AW",
    image: "/team/antonio.png",
  },
  { name: "Kaleb", role: "Designer", initials: "KA", image: "/team/kaleb.png" },
  {
    name: "Kaiki",
    role: "Artista / Diretor de Arte",
    initials: "PK",
    image: "/team/pedro.png",
  },
  {
    name: "Pablo",
    role: "Pesquisador e produtor",
    initials: "PA",
    image: "/team/pablo.png",
  },
  {
    name: "Magno",
    role: "Testador e pesquisador",
    initials: "MA",
    image: "/team/magno.png",
  },
];

const EXTRA_WIKI = [
  {
    name: "CLEBER",
    tag: "PILOTO",
    image: "/game/wiki/cleber.png",
    text: "Estudante e piloto da Space News. Enfrenta o exército da desinformação em campo.",
  },
  {
    name: "DANIEL",
    tag: "COMUNICAÇÃO",
    image: "/game/wiki/daniel.png",
    text: "Analista e operador de missão. Monitora ameaças, rotas e padrões inimigos.",
  },
  {
    name: "CHOCADO",
    tag: "AMEAÇA PRINCIPAL",
    image: "/game/wiki/chocado.png",
    text: "Comandante dos portais e das máquinas de desinformação. Seu núcleo muda de padrão em combate.",
  },
  {
    name: "SPACE NEWS",
    tag: "NAVE",
    image: "/game/wiki/space-news.png",
    text: "Nave experimental equipada com tiros, boost, esquiva e módulos temporários.",
  },
];

const TUTORIAL_ORDER: TutorialStep[] = [
  "move",
  "shot",
  "strong",
  "boost",
  "dodge",
  "done",
];

const TUTORIAL_DANIEL_TEXT: Record<
  TutorialStep,
  { expression: DanielExpression; pc: string; mobile: string }
> = {
  move: {
    expression: "normal",
    pc: "Daniel na escuta. Controle básico primeiro: mova a Space News para cima, para baixo e para os lados. Preciso confirmar estabilidade antes de liberar combate.",
    mobile:
      "Daniel na escuta. Controle básico primeiro: mova a Space News pelo joystick. Preciso confirmar estabilidade antes de liberar combate.",
  },
  shot: {
    expression: "serious",
    pc: "Alvo de treino entrando pela direita. Use somente o tiro normal com Z. Mantenha distância e elimine o drone roxo.",
    mobile:
      "Alvo de treino entrando pela direita. Use somente o tiro normal. Mantenha distância e elimine o drone roxo.",
  },
  strong: {
    expression: "alert",
    pc: "Formação tripla detectada. Use o tiro forte com X para romper o grupo. Tiro normal está bloqueado nesta etapa.",
    mobile:
      "Formação tripla detectada. Use o tiro forte para romper o grupo. Tiro normal está bloqueado nesta etapa.",
  },
  boost: {
    expression: "serious",
    pc: "Unidade pesada em rota frontal. Use SHIFT para atravessar com boost. Entre decidido e saia antes do impacto.",
    mobile:
      "Unidade pesada em rota frontal. Use o boost para atravessar. Entre decidido e saia antes do impacto.",
  },
  dodge: {
    expression: "alert",
    pc: "Nova investida. Agora não ataque. Use a esquiva no tempo certo e deixe o inimigo passar pela sua linha.",
    mobile:
      "Nova investida. Agora não ataque. Use a esquiva no tempo certo e deixe o inimigo passar pela sua linha.",
  },
  done: {
    expression: "happy",
    pc: "Treinamento confirmado. Mantendo a mesma rota e liberando combate real. Sem corte brusco: a primeira wave entra agora.",
    mobile:
      "Treinamento confirmado. Mantendo a mesma rota e liberando combate real. A primeira wave entra agora.",
  },
};

const BOSS_DANIEL_LINES = {
  falseClear: {
    expression: "happy" as DanielExpression,
    text: "Boa, Cleber. A última formação caiu. Estou fechando o relatório da missão...",
    voice: "/sounds/daniel/boss-false-clear-01.mp3",
  },
  sensor: {
    expression: "serious" as DanielExpression,
    text: "Espera. Tem uma assinatura estranha no sensor. Isso não parece destroço...",
    voice: "/sounds/daniel/boss-sensor-01.mp3",
  },
  warning: {
    expression: "fear" as DanielExpression,
    text: "CLEBER, CUIDADO! O Chocado entrou pela lateral. Reajustando rota agora!",
    voice: "/sounds/daniel/boss-warning-01.mp3",
  },
  bossIntro: {
    expression: "alert" as DanielExpression,
    text: "Chocado está no campo. Observe o padrão antes de atacar e guarde boost para emergências.",
    voice: CONFIG.sounds.danielBossIntroVoice,
  },
  laser: {
    expression: "alert" as DanielExpression,
    text: "Laser carregando. Saia da linha de mira antes do disparo fechar.",
  },
  servo: {
    expression: "serious" as DanielExpression,
    text: "Servos no campo. Priorize espaço livre e destrua o que bloquear sua rota.",
  },
  cannon: {
    expression: "serious" as DanielExpression,
    text: "Projéteis pesados. Movimentos curtos, Cleber. Não se prenda no canto.",
  },
  phaseTwo: {
    expression: "alert" as DanielExpression,
    text: "Ele entrou na segunda fase. Padrões combinados, mas com aviso visual. Espere a abertura antes de gastar boost.",
    voice: CONFIG.sounds.danielBossPhaseVoice,
  },
  critical: {
    expression: "fear" as DanielExpression,
    text: "CLEBER, CUIDADO! Ele está fechando espaço. Priorize sobreviver antes de atacar.",
  },
};

function getDanielIcon(expression: DanielExpression, talking: boolean) {
  const suffix = talking ? "Talk" : "Closed";
  const key =
    `daniel${expression[0].toUpperCase()}${expression.slice(1)}${suffix}` as keyof typeof CONFIG.uiImages;
  return CONFIG.uiImages[key] || CONFIG.uiImages.danielNormalClosed;
}

type GameSettingKey = keyof typeof CONFIG.settings;

type GameSettingOption = {
  key: GameSettingKey;
  label: string;
  category:
    | "ÁUDIO"
    | "VISUAL"
    | "DESEMPENHO"
    | "ACESSIBILIDADE"
    | "MOBILE"
    | "CONTROLES";
  kind: "toggle" | "range" | "select" | "keybind" | "padbind";
  min?: number;
  max?: number;
  step?: number;
  values?: string[];
  formatter?: (value: unknown) => string;
};

const DEFAULT_MOBILE_CONTROL_LAYOUT: MobileControlLayoutMap = {
  joystick: { x: 14, y: 76, scale: 0.88 },
  dodge: { x: 78, y: 68, scale: 0.78 },
  pet: { x: 89, y: 55, scale: 0.58 },
  boost: { x: 89, y: 68, scale: 0.78 },
  shot: { x: 78, y: 84, scale: 0.82 },
  strong: { x: 89, y: 84, scale: 0.82 },
  fullscreen: { x: 90, y: 9, scale: 0.58 },
  pause: { x: 96, y: 9, scale: 0.58 },
};

const MOBILE_CONTROL_LABELS: Record<MobileControlId, string> = {
  joystick: "JOYSTICK",
  shot: "TIRO NORMAL",
  strong: "TIRO FORTE",
  boost: "BOOST",
  dodge: "DODGE",
  pet: "PET",
  pause: "PAUSE",
  fullscreen: "TELA CHEIA",
};

const GAMEPAD_BUTTON_LABELS: Record<string, string> = {
  "0": "A",
  "1": "B",
  "2": "X",
  "3": "Y",
  "4": "L1",
  "5": "R1",
  "6": "L2",
  "7": "R2",
  "8": "Select",
  "9": "Start",
  "10": "Analógico esquerdo",
  "11": "Analógico direito",
  "12": "D-Pad cima",
  "13": "D-Pad baixo",
  "14": "D-Pad esquerda",
  "15": "D-Pad direita",
};

function normalizarBotoesControle(valor: unknown) {
  const texto = String(valor ?? "")
    .trim()
    .toUpperCase();

  const partes = texto
    .split(/[|/,]/g)
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => parte.replace(/^B(?:OTAO|OTÃO|UTTON)?\s*/i, ""))
    .map((parte) => {
      const numero = Number(parte);
      return Number.isFinite(numero) && numero >= 0
        ? String(Math.floor(numero))
        : "";
    })
    .filter(Boolean);

  return Array.from(new Set(partes.length ? partes : ["0"]));
}

function normalizarBotaoControleValor(valor: unknown) {
  return normalizarBotoesControle(valor)[0] || "0";
}

function formatarBotaoControleLabel(valor: unknown) {
  return normalizarBotoesControle(valor)
    .map((key) => GAMEPAD_BUTTON_LABELS[key] || `Botão ${key}`)
    .join(" ou ");
}

const GAMEPAD_ACTION_KEYS = [
  "gamepadShootButton",
  "gamepadStrongButton",
  "gamepadBoostButton",
  "gamepadDodgeButton",
  "gamepadPauseButton",
  "gamepadConfirmButton",
  "gamepadBackButton",
] as const satisfies readonly GameSettingKey[];

const SETTINGS_SECTIONS = [
  "ÁUDIO",
  "VISUAL",
  "DESEMPENHO",
  "ACESSIBILIDADE",
  "MOBILE",
  "CONTROLES",
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
    key: "musicVolume",
    label: "Música",
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
    key: "performanceMode" as GameSettingKey,
    label: "Perfil gráfico",
    category: "DESEMPENHO",
    kind: "select",
    values: ["auto", "performance", "quality"],
    formatter: (v) =>
      String(v) === "performance"
        ? "DESEMPENHO"
        : String(v) === "quality"
          ? "QUALIDADE"
          : "AUTOMÁTICO",
  },
  {
    key: "fpsLimit" as GameSettingKey,
    label: "Limite de FPS",
    category: "DESEMPENHO",
    kind: "select",
    values: [
      "5",
      "10",
      "20",
      "30",
      "50",
      "60",
      "90",
      "120",
      "144",
      "240",
      "unlimited",
    ],
    formatter: (v) =>
      String(v) === "unlimited" ? "SEM LIMITE" : `${String(v)} FPS`,
  },
  {
    key: "showFps" as GameSettingKey,
    label: "Mostrar contador de FPS",
    category: "DESEMPENHO",
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
    key: "resumeCountdown" as GameSettingKey,
    label: "Contagem ao retomar",
    category: "ACESSIBILIDADE",
    kind: "select",
    values: ["0", "1", "2", "3"],
    formatter: (v) => (String(v) === "0" ? "DESATIVADA" : `${String(v)} SEG`),
  },

  {
    key: "showMobileStartHint",
    label: "Dica mobile",
    category: "MOBILE",
    kind: "toggle",
  },
  {
    key: "mobileLayout" as GameSettingKey,
    label: "Posição dos controles",
    category: "MOBILE",
    kind: "select",
    values: ["compact", "balanced", "wide"],
    formatter: (v) =>
      String(v) === "wide"
        ? "ABERTO"
        : String(v) === "balanced"
          ? "EQUILIBRADO"
          : "COMPACTO",
  },
  {
    key: "mobileScale" as GameSettingKey,
    label: "Tamanho dos controles",
    category: "MOBILE",
    kind: "range",
    min: 0.58,
    max: 1,
    step: 0.07,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },
  {
    key: "mobileOpacity" as GameSettingKey,
    label: "Opacidade dos controles",
    category: "MOBILE",
    kind: "range",
    min: 0.45,
    max: 1,
    step: 0.05,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },
  {
    key: "mobileButtonGap" as GameSettingKey,
    label: "Espaço entre botões",
    category: "MOBILE",
    kind: "range",
    min: 4,
    max: 22,
    step: 2,
    formatter: (v) => `${Math.round(Number(v))} px`,
  },
  {
    key: "mobileMirror" as GameSettingKey,
    label: "Inverter lados",
    category: "MOBILE",
    kind: "toggle",
  },
  {
    key: "pcMoveLayout" as GameSettingKey,
    label: "Layout movimento PC",
    category: "CONTROLES",
    kind: "select",
    values: ["both", "wasd", "arrows"],
    formatter: (v) =>
      String(v) === "arrows"
        ? "SETAS"
        : String(v) === "wasd"
          ? "WASD"
          : "WASD + SETAS",
  },
  {
    key: "pcShootKey" as GameSettingKey,
    label: "Tiro normal PC",
    category: "CONTROLES",
    kind: "keybind",
    formatter: (v) => String(v).toUpperCase().replace("SPACE", "ESPAÇO"),
  },
  {
    key: "pcStrongKey" as GameSettingKey,
    label: "Tiro forte PC",
    category: "CONTROLES",
    kind: "keybind",
    formatter: (v) => String(v).toUpperCase(),
  },
  {
    key: "pcBoostKey" as GameSettingKey,
    label: "Boost PC",
    category: "CONTROLES",
    kind: "keybind",
    formatter: (v) => String(v).toUpperCase().replace("SPACE", "ESPAÇO"),
  },
  {
    key: "pcDodgeKey" as GameSettingKey,
    label: "Dodge PC",
    category: "CONTROLES",
    kind: "keybind",
    formatter: (v) =>
      String(v)
        .toUpperCase()
        .replace("CONTROL", "CTRL")
        .replace("SPACE", "ESPAÇO"),
  },
  {
    key: "gamepadEnabled" as GameSettingKey,
    label: "Controle de videogame",
    category: "CONTROLES",
    kind: "toggle",
  },
  {
    key: "gamepadMoveStick" as GameSettingKey,
    label: "Analógico de movimento",
    category: "CONTROLES",
    kind: "select",
    values: ["left", "right"],
    formatter: (v) => (String(v) === "right" ? "DIREITO" : "ESQUERDO"),
  },
  {
    key: "gamepadDeadzone" as GameSettingKey,
    label: "Zona morta do analógico",
    category: "CONTROLES",
    kind: "range",
    min: 0.08,
    max: 0.35,
    step: 0.03,
    formatter: (v) => `${Math.round(Number(v) * 100)}%`,
  },
  {
    key: "gamepadShootButton" as GameSettingKey,
    label: "Tiro normal controle",
    category: "CONTROLES",
    kind: "padbind",
    formatter: (v) => formatarBotaoControleLabel(v),
  },
  {
    key: "gamepadStrongButton" as GameSettingKey,
    label: "Tiro forte controle",
    category: "CONTROLES",
    kind: "padbind",
    formatter: (v) => formatarBotaoControleLabel(v),
  },
  {
    key: "gamepadBoostButton" as GameSettingKey,
    label: "Boost controle",
    category: "CONTROLES",
    kind: "padbind",
    formatter: (v) => formatarBotaoControleLabel(v),
  },
  {
    key: "gamepadDodgeButton" as GameSettingKey,
    label: "Dodge controle",
    category: "CONTROLES",
    kind: "padbind",
    formatter: (v) => formatarBotaoControleLabel(v),
  },
  {
    key: "gamepadPauseButton" as GameSettingKey,
    label: "Pause controle",
    category: "CONTROLES",
    kind: "padbind",
    formatter: (v) => formatarBotaoControleLabel(v),
  },
  {
    key: "gamepadConfirmButton" as GameSettingKey,
    label: "Confirmar menu controle",
    category: "CONTROLES",
    kind: "padbind",
    formatter: (v) => formatarBotaoControleLabel(v),
  },
  {
    key: "gamepadBackButton" as GameSettingKey,
    label: "Voltar menu controle",
    category: "CONTROLES",
    kind: "padbind",
    formatter: (v) => formatarBotaoControleLabel(v),
  },
];

const ASSET_VERSION = "space-news-20260629-v255-mobile-shop-profile";
const ACCESSORY_SPRITES_ENABLED = true; // v2.4.7: acessórios cosméticos reativados com sprites refeitos.
const ASSET_REVISION_STORAGE_KEY = "spaceNews.assetRevision";

function assetRevisionAtual() {
  if (typeof window === "undefined") return ASSET_VERSION;
  try {
    const params = new URLSearchParams(window.location.search);
    const urlRevision = (params.get("sprites") || params.get("assetRev") || "").trim();
    if (urlRevision) {
      window.localStorage.setItem(ASSET_REVISION_STORAGE_KEY, urlRevision.slice(0, 48));
      return urlRevision.slice(0, 48);
    }
    return window.localStorage.getItem(ASSET_REVISION_STORAGE_KEY) || ASSET_VERSION;
  } catch {
    return ASSET_VERSION;
  }
}

function atualizarSpritesSemMexerNoCodigo() {
  if (typeof window === "undefined") return;
  const revision = String(Date.now());
  try {
    window.localStorage.setItem(ASSET_REVISION_STORAGE_KEY, revision);
  } catch {}
  window.location.reload();
}

if (typeof window !== "undefined") {
  (window as typeof window & { spaceNewsRefreshSprites?: () => void }).spaceNewsRefreshSprites = atualizarSpritesSemMexerNoCodigo;
}

function assetUrl(src: string) {
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}v=${encodeURIComponent(assetRevisionAtual())}`;
}

function listarAssetsParaCacheOffline() {
  const urls = new Set<string>();

  for (const config of Object.values(ASSETS)) {
    urls.add(assetUrl(config.src));
    for (const frame of config.frameSrcs ?? []) urls.add(assetUrl(frame));
  }

  for (const value of Object.values(CONFIG.uiImages)) {
    if (typeof value === "string" && value.startsWith("/")) {
      urls.add(assetUrl(value));
    }
  }

  for (const value of Object.values(CONFIG.sounds)) {
    if (typeof value === "string" && value.startsWith("/")) {
      urls.add(assetUrl(value));
    }
  }

  return [...urls];
}

class AssetManager {
  private images = new Map<SpriteKey, HTMLImageElement | null>();
  private frameImages = new Map<SpriteKey, (HTMLImageElement | null)[]>();

  async loadAll(
    onProgress?: (
      loaded: number,
      total: number,
      src: string,
      ok: boolean,
    ) => void,
  ) {
    const entries = Object.entries(ASSETS) as [SpriteKey, SpriteConfig][];
    const total = entries.reduce(
      (sum, [, config]) => sum + 1 + (config.frameSrcs?.length ?? 0),
      0,
    );
    const failed: string[] = [];
    let loaded = 0;

    const loadTracked = async (src: string) => {
      const image = await this.loadImage(src);
      loaded += 1;
      if (!image) failed.push(src);
      onProgress?.(loaded, total, src, Boolean(image));
      return image;
    };

    await Promise.all(
      entries.map(async ([key, config]) => {
        const image = await loadTracked(config.src);
        this.images.set(key, image);

        if (config.frameSrcs && config.frameSrcs.length > 0) {
          const frames = await Promise.all(
            config.frameSrcs.map((frameSrc) => loadTracked(frameSrc)),
          );
          this.frameImages.set(key, frames);
        }
      }),
    );

    return { total, failed: [...new Set(failed)] };
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
      let finalizado = false;

      const finalizar = (image: HTMLImageElement | null) => {
        if (finalizado) return;
        finalizado = true;
        window.clearTimeout(timeout);
        resolve(image);
      };

      const timeout = window.setTimeout(() => {
        console.warn(`Tempo esgotado ao carregar asset: ${src}`);
        finalizar(null);
      }, 15000);

      img.onload = () => finalizar(img);
      img.onerror = () => {
        console.warn(`Asset não encontrado: ${src}`);
        finalizar(null);
      };
      img.src = assetUrl(src);
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

let spaceNewsRandomOverride: (() => number) | null = null;

function criarRngDeterministico(seed: number) {
  let state = Math.max(1, Math.floor(seed) >>> 0);
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashDeterministico(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function randomFloat() {
  return spaceNewsRandomOverride ? spaceNewsRandomOverride() : Math.random();
}

function rand(min: number, max: number) {
  return randomFloat() * (max - min) + min;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
  flipSpriteByVelocity = false,
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  applyVelocityStretch(ctx, vx, vy, stretchMultiplier, stretchPulse);
  ctx.rotate(rotation);
  if (flipSpriteByVelocity && vx < -0.05) ctx.scale(-1, 1);

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
    ctx.ellipse(
      -shot.w * 0.08,
      0,
      shot.w * 0.76,
      shot.h * 0.52,
      0,
      0,
      Math.PI * 2,
    );
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
  ctx.roundRect(
    -shot.w / 2,
    -shot.h / 2,
    shot.w,
    shot.h,
    Math.max(2, shot.h * 0.18),
  );
  ctx.fill();
  ctx.restore();
}


const SPACE_NEWS_PROFILE_KEY = "spaceNews.localProfile.v2";
const SPACE_NEWS_OLD_PROFILE_KEY = "spaceNews.localProfile.v1";
const SPACE_NEWS_NAME_REGISTRY_KEY = "spaceNews.profileNameRegistry.v1";

const PROFILE_COLOR_OPTIONS = ["#60a5fa", "#f97316", "#22c55e", "#e879f9", "#facc15", "#67e8f9"];
const SPACE_NEWS_CREATOR_NAME_RE = /^NINICK$/i;

const SHOP_ITEMS: ShopItem[] = [
  { id: "recolor-classic", name: "Nave Clássica", slot: "recolor", price: 0, rarity: "basic", description: "Visual padrão da nave Space News.", asset: "/game/shop/recolors/recolor-classic-idle.png", dodgeAsset: "/game/shop/recolors/recolor-classic-dodge.png", moveFrames: ["/game/shop/recolors/recolor-classic-move-1.png", "/game/shop/recolors/recolor-classic-move-2.png", "/game/shop/recolors/recolor-classic-move-3.png", "/game/shop/recolors/recolor-classic-move-4.png"] },
  { id: "accessory-none", name: "Nenhum Acessório", slot: "front", price: 0, rarity: "basic", description: "Remove os acessórios da nave.", asset: "/game/shop/icons/normal/accessory-none.png" },
  { id: "pet-none", name: "Nenhum Pet", slot: "pet", price: 0, rarity: "basic", description: "Remove o pet equipado.", asset: "/game/shop/icons/normal/pet-none.png" },
  { id: "recolor-aurora", name: "Recolor Aurora", slot: "recolor", price: 80, rarity: "rare", description: "Pintura fria e brilhante. +tempo de power-ups, -defesa leve.", asset: "/game/shop/recolors/recolor-aurora-idle.png", dodgeAsset: "/game/shop/recolors/recolor-aurora-dodge.png", moveFrames: ["/game/shop/recolors/recolor-aurora-move-1.png", "/game/shop/recolors/recolor-aurora-move-2.png", "/game/shop/recolors/recolor-aurora-move-3.png", "/game/shop/recolors/recolor-aurora-move-4.png"], buffs: { defense: -0.04 } },
  { id: "recolor-circus", name: "Nave do Circo", slot: "recolor", price: 95, rarity: "event", description: "Paleta circense para combinar com acessórios de palhaço.", asset: "/game/shop/recolors/recolor-circus-idle.png", dodgeAsset: "/game/shop/recolors/recolor-circus-dodge.png", moveFrames: ["/game/shop/recolors/recolor-circus-move-1.png", "/game/shop/recolors/recolor-circus-move-2.png", "/game/shop/recolors/recolor-circus-move-3.png", "/game/shop/recolors/recolor-circus-move-4.png"] },
  { id: "front-lunar-hat", name: "Chapéu Lunar", slot: "front", price: 60, rarity: "basic", description: "Chapéu pequeno encaixado na ponta da nave.", asset: "/game/shop/accessories/front/front-lunar-hat.png", dodgeAsset: "/game/shop/accessories/front/front-lunar-hat-dodge.png" },
  { id: "front-space-horn", name: "Chifre Espacial", slot: "front", price: 90, rarity: "rare", description: "Bico agressivo de visual espacial. Cosmético puro.", asset: "/game/shop/accessories/front/front-space-horn.png", dodgeAsset: "/game/shop/accessories/front/front-space-horn-dodge.png", buffs: { damage: 0.06, speed: -0.02 } },
  { id: "front-rinaldo-horn", name: "Chifre Colorido", slot: "front", price: 120, rarity: "epic", description: "Chifre RGB com interior escuro e contorno colorido. Cosmético puro.", asset: "/game/shop/accessories/front/front-rinaldo-horn.png", dodgeAsset: "/game/shop/accessories/front/front-rinaldo-horn-dodge.png", buffs: { damage: 0.09, size: 0.03 } },
  { id: "front-sonic-fin", name: "Barbatana Velocista", slot: "front", price: 110, rarity: "epic", description: "Muda a ponta da nave com visual velocista. Cosmético puro.", asset: "/game/shop/accessories/front/front-sonic-fin.png", dodgeAsset: "/game/shop/accessories/front/front-sonic-fin-dodge.png", buffs: { speed: 0.07, defense: -0.05 } },
  { id: "front-parabolic", name: "Antena Parabólica", slot: "front", price: 85, rarity: "rare", description: "Melhora rastreio dos sinais e combina com tiros teleguiados.", asset: "/game/shop/accessories/front/front-parabolic.png", dodgeAsset: "/game/shop/accessories/front/front-parabolic-dodge.png", buffs: { shotSpeed: 0.03 } },
  { id: "middle-mahoraga-ring", name: "Anel Branco Orbital", slot: "middle", price: 150, rarity: "legendary", description: "Um aro branco giratório de energia cósmica. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-mahoraga-ring.png", dodgeAsset: "/game/shop/accessories/middle/middle-mahoraga-ring-dodge.png", buffs: { damage: 0.1, speed: -0.04 } },
  { id: "middle-giant-cap", name: "Touca Gigante", slot: "middle", price: 100, rarity: "rare", description: "Grande, chamativa e sem cobrir a nave toda. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-giant-cap.png", dodgeAsset: "/game/shop/accessories/middle/middle-giant-cap-dodge.png", buffs: { maxHp: 1, speed: -0.04 } },
  { id: "middle-bat-wings", name: "Asas de Morcego", slot: "middle", price: 130, rarity: "event", description: "Halloween 2026. Asas decorativas para a nave. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-bat-wings.png", dodgeAsset: "/game/shop/accessories/middle/middle-bat-wings-dodge.png", buffs: { speed: 0.06, dodgeCooldown: 0.08 }, tag: "HALLOWEEN 2026" },
  { id: "middle-clown-kit", name: "Kit Palhaço", slot: "middle", price: 75, rarity: "event", description: "Cabelo e nariz de palhaço para a Nave do Circo.", asset: "/game/shop/accessories/middle/middle-clown-kit.png", dodgeAsset: "/game/shop/accessories/middle/middle-clown-kit-dodge.png" },
  { id: "middle-extra-arms", name: "Armamento Extra", slot: "middle", price: 170, rarity: "legendary", description: "Duas mini-naves extras. Único acessório com buff: +tiro, +vida, -velocidade.", asset: "/game/shop/accessories/middle/middle-extra-arms.png", dodgeAsset: "/game/shop/accessories/middle/middle-extra-arms-dodge.png", buffs: { shotSpeed: 0.12, speed: -0.05, maxHp: 1 } },
  { id: "pet-star", name: "Pet Estrela", slot: "pet", price: 90, rarity: "rare", description: "+4% velocidade. Especial: micro impulso e recarga curta.", asset: "/game/shop/pets/pet-star-0.png", frames: ["/game/shop/pets/pet-star-0.png", "/game/shop/pets/pet-star-1.png", "/game/shop/pets/pet-star-2.png", "/game/shop/pets/pet-star-3.png"], buffs: { speed: 0.04 }, passive: "+4% velocidade permanente.", special: "Micro impulso: empurra a nave e reduz um pouco a recarga do tiro forte." },
  { id: "pet-blue-comet", name: "Pet Faísca Azul", slot: "pet", price: 185, rarity: "epic", description: " +5% velocidade e tiro, -3% defesa. Especial: Super Faísca 15s com invencibilidade, dano, fire rate e tiro mais rápido.", asset: "/game/shop/pets/pet-blue-comet-0.png", frames: ["/game/shop/pets/pet-blue-comet-0.png", "/game/shop/pets/pet-blue-comet-1.png", "/game/shop/pets/pet-blue-comet-2.png", "/game/shop/pets/pet-blue-comet-3.png"], buffs: { speed: 0.05, shotSpeed: 0.05, defense: -0.03 }, passive: "+5% velocidade, +5% velocidade de tiro e -3% defesa.", special: "Super Faísca: 15s de invencibilidade, +15% velocidade, +15% fire rate/velocidade do tiro e +15% dano." },
  { id: "pet-red-jumper", name: "Pet Saltador Rubro", slot: "pet", price: 185, rarity: "epic", description: " +6% dano e +8% tokens, -4% velocidade de tiro. Especial: salto-estouro em 3 quicadas e trilha longa de tokens.", asset: "/game/shop/pets/pet-red-jumper-0.png", frames: ["/game/shop/pets/pet-red-jumper-0.png", "/game/shop/pets/pet-red-jumper-1.png", "/game/shop/pets/pet-red-jumper-2.png", "/game/shop/pets/pet-red-jumper-3.png"], buffs: { damage: 0.06, tokenBonus: 0.08, shotSpeed: -0.04 }, passive: "+6% dano, +8% tokens e -4% velocidade de tiro.", special: "Salto Rubro: 3 quicadas em área com trilha longa de tokens." },
  { id: "pet-comet", name: "Pet Cometa", slot: "pet", price: 100, rarity: "rare", description: "+1 vida, -3% velocidade. Especial: rastro que limpa projétil perto.", asset: "/game/shop/pets/pet-comet-0.png", frames: ["/game/shop/pets/pet-comet-0.png", "/game/shop/pets/pet-comet-1.png", "/game/shop/pets/pet-comet-2.png", "/game/shop/pets/pet-comet-3.png"], buffs: { maxHp: 1, speed: -0.03 } },
  { id: "pet-black-hole", name: "Pet Buraco Negro", slot: "pet", price: 220, rarity: "legendary", description: "+6% dano e magnetismo sutil. Especial: puxa inimigos por pouco tempo.", asset: "/game/shop/pets/pet-black-hole-0.png", frames: ["/game/shop/pets/pet-black-hole-0.png", "/game/shop/pets/pet-black-hole-1.png", "/game/shop/pets/pet-black-hole-2.png", "/game/shop/pets/pet-black-hole-3.png"], buffs: { damage: 0.06, magnet: 0.1, speed: -0.04, size: 0.03 } },
  { id: "pet-earth", name: "Pet Terra", slot: "pet", price: 210, rarity: "legendary", description: "+1 vida e regen lenta. Especial: invoca 1 inimigo extra às vezes.", asset: "/game/shop/pets/pet-earth-0.png", frames: ["/game/shop/pets/pet-earth-0.png", "/game/shop/pets/pet-earth-1.png", "/game/shop/pets/pet-earth-2.png", "/game/shop/pets/pet-earth-3.png"], buffs: { maxHp: 1, regenSeconds: 30, extraEnemies: 0.025 } },
  { id: "pet-moon", name: "Pet Lua", slot: "pet", price: 180, rarity: "epic", description: "+3% tiro. Especial: homing curto quando a vida está baixa.", asset: "/game/shop/pets/pet-moon-0.png", frames: ["/game/shop/pets/pet-moon-0.png", "/game/shop/pets/pet-moon-1.png", "/game/shop/pets/pet-moon-2.png", "/game/shop/pets/pet-moon-3.png"], buffs: { shotSpeed: 0.03 } },
  { id: "pet-white-hole", name: "Pet Buraco Branco", slot: "pet", price: 160, rarity: "epic", description: "+4% velocidade e nave menor, -3% dano. Especial: empurra projéteis.", asset: "/game/shop/pets/pet-white-hole-0.png", frames: ["/game/shop/pets/pet-white-hole-0.png", "/game/shop/pets/pet-white-hole-1.png", "/game/shop/pets/pet-white-hole-2.png", "/game/shop/pets/pet-white-hole-3.png"], buffs: { speed: 0.04, damage: -0.03, size: -0.03 } },
  { id: "pet-wormhole", name: "Pet Buraco de Minhoca", slot: "pet", price: 190, rarity: "epic", description: "+4% velocidade e tiro, -1 vida. Especial: recarga forte levemente acelerada.", asset: "/game/shop/pets/pet-wormhole-0.png", frames: ["/game/shop/pets/pet-wormhole-0.png", "/game/shop/pets/pet-wormhole-1.png", "/game/shop/pets/pet-wormhole-2.png", "/game/shop/pets/pet-wormhole-3.png"], buffs: { speed: 0.04, shotSpeed: 0.04, maxHp: -1, dodgeCooldown: 0.04 } },
  { id: "pet-alien", name: "Pet Nave Alienígena", slot: "pet", price: 150, rarity: "rare", description: "+2% velocidade. Especial: recarrega um pouco o boost/forte.", asset: "/game/shop/pets/pet-alien-0.png", frames: ["/game/shop/pets/pet-alien-0.png", "/game/shop/pets/pet-alien-1.png", "/game/shop/pets/pet-alien-2.png", "/game/shop/pets/pet-alien-3.png"], buffs: { speed: 0.02 } },
  { id: "pet-satellite", name: "Pet Satélite", slot: "pet", price: 200, rarity: "legendary", description: "Especial raro: pula uma wave fraca. Dodge demora um pouco mais.", asset: "/game/shop/pets/pet-satellite-0.png", frames: ["/game/shop/pets/pet-satellite-0.png", "/game/shop/pets/pet-satellite-1.png", "/game/shop/pets/pet-satellite-2.png", "/game/shop/pets/pet-satellite-3.png"], buffs: { waveSkipChance: 0.055, dodgeCooldown: 0.1, shotSpeed: 0.02 } },
  { id: "pet-tundra", name: "Pet Tundra", slot: "pet", price: 205, rarity: "epic", description: " +5% defesa e -3% velocidade. Especial: congela e bate 3 vezes: 2, 2 e 4 nos inimigos; 15, 15 e 30 no Chocado.", asset: "/game/shop/pets/pet-tundra-0.png", frames: ["/game/shop/pets/pet-tundra-0.png", "/game/shop/pets/pet-tundra-1.png", "/game/shop/pets/pet-tundra-2.png", "/game/shop/pets/pet-tundra-3.png"], buffs: { defense: 0.05, freezeOnStart: 1, speed: -0.03 }, passive: "+5% defesa, -3% velocidade e micro desaceleração no começo de algumas waves.", special: "Rajada Glacial: congela e aplica 3 hits em sequência. Inimigos: 2/2/4. Chocado: 15/15/30." },
  { id: "pet-sun", name: "Pet Sol", slot: "pet", price: 180, rarity: "epic", description: "+10% lança-chamas. Especial: ativa chama curta às vezes.", asset: "/game/shop/pets/pet-sun-0.png", frames: ["/game/shop/pets/pet-sun-0.png", "/game/shop/pets/pet-sun-1.png", "/game/shop/pets/pet-sun-2.png", "/game/shop/pets/pet-sun-3.png"], buffs: { flames: 0.1 } },
  { id: "pet-milky-way", name: "Pet Via Láctea", slot: "pet", price: 285, rarity: "legendary", description: " +buff geral, mas puxa inimigos extras às vezes. Especial: portal galáctico em pulsos, limpa projéteis, empurra inimigos e abre trilha longa de tokens.", asset: "/game/shop/pets/pet-milky-way-0.png", frames: ["/game/shop/pets/pet-milky-way-0.png", "/game/shop/pets/pet-milky-way-1.png", "/game/shop/pets/pet-milky-way-2.png", "/game/shop/pets/pet-milky-way-3.png"], buffs: { speed: 0.04, damage: 0.05, maxHp: 1, size: -0.02, extraEnemies: 0.02, tokenBonus: 0.1 }, passive: "+4% velocidade, +5% dano, +1 vida e +10% tokens.", special: "Portal Galáctico: limpa projéteis, empurra inimigos e cria uma trilha longa de tokens espaçados." },

  { id: "front-ruby-cap", name: "Boné Rubro", slot: "front", price: 95, rarity: "rare", description: "Boné vermelho arcade para a ponta da nave. Cosmético puro.", asset: "/game/shop/accessories/front/front-ruby-cap.png", dodgeAsset: "/game/shop/accessories/front/front-ruby-cap-dodge.png", tag: "ARCADE" },
  { id: "front-emerald-cap", name: "Boné Esmeralda", slot: "front", price: 95, rarity: "rare", description: "Boné verde arcade para combinar com dupla clássica. Cosmético puro.", asset: "/game/shop/accessories/front/front-emerald-cap.png", dodgeAsset: "/game/shop/accessories/front/front-emerald-cap-dodge.png", tag: "ARCADE" },
  { id: "front-void-mask", name: "Máscara Vazia", slot: "front", price: 145, rarity: "epic", description: "Máscara silenciosa de cavaleiro das cavernas. Cosmético puro.", asset: "/game/shop/accessories/front/front-void-mask.png", dodgeAsset: "/game/shop/accessories/front/front-void-mask-dodge.png", tag: "VAZIO" },
  { id: "front-chaos-crown", name: "Coroa do Caos", slot: "front", price: 150, rarity: "epic", description: "Coroa torta para quem gosta de bagunça controlada. Cosmético puro.", asset: "/game/shop/accessories/front/front-chaos-crown.png", dodgeAsset: "/game/shop/accessories/front/front-chaos-crown-dodge.png", tag: "CAOS" },
  { id: "front-golden-visor", name: "Visor Dourado", slot: "front", price: 135, rarity: "epic", description: "Visor dourado futurista com brilho de nave premium. Cosmético puro.", asset: "/game/shop/accessories/front/front-golden-visor.png", dodgeAsset: "/game/shop/accessories/front/front-golden-visor-dodge.png" },
  { id: "front-news-mic", name: "Microfone News", slot: "front", price: 75, rarity: "basic", description: "Microfone de reportagem espacial na ponta da nave. Cosmético puro.", asset: "/game/shop/accessories/front/front-news-mic.png", dodgeAsset: "/game/shop/accessories/front/front-news-mic-dodge.png" },
  { id: "middle-plumber-kit", name: "Kit Encanador Arcade", slot: "middle", price: 135, rarity: "event", description: "Bigode e botões coloridos em vibe plataforma retrô. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-plumber-kit.png", dodgeAsset: "/game/shop/accessories/middle/middle-plumber-kit-dodge.png", tag: "ARCADE" },
  { id: "middle-void-cloak", name: "Manto Vazio", slot: "middle", price: 165, rarity: "epic", description: "Manto preto com brilho branco para clima de caverna antiga. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-void-cloak.png", dodgeAsset: "/game/shop/accessories/middle/middle-void-cloak-dodge.png" },
  { id: "middle-delta-scarf", name: "Cachecol Delta", slot: "middle", price: 155, rarity: "epic", description: "Cachecol caótico em losangos, feito para rodopiar no espaço. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-delta-scarf.png", dodgeAsset: "/game/shop/accessories/middle/middle-delta-scarf-dodge.png" },
  { id: "middle-gold-wings", name: "Asas Douradas", slot: "middle", price: 210, rarity: "legendary", description: "Asas premium de energia dourada. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-gold-wings.png", dodgeAsset: "/game/shop/accessories/middle/middle-gold-wings-dodge.png" },
  { id: "middle-tv-antenna", name: "Antenas de Transmissão", slot: "middle", price: 115, rarity: "rare", description: "Antenas de TV espacial para uma nave jornalística. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-tv-antenna.png", dodgeAsset: "/game/shop/accessories/middle/middle-tv-antenna-dodge.png" },
  { id: "middle-astro-cape", name: "Capa Astral", slot: "middle", price: 125, rarity: "rare", description: "Capa curta com estrelas, sem cobrir a nave toda. Cosmético puro.", asset: "/game/shop/accessories/middle/middle-astro-cape.png", dodgeAsset: "/game/shop/accessories/middle/middle-astro-cape-dodge.png" },
  { id: "pet-chaos-jester", name: "Pet Bobo Caótico", slot: "pet", price: 260, rarity: "legendary", description: " +6% tiro, +6% dano e -1 vida. Especial: roleta do caos com efeitos bons e ruins bem visíveis.", asset: "/game/shop/pets/pet-chaos-jester-0.png", frames: ["/game/shop/pets/pet-chaos-jester-0.png", "/game/shop/pets/pet-chaos-jester-1.png", "/game/shop/pets/pet-chaos-jester-2.png", "/game/shop/pets/pet-chaos-jester-3.png"], buffs: { shotSpeed: 0.06, damage: 0.06, size: -0.02, maxHp: -1 }, passive: "+6% velocidade de tiro, +6% dano, nave 2% menor e -1 vida.", special: "Roleta do Caos: sorteia explosão, confusão, presente ou azar com VFX/SFX próprios." },
  { id: "pet-void-knight", name: "Pet Cavaleiro Vazio", slot: "pet", price: 245, rarity: "legendary", description: " +1 vida, +4% defesa e -4% velocidade. Especial: corte sombrio frontal que atravessa inimigos e limpa projéteis.", asset: "/game/shop/pets/pet-void-knight-0.png", frames: ["/game/shop/pets/pet-void-knight-0.png", "/game/shop/pets/pet-void-knight-1.png", "/game/shop/pets/pet-void-knight-2.png", "/game/shop/pets/pet-void-knight-3.png"], buffs: { maxHp: 1, defense: 0.04, damage: 0.03, speed: -0.04 }, passive: "+1 vida, +4% defesa, +3% dano e -4% velocidade.", special: "Corte Vazio: lâmina frontal forte, atravessa vários inimigos e apaga projéteis próximos." },
];

const SHOP_DEFAULT_OWNED = ["recolor-classic", "accessory-none", "pet-none"];
const SHOP_SLOTS: ShopSlot[] = ["recolor", "front", "middle", "pet"];
const SHOP_SLOT_LABEL: Record<ShopSlot, string> = { recolor: "RECOLOR", front: "ACESSÓRIOS", middle: "ACESSÓRIOS", pet: "PET" };

const ACHIEVEMENT_CATALOG: LocalAchievement[] = [
  { id: "first-token", title: "Primeiro Token", description: "Coletou sua primeira moeda de transmissão." },
  { id: "ten-tokens", title: "Colecionador", description: "Acumulou 10 tokens no perfil." },
  { id: "hundred-tokens", title: "Cofre Cósmico", description: "Acumulou 100 tokens no perfil." },
  { id: "first-kill", title: "Refutador Júnior", description: "Derrubou o primeiro inimigo." },
  { id: "hundred-kills", title: "Faxina Espacial", description: "Derrubou 100 inimigos." },
  { id: "first-chocado", title: "Chocado? Nem tanto", description: "Derrotou o Chocado pela primeira vez." },
  { id: "infinite-10", title: "Sinal Forte", description: "Chegou na wave 10 do modo infinito." },
  { id: "infinite-25", title: "Antena Lendária", description: "Chegou na wave 25 do modo infinito." },
  { id: "pvp-win", title: "Arena News", description: "Venceu uma partida Versus." },
  { id: "long-play", title: "Plantão Espacial", description: "Jogou por 30 minutos no total." },
  { id: "creator-match", title: "Joguei com o Criador", description: "Entrou em uma sala online com o criador do Space News." },
  { id: "pet-power", title: "Parceiro Cósmico", description: "Usou uma habilidade especial de pet." },
  { id: "shop-first", title: "Primeira Compra", description: "Comprou seu primeiro cosmético na loja." },
  { id: "full-style", title: "Nave Montada", description: "Equipou recolor, frente, meio e pet ao mesmo tempo." },
  { id: "inventory-5", title: "Cabide Orbital", description: "Guardou 5 itens diferentes no inventário." },
  { id: "inventory-12", title: "Coleção de Hangar", description: "Guardou 12 itens diferentes no inventário." },
  { id: "tokens-250", title: "Banco Lunar", description: "Acumulou 250 tokens no perfil." },
  { id: "best-score-5000", title: "Transmissão de Ouro", description: "Fez 5.000 pontos no modo Infinito." },
  { id: "friend-one", title: "Sinal de Amizade", description: "Salvou o primeiro amigo no perfil." },
  { id: "friend-five", title: "Tripulação Formada", description: "Salvou 5 amigos no perfil." },
  { id: "pet-equipped", title: "Mascote a Bordo", description: "Equipou um pet na nave." },
  { id: "first-online-room", title: "Link Aberto", description: "Entrou em uma sala online." },
  { id: "together-ready", title: "Dupla Confirmada", description: "Ficou READY em uma sala Together." },
];

function criarIdPerfilLocal() {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    // fallback abaixo
  }
  return `local-${Date.now().toString(36)}-${randomFloat().toString(36).slice(2, 8)}`;
}

function criarCodigoAmizadeLocal(id = "") {
  const base = String(id || criarIdPerfilLocal()).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `SN-${base || randomFloat().toString(36).slice(2, 8).toUpperCase()}`;
}

function formatarCodigoAmizadeInput(value: string) {
  const raw = String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (!raw) return "";
  const clean = raw.startsWith("SN") ? raw.slice(2) : raw;
  return `SN-${clean.slice(0, 6)}`;
}

function criarStatsPerfilPadrao(): LocalProfileStats {
  return {
    playTimeMs: 0,
    runsStarted: 0,
    enemiesKilled: 0,
    deaths: 0,
    chocadosKilled: 0,
    pvpDamage: 0,
    pvpWins: 0,
    tokensCollected: 0,
    bestInfiniteWave: 0,
    bestInfiniteScore: 0,
  };
}

function normalizarConquistasPerfil(list?: LocalAchievement[]): LocalAchievement[] {
  const unlocked = new Map((Array.isArray(list) ? list : []).map((item) => [item.id, item.unlockedAt]));
  return ACHIEVEMENT_CATALOG.map((item) => ({ ...item, unlockedAt: unlocked.get(item.id) }));
}
function normalizarNotificacoesPerfil(list?: LocalNotification[]): LocalNotification[] {
  const safe = Array.isArray(list) ? list : [];
  return safe
    .map((item) => ({
      id: String(item.id || criarIdPerfilLocal()),
      kind: (["update", "friend", "shop", "achievement", "system"] as LocalNotification["kind"][]).includes(item.kind) ? item.kind : "system",
      title: String(item.title || "Notificação").slice(0, 48),
      message: String(item.message || "").slice(0, 160),
      createdAt: Number(item.createdAt || Date.now()),
      readAt: item.readAt ? Number(item.readAt) : undefined,
      action: item.action,
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 80);
}

function criarNotificacoesPerfilPadrao(): LocalNotification[] {
  return [{
    id: `welcome-${SPACE_NEWS_VERSION}`,
    kind: "update",
    title: `Space News v${SPACE_NEWS_VERSION}`,
    message: "Shop, perfil, amigos, notificações e HUD foram reorganizados para a versão final de publicação.",
    createdAt: Date.now(),
    action: "messages",
  }];
}

function criarPerfilLocalPadrao(): LocalProfile {
  const now = Date.now();
  const id = criarIdPerfilLocal();
  return {
    id,
    name: "Player",
    color: PROFILE_COLOR_OPTIONS[0],
    friendCode: criarCodigoAmizadeLocal(id),
    tokens: 0,
    friends: [],
    friendRequests: [],
    stats: criarStatsPerfilPadrao(),
    achievements: normalizarConquistasPerfil(),
    notifications: criarNotificacoesPerfilPadrao(),
    inventory: [...SHOP_DEFAULT_OWNED],
    equipped: { recolor: "recolor-classic" },
    createdAt: now,
    updatedAt: now,
  };
}

function carregarPerfilLocalInicial(): LocalProfile {
  if (typeof window === "undefined") return criarPerfilLocalPadrao();
  try {
    const raw = window.localStorage.getItem(SPACE_NEWS_PROFILE_KEY) || window.localStorage.getItem(SPACE_NEWS_OLD_PROFILE_KEY);
    if (!raw) return criarPerfilLocalPadrao();
    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    const fallback = criarPerfilLocalPadrao();
    const id = String(parsed.id || fallback.id);
    const parsedStats = (parsed.stats || {}) as Partial<LocalProfileStats>;
    return {
      ...fallback,
      ...parsed,
      id,
      name: String(parsed.name || fallback.name).slice(0, 16),
      color: PROFILE_COLOR_OPTIONS.includes(String(parsed.color)) ? String(parsed.color) : fallback.color,
      friendCode: String(parsed.friendCode || criarCodigoAmizadeLocal(id)).slice(0, 16),
      tokens: Math.max(0, Math.floor(Number(parsed.tokens ?? 0))),
      friends: Array.isArray(parsed.friends) ? parsed.friends.slice(0, 60).map((friend) => ({ ...friend, status: friend.status || "accepted" })) as LocalFriend[] : [],
      friendRequests: Array.isArray(parsed.friendRequests)
        ? parsed.friendRequests.slice(0, 40).map((request) => {
            const item = request as Partial<LocalFriendRequest> & { direction?: string };
            return {
              id: String(item.id || criarIdPerfilLocal()),
              code: String(item.code || "").toUpperCase().slice(0, 16),
              name: String(item.name || item.code || "Pedido").slice(0, 24),
              direction: item.direction === "sent" ? "sent" : "received",
              createdAt: Number(item.createdAt || Date.now()),
            };
          }) as LocalFriendRequest[]
        : [],
      stats: {
        ...criarStatsPerfilPadrao(),
        ...parsedStats,
        playTimeMs: Math.max(0, Number(parsedStats.playTimeMs ?? 0)),
        runsStarted: Math.max(0, Math.floor(Number(parsedStats.runsStarted ?? 0))),
        enemiesKilled: Math.max(0, Math.floor(Number(parsedStats.enemiesKilled ?? 0))),
        deaths: Math.max(0, Math.floor(Number(parsedStats.deaths ?? 0))),
        chocadosKilled: Math.max(0, Math.floor(Number(parsedStats.chocadosKilled ?? 0))),
        pvpDamage: Math.max(0, Math.floor(Number(parsedStats.pvpDamage ?? 0))),
        pvpWins: Math.max(0, Math.floor(Number(parsedStats.pvpWins ?? 0))),
        tokensCollected: Math.max(0, Math.floor(Number(parsedStats.tokensCollected ?? 0))),
        bestInfiniteWave: Math.max(0, Math.floor(Number(parsedStats.bestInfiniteWave ?? 0))),
        bestInfiniteScore: Math.max(0, Math.floor(Number(parsedStats.bestInfiniteScore ?? 0))),
      },
      achievements: normalizarConquistasPerfil(parsed.achievements),
      notifications: normalizarNotificacoesPerfil((parsed as Partial<LocalProfile>).notifications),
      inventory: Array.from(new Set([
        ...SHOP_DEFAULT_OWNED,
        ...(Array.isArray((parsed as Partial<LocalProfile>).inventory) ? ((parsed as Partial<LocalProfile>).inventory as string[]) : []),
      ].map(String).filter(Boolean))),
      equipped: {
        ...fallback.equipped,
        ...(((parsed as Partial<LocalProfile>).equipped || {}) as EquippedCosmetics),
      },
      updatedAt: Number(parsed.updatedAt || Date.now()),
    };
  } catch {
    return criarPerfilLocalPadrao();
  }
}

export default function JogoPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const customCursorRef = useRef<HTMLDivElement | null>(null);

  const keysRef = useRef<Record<string, boolean>>({});
  const gamepadButtonsRef = useRef<Record<string, boolean>>({});
  const gamepadButtonsPressedRef = useRef<Record<string, boolean>>({});
  const gamepadDirectionsPressedRef = useRef<Record<string, boolean>>({});
  const gamepadDirectionsHeldRef = useRef<Record<string, boolean>>({});
  const gamepadAxesRef = useRef({ x: 0, y: 0 });
  const lastGamepadIdRef = useRef("");
  const gamepadStatusRef = useRef("Controle não conectado");
  const gamepadCaptureRef = useRef<GameSettingKey | null>(null);
  const [gamepadStatus, setGamepadStatus] = useState("Controle não conectado");
  const menuDirectionHoldRef = useRef({
    up: { active: false, startedAt: 0, lastRepeatAt: 0 },
    down: { active: false, startedAt: 0, lastRepeatAt: 0 },
    left: { active: false, startedAt: 0, lastRepeatAt: 0 },
    right: { active: false, startedAt: 0, lastRepeatAt: 0 },
  });
  const tutorialChoiceIndexRef = useRef(0);
  const [tutorialChoiceIndex, setTutorialChoiceIndex] = useState(0);
  const mobileShootRef = useRef(false);
  const mobileMoveRef = useRef({ x: 0, y: 0 });
  const mobileStickKnobRef = useRef<HTMLDivElement | null>(null);
  const joystickGeometryRef = useRef<{
    centerX: number;
    centerY: number;
    maxDistance: number;
  } | null>(null);

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
  const [extrasSection, setExtrasSection] = useState<ExtraSection>("home");
  const [selectedWikiCharacter, setSelectedWikiCharacter] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardStatus, setLeaderboardStatus] = useState<
    "loading" | "online" | "offline"
  >("loading");
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [recordPromptOpen, setRecordPromptOpen] = useState(false);
  const [recordName, setRecordName] = useState("");
  const [recordError, setRecordError] = useState("");
  const recordPromptShownRef = useRef(false);
  const debugSequenceRef = useRef("");
  const debugUnlockedRef = useRef(false);
  const debugUsedRef = useRef(false);
  const [debugNotice, setDebugNotice] = useState("");

  const settingsIndexRef = useRef(0);
  const [settingsIndex, setSettingsIndex] = useState(0);
  const [settingsSection, setSettingsSection] =
    useState<(typeof SETTINGS_SECTIONS)[number]>("ÁUDIO");
  const settingsSectionRef = useRef<(typeof SETTINGS_SECTIONS)[number]>("ÁUDIO");
  const [settingsSnapshot, setSettingsSnapshot] = useState({
    ...CONFIG.settings,
  });
  const settingsReturnStateRef = useRef<GameState>("mainMenu");
  const keyBindCaptureRef = useRef<GameSettingKey | null>(null);
  const keyBindDialogOpenRef = useRef(false);
  const [keyBindPrompt, setKeyBindPrompt] = useState<{
    settingKey: GameSettingKey;
    label: string;
    candidate: string | null;
    kind: "keyboard" | "gamepad";
  } | null>(null);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [selectedMobileControl, setSelectedMobileControl] =
    useState<MobileControlId>("shot");
  const [mobileControlLayout, setMobileControlLayout] =
    useState<MobileControlLayoutMap>(DEFAULT_MOBILE_CONTROL_LAYOUT);
  const [fpsUi, setFpsUi] = useState(60);
  const fpsCounterRef = useRef({
    frames: 0,
    lastAt: performance.now(),
    value: 60,
  });
  const adaptivePerformanceRef = useRef({
    reduced: false,
    lowSamples: 0,
    highSamples: 0,
  });
  const [resumeCountdown, setResumeCountdown] = useState<number | null>(null);
  const resumeCountdownTimerRef = useRef<number | null>(null);
  const resumeCountdownActiveRef = useRef(false);

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
  const [player2Hp, setPlayer2Hp] = useState(CONFIG.gameplay.player.maxHp);
  const [player2GoldenHp, setPlayer2GoldenHp] = useState(0);
  const [player2DodgeReadyRatio, setPlayer2DodgeReadyRatio] = useState(1);
  const [player2StrongReadyRatio, setPlayer2StrongReadyRatio] = useState(1);
  const [player2BoostReadyRatio, setPlayer2BoostReadyRatio] = useState(1);
  const [localP1Score, setLocalP1Score] = useState(0);
  const [localP2Score, setLocalP2Score] = useState(0);
  const [localPvpRound, setLocalPvpRound] = useState(1);
  const [localModeNotice, setLocalModeNotice] = useState("");
  const [multiplayerBranchIndex, setMultiplayerBranchIndex] = useState(0);
  const [localLobbyIndex, setLocalLobbyIndex] = useState(1);
  const [localModeIndex, setLocalModeIndex] = useState(0);
  const [pauseIndex, setPauseIndex] = useState(0);
  const [localPlayerSlots, setLocalPlayerSlots] = useState([
    { id: 1, name: "P1", ready: true, input: "TECLADO/TOUCH", device: "primary", color: LOCAL_PLAYER_COLORS[0] },
    { id: 2, name: "P2", ready: false, input: "APERTE U OU A", device: "", color: LOCAL_PLAYER_COLORS[1] },
    { id: 3, name: "P3", ready: false, input: "AGUARDANDO", device: "", color: LOCAL_PLAYER_COLORS[2] },
    { id: 4, name: "P4", ready: false, input: "AGUARDANDO", device: "", color: LOCAL_PLAYER_COLORS[3] },
  ]);
  const [onlineRoomCode, setOnlineRoomCode] = useState("");
  const [onlineJoinCode, setOnlineJoinCode] = useState("");
  const [onlinePlayerName, setOnlinePlayerName] = useState("Player");
  const [onlineStatus, setOnlineStatus] = useState("Crie uma sala ou entre com código.");
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [onlineConnected, setOnlineConnected] = useState(false);
  const onlineConnectedRef = useRef(false);
  const [onlineCanStart, setOnlineCanStart] = useState(false);
  const [onlineIsReady, setOnlineIsReady] = useState(false);
  const [onlinePing, setOnlinePing] = useState<number | null>(null);
  const [onlineWsUrl, setOnlineWsUrl] = useState("");
  const [onlineSlot, setOnlineSlot] = useState(0);
  const [onlineHostSlot, setOnlineHostSlot] = useState(1);
  const [onlineFlow, setOnlineFlow] = useState<OnlineFlow>("choose");
  const [onlineFeedback, setOnlineFeedback] = useState<OnlineFeedback>("idle");
  const [onlineCheckingRoom, setOnlineCheckingRoom] = useState(false);
  const [onlineSelectedMode, setOnlineSelectedMode] = useState<GameMode>("localCoop");
  const [onlineModeVotes, setOnlineModeVotes] = useState<Record<number, GameMode>>({});
  const [onlineDeviceIndex, setOnlineDeviceIndex] = useState(0);
  const [onlineMenuIndex, setOnlineMenuIndex] = useState(0);
  const [detectedInputDevices, setDetectedInputDevices] = useState<InputDeviceChoice[]>(INPUT_DEVICE_CHOICES);
  const [onlineGameplayActive, setOnlineGameplayActive] = useState(false);
  const [onlineMatchIntroUntil, setOnlineMatchIntroUntil] = useState(0);
  const [onlinePauseRequestedBy, setOnlinePauseRequestedBy] = useState<number | null>(null);
  const [onlinePauseReadySlots, setOnlinePauseReadySlots] = useState<number[]>([]);
  const [onlinePausePanelOpen, setOnlinePausePanelOpen] = useState(false);
  const [onlineSyncWarning, setOnlineSyncWarning] = useState("");
  const [onlineEventOverlay, setOnlineEventOverlay] = useState<OnlineEventOverlayState | null>(null);
  const [onlineScoresBySlot, setOnlineScoresBySlot] = useState<Record<number, number>>({});
  const [onlineActiveSlots, setOnlineActiveSlots] = useState<number[]>([]);
  const [onlineWaitingSlots, setOnlineWaitingSlots] = useState<number[]>([]);
  const [localProfile, setLocalProfile] = useState<LocalProfile>(() => carregarPerfilLocalInicial());
  const [profileManagerOpen, setProfileManagerOpen] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<ProfileTab>("overview");
  const [selectedOnlineProfileSlot, setSelectedOnlineProfileSlot] = useState<number | null>(null);
  const [shopManagerOpen, setShopManagerOpen] = useState(false);
  const [profileFriendCodeInput, setProfileFriendCodeInput] = useState("");
  const [shopTab, setShopTab] = useState<ShopSlot>("front");
  const [shopMode, setShopMode] = useState<ShopPanelTab>("store");
  const [shopSearch, setShopSearch] = useState("");
  const [shopRarityFilter, setShopRarityFilter] = useState<ShopRarityFilter>("all");
  const [shopPreviewItemId, setShopPreviewItemId] = useState<string>("");
  const [petAbilityCooldownUi, setPetAbilityCooldownUi] = useState(0);
  const [pingBoardOpen, setPingBoardOpen] = useState(false);
  const [profileToast, setProfileToast] = useState("");
  const [achievementPopup, setAchievementPopup] = useState<LocalAchievement | null>(null);
  const [inviteFriendsOpen, setInviteFriendsOpen] = useState(false);
  const [tokensVisibleUntil, setTokensVisibleUntil] = useState(0);
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
  const mobileRuntimeRef = useRef(false);
  const scoreUiTimerRef = useRef<number | null>(null);
  const boostUiTimerRef = useRef<number | null>(null);
  const lastPowerUpUiAtRef = useRef(0);
  const lastPowerUpUiSignatureRef = useRef("");
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
  const storyBossRevealTimeoutsRef = useRef<number[]>([]);
  const bossDanielTimeoutRef = useRef<number | null>(null);
  const [bossDanielLine, setBossDanielLine] = useState<{
    text: string;
    expression: DanielExpression;
    visible: boolean;
  }>({ text: "", expression: "normal", visible: false });
  const bossTipTimeoutRef = useRef<number | null>(null);
  const [bossTipVisible, setBossTipVisible] = useState(false);
  const bossIntroSequenceRef = useRef<BossIntroSequence>({
    active: false,
    startAt: 0,
    stage: "idle",
    lastStage: "idle",
    playerStartX: 0,
    playerStartY: 0,
    bossTargetX: CONFIG.canvasWidth - CONFIG.gameplay.boss.chocado.width - 8,
    baseBackgroundOffset: 0,
    impactTriggered: false,
  });
  const [bossCinematicStage, setBossCinematicStage] =
    useState<BossIntroStage>("idle");
  const bossDefeatSequenceRef = useRef<BossDefeatSequence>({
    active: false,
    startAt: 0,
    stage: "idle",
    lastBurstAt: 0,
    finalTriggered: false,
  });
  const [bossDefeatStage, setBossDefeatStage] =
    useState<BossDefeatStage>("idle");
  const [victoryStep, setVictoryStep] = useState(0);
  const [victoryFakeNews, setVictoryFakeNews] = useState(
    CHOCADO_FINAL_FAKE_NEWS[0],
  );
  const [victoryFakeNewsCode, setVictoryFakeNewsCode] = useState("1706261");
  const [victoryFakeNewsCopied, setVictoryFakeNewsCopied] = useState(false);

  const assetsRef = useRef(new AssetManager());
  const assetLoadRunRef = useRef(0);
  const [assetLoadState, setAssetLoadState] = useState({
    loading: true,
    loaded: 0,
    total: 1,
  });
  const [missingAssets, setMissingAssets] = useState<string[]>([]);
  const [assetWarningVisible, setAssetWarningVisible] = useState(false);
  const enemyIdRef = useRef(0);
  const shotIdRef = useRef(0);

  const playerRef = useRef<Player>(createInitialPlayer());
  const player2Ref = useRef<Player | null>(null);
  const playersRef = useRef<PlayerRuntime[]>([]);
  const player2InputRef = useRef({ x: 0, y: 0 });
  const player2ButtonsRef = useRef<Record<string, boolean>>({});
  const player2ButtonsPressedRef = useRef<Record<string, boolean>>({});
  const player2BoostReadyAtRef = useRef(0);
  const player2RespawnAtRef = useRef(0);
  const localP1ScoreRef = useRef(0);
  const localP2ScoreRef = useRef(0);
  const localPvpRoundRef = useRef(1);
  const localPvpMatchLockedRef = useRef(false);
  const localReviveHoldRef = useRef({ target: 0, progress: 0, lastAt: 0 });
  const lastPvpPowerDropAtRef = useRef(0);
  const localPlayerSlotsRef = useRef(localPlayerSlots);
  const multiplayerBranchIndexRef = useRef(0);
  const localLobbyIndexRef = useRef(1);
  const localModeIndexRef = useRef(0);
  const pauseIndexRef = useRef(0);
  const onlineSocketRef = useRef<WebSocket | null>(null);
  const onlinePingTimerRef = useRef<number | null>(null);
  const onlinePingStartedAtRef = useRef(0);
  const onlineSlotRef = useRef(0);
  const onlineMatchSeedRef = useRef(0);
  const onlineHostSlotRef = useRef(1);
  const onlineMenuIndexRef = useRef(0);
  const onlineFlowRef = useRef<OnlineFlow>("choose");
  const onlineSelectedModeRef = useRef<GameMode>("localCoop");
  const onlineDeviceIndexRef = useRef(0);
  const detectedInputDevicesRef = useRef<InputDeviceChoice[]>(INPUT_DEVICE_CHOICES);
  const onlineGameplayActiveRef = useRef(false);
  const onlineServerAuthoritativeRef = useRef(false);
  const onlineRemoteInputsRef = useRef<Record<number, OnlineInputState>>({});
  const onlineLastInputSentAtRef = useRef(0);
  const onlineInputSeqRef = useRef(0);
  const onlineLastInputPayloadRef = useRef("");
  const onlineLastSyncSentAtRef = useRef(0);
  const onlineLastSyncReceivedAtRef = useRef(0);
  const onlineLastAppliedSyncAtRef = useRef(0);
  const onlineLastExtrapolatedAtRef = useRef(0);
  const onlineSnapshotSeqRef = useRef(0);
  const onlineLatestSnapshotRef = useRef<OnlineGameplaySnapshot | null>(null);
  const onlineSnapshotBufferRef = useRef<OnlineGameplaySnapshot[]>([]);
  const onlineLastAppliedSnapshotTickRef = useRef(0);
  const onlineLastAppliedSnapshotSeqRef = useRef(0);
  const onlineRenderDelayMsRef = useRef(12);
  const onlineHardCatchUpDelayMsRef = useRef(180);
  const onlineLastWorldResyncSentAtRef = useRef(0);
  const onlineApplyingRemoteWorldEventRef = useRef(false);
  const onlinePredictedBoostReadyAtRef = useRef(0);
  const onlinePauseRequestedByRef = useRef<number | null>(null);
  const onlinePauseReadySlotsRef = useRef<number[]>([]);
  const onlinePausePanelOpenRef = useRef(false);
  const player2PowerShotUntilRef = useRef(0);
  const player2HomingShotUntilRef = useRef(0);
  const player2FireRateUntilRef = useRef(0);
  const player2FlamesUntilRef = useRef(0);
  const player2ShieldUntilRef = useRef(0);
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
  const damageNumbersRef = useRef<DamageNumber[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const bossProjectilesRef = useRef<BossProjectile[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const powerUpIdRef = useRef(0);
  const tokensRef = useRef<TokenPickup[]>([]);
  const tokenIdRef = useRef(0);
  const nextTokenSpawnAtRef = useRef(0);
  const localProfileRef = useRef<LocalProfile>(localProfile);
  const tokensVisibleUntilRef = useRef(0);
  const tokenSpriteRef = useRef<HTMLImageElement | null>(null);
  const tokenSpriteReadyRef = useRef(false);
  const tokenFrameImagesRef = useRef<HTMLImageElement[]>([]);
  const tokenUiPulseUntilRef = useRef(0);
  const shopImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const petFrameRef = useRef(0);
  const lastPetFrameAtRef = useRef(0);
  const lastPassiveRegenAtRef = useRef(0);
  const petSkillReadyAtRef = useRef<Record<string, number>>({});
  const petBlackHolePullUntilRef = useRef(0);
  const petSkillMessageUntilRef = useRef(0);
  const petAbilityCooldownUntilRef = useRef(0);
  const petSuperSparkUntilRef = useRef(0);
  const mobilePetPressedRef = useRef(false);
  const onlineCosmeticsBySlotRef = useRef<Record<number, EquippedCosmetics>>({});
  const onlineProfileColorBySlotRef = useRef<Record<number, string>>({});
  const profilePlayTickRef = useRef(performance.now());
  const onlineEventOverlayIdRef = useRef(0);
  const onlineVisualEventSeqRef = useRef(0);
  const onlineVisualEventLogRef = useRef<OnlineVisualEvent[]>([]);
  const lastDeviceRefreshAtRef = useRef(0);
  const achievementPopupTimerRef = useRef<number | null>(null);
  const onlineSeenVisualEventsRef = useRef<Set<number>>(new Set());
  const fireRateUntilRef = useRef(0);
  const powerShotUntilRef = useRef(0);
  const homingShotUntilRef = useRef(0);
  const flamesUntilRef = useRef(0);
  const flamesLoopAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastFlamesHitSoundAtRef = useRef(0);
  const lastBossPowerUpAtRef = useRef(0);
  const [activePowerUpsUi, setActivePowerUpsUi] = useState<ActivePowerUpUi[]>(
    [],
  );
  const [player2ActivePowerUpsUi, setPlayer2ActivePowerUpsUi] = useState<ActivePowerUpUi[]>([]);
  const lastPlayer2PowerUpUiSignatureRef = useRef("");
  const shieldActiveRef = useRef(false);
  const [, setShieldActive] = useState(false);
  const powerGlowRef = useRef({ color: "", endAt: 0 });
  const audioPoolRef = useRef(new Map<string, HTMLAudioElement[]>());
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferCacheRef = useRef(new Map<string, AudioBuffer>());
  const audioBufferLoadingRef = useRef(
    new Map<string, Promise<AudioBuffer | null>>(),
  );
  const lastSoundPlayedAtRef = useRef(new Map<string, number>());
  const powerUpTrailAudiosRef = useRef(new Map<number, HTMLAudioElement>());
  const audioPoolIndexRef = useRef(new Map<string, number>());
  const slowPlayerUntilRef = useRef(0);
  const bossProjectileIdRef = useRef(0);
  const bossAttackHistoryRef = useRef<number[]>([]);
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
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const gameplayMusicAudioRef = useRef<HTMLAudioElement | null>(null);
  const bossHumAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastBossHitVoiceAtRef = useRef(0);
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

  function resetarRepeticaoDirecionalMenu() {
    menuDirectionHoldRef.current = {
      up: { active: false, startedAt: 0, lastRepeatAt: 0 },
      down: { active: false, startedAt: 0, lastRepeatAt: 0 },
      left: { active: false, startedAt: 0, lastRepeatAt: 0 },
      right: { active: false, startedAt: 0, lastRepeatAt: 0 },
    };
  }

  function setEstado(estado: GameState) {
    if (estado !== "playing") {
      limparTimersRevelacaoBoss();
      setBossDanielLine((current) => ({ ...current, visible: false }));
    }
    if (
      estado !== "mainMenu" &&
      estado !== "multiplayerMenu" &&
      estado !== "localLobby" &&
      estado !== "localModeSelect" &&
      estado !== "onlineLobby" &&
      estado !== "settings" &&
      estado !== "paused" &&
      estado !== "tutorialChoice"
    ) {
      resetarRepeticaoDirecionalMenu();
    }
    const previous = gameStateRef.current;
    const importantStates: GameState[] = [
      "mainMenu", "multiplayerMenu", "localLobby", "localModeSelect", "onlineLobby",
      "storyCutscene", "tutorialChoice", "tutorial", "playing", "paused", "gameOver", "victory",
    ];
    const estadoEnvolveOnlineLobby = previous === "onlineLobby" || estado === "onlineLobby";
    // v1.8.0: no mobile/dispositivo fraco, a transição com overlay/backdrop ao abrir o online
    // causava queda forte de FPS e, em alguns navegadores, bloqueava o scroll do lobby.
    // O lobby online agora abre direto; gameplay/cutscenes continuam podendo usar fade.
    if (estadoEnvolveOnlineLobby) {
      setEscurecendo(false);
    } else if (previous !== estado && importantStates.includes(previous) && importantStates.includes(estado)) {
      setEscurecendo(true);
      window.setTimeout(() => setEscurecendo(false), 180);
    }
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


  function isLocalMode(mode = currentModeRef.current) {
    return mode === "localCoop" || mode === "localScore" || mode === "localPvp";
  }

  function isLocalWaveMode(mode = currentModeRef.current) {
    return mode === "localCoop" || mode === "localScore";
  }

  function isLocalPvpMode(mode = currentModeRef.current) {
    return mode === "localPvp";
  }

  function isOnlineGameplayMode() {
    return onlineGameplayActiveRef.current && isLocalMode(currentModeRef.current);
  }

  function deveProjetarOnlinePvpLocal() {
    return onlineGameplayActiveRef.current && onlineSlotRef.current > 1 && isLocalPvpMode(currentModeRef.current);
  }



  function slotLocalOnline(): PlayerSlot {
    const slot = Number(onlineSlotRef.current || 1);
    return (slot >= 1 && slot <= 4 ? slot : 1) as PlayerSlot;
  }

  function slotsRemotosOnline(): PlayerSlot[] {
    const local = slotLocalOnline();
    return onlinePlayers
      .map((p) => Number(p.slot))
      .filter((slot): slot is PlayerSlot => slot >= 1 && slot <= 4 && slot !== local)
      .sort((a, b) => a - b);
  }

  function slotVisualPlayer1Online(): PlayerSlot {
    return onlineGameplayActiveRef.current ? slotLocalOnline() : 1;
  }

  function slotVisualPlayer2Online(): PlayerSlot {
    const remote = slotsRemotosOnline()[0];
    return (remote || (slotLocalOnline() === 1 ? 2 : 1)) as PlayerSlot;
  }

  function espelharOnlinePvpVisual() {
    // v1.2.1: o espelhamento global do canvas causava controles/power-ups invertidos e dessincronização visual.
    // Agora o cliente P2 recebe um snapshot projetado: o player local fica à esquerda sem inverter a UI inteira.
    return false;
  }

  function espelharXOnline(x = 0, w = 0) {
    return CONFIG.canvasWidth - x - w;
  }

  function espelharPlayerOnline<T extends Partial<Player> | null | undefined>(player: T): T {
    if (!player) return player;
    const w = Number(player.w ?? CONFIG.gameplay.player.width);
    return {
      ...player,
      x: espelharXOnline(Number(player.x ?? 0), w),
      vx: typeof player.vx === "number" ? -player.vx : player.vx,
      boostVx: typeof player.boostVx === "number" ? -player.boostVx : player.boostVx,
      stretchVx: typeof player.stretchVx === "number" ? -player.stretchVx : player.stretchVx,
      throwVx: typeof player.throwVx === "number" ? -player.throwVx : player.throwVx,
      lastInputX: typeof player.lastInputX === "number" ? -player.lastInputX : player.lastInputX,
      tilt: typeof player.tilt === "number" ? -player.tilt : player.tilt,
    } as T;
  }

  function espelharObjetoOnline<T extends { x: number; w: number; vx?: number; stretchVx?: number }>(obj: T): T {
    return {
      ...obj,
      x: espelharXOnline(Number(obj.x || 0), Number(obj.w || 0)),
      vx: typeof obj.vx === "number" ? -obj.vx : obj.vx,
      stretchVx: typeof obj.stretchVx === "number" ? -obj.stretchVx : obj.stretchVx,
    };
  }

  function souHostOnline() {
    return onlineGameplayActiveRef.current && onlineSlotRef.current > 0 && onlineSlotRef.current === onlineHostSlotRef.current;
  }

  function onlineTogetherCoordenado() {
    return onlineGameplayActiveRef.current && currentModeRef.current === "localCoop" && onlineHostSlotRef.current === 0 && !onlineServerAuthoritativeRef.current;
  }

  function slotAutoridadeMundoOnlineTogether(): PlayerSlot {
    const slots = slotsMultiplayerAtivos()
      .filter((slot): slot is PlayerSlot => slot >= 1 && slot <= 4)
      .sort((a, b) => a - b);
    return (slots[0] || 1) as PlayerSlot;
  }

  function souAutoridadeMundoOnlineTogether() {
    return onlineTogetherCoordenado() && slotLocalOnline() === slotAutoridadeMundoOnlineTogether();
  }

  function bloquearVersusTemporariamente(reason = "Versus está bloqueado neste patch para estabilizar o Together.") {
    setLocalModeNotice(reason);
    window.setTimeout(() => setLocalModeNotice(""), 2600);
    feedbackOnline("idle", reason);
    tocarSom(CONFIG.sounds.menuBack, 0.24, "menu");
  }

  function posicaoCoopPorSlot(slot: PlayerSlot) {
    const lanes: Record<PlayerSlot, { x: number; y: number }> = {
      1: { x: 112, y: CONFIG.canvasHeight / 2 - 112 },
      2: { x: 112, y: CONFIG.canvasHeight / 2 + 42 },
      3: { x: 178, y: CONFIG.canvasHeight / 2 - 196 },
      4: { x: 178, y: CONFIG.canvasHeight / 2 + 126 },
    };
    return lanes[slot] || lanes[1];
  }

  function aplicarPosicaoCoopPorSlot(player: Player, slot: PlayerSlot) {
    const pos = posicaoCoopPorSlot(slot);
    player.x = clamp(pos.x, 0, CONFIG.canvasWidth - player.w);
    player.y = clamp(pos.y, 0, CONFIG.canvasHeight - player.h);
    player.vx = 0;
    player.vy = 0;
  }

  function ativarRngDeterministicoOnlineTogether(salt: string) {
    if (!onlineTogetherCoordenado()) return () => {};
    const previous = spaceNewsRandomOverride;
    const seed = hashDeterministico(`${onlineMatchSeedRef.current || 1}:${salt}`);
    spaceNewsRandomOverride = criarRngDeterministico(seed);
    return () => { spaceNewsRandomOverride = previous; };
  }

  function petEquipadoPorSlot(slot: PlayerSlot) {
    const equipped = slot === slotLocalOnline()
      ? localProfileRef.current.equipped
      : onlineCosmeticsBySlotRef.current[slot];
    return itemShopPorId(equipped?.pet);
  }

  function hpPvpVisual(slot: 1 | 2) {
    if (deveProjetarOnlinePvpLocal()) return slot === 1 ? playerHp : player2Hp;
    if (onlineGameplayActive && onlineSlot === 2) return slot === 1 ? player2Hp : playerHp;
    return slot === 1 ? playerHp : player2Hp;
  }

  function labelPvpVisual(slot: 1 | 2) {
    if (!onlineGameplayActive) return slot === 1 ? "P1" : "P2";
    const mySlot = onlineSlot || 1;
    if (slot === 1) return `VOCÊ · P${mySlot}`;
    return `RIVAL · P${mySlot === 1 ? 2 : 1}`;
  }


  function danoLocalPorJogador() {
    if (!isLocalWaveMode()) return 1;
    const players = Math.max(1, totalJogadoresLocaisProntos());
    if (players <= 1) return 1;
    return 1 / 2 ** (players - 1);
  }

  function rotuloModoLocal(mode = currentModeRef.current) {
    if (mode === "localCoop") return "TOGETHER LOCAL";
    if (mode === "localPvp") return "VERSUS LOCAL";
    return "LOCAL";
  }


  function vidaMaximaLocal() {
    if (isLocalPvpMode()) return 100;
    const buffs = buffsCosmeticosEquipados();
    return Math.max(1, CONFIG.gameplay.player.maxHp + Math.round(buffs.maxHp));
  }

  function danoPvpPorTipo(tipo: "normal" | "strong" | "boost" | "bump" | "power") {
    // VERSUS v1.6: normal vira pressão, forte/boost/power-ups viram condição real de ponto.
    // Isso reduz o “segura tiro e espera alinhar” sem transformar em turno.
    if (tipo === "strong") return 16;
    if (tipo === "boost") return 12;
    if (tipo === "power") return 7;
    if (tipo === "bump") return 0;
    return 1;
  }

  function resetarReviveLocal() {
    localReviveHoldRef.current = { target: 0, progress: 0, lastAt: 0 };
  }

  function limparRoundPvp() {
    localPvpMatchLockedRef.current = false;
    resetarReviveLocal();
  }

  function aplicarFlingPlayerLocal(
    player: Player,
    dirX: number,
    dirY: number,
    force: number,
  ) {
    const dir = normalizarDirecao(dirX, dirY);
    player.vx += dir.x * force;
    player.vy += dir.y * force;
    player.vx = clamp(player.vx, -18, 18);
    player.vy = clamp(player.vy, -15, 15);
    player.stretchUntil = performance.now() + CONFIG.gameplay.dynamicStretch.playerPulseMs;
    player.stretchVx = player.vx;
    player.stretchVy = player.vy;
  }

  function manterPlayerNaArena(player: Player) {
    player.x = clamp(player.x, 10, CONFIG.canvasWidth - player.w - 10);
    player.y = clamp(player.y, 10, CONFIG.canvasHeight - player.h - 10);
  }

  function escolherPowerUpPvp(): PowerUpKind {
    const table: PowerUpKind[] = [
      "regen",
      "fireRate",
      "shield",
      "powerShot",
      "homingShot",
      "randomBox",
    ];
    return table[Math.floor(randomFloat() * table.length)];
  }

  function spawnPowerUpPvp(
    force = false,
    origin?: { x: number; y: number },
    blockedPlayer?: 1 | 2,
  ) {
    if (!isLocalPvpMode()) return;

    const now = performance.now();
    const pvpPowerUps = powerUpsRef.current.filter(
      (power) => power.kind !== "goldenHeart",
    );

    // Evita o “muro de power-ups” que travava a arena.
    const maxAlive = mobileRuntimeRef.current ? (origin ? 4 : 3) : (origin ? 5 : 4);
    if (pvpPowerUps.length >= maxAlive) return;

    const minDelay = origin ? 1700 : 4800;
    if (!force && now - lastPvpPowerDropAtRef.current < minDelay) return;
    lastPvpPowerDropAtRef.current = now;

    const cfg = CONFIG.gameplay.powerups;
    const id = powerUpIdRef.current++;
    const fromHit = Boolean(origin);
    const hitDir = blockedPlayer === 2 ? -1 : 1;
    const startX = fromHit
      ? clamp(origin!.x - cfg.width / 2 + rand(-12, 12), 58, CONFIG.canvasWidth - cfg.width - 58)
      : rand(130, CONFIG.canvasWidth - cfg.width - 130);
    const startY = fromHit
      ? clamp(origin!.y - cfg.height / 2 + rand(-16, 16), 86, CONFIG.canvasHeight - cfg.height - 86)
      : -cfg.height - rand(24, 140);

    powerUpsRef.current.push({
      id,
      kind: escolherPowerUpPvp(),
      x: startX,
      y: startY,
      w: cfg.width,
      h: cfg.height,
      // Drop automático: cai de cima. Drop por dano: sai do player atingido para fora dele.
      vx: fromHit ? rand(1.15, 1.95) * hitDir : rand(-0.1, 0.1),
      vy: fromHit ? rand(-0.2, 0.55) : rand(1.15, 1.65),
      age: 0,
      life: Math.min(cfg.lifeMs, fromHit ? 6200 : 9800),
      wavePhase: rand(0, Math.PI * 2),
      bornAt: now,
      blockedPlayer,
      blockedUntil: blockedPlayer ? now + 1650 : undefined,
    });

    tocarSom(CONFIG.sounds.powerUpSpawn || CONFIG.sounds.abilityReady, 0.28, "ability");
    tocarLoopPowerUpTrail(id);
  }

  function processarPontoPvp(winner: 1 | 2) {
    if (!isLocalPvpMode() || localPvpMatchLockedRef.current) return;
    localPvpMatchLockedRef.current = true;
    const nextP1 = localP1ScoreRef.current + (winner === 1 ? 1 : 0);
    const nextP2 = localP2ScoreRef.current + (winner === 2 ? 1 : 0);
    localP1ScoreRef.current = nextP1;
    localP2ScoreRef.current = nextP2;
    setLocalP1Score(nextP1);
    setLocalP2Score(nextP2);
    criarExplosao(
      winner === 1
        ? (player2Ref.current?.x ?? CONFIG.canvasWidth - 200)
        : playerRef.current.x,
      winner === 1
        ? (player2Ref.current?.y ?? CONFIG.canvasHeight / 2)
        : playerRef.current.y,
      winner === 1 ? LOCAL_PLAYER_COLORS[0] : LOCAL_PLAYER_COLORS[1],
      22,
    );

    const matchPoint = Math.max(nextP1, nextP2) >= 3;
    if (matchPoint) atualizarStatsPerfilLocal((stats) => ({ ...stats, pvpWins: stats.pvpWins + 1 }));
    setLocalModeNotice(
      matchPoint
        ? `${winner === 1 ? "P1" : "P2"} VENCEU A MELHOR DE 5!`
        : `${winner === 1 ? "P1" : "P2"} MARCOU · ROUND ${localPvpRoundRef.current + 1}`,
    );

    window.setTimeout(() => {
      if (matchPoint) {
        localP1ScoreRef.current = 0;
        localP2ScoreRef.current = 0;
        setLocalP1Score(0);
        setLocalP2Score(0);
        localPvpRoundRef.current = 1;
        setLocalPvpRound(1);
        setLocalModeNotice("NOVA PARTIDA PVP");
      } else {
        localPvpRoundRef.current += 1;
        setLocalPvpRound(localPvpRoundRef.current);
      }
      resetarPosicoesLocais();
      localPvpMatchLockedRef.current = false;
      window.setTimeout(() => setLocalModeNotice(""), 900);
    }, matchPoint ? 1700 : 1150);
  }

  function criarPlayer2Inicial() {
    const player = createInitialPlayer();
    player.x = 118;
    player.y = CONFIG.canvasHeight / 2 + 70;
    player.strongReadyAt = 0;
    player.invincibleUntil = performance.now() + 1400;
    return player;
  }

  function criarPlayerRuntime(slot: PlayerSlot, runtime?: Player | null): PlayerRuntime {
    const player = runtime ?? createInitialPlayer();
    if (onlineTogetherCoordenado() && !runtime) {
      aplicarPosicaoCoopPorSlot(player, slot);
    } else if (slot === 2 && !runtime) {
      player.x = CONFIG.canvasWidth - player.w - 150;
      player.y = CONFIG.canvasHeight / 2 - player.h / 2;
    } else if (slot >= 3 && !runtime) {
      player.x = 112 + (slot - 1) * 54;
      player.y = CONFIG.canvasHeight / 2 - 120 + (slot - 1) * 68;
    }

    return {
      id: `runtime-p${slot}`,
      slot,
      name: `P${slot}`,
      color: LOCAL_PLAYER_COLORS[slot - 1] ?? LOCAL_PLAYER_COLORS[0],
      isLocal: slot === 1,
      isHost: slot === onlineHostSlotRef.current,
      x: player.x,
      y: player.y,
      vx: player.vx,
      vy: player.vy,
      w: player.w,
      h: player.h,
      facing: slot === 2 && isLocalPvpMode() ? -1 : 1,
      hp: player.hp,
      maxHp: vidaMaximaLocal(),
      lives: player.hp,
      goldenLives: player.goldenHp,
      alive: player.hp > 0,
      ghost: isLocalWaveMode() && player.hp <= 0,
      reviveProgress: 0,
      invulnerableUntil: player.invincibleUntil,
      shieldUntil: 0,
      dodgeCooldown: Math.max(0, player.dodgeUntil + CONFIG.gameplay.dodge.cooldownMs - performance.now()),
      strongCooldown: Math.max(0, player.strongReadyAt - performance.now()),
      boostEnergy: slot === 1 ? boostChargeRef.current : 0,
      powerups: {},
      input: { ...EMPTY_ONLINE_INPUT_STATE },
      runtime: player,
    };
  }

  function aplicarMetadadosRuntime(runtime: PlayerRuntime, meta?: Partial<OnlinePlayer>) {
    runtime.clientId = meta?.id ?? runtime.clientId;
    runtime.name = meta?.name || runtime.name || `P${runtime.slot}`;
    runtime.color = LOCAL_PLAYER_COLORS[runtime.slot - 1] ?? runtime.color;
    runtime.isLocal = runtime.slot === (onlineSlotRef.current || 1);
    runtime.isHost = runtime.slot === onlineHostSlotRef.current;
  }

  function efeitosDoSlotRuntime(slot: PlayerSlot, now = performance.now()) {
    if (slot === 1) {
      return {
        shieldUntil: shieldActiveRef.current ? now + 999999 : 0,
        fireRateUntil: fireRateUntilRef.current,
        powerShotUntil: powerShotUntilRef.current,
        homingUntil: homingShotUntilRef.current,
        flamesUntil: flamesUntilRef.current,
      };
    }

    if (slot === 2) {
      return {
        shieldUntil: player2ShieldUntilRef.current,
        fireRateUntil: player2FireRateUntilRef.current,
        powerShotUntil: player2PowerShotUntilRef.current,
        homingUntil: player2HomingShotUntilRef.current,
        flamesUntil: player2FlamesUntilRef.current,
      };
    }

    return { shieldUntil: 0, fireRateUntil: 0, powerShotUntil: 0, homingUntil: 0, flamesUntil: 0 };
  }

  function atualizarPlayerRuntime(runtime: PlayerRuntime, player: Player, meta?: Partial<OnlinePlayer>) {
    const now = performance.now();
    const effects = runtime.slot >= 3
      ? {
          shieldUntil: runtime.powerups.shieldUntil ?? runtime.shieldUntil ?? 0,
          fireRateUntil: runtime.powerups.fireRateUntil ?? 0,
          powerShotUntil: runtime.powerups.powerShotUntil ?? 0,
          homingUntil: runtime.powerups.homingUntil ?? 0,
          flamesUntil: runtime.powerups.flamesUntil ?? 0,
        }
      : efeitosDoSlotRuntime(runtime.slot, now);
    aplicarMetadadosRuntime(runtime, meta);
    runtime.x = player.x;
    runtime.y = player.y;
    runtime.vx = player.vx;
    runtime.vy = player.vy;
    runtime.w = player.w;
    runtime.h = player.h;
    runtime.facing = runtime.slot === 2 && isLocalPvpMode() ? -1 : 1;
    runtime.hp = player.hp;
    runtime.maxHp = vidaMaximaLocal();
    runtime.lives = player.hp;
    runtime.goldenLives = player.goldenHp;
    runtime.alive = player.hp > 0;
    runtime.ghost = isLocalWaveMode() && player.hp <= 0;
    runtime.invulnerableUntil = player.invincibleUntil;
    runtime.shieldUntil = effects.shieldUntil;
    runtime.dodgeCooldown = Math.max(0, player.dodgeUntil + CONFIG.gameplay.dodge.cooldownMs - now);
    runtime.strongCooldown = Math.max(0, player.strongReadyAt - now);
    runtime.boostEnergy = runtime.slot === 1 ? boostChargeRef.current : Math.max(0, player2BoostReadyAtRef.current - now);
    runtime.powerups = {
      fireRateUntil: effects.fireRateUntil,
      powerShotUntil: effects.powerShotUntil,
      homingUntil: effects.homingUntil,
      flamesUntil: effects.flamesUntil,
      shieldUntil: effects.shieldUntil,
    };
    runtime.input = runtime.slot === onlineSlotRef.current
      ? inputOnlineLocalAtual()
      : (onlineRemoteInputsRef.current[runtime.slot] || EMPTY_ONLINE_INPUT_STATE);
    runtime.runtime = player;
  }

  function slotsMultiplayerAtivos(): PlayerSlot[] {
    if (onlineConnected || onlineGameplayActiveRef.current) {
      const fromRoom = onlinePlayers
        .map((player) => Number(player.slot))
        .filter((slot): slot is PlayerSlot => slot >= 1 && slot <= 4);
      return fromRoom.length > 0 ? fromRoom : ([1, 2] as PlayerSlot[]);
    }

    if (isLocalMode()) {
      const local = localPlayerSlotsRef.current
        .filter((slot) => slot.ready)
        .map((slot) => slot.id)
        .filter((slot): slot is PlayerSlot => slot >= 1 && slot <= 4);
      return local.length > 0 ? local : ([1] as PlayerSlot[]);
    }

    return [1];
  }

  function jogadoresCoopOnlineVivosAposMorte(): number {
    if (!onlineTogetherCoordenado()) return 1;
    const slots = slotsMultiplayerAtivos();
    let vivos = 0;
    for (const slot of slots) {
      const player = playerPorSlotOnline(slot);
      if (player && player.hp > 0) vivos += 1;
    }
    return vivos;
  }

  function tratarMorteCoopOnline(player: Player, notice: string) {
    player.invincibleUntil = performance.now() + 999999;
    resetarReviveLocal();
    const vivos = jogadoresCoopOnlineVivosAposMorte();
    // v2.4.8: no Together dual-sim, se todos morreram não há quem reviva.
    // Cada tela pode ir para o game over normal sem esperar snapshot do host.
    if (vivos <= 0) {
      iniciarGameOverCutscene();
      return;
    }
    setLocalModeNotice(notice);
  }

  function runtimePlayerParaSlotVisualOnline(
    slot: PlayerSlot,
    existing: Map<PlayerSlot, PlayerRuntime>,
  ): Player | null {
    if (onlineTogetherCoordenado()) {
      const localSlot = slotLocalOnline();
      const remoteSlots = slotsRemotosOnline();
      if (slot === localSlot) return playerRef.current;
      if (slot === remoteSlots[0]) {
        if (!player2Ref.current) player2Ref.current = criarPlayer2Inicial();
        return player2Ref.current;
      }
      return existing.get(slot)?.runtime ?? createInitialPlayer();
    }

    if (slot === 1) return playerRef.current;
    if (slot === 2) {
      if (!player2Ref.current && (isLocalMode() || onlineGameplayActiveRef.current || onlineConnected)) {
        player2Ref.current = criarPlayer2Inicial();
      }
      return player2Ref.current;
    }
    return existing.get(slot)?.runtime ?? createInitialPlayer();
  }

  function sincronizarPlayersRuntime() {
    const existing = new Map<PlayerSlot, PlayerRuntime>(
      playersRef.current.map((player) => [player.slot, player] as [PlayerSlot, PlayerRuntime]),
    );
    const slots = slotsMultiplayerAtivos();
    const next: PlayerRuntime[] = [];

    for (const slot of slots) {
      const runtimePlayer = runtimePlayerParaSlotVisualOnline(slot, existing);
      if (!runtimePlayer) continue;
      const runtime = existing.get(slot) ?? criarPlayerRuntime(slot, runtimePlayer);
      const meta = onlinePlayers.find((player) => player.slot === slot);
      atualizarPlayerRuntime(runtime, runtimePlayer, meta);
      runtime.isLocal = onlineTogetherCoordenado() ? slot === slotLocalOnline() : runtime.isLocal;
      next.push(runtime);
    }

    playersRef.current = next.sort((a, b) => a.slot - b.slot);
    return playersRef.current;
  }

  function snapshotEfeitosPorSlot(slot: PlayerSlot, now: number): OnlineEffectSnapshot {
    if (slot === 1) return snapshotEfeitosPlayer1(now);
    if (slot === 2) return snapshotEfeitosPlayer2(now);
    const runtime = playersRef.current.find((player) => player.slot === slot);
    return {
      shieldMs: Math.max(0, (runtime?.powerups.shieldUntil ?? 0) - now),
      fireRateMs: Math.max(0, (runtime?.powerups.fireRateUntil ?? 0) - now),
      powerShotMs: Math.max(0, (runtime?.powerups.powerShotUntil ?? 0) - now),
      homingShotMs: Math.max(0, (runtime?.powerups.homingUntil ?? 0) - now),
      flamesMs: Math.max(0, (runtime?.powerups.flamesUntil ?? 0) - now),
    };
  }

  function snapshotPlayersOnline(now: number): OnlineRuntimePlayerSnapshot[] {
    return sincronizarPlayersRuntime().map((runtime) => ({
      id: runtime.id,
      slot: runtime.slot,
      clientId: runtime.clientId,
      name: runtime.name,
      color: runtime.color,
      isLocal: runtime.isLocal,
      isHost: runtime.isHost,
      player: sanitizarPlayerParaSync(runtime.runtime) || {},
      hp: runtime.hp,
      maxHp: runtime.maxHp,
      goldenHp: runtime.goldenLives,
      alive: runtime.alive,
      ghost: runtime.ghost,
      reviveProgress: runtime.reviveProgress,
      input: runtime.input,
      effects: snapshotEfeitosPorSlot(runtime.slot, now),
      cosmetics: runtime.slot === onlineSlotRef.current ? localProfileRef.current.equipped : onlineCosmeticsBySlotRef.current[runtime.slot],
      profileColor: runtime.slot === onlineSlotRef.current ? localProfileRef.current.color : onlineProfileColorBySlotRef.current[runtime.slot],
    }));
  }

  function normalizarSnapshotOnline(snapshot: OnlineGameplaySnapshot): OnlineGameplaySnapshot {
    if (!Array.isArray(snapshot.players) || snapshot.players.length === 0) return snapshot;
    const bySlot = new Map(snapshot.players.map((player) => [player.slot, player]));
    const p1 = bySlot.get(1);
    const p2 = bySlot.get(2);
    return {
      ...snapshot,
      p1: snapshot.p1 ?? p1?.player,
      p2: snapshot.p2 ?? p2?.player ?? null,
      p1Hp: snapshot.p1Hp ?? p1?.hp,
      p2Hp: snapshot.p2Hp ?? p2?.hp,
      p1Gold: snapshot.p1Gold ?? p1?.goldenHp,
      p2Gold: snapshot.p2Gold ?? p2?.goldenHp,
      p1Effects: snapshot.p1Effects ?? p1?.effects,
      p2Effects: snapshot.p2Effects ?? p2?.effects,
      p1ShieldActive: snapshot.p1ShieldActive ?? Boolean((p1?.effects.shieldMs ?? 0) > 0),
      p2ShieldActive: snapshot.p2ShieldActive ?? Boolean((p2?.effects.shieldMs ?? 0) > 0),
    };
  }

  function resetarPosicoesLocais() {
    const p1 = playerRef.current;
    p1.x = 112;
    p1.y = CONFIG.canvasHeight / 2 - 112;
    p1.vx = 0;
    p1.vy = 0;
    p1.hp = vidaMaximaLocal();
    p1.goldenHp = 0;
    p1.normalCooldown = 0;
    p1.strongReadyAt = 0;
    p1.invincibleUntil = performance.now() + 1200;
    setPlayerHp(p1.hp);
    setGoldenHp(0);

    const p2 = player2Ref.current ?? criarPlayer2Inicial();
    p2.x = isLocalPvpMode() ? CONFIG.canvasWidth - p2.w - 150 : 112;
    p2.y = isLocalPvpMode() ? CONFIG.canvasHeight / 2 - p2.h / 2 : CONFIG.canvasHeight / 2 + 42;
    if (onlineTogetherCoordenado()) {
      aplicarPosicaoCoopPorSlot(p1, slotLocalOnline());
      aplicarPosicaoCoopPorSlot(p2, slotVisualPlayer2Online());
    }
    p2.vx = 0;
    p2.vy = 0;
    p2.hp = vidaMaximaLocal();
    p2.goldenHp = 0;
    p2.normalCooldown = 0;
    p2.strongReadyAt = 0;
    p2.invincibleUntil = performance.now() + 1200;
    player2Ref.current = p2;
    setPlayer2Hp(p2.hp);
    setPlayer2GoldenHp(p2.goldenHp);
    setPlayer2DodgeReadyRatio(1);
    setPlayer2StrongReadyRatio(1);
    setPlayer2BoostReadyRatio(1);
    player2BoostReadyAtRef.current = 0;
    player2FireRateUntilRef.current = 0;
    player2PowerShotUntilRef.current = 0;
    player2HomingShotUntilRef.current = 0;
    player2FlamesUntilRef.current = 0;
    player2ShieldUntilRef.current = 0;
    if (isLocalPvpMode()) {
      for (const power of powerUpsRef.current) pararLoopPowerUpTrail(power.id);
      powerUpsRef.current = [];
      tokensRef.current = [];
      nextTokenSpawnAtRef.current = 0;
      spawnPowerUpPvp(true);
    }
    limparRoundPvp();
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

  function setIndiceMultiplayerBranch(index: number) {
    const safeIndex =
      (index + MULTIPLAYER_BRANCH_OPTIONS.length) % MULTIPLAYER_BRANCH_OPTIONS.length;
    multiplayerBranchIndexRef.current = safeIndex;
    setMultiplayerBranchIndex(safeIndex);
  }

  function setIndiceLobbyLocal(index: number) {
    const safeIndex = ((index % 4) + 4) % 4;
    localLobbyIndexRef.current = safeIndex;
    setLocalLobbyIndex(safeIndex);
  }

  function setIndiceModoLocal(index: number) {
    const safeIndex =
      (index + LOCAL_MODE_OPTIONS.length) % LOCAL_MODE_OPTIONS.length;
    localModeIndexRef.current = safeIndex;
    setLocalModeIndex(safeIndex);
  }

  function setIndicePause(index: number) {
    const safeIndex = ((index % 3) + 3) % 3;
    pauseIndexRef.current = safeIndex;
    setPauseIndex(safeIndex);
  }

  function setIndiceOnlineMenu(index: number) {
    const max = onlineConnected ? 6 : 4;
    const safeIndex = ((index % max) + max) % max;
    onlineMenuIndexRef.current = safeIndex;
    setOnlineMenuIndex(safeIndex);
  }

  function setFluxoOnline(flow: OnlineFlow) {
    onlineFlowRef.current = flow;
    setOnlineFlow(flow);
    setIndiceOnlineMenu(0);
    tocarSom(CONFIG.sounds.menuMove, 0.25, "menu");
  }

  function listarDispositivosDisponiveis(): InputDeviceChoice[] {
    const list: InputDeviceChoice[] = [];
    const hasTouch =
      typeof navigator !== "undefined" &&
      (navigator.maxTouchPoints > 0 || (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches));

    if (hasTouch) {
      list.push({ id: "touch", label: "TOUCH", description: "Tela sensível ao toque detectada", icon: "☝" });
    }

    list.push({ id: "keyboard", label: "TECLADO", description: "WASD/SETAS + binds atuais", icon: "⌨" });

    if (typeof navigator !== "undefined" && navigator.getGamepads) {
      const pads = Array.from(navigator.getGamepads()).filter((pad): pad is Gamepad => Boolean(pad?.connected));
      pads.forEach((pad, index) => {
        const rawName = String(pad.id || `Controle ${index + 1}`).replace(/\s+/g, " ").trim();
        const shortName = rawName.length > 24 ? `${rawName.slice(0, 21)}...` : rawName;
        list.push({
          id: `gamepad-${pad.index}`,
          label: `CONTROLE ${index + 1}`,
          description: shortName,
          icon: "🎮",
        });
      });
    }

    return list;
  }

  function atualizarDispositivosDisponiveis(force = false) {
    if (typeof window === "undefined") return;
    const next = listarDispositivosDisponiveis();
    const current = detectedInputDevicesRef.current;
    const changed =
      force ||
      next.length !== current.length ||
      next.some((item, index) => item.id !== current[index]?.id || item.description !== current[index]?.description);
    if (!changed) return;
    detectedInputDevicesRef.current = next;
    setDetectedInputDevices(next);
    const selected = next[onlineDeviceIndexRef.current];
    if (!selected) setDispositivoOnline(0);
  }

  function dispositivosDisponiveisAtuais() {
    return detectedInputDevicesRef.current.length > 0 ? detectedInputDevicesRef.current : INPUT_DEVICE_CHOICES;
  }

  function setDispositivoOnline(index: number) {
    const choices = dispositivosDisponiveisAtuais();
    const safeIndex = ((index % choices.length) + choices.length) % choices.length;
    onlineDeviceIndexRef.current = safeIndex;
    setOnlineDeviceIndex(safeIndex);
    const choice = choices[safeIndex] ?? choices[0];
    if (onlineConnected) enviarPerfilOnlineAtual();
    tocarSom(CONFIG.sounds.menuMove, 0.25, "menu");
  }

  function dispositivoOnlineAtual() {
    const choices = dispositivosDisponiveisAtuais();
    return choices[onlineDeviceIndexRef.current] ?? choices[0] ?? INPUT_DEVICE_CHOICES[0];
  }

  function atualizarSlotsLocais(
    updater: typeof localPlayerSlots | ((current: typeof localPlayerSlots) => typeof localPlayerSlots),
  ) {
    const next =
      typeof updater === "function"
        ? updater(localPlayerSlotsRef.current)
        : updater;
    localPlayerSlotsRef.current = next;
    setLocalPlayerSlots(next);
  }

  function totalJogadoresLocaisProntos() {
    return localPlayerSlotsRef.current.filter((slot) => slot.ready).length;
  }

  function abrirMultiplayer() {
    tocarSom(CONFIG.sounds.menuConfirm, 0.38, "menu");
    setIndiceMultiplayerBranch(0);
    setEstado("multiplayerMenu");
  }

  function abrirLobbyLocal() {
    tocarSom(CONFIG.sounds.menuConfirm, 0.38, "menu");
    setIndiceLobbyLocal(1);
    atualizarSlotsLocais([
      { id: 1, name: "P1", ready: true, input: "TECLADO/TOUCH", device: "primary", color: LOCAL_PLAYER_COLORS[0] },
      { id: 2, name: "P2", ready: false, input: "APERTE U OU A", device: "", color: LOCAL_PLAYER_COLORS[1] },
      { id: 3, name: "P3", ready: false, input: "CONECTE OUTRO CONTROLE", device: "", color: LOCAL_PLAYER_COLORS[2] },
      { id: 4, name: "P4", ready: false, input: "CONECTE OUTRO CONTROLE", device: "", color: LOCAL_PLAYER_COLORS[3] },
    ]);
    setLocalModeNotice("P2 precisa dar input próprio. O mesmo dispositivo não entra duas vezes.");
    window.setTimeout(() => setLocalModeNotice(""), 3000);
    setEstado("localLobby");
  }

  function alternarReadySlotLocal(index = localLobbyIndexRef.current) {
    if (index === 0) return;
    tocarSom(CONFIG.sounds.menuConfirm, 0.34, "menu");
    atualizarSlotsLocais((current) =>
      current.map((slot, slotIndex) => {
        if (slotIndex !== index) return slot;
        const nextReady = !slot.ready;
        const device = index === 1 ? "p2-keyboard-or-pad1" : `pad-${index}`;
        const alreadyTaken = nextReady && current.some((item, itemIndex) => itemIndex !== slotIndex && item.device === device && item.ready);
        if (alreadyTaken) return { ...slot, input: "DISPOSITIVO EM USO" };
        return {
          ...slot,
          ready: nextReady,
          device: nextReady ? device : "",
          input: nextReady
            ? index === 1
              ? "TECLADO P2 / CONTROLE 1"
              : `CONTROLE ${index}`
            : index === 1
              ? "APERTE U OU A"
              : "AGUARDANDO",
        };
      }),
    );
  }

  function abrirSelecaoModoLocal() {
    if (totalJogadoresLocaisProntos() < 2) {
      tocarSom(CONFIG.sounds.menuBack, 0.35, "menu");
      setLocalModeNotice("Confirme pelo menos P2 para começar.");
      window.setTimeout(() => setLocalModeNotice(""), 1800);
      return;
    }
    tocarSom(CONFIG.sounds.menuConfirm, 0.38, "menu");
    setIndiceModoLocal(0);
    setEstado("localModeSelect");
  }

  function eixosLocaisAtuais() {
    const moveLayout = String((CONFIG.settings as Record<string, unknown>).pcMoveLayout || "both");
    const useWasd = moveLayout !== "arrows";
    const useArrows = moveLayout !== "wasd";
    const keyboardX =
      ((useArrows && keysRef.current["arrowright"]) || (useWasd && keysRef.current["d"]) ? 1 : 0) -
      ((useArrows && keysRef.current["arrowleft"]) || (useWasd && keysRef.current["a"]) ? 1 : 0);
    const keyboardY =
      ((useArrows && keysRef.current["arrowdown"]) || (useWasd && keysRef.current["s"]) ? 1 : 0) -
      ((useArrows && keysRef.current["arrowup"]) || (useWasd && keysRef.current["w"]) ? 1 : 0);
    return {
      x: clamp(keyboardX + mobileMoveRef.current.x + gamepadAxesRef.current.x, -1, 1),
      y: clamp(keyboardY + mobileMoveRef.current.y + gamepadAxesRef.current.y, -1, 1),
    };
  }

  function inputOnlineLocalAtual(): OnlineInputState {
    const axes = eixosLocaisAtuais();
    const visualMirror = deveProjetarOnlinePvpLocal();
    const logicalX = visualMirror ? -axes.x : axes.x;
    return {
      left: logicalX < -0.22,
      right: logicalX > 0.22,
      up: axes.y < -0.22,
      down: axes.y > 0.22,
      shot: controleAcaoSegurando("shot") || mobileShootRef.current,
      strong: controleAcaoSegurando("strong"),
      boost: controleAcaoSegurando("boost"),
      dodge: controleAcaoSegurando("dodge"),
      pause: gameStateRef.current === "paused",
      pet: mobilePetPressedRef.current,
    };
  }

  function eixosDeInputOnline(input?: OnlineInputState) {
    const safe = input || EMPTY_ONLINE_INPUT_STATE;
    return {
      x: (safe.right ? 1 : 0) - (safe.left ? 1 : 0),
      y: (safe.down ? 1 : 0) - (safe.up ? 1 : 0),
    };
  }

  function enviarInputOnlineAtual(force = false) {
    if (!onlineGameplayActiveRef.current) return;
    if (!onlineSocketRef.current || onlineSocketRef.current.readyState !== WebSocket.OPEN) return;
    if (gameStateRef.current !== "playing" && gameStateRef.current !== "paused") return;
    const now = performance.now();
    const input = inputOnlineLocalAtual();
    const payload = JSON.stringify(input);
    if (!force && payload === onlineLastInputPayloadRef.current && now - onlineLastInputSentAtRef.current < 60) return;
    if (!force && now - onlineLastInputSentAtRef.current < 8) return;
    onlineLastInputPayloadRef.current = payload;
    onlineLastInputSentAtRef.current = now;
    enviarOnline({ type: "input", seq: ++onlineInputSeqRef.current, input, cosmetics: localProfileRef.current.equipped, profileColor: localProfileRef.current.color, profileSummary: criarResumoPerfilOnline(), pet: localProfileRef.current.equipped?.pet });
  }

  function sanitizarPlayerParaSync(player: Player | null): Partial<Player> | null {
    if (!player) return null;
    return {
      x: player.x, y: player.y, w: player.w, h: player.h,
      vx: player.vx, vy: player.vy, tilt: player.tilt,
      hp: player.hp, goldenHp: player.goldenHp,
      invincibleUntil: player.invincibleUntil, dodgeUntil: player.dodgeUntil, boostUntil: player.boostUntil,
      boostVx: player.boostVx, boostVy: player.boostVy,
      normalCooldown: player.normalCooldown, strongReadyAt: player.strongReadyAt,
      stretchUntil: player.stretchUntil, stretchVx: player.stretchVx, stretchVy: player.stretchVy,
      wasMoving: player.wasMoving, lastInputX: player.lastInputX, lastInputY: player.lastInputY,
      lastMoveAngle: player.lastMoveAngle, lastStretchAt: player.lastStretchAt,
      capturedUntil: player.capturedUntil, throwUntil: player.throwUntil,
      capturedEnemyId: player.capturedEnemyId, throwVx: player.throwVx, throwVy: player.throwVy,
      wallImpactArmed: player.wallImpactArmed, alienCaptureCooldownUntil: player.alienCaptureCooldownUntil,
    };
  }

  function snapshotEfeitosPlayer1(now: number): OnlineEffectSnapshot {
    return {
      shieldMs: shieldActiveRef.current ? 999999 : 0,
      fireRateMs: Math.max(0, fireRateUntilRef.current - now),
      powerShotMs: Math.max(0, powerShotUntilRef.current - now),
      homingShotMs: Math.max(0, homingShotUntilRef.current - now),
      flamesMs: Math.max(0, flamesUntilRef.current - now),
    };
  }

  function snapshotEfeitosPlayer2(now: number): OnlineEffectSnapshot {
    return {
      shieldMs: Math.max(0, player2ShieldUntilRef.current - now),
      fireRateMs: Math.max(0, player2FireRateUntilRef.current - now),
      powerShotMs: Math.max(0, player2PowerShotUntilRef.current - now),
      homingShotMs: Math.max(0, player2HomingShotUntilRef.current - now),
      flamesMs: Math.max(0, player2FlamesUntilRef.current - now),
    };
  }

  function aplicarEfeitosOnlineLocal(effects: OnlineEffectSnapshot | undefined, slotVisual: 1 | 2) {
    if (!effects) return;
    const now = performance.now();
    if (slotVisual === 1) {
      shieldActiveRef.current = Boolean((effects.shieldMs ?? 0) > 0);
      setShieldActive(shieldActiveRef.current);
      fireRateUntilRef.current = now + Math.max(0, effects.fireRateMs ?? 0);
      powerShotUntilRef.current = now + Math.max(0, effects.powerShotMs ?? 0);
      homingShotUntilRef.current = now + Math.max(0, effects.homingShotMs ?? 0);
      flamesUntilRef.current = now + Math.max(0, effects.flamesMs ?? 0);
      return;
    }
    player2ShieldUntilRef.current = now + Math.max(0, effects.shieldMs ?? 0);
    player2FireRateUntilRef.current = now + Math.max(0, effects.fireRateMs ?? 0);
    player2PowerShotUntilRef.current = now + Math.max(0, effects.powerShotMs ?? 0);
    player2HomingShotUntilRef.current = now + Math.max(0, effects.homingShotMs ?? 0);
    player2FlamesUntilRef.current = now + Math.max(0, effects.flamesMs ?? 0);
  }

  function aplicarPredicaoOnlineLocal(delta: number, canvas: HTMLCanvasElement) {
    if (!onlineGameplayActiveRef.current || souHostOnline() || gameStateRef.current !== "playing") return;
    const input = inputOnlineLocalAtual();
    const target = (deveProjetarOnlinePvpLocal() || onlineSlotRef.current === 1) ? playerRef.current : player2Ref.current;
    if (!target || target.hp <= 0) return;
    const speedFactor = delta / 16.67;
    const axes = eixosDeInputOnline(input);
    let ax = deveProjetarOnlinePvpLocal() ? -axes.x : axes.x;
    let ay = axes.y;
    if (Math.abs(ax) < 0.05) ax = 0;
    if (Math.abs(ay) < 0.05) ay = 0;

    const maxSpeedX = CONFIG.gameplay.player.maxSpeedX;
    const maxSpeedY = CONFIG.gameplay.player.maxSpeedY;
    const acceleration = CONFIG.gameplay.player.acceleration;
    if (ax !== 0) target.vx += ax * acceleration * speedFactor;
    else target.vx *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
    if (ay !== 0) target.vy += ay * acceleration * speedFactor;
    else target.vy *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
    target.vx = clamp(target.vx || 0, -maxSpeedX, maxSpeedX);
    target.vy = clamp(target.vy || 0, -maxSpeedY, maxSpeedY);
    if (Math.abs(target.vx) < 0.02) target.vx = 0;
    if (Math.abs(target.vy) < 0.02) target.vy = 0;

    const now = performance.now();
    if (input.boost && now >= onlinePredictedBoostReadyAtRef.current) {
      const dir = normalizarDirecao(ax || (deveProjetarOnlinePvpLocal() ? 1 : target.vx || 1), ay || target.vy || 0);
      target.boostUntil = now + CONFIG.gameplay.boost.durationMs * 0.78;
      target.boostVx = dir.x * CONFIG.gameplay.boost.speed;
      target.boostVy = dir.y * CONFIG.gameplay.boost.speed;
      onlinePredictedBoostReadyAtRef.current = now + 3600;
      target.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
      target.stretchVx = target.boostVx;
      target.stretchVy = target.boostVy;
    }

    if (now < target.boostUntil) {
      target.vx = target.boostVx;
      target.vy = target.boostVy;
    }

    target.x = clamp(target.x + target.vx * speedFactor, 0, CONFIG.canvasWidth - target.w);
    target.y = clamp(target.y + target.vy * speedFactor, 0, CONFIG.canvasHeight - target.h);
    target.tilt += ((((target.vy || 0) / Math.max(0.001, maxSpeedY)) * CONFIG.gameplay.player.tiltMaxDeg) - (target.tilt || 0)) * CONFIG.gameplay.player.tiltResponse;
    target.lastInputX = ax;
    target.lastInputY = ay;
    if (canvas) {
      target.x = clamp(target.x, 0, CONFIG.canvasWidth - target.w);
      target.y = clamp(target.y, 0, CONFIG.canvasHeight - target.h);
    }
  }

  function registrarEventoVisualOnline(event: Omit<OnlineVisualEvent, "id" | "t">) {
    if (!onlineGameplayActiveRef.current || !souHostOnline() || gameStateRef.current !== "playing") return;
    if (event.kind === "sound" && event.category === "menu") return;
    const now = performance.now();
    const id = ++onlineVisualEventSeqRef.current;
    const next: OnlineVisualEvent = { ...event, id, t: now };
    onlineVisualEventLogRef.current = [...onlineVisualEventLogRef.current, next].slice(-72);
  }

  function projetarEventoVisualOnline(event: OnlineVisualEvent, projectedPvp: boolean): OnlineVisualEvent {
    if (!projectedPvp || typeof event.x !== "number") return event;
    const width = Number((event as { w?: number }).w ?? 0);
    return { ...event, x: CONFIG.canvasWidth - event.x - width };
  }

  function aplicarEventosVisuaisSnapshotOnline(events: OnlineVisualEvent[] | undefined, projectedPvp: boolean) {
    if (!Array.isArray(events) || (souHostOnline() && !onlineServerAuthoritativeRef.current)) return;
    const seen = onlineSeenVisualEventsRef.current;
    for (const raw of events) {
      const id = Number(raw.id || 0);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const event = projetarEventoVisualOnline(raw, projectedPvp);
      const x = Number(event.x ?? CONFIG.canvasWidth / 2);
      const y = Number(event.y ?? CONFIG.canvasHeight / 2);
      if (event.kind === "sound" && event.sound) {
        const soundKey = String(event.sound) as keyof typeof CONFIG.sounds;
        tocarSom(CONFIG.sounds[soundKey] || event.sound, clamp(Number(event.volume ?? 0.22), 0.04, 0.75), event.category || "sfx");
      } else if (event.kind === "explosion") {
        criarExplosao(x, y, event.color || "#ffe18c", Math.max(4, Math.min(48, Number(event.amount ?? 12))));
      } else if (event.kind === "hit") {
        criarParticulasHit(x, y, event.color || "#fff1a8", Math.max(3, Math.min(18, Number(event.amount ?? 7))));
      } else if (event.kind === "shockwave") {
        shockwavesRef.current.push({
          id: enemyIdRef.current++,
          x,
          y,
          radius: Math.max(40, Math.min(560, Number(event.radius ?? 110))),
          life: 240,
          maxLife: 240,
        });
        criarParticulasHit(x, y, event.color || "#fff1a8", 10);
      } else if (event.kind === "tokenBurst") {
        const amount = mobileRuntimeRef.current || adaptivePerformanceRef.current.reduced ? Math.max(2, Math.min(7, Number(event.amount ?? 5))) : Math.max(5, Math.min(18, Number(event.amount ?? 9)));
        criarExplosao(x, y, event.color || "#ffd166", amount);
        tocarSom(CONFIG.sounds.tokenBurst || CONFIG.sounds.powerUpSpawn, 0.12, "sfx");
      } else if (event.kind === "bump") {
        criarParticulasHit(x, y, event.color || "#67e8f9", 9);
        shockwavesRef.current.push({ id: enemyIdRef.current++, x, y, radius: 72, life: 160, maxLife: 160 });
      }
    }
    if (seen.size > 220) {
      onlineSeenVisualEventsRef.current = new Set(Array.from(seen).slice(-120));
    }
  }

  function criarSnapshotOnline(): OnlineGameplaySnapshot {
    const now = performance.now();
    const sentAt = Date.now();
    const tick = ++onlineSnapshotSeqRef.current;
    return {
      tick,
      t: sentAt,
      sentAt,
      seq: tick,
      authoritativeSlot: onlineHostSlotRef.current as PlayerSlot,
      netModel: "owner-input-host-state-v246",
      players: snapshotPlayersOnline(now),
      mode: currentModeRef.current,
      state: gameStateRef.current,
      p1: sanitizarPlayerParaSync(playerRef.current) || undefined,
      p2: sanitizarPlayerParaSync(player2Ref.current),
      p1Hp: playerRef.current.hp,
      p2Hp: player2Ref.current?.hp ?? 0,
      p1Gold: playerRef.current.goldenHp,
      p2Gold: player2Ref.current?.goldenHp ?? 0,
      score: scoreRef.current,
      localP1Score: localP1ScoreRef.current,
      localP2Score: localP2ScoreRef.current,
      localPvpRound: localPvpRoundRef.current,
      wave: { ...waveStateRef.current },
      shots: shotsRef.current.slice(-20),
      enemies: enemiesRef.current.slice(-26),
      enemyProjectiles: enemyProjectilesRef.current.slice(-28),
      bossProjectiles: bossProjectilesRef.current.slice(-18),
      powerUps: powerUpsRef.current.slice(-8),
      tokens: tokensRef.current.slice(-22),
      boss: { ...bossRef.current },
      events: onlineVisualEventLogRef.current.slice(-40),
      p1ShieldActive: shieldActiveRef.current,
      p2ShieldActive: Boolean(player2Ref.current && now < player2ShieldUntilRef.current),
      p1Effects: snapshotEfeitosPlayer1(now),
      p2Effects: snapshotEfeitosPlayer2(now),
      p1DodgeActive: now < playerRef.current.dodgeUntil,
      p2DodgeActive: Boolean(player2Ref.current && now < player2Ref.current.dodgeUntil),
      p1BoostActive: now < playerRef.current.boostUntil,
      p2BoostActive: Boolean(player2Ref.current && now < player2Ref.current.boostUntil),
    };
  }


  function aplicarPlayerSnapshotSuave(
    target: Player,
    incoming: Partial<Player> | null | undefined,
    controlledLocally = false,
  ) {
    if (!incoming) return;
    const oldX = target.x;
    const oldY = target.y;
    const oldVx = target.vx;
    const oldVy = target.vy;
    const nextX = typeof incoming.x === "number" ? incoming.x : target.x;
    const nextY = typeof incoming.y === "number" ? incoming.y : target.y;
    const dx = nextX - oldX;
    const dy = nextY - oldY;
    const dist = Math.hypot(dx, dy);

    const keepUntil = {
      dodgeUntil: target.dodgeUntil,
      boostUntil: target.boostUntil,
      stretchUntil: target.stretchUntil,
    };

    Object.assign(target, incoming);

    if (controlledLocally) {
      // v2.1.3: modo visual estrito no online. O input continua responsivo,
      // mas a posição/velocidade do host vence com blend maior para bump, tiro e colisão
      // nascerem no mesmo lugar nas duas telas.
      const incomingVx = typeof incoming.vx === "number" ? incoming.vx : oldVx;
      const incomingVy = typeof incoming.vy === "number" ? incoming.vy : oldVy;
      const velocityDrift = Math.hypot(incomingVx - oldVx, incomingVy - oldVy);
      const strictOnline = onlineGameplayActiveRef.current && (onlineServerAuthoritativeRef.current || !souHostOnline());
      const bumpLike = velocityDrift > 2.4 || dist > 10 || Math.abs(Number(incoming.throwVx ?? 0)) > 0.1 || Math.abs(Number(incoming.throwVy ?? 0)) > 0.1;
      if (strictOnline && onlineServerAuthoritativeRef.current) {
        // v2.3.5: o player local fica responsivo como no modo normal.
        // O servidor corrige só drift grande/bump; microcorreção todo pacote causava o efeito de "puxão".
        const blend = bumpLike ? 0.62 : dist > 260 ? 0.42 : dist > 120 ? 0.2 : dist > 56 ? 0.08 : 0;
        target.x = oldX + dx * blend;
        target.y = oldY + dy * blend;
        target.vx = oldVx * 0.72 + incomingVx * 0.28;
        target.vy = oldVy * 0.72 + incomingVy * 0.28;
      } else if (strictOnline) {
        if (bumpLike) {
          const bumpBlend = dist > 180 ? 0.74 : dist > 72 ? 0.56 : 0.36;
          target.x = oldX + dx * bumpBlend;
          target.y = oldY + dy * bumpBlend;
          target.vx = oldVx * 0.2 + incomingVx * 0.8;
          target.vy = oldVy * 0.2 + incomingVy * 0.8;
        } else {
          const blend = dist > 320 ? 0.62 : dist > 160 ? 0.3 : dist > 64 ? 0.16 : dist > 20 ? 0.08 : 0;
          target.x = oldX + dx * blend;
          target.y = oldY + dy * blend;
          target.vx = oldVx * 0.5 + incomingVx * 0.5;
          target.vy = oldVy * 0.5 + incomingVy * 0.5;
        }
      } else if (dist > 760) {
        target.x = oldX + dx * 0.45;
        target.y = oldY + dy * 0.45;
        target.vx = oldVx * 0.66 + incomingVx * 0.34;
        target.vy = oldVy * 0.66 + incomingVy * 0.34;
      } else if (bumpLike) {
        const blend = dist > 180 ? 0.22 : dist > 72 ? 0.14 : 0.075;
        target.x = oldX + dx * blend;
        target.y = oldY + dy * blend;
        target.vx = oldVx * 0.66 + incomingVx * 0.34;
        target.vy = oldVy * 0.66 + incomingVy * 0.34;
      } else {
        target.x = oldX;
        target.y = oldY;
        target.vx = oldVx;
        target.vy = oldVy;
      }
    } else {
      // Remote players no servidor autoritativo precisam acompanhar firme, senão vira slideshow.
      const hardSnap = onlineServerAuthoritativeRef.current ? 260 : 620;
      const blend = onlineServerAuthoritativeRef.current ? (dist < 18 ? 0.42 : dist < 120 ? 0.68 : 0.86) : (dist < 24 ? 0.08 : dist < 120 ? 0.14 : 0.22);
      if (dist > hardSnap) {
        target.x = oldX + dx * (onlineServerAuthoritativeRef.current ? 0.92 : 0.45);
        target.y = oldY + dy * (onlineServerAuthoritativeRef.current ? 0.92 : 0.45);
      } else {
        target.x = oldX + dx * blend;
        target.y = oldY + dy * blend;
      }
      target.vx = typeof incoming.vx === "number" ? oldVx * 0.25 + incoming.vx * 0.75 : oldVx;
      target.vy = typeof incoming.vy === "number" ? oldVy * 0.25 + incoming.vy * 0.75 : oldVy;
    }

    // Não deixa snapshot atrasado congelar sprites de dodge/boost no cliente.
    const now = performance.now();
    if (typeof incoming.dodgeUntil !== "number" || incoming.dodgeUntil < now - 80) {
      target.dodgeUntil = keepUntil.dodgeUntil > now ? keepUntil.dodgeUntil : 0;
    }
    if (typeof incoming.boostUntil !== "number" || incoming.boostUntil < now - 80) {
      target.boostUntil = keepUntil.boostUntil > now ? keepUntil.boostUntil : 0;
    }
    if (typeof incoming.stretchUntil !== "number" || incoming.stretchUntil < now - 80) {
      target.stretchUntil = keepUntil.stretchUntil > now ? keepUntil.stretchUntil : target.stretchUntil;
    }

    target.x = clamp(target.x, 0, CONFIG.canvasWidth - target.w);
    target.y = clamp(target.y, 0, CONFIG.canvasHeight - target.h);
  }

  function normalizarPowerUpsSnapshotOnline(powerUps: PowerUp[], projectedPvp: boolean, localNow = performance.now()) {
    return powerUps.map((power) => {
      const projected = projectedPvp ? espelharObjetoOnline(power) : { ...power };
      const age = Math.max(0, Number(projected.age ?? 0));
      const bornAt = Number(projected.bornAt ?? 0);
      const bornAtInvalido = !Number.isFinite(bornAt) || bornAt <= 0 || bornAt > localNow + 500 || bornAt < localNow - 30000;
      return {
        ...projected,
        age,
        bornAt: bornAtInvalido ? localNow - age : bornAt,
        w: Math.max(Number(projected.w || 0), isLocalPvpMode() ? 44 : 32),
        h: Math.max(Number(projected.h || 0), isLocalPvpMode() ? 44 : 32),
      } as PowerUp;
    });
  }

  function mesclarObjetosSnapshotOnline<T extends { id: number; x: number; y: number; w: number; h: number; vx?: number; vy?: number; stretchVx?: number }>(
    current: T[],
    incoming: T[],
    projectedPvp: boolean,
    blend = 0.28,
    hardSnap = 520,
  ): T[] {
    const byId = new Map(current.map((item) => [item.id, item] as [number, T]));
    return incoming.map((raw) => {
      const next = projectedPvp ? espelharObjetoOnline(raw) : { ...raw };
      const old = byId.get(next.id);
      if (!old) return next as T;
      const dx = next.x - old.x;
      const dy = next.y - old.y;
      const dist = Math.hypot(dx, dy);
      if (onlineGameplayActiveRef.current && onlineServerAuthoritativeRef.current) {
        return { ...old, ...next, x: next.x, y: next.y, vx: next.vx, vy: next.vy } as T;
      }
      const onlineStrictBlend = onlineGameplayActiveRef.current && !souHostOnline() ? Math.max(blend, 0.72) : blend;
      if (dist > hardSnap) return { ...old, ...next, x: old.x + dx * 0.82, y: old.y + dy * 0.82 } as T;
      return {
        ...old,
        ...next,
        x: old.x + dx * onlineStrictBlend,
        y: old.y + dy * onlineStrictBlend,
        vx: typeof next.vx === "number" ? (old.vx ?? next.vx) * 0.35 + next.vx * 0.65 : old.vx,
        vy: typeof next.vy === "number" ? (old.vy ?? next.vy) * 0.35 + next.vy * 0.65 : old.vy,
      } as T;
    });
  }


  function aplicarPlayersExtrasDoSnapshot(snapshot: OnlineGameplaySnapshot, projectedPvp: boolean) {
    if (!Array.isArray(snapshot.players)) return;
    const existing = new Map<PlayerSlot, PlayerRuntime>(
      playersRef.current.map((player) => [player.slot, player] as [PlayerSlot, PlayerRuntime]),
    );
    for (const remote of snapshot.players) {
      const slot = Number(remote.slot) as PlayerSlot;
      if (slot < 3 || slot > 4) continue;
      const incomingBase = remote.player || {};
      const incoming = projectedPvp ? espelharPlayerOnline(incomingBase) : incomingBase;
      const runtime = existing.get(slot) ?? criarPlayerRuntime(slot);
      if (remote.cosmetics) onlineCosmeticsBySlotRef.current[slot] = remote.cosmetics;
      if (remote.profileColor) onlineProfileColorBySlotRef.current[slot] = remote.profileColor;
      aplicarMetadadosRuntime(runtime, remote);
      aplicarPlayerSnapshotSuave(runtime.runtime, incoming, slot === onlineSlotRef.current);
      runtime.hp = Number(remote.hp ?? runtime.runtime.hp ?? runtime.hp);
      runtime.maxHp = Number(remote.maxHp ?? runtime.maxHp);
      runtime.goldenLives = Number(remote.goldenHp ?? runtime.goldenLives);
      runtime.alive = Boolean(remote.alive ?? runtime.hp > 0);
      runtime.ghost = Boolean(remote.ghost ?? false);
      runtime.reviveProgress = Number(remote.reviveProgress ?? 0);
      existing.set(slot, runtime);
    }
    const baseSlots = slotsMultiplayerAtivos();
    playersRef.current = baseSlots
      .map((slot) => existing.get(slot))
      .filter((player): player is PlayerRuntime => Boolean(player))
      .sort((a, b) => a.slot - b.slot);
  }

  function emitirFeedbackVisualSnapshotOnline(snapshot: OnlineGameplaySnapshot, projectedPvp: boolean) {
    if (souHostOnline() && !onlineServerAuthoritativeRef.current) return;
    const incomingShots = Array.isArray(snapshot.shots) ? snapshot.shots : [];
    const incomingEnemies = Array.isArray(snapshot.enemies) ? snapshot.enemies : [];
    const incomingTokens = Array.isArray(snapshot.tokens) ? snapshot.tokens : [];

    const shotIds = new Set(incomingShots.map((shot) => shot.id));
    let syncShotSounds = 0;
    for (const shot of incomingShots) {
      if (shotsRef.current.some((old) => old.id === shot.id)) continue;
      if ((shot.ownerId ?? 0) === onlineSlotRef.current) continue;
      if (syncShotSounds >= 2) break;
      syncShotSounds += 1;
      tocarSom(shot.type === "strong" ? CONFIG.sounds.strongShot : CONFIG.sounds.normalShot, shot.type === "strong" ? 0.28 : 0.18, "sfx");
    }

    const nextEnemyIds = new Set(incomingEnemies.map((enemy) => enemy.id));
    let syncExplosions = 0;
    for (const oldEnemy of enemiesRef.current) {
      if (nextEnemyIds.has(oldEnemy.id)) continue;
      const cx = oldEnemy.x + oldEnemy.w / 2;
      const cy = oldEnemy.y + oldEnemy.h / 2;
      if (cx < -60 || cx > CONFIG.canvasWidth + 60 || cy < -60 || cy > CONFIG.canvasHeight + 60) continue;
      if (syncExplosions < 3) {
        syncExplosions += 1;
        criarExplosao(cx, cy, oldEnemy.kind === "asteroid" ? "#d1d5db" : "#ffe18c", oldEnemy.kind === "asteroid" ? 7 : 11);
        tocarSom(oldEnemy.kind === "asteroid" ? CONFIG.sounds.asteroidBreak : CONFIG.sounds.enemyDeath, 0.2, "hit");
      }
    }

    for (const shot of shotsRef.current) {
      if (shotIds.has(shot.id)) continue;
      if (shot.type === "strong") {
        const cx = shot.x + shot.w / 2;
        const cy = shot.y + shot.h / 2;
        if (cx > -40 && cx < CONFIG.canvasWidth + 40 && cy > -40 && cy < CONFIG.canvasHeight + 40) {
          criarParticulasHit(cx, cy, "#fff1a8", 8);
          shockwavesRef.current.push({ id: enemyIdRef.current++, x: cx, y: cy, radius: 96, life: 220, maxLife: 220 });
        }
      }
    }

    const oldTokenCount = tokensRef.current.length;
    if (incomingTokens.length > oldTokenCount && performance.now() - tokenUiPulseUntilRef.current > 140) {
      tocarSom(CONFIG.sounds.tokenBurst || CONFIG.sounds.powerUpSpawn, 0.12, "sfx");
    }
  }


  function aplicarSnapshotServidorAutoritativo(snapshot: OnlineGameplaySnapshot, localNow: number) {
    const players = Array.isArray(snapshot.players) ? snapshot.players : [];
    const localSlot = Math.max(1, Math.min(4, Number(onlineSlotRef.current || 1))) as PlayerSlot;
    const activeSlots = Array.isArray(snapshot.activeSlots) ? snapshot.activeSlots.map(Number).filter(Boolean) : players.filter((p) => p.active !== false).map((p) => Number(p.slot));
    const waitingSlots = Array.isArray(snapshot.waitingSlots) ? snapshot.waitingSlots.map(Number).filter(Boolean) : players.filter((p) => p.waiting).map((p) => Number(p.slot));
    setOnlineActiveSlots(activeSlots);
    setOnlineWaitingSlots(waitingSlots);

    for (const remote of players) {
      const slot = Number(remote.slot) as PlayerSlot;
      if (slot >= 1 && slot <= 4) {
        if (remote.cosmetics) onlineCosmeticsBySlotRef.current[slot] = remote.cosmetics;
        if (remote.profileColor) onlineProfileColorBySlotRef.current[slot] = remote.profileColor;
      }
    }

    const projectedPvp = deveProjetarOnlinePvpLocal();
    const localEntry = players.find((p) => Number(p.slot) === localSlot) || players[0];
    const otherEntry = players.find((p) => Number(p.slot) !== localSlot && (activeSlots.length === 0 || activeSlots.includes(Number(p.slot)))) || players.find((p) => Number(p.slot) !== localSlot);
    const extraEntries = players.filter((p) => p !== localEntry && p !== otherEntry);

    if (localEntry?.player) {
      const localPlayerSnapshot = projectedPvp ? espelharPlayerOnline(localEntry.player) : localEntry.player;
      aplicarPlayerSnapshotSuave(playerRef.current, localPlayerSnapshot, true);
      playerRef.current.hp = Number(localEntry.hp ?? playerRef.current.hp);
      playerRef.current.goldenHp = Number(localEntry.goldenHp ?? playerRef.current.goldenHp);
      setPlayerHp(playerRef.current.hp);
      setGoldenHp(playerRef.current.goldenHp);
      aplicarEfeitosOnlineLocal(localEntry.effects, 1);
      const remainingPet = Math.max(0, Number(localEntry.effects?.petCooldownUntil ?? 0) - Number(snapshot.serverTime || snapshot.t || Date.now()));
      if (remainingPet > 0) petAbilityCooldownUntilRef.current = performance.now() + remainingPet;
      if (localEntry.effects?.petActive) petSuperSparkUntilRef.current = Math.max(petSuperSparkUntilRef.current, performance.now() + 260);
    }

    if (otherEntry?.player) {
      if (!player2Ref.current) player2Ref.current = criarPlayer2Inicial();
      const incoming = projectedPvp ? espelharPlayerOnline(otherEntry.player) : otherEntry.player;
      aplicarPlayerSnapshotSuave(player2Ref.current, incoming, false);
      player2Ref.current.hp = Number(otherEntry.hp ?? player2Ref.current.hp);
      player2Ref.current.goldenHp = Number(otherEntry.goldenHp ?? player2Ref.current.goldenHp);
      setPlayer2Hp(player2Ref.current.hp);
      setPlayer2GoldenHp(player2Ref.current.goldenHp);
      aplicarEfeitosOnlineLocal(otherEntry.effects, 2);
    } else {
      setPlayer2Hp(0);
    }

    const existing = new Map<PlayerSlot, PlayerRuntime>(playersRef.current.map((runtime) => [runtime.slot, runtime] as [PlayerSlot, PlayerRuntime]));
    const nextRuntimes: PlayerRuntime[] = [];
    for (const entry of extraEntries) {
      const slot = Number(entry.slot) as PlayerSlot;
      if (slot < 3 || slot > 4 || !entry.player) continue;
      const runtime = existing.get(slot) ?? criarPlayerRuntime(slot);
      aplicarMetadadosRuntime(runtime, entry);
      const runtimeSnapshot = projectedPvp ? espelharPlayerOnline(entry.player) : entry.player;
      aplicarPlayerSnapshotSuave(runtime.runtime, runtimeSnapshot, false);
      runtime.hp = Number(entry.hp ?? runtime.hp);
      runtime.maxHp = Number(entry.maxHp ?? runtime.maxHp);
      runtime.goldenLives = Number(entry.goldenHp ?? runtime.goldenLives);
      runtime.alive = Boolean(entry.alive ?? runtime.hp > 0);
      runtime.ghost = Boolean(entry.ghost ?? !runtime.alive);
      nextRuntimes.push(runtime);
    }
    playersRef.current = nextRuntimes.sort((a, b) => a.slot - b.slot);

    if (snapshot.scoresBySlot) {
      const nextScores: Record<number, number> = {};
      for (const [slot, value] of Object.entries(snapshot.scoresBySlot)) nextScores[Number(slot)] = Number(value) || 0;
      setOnlineScoresBySlot(nextScores);
    }
    if (snapshot.mode) currentModeRef.current = snapshot.mode;
    if (snapshot.wave) {
      waveStateRef.current = { ...waveStateRef.current, ...snapshot.wave } as WaveState;
      setWaveUi((current) => ({
        ...current,
        mode: (snapshot.wave?.mode ?? waveStateRef.current.mode) as GameMode | null,
        wave: Number(snapshot.wave?.wave ?? waveStateRef.current.wave ?? 0),
        active: Boolean(snapshot.wave?.active ?? waveStateRef.current.active),
        bossWave: Boolean(snapshot.wave?.bossWave ?? waveStateRef.current.bossWave ?? current.bossWave),
        message: String(snapshot.wave?.message ?? waveStateRef.current.message ?? current.message ?? ""),
      }));
    }

    aplicarEventosVisuaisSnapshotOnline(snapshot.events, projectedPvp);
    if (Array.isArray(snapshot.shots)) shotsRef.current = mesclarObjetosSnapshotOnline(shotsRef.current, snapshot.shots, projectedPvp, 0.42, 260);
    if (Array.isArray(snapshot.enemies)) enemiesRef.current = mesclarObjetosSnapshotOnline(enemiesRef.current, snapshot.enemies, projectedPvp, 0.36, 360);
    if (Array.isArray(snapshot.enemyProjectiles)) enemyProjectilesRef.current = mesclarObjetosSnapshotOnline(enemyProjectilesRef.current, snapshot.enemyProjectiles, projectedPvp, 0.42, 300);
    if (Array.isArray(snapshot.bossProjectiles)) bossProjectilesRef.current = mesclarObjetosSnapshotOnline(bossProjectilesRef.current, snapshot.bossProjectiles, projectedPvp, 0.42, 320);
    if (Array.isArray(snapshot.powerUps)) powerUpsRef.current = normalizarPowerUpsSnapshotOnline(snapshot.powerUps, projectedPvp, localNow);
    if (Array.isArray(snapshot.tokens)) tokensRef.current = mesclarObjetosSnapshotOnline(tokensRef.current, snapshot.tokens, projectedPvp, 0.36, 320) as TokenPickup[];
    if (snapshot.boss) bossRef.current = { ...bossRef.current, ...snapshot.boss };

    if ((snapshot.state === "gameOver" || snapshot.state === "gameOverCutscene") && gameStateRef.current !== snapshot.state) setEstado(snapshot.state);
    if (snapshot.state === "playing" && gameStateRef.current !== "playing") setEstado("playing");
    onlineLastExtrapolatedAtRef.current = performance.now();
  }

  function aplicarSnapshotOnline(snapshot: OnlineGameplaySnapshot) {
    if (!onlineGameplayActiveRef.current || !snapshot) return;
    const serverAuthoritative = String(snapshot.netModel || "").includes("server-authoritative") || onlineServerAuthoritativeRef.current;
    if (souHostOnline() && !serverAuthoritative) return;

    snapshot = normalizarSnapshotOnline(snapshot);
    const incomingTick = Number(snapshot.tick ?? snapshot.seq ?? 0);
    const incomingSeq = Number(snapshot.seq ?? incomingTick ?? 0);
    if (incomingTick > 0) {
      const lastTick = onlineLastAppliedSnapshotTickRef.current;
      const lastSeq = onlineLastAppliedSnapshotSeqRef.current;
      if (incomingTick < lastTick || (incomingTick === lastTick && incomingSeq <= lastSeq)) return;
      onlineLastAppliedSnapshotTickRef.current = incomingTick;
      onlineLastAppliedSnapshotSeqRef.current = incomingSeq;
    } else if (snapshot.t && snapshot.t <= onlineLastAppliedSyncAtRef.current) {
      return;
    }
    onlineLastAppliedSyncAtRef.current = snapshot.serverTime || snapshot.t || Date.now();

    if (Array.isArray(snapshot.players)) {
      for (const remote of snapshot.players) {
        if (remote?.slot && remote.cosmetics) onlineCosmeticsBySlotRef.current[remote.slot] = remote.cosmetics;
        if (remote?.slot && remote.profileColor) onlineProfileColorBySlotRef.current[remote.slot] = remote.profileColor;
      }
    }
    if (snapshot.scoresBySlot) {
      const nextScores: Record<number, number> = {};
      for (const [slot, value] of Object.entries(snapshot.scoresBySlot)) nextScores[Number(slot)] = Number(value) || 0;
      setOnlineScoresBySlot(nextScores);
    }
    if (Array.isArray(snapshot.activeSlots)) setOnlineActiveSlots(snapshot.activeSlots.map(Number).filter(Boolean));
    if (Array.isArray(snapshot.waitingSlots)) setOnlineWaitingSlots(snapshot.waitingSlots.map(Number).filter(Boolean));
    if (snapshot.mode) {
      currentModeRef.current = snapshot.mode;
    }
    const waveSnapshot = snapshot.wave;
    if (waveSnapshot) {
      waveStateRef.current = { ...waveStateRef.current, ...waveSnapshot } as WaveState;
      setWaveUi((current) => ({
        ...current,
        mode: (waveSnapshot.mode ?? waveStateRef.current.mode) as GameMode | null,
        wave: Number(waveSnapshot.wave ?? waveStateRef.current.wave ?? 0),
        active: Boolean(waveSnapshot.active ?? waveStateRef.current.active),
        bossWave: Boolean(waveSnapshot.bossWave ?? waveStateRef.current.bossWave ?? current.bossWave),
        message: String(waveSnapshot.message ?? waveStateRef.current.message ?? current.message ?? ""),
      }));
    }

    const projectedPvp = deveProjetarOnlinePvpLocal();
    const localNow = performance.now();
    if (serverAuthoritative) {
      aplicarSnapshotServidorAutoritativo(snapshot, localNow);
      return;
    }
    if (Array.isArray(snapshot.players)) {
      for (const remote of snapshot.players) {
        const slot = Number(remote.slot) as PlayerSlot;
        if (slot >= 1 && slot <= 4) {
          if (remote.cosmetics) onlineCosmeticsBySlotRef.current[slot] = remote.cosmetics;
          if (remote.profileColor) onlineProfileColorBySlotRef.current[slot] = remote.profileColor;
        }
      }
    }

    if (projectedPvp) {
      const localPlayer = espelharPlayerOnline(snapshot.p2 || null);
      const rivalPlayer = espelharPlayerOnline(snapshot.p1 || null);
      if (localPlayer) aplicarPlayerSnapshotSuave(playerRef.current, localPlayer, true);
      if (rivalPlayer) {
        if (!player2Ref.current) player2Ref.current = criarPlayer2Inicial();
        aplicarPlayerSnapshotSuave(player2Ref.current, rivalPlayer, false);
      }
      if (typeof snapshot.p2Hp === "number") { playerRef.current.hp = snapshot.p2Hp; setPlayerHp(snapshot.p2Hp); }
      if (typeof snapshot.p1Hp === "number") { if (player2Ref.current) player2Ref.current.hp = snapshot.p1Hp; setPlayer2Hp(snapshot.p1Hp); }
      if (typeof snapshot.p2Gold === "number") { playerRef.current.goldenHp = snapshot.p2Gold; setGoldenHp(snapshot.p2Gold); }
      if (typeof snapshot.p1Gold === "number") { if (player2Ref.current) player2Ref.current.goldenHp = snapshot.p1Gold; setPlayer2GoldenHp(snapshot.p1Gold); }
      aplicarEfeitosOnlineLocal(snapshot.p2Effects, 1);
      aplicarEfeitosOnlineLocal(snapshot.p1Effects, 2);
      if (!snapshot.p2Effects) { shieldActiveRef.current = Boolean(snapshot.p2ShieldActive); setShieldActive(Boolean(snapshot.p2ShieldActive)); }
      if (!snapshot.p1Effects) player2ShieldUntilRef.current = snapshot.p1ShieldActive ? localNow + 260 : 0;
      if (snapshot.p2DodgeActive) playerRef.current.dodgeUntil = localNow + 120;
      else if (playerRef.current.dodgeUntil > localNow + 180) playerRef.current.dodgeUntil = 0;
      if (snapshot.p1DodgeActive && player2Ref.current) player2Ref.current.dodgeUntil = localNow + 120;
      else if (player2Ref.current && player2Ref.current.dodgeUntil > localNow + 180) player2Ref.current.dodgeUntil = 0;
    } else {
      if (snapshot.p1) aplicarPlayerSnapshotSuave(playerRef.current, snapshot.p1, onlineSlotRef.current === 1);
      if (snapshot.p2) {
        if (!player2Ref.current) player2Ref.current = criarPlayer2Inicial();
        aplicarPlayerSnapshotSuave(player2Ref.current, snapshot.p2, onlineSlotRef.current === 2);
      }
      if (typeof snapshot.p1Hp === "number") { playerRef.current.hp = snapshot.p1Hp; setPlayerHp(snapshot.p1Hp); }
      if (typeof snapshot.p2Hp === "number") { if (player2Ref.current) player2Ref.current.hp = snapshot.p2Hp; setPlayer2Hp(snapshot.p2Hp); }
      if (typeof snapshot.p1Gold === "number") { playerRef.current.goldenHp = snapshot.p1Gold; setGoldenHp(snapshot.p1Gold); }
      if (typeof snapshot.p2Gold === "number") { if (player2Ref.current) player2Ref.current.goldenHp = snapshot.p2Gold; setPlayer2GoldenHp(snapshot.p2Gold); }
      aplicarEfeitosOnlineLocal(snapshot.p1Effects, 1);
      aplicarEfeitosOnlineLocal(snapshot.p2Effects, 2);
      if (!snapshot.p1Effects) { shieldActiveRef.current = Boolean(snapshot.p1ShieldActive); setShieldActive(Boolean(snapshot.p1ShieldActive)); }
      if (!snapshot.p2Effects) player2ShieldUntilRef.current = snapshot.p2ShieldActive ? localNow + 260 : 0;
      if (snapshot.p1DodgeActive) playerRef.current.dodgeUntil = localNow + 120;
      else if (playerRef.current.dodgeUntil > localNow + 180) playerRef.current.dodgeUntil = 0;
      if (snapshot.p2DodgeActive && player2Ref.current) player2Ref.current.dodgeUntil = localNow + 120;
      else if (player2Ref.current && player2Ref.current.dodgeUntil > localNow + 180) player2Ref.current.dodgeUntil = 0;
    }

    if (typeof snapshot.score === "number") { scoreRef.current = snapshot.score; setScore(snapshot.score); }
    if (typeof snapshot.localP1Score === "number") { localP1ScoreRef.current = snapshot.localP1Score; setLocalP1Score(snapshot.localP1Score); }
    if (typeof snapshot.localP2Score === "number") { localP2ScoreRef.current = snapshot.localP2Score; setLocalP2Score(snapshot.localP2Score); }
    if (typeof snapshot.localPvpRound === "number") { localPvpRoundRef.current = snapshot.localPvpRound; setLocalPvpRound(snapshot.localPvpRound); }

    aplicarEventosVisuaisSnapshotOnline(snapshot.events, projectedPvp);
    if (Array.isArray(snapshot.shots)) shotsRef.current = mesclarObjetosSnapshotOnline(shotsRef.current, snapshot.shots, projectedPvp, 0.66, 520);
    emitirFeedbackVisualSnapshotOnline(snapshot, projectedPvp);
    if (Array.isArray(snapshot.enemies)) enemiesRef.current = mesclarObjetosSnapshotOnline(enemiesRef.current, snapshot.enemies, projectedPvp, 0.58, 520);
    if (Array.isArray(snapshot.enemyProjectiles)) enemyProjectilesRef.current = mesclarObjetosSnapshotOnline(enemyProjectilesRef.current, snapshot.enemyProjectiles, projectedPvp, 0.62, 520);
    if (Array.isArray(snapshot.bossProjectiles)) bossProjectilesRef.current = mesclarObjetosSnapshotOnline(bossProjectilesRef.current, snapshot.bossProjectiles, projectedPvp, 0.6, 520);
    aplicarPlayersExtrasDoSnapshot(snapshot, projectedPvp);
    if (Array.isArray(snapshot.powerUps)) powerUpsRef.current = normalizarPowerUpsSnapshotOnline(snapshot.powerUps, projectedPvp, localNow);
    if (Array.isArray(snapshot.tokens)) tokensRef.current = mesclarObjetosSnapshotOnline(tokensRef.current, snapshot.tokens, projectedPvp, 0.58, 420) as TokenPickup[];
    if (snapshot.boss) {
      const bossSnapshot = projectedPvp ? espelharObjetoOnline({ ...(snapshot.boss as Partial<BossState>), x: Number(snapshot.boss.x ?? bossRef.current.x), w: Number(snapshot.boss.w ?? bossRef.current.w), vx: 0 }) : snapshot.boss;
      bossRef.current = { ...bossRef.current, ...bossSnapshot };
    }
    onlineLastExtrapolatedAtRef.current = performance.now();

    if ((snapshot.state === "gameOver" || snapshot.state === "gameOverCutscene") && gameStateRef.current !== snapshot.state) {
      setEstado(snapshot.state);
    }
    if (snapshot.state === "playing" && gameStateRef.current === "gameOver") {
      setEstado("playing");
    }
  }

  function extrapolarEstadoOnlineNaoHost(delta: number, canvas: HTMLCanvasElement) {
    if (!onlineGameplayActiveRef.current || souHostOnline() || gameStateRef.current !== "playing") return;
    const speedFactor = delta / 16.67;
    const movePlayer = (player: Player | null) => {
      if (!player) return;
      player.x += (player.vx || 0) * speedFactor;
      player.y += (player.vy || 0) * speedFactor;
      player.vx *= Math.pow(CONFIG.gameplay.player.friction, speedFactor * 0.32);
      player.vy *= Math.pow(CONFIG.gameplay.player.friction, speedFactor * 0.32);
      player.x = clamp(player.x, 0, CONFIG.canvasWidth - player.w);
      player.y = clamp(player.y, 0, CONFIG.canvasHeight - player.h);
    };
    const player1EhLocalVisual = deveProjetarOnlinePvpLocal() || onlineSlotRef.current === 1;
    // Extrapola apenas o rival/objetos. O player local já tem prediction própria; mover os dois
    // aqui era a principal causa do guest parecer mais rápido e depois receber microcorreções.
    if (!player1EhLocalVisual) movePlayer(playerRef.current);
    if (player1EhLocalVisual) movePlayer(player2Ref.current);
    shotsRef.current = shotsRef.current
      .map((shot) => ({ ...shot, x: shot.x + (shot.vx ?? shot.speed) * speedFactor, y: shot.y + (shot.vy ?? 0) * speedFactor }))
      .filter((shot) => shot.x + shot.w > -80 && shot.x < CONFIG.canvasWidth + 80 && shot.y + shot.h > -80 && shot.y < CONFIG.canvasHeight + 80);
    enemyProjectilesRef.current = enemyProjectilesRef.current
      .map((bullet) => ({
        ...bullet,
        x: bullet.x + (bullet.vx || 0) * speedFactor,
        y: bullet.y + (bullet.vy || 0) * speedFactor,
      }))
      .filter((bullet) => bullet.x > -140 && bullet.x < canvas.width + 140 && bullet.y > -140 && bullet.y < canvas.height + 140);
    bossProjectilesRef.current = bossProjectilesRef.current
      .map((projectile) => ({ ...projectile, x: projectile.x + (projectile.vx || 0) * speedFactor, y: projectile.y + (projectile.vy || 0) * speedFactor, life: Math.max(0, projectile.life - delta) }))
      .filter((projectile) => projectile.life > 0);
    enemiesRef.current = enemiesRef.current.map((enemy) => ({
      ...enemy,
      age: enemy.age + delta,
      x: enemy.x + (enemy.vx || 0) * speedFactor,
      y: enemy.y + (enemy.vy || 0) * speedFactor,
      rotation: (enemy.rotation ?? 0) + (enemy.rotationSpeed ?? 0) * delta,
    }));
    const cfg = CONFIG.gameplay.powerups;
    powerUpsRef.current = powerUpsRef.current
      .map((power) => ({
        ...power,
        age: power.age + delta,
        life: power.life - delta,
        x: power.x + power.vx * speedFactor,
        y: power.y + power.vy * speedFactor + Math.sin((power.age + delta) * cfg.waveFrequency + power.wavePhase) * cfg.waveAmplitude * 0.035 * speedFactor,
      }))
      .filter((power) => power.life > 0 && power.x > -140 && power.x < canvas.width + 140 && power.y > -110 && power.y < canvas.height + 110);
    tokensRef.current = tokensRef.current
      .map((token) => ({ ...token, age: token.age + delta, life: token.life - delta, x: token.x + token.vx * speedFactor, y: token.y + token.vy * speedFactor }))
      .filter((token) => token.life > 0 && token.x > -80 && token.x < canvas.width + 160 && token.y > -80 && token.y < canvas.height + 80);
  }

  function adicionarSnapshotOnline(rawSnapshot: OnlineGameplaySnapshot) {
    if (!rawSnapshot) return;
    const snapshot = normalizarSnapshotOnline({
      ...rawSnapshot,
      receivedAt: performance.now(),
    });
    const tick = Number(snapshot.tick ?? snapshot.seq ?? 0);
    const seq = Number(snapshot.seq ?? tick ?? 0);
    const lastTick = onlineLastAppliedSnapshotTickRef.current;
    const lastSeq = onlineLastAppliedSnapshotSeqRef.current;

    // Nunca aceita quadro mais antigo que o último aplicado; isso era a origem do efeito de “voltar no tempo”.
    if (tick > 0 && (tick < lastTick || (tick === lastTick && seq <= lastSeq))) return;

    const buffer = onlineSnapshotBufferRef.current.filter((item) => {
      const itemTick = Number(item.tick ?? item.seq ?? 0);
      return itemTick === 0 || tick === 0 || itemTick > lastTick - 2;
    });

    buffer.push(snapshot);
    buffer.sort((a, b) => Number(a.tick ?? a.seq ?? 0) - Number(b.tick ?? b.seq ?? 0));
    onlineSnapshotBufferRef.current = buffer.slice(-8);
    onlineLatestSnapshotRef.current = onlineSnapshotBufferRef.current[onlineSnapshotBufferRef.current.length - 1] ?? snapshot;
  }

  function escolherSnapshotOnlineParaRender() {
    const buffer = onlineSnapshotBufferRef.current;
    if (buffer.length === 0) return onlineLatestSnapshotRef.current;

    const latest = buffer[buffer.length - 1];
    const nowLocal = performance.now();
    const latestReceivedAt = Number(latest.receivedAt ?? nowLocal);

    // v1.9: no Space News o delay visual era pior que o pequeno tremido.
    // Usamos o snapshot mais recente e deixamos a suavização por entidade resolver o encaixe.
    if (buffer.length >= 2 || nowLocal - latestReceivedAt > onlineRenderDelayMsRef.current) {
      onlineSnapshotBufferRef.current = [latest];
      return latest;
    }

    return latest;
  }

  function sincronizarGameplayOnline() {
    if (!onlineGameplayActiveRef.current) return;
    const state = gameStateRef.current;
    if (!["playing", "paused", "gameOver", "gameOverCutscene"].includes(state)) return;
    const now = performance.now();

    if (onlineTogetherCoordenado()) {
      if (souAutoridadeMundoOnlineTogether() && now - onlineLastWorldResyncSentAtRef.current >= 620) {
        onlineLastWorldResyncSentAtRef.current = now;
        enviarOnline({ type: "coop_world_resync", slot: slotLocalOnline(), world: criarSnapshotMundoCoop(), seq: Date.now() });
      }
    } else if (onlineServerAuthoritativeRef.current) {
      // v2.3.0: o Worker é a autoridade. Nenhum cliente envia snapshot de gameplay.
    } else if (souHostOnline()) {
      // Fallback legado caso o Worker antigo ainda esteja rodando.
      if (now - onlineLastSyncSentAtRef.current < 45) return;
      onlineLastSyncSentAtRef.current = now;
      enviarOnline({ type: "sync", snapshot: criarSnapshotOnline() });
      return;
    }

    // O snapshot do cliente é aplicado dentro de atualizar(), antes da extrapolação/prediction.
    // Aplicar de novo aqui causava dois pequenos encaixes por frame.

    if (onlineLastSyncReceivedAtRef.current && now - onlineLastSyncReceivedAtRef.current > 2600) {
      setOnlineSyncWarning("LINK OSCILANDO");
    } else if (onlineSyncWarning) {
      setOnlineSyncWarning("");
    }
  }

  function encerrarGameplayOnline() {
    onlineGameplayActiveRef.current = false;
    onlineServerAuthoritativeRef.current = false;
    setOnlineGameplayActive(false);
    onlineRemoteInputsRef.current = {};
    onlineLatestSnapshotRef.current = null;
    onlineSnapshotBufferRef.current = [];
    onlineLastSyncReceivedAtRef.current = 0;
    onlineLastAppliedSyncAtRef.current = 0;
    onlineLastAppliedSnapshotTickRef.current = 0;
    onlineLastAppliedSnapshotSeqRef.current = 0;
    onlineLastExtrapolatedAtRef.current = 0;
    onlineSnapshotSeqRef.current = 0;
    onlineVisualEventSeqRef.current = 0;
    onlineVisualEventLogRef.current = [];
    setOnlineScoresBySlot({});
    setOnlineActiveSlots([]);
    setOnlineWaitingSlots([]);
    onlineSeenVisualEventsRef.current.clear();
    onlinePredictedBoostReadyAtRef.current = 0;
    setOnlineSyncWarning("");
    onlinePauseRequestedByRef.current = null;
    onlinePauseReadySlotsRef.current = [];
    onlinePausePanelOpenRef.current = false;
    setOnlinePauseRequestedBy(null);
    setOnlinePauseReadySlots([]);
    setOnlinePausePanelOpen(false);
  }


  function salvarPerfilLocal(next: LocalProfile) {
    localProfileRef.current = next;
    setLocalProfile(next);
    try {
      window.localStorage.setItem(SPACE_NEWS_PROFILE_KEY, JSON.stringify(next));
    } catch {
      // sem storage disponível
    }
  }

  function criarResumoPerfilOnline(profile = localProfileRef.current): OnlineProfileSummary {
    const achievements = normalizarConquistasPerfil(profile.achievements);
    return {
      id: profile.id,
      name: nomePerfilVisivel(profile),
      color: profile.color,
      friendCode: profile.friendCode,
      tokens: Math.max(0, Math.floor(profile.tokens || 0)),
      friendsCount: profile.friends.length,
      requestsCount: profile.friendRequests.length,
      achievementsUnlocked: achievements.filter((item) => item.unlockedAt).length,
      achievementsTotal: achievements.length,
      equipped: profile.equipped,
      stats: {
        runsStarted: profile.stats.runsStarted,
        enemiesKilled: profile.stats.enemiesKilled,
        deaths: profile.stats.deaths,
        tokensCollected: profile.stats.tokensCollected,
        bestInfiniteWave: profile.stats.bestInfiniteWave,
        bestInfiniteScore: profile.stats.bestInfiniteScore,
        chocadosKilled: profile.stats.chocadosKilled,
      },
      updatedAt: profile.updatedAt,
    };
  }

  function enviarPerfilOnlineAtual() {
    if (!onlineConnected) return;
    enviarOnline({
      type: "profile",
      name: nomeOnlineSeguro(),
      device: dispositivoOnlineAtual().label,
      cosmetics: localProfileRef.current.equipped,
      profileColor: localProfileRef.current.color,
      profileSummary: criarResumoPerfilOnline(),
    });
  }

  function adicionarNotificacaoPerfil(kind: LocalNotification["kind"], title: string, message: string, action?: LocalNotification["action"]) {
    const current = localProfileRef.current;
    const next: LocalNotification = {
      id: `${kind}-${Date.now().toString(36)}-${Math.floor(randomFloat() * 9999)}`,
      kind,
      title: title.slice(0, 48),
      message: message.slice(0, 160),
      createdAt: Date.now(),
      action,
    };
    salvarPerfilLocal({ ...current, notifications: [next, ...normalizarNotificacoesPerfil(current.notifications)].slice(0, 80), updatedAt: Date.now() });
  }

  function marcarNotificacoesPerfilComoLidas() {
    const now = Date.now();
    const current = localProfileRef.current;
    salvarPerfilLocal({
      ...current,
      notifications: normalizarNotificacoesPerfil(current.notifications).map((item) => item.readAt ? item : { ...item, readAt: now }),
      updatedAt: now,
    });
  }

  function limparNotificacoesPerfil() {
    salvarPerfilLocal({ ...localProfileRef.current, notifications: [], updatedAt: Date.now() });
  }


  function normalizarNomeUnicoPerfil(name: string) {
    return limparNomeOnline(name).trim().toUpperCase().replace(/\s+/g, " ");
  }

  function carregarRegistroNomesPerfil(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SPACE_NEWS_NAME_REGISTRY_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed as Record<string, string> : {};
    } catch {
      return {};
    }
  }

  function salvarRegistroNomesPerfil(registry: Record<string, string>) {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(SPACE_NEWS_NAME_REGISTRY_KEY, JSON.stringify(registry)); } catch {}
  }

  function nomePerfilDisponivel(name: string, profileId = localProfileRef.current.id) {
    const key = normalizarNomeUnicoPerfil(name);
    if (!key || key === "PLAYER") return true;
    const registry = carregarRegistroNomesPerfil();
    const owner = registry[key];
    return !owner || owner === profileId;
  }

  function reservarNomePerfil(name: string, profileId = localProfileRef.current.id) {
    const key = normalizarNomeUnicoPerfil(name);
    if (!key || key === "PLAYER") return true;
    const registry = carregarRegistroNomesPerfil();
    const owner = registry[key];
    if (owner && owner !== profileId) return false;
    registry[key] = profileId;
    salvarRegistroNomesPerfil(registry);
    return true;
  }

  function liberarNomePerfil(name: string, profileId = localProfileRef.current.id) {
    const key = normalizarNomeUnicoPerfil(name);
    if (!key) return;
    const registry = carregarRegistroNomesPerfil();
    if (registry[key] === profileId) {
      delete registry[key];
      salvarRegistroNomesPerfil(registry);
    }
  }

  function nomePerfilVisivel(profile = localProfileRef.current) {
    return limparNomeOnline(profile.name || "").trim() || "Player";
  }

  function inicialPerfil(profile = localProfileRef.current) {
    return nomePerfilVisivel(profile).slice(0, 1).toUpperCase() || "P";
  }

  function atualizarNomePerfilLocal(name: string) {
    // Permite apagar o campo inteiro enquanto edita. O fallback "Player" só é usado visualmente/online.
    const clean = limparNomeOnline(name).slice(0, 16);
    const current = localProfileRef.current;
    if (clean.trim() && !nomePerfilDisponivel(clean, current.id)) {
      mostrarToastPerfil("Nome já está em uso. Escolha outro.");
      return;
    }
    if (clean.trim()) {
      liberarNomePerfil(current.name, current.id);
      reservarNomePerfil(clean, current.id);
      mostrarToastPerfil("Nome reservado para seu perfil.");
    }
    const next = { ...current, name: clean, updatedAt: Date.now() };
    salvarPerfilLocal(next);
    const onlineName = clean.trim() || "Player";
    setOnlinePlayerName(onlineName);
    if (onlineConnected) enviarPerfilOnlineAtual();
  }

  function atualizarCorPerfilLocal(color: string) {
    if (!PROFILE_COLOR_OPTIONS.includes(color)) return;
    salvarPerfilLocal({ ...localProfileRef.current, color, updatedAt: Date.now() });
    enviarPerfilOnlineAtual();
  }

  function mostrarToastPerfil(message: string) {
    setProfileToast(message);
    window.setTimeout(() => setProfileToast((current) => current === message ? "" : current), 2200);
  }

  function mostrarPopupConquista(achievement: LocalAchievement) {
    setAchievementPopup(achievement);
    if (achievementPopupTimerRef.current !== null) window.clearTimeout(achievementPopupTimerRef.current);
    achievementPopupTimerRef.current = window.setTimeout(() => setAchievementPopup(null), 2800);
  }

  function desbloquearConquistaPerfil(id: string) {
    const current = localProfileRef.current;
    const now = Date.now();
    const achievements = normalizarConquistasPerfil(current.achievements);
    const achievementIndex = achievements.findIndex((achievement) => achievement.id === id && !achievement.unlockedAt);
    if (achievementIndex < 0) return;
    const unlockedNow: LocalAchievement = { ...achievements[achievementIndex], unlockedAt: now };
    const nextAchievements = achievements.map((achievement, index) => index === achievementIndex ? unlockedNow : achievement);
    salvarPerfilLocal({ ...current, achievements: nextAchievements, updatedAt: now });
    mostrarPopupConquista(unlockedNow);
    adicionarNotificacaoPerfil("achievement", unlockedNow.title, unlockedNow.description, "achievements");
  }

  function atualizarStatsPerfilLocal(updater: (stats: LocalProfileStats) => LocalProfileStats) {
    const current = localProfileRef.current;
    const nextStats = updater({ ...criarStatsPerfilPadrao(), ...current.stats });
    const now = Date.now();
    let achievements = normalizarConquistasPerfil(current.achievements);
    function unlock(id: string) {
      const achievementIndex = achievements.findIndex((achievement) => achievement.id === id && !achievement.unlockedAt);
      if (achievementIndex < 0) return;
      const unlockedNow: LocalAchievement = { ...achievements[achievementIndex], unlockedAt: now };
      achievements = achievements.map((achievement, index) => index === achievementIndex ? unlockedNow : achievement);
      mostrarPopupConquista(unlockedNow);
      adicionarNotificacaoPerfil("achievement", unlockedNow.title, unlockedNow.description, "achievements");
    }
    if (current.tokens > 0 || nextStats.tokensCollected > 0) unlock("first-token");
    if (current.tokens >= 10 || nextStats.tokensCollected >= 10) unlock("ten-tokens");
    if (current.tokens >= 100 || nextStats.tokensCollected >= 100) unlock("hundred-tokens");
    if (current.tokens >= 250 || nextStats.tokensCollected >= 250) unlock("tokens-250");
    if (nextStats.enemiesKilled >= 1) unlock("first-kill");
    if (nextStats.enemiesKilled >= 100) unlock("hundred-kills");
    if (nextStats.chocadosKilled >= 1) unlock("first-chocado");
    if (nextStats.bestInfiniteWave >= 10) unlock("infinite-10");
    if (nextStats.bestInfiniteWave >= 25) unlock("infinite-25");
    if (nextStats.bestInfiniteScore >= 5000) unlock("best-score-5000");
    if (nextStats.pvpWins >= 1) unlock("pvp-win");
    if (nextStats.playTimeMs >= 30 * 60 * 1000) unlock("long-play");
    salvarPerfilLocal({ ...current, stats: nextStats, achievements, updatedAt: now });
  }

  function adicionarPedidoAmizadeLocal(codeRaw: string) {
    const code = formatarCodigoAmizadeInput(codeRaw);
    if (!code || code === localProfileRef.current.friendCode) {
      mostrarToastPerfil("Código inválido.");
      return;
    }
    const current = localProfileRef.current;
    if (current.friends.some((friend) => friend.code === code || friend.id === code) || current.friendRequests.some((request) => request.code === code)) {
      mostrarToastPerfil("Esse código já está na sua lista.");
      return;
    }
    const request: LocalFriendRequest = {
      id: criarIdPerfilLocal(),
      code,
      name: `Pedido ${code}`,
      direction: "sent",
      createdAt: Date.now(),
    };
    salvarPerfilLocal({ ...current, friendRequests: [request, ...current.friendRequests].slice(0, 40), updatedAt: Date.now() });
    setProfileFriendCodeInput("");
    adicionarNotificacaoPerfil("friend", "Pedido de amizade", `Pedido salvo para ${code}.`, "friends");
    mostrarToastPerfil("Pedido de amizade salvo localmente.");
  }

  function aceitarPedidoAmizadeLocal(requestId: string) {
    const current = localProfileRef.current;
    const request = current.friendRequests.find((item) => item.id === requestId);
    if (!request) return;
    const friend: LocalFriend = { id: request.code, code: request.code, name: request.name || request.code, status: "accepted", lastSeenAt: Date.now() };
    salvarPerfilLocal({
      ...current,
      friends: [friend, ...current.friends.filter((item) => item.code !== request.code)].slice(0, 60),
      friendRequests: current.friendRequests.filter((item) => item.id !== requestId),
      updatedAt: Date.now(),
    });
    adicionarNotificacaoPerfil("friend", "Amigo adicionado", `${friend.name} agora está na sua tripulação.`, "friends");
    desbloquearConquistaPerfil("friend-one");
    if (localProfileRef.current.friends.length >= 5) desbloquearConquistaPerfil("friend-five");
    mostrarToastPerfil("Amigo aceito.");
  }

  function removerAmizadeOuPedidoLocal(id: string) {
    const current = localProfileRef.current;
    salvarPerfilLocal({
      ...current,
      friends: current.friends.filter((friend) => friend.id !== id && friend.code !== id),
      friendRequests: current.friendRequests.filter((request) => request.id !== id && request.code !== id),
      updatedAt: Date.now(),
    });
  }

  function deletarPerfilLocal() {
    const ok = typeof window === "undefined" ? true : window.confirm("Quer mesmo deletar sua conta local? Seus tokens, inventário, conquistas e reserva de nome serão apagados deste navegador.");
    if (!ok) return;
    liberarNomePerfil(localProfileRef.current.name, localProfileRef.current.id);
    const next = criarPerfilLocalPadrao();
    salvarPerfilLocal(next);
    setOnlinePlayerName(next.name);
    setProfileManagerOpen(false);
  }

  function itemShopPorId(id?: string) {
    return SHOP_ITEMS.find((item) => item.id === id);
  }

  function perfilPossuiItem(id: string) {
    return localProfileRef.current.inventory.includes(id);
  }

  function buffsCosmeticosEquipados(profile = localProfileRef.current): Required<ShopBuffs> {
    const total: Required<ShopBuffs> = {
      speed: 0,
      shotSpeed: 0,
      damage: 0,
      maxHp: 0,
      size: 0,
      regenSeconds: 0,
      magnet: 0,
      extraEnemies: 0,
      dodgeCooldown: 0,
      flames: 0,
      defense: 0,
      waveSkipChance: 0,
      freezeOnStart: 0,
      tokenBonus: 0,
    };
    for (const rawId of Object.values(profile.equipped || {})) {
      const id = typeof rawId === "string" ? rawId : "";
      const item = itemShopPorId(id);
      if (!item?.buffs) continue;
      // v2.3.1: acessórios são cosméticos puros. Buff permanente fica nos pets;
      // exceção proposital: Armamento Extra, que é o único acessório caro com buff.
      if (item.slot !== "pet" && item.id !== "middle-extra-arms") continue;
      for (const [key, value] of Object.entries(item.buffs) as Array<[keyof ShopBuffs, number]>) {
        total[key] = (total[key] || 0) + Number(value || 0);
      }
    }
    total.speed = clamp(total.speed, -0.25, 0.22);
    total.shotSpeed = clamp(total.shotSpeed, -0.2, 0.24);
    total.damage = clamp(total.damage, -0.18, 0.25);
    total.maxHp = clamp(Math.round(total.maxHp), -2, 2);
    total.size = clamp(total.size, -0.1, 0.12);
    total.regenSeconds = total.regenSeconds > 0 ? clamp(total.regenSeconds, 18, 45) : 0;
    total.dodgeCooldown = clamp(total.dodgeCooldown, -0.18, 1);
    total.flames = clamp(total.flames, 0, 0.4);
    total.defense = clamp(total.defense, -0.2, 0.2);
    total.waveSkipChance = clamp(total.waveSkipChance, 0, 0.08);
    total.tokenBonus = clamp(total.tokenBonus, 0, 0.25);
    return total;
  }

  function descricaoBuffs(item: ShopItem) {
    if (item.slot !== "pet" && item.id !== "middle-extra-arms") return "Cosmético puro";
    const buffs = item.buffs || {};
    const labels: string[] = [];
    if (buffs.speed) labels.push(`${buffs.speed > 0 ? "+" : ""}${Math.round(buffs.speed * 100)}% velocidade`);
    if (buffs.shotSpeed) labels.push(`${buffs.shotSpeed > 0 ? "+" : ""}${Math.round(buffs.shotSpeed * 100)}% velocidade dos tiros`);
    if (buffs.damage) labels.push(`${buffs.damage > 0 ? "+" : ""}${Math.round(buffs.damage * 100)}% dano`);
    if (buffs.maxHp) labels.push(`${buffs.maxHp > 0 ? "+" : ""}${buffs.maxHp} vida`);
    if (buffs.size) labels.push(`${buffs.size > 0 ? "+" : ""}${Math.round(buffs.size * 100)}% tamanho`);
    if (buffs.regenSeconds) labels.push(`regen a cada ${buffs.regenSeconds}s`);
    if (buffs.dodgeCooldown) labels.push(`${buffs.dodgeCooldown >= 1 ? "sem dodge" : `${buffs.dodgeCooldown > 0 ? "+" : ""}${Math.round(buffs.dodgeCooldown * 100)}% cooldown dodge`}`);
    if (buffs.waveSkipChance) labels.push(`${Math.round(buffs.waveSkipChance * 100)}% pular wave`);
    if (buffs.tokenBonus) labels.push(`+${Math.round(buffs.tokenBonus * 100)}% tokens`);
    return labels.length ? labels.join(" · ") : "Cosmético puro";
  }

  function itemPertenceAbaShop(item: ShopItem, tab: ShopSlot) {
    if (tab === "front") return item.slot === "front" || item.slot === "middle";
    return item.slot === tab;
  }

  function tituloAbaShop(tab: ShopSlot) {
    if (tab === "front") return "ACESSÓRIOS";
    if (tab === "middle") return "ACESSÓRIOS";
    if (tab === "recolor") return "RECOLORS";
    if (tab === "pet") return "PETS";
    return "SHOP";
  }

  function shopIconSrc(item: ShopItem, selected = false) {
    return `/game/shop/icons/${selected ? "selected" : "normal"}/${item.id}.png`;
  }


  function comprarItemShop(item: ShopItem) {
    if (item.disabled) {
      mostrarToastPerfil("Item ainda não disponível.");
      return;
    }
    const current = localProfileRef.current;
    if (current.inventory.includes(item.id)) {
      equiparItemShop(item);
      return;
    }
    if (current.tokens < item.price) {
      mostrarToastPerfil(`Faltam ${item.price - current.tokens} tokens.`);
      return;
    }
    salvarPerfilLocal({
      ...current,
      tokens: current.tokens - item.price,
      inventory: [...current.inventory, item.id],
      equipped: { ...current.equipped, [item.slot]: item.id },
      updatedAt: Date.now(),
    });
    adicionarNotificacaoPerfil("shop", "Compra concluída", `${item.name} entrou no seu inventário.`, "shop");
    desbloquearConquistaPerfil("shop-first");
    if (localProfileRef.current.inventory.length >= 5) desbloquearConquistaPerfil("inventory-5");
    if (localProfileRef.current.inventory.length >= 12) desbloquearConquistaPerfil("inventory-12");
    if (item.slot === "pet") desbloquearConquistaPerfil("pet-equipped");
    if (localProfileRef.current.equipped.recolor && localProfileRef.current.equipped.front && localProfileRef.current.equipped.middle && localProfileRef.current.equipped.pet) desbloquearConquistaPerfil("full-style");
    mostrarToastPerfil(`${item.name} comprado e equipado.`);
    tocarSom(CONFIG.sounds.tokenCollect || CONFIG.sounds.menuConfirm, 0.32, "menu");
  }

  function equiparItemShop(item: ShopItem) {
    const current = localProfileRef.current;
    if (!current.inventory.includes(item.id)) return;
    if (item.id === "accessory-none") {
      const nextEquipped = { ...current.equipped };
      delete nextEquipped.front;
      delete nextEquipped.middle;
      salvarPerfilLocal({ ...current, equipped: nextEquipped, updatedAt: Date.now() });
      mostrarToastPerfil("Acessórios removidos.");
      return;
    }
    if (item.id === "pet-none") {
      const nextEquipped = { ...current.equipped };
      delete nextEquipped.pet;
      salvarPerfilLocal({ ...current, equipped: nextEquipped, updatedAt: Date.now() });
      mostrarToastPerfil("Pet removido.");
      return;
    }
    salvarPerfilLocal({
      ...current,
      equipped: { ...current.equipped, [item.slot]: item.id },
      updatedAt: Date.now(),
    });
    if (item.slot === "pet") desbloquearConquistaPerfil("pet-equipped");
    if (localProfileRef.current.equipped.recolor && localProfileRef.current.equipped.front && localProfileRef.current.equipped.middle && localProfileRef.current.equipped.pet) desbloquearConquistaPerfil("full-style");
    mostrarToastPerfil(`${item.name} equipado.`);
    tocarSom(CONFIG.sounds.menuConfirm, 0.3, "menu");
  }

  function desequiparSlotShop(slot: ShopSlot) {
    const current = localProfileRef.current;
    if (slot === "recolor") {
      salvarPerfilLocal({ ...current, equipped: { ...current.equipped, recolor: "recolor-classic" }, updatedAt: Date.now() });
      return;
    }
    const nextEquipped = { ...current.equipped };
    delete nextEquipped[slot];
    salvarPerfilLocal({ ...current, equipped: nextEquipped, updatedAt: Date.now() });
  }

  function imagemShop(src?: string) {
    if (!src || typeof window === "undefined") return null;
    const cache = shopImagesRef.current;
    const cached = cache.get(src);
    if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;
    const img = new Image();
    img.src = assetUrl(src);
    cache.set(src, img);
    return null;
  }

  function assetCosmetico(item: ShopItem | undefined, dodge = false) {
    if (!item) return null;
    return imagemShop(dodge ? item.dodgeAsset || item.asset : item.asset);
  }

  function desenharCosmeticosNave(ctx: CanvasRenderingContext2D, player: Player, options?: { dodge?: boolean; alpha?: number; equipped?: EquippedCosmetics; movingFrame?: number; superSpark?: boolean }) {
    const profile = localProfileRef.current;
    const equipped = options?.equipped || profile.equipped || {};
    const now = performance.now();
    const dodge = Boolean(options?.dodge);
    const alpha = options?.alpha ?? 1;
    const drawFull = (itemId?: string, isRecolor = false) => {
      const item = itemShopPorId(itemId);
      let srcItem = item;
      let img: HTMLImageElement | null = null;
      if (item && isRecolor && !dodge && item.moveFrames?.length && typeof options?.movingFrame === "number") {
        img = imagemShop(item.moveFrames[options.movingFrame % item.moveFrames.length]);
      }
      if (!img) img = assetCosmetico(srcItem, dodge);
      if (!img) return;
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.drawImage(img, -player.w / 2, -player.h / 2, player.w, player.h);
      if (options?.superSpark) {
        // v2.4.4: source-atop colore só pixels opacos do sprite, não o retângulo transparente inteiro.
        ctx.globalCompositeOperation = "source-atop";
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = "#fde047";
        ctx.fillRect(-player.w / 2, -player.h / 2, player.w, player.h);
      }
      ctx.restore();
    };
    const recolor = itemShopPorId(equipped.recolor);
    if (recolor && recolor.id !== "recolor-classic") drawFull(recolor.id, true);
    if (ACCESSORY_SPRITES_ENABLED) {
      drawFull(equipped.middle);
      drawFull(equipped.front);
    }

    const pet = itemShopPorId(equipped.pet);
    if (pet) {
      const superFrames = pet.id === "pet-blue-comet" && performance.now() < petSuperSparkUntilRef.current
        ? ["/game/shop/pets/pet-blue-super-0.png", "/game/shop/pets/pet-blue-super-1.png", "/game/shop/pets/pet-blue-super-2.png", "/game/shop/pets/pet-blue-super-3.png"]
        : null;
      const frames = superFrames || (pet.frames?.length ? pet.frames : [pet.asset]);
      if (now - lastPetFrameAtRef.current > 120) {
        petFrameRef.current = (petFrameRef.current + 1) % frames.length;
        lastPetFrameAtRef.current = now;
      }
      const img = imagemShop(frames[petFrameRef.current] || pet.asset);
      if (img) {
        const bob = Math.sin(now * 0.004) * 5;
        const petSize = Math.max(28, Math.min(46, player.h * 0.38));
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.shadowColor = "rgba(250, 204, 21, .55)";
        ctx.shadowBlur = 10;
        ctx.drawImage(img, -player.w * 0.64, -player.h * 0.48 + bob, petSize, petSize);
        ctx.restore();
      }
    }
  }


  function petEquipadoAtual() {
    return itemShopPorId(localProfileRef.current.equipped?.pet);
  }

  function habilidadePetPronta(key: string, cooldownMs: number) {
    const now = performance.now();
    const nextAt = petSkillReadyAtRef.current[key] || 0;
    if (now < nextAt) return false;
    petSkillReadyAtRef.current[key] = now + cooldownMs;
    return true;
  }

  function mostrarMensagemPet(message: string, color = "#facc15") {
    const now = performance.now();
    if (now < petSkillMessageUntilRef.current) return;
    petSkillMessageUntilRef.current = now + 1200;
    mostrarMensagemWave(message, false);
    criarParticulasHit(playerRef.current.x + playerRef.current.w / 2, playerRef.current.y + playerRef.current.h / 2, color, 8);
  }



  function criarNumeroDano(x: number, y: number, value: number, color = "#fff1a8", crit = false) {
    if (!Number.isFinite(value) || value <= 0) return;
    damageNumbersRef.current.push({
      id: enemyIdRef.current++,
      x,
      y,
      vx: rand(-0.24, 0.24),
      vy: crit ? -1.55 : -1.15,
      value: Math.round(value * 10) / 10,
      color,
      life: crit ? 760 : 620,
      maxLife: crit ? 760 : 620,
      crit,
    });
    const cap = mobileRuntimeRef.current ? 18 : 34;
    if (damageNumbersRef.current.length > cap) damageNumbersRef.current = damageNumbersRef.current.slice(-cap);
  }

  function aplicarDanoBossEspecial(amount: number, color = "#bfdbfe", crit = false) {
    const boss = bossRef.current;
    if (!boss.active || boss.intro || boss.hp <= 0 || boss.defeated) return 0;
    const box = {
      x: boss.x + boss.w * 0.12,
      y: boss.y + boss.h * 0.06,
      w: boss.w * 0.78,
      h: boss.h * 0.88,
    };
    const applied = Math.min(amount, Math.max(0, boss.hp));
    boss.hp = Math.max(0, boss.hp - amount);
    carregarBoostPorDano(applied);
    const x = box.x + box.w * rand(0.18, 0.46);
    const y = box.y + box.h * rand(0.24, 0.72);
    criarNumeroDano(x, y, applied, color, crit);
    criarParticulasHit(x, y, color, mobileRuntimeRef.current ? 3 : 6);
    tocarVozHitChocado();
    if (boss.hp <= 0) boss.hp = 0;
    return applied;
  }

  function aplicarDanoInimigoEspecial(enemy: Enemy, amount: number, color = "#bfdbfe", crit = false) {
    if (!enemy || enemy.hp <= 0) return 0;
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    const applied = Math.min(amount, Math.max(0, enemy.hp));
    enemy.hp -= amount;
    carregarBoostPorDano(applied);
    if (enemy.kind === "asteroid" && enemy.hp <= enemy.maxHp / 2) enemy.cracked = true;
    criarNumeroDano(cx, cy, applied, color, crit);
    criarParticulasHit(cx, cy, color, mobileRuntimeRef.current ? 3 : 6);
    if (enemy.hp <= 0) {
      enemy.hp = 0;
      registrarAbate(enemy.kind);
      tentarSpawnPowerUp(cx, cy);
      if (enemy.kind === "asteroid") spawnAsteroidFragments(enemy);
      else criarExplosao(cx, cy, color, mobileRuntimeRef.current ? 5 : 10);
    }
    return applied;
  }

  function limparInimigosMortosEspecial() {
    enemiesRef.current = enemiesRef.current.filter((enemy) => enemy.hp > 0);
  }

  function spawnTokenPatternPetEspecial(slot: PlayerSlot = 1, amount = 10, color = "#ffd45a") {
    if (gameStateRef.current === "tutorial") return;
    if (onlineTogetherCoordenado() && !souAutoridadeMundoOnlineTogether()) return;
    const center = playerPorSlotOnline(slot) || playerRef.current;
    const baseY = clamp(center.y + center.h / 2 + rand(-72, 72), 88, CONFIG.canvasHeight - 96);
    const startX = CONFIG.canvasWidth + 52;
    const gap = mobileRuntimeRef.current ? 98 : 112;
    const pattern = randomFloat() < 0.68 ? "line" : "zigzag";
    const now = performance.now();
    const spawnedTokens: TokenPickup[] = [];
    const count = Math.max(7, Math.min(amount, mobileRuntimeRef.current ? 11 : 16));
    for (let i = 0; i < count; i++) {
      const y = pattern === "zigzag" ? clamp(baseY + (i % 2 === 0 ? -64 : 64), 84, CONFIG.canvasHeight - 94) : baseY;
      const token: TokenPickup = {
        id: tokenIdRef.current++,
        x: startX + i * gap,
        y: y - 13,
        w: mobileRuntimeRef.current ? 18 : 22,
        h: mobileRuntimeRef.current ? 18 : 22,
        vx: -2.9,
        vy: 0,
        age: 0,
        life: 6600 + i * 90,
        wavePhase: rand(0, Math.PI * 2),
        bornAt: now,
        value: 1,
        frameOffset: i % 4,
        targetSlot: slot,
        magnetDelay: 560 + i * 20,
        burst: false,
        collectScale: 1,
        pattern,
        patternIndex: i,
      };
      tokensRef.current.push(token);
      spawnedTokens.push(token);
    }
    tokensRef.current = tokensRef.current.slice(-(mobileRuntimeRef.current ? 22 : 42));
    if (onlineTogetherCoordenado() && spawnedTokens.length > 0) {
      enviarOnline({ type: "coop_token_spawn", slot, tokens: spawnedTokens.map(tokenSnapshotParaSync), seq: Date.now() });
    }
    criarParticulasHit(center.x + center.w / 2, center.y + center.h / 2, color, mobileRuntimeRef.current ? 3 : 5);
  }

  function dispararTundraEspecial(slot: PlayerSlot, remote = false) {
    const player = playerPorSlotOnline(slot) || playerRef.current;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const targets = enemiesRef.current
      .filter((enemy) => enemy.hp > 0 && enemy.x > -40 && enemy.x < CONFIG.canvasWidth + 110 && enemy.y > -40 && enemy.y < CONFIG.canvasHeight + 70)
      .sort((a, b) => Math.hypot(a.x + a.w / 2 - cx, a.y + a.h / 2 - cy) - Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy))
      .slice(0, mobileRuntimeRef.current ? 8 : 12);
    const hits = [2, 2, 4];
    const bossHits = [15, 15, 30];
    const colors = ["#dbeafe", "#93c5fd", "#67e8f9"];
    targets.forEach((enemy, index) => {
      enemy.vx *= 0.04;
      enemy.vy *= 0.04;
      enemy.shotCooldown = Math.max(enemy.shotCooldown ?? 0, 2300);
      enemy.stretchUntil = performance.now() + 460;
      const ex = enemy.x + enemy.w / 2;
      const ey = enemy.y + enemy.h / 2;
      hits.forEach((damage, hitIndex) => {
        window.setTimeout(() => {
          shockwavesRef.current.push({ id: enemyIdRef.current++, x: ex, y: ey, radius: 42 + hitIndex * 18, life: 120, maxLife: 120 });
          criarParticulasHit(ex, ey, colors[hitIndex] || "#bfdbfe", mobileRuntimeRef.current ? 3 : 6);
          aplicarDanoInimigoEspecial(enemy, damage, colors[hitIndex] || "#bfdbfe", hitIndex === 2);
        }, hitIndex * 135 + index * 16);
      });
    });
    if (bossRef.current.active && bossRef.current.hp > 0 && !bossRef.current.intro) {
      const bx = bossRef.current.x + bossRef.current.w / 2;
      const by = bossRef.current.y + bossRef.current.h / 2;
      bossHits.forEach((damage, hitIndex) => {
        window.setTimeout(() => {
          shockwavesRef.current.push({ id: enemyIdRef.current++, x: bx, y: by, radius: 74 + hitIndex * 26, life: 140, maxLife: 140 });
          criarParticulasHit(bx, by, colors[hitIndex] || "#bfdbfe", mobileRuntimeRef.current ? 4 : 8);
          aplicarDanoBossEspecial(damage, colors[hitIndex] || "#bfdbfe", hitIndex === 2);
        }, hitIndex * 150);
      });
    }
    window.setTimeout(limparInimigosMortosEspecial, 560);
    shockwavesRef.current.push({ id: enemyIdRef.current++, x: cx, y: cy, radius: 150, life: 320, maxLife: 320 });
    criarExplosao(cx, cy, "#bfdbfe", mobileRuntimeRef.current ? 7 : 14);
    tocarSom(CONFIG.sounds.petActivate || CONFIG.sounds.powerUpPickup, remote ? 0.22 : 0.36, "sfx");
    if (!remote) mostrarMensagemPet("TUNDRA: 2 · 2 · 4", "#bfdbfe");
    return true;
  }

  function dispararSaltadorRubroEspecial(slot: PlayerSlot, remote = false) {
    const player = playerPorSlotOnline(slot) || playerRef.current;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const pulses = [0, 140, 300];
    pulses.forEach((delay, pulseIndex) => {
      window.setTimeout(() => {
        const radius = 120 + pulseIndex * 44;
        let hit = 0;
        for (const enemy of enemiesRef.current) {
          const dist = Math.hypot(enemy.x + enemy.w / 2 - cx, enemy.y + enemy.h / 2 - cy);
          if (enemy.hp > 0 && dist < radius && hit < 10) {
            aplicarDanoInimigoEspecial(enemy, pulseIndex === 2 ? 7 : 4, pulseIndex === 2 ? "#fb923c" : "#fdba74", pulseIndex === 2);
            enemy.vx += 0.9 + pulseIndex * 0.35;
            enemy.vy += pulseIndex === 1 ? -0.22 : 0;
            hit += 1;
          }
        }
        if (bossRef.current.active && bossRef.current.hp > 0 && Math.abs((bossRef.current.x + bossRef.current.w / 2) - cx) < 560) {
          aplicarDanoBossEspecial(pulseIndex === 2 ? 16 : 9, "#f97316", pulseIndex === 2);
        }
        shockwavesRef.current.push({ id: enemyIdRef.current++, x: cx, y: cy, radius, life: 150, maxLife: 150 });
        criarParticulasHit(cx, cy - 8, pulseIndex === 2 ? "#f97316" : "#fdba74", mobileRuntimeRef.current ? 3 : 6);
      }, delay);
    });
    limparInimigosMortosEspecial();
    criarExplosao(cx, cy, "#f97316", mobileRuntimeRef.current ? 7 : 14);
    spawnTokenPatternPetEspecial(slot, mobileRuntimeRef.current ? 11 : 15, "#f59e0b");
    tocarSom(CONFIG.sounds.powerUpPickup || CONFIG.sounds.petActivate, remote ? 0.2 : 0.34, "sfx");
    if (!remote) mostrarMensagemPet("SALTADOR RUBRO: 3 QUICADAS", "#f97316");
    return true;
  }

  function dispararViaLacteaEspecial(slot: PlayerSlot, remote = false) {
    const player = playerPorSlotOnline(slot) || playerRef.current;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const pulses = [0, 170, 340];
    pulses.forEach((delay, pulseIndex) => {
      window.setTimeout(() => {
        const radius = 230 + pulseIndex * 34;
        enemyProjectilesRef.current = enemyProjectilesRef.current.filter((bullet) => Math.hypot(bullet.x + bullet.w / 2 - cx, bullet.y + bullet.h / 2 - cy) > radius);
        bossProjectilesRef.current = bossProjectilesRef.current.filter((bullet) => Math.hypot(bullet.x + bullet.w / 2 - cx, bullet.y + bullet.h / 2 - cy) > radius + 24);
        for (const enemy of enemiesRef.current) {
          if (enemy.hp <= 0 || enemy.kind === "fragment") continue;
          const ecx = enemy.x + enemy.w / 2;
          const ecy = enemy.y + enemy.h / 2;
          const dx = ecx - cx;
          const dy = ecy - cy;
          const dist = Math.max(1, Math.hypot(dx, dy));
          if (dist < radius) {
            enemy.vx += (dx / dist) * (2.2 + pulseIndex * 0.55);
            enemy.vy += (dy / dist) * (1.4 + pulseIndex * 0.35);
            aplicarDanoInimigoEspecial(enemy, pulseIndex === 2 ? 4 : 2.2, pulseIndex === 2 ? "#d8b4fe" : "#c084fc", pulseIndex === 2);
          }
        }
        if (bossRef.current.active && bossRef.current.hp > 0) aplicarDanoBossEspecial(pulseIndex === 2 ? 12 : 7, pulseIndex === 2 ? "#d8b4fe" : "#c084fc");
        shockwavesRef.current.push({ id: enemyIdRef.current++, x: cx, y: cy, radius, life: 180, maxLife: 180 });
        criarParticulasHit(cx, cy, pulseIndex === 2 ? "#d8b4fe" : "#c084fc", mobileRuntimeRef.current ? 3 : 7);
      }, delay);
    });
    limparInimigosMortosEspecial();
    spawnTokenPatternPetEspecial(slot, mobileRuntimeRef.current ? 12 : 16, "#c084fc");
    if (!remote) mostrarMensagemPet("VIA LÁCTEA: PORTAL EM PULSOS", "#c084fc");
    return true;
  }

  function dispararCavaleiroVazioEspecial(slot: PlayerSlot, remote = false) {
    const player = playerPorSlotOnline(slot) || playerRef.current;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    for (const enemy of enemiesRef.current) {
      if (enemy.hp <= 0) continue;
      const ex = enemy.x + enemy.w / 2;
      const ey = enemy.y + enemy.h / 2;
      if (ex > cx - 40 && ex < cx + 520 && Math.abs(ey - cy) < 92) aplicarDanoInimigoEspecial(enemy, 7, "#e5e7eb", true);
    }
    enemyProjectilesRef.current = enemyProjectilesRef.current.filter((bullet) => !(bullet.x > cx - 40 && bullet.x < cx + 460 && Math.abs((bullet.y + bullet.h / 2) - cy) < 110));
    if (bossRef.current.active && bossRef.current.hp > 0) aplicarDanoBossEspecial(20, "#e5e7eb", true);
    limparInimigosMortosEspecial();
    criarExplosao(cx + 180, cy, "#e5e7eb", mobileRuntimeRef.current ? 6 : 12);
    if (!remote) mostrarMensagemPet("CAVALEIRO VAZIO: CORTE", "#e5e7eb");
    return true;
  }

  function dispararBoboCaoticoEspecial(slot: PlayerSlot, remote = false) {
    const player = playerPorSlotOnline(slot) || playerRef.current;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    const roll = randomFloat();
    let label = "BOBO CAÓTICO: ROLETA";
    let color = "#f472b6";
    if (roll < 0.28) {
      label = "BOBO CAÓTICO: CARTAS";
      color = "#f472b6";
      const targets = enemiesRef.current.filter((enemy) => enemy.hp > 0).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy)).slice(0, 10);
      targets.forEach((enemy, i) => window.setTimeout(() => aplicarDanoInimigoEspecial(enemy, i % 3 === 2 ? 9 : 5, i % 2 ? "#f472b6" : "#facc15", i % 3 === 2), i * 45));
      if (bossRef.current.active && bossRef.current.hp > 0) aplicarDanoBossEspecial(24, "#f472b6", true);
    } else if (roll < 0.52) {
      label = "BOBO CAÓTICO: PRESENTE";
      color = "#facc15";
      player.hp = Math.min(vidaMaximaLocal(), player.hp + 1);
      if (slot === slotLocalOnline()) setPlayerHp(player.hp);
      else if (slot === slotVisualPlayer2Online()) setPlayer2Hp(player.hp);
      spawnTokenPatternPetEspecial(slot, mobileRuntimeRef.current ? 9 : 13, "#facc15");
      if (randomFloat() < 0.65) spawnPowerUp(randomFloat() < 0.5 ? "fireRate" : "randomBox", Math.min(CONFIG.canvasWidth - 110, cx + 80), clamp(cy - 18, 80, CONFIG.canvasHeight - 92), false);
    } else if (roll < 0.78) {
      label = "BOBO CAÓTICO: CONFUSÃO";
      color = "#a78bfa";
      for (const enemy of enemiesRef.current) {
        if (enemy.hp <= 0) continue;
        const dist = Math.hypot(enemy.x + enemy.w / 2 - cx, enemy.y + enemy.h / 2 - cy);
        if (dist < 290) {
          enemy.vx *= -0.45;
          enemy.vy += rand(-0.6, 0.6);
          enemy.shotCooldown = Math.max(enemy.shotCooldown ?? 0, 1100);
          aplicarDanoInimigoEspecial(enemy, 3.5, "#a78bfa");
        }
      }
      if (bossRef.current.active && bossRef.current.hp > 0) aplicarDanoBossEspecial(14, "#a78bfa");
    } else {
      label = "BOBO CAÓTICO: AZAR";
      color = "#fb7185";
      player.hp = Math.max(1, player.hp - 1);
      if (slot === slotLocalOnline()) setPlayerHp(player.hp);
      else if (slot === slotVisualPlayer2Online()) setPlayer2Hp(player.hp);
      spawnTokenPatternPetEspecial(slot, mobileRuntimeRef.current ? 12 : 16, "#fb7185");
      for (const enemy of enemiesRef.current.slice(0, mobileRuntimeRef.current ? 5 : 8)) {
        aplicarDanoInimigoEspecial(enemy, 6, "#fb7185", true);
      }
      if (bossRef.current.active && bossRef.current.hp > 0) aplicarDanoBossEspecial(18, "#fb7185", true);
    }
    shockwavesRef.current.push({ id: enemyIdRef.current++, x: cx, y: cy, radius: 180, life: 310, maxLife: 310 });
    criarExplosao(cx, cy, color, mobileRuntimeRef.current ? 6 : 10);
    tocarSom(CONFIG.sounds.randomPowerUp || CONFIG.sounds.petActivate || CONFIG.sounds.powerUpPickup, remote ? 0.2 : 0.33, "sfx");
    if (!remote) mostrarMensagemPet(label, color);
    return true;
  }

  function tentarPularWaveComPet(waveNumber: number, bossWave: boolean) {
    if (gameStateRef.current !== "playing") return false;
    if (onlineGameplayActiveRef.current && !souHostOnline()) return false;
    if (currentModeRef.current !== "infinite" && !isLocalWaveMode()) return false;
    if (bossWave || waveNumber < 3) return false;
    const pet = petEquipadoAtual();
    const chance = Number(pet?.buffs?.waveSkipChance || 0);
    if (!pet || pet.id !== "pet-satellite" || chance <= 0) return false;
    if (!habilidadePetPronta("pet-satellite-wave-skip", 98000)) return false;
    if (randomFloat() > chance) return false;
    mostrarMensagemPet("SATÉLITE: ROTA CURTA", "#93c5fd");
    adicionarPontuacao(175);
    window.setTimeout(() => iniciarWaveInfinita(waveNumber + 1), 60);
    return true;
  }

  function puxarInimigosBuracoNegro(delta: number) {
    const now = performance.now();
    if (now > petBlackHolePullUntilRef.current) return;
    const player = playerRef.current;
    const pcx = player.x + player.w / 2;
    const pcy = player.y + player.h / 2;
    const speedFactor = delta / 16.67;
    for (const enemy of enemiesRef.current) {
      if (enemy.hp <= 0 || enemy.kind === "fragment") continue;
      const ecx = enemy.x + enemy.w / 2;
      const ecy = enemy.y + enemy.h / 2;
      const dx = pcx - ecx;
      const dy = pcy - ecy;
      const dist = Math.max(1, Math.hypot(dx, dy));
      if (dist > 520) continue;
      const force = (1 - dist / 520) * 0.055 * speedFactor;
      enemy.vx += (dx / dist) * force;
      enemy.vy += (dy / dist) * force;
      enemy.stretchUntil = Math.max(enemy.stretchUntil ?? 0, now + 70);
    }
  }

  function cooldownHabilidadePetMs(petId: string) {
    if (petId === "pet-satellite") return 100000;
    if (petId === "pet-tundra") return 62000;
    if (petId === "pet-blue-comet") return 68000;
    if (petId === "pet-red-jumper") return 50000;
    if (petId === "pet-chaos-jester") return 62000;
    if (petId === "pet-void-knight") return 58000;
    if (petId === "pet-black-hole") return 56000;
    if (petId === "pet-earth") return 54000;
    if (petId === "pet-milky-way") return 64000;
    return 42000;
  }

  function definirCooldownPet(ms: number) {
    petAbilityCooldownUntilRef.current = performance.now() + ms;
    setPetAbilityCooldownUi(Math.ceil(ms / 1000));
  }


  function playerPorSlotOnline(slot: PlayerSlot): Player | null {
    if (onlineTogetherCoordenado()) {
      if (slot === slotLocalOnline()) return playerRef.current;
      if (slot === slotVisualPlayer2Online()) return player2Ref.current;
      return playersRef.current.find((runtime) => runtime.slot === slot)?.runtime ?? null;
    }
    if (slot === 1) return playerRef.current;
    if (slot === 2) return player2Ref.current;
    return playersRef.current.find((runtime) => runtime.slot === slot)?.runtime ?? null;
  }

  function aplicarPowerUpRuntimeExtraSincronizado(runtime: PlayerRuntime, kind: PowerUpKind) {
    const now = performance.now();
    const player = runtime.runtime;
    if (!player || player.hp <= 0) return;

    if (kind === "randomBox") {
      const options: PowerUpKind[] = ["regen", "fireRate", "shield", "powerShot", "homingShot", "flames"];
      aplicarPowerUpRuntimeExtraSincronizado(runtime, options[Math.floor(randomFloat() * options.length)]);
      return;
    }

    if (kind === "regen" || kind === "tripleRegen") {
      const amount = kind === "tripleRegen" ? (isLocalPvpMode() ? 18 : 2) : (isLocalPvpMode() ? 8 : 1);
      player.hp = Math.min(vidaMaximaLocal(), player.hp + amount);
      runtime.hp = player.hp;
    } else if (kind === "goldenHeart") {
      if (isLocalPvpMode()) {
        player.hp = Math.min(vidaMaximaLocal(), player.hp + 18);
        runtime.hp = player.hp;
      } else {
        player.goldenHp = Math.min(CONFIG.gameplay.powerups.goldenHeartMax, player.goldenHp + 1);
        runtime.goldenLives = player.goldenHp;
      }
    } else if (kind === "shield") {
      runtime.powerups.shieldUntil = now + 7200;
      runtime.shieldUntil = runtime.powerups.shieldUntil;
      player.invincibleUntil = Math.max(player.invincibleUntil, now + (isLocalPvpMode() ? 900 : 7200));
    } else if (kind === "fireRate") {
      runtime.powerups.fireRateUntil = now + CONFIG.gameplay.powerups.fireRateDurationMs;
      player.normalCooldown = 0;
    } else if (kind === "powerShot") {
      runtime.powerups.powerShotUntil = now + CONFIG.gameplay.powerups.powerShotDurationMs;
      player.strongReadyAt = 0;
    } else if (kind === "homingShot") {
      runtime.powerups.homingUntil = now + CONFIG.gameplay.powerups.homingShotDurationMs;
      player.strongReadyAt = 0;
    } else if (kind === "flames") {
      runtime.powerups.flamesUntil = now + CONFIG.gameplay.powerups.flamesDurationMs;
      runtime.powerups.fireRateUntil = Math.max(runtime.powerups.fireRateUntil ?? 0, now + Math.max(2800, CONFIG.gameplay.powerups.fireRateDurationMs * 0.55));
      player.strongReadyAt = 0;
    }

    runtime.x = player.x;
    runtime.y = player.y;
    runtime.vx = player.vx;
    runtime.vy = player.vy;
    runtime.alive = player.hp > 0;

    criarExplosao(player.x + player.w / 2, player.y + player.h / 2, powerUpColor(kind), 14);
    tocarSom(CONFIG.sounds.powerUpPickup || CONFIG.sounds.abilityReady, 0.35, "ability");
  }

  function aplicarPowerUpPlayer2Sincronizado(kind: PowerUpKind) {
    const player = player2Ref.current;
    if (!player || player.hp <= 0) return;

    const now = performance.now();
    const glowColor = powerUpColor(kind);

    tocarSom(CONFIG.sounds.powerUpPickup || CONFIG.sounds.abilityReady, 0.45, "ability");
    criarParticulasHit(player.x + player.w / 2, player.y + player.h / 2, glowColor, 12);

    if (kind === "regen") {
      player.hp = Math.min(vidaMaximaLocal(), player.hp + (isLocalPvpMode() ? 12 : 1));
    } else if (kind === "tripleRegen") {
      player.hp = Math.min(vidaMaximaLocal(), player.hp + (isLocalPvpMode() ? 22 : 3));
    } else if (kind === "goldenHeart") {
      if (isLocalPvpMode()) {
        player.hp = Math.min(vidaMaximaLocal(), player.hp + 18);
      } else {
        player.goldenHp = Math.min(CONFIG.gameplay.powerups.goldenHeartMax, player.goldenHp + 1);
        setPlayer2GoldenHp(player.goldenHp);
        player.invincibleUntil = Math.max(player.invincibleUntil, now + 900);
      }
    } else if (kind === "shield") {
      player2ShieldUntilRef.current = now + 7200;
      if (!isLocalPvpMode()) player.invincibleUntil = Math.max(player.invincibleUntil, now + 7200);
    } else if (kind === "fireRate") {
      player.normalCooldown = 0;
      player2FireRateUntilRef.current = now + CONFIG.gameplay.powerups.fireRateDurationMs;
    } else if (kind === "powerShot") {
      player2PowerShotUntilRef.current = now + CONFIG.gameplay.powerups.powerShotDurationMs;
      player.strongReadyAt = 0;
      player2BoostReadyAtRef.current = Math.min(player2BoostReadyAtRef.current, now + 700);
    } else if (kind === "homingShot") {
      player2HomingShotUntilRef.current = now + CONFIG.gameplay.powerups.homingShotDurationMs;
      player.strongReadyAt = 0;
    } else if (kind === "flames") {
      player2FlamesUntilRef.current = now + Math.max(5200, CONFIG.gameplay.powerups.fireRateDurationMs * 0.78);
      player2FireRateUntilRef.current = now + Math.max(2800, CONFIG.gameplay.powerups.fireRateDurationMs * 0.55);
      player.strongReadyAt = 0;
    } else if (kind === "randomBox") {
      const options: PowerUpKind[] = ["regen", "fireRate", "shield", "powerShot", "homingShot", "flames"];
      aplicarPowerUpPlayer2Sincronizado(options[Math.floor(randomFloat() * options.length)]);
      return;
    }

    setPlayer2Hp(player.hp);
    criarExplosao(player.x + player.w / 2, player.y + player.h / 2, glowColor, 10);
  }

  function aplicarPowerUpPorSlotSincronizado(slot: PlayerSlot, kind: PowerUpKind, powerId?: number) {
    if (typeof powerId === "number") {
      const before = powerUpsRef.current.length;
      powerUpsRef.current = powerUpsRef.current.filter((power) => power.id !== powerId);
      pararLoopPowerUpTrail(powerId);
      // Se o id divergir por uma diferença antiga de RNG, remove o primeiro power-up do mesmo tipo.
      // Isso evita duplicar power-ups na tela remota sem depender de ids perfeitamente iguais.
      if (before === powerUpsRef.current.length) {
        let removed = false;
        powerUpsRef.current = powerUpsRef.current.filter((power) => {
          if (!removed && power.kind === kind) { removed = true; pararLoopPowerUpTrail(power.id); return false; }
          return true;
        });
      }
    }
    if (slot === slotLocalOnline()) {
      aplicarPowerUp(kind);
      return;
    }
    if (slot === slotVisualPlayer2Online()) {
      aplicarPowerUpPlayer2Sincronizado(kind);
      return;
    }
    const runtime = playersRef.current.find((item) => item.slot === slot);
    if (runtime) aplicarPowerUpRuntimeExtraSincronizado(runtime, kind);
  }


  function powerUpSnapshotParaSync(power: PowerUp) {
    return {
      id: power.id,
      kind: power.kind,
      x: power.x,
      y: power.y,
      w: power.w,
      h: power.h,
      vx: power.vx,
      vy: power.vy,
      age: power.age,
      life: power.life,
      wavePhase: power.wavePhase,
      blockedPlayer: power.blockedPlayer,
      blockedUntil: power.blockedUntil,
    };
  }

  function tokenSnapshotParaSync(token: TokenPickup) {
    return {
      id: token.id,
      x: token.x,
      y: token.y,
      w: token.w,
      h: token.h,
      vx: token.vx,
      vy: token.vy,
      age: token.age,
      life: token.life,
      wavePhase: token.wavePhase,
      value: token.value,
      frameOffset: token.frameOffset,
      targetSlot: token.targetSlot,
      magnetDelay: token.magnetDelay,
      burst: token.burst,
      collectScale: token.collectScale,
      pattern: token.pattern,
      patternIndex: token.patternIndex,
    };
  }

  function enemySnapshotParaSync(enemy: Enemy) {
    return { ...enemy };
  }

  function adicionarInimigosRemotosSincronizados(rawEnemies: Partial<Enemy>[] | null | undefined) {
    if (!Array.isArray(rawEnemies) || rawEnemies.length === 0) return;
    const currentById = new Map(enemiesRef.current.map((enemy) => [enemy.id, enemy] as [number, Enemy]));
    let added = 0;
    for (const raw of rawEnemies.slice(0, 16)) {
      const id = Math.floor(Number(raw.id ?? 0));
      if (!Number.isFinite(id) || id <= 0 || currentById.has(id)) continue;
      const kind = String(raw.kind || "purple") as EnemyKind;
      const enemy = {
        ...raw,
        id,
        kind,
        x: Number(raw.x ?? CONFIG.canvasWidth + 120),
        y: clamp(Number(raw.y ?? CONFIG.canvasHeight / 2), -180, CONFIG.canvasHeight + 180),
        w: Math.max(20, Number(raw.w ?? 90)),
        h: Math.max(20, Number(raw.h ?? 70)),
        vx: Number(raw.vx ?? -2.4),
        vy: Number(raw.vy ?? 0),
        hp: Math.max(1, Number(raw.hp ?? 1)),
        maxHp: Math.max(1, Number(raw.maxHp ?? raw.hp ?? 1)),
        age: Math.max(0, Number(raw.age ?? 0)),
        stretchUntil: Number(raw.stretchUntil ?? 0),
        shotCooldown: Number(raw.shotCooldown ?? 1200),
        waveBaseY: Number(raw.waveBaseY ?? raw.y ?? CONFIG.canvasHeight / 2),
        windUpMs: Number(raw.windUpMs ?? 0),
        isDashing: Boolean(raw.isDashing),
      } as Enemy;
      enemiesRef.current.push(enemy);
      enemyIdRef.current = Math.max(enemyIdRef.current, id + 1);
      added += 1;
    }
    if (added > 0) enemiesRef.current = enemiesRef.current.slice(-(mobileRuntimeRef.current ? 34 : 52));
  }

  function criarSnapshotMundoCoop() {
    return {
      tick: ++onlineSnapshotSeqRef.current,
      t: Date.now(),
      netModel: "dual-sim-world-resync-v249",
      state: gameStateRef.current,
      mode: currentModeRef.current,
      wave: { ...waveStateRef.current, queue: waveStateRef.current.queue.slice(0, 24) },
      score: scoreRef.current,
      enemies: enemiesRef.current.slice(-44).map(enemySnapshotParaSync),
      enemyProjectiles: enemyProjectilesRef.current.slice(-28),
      bossProjectiles: bossProjectilesRef.current.slice(-18),
      powerUps: powerUpsRef.current.slice(-8).map(powerUpSnapshotParaSync),
      tokens: tokensRef.current.slice(-34).map(tokenSnapshotParaSync),
      boss: { ...bossRef.current },
      events: onlineVisualEventLogRef.current.slice(-24),
    };
  }

  function aplicarResyncMundoCoop(raw: Partial<OnlineGameplaySnapshot> | null | undefined) {
    if (!onlineTogetherCoordenado() || !raw || souAutoridadeMundoOnlineTogether()) return;
    const projectedPvp = false;
    const localNow = performance.now();
    if (raw.wave) {
      waveStateRef.current = { ...waveStateRef.current, ...raw.wave } as WaveState;
      setWaveUi((current) => ({
        ...current,
        mode: (raw.wave?.mode ?? waveStateRef.current.mode) as GameMode | null,
        wave: Number(raw.wave?.wave ?? waveStateRef.current.wave ?? 0),
        active: Boolean(raw.wave?.active ?? waveStateRef.current.active),
        bossWave: Boolean(raw.wave?.bossWave ?? waveStateRef.current.bossWave),
        message: String(raw.wave?.message ?? waveStateRef.current.message ?? current.message ?? ""),
      }));
    }
    if (Array.isArray(raw.enemies)) {
      const incoming = raw.enemies as Enemy[];
      const currentIds = enemiesRef.current.map((enemy) => enemy.id).join(",");
      const incomingIds = incoming.map((enemy) => enemy.id).join(",");
      enemiesRef.current = currentIds === incomingIds
        ? mesclarObjetosSnapshotOnline(enemiesRef.current, incoming, projectedPvp, 0.88, 220)
        : incoming.map((enemy) => ({ ...enemy }));
      for (const enemy of enemiesRef.current) enemyIdRef.current = Math.max(enemyIdRef.current, Number(enemy.id || 0) + 1);
    }
    if (Array.isArray(raw.enemyProjectiles)) enemyProjectilesRef.current = mesclarObjetosSnapshotOnline(enemyProjectilesRef.current, raw.enemyProjectiles as EnemyProjectile[], projectedPvp, 0.9, 180);
    if (Array.isArray(raw.bossProjectiles)) bossProjectilesRef.current = mesclarObjetosSnapshotOnline(bossProjectilesRef.current, raw.bossProjectiles as BossProjectile[], projectedPvp, 0.9, 180);
    if (Array.isArray(raw.powerUps)) powerUpsRef.current = normalizarPowerUpsSnapshotOnline(raw.powerUps as PowerUp[], projectedPvp, localNow);
    if (Array.isArray(raw.tokens)) tokensRef.current = mesclarObjetosSnapshotOnline(tokensRef.current, raw.tokens as TokenPickup[], projectedPvp, 0.9, 180) as TokenPickup[];
    if (raw.boss) bossRef.current = { ...bossRef.current, ...raw.boss };
    if (typeof raw.score === "number") { scoreRef.current = raw.score; setScore(raw.score); }
    if (raw.state === "gameOver" || raw.state === "gameOverCutscene") setEstado(raw.state);
  }

  function adicionarPowerUpRemotoSincronizado(raw: Partial<PowerUp> | null | undefined) {
    if (!raw || !raw.kind) return;
    const kind = String(raw.kind) as PowerUpKind;
    const x = Number(raw.x ?? 0);
    const y = Number(raw.y ?? 0);
    const same = powerUpsRef.current.some((power) => (
      power.id === Number(raw.id) ||
      (power.kind === kind && Math.abs(power.x - x) < 36 && Math.abs(power.y - y) < 36)
    ));
    if (same) return;
    const cfg = CONFIG.gameplay.powerups;
    const id = Number.isFinite(Number(raw.id)) ? Number(raw.id) : powerUpIdRef.current++;
    powerUpIdRef.current = Math.max(powerUpIdRef.current, id + 1);
    const power: PowerUp = {
      id,
      kind,
      x: clamp(x, -160, CONFIG.canvasWidth + 160),
      y: clamp(y, -140, CONFIG.canvasHeight + 140),
      w: Number(raw.w ?? cfg.width),
      h: Number(raw.h ?? cfg.height),
      vx: Number(raw.vx ?? -cfg.speed),
      vy: Number(raw.vy ?? 0),
      age: Number(raw.age ?? 0),
      life: Number(raw.life ?? cfg.lifeMs),
      wavePhase: Number(raw.wavePhase ?? 0),
      bornAt: performance.now(),
      blockedPlayer: raw.blockedPlayer as PlayerSlot | undefined,
      blockedUntil: typeof raw.blockedUntil === "number" ? raw.blockedUntil : undefined,
    };
    powerUpsRef.current.push(power);
    powerUpsRef.current = powerUpsRef.current.slice(-10);
    tocarLoopPowerUpTrail(power.id);
  }

  function adicionarTokensRemotosSincronizados(rawTokens: Partial<TokenPickup>[] | null | undefined) {
    if (!Array.isArray(rawTokens) || rawTokens.length === 0) return;
    const next = [...tokensRef.current];
    let added = 0;
    for (const raw of rawTokens.slice(0, 20)) {
      const x = Number(raw.x ?? 0);
      const y = Number(raw.y ?? 0);
      const id = Number.isFinite(Number(raw.id)) ? Number(raw.id) : tokenIdRef.current++;
      const duplicate = next.some((token) => (
        token.id === id ||
        (Math.abs(token.x - x) < 22 && Math.abs(token.y - y) < 22 && token.pattern === raw.pattern && token.patternIndex === raw.patternIndex)
      ));
      if (duplicate) continue;
      tokenIdRef.current = Math.max(tokenIdRef.current, id + 1);
      next.push({
        id,
        x: clamp(x, -120, CONFIG.canvasWidth + 220),
        y: clamp(y, -120, CONFIG.canvasHeight + 120),
        w: Number(raw.w ?? 23),
        h: Number(raw.h ?? 23),
        vx: Number(raw.vx ?? -1.25),
        vy: Number(raw.vy ?? 0),
        age: Number(raw.age ?? 0),
        life: Number(raw.life ?? 3200),
        wavePhase: Number(raw.wavePhase ?? 0),
        bornAt: performance.now(),
        value: Math.max(1, Math.min(9, Number(raw.value ?? 1))),
        frameOffset: Math.max(0, Math.floor(Number(raw.frameOffset ?? 0))) % 4,
        targetSlot: raw.targetSlot as PlayerSlot | undefined,
        magnetDelay: typeof raw.magnetDelay === "number" ? raw.magnetDelay : undefined,
        burst: Boolean(raw.burst),
        collectScale: typeof raw.collectScale === "number" ? raw.collectScale : 1,
        pattern: raw.pattern as TokenPickup["pattern"],
        patternIndex: typeof raw.patternIndex === "number" ? raw.patternIndex : undefined,
      });
      added += 1;
    }
    if (added > 0) {
      tokensRef.current = next.slice(-(mobileRuntimeRef.current ? 20 : 38));
      if (performance.now() - tokenUiPulseUntilRef.current > 120) tocarSom(CONFIG.sounds.tokenBurst || CONFIG.sounds.powerUpSpawn, 0.1, "sfx");
    }
  }

  function removerTokensCoopSincronizados(tokenIds: number[] | undefined, amount = 0) {
    const ids = new Set((tokenIds || []).map((id) => Math.floor(Number(id))).filter((id) => Number.isFinite(id) && id > 0));
    const before = tokensRef.current.length;
    if (ids.size > 0) {
      tokensRef.current = tokensRef.current.filter((token) => !ids.has(token.id));
    }
    let removed = before - tokensRef.current.length;
    if (removed === 0 && amount > 0 && tokensRef.current.length > 0) {
      const count = Math.min(tokensRef.current.length, Math.max(1, Math.min(12, Math.floor(amount))));
      tokensRef.current = tokensRef.current.slice(count);
      removed = count;
    }
    if (removed > 0 && performance.now() - tokenUiPulseUntilRef.current > 120) {
      tokenUiPulseUntilRef.current = performance.now() + 180;
      tocarSom(CONFIG.sounds.powerUpPickup || CONFIG.sounds.menuConfirm, 0.16, "sfx");
    }
  }

  function aplicarHabilidadePetCoopSincronizada(slot: PlayerSlot, petId: string, remote = false) {
    if (!petId || petId === "pet-none") return false;
    const player = playerPorSlotOnline(slot);
    if (!player || player.hp <= 0) return false;
    const now = performance.now();
    const key = `coop-pet-${slot}-${petId}`;
    const cooldownMs = cooldownHabilidadePetMs(petId);
    if (!remote) {
      if (now < petAbilityCooldownUntilRef.current) {
        mostrarMensagemPet(`PET: ${Math.ceil((petAbilityCooldownUntilRef.current - now) / 1000)}s`, "#fbbf24");
        return false;
      }
      definirCooldownPet(cooldownMs);
      desbloquearConquistaPerfil("pet-power");
    } else {
      const readyAt = petSkillReadyAtRef.current[key] || 0;
      if (now < readyAt) return false;
      petSkillReadyAtRef.current[key] = now + Math.max(1000, cooldownMs * 0.75);
    }
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    tocarSom(petId === "pet-blue-comet" ? (CONFIG.sounds.petSuperSpark || CONFIG.sounds.petActivate) : (CONFIG.sounds.petActivate || CONFIG.sounds.powerUpPickup), remote ? 0.22 : 0.34, "sfx");

    if (petId === "pet-blue-comet") {
      player.invincibleUntil = Math.max(player.invincibleUntil, now + 15000);
      player.stretchUntil = now + 420;
      player.stretchVx = 4.2;
      player.stretchVy = -1.2;
      if (slot === slotLocalOnline()) petSuperSparkUntilRef.current = now + 15000;
      shockwavesRef.current.push({ id: enemyIdRef.current++, x: cx, y: cy, radius: 120, life: 240, maxLife: 240 });
      if (!remote) mostrarMensagemPet("SUPER FAÍSCA: 15s · +15%", "#fde047");
      return true;
    }

    if (petId === "pet-tundra") return dispararTundraEspecial(slot, remote);

    if (petId === "pet-red-jumper") return dispararSaltadorRubroEspecial(slot, remote);

    if (petId === "pet-black-hole") {
      for (const enemy of enemiesRef.current) {
        if (enemy.hp <= 0 || enemy.kind === "fragment") continue;
        const ecx = enemy.x + enemy.w / 2;
        const ecy = enemy.y + enemy.h / 2;
        const dx = cx - ecx;
        const dy = cy - ecy;
        const dist = Math.max(1, Math.hypot(dx, dy));
        if (dist > 520) continue;
        const force = (1 - dist / 520) * 2.6;
        enemy.vx += (dx / dist) * force;
        enemy.vy += (dy / dist) * force;
        enemy.stretchUntil = Math.max(enemy.stretchUntil ?? 0, now + 140);
      }
      criarExplosao(cx, cy, "#7c3aed", mobileRuntimeRef.current ? 6 : 10);
      if (!remote) mostrarMensagemPet("BURACO NEGRO: PUXÃO", "#a78bfa");
      return true;
    }

    if (petId === "pet-satellite") {
      player.strongReadyAt = Math.max(now, player.strongReadyAt - 1300);
      if (!remote) mostrarMensagemPet("SATÉLITE: RECARGA", "#93c5fd");
      return true;
    }

    if (petId === "pet-milky-way") return dispararViaLacteaEspecial(slot, remote);

    if (petId === "pet-earth") {
      if (enemiesRef.current.length < 18) spawnEnemy("red");
      player.hp = Math.min(vidaMaximaLocal(), player.hp + 1);
      if (slot === slotLocalOnline()) setPlayerHp(player.hp);
      else if (slot === slotVisualPlayer2Online()) setPlayer2Hp(player.hp);
      if (!remote) mostrarMensagemPet("TERRA: REFORÇO", "#86efac");
      return true;
    }

    if (petId === "pet-chaos-jester") return dispararBoboCaoticoEspecial(slot, remote);
    if (petId === "pet-void-knight") return dispararCavaleiroVazioEspecial(slot, remote);

    if (petId === "pet-sun") {
      if (slot === slotLocalOnline()) flamesUntilRef.current = Math.max(flamesUntilRef.current, now + 3000);
      else if (slot === slotVisualPlayer2Online()) player2FlamesUntilRef.current = Math.max(player2FlamesUntilRef.current, now + 3000);
      if (!remote) mostrarMensagemPet("SOL: CHAMA ATIVA", "#fb923c");
      return true;
    }

    if (petId === "pet-moon") {
      if (slot === slotLocalOnline()) homingShotUntilRef.current = Math.max(homingShotUntilRef.current, now + (player.hp <= 1 ? 5200 : 3200));
      else if (slot === slotVisualPlayer2Online()) player2HomingShotUntilRef.current = Math.max(player2HomingShotUntilRef.current, now + (player.hp <= 1 ? 5200 : 3200));
      if (!remote) mostrarMensagemPet("LUA: TIROS GUIADOS", "#ddd6fe");
      return true;
    }

    if (petId === "pet-comet") {
      let cleared = 0;
      enemyProjectilesRef.current = enemyProjectilesRef.current.filter((bullet) => {
        if (cleared >= 3) return true;
        const dist = Math.hypot(bullet.x + bullet.w / 2 - cx, bullet.y + bullet.h / 2 - cy);
        if (dist < 175) { cleared += 1; return false; }
        return true;
      });
      if (!remote) mostrarMensagemPet("COMETA: LIMPEZA", "#67e8f9");
      return true;
    }

    player.strongReadyAt = Math.max(now, player.strongReadyAt - 800);
    criarParticulasHit(cx, cy, "#facc15", 8);
    if (!remote) mostrarMensagemPet("PET ATIVO", "#facc15");
    return true;
  }

  function ativarHabilidadePetManual() {
    if (gameStateRef.current !== "playing") return;
    if (onlineGameplayActiveRef.current && onlineServerAuthoritativeRef.current) {
      const pet = petEquipadoAtual();
      if (!pet) return;
      const now = performance.now();
      if (now < petAbilityCooldownUntilRef.current) {
        mostrarMensagemPet(`PET: ${Math.ceil((petAbilityCooldownUntilRef.current - now) / 1000)}s`, "#fbbf24");
        return;
      }
      mobilePetPressedRef.current = true;
      enviarInputOnlineAtual(true);
      window.setTimeout(() => { mobilePetPressedRef.current = false; enviarInputOnlineAtual(true); }, 180);
      mostrarMensagemPet("PET: ENVIADO", "#93c5fd");
      desbloquearConquistaPerfil("pet-power");
      return;
    }
    // v2.4.3: Together online não tem host de gameplay. A habilidade do pet roda localmente
    // na mesma engine do coop local; só o Versus autoritativo envia input ao Worker.
    const pet = petEquipadoAtual();
    if (!pet) return;
    const now = performance.now();
    if (now < petAbilityCooldownUntilRef.current) {
      mostrarMensagemPet(`PET: ${Math.ceil((petAbilityCooldownUntilRef.current - now) / 1000)}s`, "#fbbf24");
      return;
    }
    if (onlineTogetherCoordenado()) {
      const used = aplicarHabilidadePetCoopSincronizada(slotLocalOnline(), pet.id, false);
      if (used) enviarOnline({ type: "coop_pet_ability", slot: slotLocalOnline(), pet: pet.id, seq: Date.now() });
      return;
    }

    const player = playerRef.current;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    definirCooldownPet(cooldownHabilidadePetMs(pet.id));
    desbloquearConquistaPerfil("pet-power");
    tocarSom(CONFIG.sounds.petActivate || CONFIG.sounds.powerUpPickup, 0.28, "sfx");

    if (pet.id === "pet-blue-comet") {
      petSuperSparkUntilRef.current = now + 15000;
      player.invincibleUntil = Math.max(player.invincibleUntil, now + 15000);
      player.stretchUntil = now + 420;
      player.stretchVx = 4.2;
      player.stretchVy = -1.2;
      tocarSom(CONFIG.sounds.petSuperSpark || CONFIG.sounds.abilityReady, 0.45, "sfx");
      mostrarMensagemPet("SUPER FAÍSCA: 15s · +15%", "#fde047");
      shockwavesRef.current.push({ id: enemyIdRef.current++, x: cx, y: cy, radius: 120, life: 240, maxLife: 240 });
      return;
    }

    if (pet.id === "pet-red-jumper") {
      dispararSaltadorRubroEspecial(slotLocalOnline(), false);
      return;
    }

    if (pet.id === "pet-satellite") {
      const wave = waveStateRef.current.wave || 1;
      if ((currentModeRef.current === "infinite" || isLocalWaveMode()) && waveStateRef.current.active && !waveStateRef.current.bossWave && wave >= 3) {
        adicionarPontuacao(150);
        mostrarMensagemPet("SATÉLITE: ATALHO DE WAVE", "#93c5fd");
        window.setTimeout(() => iniciarWaveInfinita(wave + 1), 80);
      } else {
        player.strongReadyAt = Math.max(now, player.strongReadyAt - 1100);
        mostrarMensagemPet("SATÉLITE: RECARGA", "#93c5fd");
      }
      return;
    }

    if (pet.id === "pet-tundra") {
      dispararTundraEspecial(slotLocalOnline(), false);
      return;
    }

    if (pet.id === "pet-black-hole") {
      petBlackHolePullUntilRef.current = now + 2300;
      criarExplosao(cx, cy, "#7c3aed", mobileRuntimeRef.current ? 6 : 10);
      mostrarMensagemPet("BURACO NEGRO: PUXÃO", "#a78bfa");
      return;
    }

    if (pet.id === "pet-milky-way") {
      dispararViaLacteaEspecial(slotLocalOnline(), false);
      return;
    }

    if (pet.id === "pet-earth") {
      if (enemiesRef.current.length < 18) spawnEnemy("red");
      player.hp = Math.min(vidaMaximaLocal(), player.hp + 1);
      setPlayerHp(player.hp);
      mostrarMensagemPet("TERRA: REFORÇO", "#86efac");
      return;
    }

    if (pet.id === "pet-chaos-jester") {
      dispararBoboCaoticoEspecial(slotLocalOnline(), false);
      return;
    }

    if (pet.id === "pet-void-knight") {
      dispararCavaleiroVazioEspecial(slotLocalOnline(), false);
      return;
    }

    if (pet.id === "pet-sun") {
      flamesUntilRef.current = Math.max(flamesUntilRef.current, now + 3000);
      mostrarMensagemPet("SOL: CHAMA ATIVA", "#fb923c");
      return;
    }

    if (pet.id === "pet-moon") {
      homingShotUntilRef.current = Math.max(homingShotUntilRef.current, now + (player.hp <= 1 ? 5200 : 3200));
      mostrarMensagemPet("LUA: TIROS GUIADOS", "#ddd6fe");
      return;
    }

    if (pet.id === "pet-comet") {
      let cleared = 0;
      enemyProjectilesRef.current = enemyProjectilesRef.current.filter((bullet) => {
        if (cleared >= 3) return true;
        const dist = Math.hypot(bullet.x + bullet.w / 2 - cx, bullet.y + bullet.h / 2 - cy);
        if (dist < 175) { cleared += 1; return false; }
        return true;
      });
      criarParticulasHit(cx, cy, "#fbbf24", 9);
      mostrarMensagemPet("COMETA: RASTRO DEFENSIVO", "#fbbf24");
      return;
    }

    if (pet.id === "pet-white-hole") {
      for (const bullet of enemyProjectilesRef.current) {
        const bx = bullet.x + bullet.w / 2;
        const by = bullet.y + bullet.h / 2;
        const dx = bx - cx;
        const dy = by - cy;
        const dist = Math.max(1, Math.hypot(dx, dy));
        if (dist < 190) {
          bullet.vx += (dx / dist) * 2.2;
          bullet.vy += (dy / dist) * 2.2;
        }
      }
      shockwavesRef.current.push({ id: enemyIdRef.current++, x: cx, y: cy, radius: 96, life: 190, maxLife: 190 });
      mostrarMensagemPet("BURACO BRANCO: REPULSO", "#f8fafc");
      return;
    }

    if (pet.id === "pet-wormhole") {
      player.strongReadyAt = Math.max(now, player.strongReadyAt - 2100);
      player.vx += 0.55;
      mostrarMensagemPet("MINHOCA: DOBRA", "#c084fc");
      return;
    }

    if (pet.id === "pet-alien") {
      player.strongReadyAt = Math.max(now, player.strongReadyAt - 1600);
      boostChargeRef.current = Math.min(CONFIG.gameplay.boost.maxCharge, boostChargeRef.current + 18);
      mostrarMensagemPet("ALIENÍGENA: RECARGA", "#67e8f9");
      return;
    }

    player.vx += 0.35;
    player.strongReadyAt = Math.max(now, player.strongReadyAt - 750);
    mostrarMensagemPet("PET: AJUDA RÁPIDA", "#fde68a");
  }

  function executarHabilidadesPetAvancadas(delta: number, canvas: HTMLCanvasElement) {
    if (gameStateRef.current !== "playing") return;
    if (isLocalPvpMode()) return;
    if (onlineGameplayActiveRef.current && onlineServerAuthoritativeRef.current && !souHostOnline()) return;
    const now = performance.now();
    if (petSuperSparkUntilRef.current > now) {
      const player = playerRef.current;
      if (randomFloat() < 0.38) criarParticulasHit(player.x + rand(0, player.w), player.y + rand(0, player.h), "#fde047", mobileRuntimeRef.current ? 1 : 2);
      player.invincibleUntil = Math.max(player.invincibleUntil, now + 120);
    }
    puxarInimigosBuracoNegro(delta);
    setPetAbilityCooldownUi(Math.max(0, Math.ceil((petAbilityCooldownUntilRef.current - now) / 1000)));
  }

  function mostrarTokensPorTempo(ms = 1050) {
    const until = performance.now() + ms;
    tokensVisibleUntilRef.current = until;
    setTokensVisibleUntil(until);
  }

  function adicionarTokensPerfil(amount: number, reason = "coleta") {
    const safeAmount = Math.max(0, Math.floor(amount));
    if (safeAmount <= 0) return;
    const equippedBuffs = buffsCosmeticosEquipados();
    const finalAmount = Math.max(1, Math.floor(safeAmount * (1 + equippedBuffs.tokenBonus)));
    const current = localProfileRef.current;
    const now = Date.now();
    const nextTokens = Math.max(0, Math.floor(current.tokens + finalAmount));
    const nextStats = {
      ...criarStatsPerfilPadrao(),
      ...current.stats,
      tokensCollected: Math.max(0, Math.floor((current.stats?.tokensCollected ?? 0) + finalAmount)),
    };
    let achievements = normalizarConquistasPerfil(current.achievements);
    function unlockTokenAchievement(id: string) {
      const achievementIndex = achievements.findIndex((item) => item.id === id && !item.unlockedAt);
      if (achievementIndex < 0) return;
      const unlockedNow: LocalAchievement = { ...achievements[achievementIndex], unlockedAt: now };
      achievements = achievements.map((item, index) => index === achievementIndex ? unlockedNow : item);
      mostrarPopupConquista(unlockedNow);
    }
    if (nextTokens > 0 || nextStats.tokensCollected > 0) unlockTokenAchievement("first-token");
    if (nextTokens >= 10 || nextStats.tokensCollected >= 10) unlockTokenAchievement("ten-tokens");
    if (nextTokens >= 100 || nextStats.tokensCollected >= 100) unlockTokenAchievement("hundred-tokens");
    salvarPerfilLocal({
      ...current,
      tokens: nextTokens,
      stats: nextStats,
      achievements,
      updatedAt: now,
    });
    tokenUiPulseUntilRef.current = performance.now() + 360;
    mostrarTokensPorTempo(reason === "bonus" ? 1800 : 1200);
    tocarSom(CONFIG.sounds.tokenCollect || CONFIG.sounds.powerUpPickup, 0.28, "sfx");
  }

  function mostrarEventoOnline(title: string, message: string, kind: OnlineEventOverlayState["kind"] = "info", ms = 2600, countdownMs?: number) {
    const now = performance.now();
    const overlay: OnlineEventOverlayState = {
      id: ++onlineEventOverlayIdRef.current,
      title,
      message,
      kind,
      until: now + ms,
      countdownUntil: countdownMs ? now + countdownMs : undefined,
    };
    setOnlineEventOverlay(overlay);
    window.setTimeout(() => {
      setOnlineEventOverlay((current) => current?.id === overlay.id ? null : current);
    }, ms + 80);
  }

  function salvarAmigosDaSalaOnline() {
    const current = localProfileRef.current;
    const existing = new Set([...current.friends.map((friend) => friend.id), ...current.friendRequests.map((request) => request.code)]);
    const nextRequests = [...current.friendRequests];
    for (const player of onlinePlayers) {
      if (!player.id || player.slot === onlineSlotRef.current || existing.has(player.id)) continue;
      nextRequests.push({ id: criarIdPerfilLocal(), code: player.id, name: player.name || `P${player.slot}`, direction: "sent", createdAt: Date.now() });
      existing.add(player.id);
    }
    salvarPerfilLocal({ ...current, friendRequests: nextRequests.slice(0, 40), updatedAt: Date.now() });
    feedbackOnline("success", "Pedidos salvos. Para amizade real entre dispositivos, envie seu código ou convite ao outro jogador.");
  }

  function conviteOnlineAtual() {
    const room = limparCodigoSalaOnline(onlineRoomCode || onlineJoinCode);
    if (!room) return "";
    if (typeof window === "undefined") return room;
    const url = new URL(`${window.location.origin}/jogo`);
    url.searchParams.set("online", "join");
    url.searchParams.set("room", room);
    url.searchParams.set("inviteFrom", nomeOnlineSeguro());
    return url.toString();
  }

  async function mostrarNotificacaoConviteLocal(inviteFrom: string, room: string) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission !== "granted") return;
      const notification = new Notification(`${inviteFrom} está te convidando para Space News!`, {
        body: `Toque para entrar na sala ${room}.`,
        icon: "/game-icon.png",
        tag: `space-news-invite-${room}`,
      });
      notification.onclick = () => {
        window.focus();
        setEstado("onlineLobby");
        setFluxoOnline("join");
        setOnlineJoinCode(room);
        void entrarSalaOnline(room);
        notification.close();
      };
    } catch {
      // Navegador sem suporte a notificação local.
    }
  }

  async function compartilharConviteOnline(invite: string, friendName?: string) {
    const room = limparCodigoSalaOnline(onlineRoomCode || onlineJoinCode);
    const alvo = friendName ? ` para ${friendName}` : "";
    const text = `${nomeOnlineSeguro()} está te convidando${alvo} para Space News!`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Convite Space News", text, url: invite });
        feedbackOnline("success", `Convite${alvo} aberto no compartilhamento.`);
        return;
      }
      await navigator.clipboard?.writeText(invite);
      feedbackOnline("success", `Convite${alvo} copiado. Ao abrir, entra direto na sala.`);
    } catch {
      feedbackOnline("success", `Convite: ${invite}`);
    }
    if (room) void mostrarNotificacaoConviteLocal(nomeOnlineSeguro(), room);
  }

  async function copiarConviteOnline() {
    const invite = conviteOnlineAtual();
    if (!invite) {
      feedbackOnline("error", "Entre ou crie uma sala antes de copiar convite.");
      return;
    }
    await compartilharConviteOnline(invite);
  }

  function abrirConvitesAmigosOnline() {
    if (!onlineConnected || !onlineRoomCode) {
      feedbackOnline("error", "Entre/crie uma sala antes de convidar amigos.");
      return;
    }
    setInviteFriendsOpen(true);
    feedbackOnline("idle", "Escolha qual amigo convidar para esta sala.");
  }

  async function convidarAmigoOnline(friend: LocalFriend) {
    const base = conviteOnlineAtual();
    if (!base) {
      feedbackOnline("error", "Sala ainda não está pronta para convite.");
      return;
    }
    const url = new URL(base);
    url.searchParams.set("friend", friend.code || friend.id);
    url.searchParams.set("friendName", friend.name || "Amigo");
    await compartilharConviteOnline(url.toString(), friend.name || "amigo");
  }

  function limparNomeOnline(value: string) {
    const clean = value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{L}0-9 _.-]/gu, "")
      .replace(/\s+/g, " ")
      .trimStart()
      .slice(0, 16);
    return clean;
  }

  function nomeOnlineSeguro() {
    const clean = limparNomeOnline(onlinePlayerName || "").trim();
    return clean.length >= 2 ? clean : "Player";
  }

  function limparCodigoSalaOnline(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  }

  function obterOnlineHttpBase() {
    const raw = (process.env.NEXT_PUBLIC_SPACE_NEWS_WS_URL || "http://localhost:8787").trim();
    return raw
      .replace(/\/$/, "")
      .replace(/^wss:/i, "https:")
      .replace(/^ws:/i, "http:");
  }

  function obterOnlineWsBase() {
    return obterOnlineHttpBase()
      .replace(/^https:/i, "wss:")
      .replace(/^http:/i, "ws:");
  }

  function montarWsUrlOnline(room: string) {
    return `${obterOnlineWsBase()}/room/${limparCodigoSalaOnline(room)}/ws`;
  }

  function feedbackOnline(kind: OnlineFeedback, message: string) {
    setOnlineFeedback(kind);
    setOnlineStatus(message);
    if (kind === "success") tocarSom(CONFIG.sounds.menuConfirm, 0.36, "menu");
    if (kind === "error") tocarSom(CONFIG.sounds.menuBack, 0.42, "menu");
    window.setTimeout(() => {
      setOnlineFeedback((current) => (current === kind ? "idle" : current));
    }, kind === "loading" ? 900 : 1800);
  }

  function limparConexaoOnline() {
    if (onlinePingTimerRef.current !== null) {
      window.clearInterval(onlinePingTimerRef.current);
      onlinePingTimerRef.current = null;
    }
    const ws = onlineSocketRef.current;
    onlineSocketRef.current = null;
    if (ws && ws.readyState <= 1) {
      try {
        ws.close(1000, "Saiu do online");
      } catch {
        // ignora fechamento duplicado
      }
    }
    onlineSlotRef.current = 0;
    onlineHostSlotRef.current = 1;
    setOnlineHostSlot(1);
    onlineConnectedRef.current = false;
    setOnlineConnected(false);
    setOnlineCanStart(false);
    setOnlineIsReady(false);
    setOnlineSlot(0);
    setOnlinePing(null);
    encerrarGameplayOnline();
  }

  function enviarOnline(payload: unknown) {
    const ws = onlineSocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }

  function iniciarPingOnline() {
    if (onlinePingTimerRef.current !== null) {
      window.clearInterval(onlinePingTimerRef.current);
    }
    onlinePingTimerRef.current = window.setInterval(() => {
      if (!onlineSocketRef.current || onlineSocketRef.current.readyState !== WebSocket.OPEN) return;
      onlinePingStartedAtRef.current = performance.now();
      enviarOnline({ type: "ping", t: Date.now() });
    }, 1800);
  }

  function readySlotsFromServer(value: unknown): number[] {
    return Array.isArray(value)
      ? value.map((item) => Number(item)).filter((slot) => slot > 0 && slot <= 4)
      : [];
  }

  function aplicarEstadoSalaOnline(msg: any) {
    const players = Array.isArray(msg.players) ? msg.players : [];
    const hostSlot = Number(msg.hostSlot ?? 1);
    onlineHostSlotRef.current = hostSlot;
    setOnlineHostSlot(hostSlot);
    setOnlinePlayers(players);
    players.forEach((player: OnlinePlayer) => {
      if (player.slot) {
        if (player.cosmetics) onlineCosmeticsBySlotRef.current[player.slot as PlayerSlot] = player.cosmetics;
        if (player.profileSummary?.equipped) onlineCosmeticsBySlotRef.current[player.slot as PlayerSlot] = player.profileSummary.equipped;
        if (player.profileColor || player.profileSummary?.color) onlineProfileColorBySlotRef.current[player.slot as PlayerSlot] = player.profileColor || player.profileSummary?.color || "";
      }
    });
    if (onlineConnectedRef.current) desbloquearConquistaPerfil("first-online-room");
    if (players.length >= 2 && players.some((player: OnlinePlayer) => SPACE_NEWS_CREATOR_NAME_RE.test(player.name || ""))) {
      desbloquearConquistaPerfil("creator-match");
    }
    setOnlineCanStart(Boolean(msg.canStart));
    const selected = ((msg.selectedMode || "localCoop") === "localPvp" ? "localCoop" : (msg.selectedMode || "localCoop")) as GameMode;
    onlineSelectedModeRef.current = selected;
    setOnlineSelectedMode(selected);
    setOnlineModeVotes(msg.modeVotes || {});
    const mySlot = onlineSlotRef.current;
    const me = players.find((player: OnlinePlayer) => player.slot === mySlot);
    setOnlineIsReady(Boolean(me?.ready));
    const readyCount = players.filter((player: OnlinePlayer) => player.ready).length;
    const readyForMode = players.length >= 2 && readyCount === players.length;
    if (players.length < 2) {
      setOnlineStatus("Sala aberta. Mande o código e espere outro player entrar.");
    } else if (!readyForMode) {
      setOnlineStatus(`Etapa de tripulação: ${readyCount}/${players.length} READY. A votação libera quando todos confirmarem.`);
    } else if (!msg.canStart) {
      setOnlineStatus("Tripulação pronta. Agora votem no modo para liberar a partida.");
    } else {
      setOnlineStatus("Together liberado. Versus foi cortado temporariamente; confirme INICIAR.");
      setOnlineFeedback("success");
    }
  }

  function conectarSalaOnline(wsUrl: string, room: string) {
    limparConexaoOnline();
    const safeRoom = limparCodigoSalaOnline(room);
    const safeName = nomeOnlineSeguro();
    setOnlinePlayerName(safeName);
    setOnlineRoomCode(safeRoom);
    setOnlineWsUrl(wsUrl);
    setOnlinePlayers([]);
    feedbackOnline("loading", `Conectando na sala ${safeRoom}...`);

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
    } catch {
      feedbackOnline("error", "URL de WebSocket inválida. Confira NEXT_PUBLIC_SPACE_NEWS_WS_URL.");
      return;
    }

    onlineSocketRef.current = ws;

    ws.onopen = () => {
      onlineConnectedRef.current = true;
      setOnlineConnected(true);
      feedbackOnline("success", "Sala encontrada. Registrando jogador...");
      enviarOnline({
        type: "join",
        name: safeName,
        device: dispositivoOnlineAtual().label,
        cosmetics: localProfileRef.current.equipped,
        profileColor: localProfileRef.current.color,
        profileSummary: criarResumoPerfilOnline(),
      });
      iniciarPingOnline();
    };

    ws.onmessage = (event) => {
      let msg: any;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }

      if (msg.type === "hello") {
        setOnlineStatus("Servidor respondeu. Entrando na sala...");
        return;
      }

      if (msg.type === "name_rejected") {
        feedbackOnline("error", "Esse nome já está em uso nesta sala. Troque no perfil e tente de novo.");
        mostrarToastPerfil("Nome online já está em uso.");
        return;
      }

      if (msg.type === "joined") {
        const slot = Number(msg.player?.slot || 0);
        onlineSlotRef.current = slot;
        setOnlineSlot(slot);
        feedbackOnline("success", `Você entrou como P${slot || "?"}. Confirme READY quando estiver pronto.`);
        return;
      }

      if (msg.type === "room_state") {
        aplicarEstadoSalaOnline(msg);
        return;
      }

      if (msg.type === "player_joined") {
        const joined = msg.player || {};
        const slot = Number(joined.slot || 0);
        feedbackOnline("success", slot ? `P${slot} entrou na sala.` : "Um jogador entrou na sala.");
        return;
      }

      if (msg.type === "ready_changed") {
        const slot = Number(msg.slot || 0);
        const ready = Boolean(msg.ready);
        if (slot && slot !== onlineSlotRef.current) {
          feedbackOnline("idle", `P${slot} ${ready ? "ficou READY" : "tirou READY"}.`);
        }
        return;
      }

      if (msg.type === "host_changed" || msg.type === "host_migrated") {
        const hostSlot = Number(msg.hostSlot ?? 1);
        onlineHostSlotRef.current = hostSlot;
        setOnlineHostSlot(hostSlot);
        const migrated = Boolean(msg.migrated || msg.type === "host_migrated");
        feedbackOnline("success", hostSlot === 0 ? "Servidor assumiu a partida." : (hostSlot === onlineSlotRef.current ? (migrated ? "Host saiu. Você assumiu a sala." : "Você virou o host da sala.") : `P${hostSlot} virou host da sala.`));
        setOnlineStatus(hostSlot === 0 ? "Servidor autoritativo ativo: todos recebem o mesmo estado." : (hostSlot === onlineSlotRef.current ? "Você é o host: seu jogo agora envia o quadro principal." : `Host atual: P${hostSlot}. Sincronizando pelo quadro dele.`));
        return;
      }

      if (msg.type === "game_start") {
        const mode = ((msg.mode || onlineSelectedModeRef.current || "localCoop") === "localPvp" ? "localCoop" : (msg.mode || onlineSelectedModeRef.current || "localCoop")) as GameMode;
        const hostSlot = Number(msg.hostSlot ?? onlineHostSlotRef.current ?? 1);
        onlineHostSlotRef.current = hostSlot;
        onlineMatchSeedRef.current = Math.max(1, Math.floor(Number(msg.seed || Date.now())));
        setOnlineHostSlot(hostSlot);
        onlineGameplayActiveRef.current = true;
        onlineServerAuthoritativeRef.current = mode !== "localCoop" && String(msg.netModel || "").includes("server-authoritative");
        // v2.4.8: Together online volta ao dual-sim coordenado por eventos.
        // Player local não é corrigido por snapshot; inputs/power-ups/moedas/revive são relayados pelo Worker.
        setOnlineGameplayActive(true);
        setOnlineMatchIntroUntil(0);
        onlineRemoteInputsRef.current = {};
        onlineSnapshotBufferRef.current = [];
        onlineLatestSnapshotRef.current = null;
        onlineLastAppliedSnapshotTickRef.current = 0;
        onlineLastAppliedSnapshotSeqRef.current = 0;
        feedbackOnline("success", mode === "localCoop" ? "Together online: dual-sim ativo. Sincronizando eventos, power-ups e moedas..." : (onlineServerAuthoritativeRef.current ? "Servidor autoritativo ativo. Sincronizando partida..." : `Iniciando ${labelModoMultiplayer(mode)} online...`));
        window.setTimeout(() => iniciarJogo(mode), 260);
        return;
      }

      if (msg.type === "input") {
        const from = Number(msg.from || 0);
        if (from > 0 && from !== onlineSlotRef.current) {
          onlineRemoteInputsRef.current[from] = { ...EMPTY_ONLINE_INPUT_STATE, ...(msg.input || {}) };
          if (msg.cosmetics && typeof msg.cosmetics === "object") onlineCosmeticsBySlotRef.current[from] = msg.cosmetics as EquippedCosmetics;
          if (typeof msg.profileColor === "string") onlineProfileColorBySlotRef.current[from] = msg.profileColor;
        }
        return;
      }

      if (msg.type === "sync") {
        const from = Number(msg.from || 0);
        const rawSnapshot = msg.snapshot as OnlineGameplaySnapshot | undefined;
        const serverAuthoritative = Boolean(rawSnapshot && String(rawSnapshot.netModel || msg.netModel || "").includes("server-authoritative"));
        if (serverAuthoritative) onlineServerAuthoritativeRef.current = true;
        if (rawSnapshot && (serverAuthoritative || (from === onlineHostSlotRef.current && !souHostOnline()))) {
          const snapshot = {
            ...rawSnapshot,
            serverTime: Number(msg.serverTime || msg.t || Date.now()),
          } as OnlineGameplaySnapshot;
          onlineLastSyncReceivedAtRef.current = performance.now();
          adicionarSnapshotOnline(snapshot);
        }
        return;
      }

      if (msg.type === "token_collect") {
        const slot = Number(msg.slot || 0);
        const amount = Math.max(0, Math.floor(Number(msg.amount || 0)));
        if (slot === onlineSlotRef.current && amount > 0) {
          adicionarTokensPerfil(amount);
        }
        return;
      }

      if (msg.type === "player_timeout_start") {
        const slot = Number(msg.slot || 0);
        const timeoutMs = Number(msg.timeoutMs || 10000);
        mostrarEventoOnline(
          slot ? `P${slot} perdeu conexão` : "Jogador perdeu conexão",
          "Aguardando timeout antes de reorganizar a sala.",
          "warning",
          timeoutMs + 600,
          timeoutMs,
        );
        feedbackOnline("error", slot ? `P${slot} caiu. Timeout em ${Math.ceil(timeoutMs / 1000)}s.` : "Jogador caiu. Aguardando timeout.");
        return;
      }

      if (msg.type === "player_left") {
        const slot = Number(msg.slot || 0);
        const remaining = Number(msg.remainingPlayers || 0);
        const shouldReturn = Boolean(msg.shouldReturnToLobby ?? remaining <= 1);
        mostrarEventoOnline(
          slot ? `P${slot} saiu!` : "Jogador saiu!",
          shouldReturn ? "Só sobrou 1 jogador. Voltando ao lobby." : `${remaining} jogadores continuam na partida.`,
          shouldReturn ? "danger" : "warning",
          3400,
        );
        feedbackOnline(shouldReturn ? "error" : "idle", shouldReturn ? "Jogador saiu. Voltando ao lobby." : `P${slot || "?"} saiu, mas a partida continua.`);
        if (shouldReturn) {
          encerrarGameplayOnline();
          limparCombate();
          setOnlineCanStart(false);
          setOnlineIsReady(false);
          setEstado("onlineLobby");
        }
        return;
      }

      if (msg.type === "lobby_return") {
        feedbackOnline("success", "Host voltou todos ao lobby online.");
        encerrarGameplayOnline();
        limparCombate();
        setEstado("onlineLobby");
        return;
      }

      if (msg.type === "pause_state") {
        const requestedBy = Number(msg.requestedBy || 0) || null;
        const readySlots = Array.isArray(msg.readySlots) ? readySlotsFromServer(msg.readySlots) : [];
        onlinePauseRequestedByRef.current = requestedBy;
        onlinePauseReadySlotsRef.current = readySlots;
        setOnlinePauseRequestedBy(requestedBy);
        setOnlinePauseReadySlots(readySlots);
        onlinePausePanelOpenRef.current = Boolean(requestedBy);
        setOnlinePausePanelOpen(Boolean(requestedBy));
        if (requestedBy && gameStateRef.current === "playing") {
          setOnlineStatus(`P${requestedBy} quer pausar. Aperte pause para abrir a votação.`);
        }
        return;
      }

      if (msg.type === "pause_commit") {
        pauseStartedAtRef.current = performance.now();
        setIndicePause(0);
        onlinePausePanelOpenRef.current = false;
        setOnlinePausePanelOpen(false);
        setEstado("paused");
        setIsLowHp(false);
        pararAlarmeLowHp(false);
        tocarSom(CONFIG.sounds.pause, 0.45);
        return;
      }


      if (msg.type === "unpause_start") {
        onlinePauseRequestedByRef.current = null;
        onlinePauseReadySlotsRef.current = [];
        setOnlinePauseRequestedBy(null);
        setOnlinePauseReadySlots([]);
        onlinePausePanelOpenRef.current = false;
        setOnlinePausePanelOpen(false);
        if (gameStateRef.current === "paused") iniciarContagemRetomada();
        return;
      }

      if (msg.type === "coop_token_spawn") {
        const from = Number(msg.from || msg.slot || 0);
        if (from !== onlineSlotRef.current) {
          adicionarTokensRemotosSincronizados(msg.tokens as Partial<TokenPickup>[]);
        }
        return;
      }

      if (msg.type === "coop_token_collect") {
        const from = Number(msg.from || msg.slot || 0);
        if (from !== onlineSlotRef.current) {
          const tokenIds = Array.isArray(msg.tokenIds) ? msg.tokenIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isFinite(id)) : [];
          removerTokensCoopSincronizados(tokenIds, Number(msg.amount || 0));
        }
        return;
      }

      if (msg.type === "coop_powerup_spawn") {
        const from = Number(msg.from || msg.slot || 0);
        if (from !== onlineSlotRef.current) {
          adicionarPowerUpRemotoSincronizado(msg.power as Partial<PowerUp>);
        }
        return;
      }

      if (msg.type === "coop_powerup_collect") {
        const slot = Number(msg.slot || 0) as PlayerSlot;
        const kind = String(msg.kind || "") as PowerUpKind;
        const powerId = typeof msg.powerId === "number" ? Number(msg.powerId) : undefined;
        if (slot >= 1 && slot <= 4 && kind && slot !== onlineSlotRef.current) {
          aplicarPowerUpPorSlotSincronizado(slot, kind, powerId);
        }
        return;
      }

      if (msg.type === "coop_pet_ability") {
        const slot = Number(msg.slot || msg.from || 0) as PlayerSlot;
        const pet = String(msg.pet || "");
        if (slot >= 1 && slot <= 4 && pet && slot !== onlineSlotRef.current) {
          aplicarHabilidadePetCoopSincronizada(slot, pet, true);
        }
        return;
      }

      if (msg.type === "coop_revive") {
        const slot = Number(msg.slot || 0) as PlayerSlot;
        const player = playerPorSlotOnline(slot);
        if (player && player.hp <= 0) {
          player.hp = 2;
          player.invincibleUntil = performance.now() + 2200;
          if (slot === slotLocalOnline()) setPlayerHp(player.hp);
          else if (slot === slotVisualPlayer2Online()) setPlayer2Hp(player.hp);
          criarExplosao(player.x + player.w / 2, player.y + player.h / 2, LOCAL_PLAYER_COLORS[(slot - 1) % LOCAL_PLAYER_COLORS.length], 16);
        }
        return;
      }

      if (msg.type === "coop_wave_start") {
        const from = Number(msg.from || msg.slot || 0);
        const wave = Math.max(1, Math.floor(Number(msg.wave || 1)));
        if (from !== onlineSlotRef.current && !souAutoridadeMundoOnlineTogether()) {
          onlineApplyingRemoteWorldEventRef.current = true;
          try { iniciarWaveInfinita(wave); }
          finally { onlineApplyingRemoteWorldEventRef.current = false; }
        }
        return;
      }

      if (msg.type === "coop_enemy_spawn") {
        const from = Number(msg.from || msg.slot || 0);
        if (from !== onlineSlotRef.current) adicionarInimigosRemotosSincronizados(msg.enemies as Partial<Enemy>[]);
        return;
      }

      if (msg.type === "coop_world_resync") {
        const from = Number(msg.from || msg.slot || 0);
        if (from !== onlineSlotRef.current) aplicarResyncMundoCoop(msg.world as Partial<OnlineGameplaySnapshot>);
        return;
      }

      if (msg.type === "pong") {
        const ping = Math.max(0, Math.round(performance.now() - onlinePingStartedAtRef.current));
        setOnlinePing(ping);
        return;
      }

      if (msg.type === "error") {
        feedbackOnline("error", String(msg.error || "Erro na sala online."));
      }
    };

    ws.onerror = () => {
      feedbackOnline("error", "Erro no WebSocket. Veja se o Worker está rodando/deployado.");
    };

    ws.onclose = () => {
      if (onlinePingTimerRef.current !== null) {
        window.clearInterval(onlinePingTimerRef.current);
        onlinePingTimerRef.current = null;
      }
      const wasInOnlineMatch = onlineGameplayActiveRef.current;
      onlineSocketRef.current = null;
      onlineConnectedRef.current = false;
      setOnlineConnected(false);
      setOnlineCanStart(false);
      setOnlineIsReady(false);
      setOnlineStatus("Conexão online fechada.");
      if (wasInOnlineMatch) {
        encerrarGameplayOnline();
        limparCombate();
        setEstado("onlineLobby");
        feedbackOnline("error", "Conexão perdida. A partida online foi encerrada.");
      }
    };
  }

  async function criarSalaOnline() {
    tocarSom(CONFIG.sounds.menuConfirm, 0.34, "menu");
    setFluxoOnline("create");
    setOnlineCheckingRoom(true);
    feedbackOnline("loading", "Criando sala no Worker...");
    try {
      const response = await fetch(`${obterOnlineHttpBase()}/create`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as { room?: string; wsUrl?: string };
      const room = limparCodigoSalaOnline(data.room || "");
      if (!room || !data.wsUrl) throw new Error("Resposta sem sala/wsUrl");
      feedbackOnline("success", `Sala ${room} criada. Conectando...`);
      conectarSalaOnline(data.wsUrl, room);
    } catch {
      feedbackOnline("error", "Não consegui criar sala. Confira o Worker/URL workers.dev.");
    } finally {
      setOnlineCheckingRoom(false);
    }
  }

  async function conferirSalaOnline(room: string) {
    const code = limparCodigoSalaOnline(room);
    if (!code) return false;
    const response = await fetch(`${obterOnlineHttpBase()}/check?room=${encodeURIComponent(code)}`, { cache: "no-store" });
    if (!response.ok) return false;
    const data = await response.json() as { exists?: boolean };
    return Boolean(data.exists);
  }

  async function entrarSalaOnline(roomOverride?: string) {
    const room = limparCodigoSalaOnline(roomOverride || onlineJoinCode);
    if (room.length < 4) {
      feedbackOnline("error", "Digite um código de sala válido.");
      return;
    }
    setFluxoOnline("join");
    setOnlineCheckingRoom(true);
    feedbackOnline("loading", `Procurando sala ${room}...`);
    try {
      const exists = await conferirSalaOnline(room);
      if (!exists) {
        feedbackOnline("error", `Sala ${room} não existe ou expirou.`);
        return;
      }
      feedbackOnline("success", `Sala ${room} encontrada! Entrando...`);
      conectarSalaOnline(montarWsUrlOnline(room), room);
    } catch {
      feedbackOnline("error", "Não consegui verificar a sala. Confira sua internet/Worker.");
    } finally {
      setOnlineCheckingRoom(false);
    }
  }

  function alternarReadyOnline() {
    if (!onlineConnected) {
      feedbackOnline("error", "Entre/crie uma sala antes de dar READY.");
      return;
    }
    tocarSom(CONFIG.sounds.menuConfirm, 0.3, "menu");
    enviarOnline({ type: "ready", ready: !onlineIsReady });
  }

  function votarModoOnline(mode: GameMode) {
    if (mode === "localPvp") {
      bloquearVersusTemporariamente("Versus local/online está cortado temporariamente neste patch. Publica o Together estável primeiro.");
      mode = "localCoop";
    }
    const readyCount = onlinePlayers.filter((player) => player.ready).length;
    const readyForMode = onlineConnected && onlinePlayers.length >= 2 && readyCount === onlinePlayers.length;
    if (!readyForMode) {
      feedbackOnline("error", "A votação só libera quando todos os players da sala estiverem READY.");
      tocarSom(CONFIG.sounds.menuBack, 0.22, "menu");
      return;
    }
    onlineSelectedModeRef.current = mode;
    setOnlineSelectedMode(mode);
    tocarSom(CONFIG.sounds.menuMove, 0.26, "menu");
    if (onlineConnected) enviarOnline({ type: "vote_mode", mode });
  }

  function iniciarPartidaOnline() {
    if (!onlineConnected) {
      feedbackOnline("error", "Entre em uma sala antes de iniciar.");
      return;
    }
    if (!onlineCanStart) {
      feedbackOnline("error", "Precisa de 2+ players, todos em READY e votação liberada.");
      return;
    }
    tocarSom(CONFIG.sounds.menuConfirm, 0.42, "menu");
    enviarOnline({ type: "start", mode: "localCoop" });
  }

  function sairSalaOnline() {
    if (!onlineConnected && !onlineRoomCode) {
      feedbackOnline("error", "Você ainda não está em uma sala.");
      return;
    }
    tocarSom(CONFIG.sounds.menuBack, 0.34, "menu");
    enviarOnline({ type: "leave" });
    limparConexaoOnline();
    setOnlineRoomCode("");
    setOnlineWsUrl("");
    setOnlinePlayers([]);
    setOnlineCanStart(false);
    setOnlineIsReady(false);
    setOnlineJoinCode("");
    setOnlineFeedback("idle");
    encerrarGameplayOnline();
    setOnlineStatus("Você saiu da sala. Crie outra sala ou entre com código.");
  }

  async function copiarCodigoSalaOnline() {
    if (!onlineRoomCode) {
      feedbackOnline("error", "Crie uma sala primeiro para copiar o código.");
      return;
    }
    try {
      await navigator.clipboard?.writeText(onlineRoomCode);
      feedbackOnline("success", `Código ${onlineRoomCode} copiado. Envie para seu amigo entrar.`);
    } catch {
      setOnlineStatus(`Código da sala: ${onlineRoomCode}`);
    }
  }

  function fecharLobbyOnline() {
    limparConexaoOnline();
    setOnlinePlayers([]);
    setOnlineRoomCode("");
    setOnlineWsUrl("");
    setOnlineFeedback("idle");
    encerrarGameplayOnline();
    setOnlineStatus("Crie uma sala ou entre com código.");
    tocarSom(CONFIG.sounds.menuBack, 0.36, "menu");
    setEstado("multiplayerMenu");
  }

  function abrirLobbyOnline() {
    tocarSom(CONFIG.sounds.menuConfirm, 0.38, "menu");
    atualizarDispositivosDisponiveis(true);
    setOnlineStatus("Escolha criar ou entrar em uma sala.");
    setOnlineFeedback("idle");
    setFluxoOnline("choose");
    // v1.8.0: garante que nenhum fade pesado fique ativo ao entrar no online.
    setEscurecendo(false);
    setEstado("onlineLobby");
  }

  function voltarDoMultiplayer() {
    limparConexaoOnline();
    tocarSom(CONFIG.sounds.menuBack, 0.36, "menu");
    encerrarGameplayOnline();
    setEstado("mainMenu");
    setIndiceMenu(2);
  }

  function executarOpcaoPauseAtual() {
    if (pauseIndexRef.current === 0) {
      pausarOuVoltar();
      return;
    }
    if (pauseIndexRef.current === 1) {
      abrirConfiguracoes();
      return;
    }
    voltarAoMenuPrincipal();
  }

  function setIndiceTutorialChoice(index: number) {
    const total = 2;
    const safeIndex = ((index % total) + total) % total;
    tutorialChoiceIndexRef.current = safeIndex;
    setTutorialChoiceIndex(safeIndex);
  }

  function selecionarSecaoConfiguracoes(
    section: (typeof SETTINGS_SECTIONS)[number],
  ) {
    settingsSectionRef.current = section;
    setSettingsSection(section);
    const firstIndex = SETTINGS_OPTIONS.findIndex(
      (option) => option.category === section,
    );
    if (firstIndex >= 0) setIndiceConfiguracao(firstIndex);
    tocarSom(CONFIG.sounds.menuMove, 0.22, "menu");
  }

  function selecionarSecaoConfiguracoesRelativa(direction: -1 | 1) {
    const currentIndex = SETTINGS_SECTIONS.indexOf(settingsSectionRef.current);
    const nextIndex =
      (currentIndex + direction + SETTINGS_SECTIONS.length) % SETTINGS_SECTIONS.length;
    selecionarSecaoConfiguracoes(SETTINGS_SECTIONS[nextIndex]);
  }

  function atualizarConfiguracao(
    key: GameSettingKey,
    value: boolean | number | string,
  ) {
    (CONFIG.settings as Record<string, boolean | number | string>)[key] = value;

    if (key === "masterVolume" || key === "musicVolume") {
      if (bossMusicAudioRef.current) {
        bossMusicAudioRef.current.volume = clamp(
          0.78 * CONFIG.settings.masterVolume * CONFIG.settings.musicVolume,
          0,
          1,
        );
      }
      if (ambientAudioRef.current) {
        ambientAudioRef.current.volume = clamp(
          0.16 * CONFIG.settings.masterVolume * CONFIG.settings.musicVolume,
          0,
          1,
        );
      }
      if (gameplayMusicAudioRef.current) {
        gameplayMusicAudioRef.current.volume = clamp(
          0.42 * CONFIG.settings.masterVolume * CONFIG.settings.musicVolume,
          0,
          1,
        );
      }
      if (bossHumAudioRef.current) {
        bossHumAudioRef.current.volume = clamp(
          0.16 * CONFIG.settings.masterVolume * CONFIG.settings.musicVolume,
          0,
          1,
        );
      }
    }

    try {
      window.localStorage.setItem(
        "spaceNews.settings",
        JSON.stringify(CONFIG.settings),
      );
    } catch {}
    setSettingsSnapshot({ ...CONFIG.settings });
  }

  function persistirLayoutMobile(next: MobileControlLayoutMap) {
    setMobileControlLayout(next);
    try {
      window.localStorage.setItem(
        "spaceNews.mobileLayout",
        JSON.stringify(next),
      );
    } catch {}
  }

  function atualizarControleMobile(
    id: MobileControlId,
    patch: Partial<MobileControlPlacement>,
  ) {
    persistirLayoutMobile({
      ...mobileControlLayout,
      [id]: {
        ...mobileControlLayout[id],
        ...patch,
      },
    });
  }

  function moverControleMobile(
    id: MobileControlId,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    const stage = event.currentTarget.parentElement;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const x = clamp(
      ((event.clientX - rect.left) / Math.max(1, rect.width)) * 100,
      4,
      96,
    );
    const y = clamp(
      ((event.clientY - rect.top) / Math.max(1, rect.height)) * 100,
      5,
      95,
    );
    atualizarControleMobile(id, {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    });
  }

  function mobileControlStyle(id: MobileControlId): CSSProperties {
    const placement = mobileControlLayout[id];
    return {
      left: `${placement.x}%`,
      top: `${placement.y}%`,
      transform: `translate(-50%, -50%) scale(${placement.scale * Number(settingsSnapshot.mobileScale)})`,
      opacity: Number(settingsSnapshot.mobileOpacity),
    };
  }

  function iniciarCapturaTecla(settingKey: GameSettingKey, label: string) {
    keyBindDialogOpenRef.current = true;
    keyBindCaptureRef.current = settingKey;
    gamepadCaptureRef.current = null;
    setKeyBindPrompt({ settingKey, label, candidate: null, kind: "keyboard" });
    tocarSom(CONFIG.sounds.menuConfirm, 0.32, "menu");
  }

  function iniciarCapturaBotaoControle(
    settingKey: GameSettingKey,
    label: string,
  ) {
    keyBindDialogOpenRef.current = true;
    keyBindCaptureRef.current = null;
    gamepadCaptureRef.current = settingKey;
    setKeyBindPrompt({ settingKey, label, candidate: null, kind: "gamepad" });
    tocarSom(CONFIG.sounds.menuConfirm, 0.32, "menu");
  }

  function cancelarCapturaTecla() {
    keyBindDialogOpenRef.current = false;
    keyBindCaptureRef.current = null;
    gamepadCaptureRef.current = null;
    setKeyBindPrompt(null);
    tocarSom(CONFIG.sounds.menuBack, 0.24, "menu");
  }

  function confirmarCapturaTecla() {
    if (!keyBindPrompt?.candidate) return;
    const settingKey = keyBindPrompt.settingKey;
    const candidate = keyBindPrompt.candidate;
    const oldKey = String(CONFIG.settings[settingKey]);
    const keyboardBindKeys: GameSettingKey[] = [
      "pcShootKey",
      "pcStrongKey",
      "pcBoostKey",
      "pcDodgeKey",
    ];
    const gamepadBindKeys = [...GAMEPAD_ACTION_KEYS] as GameSettingKey[];
    const isGamepadBind = gamepadBindKeys.includes(settingKey);
    const bindKeys = isGamepadBind ? gamepadBindKeys : keyboardBindKeys;
    const normalizer = isGamepadBind
      ? normalizarBotaoControle
      : normalizarTeclaConfig;
    const duplicate = bindKeys.find(
      (key) =>
        key !== settingKey &&
        normalizer(CONFIG.settings[key]) === normalizer(candidate),
    );

    if (duplicate) {
      atualizarConfiguracao(duplicate, oldKey);
    }
    atualizarConfiguracao(settingKey, normalizer(candidate));
    keyBindDialogOpenRef.current = false;
    keyBindCaptureRef.current = null;
    setKeyBindPrompt(null);
    tocarSom(CONFIG.sounds.menuConfirm, 0.48, "menu");
  }

  function normalizarTeclaConfig(valor: unknown) {
    const key = String(valor || "").toLowerCase();
    if (key === "space" || key === "espaço") return " ";
    if (key === "ctrl") return "control";
    return key;
  }

  function labelTecla(valor: unknown) {
    const key = String(valor || "").toLowerCase();
    if (key === " ") return "ESPAÇO";
    if (key === "space") return "ESPAÇO";
    if (key === "control") return "CTRL";
    if (key === "shift") return "SHIFT";
    return key.toUpperCase();
  }

  function normalizarBotaoControle(valor: unknown) {
    return normalizarBotoesControle(valor)[0] || "0";
  }

  function labelBotaoControle(valor: unknown) {
    return normalizarBotoesControle(valor)
      .map((key) => GAMEPAD_BUTTON_LABELS[key] || `Botão ${key}`)
      .join(" ou ");
  }

  function teclaControlePressionada(
    action: "shot" | "strong" | "boost" | "dodge",
  ) {
    const settingKey =
      action === "shot"
        ? "pcShootKey"
        : action === "strong"
          ? "pcStrongKey"
          : action === "boost"
            ? "pcBoostKey"
            : "pcDodgeKey";
    const key = normalizarTeclaConfig(
      (CONFIG.settings as Record<string, unknown>)[settingKey],
    );
    return Boolean(keysRef.current[key]);
  }

  function gamepadSettingKey(
    action: "shot" | "strong" | "boost" | "dodge",
  ): GameSettingKey {
    return action === "shot"
      ? "gamepadShootButton"
      : action === "strong"
        ? "gamepadStrongButton"
        : action === "boost"
          ? "gamepadBoostButton"
          : "gamepadDodgeButton";
  }

  function botaoControleSegurando(settingKey: GameSettingKey) {
    if (!CONFIG.settings.gamepadEnabled) return false;
    return normalizarBotoesControle(CONFIG.settings[settingKey]).some(
      (button) => Boolean(gamepadButtonsRef.current[button]),
    );
  }

  function botaoControleAcionado(settingKey: GameSettingKey) {
    if (!CONFIG.settings.gamepadEnabled) return false;
    return normalizarBotoesControle(CONFIG.settings[settingKey]).some(
      (button) => Boolean(gamepadButtonsPressedRef.current[button]),
    );
  }

  function botaoFisicoControleAcionado(...buttons: string[]) {
    if (!CONFIG.settings.gamepadEnabled) return false;
    return buttons.some((button) => Boolean(gamepadButtonsPressedRef.current[button]));
  }

  function controleAcaoSegurando(
    action: "shot" | "strong" | "boost" | "dodge",
  ) {
    return (
      teclaControlePressionada(action) ||
      botaoControleSegurando(gamepadSettingKey(action))
    );
  }

  function controleAcaoAcionada(action: "shot" | "strong" | "boost" | "dodge") {
    return (
      teclaControlePressionada(action) ||
      botaoControleAcionado(gamepadSettingKey(action))
    );
  }

  function labelControlePc(
    action: "move" | "shot" | "strong" | "boost" | "dodge",
  ) {
    if (action === "move") {
      const layout = String(
        (CONFIG.settings as Record<string, unknown>).pcMoveLayout || "both",
      );
      if (layout === "arrows") return "SETAS";
      if (layout === "wasd") return "WASD";
      return "WASD ou SETAS";
    }
    const settingKey =
      action === "shot"
        ? "pcShootKey"
        : action === "strong"
          ? "pcStrongKey"
          : action === "boost"
            ? "pcBoostKey"
            : "pcDodgeKey";
    return labelTecla((CONFIG.settings as Record<string, unknown>)[settingKey]);
  }

  function labelControleGamepad(
    action: "move" | "shot" | "strong" | "boost" | "dodge",
  ) {
    if (action === "move") {
      return String(CONFIG.settings.gamepadMoveStick) === "right"
        ? "ANALÓGICO DIREITO ou D-PAD"
        : "ANALÓGICO ESQUERDO ou D-PAD";
    }

    const settingKey =
      action === "shot"
        ? "gamepadShootButton"
        : action === "strong"
          ? "gamepadStrongButton"
          : action === "boost"
            ? "gamepadBoostButton"
            : "gamepadDodgeButton";

    return labelBotaoControle(CONFIG.settings[settingKey]);
  }

  function usandoControleNoTutorial() {
    return (
      CONFIG.settings.gamepadEnabled &&
      gamepadStatusRef.current.startsWith("Controle conectado")
    );
  }

  function atualizarStatusGamepad(next: string) {
    if (gamepadStatusRef.current === next) return;
    gamepadStatusRef.current = next;
    setGamepadStatus(next);
  }

  function aplicarDeadzone(valor: number, deadzone: number) {
    if (Math.abs(valor) < deadzone) return 0;
    const sinal = Math.sign(valor);
    const normalizado =
      (Math.abs(valor) - deadzone) / Math.max(0.01, 1 - deadzone);
    return clamp(normalizado * sinal, -1, 1);
  }

  function atualizarEstadoGamepad() {
    if (typeof navigator === "undefined" || !navigator.getGamepads) {
      atualizarStatusGamepad("Controle não suportado neste navegador");
      return;
    }

    if (!CONFIG.settings.gamepadEnabled) {
      gamepadButtonsRef.current = {};
      gamepadButtonsPressedRef.current = {};
      gamepadDirectionsPressedRef.current = {};
      gamepadDirectionsHeldRef.current = {};
      gamepadAxesRef.current = { x: 0, y: 0 };
      lastGamepadIdRef.current = "";
      atualizarStatusGamepad("Controle desativado");
      return;
    }

    const pads = Array.from(navigator.getGamepads()).filter(Boolean);
    const pad = pads.find((item): item is Gamepad => Boolean(item?.connected));

    if (!pad) {
      gamepadButtonsRef.current = {};
      gamepadButtonsPressedRef.current = {};
      gamepadDirectionsPressedRef.current = {};
      gamepadDirectionsHeldRef.current = {};
      gamepadAxesRef.current = { x: 0, y: 0 };
      lastGamepadIdRef.current = "";
      atualizarStatusGamepad("Controle não conectado");
      return;
    }

    const previousButtons = gamepadButtonsRef.current;
    const nextButtons: Record<string, boolean> = {};
    const pressedButtons: Record<string, boolean> = {};

    pad.buttons.forEach((button, index) => {
      const pressed = button.pressed || button.value > 0.55;
      const key = String(index);
      nextButtons[key] = pressed;
      pressedButtons[key] = pressed && !previousButtons[key];
    });

    const stickOffset =
      String(CONFIG.settings.gamepadMoveStick) === "right" ? 2 : 0;
    const deadzone = clamp(
      Number(CONFIG.settings.gamepadDeadzone) || 0.18,
      0.04,
      0.5,
    );
    const x = aplicarDeadzone(Number(pad.axes[stickOffset] || 0), deadzone);
    const y = aplicarDeadzone(Number(pad.axes[stickOffset + 1] || 0), deadzone);

    const previousDirections = gamepadDirectionsHeldRef.current;
    const directions = {
      up: nextButtons["12"] || y < -0.62,
      down: nextButtons["13"] || y > 0.62,
      left: nextButtons["14"] || x < -0.62,
      right: nextButtons["15"] || x > 0.62,
    };

    gamepadDirectionsHeldRef.current = directions;
    gamepadDirectionsPressedRef.current = {
      up: directions.up && !previousDirections.up,
      down: directions.down && !previousDirections.down,
      left: directions.left && !previousDirections.left,
      right: directions.right && !previousDirections.right,
    };

    gamepadButtonsRef.current = nextButtons;
    gamepadButtonsPressedRef.current = pressedButtons;
    gamepadAxesRef.current = { x, y };
    atualizarStatusGamepad(`Controle conectado: ${pad.id.slice(0, 46)}`);

    if (lastGamepadIdRef.current !== pad.id) {
      lastGamepadIdRef.current = pad.id;
    }

    if (gamepadCaptureRef.current) {
      const candidate = Object.keys(pressedButtons).find(
        (key) => pressedButtons[key],
      );
      if (candidate) {
        const settingKey = gamepadCaptureRef.current;
        setKeyBindPrompt((current) =>
          current
            ? { ...current, settingKey, candidate, kind: "gamepad" }
            : { settingKey, label: "CONTROLE", candidate, kind: "gamepad" },
        );
        gamepadCaptureRef.current = null;
        tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
      }
    }
  }

  function direcaoGamepadAcionada(direction: "up" | "down" | "left" | "right") {
    return Boolean(gamepadDirectionsPressedRef.current[direction]);
  }

  function direcaoGamepadSegurando(
    direction: "up" | "down" | "left" | "right",
  ) {
    return Boolean(gamepadDirectionsHeldRef.current[direction]);
  }

  function consumirDirecaoMenu(direction: "up" | "down" | "left" | "right") {
    const held = direcaoGamepadSegurando(direction);
    const justPressed = direcaoGamepadAcionada(direction);
    const state = menuDirectionHoldRef.current[direction];
    const now = performance.now();

    if (!held) {
      state.active = false;
      state.startedAt = 0;
      state.lastRepeatAt = 0;
      return false;
    }

    if (justPressed || !state.active) {
      state.active = true;
      state.startedAt = now;
      state.lastRepeatAt = now;
      return true;
    }

    if (now - state.startedAt >= 1000 && now - state.lastRepeatAt >= 140) {
      state.lastRepeatAt = now;
      return true;
    }

    return false;
  }

  function confirmarTutorialChoiceAtual() {
    if (tutorialChoiceIndexRef.current === 0) {
      iniciarTutorialInterativo();
      return;
    }
    iniciarJogo(currentModeRef.current ?? "story");
  }

  function processarEntradaGamepadGlobal() {
    if (!CONFIG.settings.gamepadEnabled) return;

    if (keyBindDialogOpenRef.current) {
      if (botaoControleAcionado("gamepadBackButton")) cancelarCapturaTecla();
      if (botaoControleAcionado("gamepadConfirmButton"))
        confirmarCapturaTecla();
      return;
    }

    if (gameStateRef.current === "title") {
      if (botaoControleAcionado("gamepadConfirmButton")) abrirMenuPrincipal();
      return;
    }

    if (gameStateRef.current === "mainMenu") {
      if (botaoControleAcionado("gamepadBackButton")) {
        voltarParaTitulo();
        return;
      }
      if (consumirDirecaoMenu("up")) {
        tocarSom(CONFIG.sounds.menuMove, 0.32, "menu");
        setIndiceMenu(
          (menuIndexRef.current - 1 + MAIN_MENU_OPTIONS.length) %
            MAIN_MENU_OPTIONS.length,
        );
        return;
      }
      if (consumirDirecaoMenu("down")) {
        tocarSom(CONFIG.sounds.menuMove, 0.32, "menu");
        setIndiceMenu((menuIndexRef.current + 1) % MAIN_MENU_OPTIONS.length);
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton")) {
        confirmarOpcaoMenuAtual();
        return;
      }
    }

    if (gameStateRef.current === "multiplayerMenu") {
      if (botaoControleAcionado("gamepadBackButton")) {
        voltarDoMultiplayer();
        return;
      }
      if (consumirDirecaoMenu("up") || consumirDirecaoMenu("left")) {
        tocarSom(CONFIG.sounds.menuMove, 0.32, "menu");
        setIndiceMultiplayerBranch(multiplayerBranchIndexRef.current - 1);
        return;
      }
      if (consumirDirecaoMenu("down") || consumirDirecaoMenu("right")) {
        tocarSom(CONFIG.sounds.menuMove, 0.32, "menu");
        setIndiceMultiplayerBranch(multiplayerBranchIndexRef.current + 1);
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton")) {
        if (multiplayerBranchIndexRef.current === 0) abrirLobbyLocal();
        else abrirLobbyOnline();
        return;
      }
    }

    if (gameStateRef.current === "onlineLobby") {
      if (botaoControleAcionado("gamepadBackButton")) {
        fecharLobbyOnline();
        return;
      }
      if (consumirDirecaoMenu("up") || consumirDirecaoMenu("left")) {
        tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
        setIndiceOnlineMenu(onlineMenuIndexRef.current - 1);
        return;
      }
      if (consumirDirecaoMenu("down") || consumirDirecaoMenu("right")) {
        tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
        setIndiceOnlineMenu(onlineMenuIndexRef.current + 1);
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton")) {
        const index = onlineMenuIndexRef.current;
        if (!onlineConnected) {
          if (index === 0) setFluxoOnline("create");
          else if (index === 1) setFluxoOnline("join");
          else if (index === 2) setDispositivoOnline(onlineDeviceIndexRef.current + 1);
          else if (onlineFlowRef.current === "create") criarSalaOnline();
          else if (onlineFlowRef.current === "join") entrarSalaOnline();
          return;
        }
        if (index === 0) alternarReadyOnline();
        else if (index === 1) iniciarPartidaOnline();
        else if (index === 2) votarModoOnline("localCoop");
        else if (index === 3) copiarCodigoSalaOnline();
        else if (index === 4) copiarCodigoSalaOnline();
        else if (index === 5) sairSalaOnline();
        return;
      }
    }

    if (gameStateRef.current === "localLobby") {
      if (botaoControleAcionado("gamepadBackButton")) {
        setEstado("multiplayerMenu");
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton") && !localPlayerSlotsRef.current[1]?.ready) {
        setIndiceLobbyLocal(1);
        alternarReadySlotLocal(1);
        return;
      }
      if (consumirDirecaoMenu("left") || consumirDirecaoMenu("up")) {
        tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
        setIndiceLobbyLocal(localLobbyIndexRef.current - 1);
        return;
      }
      if (consumirDirecaoMenu("right") || consumirDirecaoMenu("down")) {
        tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
        setIndiceLobbyLocal(localLobbyIndexRef.current + 1);
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton")) {
        alternarReadySlotLocal();
        return;
      }
      if (botaoControleAcionado("gamepadPauseButton")) {
        abrirSelecaoModoLocal();
        return;
      }
    }

    if (gameStateRef.current === "localModeSelect") {
      if (botaoControleAcionado("gamepadBackButton")) {
        setEstado("localLobby");
        return;
      }
      if (consumirDirecaoMenu("left") || consumirDirecaoMenu("up")) {
        tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
        setIndiceModoLocal(localModeIndexRef.current - 1);
        return;
      }
      if (consumirDirecaoMenu("right") || consumirDirecaoMenu("down")) {
        tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
        setIndiceModoLocal(localModeIndexRef.current + 1);
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton")) {
        iniciarJogo(LOCAL_MODE_OPTIONS[localModeIndexRef.current].mode);
        return;
      }
    }

    if (gameStateRef.current === "settings") {
      if (botaoControleAcionado("gamepadBackButton")) {
        voltarDasConfiguracoes();
        return;
      }
      if (botaoFisicoControleAcionado("4")) {
        selecionarSecaoConfiguracoesRelativa(-1);
        resetarRepeticaoDirecionalMenu();
        return;
      }
      if (botaoFisicoControleAcionado("5")) {
        selecionarSecaoConfiguracoesRelativa(1);
        resetarRepeticaoDirecionalMenu();
        return;
      }
      if (consumirDirecaoMenu("up")) {
        tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
        setIndiceConfiguracao(settingsIndexRef.current - 1);
        return;
      }
      if (consumirDirecaoMenu("down")) {
        tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
        setIndiceConfiguracao(settingsIndexRef.current + 1);
        return;
      }
      if (consumirDirecaoMenu("left")) {
        alterarConfiguracaoAtual(-1);
        return;
      }
      if (consumirDirecaoMenu("right")) {
        alterarConfiguracaoAtual(1);
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton")) {
        alterarConfiguracaoAtual(1);
        return;
      }
    }

    if (gameStateRef.current === "extras") {
      if (botaoControleAcionado("gamepadBackButton")) voltarDosExtras();
      return;
    }

    if (gameStateRef.current === "tutorialChoice") {
      if (consumirDirecaoMenu("left") || consumirDirecaoMenu("up")) {
        tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
        setIndiceTutorialChoice(tutorialChoiceIndexRef.current - 1);
        return;
      }
      if (consumirDirecaoMenu("right") || consumirDirecaoMenu("down")) {
        tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
        setIndiceTutorialChoice(tutorialChoiceIndexRef.current + 1);
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton")) {
        confirmarTutorialChoiceAtual();
        return;
      }
      return;
    }

    if (gameStateRef.current === "storyCutscene") {
      if (botaoControleAcionado("gamepadConfirmButton")) avancarHistoria();
      return;
    }

    if (gameStateRef.current === "playing") {
      if (botaoControleAcionado("gamepadPauseButton")) pausarOuVoltar();
      return;
    }

    if (gameStateRef.current === "paused") {
      if (botaoControleAcionado("gamepadPauseButton")) {
        pausarOuVoltar();
        return;
      }
      if (botaoControleAcionado("gamepadBackButton")) {
        voltarAoMenuPrincipal();
        return;
      }
      if (consumirDirecaoMenu("up")) {
        tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
        setIndicePause(pauseIndexRef.current - 1);
        return;
      }
      if (consumirDirecaoMenu("down")) {
        tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
        setIndicePause(pauseIndexRef.current + 1);
        return;
      }
      if (botaoControleAcionado("gamepadConfirmButton")) {
        executarOpcaoPauseAtual();
        return;
      }
      return;
    }

    if (gameStateRef.current === "gameOver") {
      if (botaoControleAcionado("gamepadConfirmButton")) {
        iniciarJogo(currentModeRef.current ?? "infinite");
        return;
      }
      if (botaoControleAcionado("gamepadBackButton")) voltarAoMenuPrincipal();
      return;
    }

    if (gameStateRef.current === "victory") {
      if (botaoControleAcionado("gamepadConfirmButton"))
        voltarAoMenuPrincipal();
    }
  }

  function textoTutorialDaniel(step: TutorialStep) {
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return TUTORIAL_DANIEL_TEXT[step].mobile;

    if (usandoControleNoTutorial()) {
      if (step === "move")
        return `Daniel na escuta. Pelo controle, mova a Space News com o ${labelControleGamepad("move")}. Quero ver estabilidade antes de liberar combate.`;
      if (step === "shot")
        return `Drone de treino na rota. Aperte ${labelControleGamepad("shot")} para atirar e derrube o alvo.`;
      if (step === "strong")
        return `Formação tripla chegando. Use ${labelControleGamepad("strong")} para soltar o tiro forte. O tiro normal fica bloqueado nesta etapa.`;
      if (step === "boost")
        return `Unidade pesada à frente. Use ${labelControleGamepad("boost")} para ativar o boost e atravessar com decisão.`;
      if (step === "dodge")
        return `Agora é esquiva pura. Aperte ${labelControleGamepad("dodge")} no tempo certo e deixe o inimigo passar.`;
      return TUTORIAL_DANIEL_TEXT.done.pc;
    }

    if (step === "move")
      return `Daniel na escuta. Controle básico primeiro: mova a Space News com ${labelControlePc("move")}. Preciso confirmar estabilidade antes de liberar combate.`;
    if (step === "shot")
      return `Drone de treino chegando. Tiro normal liberado em ${labelControlePc("shot")}. Derrube o alvo sem mudar a rota.`;
    if (step === "strong")
      return `Formação tripla detectada. Use ${labelControlePc("strong")} para romper o grupo. Tiro normal está bloqueado nesta etapa.`;
    if (step === "boost")
      return `Unidade pesada em rota frontal. Use ${labelControlePc("boost")} para atravessar com boost. Entre decidido e saia antes do impacto.`;
    if (step === "dodge")
      return `Nova investida. Agora não ataque. Use ${labelControlePc("dodge")} no tempo certo e deixe o inimigo passar pela sua linha.`;
    return TUTORIAL_DANIEL_TEXT.done.pc;
  }

  function formatarConfiguracao(option: GameSettingOption) {
    const value = settingsSnapshot[option.key];

    if (option.formatter) {
      return option.formatter(value);
    }

    if (option.kind === "padbind") {
      return labelBotaoControle(value);
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

    if (option.kind === "keybind") {
      iniciarCapturaTecla(option.key, option.label);
      return;
    }

    if (option.kind === "padbind") {
      iniciarCapturaBotaoControle(option.key, option.label);
      return;
    }

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
    selecionarSecaoConfiguracoes("ÁUDIO");
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

  function abrirExtras(section: ExtraSection = "home") {
    tocarSom(CONFIG.sounds.menuConfirm, 0.42, "menu");
    setExtrasSection(section);
    if (section === "records") carregarLeaderboardOnline().catch(() => {});
    setLeaderboardOpen(false);
    setEstado("extras");
  }

  function voltarDosExtras() {
    tocarSom(CONFIG.sounds.menuBack, 0.36, "menu");
    setLeaderboardOpen(false);
    setExtrasSection("home");
    setEstado("mainMenu");
  }

  function ordenarLeaderboard(entries: LeaderboardEntry[]) {
    return [...entries]
      .sort(
        (a, b) =>
          b.score - a.score || b.wave - a.wave || a.createdAt - b.createdAt,
      )
      .slice(0, 10);
  }

  function salvarLeaderboardLocal(entries: LeaderboardEntry[]) {
    const ordered = ordenarLeaderboard(entries);
    setLeaderboard(ordered);
    try {
      window.localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(ordered));
    } catch {}
    return ordered;
  }

  async function carregarLeaderboardOnline() {
    setLeaderboardStatus("loading");
    try {
      const response = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!response.ok) throw new Error(`Leaderboard HTTP ${response.status}`);
      const data = (await response.json()) as { entries?: LeaderboardEntry[] };
      const entries = ordenarLeaderboard(
        Array.isArray(data.entries) ? data.entries : [],
      );
      salvarLeaderboardLocal(entries);
      setLeaderboardStatus("online");
      return entries;
    } catch {
      setLeaderboardStatus("offline");
      try {
        const raw = window.localStorage.getItem(LEADERBOARD_KEY);
        const parsed = raw ? (JSON.parse(raw) as LeaderboardEntry[]) : [];
        const entries = ordenarLeaderboard(Array.isArray(parsed) ? parsed : []);
        setLeaderboard(entries);
        return entries;
      } catch {
        setLeaderboard([]);
        return [];
      }
    }
  }

  function pontuacaoQualifica(scoreValue: number, waveValue: number) {
    if (scoreValue <= 0) return false;
    if (leaderboard.length < 10) return true;
    const last = leaderboard[leaderboard.length - 1];
    return (
      scoreValue > last.score ||
      (scoreValue === last.score && waveValue > last.wave)
    );
  }

  async function registrarRecordeAtual() {
    const cleanName = normalizeArcadeInitials(recordName);
    const validationError = validateArcadeInitials(cleanName);
    if (validationError) {
      setRecordError(validationError);
      tocarSom(CONFIG.sounds.menuBack, 0.34, "menu");
      return;
    }
    if (debugUsedRef.current || currentModeRef.current !== "infinite") return;

    setRecordError("");
    const entry: LeaderboardEntry = {
      id: `${Date.now()}-${randomFloat().toString(36).slice(2, 7)}`,
      name: cleanName,
      score: scoreRef.current,
      wave: Math.max(1, gameOverWave),
      createdAt: Date.now(),
    };

    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: localProfileRef.current.id,
          name: entry.name,
          score: entry.score,
          wave: entry.wave,
        }),
      });
      const data = (await response.json()) as {
        entries?: LeaderboardEntry[];
        error?: string;
      };
      if (!response.ok) {
        setRecordError(
          data.error || "Não foi possível registrar essas iniciais.",
        );
        tocarSom(CONFIG.sounds.menuBack, 0.34, "menu");
        return;
      }
      salvarLeaderboardLocal(
        Array.isArray(data.entries) ? data.entries : [entry, ...leaderboard],
      );
      setLeaderboardStatus("online");
    } catch {
      // Sem conexão: mantém o resultado apenas localmente, já validado pelo mesmo filtro.
      salvarLeaderboardLocal([entry, ...leaderboard]);
      setLeaderboardStatus("offline");
    }

    setRecordPromptOpen(false);
    setLeaderboardOpen(true);
    tocarSom(CONFIG.sounds.menuConfirm, 0.5, "menu");
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
          stretchUntil:
            performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
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
          stretchUntil:
            performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
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
          stretchUntil:
            performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs,
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
    tokensRef.current = [];
    nextTokenSpawnAtRef.current = 0;
    enemyProjectilesRef.current = [];
    bossProjectilesRef.current = [];

    if (
      step === "shot" ||
      step === "strong" ||
      step === "boost" ||
      step === "dodge"
    ) {
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

  function tocarVozTutorialDaniel(step: TutorialStep) {
    const voiceByStep: Record<TutorialStep, string> = {
      move: CONFIG.sounds.danielTutorialMoveVoice,
      shot: CONFIG.sounds.danielTutorialShotVoice,
      strong: CONFIG.sounds.danielTutorialStrongVoice,
      boost: CONFIG.sounds.danielTutorialBoostVoice,
      dodge: CONFIG.sounds.danielTutorialDodgeVoice,
      done: CONFIG.sounds.danielTutorialDoneVoice,
    };
    tocarSom(
      CONFIG.sounds.danielRadioOpen || CONFIG.sounds.menuMove,
      0.22,
      "sfx",
    );
    window.setTimeout(() => tocarSom(voiceByStep[step], 0.62, "sfx"), 110);
  }

  function setPassoTutorial(step: TutorialStep) {
    if (tutorialAutoStartRef.current !== null) {
      window.clearTimeout(tutorialAutoStartRef.current);
      tutorialAutoStartRef.current = null;
    }

    tutorialStepRef.current = step;
    prepararPassoTutorial(step);
    setTutorialStep(step);
    tocarVozTutorialDaniel(step);

    if (step === "done") {
      setTutorialLaunchZoom(true);
      tutorialAutoStartRef.current = window.setTimeout(() => {
        if (
          gameStateRef.current === "tutorial" &&
          tutorialStepRef.current === "done"
        ) {
          finalizarTutorialParaJogo();
        }
      }, 1450);
    }
  }

  function avancarPassoTutorial() {
    const currentIndex = TUTORIAL_ORDER.indexOf(tutorialStepRef.current);
    const nextStep =
      TUTORIAL_ORDER[Math.min(currentIndex + 1, TUTORIAL_ORDER.length - 1)];
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
    if (
      gameStateRef.current !== "tutorial" ||
      tutorialStepRef.current === "done"
    )
      return;

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
    tocarSom(
      CONFIG.sounds.tutorialWarning ||
        CONFIG.sounds.menuBack ||
        CONFIG.sounds.playerDamage,
      0.35,
      "menu",
    );
  }

  function acaoTutorialPermitida(
    action: "shot" | "strong" | "boost" | "dodge",
  ) {
    if (gameStateRef.current !== "tutorial") return true;
    const allowed = tutorialStepRef.current === action;
    if (!allowed) {
      resetarTutorialSuave();
    }
    return allowed;
  }

  function obterAudioContext() {
    if (typeof window === "undefined") return null;
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!audioContextRef.current)
      audioContextRef.current = new AudioContextCtor();
    if (audioContextRef.current.state === "suspended")
      audioContextRef.current.resume().catch(() => {});
    return audioContextRef.current;
  }

  function carregarBufferAudio(src: string) {
    const cached = audioBufferCacheRef.current.get(src);
    if (cached) return Promise.resolve(cached);
    const existing = audioBufferLoadingRef.current.get(src);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const context = obterAudioContext();
        if (!context) return null;
        const response = await fetch(assetUrl(src));
        if (!response.ok) return null;
        const buffer = await response.arrayBuffer();
        const decoded = await context.decodeAudioData(buffer.slice(0));
        audioBufferCacheRef.current.set(src, decoded);
        return decoded;
      } catch {
        return null;
      } finally {
        audioBufferLoadingRef.current.delete(src);
      }
    })();

    audioBufferLoadingRef.current.set(src, promise);
    return promise;
  }

  function tocarSomWebAudio(src: string, volume: number) {
    const context = obterAudioContext();
    if (!context) return false;
    const buffer = audioBufferCacheRef.current.get(src);
    if (!buffer) {
      carregarBufferAudio(src).catch(() => {});
      return false;
    }
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);
    return true;
  }

  function tocarSom(
    src: string,
    volume = 0.45,
    category: "menu" | "hit" | "ability" | "sfx" = "sfx",
  ) {
    if (!CONFIG.useSounds || !src || CONFIG.settings.masterVolume <= 0) return;

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
    if (onlineGameplayActiveRef.current && souHostOnline() && category !== "menu") {
      registrarEventoVisualOnline({ kind: "sound", sound: src, volume: finalVolume, category });
    }
    const frequent =
      src.includes("game-shot") ||
      src.includes("enemy-hit") ||
      src.includes("enemy-shot");
    const mobileAudioEvent =
      mobileRuntimeRef.current &&
      (frequent ||
        src.includes("enemy-death") ||
        src.includes("game-explosion") ||
        src.includes("asteroid-break") ||
        src.includes("powerup-spawn") ||
        src.includes("powerup-pickup"));

    if (frequent || mobileAudioEvent) {
      const now = performance.now();
      const minGap = src.includes("game-shot")
        ? mobileRuntimeRef.current
          ? 58
          : 28
        : mobileRuntimeRef.current
          ? 34
          : 18;
      const lastAt = lastSoundPlayedAtRef.current.get(src) ?? -Infinity;
      if (now - lastAt < minGap) return;
      lastSoundPlayedAtRef.current.set(src, now);
      if (tocarSomWebAudio(src, finalVolume)) return;
      carregarBufferAudio(src).catch(() => {});
      // No mobile, não criamos HTMLAudio durante combate. A primeira reprodução
      // pode ser ignorada, mas evita o travamento causado por decodificação tardia.
      if (mobileRuntimeRef.current) return;
    }

    let pool = audioPoolRef.current.get(src);
    if (!pool) {
      const poolSize = frequent ? 10 : 3;
      pool = Array.from({ length: poolSize }, () => {
        const audio = new Audio(assetUrl(src));
        audio.preload = "auto";
        audio.load();
        return audio;
      });
      audioPoolRef.current.set(src, pool);
      audioPoolIndexRef.current.set(src, 0);
    }

    const nextIndex = audioPoolIndexRef.current.get(src) ?? 0;
    const audio = pool[nextIndex % pool.length];
    audioPoolIndexRef.current.set(src, (nextIndex + 1) % pool.length);

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.playbackRate = 0.98 + randomFloat() * 0.04;
      audio.volume = finalVolume;
      audio.play().catch(() => {});
    } catch {}
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
    const reducedAudio =
      window.matchMedia("(pointer: coarse)").matches ||
      String(CONFIG.settings.performanceMode) === "performance";
    if (reducedAudio || powerUpTrailAudiosRef.current.size >= 2) return;

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
    if (!CONFIG.forceFullscreen) return;

    const doc = document as FullscreenCapableDocument;
    const target = (document.querySelector(".game-fullscreen-page") ??
      document.documentElement) as FullscreenCapableElement;

    if (isIOSLikeDevice()) {
      document.documentElement.classList.add(
        "sn-ios-game-active",
        "sn-pseudo-fullscreen",
      );
      document.body.classList.add("sn-ios-game-active", "sn-pseudo-fullscreen");
      window.scrollTo(0, 1);
    }

    try {
      if (!document.fullscreenElement && !doc.webkitFullscreenElement) {
        if (typeof target.requestFullscreen === "function") {
          await target.requestFullscreen();
        } else if (typeof target.webkitRequestFullscreen === "function") {
          await target.webkitRequestFullscreen();
        } else {
          document.documentElement.classList.add("sn-pseudo-fullscreen");
          document.body.classList.add("sn-pseudo-fullscreen");
        }
      }
    } catch {
      document.documentElement.classList.add("sn-pseudo-fullscreen");
      document.body.classList.add("sn-pseudo-fullscreen");
    }
  }

  function pararLoopAudio(
    ref: { current: HTMLAudioElement | null },
    reset = true,
  ) {
    const audio = ref.current;
    if (!audio) return;
    audio.pause();
    if (reset) audio.currentTime = 0;
  }

  function tocarLoopAudio(
    ref: { current: HTMLAudioElement | null },
    src: string | undefined,
    volumeBase: number,
  ) {
    if (!CONFIG.useSounds || !src || CONFIG.settings.masterVolume <= 0) return;
    if (!ref.current || ref.current.dataset.src !== src) {
      pararLoopAudio(ref, true);
      const audio = new Audio(assetUrl(src));
      audio.dataset.src = src;
      audio.loop = true;
      audio.preload = "auto";
      ref.current = audio;
    }
    ref.current.volume = clamp(
      volumeBase * CONFIG.settings.masterVolume * CONFIG.settings.musicVolume,
      0,
      1,
    );
    ref.current.play().catch(() => {});
  }

  function pararAlarmeLowHp(reset = true) {
    const audio = alarmAudioRef.current;
    if (!audio) return;
    audio.pause();
    if (reset) audio.currentTime = 0;
  }

  function retomarAudioDoJogo() {
    obterAudioContext()
      ?.resume()
      .catch(() => {});

    const loops = [
      ambientAudioRef,
      gameplayMusicAudioRef,
      bossMusicAudioRef,
      bossHumAudioRef,
      flamesLoopAudioRef,
    ];

    for (const ref of loops) {
      const audio = ref.current;
      if (!audio || !audio.src || !audio.paused) continue;
      audio.play().catch(() => {});
    }
  }

  function tocarAmbienteEspacial() {
    tocarLoopAudio(ambientAudioRef, CONFIG.sounds.spaceAmbience, 0.16);
  }

  function tocarMusicaDoModo(mode: GameMode | null) {
    tocarLoopAudio(
      gameplayMusicAudioRef,
      mode === "story" ? CONFIG.sounds.storyMusic : CONFIG.sounds.infiniteMusic,
      0.42,
    );
  }

  function tocarHumChocado(faseDois = false) {
    tocarLoopAudio(
      bossHumAudioRef,
      faseDois
        ? CONFIG.sounds.chocadoPhaseTwoLoop
        : CONFIG.sounds.chocadoIdleLoop,
      faseDois ? 0.18 : 0.12,
    );
  }

  function pararCamadasDeAudio(reset = true) {
    pararLoopAudio(ambientAudioRef, reset);
    pararLoopAudio(gameplayMusicAudioRef, reset);
    pararLoopAudio(bossHumAudioRef, reset);
  }

  function tocarVozHitChocado() {
    const now = performance.now();
    if (now - lastBossHitVoiceAtRef.current < 420) return;
    lastBossHitVoiceAtRef.current = now;
    const opcoes = [
      CONFIG.sounds.chocadoHitOne,
      CONFIG.sounds.chocadoHitTwo,
      CONFIG.sounds.chocadoHitThree,
      CONFIG.sounds.chocadoHit,
    ].filter(Boolean);
    tocarSom(opcoes[Math.floor(randomFloat() * opcoes.length)], 0.18, "hit");
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
        0.78 * CONFIG.settings.masterVolume * CONFIG.settings.musicVolume,
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
    const shiftIfFuture = (value: number) =>
      value > 0 ? value + elapsed : value;

    player.invincibleUntil = shiftIfFuture(player.invincibleUntil);
    player.dodgeUntil = shiftIfFuture(player.dodgeUntil);
    player.boostUntil = shiftIfFuture(player.boostUntil);
    player.strongReadyAt = shiftIfFuture(player.strongReadyAt);
    player.stretchUntil = shiftIfFuture(player.stretchUntil);
    player.capturedUntil = shiftIfFuture(player.capturedUntil);
    player.throwUntil = shiftIfFuture(player.throwUntil);
    player.alienCaptureCooldownUntil = shiftIfFuture(
      player.alienCaptureCooldownUntil,
    );

    fireRateUntilRef.current = shiftIfFuture(fireRateUntilRef.current);
    powerShotUntilRef.current = shiftIfFuture(powerShotUntilRef.current);
    homingShotUntilRef.current = shiftIfFuture(homingShotUntilRef.current);
    flamesUntilRef.current = shiftIfFuture(flamesUntilRef.current);
    petSuperSparkUntilRef.current = shiftIfFuture(petSuperSparkUntilRef.current);
    petAbilityCooldownUntilRef.current = shiftIfFuture(petAbilityCooldownUntilRef.current);
    petBlackHolePullUntilRef.current = shiftIfFuture(petBlackHolePullUntilRef.current);
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

    bossProjectilesRef.current = bossProjectilesRef.current.map(
      (projectile) => ({
        ...projectile,
        activeAt: projectile.activeAt
          ? projectile.activeAt + elapsed
          : projectile.activeAt,
        homingUntil: projectile.homingUntil
          ? projectile.homingUntil + elapsed
          : projectile.homingUntil,
        returnAt: projectile.returnAt
          ? projectile.returnAt + elapsed
          : projectile.returnAt,
      }),
    );

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
    damageNumbersRef.current = [];
    shockwavesRef.current = [];
    bossProjectilesRef.current = [];
    powerUpsRef.current = [];
    pararTodosPowerUpTrails();
    pararAlarmeLowHp(true);
    fireRateUntilRef.current = 0;
    powerShotUntilRef.current = 0;
    homingShotUntilRef.current = 0;
    flamesUntilRef.current = 0;
    petSuperSparkUntilRef.current = 0;
    petAbilityCooldownUntilRef.current = 0;
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
    bossIntroSequenceRef.current.active = false;
    bossIntroSequenceRef.current.stage = "idle";
    bossDefeatSequenceRef.current = {
      active: false,
      startAt: 0,
      stage: "idle",
      lastBurstAt: 0,
      finalTriggered: false,
    };
    setBossCinematicStage("idle");
    setBossDefeatStage("idle");
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
    pararCamadasDeAudio(true);
  }

  function resetarWaves(mode: GameMode | null) {
    const now = performance.now();
    const isInfinite = mode === "infinite" || isLocalWaveMode(mode);
    const isStory = mode === "story";
    const isPvp = mode === "localPvp";
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
    const initialMessage = isPvp
      ? "VERSUS"
      : isInfinite
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
      nextWaveAt: mode && !isPvp ? now + firstDelay : 0,
      difficulty: 1,
      bossWave: false,
      messageUntil: mode && !isPvp ? now + messageMs : 0,
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

  function finalizarTutorialParaJogo() {
    const mode = currentModeRef.current ?? "story";
    const now = performance.now();
    const player = playerRef.current;

    // Mantém player e panorama: o tutorial já acontece dentro do gameplay.
    shotsRef.current = [];
    enemiesRef.current = [];
    enemyProjectilesRef.current = [];
    bossProjectilesRef.current = [];
    powerUpsRef.current = [];
    tokensRef.current = [];
    nextTokenSpawnAtRef.current = 0;
    player.vx *= 0.35;
    player.vy *= 0.35;
    player.normalCooldown = 0;
    player.invincibleUntil = now + 1100;

    resetarWaves(mode);
    waveStateRef.current.nextWaveAt = now + 900;
    waveStateRef.current.message = "";
    waveStateRef.current.messageUntil = 0;
    setWaveUi({
      mode,
      wave: 0,
      active: false,
      bossWave: false,
      message: "",
    });

    strongCooldownRef.current = 0;
    setStrongCooldown(0);
    boostChargeRef.current = CONFIG.gameplay.boost.startCharge;
    setBoostCharge(CONFIG.gameplay.boost.startCharge);
    setTutorialLaunchZoom(false);
    setEstado("playing");
  }

  function iniciarJogo(mode: GameMode = currentModeRef.current ?? "infinite") {
    if (mode === "localPvp") {
      bloquearVersusTemporariamente();
      mode = "localCoop";
    }
    solicitarFullscreen();
    currentModeRef.current = mode;

    const player = createInitialPlayer();
    playerRef.current = player;
    player2Ref.current = isLocalMode(mode) ? criarPlayer2Inicial() : null;

    limparCombate();
    resetarWaves(mode);
    tokensRef.current = [];
    nextTokenSpawnAtRef.current = 0;

    strongCooldownRef.current = 0;
    setStrongCooldown(0);
    scoreRef.current = 0;
    setScore(0);
    atualizarStatsPerfilLocal((stats) => ({ ...stats, runsStarted: stats.runsStarted + 1 }));
    localP1ScoreRef.current = 0;
    localP2ScoreRef.current = 0;
    localPvpRoundRef.current = 1;
    localPvpMatchLockedRef.current = false;
    setLocalP1Score(0);
    setLocalP2Score(0);
    setLocalPvpRound(1);
    boostChargeRef.current = CONFIG.gameplay.boost.startCharge;
    setBoostCharge(CONFIG.gameplay.boost.startCharge);
    abilityReadyRef.current = {
      boost:
        CONFIG.gameplay.boost.startCharge >= CONFIG.gameplay.boost.maxCharge,
      dodge: true,
      strong: true,
    };
    if (isLocalMode(mode)) {
      resetarPosicoesLocais();
      setLocalModeNotice(
        mode === "localCoop"
          ? "Coop local: Player 2 entra por controle ou teclado."
          : mode === "localScore"
            ? "Disputa local: cada abate conta para quem acertou."
            : "VERSUS: mire em diagonal, dispute power-ups no centro e use Forte/Boost para finalizar.",
      );
      window.setTimeout(() => setLocalModeNotice(""), 4200);
    } else {
      setPlayerHp(player.hp);
      setGoldenHp(player.goldenHp);
      setPlayer2Hp(vidaMaximaLocal());
      setLocalModeNotice("");
    }
    setRandomVisualEffect({
      flashWhite: false,
      flashBlur: false,
      inverted: false,
    });
    slowPlayerUntilRef.current = 0;
    setIsLowHp(false);
    pararAlarmeLowHp(true);
    setGameOverFlash(false);
    setFlashSnapshot("");
    setGameOverTaunt(GAME_OVER_TAUNTS[0]);
    setGameOverWave(0);
    debugSequenceRef.current = "";
    debugUnlockedRef.current = false;
    debugUsedRef.current = false;
    recordPromptShownRef.current = false;
    setRecordPromptOpen(false);
    setLeaderboardOpen(false);
    setDebugNotice("");

    setEstado("playing");
    tocarAmbienteEspacial();
    tocarMusicaDoModo(mode);
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
    tokensRef.current = [];
    nextTokenSpawnAtRef.current = 0;
    setEstado("tutorial");
    tocarAmbienteEspacial();
    tocarMusicaDoModo("story");
  }

  function iniciarGameOverCutscene() {
    const player = playerRef.current;
    const now = performance.now();
    const waveDied = Math.max(0, waveStateRef.current.wave);
    atualizarStatsPerfilLocal((stats) => ({
      ...stats,
      deaths: stats.deaths + 1,
      bestInfiniteWave: currentModeRef.current === "infinite" ? Math.max(stats.bestInfiniteWave, waveDied) : stats.bestInfiniteWave,
      bestInfiniteScore: currentModeRef.current === "infinite" ? Math.max(stats.bestInfiniteScore, scoreRef.current) : stats.bestInfiniteScore,
    }));

    setGameOverWave(waveDied);
    setGameOverTaunt(
      GAME_OVER_TAUNTS[Math.floor(randomFloat() * GAME_OVER_TAUNTS.length)],
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
      pararAlarmeLowHp(true);
    }

    tocarSom(
      CONFIG.sounds.gameOverExplosion ||
        CONFIG.sounds.explosion ||
        CONFIG.sounds.enemyDeath,
      0.68,
      "hit",
    );

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

    const equippedDefense = (!isLocalPvpMode() && !forcarHpUm) ? buffsCosmeticosEquipados().defense : 0;
    const danoEfetivo = equippedDefense ? Math.max(0.25, dano * (1 - equippedDefense)) : dano;

    if (shieldActiveRef.current) {
      shieldActiveRef.current = false;
      setShieldActive(false);
      player.invincibleUntil = now + 650;
      tocarSom(
        CONFIG.sounds.shieldBreak || CONFIG.sounds.playerDamage,
        0.55,
        "ability",
      );
      criarExplosao(
        player.x + player.w / 2,
        player.y + player.h / 2,
        "#a7f3d0",
        22,
      );
      shakeRef.current = { intensity: 4, endAt: now + 140 };
      return;
    }

    if (player.goldenHp > 0) {
      player.goldenHp = Math.max(
        0,
        player.goldenHp - Math.max(1, Math.ceil(danoEfetivo)),
      );
      setGoldenHp(player.goldenHp);
      player.invincibleUntil = now + (isLocalPvpMode() ? 80 : CONFIG.gameplay.player.invincibleMs);
      tocarSom(
        CONFIG.sounds.goldenHeart || CONFIG.sounds.playerDamage,
        0.45,
        "ability",
      );
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
      player.hp = Math.max(0, player.hp - danoEfetivo);
    }

    player.invincibleUntil = now + CONFIG.gameplay.player.invincibleMs;
    setPlayerHp(player.hp);
    setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");

    if (
      player.hp > 0 &&
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
      if (isLocalPvpMode()) {
        localP2ScoreRef.current += 1;
        setLocalP2Score(localP2ScoreRef.current);
        setLocalModeNotice("PLAYER 2 MARCOU!");
        window.setTimeout(() => {
          resetarPosicoesLocais();
          setLocalModeNotice("");
        }, 900);
      } else if (onlineTogetherCoordenado()) {
        tratarMorteCoopOnline(player, "AGUARDE REVIVE / PRÓXIMA WAVE");
      } else if (isLocalWaveMode() && player2Ref.current && player2Ref.current.hp > 0) {
        player.invincibleUntil = performance.now() + 999999;
      } else {
        iniciarGameOverCutscene();
      }
    }
  }

  function limparContagemRetomada() {
    if (resumeCountdownTimerRef.current !== null) {
      window.clearTimeout(resumeCountdownTimerRef.current);
      resumeCountdownTimerRef.current = null;
    }
    resumeCountdownActiveRef.current = false;
    setResumeCountdown(null);
  }

  function finalizarRetomada() {
    const elapsed = performance.now() - pauseStartedAtRef.current;
    deslocarTemposDeJogo(elapsed);
    pauseStartedAtRef.current = 0;
    limparContagemRetomada();
    tocarSom(CONFIG.sounds.menuConfirm, 0.4, "menu");
    if (
      bossRef.current.active &&
      bossRef.current.hp > 0 &&
      !bossRef.current.defeated
    ) {
      tocarMusicaChocado();
      tocarHumChocado(
        bossRef.current.hp <= CONFIG.gameplay.boss.chocado.enragedHp,
      );
    } else {
      tocarAmbienteEspacial();
      tocarMusicaDoModo(currentModeRef.current);
    }
    setEstado("playing");
    setIsLowHp(playerRef.current.hp <= 1);
  }

  function iniciarContagemRetomada() {
    if (resumeCountdownActiveRef.current) return;
    if (!isLocalPvpMode()) {
      finalizarRetomada();
      return;
    }
    const seconds = clamp(Number(CONFIG.settings.resumeCountdown) || 0, 0, 3);
    if (seconds <= 0) {
      finalizarRetomada();
      return;
    }

    resumeCountdownActiveRef.current = true;
    const tick = (remaining: number) => {
      setResumeCountdown(remaining);
      tocarSom(
        remaining > 0 ? CONFIG.sounds.menuMove : CONFIG.sounds.menuConfirm,
        remaining > 0 ? 0.28 : 0.46,
        "menu",
      );
      if (remaining <= 0) {
        resumeCountdownTimerRef.current = window.setTimeout(
          finalizarRetomada,
          320,
        );
        return;
      }
      resumeCountdownTimerRef.current = window.setTimeout(
        () => tick(remaining - 1),
        820,
      );
    };
    tick(seconds);
  }

  function pausarOuVoltar() {
    if (gameStateRef.current === "playing") {
      if (onlineGameplayActiveRef.current) {
        enviarOnline({ type: "pause_request" });
        const mySlot = onlineSlotRef.current || 1;
        const nextReady = Array.from(new Set([...onlinePauseReadySlotsRef.current, mySlot])).filter(Boolean);
        onlinePauseReadySlotsRef.current = nextReady;
        onlinePauseRequestedByRef.current = onlinePauseRequestedByRef.current || mySlot;
        onlinePausePanelOpenRef.current = true;
        setOnlinePauseReadySlots(nextReady);
        setOnlinePauseRequestedBy(onlinePauseRequestedByRef.current);
        setOnlinePausePanelOpen(true);
        setOnlineStatus(`P${mySlot} pediu pause. A partida continua até todos aceitarem.`);
        tocarSom(CONFIG.sounds.menuConfirm, 0.34, "menu");
        return;
      }
      tocarSom(CONFIG.sounds.pause, 0.45);
      pauseStartedAtRef.current = performance.now();
      pararMusicaChocado(false);
      ambientAudioRef.current?.pause();
      gameplayMusicAudioRef.current?.pause();
      bossHumAudioRef.current?.pause();
      limparContagemRetomada();
      setIndicePause(0);
      setEstado("paused");
      setIsLowHp(false);
      pararAlarmeLowHp(false);
      return;
    }

    if (gameStateRef.current === "paused") {
      if (onlineGameplayActiveRef.current && onlinePauseRequestedByRef.current) {
        enviarOnline({ type: "pause_ready", ready: true });
        const nextReady = Array.from(new Set([...onlinePauseReadySlotsRef.current, onlineSlotRef.current])).filter(Boolean);
        onlinePauseReadySlotsRef.current = nextReady;
        setOnlinePauseReadySlots(nextReady);
        return;
      }
      iniciarContagemRetomada();
    }
  }

  function voltarAoMenuPrincipal() {
    limparContagemRetomada();
    tocarSom(CONFIG.sounds.menuBack, 0.45, "menu");
    limparCombate();
    resetarWaves(null);
    setIsLowHp(false);
    pararAlarmeLowHp(true);
    setGameOverFlash(false);
    encerrarGameplayOnline();
    setEstado("mainMenu");
    setIndiceMenu(0);
    setEscurecendo(false);
    tocarLoopAudio(ambientAudioRef, CONFIG.sounds.menuAmbience, 0.14);

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

  function sincronizarScoreUi(force = false) {
    if (!mobileRuntimeRef.current || force) {
      setScore(scoreRef.current);
      return;
    }

    if (scoreUiTimerRef.current !== null) return;
    scoreUiTimerRef.current = window.setTimeout(() => {
      scoreUiTimerRef.current = null;
      setScore(scoreRef.current);
    }, 120);
  }

  function sincronizarBoostUi(force = false) {
    if (!mobileRuntimeRef.current || force) {
      setBoostCharge(boostChargeRef.current);
      return;
    }

    if (boostUiTimerRef.current !== null) return;
    boostUiTimerRef.current = window.setTimeout(() => {
      boostUiTimerRef.current = null;
      setBoostCharge(boostChargeRef.current);
    }, 90);
  }

  function adicionarPontuacao(valor: number, ownerId: PlayerSlot = 1) {
    scoreRef.current += valor;

    if (isLocalMode()) {
      if (ownerId === 2) {
        localP2ScoreRef.current += valor;
        setLocalP2Score(localP2ScoreRef.current);
      } else {
        localP1ScoreRef.current += valor;
        setLocalP1Score(localP1ScoreRef.current);
      }
    }

    sincronizarScoreUi();
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
    const becameReady = !wasReady && next >= CONFIG.gameplay.boost.maxCharge;
    sincronizarBoostUi(becameReady);

    if (becameReady) {
      tocarSomHabilidadePronta("boost");
      abilityReadyRef.current.boost = true;
    }
  }

  function registrarAbate(kind: EnemyKind, ownerId: PlayerSlot = 1) {
    adicionarPontuacao(CONFIG.gameplay.score[kind], ownerId);
    atualizarStatsPerfilLocal((stats) => ({ ...stats, enemiesKilled: stats.enemiesKilled + 1 }));
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
    if (
      gameStateRef.current !== "playing" &&
      gameStateRef.current !== "tutorial"
    )
      return;
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
    if (
      gameStateRef.current !== "playing" &&
      gameStateRef.current !== "tutorial"
    )
      return;
    if (!acaoTutorialPermitida("boost")) return;

    if (
      !ignoreFullChargeCheck &&
      boostChargeRef.current < CONFIG.gameplay.boost.maxCharge
    ) {
      return;
    }

    const player = playerRef.current;
    const now = performance.now();
    const dir = normalizarDirecao(dirXParam, dirYParam);
    const power = clamp(chargeRatio, 0.22, 1);
    const durationMultiplier = 0.55 + power * 1.55;

    player.boostUntil =
      now + CONFIG.gameplay.boost.durationMs * durationMultiplier;
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

    if (
      gameStateRef.current === "tutorial" &&
      tutorialStepRef.current === "boost"
    ) {
      avancarPassoTutorial();
    }
  }

  function executarEsquiva() {
    if (!CONFIG.gameplay.dodge.enabled) return;
    if (
      gameStateRef.current !== "playing" &&
      gameStateRef.current !== "tutorial"
    )
      return;
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

    if (
      gameStateRef.current === "tutorial" &&
      tutorialStepRef.current === "dodge"
    ) {
      avancarPassoTutorial();
    }
  }

  function atualizarJoystick(event: ReactPointerEvent<HTMLDivElement>) {
    let geometry = joystickGeometryRef.current;
    if (!geometry) {
      const rect = event.currentTarget.getBoundingClientRect();
      geometry = {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        maxDistance: rect.width * 0.36,
      };
      joystickGeometryRef.current = geometry;
    }

    const rawX = event.clientX - geometry.centerX;
    const rawY = event.clientY - geometry.centerY;
    const distance = Math.max(1, Math.hypot(rawX, rawY));
    const limitedDistance = Math.min(distance, geometry.maxDistance);
    const x = (rawX / distance) * limitedDistance;
    const y = (rawY / distance) * limitedDistance;

    mobileMoveRef.current = {
      x: clamp(x / geometry.maxDistance, -1, 1),
      y: clamp(y / geometry.maxDistance, -1, 1),
    };

    const knob = mobileStickKnobRef.current;
    if (knob) {
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    }
  }

  function resetarJoystick() {
    mobileMoveRef.current = { x: 0, y: 0 };
    joystickGeometryRef.current = null;
    const knob = mobileStickKnobRef.current;
    if (knob) knob.style.transform = "translate(-50%, -50%)";
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
      tocarLoopAudio(ambientAudioRef, CONFIG.sounds.menuAmbience, 0.14);

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

    if (option.action === "multiplayer") {
      abrirMultiplayer();
      return;
    }

    if (option.action === "extras") {
      abrirExtras();
      return;
    }

    if (option.action === "shop") {
      tocarSom(CONFIG.sounds.menuConfirm, 0.32, "menu");
      setShopTab("front");
      setShopMode("store");
      setShopPreviewItemId("");
      setShopManagerOpen(true);
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

    setIndiceTutorialChoice(0);
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
      const rotationDirection = randomFloat() > 0.5 ? 1 : -1;

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

    const requestedAmount = mobileRuntimeRef.current
      ? Math.min(amount, 5)
      : amount;
    const finalAmount = Math.max(
      0,
      Math.round(requestedAmount * CONFIG.settings.particleQuality),
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
    registrarEventoVisualOnline({ kind: "explosion", x, y, color: color || "#ffe18c", amount });
    if (!CONFIG.settings.enableParticles) {
      return;
    }

    const mobileCap = amount >= 60 ? 18 : amount >= 20 ? 10 : 7;
    const requestedAmount = mobileRuntimeRef.current
      ? Math.min(amount, mobileCap)
      : amount;
    const finalAmount = Math.max(
      0,
      Math.round(requestedAmount * CONFIG.settings.particleQuality),
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
        color: randomFloat() > 0.45 ? "#a7ff83" : "#5dff7a",
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
      Math.abs(dirY) < 0.22 ? (randomFloat() > 0.5 ? 0.62 : -0.62) : dirY;

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
      (0.85 + randomFloat() * 0.55);
    enemy.stretchUntil =
      performance.now() + CONFIG.gameplay.dynamicStretch.enemyPulseMs;
  }

  function aplicarShockwaveDeTiroForte(originX: number, originY: number) {
    const strongCfg = CONFIG.gameplay.shots.strong;
    const radius = strongCfg.shockwaveRadius ?? 230;
    const force = strongCfg.shockwaveKnockback ?? 8.5;
    const spin = strongCfg.shockwaveSpin ?? 0.018;

    registrarEventoVisualOnline({ kind: "shockwave", x: originX, y: originY, radius, color: "#fff1a8", amount: 12 });
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
        adicionarPontuacao(
          Math.ceil(applied * (strongCfg.shockwaveDamageScore ?? 25)),
        );
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

  function limparTimersRevelacaoBoss() {
    for (const timeoutId of storyBossRevealTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    storyBossRevealTimeoutsRef.current = [];

    if (bossDanielTimeoutRef.current !== null) {
      window.clearTimeout(bossDanielTimeoutRef.current);
      bossDanielTimeoutRef.current = null;
    }

    if (bossTipTimeoutRef.current !== null) {
      window.clearTimeout(bossTipTimeoutRef.current);
      bossTipTimeoutRef.current = null;
    }
    setBossTipVisible(false);
    bossIntroSequenceRef.current.active = false;
    bossIntroSequenceRef.current.stage = "idle";
    setBossCinematicStage("idle");
  }

  function mostrarDanielBoss(
    line: { text: string; expression: DanielExpression; voice?: string },
    durationMs = 3600,
  ) {
    if (bossDanielTimeoutRef.current !== null) {
      window.clearTimeout(bossDanielTimeoutRef.current);
    }

    tocarSom(
      CONFIG.sounds.danielRadioOpen || CONFIG.sounds.menuMove,
      0.26,
      "sfx",
    );
    const voice = line.voice;
    if (voice) {
      window.setTimeout(() => tocarSom(voice, 0.72, "sfx"), 120);
    }

    setBossDanielLine({
      text: line.text,
      expression: line.expression,
      visible: true,
    });

    bossDanielTimeoutRef.current = window.setTimeout(() => {
      tocarSom(
        CONFIG.sounds.danielRadioClose || CONFIG.sounds.menuBack,
        0.16,
        "sfx",
      );
      setBossDanielLine((current) => ({ ...current, visible: false }));
      bossDanielTimeoutRef.current = null;
    }, durationMs);
  }

  function mostrarDanielBossSeLivre(
    line: { text: string; expression: DanielExpression },
    durationMs = 3200,
  ) {
    if (bossDanielLine.visible || bossDanielTimeoutRef.current !== null) return;
    mostrarDanielBoss(line, durationMs);
  }

  function mostrarBossTipInicial() {
    if (bossTipTimeoutRef.current !== null) {
      window.clearTimeout(bossTipTimeoutRef.current);
    }

    setBossTipVisible(true);
    tocarSom(
      CONFIG.sounds.chocadoTipOpen ||
        CONFIG.sounds.bossUiBeep ||
        CONFIG.sounds.menuMove,
      0.34,
      "sfx",
    );

    bossTipTimeoutRef.current = window.setTimeout(() => {
      setBossTipVisible(false);
      bossTipTimeoutRef.current = null;
    }, 10000);
  }

  function iniciarRevelacaoChocadoHistoria() {
    const now = performance.now();
    const wave = waveStateRef.current;
    const player = playerRef.current;

    limparTimersRevelacaoBoss();
    limparCombate();

    wave.active = false;
    wave.queue = [];
    wave.nextWaveAt = 0;
    wave.bossWave = false;
    wave.message = "MISSÃO CONCLUÍDA";
    wave.messageUntil = now + 2300;

    setWaveUi({
      mode: "story",
      wave: CONFIG.gameplay.storyWaves.normalWaves,
      active: false,
      bossWave: false,
      message: wave.message,
    });

    player.vx = 0;
    player.vy = 0;
    player.invincibleUntil = now + 20000;
    bossIntroSequenceRef.current = {
      active: true,
      startAt: now,
      stage: "falseClear",
      lastStage: "idle",
      playerStartX: player.x,
      playerStartY: player.y,
      bossTargetX: CONFIG.canvasWidth - CONFIG.gameplay.boss.chocado.width - 8,
      baseBackgroundOffset: backgroundOffsetRef.current,
      impactTriggered: false,
    };
    setBossCinematicStage("falseClear");
    mostrarDanielBoss(BOSS_DANIEL_LINES.falseClear, 2300);
  }

  function atualizarCutsceneChocado(delta: number) {
    const sequence = bossIntroSequenceRef.current;
    if (!sequence.active) return false;

    const now = performance.now();
    const elapsed = now - sequence.startAt;
    const player = playerRef.current;
    const boss = bossRef.current;
    const targetX = sequence.bossTargetX;

    let stage: BossIntroStage = "falseClear";
    if (elapsed >= 1900) stage = "sensor";
    if (elapsed >= 3500) stage = "approach";
    if (elapsed >= 4350) stage = "grab";
    if (elapsed >= 5350) stage = "drag";
    if (elapsed >= 7600) stage = "throw";
    if (elapsed >= 9000) stage = "impact";
    if (elapsed >= 10250) stage = "battle";

    if (stage !== sequence.stage) {
      sequence.lastStage = sequence.stage;
      sequence.stage = stage;
      setBossCinematicStage(stage);

      if (stage === "sensor") {
        mostrarDanielBoss(BOSS_DANIEL_LINES.sensor, 1700);
        tocarSom(
          CONFIG.sounds.danielRadioStatic || CONFIG.sounds.tutorialWarning,
          0.38,
          "sfx",
        );
      }

      if (stage === "approach") {
        waveStateRef.current = {
          ...waveStateRef.current,
          mode: "story",
          active: true,
          wave: CONFIG.gameplay.storyWaves.bossWave,
          bossWave: true,
          queue: [],
          message: "",
          messageUntil: 0,
        };
        setWaveUi({
          mode: "story",
          wave: CONFIG.gameplay.storyWaves.bossWave,
          active: true,
          bossWave: true,
          message: "",
        });
        spawnBossChocado(true);
        bossRef.current.x = CONFIG.canvasWidth + 80;
        bossRef.current.intro = true;
        bossRef.current.nextAttackAt = now + 999999;
        mostrarDanielBoss(BOSS_DANIEL_LINES.warning, 2200);
        tocarSom(
          CONFIG.sounds.chocadoWarning || CONFIG.sounds.chocadoRoar,
          0.68,
          "sfx",
        );
      }

      if (stage === "grab") {
        tocarMusicaChocado();
        tocarSom(
          CONFIG.sounds.chocadoGrab || CONFIG.sounds.chocadoRoar,
          0.9,
          "sfx",
        );
        player.stretchUntil = now + 900;
        player.stretchVx = -15;
        player.stretchVy = 0;
        shakeRef.current = { intensity: 10, endAt: now + 800 };
      }

      if (stage === "drag") {
        tocarSom(
          CONFIG.sounds.chocadoDash || CONFIG.sounds.chocadoGrab,
          0.82,
          "sfx",
        );
        shakeRef.current = { intensity: 15, endAt: now + 2100 };
      }

      if (stage === "throw") {
        tocarSom(
          CONFIG.sounds.chocadoRelease || CONFIG.sounds.chocadoDash,
          0.75,
          "sfx",
        );
        criarExplosao(
          player.x + player.w * 0.5,
          player.y + player.h * 0.5,
          "#fff1a8",
          28,
        );
      }

      if (stage === "impact" && !sequence.impactTriggered) {
        sequence.impactTriggered = true;
        shockwavesRef.current.push({
          id: enemyIdRef.current++,
          x: CONFIG.canvasWidth * 0.42,
          y: CONFIG.canvasHeight * 0.5,
          radius: 480,
          life: 760,
          maxLife: 760,
        });
        shakeRef.current = { intensity: 8, endAt: now + 620 };
      }
    }

    boss.age += delta;

    if (stage === "approach") {
      // O Chocado entra rápido e, assim que fica visível, já inicia o agarrão.
      const p = clamp((elapsed - 3500) / 850, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      boss.x =
        CONFIG.canvasWidth + 80 + (targetX - (CONFIG.canvasWidth + 80)) * eased;
      boss.y = (CONFIG.canvasHeight - boss.h) / 2;
      backgroundOffsetRef.current -= delta * (0.3 + p * 0.75);
    } else if (stage === "grab") {
      const p = clamp((elapsed - 4350) / 1000, 0, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      boss.x = targetX;
      const gripX = boss.x + boss.w * 0.08 - player.w * 0.55;
      const gripY = boss.y + boss.h * 0.5 - player.h * 0.5;
      player.x =
        sequence.playerStartX + (gripX - sequence.playerStartX) * eased;
      player.y =
        sequence.playerStartY + (gripY - sequence.playerStartY) * eased;
      backgroundOffsetRef.current -= delta * 1.05;
    } else if (stage === "drag") {
      const p = clamp((elapsed - 5350) / 2250, 0, 1);
      boss.x = targetX - Math.sin(p * Math.PI) * 120;
      boss.y =
        (CONFIG.canvasHeight - boss.h) / 2 + Math.sin(p * Math.PI * 2) * 14;
      player.x = boss.x + boss.w * 0.08 - player.w * 0.55;
      player.y = boss.y + boss.h * 0.5 - player.h * 0.5;
      player.tilt = -0.2;
      backgroundOffsetRef.current -=
        delta * (2.25 + Math.sin(p * Math.PI) * 1.15);
      if (
        CONFIG.settings.enableParticles &&
        randomFloat() <
          (window.matchMedia("(pointer: coarse)").matches ? 0.12 : 0.32)
      ) {
        particlesRef.current.push({
          id: enemyIdRef.current++,
          x: player.x + player.w * 0.35,
          y: player.y + player.h * rand(0.25, 0.75),
          vx: rand(5, 9),
          vy: rand(-1.5, 1.5),
          size: rand(3, 7),
          life: 360,
          maxLife: 360,
          color: randomFloat() < 0.5 ? "#ff4fd8" : "#60eaff",
        });
      }
    } else if (stage === "throw") {
      // Em vez de parecer uma troca de cenário, o jogador volta suavemente ao centro-esquerda.
      const p = clamp((elapsed - 7600) / 1400, 0, 1);
      const eased = p * p * (3 - 2 * p);
      const startX = targetX - 65;
      const startY = boss.y + boss.h * 0.5 - player.h * 0.5;
      const endX = CONFIG.canvasWidth * 0.36 - player.w * 0.5;
      const endY = CONFIG.canvasHeight * 0.52 - player.h * 0.5;
      player.x = startX + (endX - startX) * eased;
      player.y = startY + (endY - startY) * eased - Math.sin(p * Math.PI) * 54;
      player.tilt = -0.3 * (1 - p);
      boss.x = targetX + p * 42;
      backgroundOffsetRef.current -= delta * 0.55;
    } else if (stage === "impact") {
      const p = clamp((elapsed - 9000) / 1250, 0, 1);
      const endX = 150;
      const endY = CONFIG.canvasHeight / 2 - player.h / 2;
      player.x += (endX - player.x) * Math.min(1, 0.045 + p * 0.06);
      player.y += (endY - player.y) * Math.min(1, 0.045 + p * 0.06);
      player.tilt *= 0.85;
      boss.x += (targetX - boss.x) * 0.08;
    } else if (stage === "battle") {
      sequence.active = false;
      setBossCinematicStage("idle");
      player.x = 150;
      player.y = CONFIG.canvasHeight / 2 - player.h / 2;
      player.vx = 2.4;
      player.vy = 0;
      player.tilt = 0;
      player.invincibleUntil = now + 1500;
      boss.x = targetX;
      // Na história a barra já entra praticamente cheia: sem uma segunda espera longa.
      boss.intro = false;
      boss.battleStartedAt = now;
      boss.roarDone = true;
      boss.nextAttackAt = now + CONFIG.gameplay.boss.chocado.attackDelayMs;
      mostrarBossTipInicial();
      mostrarDanielBoss(BOSS_DANIEL_LINES.bossIntro, 3900);
      tocarSom(CONFIG.sounds.bossIntro, 0.62, "sfx");
      return false;
    }

    player.vx = 0;
    player.vy = 0;
    player.invincibleUntil = now + 1600;
    return true;
  }

  function spawnBossChocado(fromStoryReveal = false) {
    const now = performance.now();
    const cfg = CONFIG.gameplay.boss.chocado;

    bossProjectilesRef.current = [];
    bossAttackHistoryRef.current = [];
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
      phaseTwoAnnounced: false,
    };

    waveStateRef.current.message = "";
    waveStateRef.current.messageUntil = 0;
    setWaveUi((current) => ({ ...current, bossWave: true, message: "" }));
    if (!fromStoryReveal) {
      mostrarBossTipInicial();
      mostrarDanielBoss(BOSS_DANIEL_LINES.bossIntro, 4600);
      tocarSom(CONFIG.sounds.bossIntro, 0.62, "sfx");
      tocarMusicaChocado();
    }
    pararLoopAudio(gameplayMusicAudioRef, false);
    tocarAmbienteEspacial();
    tocarHumChocado(false);
    shakeRef.current = {
      intensity: fromStoryReveal ? 7 : 6,
      endAt: performance.now() + 520,
    };
  }

  function bossEstaAtivo() {
    return bossRef.current.active;
  }

  function mostrarMensagemWave(message: string, bossWave = false) {
    const wave = waveStateRef.current;
    const messageMs =
      wave.mode === "story"
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
    const __finishDeterministicRng = ativarRngDeterministicoOnlineTogether(`infinite-plan-${waveNumber}`);
    try {
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
    const shuffled = [...lanes].sort(() => randomFloat() - 0.5);
    const mirrorLane = (lane: number) =>
      clamp(CONFIG.canvasHeight - lane - 70, 62, CONFIG.canvasHeight - 132);
    const pickLane = (i: number) => shuffled[i % shuffled.length];

    let time = 0;

    for (let i = 0; i < groupCount; i++) {
      const lane = pickLane(i);
      const mirror = mirrorLane(lane);
      const roll = randomFloat();
      const earlyWave = waveNumber <= 3;
      const evolutionTier = Math.min(
        6,
        Math.floor(Math.max(0, waveNumber) / 50),
      );

      // A cada 50 waves surgem formações novas. O número de inimigos continua controlado,
      // então a evolução muda o padrão sem transformar a tela em uma parede impossível.
      if (evolutionTier >= 1 && i % Math.max(3, 7 - evolutionTier) === 1) {
        if (evolutionTier % 3 === 1) {
          events.push({ at: time, kind: "purple", y: lane });
          events.push({ at: time + 420, kind: "red" });
          events.push({ at: time + 860, kind: "purple", y: mirror });
        } else if (evolutionTier % 3 === 2 && waveNumber >= cfg.blackFromWave) {
          events.push({ at: time, kind: "black", y: lane });
          events.push({ at: time + 760, kind: "purple", y: mirror });
        } else if (waveNumber >= cfg.alienFromWave) {
          events.push({ at: time, kind: "alien", y: lane });
          events.push({ at: time + 820, kind: "red" });
        } else {
          events.push({ at: time, kind: "purple", y: lane });
          events.push({ at: time + 540, kind: "purple", y: mirror });
        }
        // No começo, o jogo favorece roxos, mas ainda varia.
        // Depois, mistura formações simétricas e ameaças especiais.
      } else if (earlyWave) {
        if (roll < 0.68) {
          events.push({ at: time, kind: "purple", y: lane });
          if (randomFloat() < 0.28) {
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
        if (randomFloat() < 0.24) {
          events.push({ at: time + 680, kind: "purple", y: mirror });
        }
      } else {
        // Formação mista com atraso maior entre inimigos.
        events.push({ at: time, kind: "purple", y: lane });
        if (waveNumber >= cfg.blackFromWave && randomFloat() < 0.22) {
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
        randomFloat() < 0.42
      ) {
        events.push({ at: time + 720, kind: "asteroid", y: mirror });
      }

      time += Math.max(
        880,
        cfg.spawnIntervalMs - Math.min(120, waveNumber * 3),
      );
    }

    return events.sort((a, b) => a.at - b.at);
    } finally {
      __finishDeterministicRng();
    }
  }

  function criarPlanoWaveHistoria(waveNumber: number): WaveSpawnEvent[] {
    const __finishDeterministicRng = ativarRngDeterministicoOnlineTogether(`story-plan-${waveNumber}`);
    try {
    const cfg = CONFIG.gameplay.storyWaves;
    const events: WaveSpawnEvent[] = [];

    if (waveNumber >= cfg.bossWave) return events;

    const groupCount = Math.min(
      cfg.maxGroups,
      cfg.baseGroups + Math.floor(waveNumber * cfg.groupsPerWave),
    );

    const lanes = [92, 178, 264, 352, 440, 532, 616];
    const shuffled = [...lanes].sort(() => randomFloat() - 0.5);
    const mirrorLane = (lane: number) =>
      clamp(CONFIG.canvasHeight - lane - 78, 70, CONFIG.canvasHeight - 138);
    const pickLane = (i: number) => shuffled[i % shuffled.length];

    let time = 0;

    for (let i = 0; i < groupCount; i++) {
      const lane = pickLane(i);
      const mirror = mirrorLane(lane);
      const roll = randomFloat();

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
        } else if (roll < 0.6) {
          events.push({ at: time, kind: "alien", y: lane });
        } else {
          events.push({ at: time, kind: "purple", y: lane });
          events.push({ at: time + 820, kind: "black", y: mirror });
        }
      }

      if (
        waveNumber >= cfg.asteroidFromWave &&
        i % 4 === 2 &&
        randomFloat() < 0.3
      ) {
        events.push({ at: time + 880, kind: "asteroid", y: mirror });
      }

      // No modo história o spawn é mais espaçado para a wave ser longa,
      // mas sem colocar inimigos em cima uns dos outros.
      time += Math.max(
        1120,
        cfg.spawnIntervalMs - Math.min(80, waveNumber * 3),
      );
    }

    return events.sort((a, b) => a.at - b.at);
    } finally {
      __finishDeterministicRng();
    }
  }

  function iniciarWaveHistoria(waveNumber: number, fromStoryReveal = false) {
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
      spawnBossChocado(fromStoryReveal);
    }
  }

  function gerarCodigoFakeNews() {
    return String(Math.floor(1000000 + randomFloat() * 9000000));
  }

  function montarFakeNewsTransmitida(fake: string, code: string) {
    return `#${code} SPACE NEWS - ${fake}`;
  }

  function prepararFakeNewsFinal() {
    const current = victoryFakeNews;
    const pool = CHOCADO_FINAL_FAKE_NEWS.filter((item) => item !== current);
    const selected =
      pool[Math.floor(randomFloat() * pool.length)] ??
      CHOCADO_FINAL_FAKE_NEWS[0];
    const newCode = gerarCodigoFakeNews();
    setVictoryFakeNews(selected);
    setVictoryFakeNewsCode(newCode);
    setVictoryFakeNewsCopied(false);
    try {
      window.localStorage.setItem(
        "spaceNews.pendingFakeNews",
        montarFakeNewsTransmitida(selected, newCode),
      );
    } catch {}
    return selected;
  }

  async function copiarFakeNewsFinal() {
    try {
      await navigator.clipboard.writeText(
        montarFakeNewsTransmitida(victoryFakeNews, victoryFakeNewsCode),
      );
      setVictoryFakeNewsCopied(true);
      tocarSom(CONFIG.sounds.menuConfirm, 0.28, "menu");
      window.setTimeout(() => setVictoryFakeNewsCopied(false), 1800);
    } catch {
      setVictoryFakeNewsCopied(false);
    }
  }

  function enviarFakeNewsAoSite() {
    try {
      window.localStorage.setItem(
        "spaceNews.pendingFakeNews",
        montarFakeNewsTransmitida(victoryFakeNews, victoryFakeNewsCode),
      );
      window.localStorage.setItem(
        "spaceNews.pendingFakeNewsAt",
        String(Date.now()),
      );
    } catch {}
    tocarSom(
      CONFIG.sounds.fakeNewsTransmit || CONFIG.sounds.menuConfirm,
      0.48,
      "sfx",
    );
    window.location.href = "/?spaceNews=1";
  }

  function concluirModoHistoria() {
    const now = performance.now();
    shotsRef.current = [];
    enemyProjectilesRef.current = [];
    bossProjectilesRef.current = [];
    powerUpsRef.current = [];
    waveStateRef.current = {
      ...waveStateRef.current,
      active: false,
      queue: [],
      nextWaveAt: 0,
      bossWave: false,
      message: "SINAL HOSTIL ELIMINADO",
      messageUntil: now + 3000,
    };
    setWaveUi({
      mode: "story",
      wave: CONFIG.gameplay.storyWaves.bossWave,
      active: false,
      bossWave: false,
      message: "SINAL HOSTIL ELIMINADO",
    });
    prepararFakeNewsFinal();
    tocarSom(
      CONFIG.sounds.fakeNewsIntercepted ||
        CONFIG.sounds.victoryFanfare ||
        CONFIG.sounds.menuConfirm,
      0.84,
      "sfx",
    );
    mostrarDanielBoss(
      {
        expression: "happy",
        text: "Conseguimos, Cleber. O sinal do Chocado caiu — segura a formação, estou confirmando a limpeza da rede.",
      },
      4200,
    );
    window.setTimeout(() => {
      if (gameStateRef.current === "playing") {
        setEstado("victory");
      }
    }, 4400);
  }

  function bonusDanoInfinito() {
    if (currentModeRef.current !== "infinite" && !isLocalWaveMode()) return 0;
    return Math.min(8, Math.floor(Math.max(0, waveStateRef.current.wave) / 75));
  }

  function aplicarDificuldadeWave(inicio: number, difficulty: number) {
    const waveNumber = waveStateRef.current.wave;
    const hpBonus =
      currentModeRef.current === "infinite" || isLocalWaveMode()
        ? Math.min(6, Math.floor(Math.max(0, waveNumber) / 50))
        : 0;
    const speedScale = Math.min(1.48, 1 + Math.max(0, difficulty - 1) * 0.16);

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
    const __finishDeterministicRng = ativarRngDeterministicoOnlineTogether(`spawn-${waveStateRef.current.wave}-${kind}-${Math.round(y ?? -1)}-${before}`);
    try {
      spawnEnemy(kind, y);
      aplicarDificuldadeWave(before, difficulty);
      if (onlineTogetherCoordenado() && souAutoridadeMundoOnlineTogether()) {
        const spawned = enemiesRef.current.slice(before).map(enemySnapshotParaSync);
        if (spawned.length > 0) enviarOnline({ type: "coop_enemy_spawn", slot: slotLocalOnline(), enemies: spawned, seq: Date.now() });
      }
    } finally {
      __finishDeterministicRng();
    }
  }

  function iniciarWaveInfinita(waveNumber: number) {
    const now = performance.now();
    const cfg = CONFIG.gameplay.infiniteWaves;
    const difficulty = Math.min(
      cfg.maxDifficulty,
      1 + Math.max(0, waveNumber - 1) * cfg.difficultyPerWave,
    );
    const bossWave = waveNumber > 0 && waveNumber % cfg.bossEvery === 0;
    if (tentarPularWaveComPet(waveNumber, bossWave)) return;

    waveStateRef.current = {
      mode: isLocalWaveMode() ? (currentModeRef.current as GameMode) : "infinite",
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
      mode: isLocalWaveMode() ? (currentModeRef.current as GameMode) : "infinite",
      wave: waveNumber,
      active: true,
      bossWave,
      message: bossWave ? `BOSS WAVE ${waveNumber}` : `WAVE ${waveNumber}`,
    });

    tocarSom(
      bossWave ? CONFIG.sounds.bossIntro : CONFIG.sounds.waveStart,
      bossWave ? 0.6 : 0.48,
    );

    if (onlineTogetherCoordenado() && souAutoridadeMundoOnlineTogether() && !onlineApplyingRemoteWorldEventRef.current) {
      enviarOnline({ type: "coop_wave_start", slot: slotLocalOnline(), wave: waveNumber, seq: Date.now(), seed: onlineMatchSeedRef.current });
    }

    if (bossWave) {
      spawnBossChocado();
    }
  }

  function atualizarWavesInfinitas() {
    if (gameStateRef.current !== "playing") return;

    const wave = waveStateRef.current;
    const mode = wave.mode;
    if (!mode) return;

    const isInfinite = mode === "infinite" || isLocalWaveMode(mode);
    const isStory = mode === "story";
    const isPvp = mode === "localPvp";

    if (isPvp) return;
    if (isInfinite && !CONFIG.gameplay.infiniteWaves.enabled) return;
    if (isStory && !CONFIG.gameplay.storyWaves.enabled) return;

    const now = performance.now();
    const cfg = isInfinite
      ? CONFIG.gameplay.infiniteWaves
      : CONFIG.gameplay.storyWaves;

    if (!wave.active) {
      if (wave.nextWaveAt > 0 && now >= wave.nextWaveAt) {
        if (onlineTogetherCoordenado() && !souAutoridadeMundoOnlineTogether()) return;
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
      if (event && (!onlineTogetherCoordenado() || souAutoridadeMundoOnlineTogether())) spawnWaveEnemy(event.kind, wave.difficulty, event.y);
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
        wave.message = "";
        wave.messageUntil = 0;
        setWaveUi({
          mode: "story",
          wave: completedWave,
          active: false,
          bossWave: false,
          message: "",
        });
        concluirModoHistoria();
        return;
      }

      if (isStory && completedWave >= CONFIG.gameplay.storyWaves.normalWaves) {
        wave.nextWaveAt = 0;
        wave.message = "MISSÃO CONCLUÍDA";
        wave.messageUntil = now + 2600;
        adicionarPontuacao(CONFIG.gameplay.score.waveClear);
        setWaveUi({
          mode,
          wave: completedWave,
          active: false,
          bossWave: false,
          message: wave.message,
        });
        iniciarRevelacaoChocadoHistoria();
        return;
      } else {
        wave.message = isStory
          ? `WAVE ${completedWave}/${CONFIG.gameplay.storyWaves.normalWaves} CONCLUÍDA`
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

  function spawnPowerUp(
    kind: PowerUpKind,
    x: number,
    y: number,
    fromBoss = false,
  ) {
    if (onlineTogetherCoordenado() && !souAutoridadeMundoOnlineTogether()) return;
    const cfg = CONFIG.gameplay.powerups;

    // Nasce diretamente do ponto onde o inimigo morreu/foi acertado.
    // Só corrige para não nascer fora da tela ou preso dentro do Chocado.
    const safeLeft = 150;
    const safeRight = CONFIG.canvasWidth - cfg.width - 150;
    const safeTop = 100;
    const safeBottom = CONFIG.canvasHeight - cfg.height - 100;

    const spawnX = fromBoss
      ? clamp(
          x - cfg.width - 76,
          CONFIG.canvasWidth - 570,
          CONFIG.canvasWidth - 360,
        )
      : clamp(x - cfg.width / 2, safeLeft, safeRight);
    const spawnY = clamp(y - cfg.height / 2, safeTop, safeBottom);
    const id = powerUpIdRef.current++;

    const power: PowerUp = {
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
    };

    powerUpsRef.current.push(power);
    if (onlineTogetherCoordenado()) {
      enviarOnline({ type: "coop_powerup_spawn", slot: slotLocalOnline(), power: powerUpSnapshotParaSync(power), seq: Date.now() });
    }

    tocarSom(
      CONFIG.sounds.powerUpSpawn || CONFIG.sounds.abilityReady,
      0.42,
      "ability",
    );
    tocarLoopPowerUpTrail(id);
  }

  function tentarSpawnPowerUp(x: number, y: number, bossDamage = false) {
    if (gameStateRef.current === "tutorial") return;
    const player = playerRef.current;
    const cfg = CONFIG.gameplay.powerups;
    const now = performance.now();

    const rollTimedPower = (boss = false): PowerUpKind | null => {
      const options: Array<{ kind: PowerUpKind; chance: number }> = [
        {
          kind: "fireRate",
          chance: boss
            ? cfg.fireRateChanceOnBossDamage
            : cfg.fireRateChanceOnKill,
        },
        {
          kind: "powerShot",
          chance: boss
            ? cfg.powerShotChanceOnBossDamage
            : cfg.powerShotChanceOnKill,
        },
        {
          kind: "homingShot",
          chance: boss
            ? cfg.homingShotChanceOnBossDamage
            : cfg.homingShotChanceOnKill,
        },
        {
          kind: "flames",
          chance: boss ? cfg.flamesChanceOnBossDamage : cfg.flamesChanceOnKill,
        },
      ];

      for (const option of options.sort(() => randomFloat() - 0.5)) {
        if (randomFloat() < option.chance) return option.kind;
      }

      return null;
    };

    const rollPower = (boss = false): PowerUpKind | null => {
      const tripleChance = boss
        ? cfg.tripleRegenChanceOnBossDamage
        : cfg.tripleRegenChanceLowHp;
      if (player.hp <= 2 && randomFloat() < tripleChance) return "tripleRegen";
      if (
        player.hp < CONFIG.gameplay.player.maxHp &&
        randomFloat() <
          (boss ? cfg.regenChanceOnBossDamage : cfg.regenChanceOnKill)
      )
        return "regen";
      const canSpawnGoldenHeart =
        player.hp >= CONFIG.gameplay.player.maxHp && player.goldenHp <= 0;
      if (
        canSpawnGoldenHeart &&
        randomFloat() <
          (boss
            ? cfg.goldenHeartChanceOnBossDamage
            : cfg.goldenHeartChanceOnKill)
      )
        return "goldenHeart";
      if (
        randomFloat() <
        (boss ? cfg.randomBoxChanceOnBossDamage : cfg.randomBoxChanceOnKill)
      )
        return "randomBox";
      if (
        !shieldActiveRef.current &&
        randomFloat() <
          (boss ? cfg.shieldChanceOnBossDamage : cfg.shieldChanceOnKill)
      )
        return "shield";
      return rollTimedPower(boss);
    };

    if (bossDamage) {
      if (now - lastBossPowerUpAtRef.current < cfg.bossDamageSpawnCooldownMs)
        return;
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
    tocarSom(
      CONFIG.sounds.flashbangVoice || CONFIG.sounds.badPowerUp,
      1,
      "ability",
    );

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

    invertedUntilRef.current =
      Math.max(invertedUntilRef.current, now) + duration;
    setVisualEffectNow(now);
    tocarSom(
      CONFIG.sounds.invertScreen || CONFIG.sounds.badPowerUp,
      0.85,
      "sfx",
    );

    setRandomVisualEffect((current) => ({ ...current, inverted: true }));

    window.setTimeout(() => {
      if (performance.now() >= invertedUntilRef.current) {
        setRandomVisualEffect((current) => ({ ...current, inverted: false }));
      }
    }, duration + 80);
  }

  function ativarLentidaoAleatoria() {
    slowPlayerUntilRef.current =
      Math.max(slowPlayerUntilRef.current, performance.now()) +
      CONFIG.gameplay.powerups.randomBadSlowMs;
    tocarSom(
      CONFIG.sounds.slowPowerDown || CONFIG.sounds.badPowerUp,
      0.5,
      "sfx",
    );
  }

  function aplicarPowerUpAleatorio() {
    const cfg = CONFIG.gameplay.powerups;
    const roll = randomFloat();

    tocarSom(
      CONFIG.sounds.randomPowerUp || CONFIG.sounds.powerUpPickup,
      0.56,
      "ability",
    );

    if (roll < cfg.randomComboChance) {
      aplicarPowerUp("fireRate");
      aplicarPowerUp(
        randomFloat() < 0.34
          ? "powerShot"
          : randomFloat() < 0.5
            ? "homingShot"
            : "flames",
      );
      if (randomFloat() < 0.25) aplicarPowerUp("shield");
      return;
    }

    if (roll < cfg.randomComboChance + cfg.randomBadChance) {
      const badRoll = randomFloat();

      tocarSom(
        CONFIG.sounds.badPowerUp || CONFIG.sounds.playerDamage,
        0.5,
        "hit",
      );

      if (badRoll < 0.28) {
        ativarFlashbangAleatorio();
        return;
      }

      if (badRoll < 0.52) {
        receberDano(1);
        tocarSom(
          CONFIG.sounds.damagePowerDown || CONFIG.sounds.playerDamage,
          0.45,
          "hit",
        );
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

    if (
      playerRef.current.hp >= CONFIG.gameplay.player.maxHp &&
      playerRef.current.goldenHp <= 0
    ) {
      // MUITO raro até dentro do random.
      if (randomFloat() < 0.035) {
        goodOptions.push("goldenHeart");
      }
    }

    aplicarPowerUp(goodOptions[Math.floor(randomFloat() * goodOptions.length)]);
  }

  function aplicarPowerUp(kind: PowerUpKind) {
    const player = playerRef.current;
    const now = performance.now();
    const glowColor = powerUpColor(kind);
    powerGlowRef.current = {
      color: glowColor,
      endAt: now + CONFIG.gameplay.powerups.collectGlowMs,
    };

    tocarSom(
      CONFIG.sounds.powerUpPickup || CONFIG.sounds.abilityReady,
      0.5,
      "ability",
    );
    const pickupParticles =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches
        ? 7
        : 14;
    criarParticulasHit(
      player.x + player.w / 2,
      player.y + player.h / 2,
      glowColor,
      pickupParticles,
    );

    if (kind === "randomBox") {
      aplicarPowerUpAleatorio();
      return;
    }

    if (kind === "goldenHeart") {
      if (isLocalPvpMode()) {
        player.hp = Math.min(vidaMaximaLocal(), player.hp + 18);
        setPlayerHp(player.hp);
        tocarSom(CONFIG.sounds.goldenHeart || CONFIG.sounds.powerUpPickup, 0.72, "ability");
        return;
      }
      if (player.hp < CONFIG.gameplay.player.maxHp || player.goldenHp > 0) {
        return;
      }

      player.goldenHp = Math.min(
        CONFIG.gameplay.powerups.goldenHeartMax,
        player.goldenHp + 2,
      );
      setGoldenHp(player.goldenHp);
      tocarSom(
        CONFIG.sounds.goldenHeart || CONFIG.sounds.powerUpPickup,
        0.72,
        "ability",
      );
      return;
    }

    if (kind === "regen") {
      player.hp = Math.min(vidaMaximaLocal(), player.hp + (isLocalPvpMode() ? 12 : 1));
      setPlayerHp(player.hp);
      setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
      if (player.hp > 1) pararAlarmeLowHp(true);
      return;
    }

    if (kind === "tripleRegen") {
      player.hp = Math.min(vidaMaximaLocal(), player.hp + (isLocalPvpMode() ? 22 : 3));
      setPlayerHp(player.hp);
      setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
      if (player.hp > 1) pararAlarmeLowHp(true);
      return;
    }

    if (kind === "shield") {
      shieldActiveRef.current = true;
      setShieldActive(true);
      return;
    }

    if (kind === "powerShot") {
      powerShotUntilRef.current =
        Math.max(powerShotUntilRef.current, now) +
        CONFIG.gameplay.powerups.powerShotDurationMs;
      return;
    }

    if (kind === "homingShot") {
      homingShotUntilRef.current =
        Math.max(homingShotUntilRef.current, now) +
        CONFIG.gameplay.powerups.homingShotDurationMs;
      return;
    }

    if (kind === "flames") {
      flamesUntilRef.current =
        Math.max(flamesUntilRef.current, now) +
        CONFIG.gameplay.powerups.flamesDurationMs;
      tocarSom(
        CONFIG.sounds.flamesStart || CONFIG.sounds.powerUpPickup,
        0.58,
        "ability",
      );
      return;
    }

    fireRateUntilRef.current =
      Math.max(fireRateUntilRef.current, now) +
      CONFIG.gameplay.powerups.fireRateDurationMs;
  }

  function atualizarPowerUpUi() {
    const now = performance.now();
    const minimumInterval = mobileRuntimeRef.current ? 220 : 100;
    if (now - lastPowerUpUiAtRef.current < minimumInterval) return;
    lastPowerUpUiAtRef.current = now;
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

    const p2Active: ActivePowerUpUi[] = [];
    if (player2ShieldUntilRef.current > now) {
      p2Active.push({ kind: "shield", label: "SHIELD", icon: CONFIG.uiImages.powerShield, remainingMs: player2ShieldUntilRef.current - now });
    }
    if (player2FireRateUntilRef.current > now) {
      p2Active.push({ kind: "fireRate", label: "TIRO+", icon: CONFIG.uiImages.powerFireRate, remainingMs: player2FireRateUntilRef.current - now });
    }
    if (player2PowerShotUntilRef.current > now) {
      p2Active.push({ kind: "powerShot", label: "POWER", icon: CONFIG.uiImages.powerPowerShot, remainingMs: player2PowerShotUntilRef.current - now });
    }
    if (player2HomingShotUntilRef.current > now) {
      p2Active.push({ kind: "homingShot", label: "HOMING", icon: CONFIG.uiImages.powerHomingShot, remainingMs: player2HomingShotUntilRef.current - now });
    }
    if (player2FlamesUntilRef.current > now) {
      p2Active.push({ kind: "flames", label: "FLAMES", icon: CONFIG.uiImages.powerFlames, remainingMs: player2FlamesUntilRef.current - now });
    }

    const signature = active
      .map(
        (item) =>
          `${item.kind}:${item.remainingMs ? Math.ceil(item.remainingMs / 250) : "on"}`,
      )
      .join("|");
    if (signature !== lastPowerUpUiSignatureRef.current) {
      lastPowerUpUiSignatureRef.current = signature;
      setActivePowerUpsUi(active);
    }
    const p2Signature = p2Active
      .map((item) => `${item.kind}:${item.remainingMs ? Math.ceil(item.remainingMs / 250) : "on"}`)
      .join("|");
    if (p2Signature !== lastPlayer2PowerUpUiSignatureRef.current) {
      lastPlayer2PowerUpUiSignatureRef.current = p2Signature;
      setPlayer2ActivePowerUpsUi(p2Active);
    }
  }

  function cooldownTiroNormalAtual() {
    const now = performance.now();
    const flamesActive = flamesUntilRef.current > now;
    if (flamesActive) return 2;
    const fireRateActive = fireRateUntilRef.current > now;
    const powerShotActive = powerShotUntilRef.current > now;
    const multiplier =
      (fireRateActive
        ? CONFIG.gameplay.powerups.fireRateCooldownMultiplier
        : 1) *
      (powerShotActive
        ? CONFIG.gameplay.powerups.powerShotCooldownMultiplier
        : 1) *
      (now < petSuperSparkUntilRef.current ? 0.85 : 1);

    return Math.max(
      6,
      Math.round(CONFIG.gameplay.shots.normal.cooldownFrames * multiplier),
    );
  }

  useEffect(() => {
    return () => {
      if (resumeCountdownTimerRef.current !== null) {
        window.clearTimeout(resumeCountdownTimerRef.current);
      }
    };
  }, []);


  useEffect(() => {
    localProfileRef.current = localProfile;
    try {
      window.localStorage.setItem(SPACE_NEWS_PROFILE_KEY, JSON.stringify(localProfile));
    } catch {
      // sem storage disponível
    }
  }, [localProfile]);


  useEffect(() => {
    const frameImages = TOKEN_FRAME_SRCS.map((frameSrc) => {
      const frame = new Image();
      frame.src = assetUrl(frameSrc);
      return frame;
    });
    tokenFrameImagesRef.current = frameImages;

    if (TOKEN_SPRITE_SHEET_SRC) {
      const image = new Image();
      image.onload = () => {
        tokenSpriteReadyRef.current = true;
      };
      image.onerror = () => {
        tokenSpriteReadyRef.current = false;
      };
      image.src = assetUrl(TOKEN_SPRITE_SHEET_SRC);
      tokenSpriteRef.current = image;
    } else {
      tokenSpriteReadyRef.current = false;
      tokenSpriteRef.current = null;
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = Math.max(0, now - profilePlayTickRef.current);
      profilePlayTickRef.current = now;
      if (gameStateRef.current === "playing" && elapsed > 0) {
        atualizarStatsPerfilLocal((stats) => ({ ...stats, playTimeMs: stats.playTimeMs + elapsed }));
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const cleanName = limparNomeOnline(localProfileRef.current.name || "Player").trim() || "Player";
    setOnlinePlayerName(cleanName);
    try {
      const url = new URL(window.location.href);
      const room = limparCodigoSalaOnline(url.searchParams.get("room") || "");
      if (room) {
        const inviteFrom = limparNomeOnline(url.searchParams.get("inviteFrom") || "amigo").trim() || "amigo";
        setOnlineJoinCode(room);
        setFluxoOnline("join");
        setOnlineFeedback("success");
        setOnlineStatus(`${inviteFrom} está te convidando para Space News! Entrando na sala ${room}...`);
        setEstado("onlineLobby");
        void mostrarNotificacaoConviteLocal(inviteFrom, room);
        window.setTimeout(() => void entrarSalaOnline(room), 120);
      }
    } catch {
      // ignora URL inválida
    }
  }, []);

  useEffect(() => {
    try {
      const savedSettings = window.localStorage.getItem("spaceNews.settings");
      const settingsVersion = window.localStorage.getItem(
        "spaceNews.settingsVersion",
      );
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as Partial<
          typeof CONFIG.settings
        >;
        Object.assign(CONFIG.settings, parsed);
      }
      mobileRuntimeRef.current =
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(hover: none)").matches;
      if (settingsVersion !== "v28-gamepad-menu") {
        const coarsePointer =
          window.matchMedia("(pointer: coarse)").matches ||
          window.matchMedia("(hover: none)").matches;
        mobileRuntimeRef.current = coarsePointer;
        CONFIG.settings.mobileScale = Math.max(
          coarsePointer ? 1.02 : 0.94,
          Number(CONFIG.settings.mobileScale) || (coarsePointer ? 1.02 : 0.94),
        );
        CONFIG.settings.mobileOpacity = Math.max(
          0.9,
          Number(CONFIG.settings.mobileOpacity) || 0.92,
        );
        CONFIG.settings.performanceMode = "auto";
        CONFIG.settings.musicVolume = 0.9;
        CONFIG.settings.sfxVolume = Math.min(
          Number(CONFIG.settings.sfxVolume) || 1,
          0.62,
        );
        CONFIG.settings.menuVolume = Math.min(
          Number(CONFIG.settings.menuVolume) || 0.8,
          0.65,
        );
        CONFIG.settings.hitVolume = Math.min(
          Number(CONFIG.settings.hitVolume) || 0.75,
          0.55,
        );
        CONFIG.settings.abilityVolume = Math.min(
          Number(CONFIG.settings.abilityVolume) || 0.85,
          0.65,
        );
        CONFIG.settings.enableParticles = true;
        CONFIG.settings.enableScreenShake = true;
        CONFIG.settings.enableBoostFireSprite = true;
        CONFIG.settings.enableFlashingLights = true;
        CONFIG.settings.particleQuality = coarsePointer ? 0.58 : 1;
        CONFIG.settings.showFps = false;
        CONFIG.settings.fpsLimit = String(
          CONFIG.settings.fpsLimit || "unlimited",
        );
        CONFIG.settings.resumeCountdown = String(
          CONFIG.settings.resumeCountdown ?? "3",
        );
        CONFIG.settings.gamepadEnabled = true;
        CONFIG.settings.gamepadMoveStick = String(
          CONFIG.settings.gamepadMoveStick || "left",
        );
        CONFIG.settings.gamepadDeadzone = clamp(
          Number(CONFIG.settings.gamepadDeadzone) || 0.18,
          0.08,
          0.35,
        );
        CONFIG.settings.gamepadShootButton = "1|7";
        CONFIG.settings.gamepadStrongButton = "2|6";
        CONFIG.settings.gamepadBoostButton = "0|5";
        CONFIG.settings.gamepadDodgeButton = "3|4";
        window.localStorage.setItem(
          "spaceNews.settings",
          JSON.stringify(CONFIG.settings),
        );
        window.localStorage.setItem("spaceNews.settingsVersion", "v28-gamepad-menu");
      }
      setSettingsSnapshot({ ...CONFIG.settings });

      const savedLayout = window.localStorage.getItem("spaceNews.mobileLayout");
      const layoutVersion = window.localStorage.getItem(
        "spaceNews.mobileLayoutVersion",
      );
      if (savedLayout && layoutVersion === "v12") {
        const parsed = JSON.parse(
          savedLayout,
        ) as Partial<MobileControlLayoutMap>;
        setMobileControlLayout({
          ...DEFAULT_MOBILE_CONTROL_LAYOUT,
          ...parsed,
        });
      } else {
        setMobileControlLayout(DEFAULT_MOBILE_CONTROL_LAYOUT);
        window.localStorage.setItem(
          "spaceNews.mobileLayout",
          JSON.stringify(DEFAULT_MOBILE_CONTROL_LAYOUT),
        );
        window.localStorage.setItem("spaceNews.mobileLayoutVersion", "v12");
      }
    } catch {}
  }, []);

  useEffect(() => {
    carregarLeaderboardOnline().catch(() => {});
  }, []);

  useEffect(() => {
    if (gameState !== "gameOver") return;
    if (recordPromptShownRef.current) return;
    recordPromptShownRef.current = true;
    const eligible =
      currentModeRef.current === "infinite" &&
      !debugUsedRef.current &&
      pontuacaoQualifica(scoreRef.current, Math.max(1, gameOverWave));
    if (eligible) {
      setRecordName("");
      setRecordPromptOpen(true);
    }
  }, [gameState, gameOverWave, leaderboard]);

  useEffect(() => {
    if (gameState !== "victory") {
      setVictoryStep(0);
      return;
    }
    setVictoryStep(0);
    setBossDanielLine((current) => ({ ...current, visible: false }));
    tocarSom(
      CONFIG.sounds.danielRadioOpen || CONFIG.sounds.menuMove,
      0.22,
      "sfx",
    );
    const timers = [
      window.setTimeout(() => {
        setVictoryStep(1);
        tocarSom(CONFIG.sounds.danielVictoryVoice, 0.72, "sfx");
      }, 1300),
      window.setTimeout(() => setVictoryStep(2), 3000),
      window.setTimeout(() => setVictoryStep(3), 5200),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [gameState]);

  useEffect(() => {
    document.documentElement.lang = "pt-BR";
    if (document.fonts) {
      void Promise.all([
        document.fonts.load(`16px "${CONFIG.fonts.ui}"`),
        document.fonts.load(`16px "${CONFIG.fonts.menu}"`),
        document.fonts.load(`16px "${CONFIG.fonts.title}"`),
      ]).catch(() => {});
    }
  }, []);

  async function carregarAssetsDoJogo() {
    const runId = ++assetLoadRunRef.current;
    assetsRef.current = new AssetManager();
    setMissingAssets([]);
    setAssetWarningVisible(false);
    setAssetLoadState({ loading: true, loaded: 0, total: 1 });

    const report = await assetsRef.current.loadAll((loaded, total) => {
      if (assetLoadRunRef.current !== runId) return;
      setAssetLoadState({ loading: true, loaded, total: Math.max(1, total) });
    });

    if (assetLoadRunRef.current !== runId) return;

    setMissingAssets(report.failed);
    setAssetWarningVisible(report.failed.length > 0);
    setAssetLoadState({
      loading: false,
      loaded: Math.max(1, report.total),
      total: Math.max(1, report.total),
    });

    // Depois do carregamento visual, o service worker guarda os demais
    // assets em segundo plano para manter a partida estável se a internet cair.
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.active?.postMessage({
            type: "CACHE_URLS",
            urls: listarAssetsParaCacheOffline(),
          });
        })
        .catch(() => {});
    }
  }

  useEffect(() => {
    void carregarAssetsDoJogo();

    const warmSounds = [
      CONFIG.sounds.normalShot,
      CONFIG.sounds.enemyShot,
      CONFIG.sounds.enemyHit,
      CONFIG.sounds.enemyDeath,
      CONFIG.sounds.explosion,
      CONFIG.sounds.asteroidBreak,
      CONFIG.sounds.powerUpPickup,
      CONFIG.sounds.powerUpSpawn,
      CONFIG.sounds.tokenCollect,
      CONFIG.sounds.tokenBurst,
      CONFIG.sounds.goldenHeart,
      CONFIG.sounds.randomPowerUp,
      CONFIG.sounds.badPowerUp,
      CONFIG.sounds.flamesStart,
      CONFIG.sounds.chocadoLaser,
      CONFIG.sounds.chocadoLaserCharge,
      CONFIG.sounds.chocadoLaserFire,
      CONFIG.sounds.chocadoOrb,
    ].filter(Boolean);

    const mobileAudio =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches;
    const decodeWarmSounds = () => {
      obterAudioContext()
        ?.resume()
        .catch(() => {});
      for (const src of warmSounds) carregarBufferAudio(src).catch(() => {});
    };

    for (const src of warmSounds) {
      const frequent =
        src === CONFIG.sounds.normalShot ||
        src === CONFIG.sounds.enemyShot ||
        src === CONFIG.sounds.enemyHit;
      if (frequent || mobileAudio) {
        carregarBufferAudio(src).catch(() => {});
        continue;
      }
      if (audioPoolRef.current.has(src)) continue;
      const audio = new Audio(assetUrl(src));
      audio.preload = "auto";
      audio.load();
      audioPoolRef.current.set(src, [audio]);
      audioPoolIndexRef.current.set(src, 0);
    }

    window.addEventListener("pointerdown", decodeWarmSounds, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchstart", decodeWarmSounds, {
      once: true,
      passive: true,
    });

    const warmImages = [
      CONFIG.uiImages.powerRegen,
      CONFIG.uiImages.powerFireRate,
      CONFIG.uiImages.powerTripleRegen,
      CONFIG.uiImages.powerShield,
      CONFIG.uiImages.powerPowerShot,
      CONFIG.uiImages.powerHomingShot,
      CONFIG.uiImages.powerFlames,
      CONFIG.uiImages.powerGoldenHeart,
      CONFIG.uiImages.powerRandomBox,
    ];
    for (const src of warmImages) {
      const image = new Image();
      image.decoding = "async";
      image.src = assetUrl(src);
      void image.decode?.().catch(() => {});
    }

    return () => {
      window.removeEventListener("pointerdown", decodeWarmSounds);
      window.removeEventListener("touchstart", decodeWarmSounds);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (scoreUiTimerRef.current !== null)
        window.clearTimeout(scoreUiTimerRef.current);
      if (boostUiTimerRef.current !== null)
        window.clearTimeout(boostUiTimerRef.current);
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("game-page-active");

    const ocultarVLibras = () => {
      document
        .querySelectorAll<HTMLElement>(
          "[vw], [vw-access-button], .vlibras-container, div[vw-plugin-wrapper]",
        )
        .forEach((element) => {
          if (!element.dataset.spaceNewsOriginalDisplay) {
            element.dataset.spaceNewsOriginalDisplay =
              element.style.display || "__empty__";
          }
          element.style.setProperty("display", "none", "important");
          element.style.setProperty("pointer-events", "none", "important");
          element.dataset.spaceNewsHidden = "true";
        });
    };

    ocultarVLibras();
    let verificacoes = 0;
    const timer = window.setInterval(() => {
      ocultarVLibras();
      verificacoes += 1;
      if (verificacoes >= 12) window.clearInterval(timer);
    }, 500);

    return () => {
      window.clearInterval(timer);
      document.body.classList.remove("game-page-active");
      document
        .querySelectorAll<HTMLElement>("[data-space-news-hidden='true']")
        .forEach((element) => {
          const original = element.dataset.spaceNewsOriginalDisplay;
          if (original && original !== "__empty__")
            element.style.display = original;
          else element.style.removeProperty("display");
          element.style.removeProperty("pointer-events");
          delete element.dataset.spaceNewsOriginalDisplay;
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
    const shouldTalk =
      gameState === "tutorial" ||
      gameState === "tutorialChoice" ||
      gameState === "victory" ||
      bossDanielLine.visible;

    if (!shouldTalk) {
      setDanielMouthOpen(false);
      return;
    }

    const timer = window.setInterval(() => {
      setDanielMouthOpen((current) => !current);
    }, 135);

    return () => window.clearInterval(timer);
  }, [gameState, tutorialStep, bossDanielLine.visible, bossDanielLine.text]);

  useEffect(() => {
    const shouldPlayAlarm =
      CONFIG.settings.enableLowHpAlarm &&
      playerHp > 0 &&
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
      pararAlarmeLowHp(true);
    }
  }, [playerHp, gameState]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (
        CONFIG.settings.autoPauseOnBlur &&
        document.hidden &&
        gameStateRef.current === "playing"
      ) {
        // v2.4.4: no online, pausar sozinho ao trocar de aba dessincronizava o Together.
        // A aba pode perder requestAnimationFrame; mantemos a partida viva e só usamos pause votado.
        if (onlineGameplayActiveRef.current) return;
        tocarSom(CONFIG.sounds.pause, 0.35);
        onlinePausePanelOpenRef.current = false;
        setOnlinePausePanelOpen(false);
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
    let lastRenderedAt = 0;
    const mobileLike =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(hover: none)").matches;
    const lowHardware = (navigator.hardwareConcurrency || 8) <= 4;

    function usarEfeitosReduzidos() {
      const mode = String(
        (CONFIG.settings as Record<string, unknown>).performanceMode ?? "auto",
      );
      if (mode === "performance") return true;
      if (mode === "quality") return false;
      if (onlineGameplayActiveRef.current && adaptivePerformanceRef.current.reduced) return true;
      return lowHardware || adaptivePerformanceRef.current.reduced;
    }

    function limitarObjetosPesados() {
      const reduced = usarEfeitosReduzidos();
      const projectileCap = reduced ? 28 : mobileLike ? 62 : 105;
      if (bossProjectilesRef.current.length > projectileCap) {
        const beams = bossProjectilesRef.current.filter(
          (projectile) =>
            projectile.kind === "laser" || projectile.kind === "aimLaser",
        );
        const others = bossProjectilesRef.current.filter(
          (projectile) =>
            projectile.kind !== "laser" && projectile.kind !== "aimLaser",
        );
        const beamCap = reduced ? 2 : mobileLike ? 3 : beams.length;
        bossProjectilesRef.current = [
          ...beams.slice(-beamCap),
          ...others.slice(
            -Math.max(0, projectileCap - Math.min(beams.length, beamCap)),
          ),
        ];
      }

      const shotCap = reduced ? 38 : mobileLike ? 58 : 120;
      if (shotsRef.current.length > shotCap)
        shotsRef.current = shotsRef.current.slice(-shotCap);

      const particleCap = reduced ? 36 : mobileLike ? 72 : 175;
      if (particlesRef.current.length > particleCap)
        particlesRef.current = particlesRef.current.slice(-particleCap);
      const shockwaveCap = reduced ? 2 : mobileLike ? 4 : 18;
      if (shockwavesRef.current.length > shockwaveCap)
        shockwavesRef.current = shockwavesRef.current.slice(-shockwaveCap);
    }

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
      const target = homingActive
        ? encontrarAlvoMaisProximo(baseX, baseY)
        : null;

      if (target) {
        const dx = target.x - baseX;
        const dy = target.y - baseY;
        const len = Math.max(0.001, Math.hypot(dx, dy));
        if (len <= cfg.flamesHomingRange) {
          dir = { x: dx / len, y: dy / len };
        }
      }

      const flamesBuff = buffsCosmeticosEquipados().flames;
      const range = cfg.flamesRange * (powerActive ? 1.18 : 1) * (1 + flamesBuff * 0.55);
      const cone = cfg.flamesConeWidth * (powerActive ? 1.45 : 1) * (1 + flamesBuff * 0.5);
      const damage =
        ((cfg.flamesDamagePerSecond + bonusDanoInfinito()) / 30) *
        (powerActive ? 3 : 1);
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
        const allowedSide =
          18 + cone * (0.16 + 0.42 * (forward / range)) + enemyRadius;
        if (side > allowedSide) return;

        const applied = Math.min(damage, Math.max(0, enemy.hp));
        enemy.hp -= damage;
        carregarBoostPorDano(applied);
        if (enemy.kind === "asteroid" && enemy.hp <= enemy.maxHp / 2)
          enemy.cracked = true;
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
        enemiesRef.current = enemiesRef.current.filter(
          (enemy) => !killed.has(enemy.id),
        );
      }

      if (isLocalPvpMode()) {
        const p2 = player2Ref.current;
        if (p2 && p2.hp > 0) {
          const box = getPlayerHitbox(p2);
          const cx = box.x + box.w / 2;
          const cy = box.y + box.h / 2;
          const dx = cx - baseX;
          const dy = cy - baseY;
          const forward = dx * dir.x + dy * dir.y;
          const side = Math.abs(dx * -dir.y + dy * dir.x);
          if (forward >= -18 && forward <= range && side <= cone * 0.72 + Math.min(box.w, box.h) * 0.35) {
            receberDanoPlayer2(isLocalPvpMode() ? 1 : Math.max(0.08, damage * 0.32));
            criarParticulasHit(cx, cy, powerActive ? "#ffb703" : "#fb923c", 3);
          }
        }
      }

      const boss = bossRef.current;
      if (boss.active && !boss.intro && boss.hp > 0) {
        const box = getBossHitbox();

        // Flames contra boss: usa interseção com a hitbox inteira, não só o centro.
        // Assim o fogo pega em qualquer parte visível do Chocado.
        const samplePoints = [
          { x: box.x + box.w * 0.18, y: box.y + box.h * 0.18 },
          { x: box.x + box.w * 0.18, y: box.y + box.h * 0.5 },
          { x: box.x + box.w * 0.18, y: box.y + box.h * 0.82 },
          { x: box.x + box.w * 0.5, y: box.y + box.h * 0.5 },
          { x: box.x + box.w * 0.82, y: box.y + box.h * 0.28 },
          { x: box.x + box.w * 0.82, y: box.y + box.h * 0.72 },
        ];

        let bestForward = Number.POSITIVE_INFINITY;
        let hitBoss = false;

        for (const point of samplePoints) {
          const dx = point.x - baseX;
          const dy = point.y - baseY;
          const forward = dx * dir.x + dy * dir.y;
          const side = Math.abs(dx * -dir.y + dy * dir.x);
          const allowedSide = cone * 0.92 + Math.min(box.w, box.h) * 0.3;

          if (
            forward >= -64 &&
            forward <= range + box.w * 0.18 &&
            side <= allowedSide
          ) {
            hitBoss = true;
            bestForward = Math.min(bestForward, Math.max(0, forward));
          }
        }

        if (hitBoss) {
          const applied = Math.min(damage, Math.max(0, boss.hp));
          boss.hp -= damage;
          carregarBoostPorDano(applied);
          criarParticulasHit(
            baseX + dir.x * Math.min(range, bestForward),
            baseY + dir.y * Math.min(range, bestForward),
            powerActive ? "#ffb703" : "#ff7a18",
            4,
          );
          if (boss.hp <= 0) boss.hp = 0;
        }
      }

      // Chama densa: muitas partículas coladas, sem branco, com glow quente.
      const particleQuality = CONFIG.settings.enableParticles
        ? CONFIG.settings.particleQuality
        : 0;
      const isMobileLike = window.matchMedia("(pointer: coarse)").matches;
      const particleAmount = Math.round(
        Math.min(
          isMobileLike ? 8 : 24,
          cfg.flamesParticleAmount * (powerActive ? 1.12 : 1) * particleQuality,
        ),
      );
      const flameColors = [
        "#ff2f00",
        "#ff5a00",
        "#ff7a18",
        "#fb923c",
        "#f97316",
        "#facc15",
      ];
      for (let i = 0; i < particleAmount; i += 1) {
        const progress = Math.pow(randomFloat(), 0.62);
        const dist = 18 + progress * range;
        const widthAtPoint = cone * (0.12 + 0.78 * progress);
        const spread = rand(-widthAtPoint, widthAtPoint);
        const jitter = rand(-5, 5);
        const px = baseX + dir.x * dist + -dir.y * spread + dir.x * jitter;
        const py = baseY + dir.y * dist + dir.x * spread + dir.y * jitter;
        const core = randomFloat() < 0.36;
        const ember = randomFloat() < 0.18;
        const color =
          flameColors[Math.floor(randomFloat() * flameColors.length)];

        particlesRef.current.push({
          id: enemyIdRef.current++,
          x: px,
          y: py,
          vx: dir.x * rand(0.7, 4.4) + -dir.y * rand(-2.2, 2.2),
          vy:
            dir.y * rand(0.7, 4.4) + dir.x * rand(-2.2, 2.2) + rand(-1.9, 0.35),
          size: core
            ? rand(8, powerActive ? 18 : 14)
            : ember
              ? rand(3, 6)
              : rand(5, powerActive ? 14 : 11),
          life: core ? rand(150, 290) : rand(220, 520),
          maxLife: 520,
          color,
        });
      }

      const maxLiveParticles = isMobileLike ? 52 : 170;
      if (particlesRef.current.length > maxLiveParticles) {
        particlesRef.current = particlesRef.current.slice(-maxLiveParticles);
      }

      if (now - lastFlamesHitSoundAtRef.current > 180) {
        lastFlamesHitSoundAtRef.current = now;
        tocarSom(
          CONFIG.sounds.flamesLoop || CONFIG.sounds.normalShot,
          0.22,
          "sfx",
        );
      }
    }

    function shootNormal() {
      const player = playerRef.current;

      if (isLocalWaveMode() && player.hp <= 0) return;

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
      const shopBuffs = buffsCosmeticosEquipados();
      const superSparkShotBonus = performance.now() < petSuperSparkUntilRef.current ? 0.15 : 0;
      const shotSpeed = CONFIG.gameplay.shots.normal.speed * (1 + shopBuffs.shotSpeed + superSparkShotBonus);
      const shotW = powerActive
        ? CONFIG.gameplay.powerups.powerShotWidth
        : CONFIG.gameplay.shots.normal.width;
      const shotH = powerActive
        ? CONFIG.gameplay.powerups.powerShotHeight
        : CONFIG.gameplay.shots.normal.height;

      const pvpAimVy = isLocalPvpMode()
        ? clamp((player.lastInputY || 0) * 3.2 + (player.vy || 0) * 0.08, -4.4, 4.4)
        : 0;
      shotsRef.current.push({
        id: shotIdRef.current++,
        ownerId: 1,
        bornAt: now,
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: player.x + player.w - 2,
        y: player.y + player.h / 2 - shotH / 2,
        w: isLocalPvpMode() && !powerActive ? Math.max(shotW, 34) : shotW,
        h: isLocalPvpMode() && !powerActive ? Math.max(shotH, 18) : shotH,
        speed: shotSpeed,
        damage:
          (CONFIG.gameplay.shots.normal.damage *
            (powerActive
              ? CONFIG.gameplay.powerups.powerShotDamageMultiplier
              : 1) +
          bonusDanoInfinito()) * danoLocalPorJogador() * (1 + shopBuffs.damage + (performance.now() < petSuperSparkUntilRef.current ? 0.15 : 0)),
        type: "normal",
        variant:
          powerActive && homingActive
            ? "powerHoming"
            : powerActive
              ? "power"
              : homingActive
                ? "homing"
                : "normal",
        vx: shotSpeed,
        vy: pvpAimVy,
      });

      tocarSom(CONFIG.sounds.normalShot, 0.45, "sfx");
      player.normalCooldown = isLocalPvpMode()
        ? (fireRateUntilRef.current > now ? 10 : 18)
        : cooldownTiroNormalAtual();

      // No tutorial, o passo de tiro normal só avança quando o alvo de treino for destruído.
    }

    function shootStrong(dirXParam = 1, dirYParam = 0) {
      const player = playerRef.current;
      const now = performance.now();
      const dir = normalizarDirecao(dirXParam, dirYParam);
      const shopBuffsStrong = buffsCosmeticosEquipados();
      const superSparkStrongShotBonus = performance.now() < petSuperSparkUntilRef.current ? 0.15 : 0;
      const strongSpeed = CONFIG.gameplay.shots.strong.speed * (1 + shopBuffsStrong.shotSpeed + superSparkStrongShotBonus);

      if (isLocalWaveMode() && player.hp <= 0) return;

      if (!acaoTutorialPermitida("strong")) {
        return;
      }

      if (now < player.strongReadyAt) {
        return;
      }

      shotsRef.current.push({
        id: shotIdRef.current++,
        ownerId: 1,
        stretchUntil:
          performance.now() + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: player.x + player.w - 2,
        y: player.y + player.h / 2 - CONFIG.gameplay.shots.strong.height / 2,
        w: CONFIG.gameplay.shots.strong.width,
        h: CONFIG.gameplay.shots.strong.height,
        speed: strongSpeed,
        damage: (CONFIG.gameplay.shots.strong.damage + bonusDanoInfinito()) * danoLocalPorJogador() * (1 + shopBuffsStrong.damage + (performance.now() < petSuperSparkUntilRef.current ? 0.15 : 0)),
        type: "strong",
        vx: dir.x * strongSpeed,
        vy: dir.y * strongSpeed,
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
        ) *
        CONFIG.gameplay.dynamicStretch.playerPulseSpeedScale;
      player.stretchVy =
        -dir.y *
        Math.max(
          CONFIG.gameplay.player.maxSpeedX,
          CONFIG.gameplay.player.maxSpeedY,
        ) *
        CONFIG.gameplay.dynamicStretch.playerPulseSpeedScale;

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
      if (gameStateRef.current === "paused") return;

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

      const p2 = player2Ref.current;
      if (p2 && isLocalMode()) {
        const p2StrongRemainingMs = Math.max(0, p2.strongReadyAt - now);
        setPlayer2StrongReadyRatio(
          clamp(1 - p2StrongRemainingMs / CONFIG.gameplay.shots.strong.cooldownMs, 0, 1),
        );
        const p2DodgeReadyAt = p2.dodgeUntil + CONFIG.gameplay.dodge.cooldownMs;
        setPlayer2DodgeReadyRatio(
          clamp(1 - Math.max(0, p2DodgeReadyAt - now) / CONFIG.gameplay.dodge.cooldownMs, 0, 1),
        );
        setPlayer2BoostReadyRatio(
          clamp(1 - Math.max(0, player2BoostReadyAtRef.current - now) / 3600, 0, 1),
        );
      }

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
        if (
          gameStateRef.current === "playing" ||
          gameStateRef.current === "tutorial"
        ) {
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
      const ghostLocal = isLocalWaveMode() && player.hp <= 0;
      const invincible = now < player.invincibleUntil;

      const damageIframeBlink = invincible && now >= petSuperSparkUntilRef.current;
      if (!ghostLocal && damageIframeBlink && !onlineGameplayActiveRef.current && Math.floor(now / 100) % 2 === 0) {
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
      const chargeJitterX = chargingAbility
        ? Math.sin(now * 0.075) * chargeShake
        : 0;
      const chargeJitterY = chargingAbility
        ? Math.cos(now * 0.068) * chargeShake
        : 0;
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

      ctx.globalAlpha = ghostLocal ? 0.38 : 1;
      if (ghostLocal) {
        ctx.shadowColor = LOCAL_PLAYER_COLORS[0];
        ctx.shadowBlur = 18;
      }

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

      desenharCosmeticosNave(ctx, player, { dodge: isDodging, alpha: ghostLocal ? 0.42 : 1, movingFrame: anim.frame, superSpark: performance.now() < petSuperSparkUntilRef.current, equipped: undefined });

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


    function obterGamepadPlayer2() {
      if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
      const pads = Array.from(navigator.getGamepads()).filter(Boolean) as Gamepad[];
      return pads[1] ?? pads[0] ?? null;
    }

    function atualizarInputPlayer2() {
      const p2 = player2Ref.current;
      if (!p2 || !isLocalMode()) return;

      if (onlineConnectedRef.current && !onlineGameplayActiveRef.current) {
        player2ButtonsRef.current = {};
        player2ButtonsPressedRef.current = {};
        player2InputRef.current = { x: 0, y: 0 };
        return;
      }

      if (onlineGameplayActiveRef.current) {
        const previousButtons = player2ButtonsRef.current;
        const remoteSlot = onlineTogetherCoordenado() ? slotVisualPlayer2Online() : 2;
        const sourceInput = onlineRemoteInputsRef.current[remoteSlot] || EMPTY_ONLINE_INPUT_STATE;
        const axes = eixosDeInputOnline(sourceInput);
        const buttons: Record<string, boolean> = {
          "1": sourceInput.shot,
          "7": sourceInput.shot,
          "2": sourceInput.strong,
          "6": sourceInput.strong,
          "0": sourceInput.boost,
          "5": sourceInput.boost,
          "3": sourceInput.dodge,
          "4": sourceInput.dodge,
          "10": sourceInput.pet,
          "pet": sourceInput.pet,
        };
        const pressed: Record<string, boolean> = {};
        for (const key of Object.keys(buttons)) pressed[key] = buttons[key] && !previousButtons[key];
        player2ButtonsRef.current = buttons;
        player2ButtonsPressedRef.current = pressed;
        player2InputRef.current = { x: axes.x, y: axes.y };
        return;
      }

      const keyboardX = (keysRef.current["l"] ? 1 : 0) - (keysRef.current["j"] ? 1 : 0);
      const keyboardY = (keysRef.current["k"] ? 1 : 0) - (keysRef.current["i"] ? 1 : 0);
      let gamepadX = 0;
      let gamepadY = 0;
      const previousButtons = player2ButtonsRef.current;
      const buttons: Record<string, boolean> = {};
      const pressed: Record<string, boolean> = {};
      const pad = obterGamepadPlayer2();

      if (pad?.connected) {
        const deadzone = clamp(Number(CONFIG.settings.gamepadDeadzone) || 0.18, 0.06, 0.5);
        gamepadX = aplicarDeadzone(Number(pad.axes[0] || 0), deadzone);
        gamepadY = aplicarDeadzone(Number(pad.axes[1] || 0), deadzone);
        pad.buttons.forEach((button, index) => {
          const value = button.pressed || button.value > 0.55;
          const key = String(index);
          buttons[key] = value;
          pressed[key] = value && !previousButtons[key];
        });
      }

      player2ButtonsRef.current = buttons;
      player2ButtonsPressedRef.current = pressed;
      player2InputRef.current = {
        x: clamp(keyboardX + gamepadX, -1, 1),
        y: clamp(keyboardY + gamepadY, -1, 1),
      };
    }

    function p2Segurando(...keys: string[]) {
      return keys.some((key) => Boolean(player2ButtonsRef.current[key]));
    }

    function p2Acionado(...keys: string[]) {
      return keys.some((key) => Boolean(player2ButtonsPressedRef.current[key]));
    }

    function atirarNormalPlayer2() {
      const player = player2Ref.current;
      if (!player || player.hp <= 0 || player.normalCooldown > 0) return;
      const now = performance.now();
      const shotSpeed = CONFIG.gameplay.shots.normal.speed;
      const powerActive = player2PowerShotUntilRef.current > now;
      const homingActive = player2HomingShotUntilRef.current > now;
      const shotW = powerActive ? CONFIG.gameplay.powerups.powerShotWidth : CONFIG.gameplay.shots.normal.width;
      const shotH = powerActive ? CONFIG.gameplay.powerups.powerShotHeight : CONFIG.gameplay.shots.normal.height;
      const pvpAimVy = isLocalPvpMode()
        ? clamp((player2InputRef.current.y || player.lastInputY || 0) * 3.2 + (player.vy || 0) * 0.08, -4.4, 4.4)
        : 0;
      shotsRef.current.push({
        id: shotIdRef.current++,
        ownerId: 2,
        bornAt: now,
        stretchUntil: performance.now() + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: isLocalPvpMode() ? player.x - shotW + 2 : player.x + player.w - 2,
        y: player.y + player.h / 2 - shotH / 2,
        w: isLocalPvpMode() && !powerActive ? Math.max(shotW, 34) : shotW,
        h: isLocalPvpMode() && !powerActive ? Math.max(shotH, 18) : shotH,
        speed: shotSpeed,
        damage: (CONFIG.gameplay.shots.normal.damage * (powerActive ? CONFIG.gameplay.powerups.powerShotDamageMultiplier : 1) + bonusDanoInfinito()) * danoLocalPorJogador(),
        type: "normal",
        variant: powerActive && homingActive ? "powerHoming" : powerActive ? "power" : homingActive ? "homing" : "normal",
        vx: isLocalPvpMode() ? -shotSpeed : shotSpeed,
        vy: pvpAimVy,
      });
      player.normalCooldown = isLocalPvpMode()
        ? (player2FireRateUntilRef.current > now ? 10 : 18)
        : (player2FireRateUntilRef.current > now ? Math.max(2, CONFIG.gameplay.shots.normal.cooldownFrames * 0.55) : CONFIG.gameplay.shots.normal.cooldownFrames);
      tocarSom(CONFIG.sounds.normalShot, 0.38, "sfx");
    }

    function atirarFortePlayer2() {
      const player = player2Ref.current;
      if (!player || player.hp <= 0) return;
      const now = performance.now();
      if (now < player.strongReadyAt) return;
      shotsRef.current.push({
        id: shotIdRef.current++,
        ownerId: 2,
        stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: isLocalPvpMode() ? player.x - CONFIG.gameplay.shots.strong.width + 2 : player.x + player.w - 2,
        y: player.y + player.h / 2 - CONFIG.gameplay.shots.strong.height / 2,
        w: CONFIG.gameplay.shots.strong.width,
        h: CONFIG.gameplay.shots.strong.height,
        speed: CONFIG.gameplay.shots.strong.speed,
        damage: (CONFIG.gameplay.shots.strong.damage + bonusDanoInfinito()) * danoLocalPorJogador(),
        type: "strong",
        vx: isLocalPvpMode() ? -CONFIG.gameplay.shots.strong.speed : CONFIG.gameplay.shots.strong.speed,
        vy: isLocalPvpMode()
          ? clamp((player2InputRef.current.y || player.lastInputY || 0) * 6.2, -7.2, 7.2)
          : 0,
      });
      player.strongReadyAt = now + CONFIG.gameplay.shots.strong.cooldownMs;
      setPlayer2StrongReadyRatio(0);
      player.vx += isLocalPvpMode()
        ? CONFIG.gameplay.player.strongShotRecoil
        : -CONFIG.gameplay.player.strongShotRecoil;
      player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
      player.stretchVx = isLocalPvpMode()
        ? CONFIG.gameplay.player.maxSpeedX
        : -CONFIG.gameplay.player.maxSpeedX;
      player.stretchVy = 0;
      tocarSom(CONFIG.sounds.strongShot, 0.42, "sfx");
    }

    function boostPlayer2() {
      const player = player2Ref.current;
      if (!player || player.hp <= 0) return;
      const now = performance.now();
      if (now < player2BoostReadyAtRef.current) return;
      const input = player2InputRef.current;
      const defaultDir = isLocalPvpMode() ? -1 : 1;
      const dir = normalizarDirecao(input.x || player.vx || defaultDir, input.y || player.vy || 0);
      player.boostUntil = now + CONFIG.gameplay.boost.durationMs * 0.9;
      player.boostVx = dir.x * CONFIG.gameplay.boost.speed;
      player.boostVy = dir.y * CONFIG.gameplay.boost.speed;
      player.invincibleUntil = Math.max(player.invincibleUntil, player.boostUntil + 240);
      player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
      player.stretchVx = player.boostVx;
      player.stretchVy = player.boostVy;
      player2BoostReadyAtRef.current = now + 3600;
      setPlayer2BoostReadyRatio(0);
      tocarSom(CONFIG.sounds.boostStart, 0.42, "ability");
      criarParticulasBoost(player, 6);
    }

    function esquivaPlayer2() {
      const player = player2Ref.current;
      if (!player || player.hp <= 0) return;
      const now = performance.now();
      if (now < player.dodgeUntil + CONFIG.gameplay.dodge.cooldownMs) return;
      const dir = normalizarDirecao(player.vx || player2InputRef.current.x || 1, player.vy || player2InputRef.current.y || 0);
      player.dodgeUntil = now + CONFIG.gameplay.dodge.durationMs;
      setPlayer2DodgeReadyRatio(0);
      player.invincibleUntil = Math.max(player.invincibleUntil, player.dodgeUntil);
      player.vx += dir.x * CONFIG.gameplay.dodge.speedImpulse;
      player.vy += dir.y * CONFIG.gameplay.dodge.speedImpulse;
      tocarSom(CONFIG.sounds.dodge, 0.38, "ability");
    }

    function receberDanoPlayer2(dano: number) {
      const player = player2Ref.current;
      if (!player || player.hp <= 0) return;
      const now = performance.now();
      if ((isLocalPvpMode() ? now < player.dodgeUntil : now < player.invincibleUntil || now < player.dodgeUntil)) return;
      if (isLocalPvpMode() && now < player2ShieldUntilRef.current) {
        player2ShieldUntilRef.current = 0;
        player.invincibleUntil = now + 180;
        criarExplosao(player.x + player.w / 2, player.y + player.h / 2, "#67e8f9", 18);
        tocarSom(CONFIG.sounds.shieldBreak || CONFIG.sounds.playerDamage, 0.5, "ability");
        return;
      }
      if (player.goldenHp > 0) {
        player.goldenHp = Math.max(0, player.goldenHp - Math.max(1, Math.ceil(dano)));
        setPlayer2GoldenHp(player.goldenHp);
        player.invincibleUntil = now + (isLocalPvpMode() ? 80 : CONFIG.gameplay.player.invincibleMs);
        tocarSom(CONFIG.sounds.goldenHeart || CONFIG.sounds.playerDamage, 0.42, "ability");
        return;
      }
      const danoAplicado = isLocalPvpMode() ? Math.max(1, Math.round(dano)) : dano;
      player.hp = Math.max(0, Math.round((player.hp - danoAplicado) * 100) / 100);
      player.invincibleUntil = now + (isLocalPvpMode() ? 95 : CONFIG.gameplay.player.invincibleMs);
      setPlayer2Hp(player.hp);
      criarParticulasHit(player.x + player.w / 2, player.y + player.h / 2, "#60a5fa", 12);
      tocarSom(CONFIG.sounds.playerDamage, 0.42, "hit");
      if (isLocalPvpMode()) {
        atualizarStatsPerfilLocal((stats) => ({ ...stats, pvpDamage: stats.pvpDamage + danoAplicado }));
        spawnTokenBurst(player.x + player.w / 2, player.y + player.h / 2, 1, 5, 0.9);
        if (randomFloat() < 0.095) spawnPowerUpPvp(false, { x: player.x + player.w / 2, y: player.y + player.h / 2 }, 2);
      }

      if (player.hp <= 0) {
        if (isLocalPvpMode()) {
          processarPontoPvp(1);
          return;
        }

        const p1Alive = playerRef.current.hp > 0;
        if (onlineTogetherCoordenado()) {
          tratarMorteCoopOnline(player, "P2 AGUARDA REVIVE / PRÓXIMA WAVE");
        } else if (!p1Alive) iniciarGameOverCutscene();
      }
    }

    function receberDanoPlayer1Local(dano: number) {
      const player = playerRef.current;
      const now = performance.now();
      if ((isLocalPvpMode() ? now < player.dodgeUntil : now < player.invincibleUntil || now < player.dodgeUntil) || player.hp <= 0) return;
      if (isLocalPvpMode() && shieldActiveRef.current) {
        shieldActiveRef.current = false;
        setShieldActive(false);
        player.invincibleUntil = now + 180;
        criarExplosao(player.x + player.w / 2, player.y + player.h / 2, "#67e8f9", 18);
        tocarSom(CONFIG.sounds.shieldBreak || CONFIG.sounds.playerDamage, 0.5, "ability");
        return;
      }
      const danoAplicado = isLocalPvpMode() ? Math.max(1, Math.round(dano)) : dano;
      player.hp = Math.max(0, Math.round((player.hp - danoAplicado) * 100) / 100);
      player.invincibleUntil = now + (isLocalPvpMode() ? 95 : CONFIG.gameplay.player.invincibleMs);
      setPlayerHp(player.hp);
      criarParticulasHit(player.x + player.w / 2, player.y + player.h / 2, "#ff6b6b", 12);
      tocarSom(CONFIG.sounds.playerDamage, 0.42, "hit");
      if (isLocalPvpMode()) {
        atualizarStatsPerfilLocal((stats) => ({ ...stats, pvpDamage: stats.pvpDamage + danoAplicado }));
        spawnTokenBurst(player.x + player.w / 2, player.y + player.h / 2, 2, 5, 0.9);
        if (randomFloat() < 0.095) spawnPowerUpPvp(false, { x: player.x + player.w / 2, y: player.y + player.h / 2 }, 1);
      }

      if (player.hp <= 0) {
        if (isLocalPvpMode()) {
          processarPontoPvp(2);
          return;
        }

        const p2Alive = Boolean(player2Ref.current && player2Ref.current.hp > 0);
        if (onlineTogetherCoordenado()) {
          tratarMorteCoopOnline(player, "AGUARDE REVIVE / PRÓXIMA WAVE");
        } else if (!p2Alive) iniciarGameOverCutscene();
      }
    }

    function ativarHabilidadePetPlayer2(slot: PlayerSlot) {
      const player = player2Ref.current;
      if (!player || player.hp <= 0 || isLocalPvpMode()) return;
      const pet = petEquipadoPorSlot(slot);
      if (!pet || pet.id === "pet-none") return;
      const now = performance.now();
      const key = `slot-${slot}-${pet.id}`;
      const readyAt = petSkillReadyAtRef.current[key] || 0;
      if (now < readyAt) return;
      petSkillReadyAtRef.current[key] = now + cooldownHabilidadePetMs(pet.id);
      tocarSom(CONFIG.sounds.petActivate || CONFIG.sounds.powerUpPickup, 0.22, "sfx");
      criarExplosao(player.x + player.w / 2, player.y + player.h / 2, "#93c5fd", 10);
      if (pet.id === "pet-blue-comet") {
        player.invincibleUntil = Math.max(player.invincibleUntil, now + 4200);
        player.stretchUntil = now + 360;
        player.stretchVx = 3.4;
        player.stretchVy = -0.8;
      } else if (pet.id === "pet-red-jumper") {
        shockwavesRef.current.push({ id: enemyIdRef.current++, x: player.x + player.w / 2, y: player.y + player.h / 2, radius: 92, life: 180, maxLife: 180 });
      } else if (pet.id === "pet-black-hole") {
        shockwavesRef.current.push({ id: enemyIdRef.current++, x: player.x + player.w / 2, y: player.y + player.h / 2, radius: 120, life: 220, maxLife: 220 });
      } else if (pet.id === "pet-tundra") {
        for (const enemy of enemiesRef.current) {
          enemy.vx *= 0.72;
          enemy.vy *= 0.72;
          enemy.stretchUntil = Math.max(enemy.stretchUntil ?? 0, now + 180);
        }
      } else {
        player.invincibleUntil = Math.max(player.invincibleUntil, now + 1400);
      }
    }

    function atualizarPlayer2(delta: number, canvas: HTMLCanvasElement) {
      const player = player2Ref.current;
      if (!player || !isLocalMode() || gameStateRef.current !== "playing") return;
      atualizarInputPlayer2();
      const speedFactor = delta / 16.67;
      const input = player2InputRef.current;
      const previousVx = player.vx;
      const previousVy = player.vy;

      const ghostLocal = isLocalWaveMode() && player.hp <= 0;
      if (player.hp > 0 || ghostLocal) {
        const ghostFactor = ghostLocal ? 0.45 : 1;
        if (input.x !== 0) player.vx += input.x * CONFIG.gameplay.player.acceleration * speedFactor * ghostFactor;
        else player.vx *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
        if (input.y !== 0) player.vy += input.y * CONFIG.gameplay.player.acceleration * speedFactor * ghostFactor;
        else player.vy *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);

        const maxX = CONFIG.gameplay.player.maxSpeedX * ghostFactor;
        const maxY = CONFIG.gameplay.player.maxSpeedY * ghostFactor;
        player.vx = clamp(player.vx, -maxX, maxX);
        player.vy = clamp(player.vy, -maxY, maxY);
        if (Math.abs(player.vx) < 0.02) player.vx = 0;
        if (Math.abs(player.vy) < 0.02) player.vy = 0;

        const wasMoving = Math.hypot(previousVx, previousVy) > CONFIG.gameplay.dynamicStretch.playerTriggerSpeed;
        const moving = Math.hypot(player.vx, player.vy) > CONFIG.gameplay.dynamicStretch.playerTriggerSpeed;
        if (!ghostLocal && !wasMoving && moving) {
          player.stretchUntil = performance.now() + CONFIG.gameplay.dynamicStretch.playerPulseMs;
          player.stretchVx = player.vx;
          player.stretchVy = player.vy;
        }

        if (!ghostLocal && performance.now() < player.boostUntil) {
          player.vx = player.boostVx;
          player.vy = player.boostVy;
          criarParticulasBoost(player, 2);
        }

        player.x += player.vx * speedFactor;
        player.y += player.vy * speedFactor;
        player.x = clamp(player.x, 0, canvas.width - player.w);
        player.y = clamp(player.y, 0, canvas.height - player.h);
        player.tilt += (((player.vy / Math.max(0.001, CONFIG.gameplay.player.maxSpeedY)) * CONFIG.gameplay.player.tiltMaxDeg) - player.tilt) * CONFIG.gameplay.player.tiltResponse;

        if (player.normalCooldown > 0) player.normalCooldown = Math.max(0, player.normalCooldown - speedFactor);

        const localP2KeyboardAllowed = !onlineGameplayActiveRef.current && !onlineConnectedRef.current;
        const keyboardShot = localP2KeyboardAllowed && keysRef.current["u"];
        const keyboardStrong = localP2KeyboardAllowed && keysRef.current["o"];
        const keyboardBoost = localP2KeyboardAllowed && keysRef.current["p"];
        const keyboardDodge = localP2KeyboardAllowed && keysRef.current["h"];

        if (!ghostLocal) {
          if (keyboardShot || p2Segurando("1", "7")) atirarNormalPlayer2();
          if (keyboardStrong || p2Segurando("2", "6")) atirarFortePlayer2();
          if (keyboardBoost || p2Segurando("0", "5")) boostPlayer2();
          if (keyboardDodge || p2Acionado("3", "4")) esquivaPlayer2();
          if (p2Acionado("10", "pet")) ativarHabilidadePetPlayer2(slotVisualPlayer2Online());
        }
      }
    }

    function resolverColisoesPlayer2() {
      const player = player2Ref.current;
      if (!player || !isLocalMode() || gameStateRef.current !== "playing") return;
      const hitbox = getPlayerHitbox(player);
      const now = performance.now();
      const intangible = player.hp <= 0 || now < player.invincibleUntil || now < player.dodgeUntil || now < player.boostUntil;
      if (!intangible) {
        for (const enemy of enemiesRef.current) {
          if (rectsCollide(hitbox, enemy)) {
            receberDanoPlayer2(enemy.kind === "asteroid" ? 0 : 1);
            break;
          }
        }
        for (const bullet of enemyProjectilesRef.current) {
          if (rectsCollide(hitbox, bullet)) {
            receberDanoPlayer2(bullet.damage);
            enemyProjectilesRef.current = enemyProjectilesRef.current.filter((item) => item.id !== bullet.id);
            break;
          }
        }
        for (const projectile of bossProjectilesRef.current) {
          const active = !projectile.activeAt || performance.now() >= projectile.activeAt;
          if (!active) continue;
          const hit = projectile.kind === "laser" || projectile.kind === "aimLaser"
            ? rectHitsRotatedBeam(hitbox, projectile)
            : rectsCollide(hitbox, projectile);
          if (hit) {
            receberDanoPlayer2(projectile.damage);
            break;
          }
        }
      }

      if (isLocalMode()) {
        const p1 = playerRef.current;
        const p1Hitbox = getPlayerHitbox(p1);
        const p2Hitbox = getPlayerHitbox(player);
        const nowPvp = performance.now();

        if (isLocalPvpMode() && p1.hp > 0 && player.hp > 0 && rectsCollide(p1Hitbox, p2Hitbox)) {
          const p1cx = p1.x + p1.w / 2;
          const p1cy = p1.y + p1.h / 2;
          const p2cx = player.x + player.w / 2;
          const p2cy = player.y + player.h / 2;
          const dir = normalizarDirecao(p2cx - p1cx || 1, p2cy - p1cy || 0);
          aplicarFlingPlayerLocal(p1, -dir.x, -dir.y, 4.8);
          aplicarFlingPlayerLocal(player, dir.x, dir.y, 4.8);
          p1.x -= dir.x * 10;
          p1.y -= dir.y * 8;
          player.x += dir.x * 10;
          player.y += dir.y * 8;
          manterPlayerNaArena(p1);
          manterPlayerNaArena(player);
          tocarSom(CONFIG.sounds.playerDamage, 0.22, "hit");
        }

        const shotsToRemove = new Set<number>();
        if (isLocalPvpMode()) for (const shot of shotsRef.current) {
          if (shot.ownerId === 1 && player.hp > 0 && rectsCollide(shot, p2Hitbox)) {
            const force = shot.type === "strong" ? 12 : 4.5;
            aplicarFlingPlayerLocal(player, shot.vx ?? 1, shot.vy ?? 0, force);
            receberDanoPlayer2(isLocalPvpMode() ? danoPvpPorTipo(shot.type === "strong" ? "strong" : "normal") : shot.type === "strong" ? 2 : 1);
            shotsToRemove.add(shot.id);
          } else if (shot.ownerId === 2 && p1.hp > 0 && rectsCollide(shot, p1Hitbox)) {
            const force = shot.type === "strong" ? 12 : 4.5;
            aplicarFlingPlayerLocal(p1, shot.vx ?? -1, shot.vy ?? 0, force);
            receberDanoPlayer1Local(isLocalPvpMode() ? danoPvpPorTipo(shot.type === "strong" ? "strong" : "normal") : shot.type === "strong" ? 2 : 1);
            shotsToRemove.add(shot.id);
          }
        }

        if (isLocalPvpMode() && p1.hp > 0 && player.hp > 0) {
          if (nowPvp < p1.boostUntil && rectsCollide(getPlayerHitbox(p1), getPlayerHitbox(player))) {
            aplicarFlingPlayerLocal(player, p1.boostVx || 1, p1.boostVy || 0, 14);
            receberDanoPlayer2(isLocalPvpMode() ? danoPvpPorTipo("boost") : 1);
          }
          if (nowPvp < player.boostUntil && rectsCollide(getPlayerHitbox(player), getPlayerHitbox(p1))) {
            aplicarFlingPlayerLocal(p1, player.boostVx || -1, player.boostVy || 0, 14);
            receberDanoPlayer1Local(isLocalPvpMode() ? danoPvpPorTipo("boost") : 1);
          }
        }

        if (isLocalPvpMode() && p1.hp > 0 && player.hp > 0 && nowPvp < player2FlamesUntilRef.current) {
          const flameBox = {
            x: player.x - 92,
            y: player.y + player.h * 0.12,
            w: 118,
            h: player.h * 0.76,
          };
          if (rectsCollide(flameBox, p1Hitbox) && nowPvp - lastFlamesHitSoundAtRef.current > 230) {
            receberDanoPlayer1Local(Math.max(1, Math.round(danoPvpPorTipo("normal") * 0.42)));
            aplicarFlingPlayerLocal(p1, -1, 0, 3.2);
            criarParticulasHit(p1.x + p1.w / 2, p1.y + p1.h / 2, "#fb923c", 8);
            tocarSom(CONFIG.sounds.flamesHit || CONFIG.sounds.playerDamage, 0.26, "hit");
            lastFlamesHitSoundAtRef.current = nowPvp;
          }
        }

        if (shotsToRemove.size > 0) {
          shotsRef.current = shotsRef.current.filter((shot) => !shotsToRemove.has(shot.id));
        }
      }
    }

    function gamepadParaSlotExtra(slot: PlayerSlot) {
      if (typeof navigator === "undefined" || !navigator.getGamepads) return null;
      const pads = Array.from(navigator.getGamepads()).filter(Boolean) as Gamepad[];
      return pads[slot - 2] ?? null;
    }

    function inputParaSlotExtra(slot: PlayerSlot): OnlineInputState {
      if (onlineGameplayActiveRef.current) {
        return slot === onlineSlotRef.current
          ? inputOnlineLocalAtual()
          : (onlineRemoteInputsRef.current[slot] || EMPTY_ONLINE_INPUT_STATE);
      }
      const pad = gamepadParaSlotExtra(slot);
      if (!pad?.connected) return EMPTY_ONLINE_INPUT_STATE;
      const deadzone = clamp(Number(CONFIG.settings.gamepadDeadzone) || 0.18, 0.06, 0.5);
      const x = aplicarDeadzone(Number(pad.axes[0] || 0), deadzone);
      const y = aplicarDeadzone(Number(pad.axes[1] || 0), deadzone);
      return {
        left: x < -0.24,
        right: x > 0.24,
        up: y < -0.24,
        down: y > 0.24,
        shot: Boolean(pad.buttons[0]?.pressed || pad.buttons[7]?.pressed),
        strong: Boolean(pad.buttons[2]?.pressed || pad.buttons[6]?.pressed),
        boost: Boolean(pad.buttons[1]?.pressed || pad.buttons[5]?.pressed),
        dodge: Boolean(pad.buttons[3]?.pressed || pad.buttons[4]?.pressed),
        pause: Boolean(pad.buttons[9]?.pressed),
        pet: Boolean(pad.buttons[10]?.pressed),
      };
    }

    function aplicarPowerUpRuntimeExtra(runtime: PlayerRuntime, kind: PowerUpKind) {
      const now = performance.now();
      const player = runtime.runtime;
      if (kind === "randomBox") {
        const options: PowerUpKind[] = ["regen", "fireRate", "shield", "powerShot", "homingShot"];
        aplicarPowerUpRuntimeExtra(runtime, options[Math.floor(randomFloat() * options.length)]);
        return;
      }
      if (kind === "regen" || kind === "tripleRegen") {
        const amount = kind === "tripleRegen" ? (isLocalPvpMode() ? 18 : 2) : (isLocalPvpMode() ? 8 : 1);
        player.hp = Math.min(vidaMaximaLocal(), player.hp + amount);
        runtime.hp = player.hp;
      } else if (kind === "goldenHeart") {
        player.goldenHp = Math.min(CONFIG.gameplay.powerups.goldenHeartMax, player.goldenHp + 1);
        runtime.goldenLives = player.goldenHp;
      } else if (kind === "shield") {
        runtime.powerups.shieldUntil = now + 7200;
        runtime.shieldUntil = runtime.powerups.shieldUntil;
        player.invincibleUntil = Math.max(player.invincibleUntil, now + 900);
      } else if (kind === "fireRate") {
        runtime.powerups.fireRateUntil = now + CONFIG.gameplay.powerups.fireRateDurationMs;
      } else if (kind === "powerShot") {
        runtime.powerups.powerShotUntil = now + CONFIG.gameplay.powerups.powerShotDurationMs;
      } else if (kind === "homingShot") {
        runtime.powerups.homingUntil = now + CONFIG.gameplay.powerups.homingShotDurationMs;
      } else if (kind === "flames") {
        runtime.powerups.flamesUntil = now + CONFIG.gameplay.powerups.flamesDurationMs;
      }
      criarExplosao(player.x + player.w / 2, player.y + player.h / 2, powerUpColor(kind), 14);
      tocarSom(CONFIG.sounds.powerUpPickup || CONFIG.sounds.abilityReady, 0.35, "ability");
    }

    function atirarNormalRuntimeExtra(runtime: PlayerRuntime) {
      const player = runtime.runtime;
      const now = performance.now();
      if (player.hp <= 0 || player.normalCooldown > 0) return;
      const powerActive = (runtime.powerups.powerShotUntil ?? 0) > now;
      const homingActive = (runtime.powerups.homingUntil ?? 0) > now;
      const shotW = powerActive ? CONFIG.gameplay.powerups.powerShotWidth : CONFIG.gameplay.shots.normal.width;
      const shotH = powerActive ? CONFIG.gameplay.powerups.powerShotHeight : CONFIG.gameplay.shots.normal.height;
      const dir = isLocalPvpMode() && runtime.slot % 2 === 0 ? -1 : 1;
      shotsRef.current.push({
        id: shotIdRef.current++,
        ownerId: runtime.slot,
        bornAt: now,
        stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: dir > 0 ? player.x + player.w - 2 : player.x - shotW + 2,
        y: player.y + player.h / 2 - shotH / 2,
        w: shotW,
        h: shotH,
        speed: CONFIG.gameplay.shots.normal.speed,
        damage: (CONFIG.gameplay.shots.normal.damage * (powerActive ? CONFIG.gameplay.powerups.powerShotDamageMultiplier : 1) + bonusDanoInfinito()) * danoLocalPorJogador(),
        type: "normal",
        variant: powerActive && homingActive ? "powerHoming" : powerActive ? "power" : homingActive ? "homing" : "normal",
        vx: CONFIG.gameplay.shots.normal.speed * dir,
        vy: 0,
      });
      player.normalCooldown = (runtime.powerups.fireRateUntil ?? 0) > now ? 10 : (isLocalPvpMode() ? 18 : CONFIG.gameplay.shots.normal.cooldownFrames);
      tocarSom(CONFIG.sounds.normalShot, 0.28, "sfx");
    }

    function atirarForteRuntimeExtra(runtime: PlayerRuntime, dirXParam = 1, dirYParam = 0) {
      const player = runtime.runtime;
      const now = performance.now();
      if (player.hp <= 0 || now < player.strongReadyAt) return;
      const dir = normalizarDirecao(
        dirXParam || (isLocalPvpMode() && runtime.slot % 2 === 0 ? -1 : 1),
        dirYParam || 0,
      );
      const shotW = CONFIG.gameplay.shots.strong.width;
      const shotH = CONFIG.gameplay.shots.strong.height;
      shotsRef.current.push({
        id: shotIdRef.current++,
        ownerId: runtime.slot,
        bornAt: now,
        stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        x: dir.x >= 0 ? player.x + player.w - 2 : player.x - shotW + 2,
        y: player.y + player.h / 2 - shotH / 2,
        w: shotW,
        h: shotH,
        speed: CONFIG.gameplay.shots.strong.speed,
        damage: (CONFIG.gameplay.shots.strong.damage + bonusDanoInfinito()) * danoLocalPorJogador(),
        type: "strong",
        vx: dir.x * CONFIG.gameplay.shots.strong.speed,
        vy: dir.y * CONFIG.gameplay.shots.strong.speed,
      });
      player.strongReadyAt = now + CONFIG.gameplay.shots.strong.cooldownMs;
      player.vx -= dir.x * CONFIG.gameplay.player.strongShotRecoil;
      player.vy -= dir.y * CONFIG.gameplay.player.strongShotRecoil;
      player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
      player.stretchVx = -dir.x * CONFIG.gameplay.player.maxSpeedX;
      player.stretchVy = -dir.y * CONFIG.gameplay.player.maxSpeedY;
      tocarSom(CONFIG.sounds.strongShot, 0.38, "sfx");
    }

    function atualizarPlayersExtrasRuntime(delta: number, canvas: HTMLCanvasElement) {
      if (!isLocalMode() || gameStateRef.current !== "playing") return;
      const speedFactor = delta / 16.67;
      const now = performance.now();
      const mainRemoteSlot = onlineTogetherCoordenado() ? slotVisualPlayer2Online() : 2;
      const runtimes = sincronizarPlayersRuntime().filter((runtime) => {
        if (onlineTogetherCoordenado()) return runtime.slot !== slotLocalOnline() && runtime.slot !== mainRemoteSlot;
        return runtime.slot >= 3;
      });
      for (const runtime of runtimes) {
        const player = runtime.runtime;
        const predictedLocal = onlineGameplayActiveRef.current && runtime.slot === onlineSlotRef.current;
        if (onlineGameplayActiveRef.current && !onlineTogetherCoordenado() && !souHostOnline() && !predictedLocal) continue;
        const input = inputParaSlotExtra(runtime.slot);
        runtime.input = input;
        const axes = eixosDeInputOnline(input);
        const ghostLocal = isLocalWaveMode() && player.hp <= 0;
        const controlFactor = ghostLocal ? 0.45 : 1;
        if (player.hp > 0 || ghostLocal) {
          if (axes.x !== 0) player.vx += axes.x * CONFIG.gameplay.player.acceleration * speedFactor * controlFactor;
          else player.vx *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
          if (axes.y !== 0) player.vy += axes.y * CONFIG.gameplay.player.acceleration * speedFactor * controlFactor;
          else player.vy *= Math.pow(CONFIG.gameplay.player.friction, speedFactor);
          player.vx = clamp(player.vx, -CONFIG.gameplay.player.maxSpeedX * controlFactor, CONFIG.gameplay.player.maxSpeedX * controlFactor);
          player.vy = clamp(player.vy, -CONFIG.gameplay.player.maxSpeedY * controlFactor, CONFIG.gameplay.player.maxSpeedY * controlFactor);
          if (now < player.boostUntil) {
            player.vx = player.boostVx;
            player.vy = player.boostVy;
            criarParticulasBoost(player, 2);
          }
          player.x = clamp(player.x + player.vx * speedFactor, 0, canvas.width - player.w);
          player.y = clamp(player.y + player.vy * speedFactor, 0, canvas.height - player.h);
          player.tilt += (((player.vy / Math.max(0.001, CONFIG.gameplay.player.maxSpeedY)) * CONFIG.gameplay.player.tiltMaxDeg) - player.tilt) * CONFIG.gameplay.player.tiltResponse;
          if (player.normalCooldown > 0) player.normalCooldown = Math.max(0, player.normalCooldown - speedFactor);
          if (!ghostLocal && input.shot) atirarNormalRuntimeExtra(runtime);
          if (!ghostLocal && input.strong) atirarForteRuntimeExtra(runtime, axes.x || (isLocalPvpMode() && runtime.slot % 2 === 0 ? -1 : 1), axes.y || 0);
          if (!ghostLocal && input.boost && now >= player.boostUntil + 2400) {
            const dir = normalizarDirecao(axes.x || (isLocalPvpMode() && runtime.slot % 2 === 0 ? -1 : 1), axes.y || 0);
            player.boostUntil = now + CONFIG.gameplay.boost.durationMs * 0.82;
            player.boostVx = dir.x * CONFIG.gameplay.boost.speed;
            player.boostVy = dir.y * CONFIG.gameplay.boost.speed;
            player.invincibleUntil = Math.max(player.invincibleUntil, player.boostUntil + 160);
            player.stretchUntil = now + CONFIG.gameplay.dynamicStretch.playerPulseMs;
          }
          if (!ghostLocal && input.dodge && now >= player.dodgeUntil + CONFIG.gameplay.dodge.cooldownMs) {
            const dir = normalizarDirecao(axes.x || player.vx || 1, axes.y || player.vy || 0);
            player.dodgeUntil = now + CONFIG.gameplay.dodge.durationMs;
            player.invincibleUntil = Math.max(player.invincibleUntil, player.dodgeUntil);
            player.vx += dir.x * CONFIG.gameplay.dodge.speedImpulse;
            player.vy += dir.y * CONFIG.gameplay.dodge.speedImpulse;
          }
        }
        atualizarPlayerRuntime(runtime, player, onlinePlayers.find((item) => item.slot === runtime.slot));
      }
    }

    function resolverPowerUpsExtrasRuntime() {
      if (!isLocalMode() || gameStateRef.current !== "playing") return;
      const runtimes = playersRef.current.filter((runtime) => runtime.slot >= 3 && runtime.runtime.hp > 0 && (!onlineTogetherCoordenado() || runtime.slot === onlineSlotRef.current));
      if (runtimes.length === 0 || powerUpsRef.current.length === 0) return;
      const collected = new Set<number>();
      for (const power of powerUpsRef.current) {
        const box = { x: power.x + power.w * 0.14, y: power.y + power.h * 0.14, w: power.w * 0.72, h: power.h * 0.72 };
        for (const runtime of runtimes) {
          if (power.blockedPlayer === runtime.slot && performance.now() < (power.blockedUntil ?? 0)) continue;
          if (rectsCollide(getPlayerHitbox(runtime.runtime), box)) {
            collected.add(power.id);
            pararLoopPowerUpTrail(power.id);
            aplicarPowerUpRuntimeExtra(runtime, power.kind);
            break;
          }
        }
      }
      if (collected.size > 0) {
        powerUpsRef.current = powerUpsRef.current.filter((power) => !collected.has(power.id));
      }
    }

    function desenharIndicadorJogadorLocal(
      ctx: CanvasRenderingContext2D,
      player: Player | null,
      label: string,
      color: string,
    ) {
      if (!player || !isLocalMode()) return;
      const centerX = player.x + player.w / 2;
      const arrowY = Math.max(24, player.y - 34);
      ctx.save();
      ctx.fillStyle = color;
      ctx.strokeStyle = "rgba(255,255,255,0.92)";
      ctx.lineWidth = 3;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(centerX, arrowY + 28);
      ctx.lineTo(centerX - 16, arrowY);
      ctx.lineTo(centerX + 16, arrowY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      if (espelharOnlinePvpVisual()) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.fillText(label, -centerX, arrowY - 12);
        ctx.restore();
      } else {
        ctx.fillText(label, centerX, arrowY - 12);
      }
      ctx.restore();
    }

    function desenharPlayer2(ctx: CanvasRenderingContext2D, delta: number) {
      const player = player2Ref.current;
      if (!player || !isLocalMode()) return;
      const now = performance.now();
      const ghostLocal = isLocalWaveMode() && player.hp <= 0;
      const shieldVisual = player.hp > 0 && (now < player2ShieldUntilRef.current || (!isLocalPvpMode() && now + 1600 < player.invincibleUntil));
      if (!ghostLocal && player.hp <= 0 && Math.floor(now / 180) % 2 === 0) return;
      if (!isLocalPvpMode() && !ghostLocal && shieldVisual && !onlineGameplayActiveRef.current && Math.floor(now / 100) % 2 === 0) return;

      const anim = playerAnimRef.current;
      anim.update(delta);
      const moving = Math.hypot(player.vx, player.vy) > CONFIG.gameplay.player.animationMoveThreshold || now < player.boostUntil;
      const img = moving ? assetsRef.current.getFrame("player", anim.frame) : assetsRef.current.get("player");

      ctx.save();
      ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
      ctx.rotate((player.tilt * Math.PI) / 180);
      if (isLocalPvpMode()) ctx.scale(-1, 1);
      const pulse = getStretchPulse(player.stretchUntil, "player");
      applyVelocityStretch(ctx, player.stretchVx, player.stretchVy, getStretchSettings("player").multiplier, pulse);
      ctx.globalAlpha = ghostLocal ? 0.36 : player.hp <= 0 ? 0.34 : 1;
      ctx.shadowColor = LOCAL_PLAYER_COLORS[1];
      ctx.shadowBlur = ghostLocal ? 24 : 16;

      if (img) {
        ctx.save();
        ctx.filter = ghostLocal
          ? "saturate(0.35) brightness(1.25) opacity(0.72)"
          : "sepia(0.55) saturate(1.8) hue-rotate(-22deg) brightness(1.08)";
        ctx.drawImage(img, -player.w / 2, -player.h / 2, player.w, player.h);
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = ghostLocal ? 0.18 : 0.24;
        ctx.shadowColor = LOCAL_PLAYER_COLORS[1];
        ctx.shadowBlur = 18;
        ctx.drawImage(img, -player.w / 2, -player.h / 2, player.w, player.h);
        ctx.restore();
      } else {
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(player.w / 2, 0);
        ctx.lineTo(-player.w / 2, -player.h / 2);
        ctx.lineTo(-player.w / 2, player.h / 2);
        ctx.closePath();
        ctx.fill();
      }
      desenharCosmeticosNave(ctx, player, { dodge: now < player.dodgeUntil, alpha: ghostLocal ? 0.3 : 0.88, movingFrame: anim.frame, equipped: onlineGameplayActiveRef.current ? onlineCosmeticsBySlotRef.current[slotVisualPlayer2Online()] : undefined });

      if (shieldVisual) {
        const t = now * 0.006;
        ctx.save();
        ctx.globalAlpha = 0.38 + Math.sin(t * 2) * 0.1;
        ctx.strokeStyle = LOCAL_PLAYER_COLORS[1];
        ctx.lineWidth = 4;
        ctx.shadowColor = "#67e8f9";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(0, 0, player.w * 0.7, player.h * 0.76, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = "#67e8f9";
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    function desenharPlayersExtrasRuntime(ctx: CanvasRenderingContext2D, delta: number) {
      if (!isLocalMode()) return;
      const now = performance.now();
      const runtimes = sincronizarPlayersRuntime().filter((runtime) => runtime.slot >= 3);
      if (runtimes.length === 0) return;
      const anim = playerAnimRef.current;
      anim.update(delta);
      for (const runtime of runtimes) {
        const player = runtime.runtime;
        const ghostLocal = isLocalWaveMode() && player.hp <= 0;
        if (!ghostLocal && player.hp <= 0 && Math.floor(now / 180) % 2 === 0) continue;
        const moving = Math.hypot(player.vx, player.vy) > CONFIG.gameplay.player.animationMoveThreshold || now < player.boostUntil;
        const img = moving ? assetsRef.current.getFrame("player", anim.frame) : assetsRef.current.get("player");
        const color = runtime.color || LOCAL_PLAYER_COLORS[runtime.slot - 1] || "#ffffff";
        ctx.save();
        ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
        ctx.rotate((player.tilt * Math.PI) / 180);
        if (isLocalPvpMode() && runtime.slot % 2 === 0) ctx.scale(-1, 1);
        const pulse = getStretchPulse(player.stretchUntil, "player");
        applyVelocityStretch(ctx, player.stretchVx, player.stretchVy, getStretchSettings("player").multiplier, pulse);
        ctx.globalAlpha = ghostLocal ? 0.34 : 0.94;
        ctx.shadowColor = color;
        ctx.shadowBlur = ghostLocal ? 24 : 14;
        if (img) {
          ctx.save();
          ctx.filter = runtime.slot === 3
            ? "sepia(0.35) saturate(1.7) hue-rotate(82deg) brightness(1.08)"
            : "sepia(0.35) saturate(1.8) hue-rotate(210deg) brightness(1.12)";
          ctx.drawImage(img, -player.w / 2, -player.h / 2, player.w, player.h);
          ctx.restore();
        } else {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(player.w / 2, 0);
          ctx.lineTo(-player.w / 2, -player.h / 2);
          ctx.lineTo(-player.w / 2, player.h / 2);
          ctx.closePath();
          ctx.fill();
        }
        desenharCosmeticosNave(ctx, player, { dodge: now < player.dodgeUntil, alpha: ghostLocal ? 0.28 : 0.82, movingFrame: anim.frame, equipped: onlineGameplayActiveRef.current ? onlineCosmeticsBySlotRef.current[runtime.slot] : undefined });
        const shieldUntil = runtime.powerups.shieldUntil ?? runtime.shieldUntil ?? 0;
        if (player.hp > 0 && now < shieldUntil) {
          ctx.globalAlpha = 0.35 + Math.sin(now * 0.012) * 0.08;
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(0, 0, player.w * 0.72, player.h * 0.76, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        desenharIndicadorJogadorLocal(ctx, player, `P${runtime.slot}`, color);
      }
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
        true,
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

      if (enemy.kind !== "fragment") {
        const hpRatio = clamp(enemy.hp / Math.max(1, enemy.maxHp), 0, 1);
        const barW = Math.max(34, Math.min(enemy.w * 0.72, 108));
        const barH = enemy.kind === "black" || enemy.kind === "alien" ? 7 : 5;
        const barX = enemy.x + (enemy.w - barW) / 2;
        const barY = enemy.y - 13;
        ctx.save();
        ctx.globalAlpha = hpRatio < 0.999 ? 1 : 0.72;
        ctx.fillStyle = "rgba(5,3,10,0.88)";
        roundRect(ctx, barX - 3, barY - 3, barW + 6, barH + 6, 3);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,236,161,0.72)";
        ctx.lineWidth = 1.5;
        roundRect(ctx, barX - 3, barY - 3, barW + 6, barH + 6, 3);
        ctx.stroke();
        const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        gradient.addColorStop(0, hpRatio < 0.35 ? "#ff365f" : "#ff8a3d");
        gradient.addColorStop(1, hpRatio < 0.35 ? "#ffb15c" : "#ffe78a");
        ctx.fillStyle = gradient;
        roundRect(ctx, barX, barY, barW * hpRatio, barH, 2);
        ctx.fill();
        ctx.restore();
      }

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

      tocarSom(CONFIG.sounds.chocadoServo, 0.42, "sfx");
    }

    function spawnBossLaser(pattern: "x" | "triple") {
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const reduced = usarEfeitosReduzidos();
      const activeMs = reduced
        ? Math.min(900, cfg.laserActiveMs)
        : cfg.laserActiveMs;
      const life = cfg.laserTelegraphMs + activeMs;

      const boss = bossRef.current;
      if (pattern === "x") {
        const offsets = cfg.attackOffsets.laserX;
        const originX = boss.x + boss.w * 0.26 + offsets.x;
        const originY = boss.y + boss.h * 0.5 + offsets.y;
        const angles = reduced ? [0.34] : [0.43, -0.43];
        for (const spreadAngle of angles) {
          const angle = Math.PI + spreadAngle;
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "laser",
            x: originX,
            y: originY,
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
        const originX = boss.x + boss.w * 0.24 + offsets.x;
        const allLanes = offsets.lanesY.map((laneY) => laneY + offsets.y);
        const lanes = reduced
          ? [allLanes[Math.floor(allLanes.length / 2)]]
          : allLanes;
        for (const y of lanes) {
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "laser",
            x: originX,
            y,
            w: 1740,
            h: cfg.laserThicknessTriple,
            vx: 0,
            vy: 0,
            damage: cfg.laserDamage,
            life,
            maxLife: life,
            angle: Math.PI,
            activeAt: now + cfg.laserTelegraphMs,
          });
        }
      }

      tocarSom(
        CONFIG.sounds.chocadoLaserCharge || CONFIG.sounds.chocadoLaser,
        0.38,
        "sfx",
      );
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

      tocarSom(CONFIG.sounds.chocadoCannon, 0.42, "sfx");
    }

    function spawnBossServoWaveAttack() {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const count = Math.max(
        2,
        Math.floor(rand(cfg.servoWaveCountMin, cfg.servoWaveCountMax + 1) / 2) *
          2,
      );
      const pairs = count / 2;
      const offsets = cfg.attackOffsets.servoWave;
      const topStart = boss.y + offsets.topY;
      const bottomStart = boss.y + boss.h + offsets.bottomY;
      const topTarget =
        CONFIG.canvasHeight - cfg.servoWaveSize + offsets.topTargetY;
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
      tocarSom(
        CONFIG.sounds.chocadoAimLock || CONFIG.sounds.chocadoLaser,
        0.38,
        "sfx",
      );
    }

    function spawnBossOrbFan(enraged = false) {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const reduced = usarEfeitosReduzidos();
      const originX = boss.x + cfg.attackOffsets.cannon.x;
      const originY = boss.y + boss.h / 2 + cfg.attackOffsets.cannon.middleY;
      const count = reduced ? (enraged ? 6 : 5) : enraged ? 8 : 6;
      const spread = enraged ? 0.68 : 0.56;

      for (let i = 0; i < count; i += 1) {
        const t = count <= 1 ? 0.5 : i / (count - 1);
        const angle = Math.PI + (t - 0.5) * spread;
        const speed = cfg.cannonOrbSpeed * (enraged ? 1.02 : 0.86);
        bossProjectilesRef.current.push({
          id: bossProjectileIdRef.current++,
          kind: "orb",
          x: originX,
          y: originY,
          w: enraged ? 26 : 23,
          h: enraged ? 26 : 23,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage: cfg.cannonOrbDamage,
          life: enraged ? 5700 : 5000,
          maxLife: enraged ? 5700 : 5000,
          stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
          activeAt: now + i * (enraged ? 72 : 84),
          phase: i,
        });
      }
      tocarSom(
        CONFIG.sounds.chocadoOrbFan ||
          CONFIG.sounds.chocadoOrb ||
          CONFIG.sounds.chocadoCannon,
        0.34,
        "sfx",
      );
    }

    function spawnBossPrismSweep(enraged = false) {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const reduced = usarEfeitosReduzidos();
      const telegraph = enraged ? 1080 : 1280;
      const activeMs = enraged ? 1550 : 1400;
      const originX = boss.x + cfg.attackOffsets.cannon.x;
      const allOrigins = [
        boss.y + cfg.attackOffsets.cannon.topY,
        boss.y + boss.h / 2 + cfg.attackOffsets.cannon.middleY,
        boss.y + boss.h + cfg.attackOffsets.cannon.bottomY,
      ];
      const origins = reduced ? [allOrigins[0], allOrigins[2]] : allOrigins;
      const sweepPairs = enraged
        ? [
            { start: -0.46, end: -0.1 },
            { start: 0.18, end: -0.18 },
            { start: 0.46, end: 0.1 },
          ]
        : [
            { start: -0.34, end: -0.1 },
            { start: 0.08, end: -0.08 },
            { start: 0.34, end: 0.1 },
          ];
      const pairs = reduced ? [sweepPairs[0], sweepPairs[2]] : sweepPairs;

      origins.forEach((originY, index) => {
        const activeAt = now + telegraph + index * (enraged ? 145 : 175);
        const startAngle = Math.PI + pairs[index].start;
        const endAngle = Math.PI + pairs[index].end;
        bossProjectilesRef.current.push({
          id: bossProjectileIdRef.current++,
          kind: "laser",
          x: originX,
          y: originY,
          w: 1550,
          h: enraged ? 36 : 30,
          vx: 0,
          vy: 0,
          damage: cfg.laserDamage,
          life: telegraph + activeMs + index * 175,
          maxLife: telegraph + activeMs + index * 175,
          angle: startAngle,
          angleStart: startAngle,
          angleEnd: endAngle,
          sweepStartAt: activeAt,
          sweepDurationMs: activeMs,
          activeAt,
          visualVariant: "prism",
          stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        });
      });

      tocarSom(
        CONFIG.sounds.chocadoPrismCharge ||
          CONFIG.sounds.chocadoLaserCharge ||
          CONFIG.sounds.chocadoWarning ||
          CONFIG.sounds.chocadoLaser,
        0.45,
        "sfx",
      );
    }

    function spawnBossSerpentPattern(enraged = false) {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const reduced = usarEfeitosReduzidos();
      const count = reduced ? (enraged ? 9 : 7) : enraged ? 13 : 10;
      const streams = reduced ? 1 : 2;
      const originX = boss.x + cfg.attackOffsets.cannon.x;
      const centerY = boss.y + boss.h / 2;
      const amplitude = enraged ? 118 : 88;

      for (let stream = 0; stream < streams; stream += 1) {
        for (let i = 0; i < count; i += 1) {
          const phase = i * 0.64 + stream * Math.PI;
          const delay = i * (enraged ? 96 : 118) + stream * 55;
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "orb",
            x: originX,
            y: centerY + Math.sin(phase) * amplitude,
            baseY: centerY,
            driftAmplitude: amplitude,
            driftFrequency: enraged ? 0.0043 : 0.0037,
            w: enraged ? 23 : 21,
            h: enraged ? 23 : 21,
            vx: -(enraged ? 3.08 : 2.78),
            vy: 0,
            damage: cfg.cannonOrbDamage,
            life: enraged ? 6500 : 5900,
            maxLife: enraged ? 6500 : 5900,
            activeAt: now + delay,
            stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
            phase,
            visualVariant: "shard",
          });
        }
      }
      tocarSom(
        CONFIG.sounds.chocadoSerpent ||
          CONFIG.sounds.chocadoOrb ||
          CONFIG.sounds.chocadoServo,
        0.36,
        "sfx",
      );
    }

    function spawnBossCorePulse(enraged = false) {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const reduced = usarEfeitosReduzidos();
      const waves = enraged && !reduced ? 3 : 2;
      const count = reduced ? (enraged ? 8 : 7) : enraged ? 10 : 8;
      const originX = boss.x + cfg.attackOffsets.cannon.x;
      const originY = boss.y + boss.h / 2 + cfg.attackOffsets.cannon.middleY;

      for (let wave = 0; wave < waves; wave += 1) {
        for (let i = 0; i < count; i += 1) {
          const t = count <= 1 ? 0.5 : i / (count - 1);
          if (wave % 2 === 1 && Math.abs(t - 0.5) < 0.14) continue;
          const angle = Math.PI + (t - 0.5) * (enraged ? 1.58 : 1.32);
          const speed = (enraged ? 3.55 : 3.12) + wave * 0.14;
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "orb",
            x: originX,
            y: originY,
            w: enraged ? 25 : 23,
            h: enraged ? 25 : 23,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: cfg.cannonOrbDamage,
            life: 5900,
            maxLife: 5900,
            activeAt: now + wave * 470 + i * 46,
            phase: i + wave * 10,
            visualVariant: enraged ? "phase2" : "default",
            stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
          });
        }
      }
      tocarSom(
        CONFIG.sounds.chocadoCorePulse ||
          CONFIG.sounds.chocadoOrbFan ||
          CONFIG.sounds.chocadoOrb,
        0.37,
        "sfx",
      );
    }

    function spawnBossMineField(enraged = true) {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const now = performance.now();
      const reduced = usarEfeitosReduzidos();
      const count = reduced ? (enraged ? 5 : 4) : enraged ? 6 : 5;
      const originX = boss.x + cfg.attackOffsets.cannon.x;
      const gap = CONFIG.canvasHeight / (count + 1);

      for (let i = 0; i < count; i += 1) {
        const baseY = gap * (i + 1);
        bossProjectilesRef.current.push({
          id: bossProjectileIdRef.current++,
          kind: "orb",
          x: originX + (i % 2) * 24,
          y: baseY,
          baseY,
          driftAmplitude: enraged ? 44 : 30,
          driftFrequency: enraged ? 0.0032 : 0.0028,
          w: enraged ? 37 : 33,
          h: enraged ? 37 : 33,
          vx: -(enraged ? 1.48 : 1.22),
          vy: 0,
          damage: cfg.cannonOrbDamage,
          life: enraged ? 8200 : 7400,
          maxLife: enraged ? 8200 : 7400,
          activeAt: now + i * 245,
          phase: i * 0.82,
          visualVariant: "mine",
          stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
        });
      }
      tocarSom(
        CONFIG.sounds.chocadoMineDeploy ||
          CONFIG.sounds.chocadoBarrier ||
          CONFIG.sounds.chocadoOrb,
        0.36,
        "sfx",
      );
    }

    function spawnBossCrossBurst(enraged = false) {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const player = playerRef.current;
      const now = performance.now();
      const reduced = usarEfeitosReduzidos();
      const originX = boss.x + cfg.attackOffsets.cannon.x;
      const originsY = [
        boss.y + cfg.attackOffsets.cannon.topY,
        boss.y + boss.h / 2 + cfg.attackOffsets.cannon.middleY,
        boss.y + boss.h + cfg.attackOffsets.cannon.bottomY,
      ];

      originsY.forEach((originY, lane) => {
        const dx = player.x + player.w / 2 - originX;
        const dy = player.y + player.h / 2 - originY;
        const baseAngle = Math.atan2(dy, dx);
        const offsets = reduced
          ? [0]
          : enraged
            ? [-0.16, 0, 0.16]
            : [-0.11, 0.11];
        offsets.forEach((offset, index) => {
          const angle = baseAngle + offset;
          const speed = enraged ? 3.92 : 3.48;
          bossProjectilesRef.current.push({
            id: bossProjectileIdRef.current++,
            kind: "orb",
            x: originX,
            y: originY,
            w: enraged ? 23 : 21,
            h: enraged ? 23 : 21,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            damage: cfg.cannonOrbDamage,
            life: 5700,
            maxLife: 5700,
            activeAt: now + lane * 300 + index * 82,
            phase: lane * 10 + index,
            visualVariant: "shard",
            stretchUntil: now + CONFIG.gameplay.dynamicStretch.shotPulseMs,
          });
        });
      });
      tocarSom(
        CONFIG.sounds.chocadoCrossBurst || CONFIG.sounds.chocadoCannon,
        0.36,
        "sfx",
      );
    }

    function spawnBossEnragedCombo() {
      // Um padrão complexo por vez: visualmente rico sem empilhar dano impossível.
      const pick = Math.floor(randomFloat() * 4);
      if (pick === 0) spawnBossPrismSweep(true);
      else if (pick === 1) spawnBossCorePulse(true);
      else if (pick === 2) spawnBossMineField(true);
      else spawnBossSerpentPattern(true);
    }

    function iniciarProximoAtaqueDoBoss() {
      const boss = bossRef.current;
      const cfg = CONFIG.gameplay.boss.chocado;
      const enraged = boss.hp <= cfg.enragedHp;
      const advanced = boss.hp <= 390;
      const now = performance.now();
      const recent = bossAttackHistoryRef.current.slice(-2);

      const pool = enraged
        ? [3, 4, 5, 6, 7, 8, 9, 6, 7]
        : advanced
          ? [0, 1, 2, 3, 4, 5, 6, 7, 9, 6]
          : [0, 1, 2, 3, 4, 5, 9, 4];
      const possible = pool.filter((attackId) => !recent.includes(attackId));
      const usable =
        possible.length > 0
          ? possible
          : pool.filter((attackId) => attackId !== boss.attackIndex);
      const attack = usable[Math.floor(randomFloat() * usable.length)];

      if (attack === 0) {
        const evenCount = Math.max(
          2,
          Math.floor(rand(cfg.servoCountMin, cfg.servoCountMax + 1) / 2) * 2,
        );
        spawnBossServoPair(
          usarEfeitosReduzidos() ? Math.min(6, evenCount) : evenCount,
        );
        boss.nextAttackAt = now + rand(3500, 4500);
      } else if (attack === 1) {
        spawnBossLaser(randomFloat() < 0.5 ? "x" : "triple");
        boss.nextAttackAt =
          now + cfg.laserTelegraphMs + cfg.laserActiveMs + rand(1350, 1850);
      } else if (attack === 2) {
        spawnBossServoWaveAttack();
        boss.nextAttackAt = now + rand(3400, 4400);
      } else if (attack === 3) {
        spawnBossAimedLaser();
        boss.nextAttackAt =
          now + cfg.aimLaserWindupMs + cfg.aimLaserActiveMs + rand(1200, 1700);
      } else if (attack === 4) {
        spawnBossOrbFan(enraged);
        boss.nextAttackAt =
          now + rand(enraged ? 3300 : 3600, enraged ? 4200 : 4700);
      } else if (attack === 5) {
        spawnBossSerpentPattern(enraged);
        boss.nextAttackAt =
          now + rand(enraged ? 4400 : 4700, enraged ? 5400 : 5800);
      } else if (attack === 6) {
        spawnBossPrismSweep(enraged);
        boss.nextAttackAt =
          now + rand(enraged ? 5000 : 4700, enraged ? 5900 : 5600);
      } else if (attack === 7) {
        spawnBossCorePulse(enraged);
        boss.nextAttackAt =
          now + rand(enraged ? 4500 : 4200, enraged ? 5500 : 5100);
      } else if (attack === 8) {
        spawnBossMineField(enraged);
        boss.nextAttackAt =
          now + rand(enraged ? 5300 : 4900, enraged ? 6300 : 5900);
      } else {
        spawnBossCrossBurst(enraged);
        boss.nextAttackAt =
          now + rand(enraged ? 4300 : 3900, enraged ? 5200 : 4800);
      }

      boss.attackIndex = attack;
      bossAttackHistoryRef.current = [...recent, attack].slice(-2);
    }

    function atualizarDerrotaChocado(delta: number) {
      const sequence = bossDefeatSequenceRef.current;
      const boss = bossRef.current;
      if (!sequence.active) return;

      const now = performance.now();
      const elapsed = now - sequence.startAt;
      let stage: BossDefeatStage = "overload";
      if (elapsed >= 2100) stage = "collapse";
      if (elapsed >= 3500) stage = "final";
      if (elapsed >= 4700) stage = "done";

      if (stage !== sequence.stage) {
        sequence.stage = stage;
        setBossDefeatStage(stage);
      }

      boss.age += delta * 2.2;
      boss.x += Math.sin(now * 0.042) * (stage === "final" ? 1.8 : 0.55);

      const burstGap =
        stage === "overload" ? 210 : stage === "collapse" ? 125 : 80;
      if (elapsed < 4100 && now - sequence.lastBurstAt >= burstGap) {
        sequence.lastBurstAt = now;
        const colors = ["#ffcf5c", "#ff4f72", "#d946ef", "#6ee7ff", "#fff7d6"];
        criarExplosao(
          boss.x + rand(boss.w * 0.12, boss.w * 0.84),
          boss.y + rand(boss.h * 0.08, boss.h * 0.92),
          colors[Math.floor(randomFloat() * colors.length)],
          stage === "collapse" ? 62 : 42,
        );
        if (CONFIG.settings.enableScreenShake) {
          shakeRef.current = {
            intensity: stage === "collapse" ? 11 : 6,
            endAt: now + 220,
          };
        }
      }

      if (stage === "collapse") {
        backgroundOffsetRef.current += delta * 0.22;
      }

      if (stage === "final" && !sequence.finalTriggered) {
        sequence.finalTriggered = true;
        tocarSom(
          CONFIG.sounds.chocadoFinalExplosion ||
            CONFIG.sounds.gameOverFinalExplosion,
          0.95,
          "sfx",
        );
        tocarSom(
          CONFIG.sounds.chocadoDefeatBurst || CONFIG.sounds.chocadoDefeat,
          0.82,
          "hit",
        );
        const centerX = boss.x + boss.w * 0.42;
        const centerY = boss.y + boss.h * 0.5;
        criarExplosao(centerX, centerY, "#fff7d6", 160);
        criarExplosao(centerX, centerY, "#ff4fd8", 132);
        criarExplosao(centerX, centerY, "#60eaff", 104);
        shockwavesRef.current.push(
          {
            id: enemyIdRef.current++,
            x: centerX,
            y: centerY,
            radius: 1180,
            life: 1600,
            maxLife: 1600,
          },
          {
            id: enemyIdRef.current++,
            x: centerX,
            y: centerY,
            radius: 760,
            life: 1100,
            maxLife: 1100,
          },
        );
        shakeRef.current = { intensity: 28, endAt: now + 1500 };
      }

      if (stage === "done") {
        sequence.active = false;
        boss.active = false;
        bossProjectilesRef.current = [];
        setBossDefeatStage("done");
      }
    }

    function atualizarBoss(delta: number) {
      const boss = bossRef.current;
      if (!boss.active) return;

      const now = performance.now();
      const cfg = CONFIG.gameplay.boss.chocado;

      if (boss.defeated) {
        atualizarDerrotaChocado(delta);
        return;
      }

      boss.age += delta;
      boss.y =
        (CONFIG.canvasHeight - boss.h) / 2 +
        Math.sin(boss.age * cfg.floatSpeed) * cfg.floatAmplitude;

      if (
        !boss.intro &&
        !boss.phaseTwoAnnounced &&
        boss.hp <= cfg.enragedHp &&
        boss.hp > 0
      ) {
        boss.phaseTwoAnnounced = true;
        setBossTipVisible(true);
        if (bossTipTimeoutRef.current !== null)
          window.clearTimeout(bossTipTimeoutRef.current);
        bossTipTimeoutRef.current = window.setTimeout(() => {
          setBossTipVisible(false);
          bossTipTimeoutRef.current = null;
        }, 8000);
        mostrarMensagemWave("FASE 2", true);
        mostrarDanielBossSeLivre(BOSS_DANIEL_LINES.phaseTwo, 3400);
        tocarSom(
          CONFIG.sounds.chocadoPhaseTwo || CONFIG.sounds.chocadoRoar,
          0.62,
          "sfx",
        );
        tocarHumChocado(true);
        shockwavesRef.current.push({
          id: enemyIdRef.current++,
          x: boss.x + boss.w * 0.35,
          y: boss.y + boss.h * 0.5,
          radius: 760,
          life: 1100,
          maxLife: 1100,
        });
        criarExplosao(
          boss.x + boss.w * 0.35,
          boss.y + boss.h * 0.5,
          "#d946ef",
          34,
        );
        if (CONFIG.settings.enableScreenShake) {
          shakeRef.current = { intensity: 8, endAt: performance.now() + 520 };
        }
      }

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
          waveStateRef.current.message = "";
          setWaveUi((current) => ({ ...current, message: "" }));
        }
      } else if (now >= boss.nextAttackAt) {
        iniciarProximoAtaqueDoBoss();
      }

      if (boss.hp <= 0 && !boss.defeated) {
        boss.hp = 0;
        boss.defeated = true;
        atualizarStatsPerfilLocal((stats) => ({ ...stats, chocadosKilled: stats.chocadosKilled + 1 }));
        boss.intro = false;
        boss.nextAttackAt = Number.POSITIVE_INFINITY;
        bossProjectilesRef.current = [];
        enemyProjectilesRef.current = [];
        pararMusicaChocado(true);
        bossDefeatSequenceRef.current = {
          active: true,
          startAt: now,
          stage: "overload",
          lastBurstAt: 0,
          finalTriggered: false,
        };
        setBossDefeatStage("overload");
        tocarSom(
          CONFIG.sounds.chocadoDefeatBurst || CONFIG.sounds.chocadoDefeat,
          0.78,
          "hit",
        );
        mostrarDanielBoss(
          {
            expression: "alert",
            text: "O núcleo entrou em colapso! Afaste-se, Cleber — a reação ainda não terminou!",
          },
          4300,
        );
      }
    }

    function atualizarBossProjectiles(delta: number) {
      const now = performance.now();
      const speedFactor = delta / 16.67;
      const player = playerRef.current;

      bossProjectilesRef.current = bossProjectilesRef.current
        .map((projectile) => {
          const updated = { ...projectile, life: projectile.life - delta };
          if (
            updated.activeAt &&
            now < updated.activeAt &&
            updated.kind !== "laser" &&
            updated.kind !== "aimLaser"
          ) {
            return updated;
          }

          if (updated.kind === "servo") {
            const boss = bossRef.current;
            const shouldReturn = Boolean(
              updated.returnAt &&
              now >= updated.returnAt &&
              boss.active &&
              boss.hp > 0,
            );
            if (shouldReturn) {
              updated.returning = true;
              const targetX = boss.x + boss.w * 0.28;
              const targetY = boss.y + boss.h * 0.5;
              const dx = targetX - (updated.x + updated.w / 2);
              const dy = targetY - (updated.y + updated.h / 2);
              const len = Math.max(1, Math.hypot(dx, dy));
              const speed =
                (updated.speed ?? CONFIG.gameplay.boss.chocado.servoSpeed) *
                1.22;
              updated.vx += ((dx / len) * speed - updated.vx) * 0.13;
              updated.vy += ((dy / len) * speed - updated.vy) * 0.13;
            } else if (updated.homingUntil && now < updated.homingUntil) {
              const dx = player.x + player.w / 2 - (updated.x + updated.w / 2);
              const dy = player.y + player.h / 2 - (updated.y + updated.h / 2);
              const len = Math.max(1, Math.hypot(dx, dy));
              const speed =
                updated.speed ?? CONFIG.gameplay.boss.chocado.servoSpeed;
              updated.vx += ((dx / len) * speed - updated.vx) * 0.105;
              updated.vy += ((dy / len) * speed - updated.vy) * 0.105;
            }
          }

          if (updated.kind === "servoWave") {
            const travelMs = Math.max(350, updated.travelMs ?? 1800);
            const activeElapsed = Math.max(0, now - (updated.activeAt ?? now));
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
              updated.aimX =
                (updated.aimX ?? targetX) +
                (targetX - (updated.aimX ?? targetX)) * follow;
              updated.aimY =
                (updated.aimY ?? targetY) +
                (targetY - (updated.aimY ?? targetY)) * follow;

              const dx = updated.aimX - updated.x;
              const dy = updated.aimY - updated.y;
              const target = Math.atan2(dy, dx);
              const current = updated.angle ?? target;
              const diff = Math.atan2(
                Math.sin(target - current),
                Math.cos(target - current),
              );
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

          if (
            updated.kind === "laser" &&
            updated.angleStart !== undefined &&
            updated.angleEnd !== undefined
          ) {
            const sweepStart = updated.sweepStartAt ?? updated.activeAt ?? now;
            const duration = Math.max(1, updated.sweepDurationMs ?? 1);
            const t = clamp((now - sweepStart) / duration, 0, 1);
            const eased = t * t * (3 - 2 * t);
            updated.angle =
              updated.angleStart +
              (updated.angleEnd - updated.angleStart) * eased;
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
              if (
                updated.baseY !== undefined &&
                updated.driftAmplitude &&
                updated.driftFrequency
              ) {
                updated.y =
                  updated.baseY +
                  Math.sin(
                    now * updated.driftFrequency + (updated.phase ?? 0),
                  ) *
                    updated.driftAmplitude;
              } else {
                updated.y += updated.vy * speedFactor;
              }
            }
          }

          return updated;
        })
        .filter((projectile) => {
          if (
            projectile.kind === "servo" &&
            projectile.returning &&
            bossRef.current.active &&
            bossRef.current.hp > 0
          ) {
            const bossHitbox = getBossHitbox();
            if (rectsCollide(projectile, bossHitbox)) {
              const dano = CONFIG.gameplay.boss.chocado.servoReturnDamage;
              bossRef.current.hp = Math.max(0, bossRef.current.hp - dano);
              carregarBoostPorDano(dano);
              criarExplosao(
                projectile.x + projectile.w / 2,
                projectile.y + projectile.h / 2,
                "#ffb703",
                14,
              );
              tocarSom(CONFIG.sounds.enemyHit, 0.35, "hit");
              return false;
            }
          }
          if (projectile.life <= 0) return false;
          if (projectile.kind === "laser" || projectile.kind === "aimLaser")
            return true;
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

      const defeatSequence = bossDefeatSequenceRef.current;
      const defeatElapsed = defeatSequence.active
        ? performance.now() - defeatSequence.startAt
        : 0;
      const defeatPulse = defeatSequence.active
        ? 1 +
          Math.sin(defeatElapsed * 0.035) *
            (defeatSequence.stage === "collapse" ? 0.045 : 0.018)
        : 1;
      const defeatAlpha =
        defeatSequence.stage === "final"
          ? clamp(1 - (defeatElapsed - 3500) / 1250, 0, 1)
          : 1;

      ctx.save();
      ctx.translate(boss.x + boss.w / 2, boss.y + boss.h / 2);
      ctx.rotate(
        Math.sin(boss.age * 0.003) * 0.018 +
          (defeatSequence.active ? Math.sin(defeatElapsed * 0.028) * 0.035 : 0),
      );
      ctx.scale(defeatPulse, defeatPulse);
      ctx.globalAlpha = defeatAlpha;

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
      if (defeatSequence.active) {
        const glow = 46 + Math.sin(defeatElapsed * 0.05) * 14;
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = clamp(defeatAlpha * 0.82, 0, 1);
        const coreGradient = ctx.createRadialGradient(
          0,
          0,
          4,
          0,
          0,
          glow * 2.2,
        );
        coreGradient.addColorStop(0, "#fff7d6");
        coreGradient.addColorStop(0.22, "#ff68e8");
        coreGradient.addColorStop(0.65, "rgba(217,70,239,.38)");
        coreGradient.addColorStop(1, "rgba(217,70,239,0)");
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(-boss.w * 0.08, 0, glow * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // HUD compacta do boss no topo.
      const barW = 620;
      const barH = 14;
      const barX = (CONFIG.canvasWidth - barW) / 2;
      const barY = 16;
      const phaseTwo = !boss.intro && boss.hp <= cfg.enragedHp;
      ctx.save();
      ctx.fillStyle = "rgba(6, 3, 12, 0.74)";
      roundRect(ctx, barX - 16, barY - 5, barW + 32, 58, 8);
      ctx.fill();
      ctx.strokeStyle = phaseTwo
        ? "rgba(245, 93, 255, 0.95)"
        : "rgba(248, 231, 176, 0.95)";
      ctx.lineWidth = 3;
      roundRect(ctx, barX - 16, barY - 5, barW + 32, 58, 8);
      ctx.stroke();
      ctx.fillStyle = "#fff7e6";
      ctx.font = `20px "${CONFIG.fonts.menu}"`;
      ctx.textAlign = "center";
      ctx.fillText("CHOCADO", CONFIG.canvasWidth / 2, barY + 1);
      ctx.fillStyle = "rgba(27, 6, 18, 0.95)";
      roundRect(ctx, barX, barY + 15, barW, barH, 4);
      ctx.fill();
      const gradient = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      gradient.addColorStop(0, phaseTwo ? "#d946ef" : "#ff3355");
      gradient.addColorStop(0.52, phaseTwo ? "#fb7185" : "#ffb703");
      gradient.addColorStop(1, "#fff1a8");
      ctx.fillStyle = gradient;
      roundRect(ctx, barX, barY + 15, barW * progress, barH, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 247, 230, 0.85)";
      ctx.lineWidth = 2;
      roundRect(ctx, barX, barY + 15, barW, barH, 4);
      ctx.stroke();
      const hpText = boss.intro
        ? "SINAL HOSTIL CARREGANDO"
        : `${Math.ceil(Math.max(0, boss.hp))} / ${boss.maxHp} HP`;
      ctx.font = `13px "${CONFIG.fonts.ui}"`;
      ctx.fillStyle = "#f8e7b0";
      ctx.fillText(hpText, CONFIG.canvasWidth / 2, barY + 46);
      if (phaseTwo) {
        const badgeX = barX + barW + 18;
        ctx.fillStyle = "rgba(90, 12, 95, 0.82)";
        roundRect(ctx, badgeX, barY + 10, 96, 26, 6);
        ctx.fill();
        ctx.strokeStyle = "rgba(245, 93, 255, 0.95)";
        ctx.stroke();
        ctx.fillStyle = "#ffd6ff";
        ctx.font = `13px "${CONFIG.fonts.ui}"`;
        ctx.fillText("FASE 2", badgeX + 48, barY + 29);
      }
      ctx.restore();
    }

    function desenharBossProjectile(
      ctx: CanvasRenderingContext2D,
      projectile: BossProjectile,
    ) {
      const now = performance.now();
      const reduced = usarEfeitosReduzidos();
      const active = !projectile.activeAt || now >= projectile.activeAt;
      if (
        !active &&
        projectile.kind !== "laser" &&
        projectile.kind !== "aimLaser"
      )
        return;

      if (projectile.kind === "laser" || projectile.kind === "aimLaser") {
        const isAim = projectile.kind === "aimLaser";
        const isPrism = projectile.visualVariant === "prism";
        const activeTime = Math.max(0, now - (projectile.activeAt ?? now));
        const pulse = active ? 1 + Math.sin(activeTime * 0.1) * 0.1 : 1;
        const drawHeight = projectile.h * pulse;
        const beamColor = isAim ? "#ff4fd8" : isPrism ? "#d946ef" : "#ffd166";

        if (!active && !isAim) {
          ctx.save();
          ctx.translate(projectile.x, projectile.y);
          ctx.rotate(projectile.angle ?? Math.PI);
          ctx.globalAlpha = 0.78;
          ctx.strokeStyle = isPrism ? "#f0abfc" : "#ffd166";
          ctx.lineWidth = isPrism ? 3 : 2;
          ctx.setLineDash([18, 13]);
          ctx.lineDashOffset = -(now * 0.04);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(projectile.w, 0);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(8, drawHeight * 0.62), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          return;
        }

        if (!active && isAim) {
          const t = now * 0.006;
          const aimX =
            projectile.aimX ?? playerRef.current.x + playerRef.current.w / 2;
          const aimY =
            projectile.aimY ?? playerRef.current.y + playerRef.current.h / 2;
          const lockBefore =
            CONFIG.gameplay.boss.chocado.aimLaserLockBeforeMs ?? 430;
          const danger = Boolean(
            projectile.activeAt && now >= projectile.activeAt - lockBefore,
          );
          ctx.save();
          ctx.globalAlpha = danger ? 1 : 0.82;
          ctx.strokeStyle = danger ? "#ff385f" : "#ffcf5c";
          ctx.lineWidth = danger ? 5 : 3;
          ctx.setLineDash([12, 9]);
          ctx.lineDashOffset = -t * 24;
          ctx.beginPath();
          ctx.moveTo(projectile.x, projectile.y);
          ctx.lineTo(aimX, aimY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(
            aimX,
            aimY,
            (danger ? 43 : 36) + Math.sin(t * 6) * 4,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.restore();
          return;
        }

        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(projectile.angle ?? Math.PI);
        ctx.globalCompositeOperation = reduced ? "source-over" : "lighter";
        if (!reduced && String(CONFIG.settings.performanceMode) === "quality") {
          ctx.save();
          ctx.globalAlpha = 0.22;
          ctx.shadowColor = beamColor;
          ctx.shadowBlur = 30;
          ctx.fillStyle = beamColor;
          ctx.fillRect(0, -drawHeight * 0.78, projectile.w, drawHeight * 1.56);
          ctx.restore();
          ctx.globalCompositeOperation = "lighter";
        }
        ctx.globalAlpha = 0.94;
        ctx.fillStyle = beamColor;
        ctx.fillRect(0, -drawHeight / 2, projectile.w, drawHeight);
        ctx.globalAlpha = 0.96;
        ctx.fillStyle = "#fff9dd";
        ctx.fillRect(
          0,
          -Math.max(3, drawHeight * 0.11),
          projectile.w * 0.94,
          Math.max(5, drawHeight * 0.22),
        );
        if (isPrism && !reduced) {
          ctx.globalAlpha = 0.62;
          ctx.fillStyle = "#67e8f9";
          ctx.fillRect(
            0,
            -drawHeight * 0.4,
            projectile.w * 0.76,
            Math.max(2, drawHeight * 0.07),
          );
          ctx.fillStyle = "#f0abfc";
          ctx.fillRect(
            0,
            drawHeight * 0.33,
            projectile.w * 0.68,
            Math.max(2, drawHeight * 0.07),
          );
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, drawHeight * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = beamColor;
        ctx.beginPath();
        ctx.arc(0, 0, drawHeight * 1.02, 0, Math.PI * 2);
        ctx.globalAlpha = 0.38;
        ctx.fill();
        ctx.restore();
        return;
      }

      const isServo =
        projectile.kind === "servo" || projectile.kind === "servoWave";
      const img = isServo
        ? assetsRef.current.get("bossServo")
        : assetsRef.current.get("bossOrb");
      const color = isServo ? "#ffb703" : "#d946ef";
      const angle = Math.atan2(projectile.vy, projectile.vx);
      const trailSteps = reduced ? 1 : 2;

      if (!reduced) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = color;
        for (let i = 1; i <= trailSteps; i += 1) {
          ctx.beginPath();
          ctx.ellipse(
            projectile.x + projectile.w / 2 - projectile.vx * i * 2.1,
            projectile.y + projectile.h / 2 - projectile.vy * i * 2.1,
            projectile.w * (0.4 - i * 0.07),
            projectile.h * (0.4 - i * 0.07),
            angle,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.restore();
      }

      if (!isServo && projectile.visualVariant === "mine") {
        const cx = projectile.x + projectile.w / 2;
        const cy = projectile.y + projectile.h / 2;
        const pulse = 1 + Math.sin(now * 0.01 + (projectile.phase ?? 0)) * 0.08;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(now * 0.0015 + (projectile.phase ?? 0));
        ctx.strokeStyle = "#f0abfc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, projectile.w * 0.48 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 4; i += 1) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(projectile.w * 0.38, 0);
          ctx.lineTo(projectile.w * 0.66, 0);
          ctx.stroke();
        }
        ctx.fillStyle = "#6b177d";
        ctx.beginPath();
        ctx.arc(0, 0, projectile.w * 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, projectile.w * 0.09, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      if (!isServo && projectile.visualVariant === "shard") {
        const cx = projectile.x + projectile.w / 2;
        const cy = projectile.y + projectile.h / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle + Math.PI / 4);
        ctx.fillStyle = "#d946ef";
        ctx.fillRect(
          -projectile.w * 0.38,
          -projectile.h * 0.38,
          projectile.w * 0.76,
          projectile.h * 0.76,
        );
        ctx.fillStyle = "#f5d0fe";
        ctx.fillRect(
          -projectile.w * 0.14,
          -projectile.h * 0.14,
          projectile.w * 0.28,
          projectile.h * 0.28,
        );
        ctx.restore();
        return;
      }

      if (!isServo) {
        const cx = projectile.x + projectile.w / 2;
        const cy = projectile.y + projectile.h / 2;
        const pulse =
          1 + Math.sin(now * 0.016 + (projectile.phase ?? 0)) * 0.07;
        ctx.save();
        if (!reduced) {
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = "#d946ef";
          ctx.beginPath();
          ctx.arc(cx, cy, projectile.w * 0.88 * pulse, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle =
          projectile.visualVariant === "phase2" ? "#ef70ff" : "#d946ef";
        ctx.beginPath();
        ctx.arc(cx, cy, projectile.w * 0.48 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy, projectile.w * 0.18 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return;
      }

      drawVelocityStretchedImage(
        ctx,
        img,
        projectile.x,
        projectile.y,
        projectile.w,
        projectile.h,
        projectile.vx,
        projectile.vy,
        angle,
        color,
        getStretchSettings("shot").multiplier,
        getStretchPulse(performance.now() + 60, "shot"),
      );
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        projectile.x + projectile.w / 2,
        projectile.y + projectile.h / 2,
        Math.max(projectile.w, projectile.h) * 0.58,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }

    function rectHitsRotatedBeam(
      rect: { x: number; y: number; w: number; h: number },
      beam: BossProjectile,
    ) {
      const angle = beam.angle ?? Math.PI;
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      const points = [
        { x: rect.x, y: rect.y },
        { x: rect.x + rect.w, y: rect.y },
        { x: rect.x, y: rect.y + rect.h },
        { x: rect.x + rect.w, y: rect.y + rect.h },
        { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 },
      ];

      return points.some((point) => {
        const dx = point.x - beam.x;
        const dy = point.y - beam.y;
        const rx = dx * cos - dy * sin;
        const ry = dx * sin + dy * cos;
        return rx >= 0 && rx <= beam.w && Math.abs(ry) <= beam.h / 2;
      });
    }


    function limparTokensDaRun() {
      tokensRef.current = [];
      nextTokenSpawnAtRef.current = 0;
    }

    function centroPlayerPorSlot(slot: PlayerSlot) {
      const player = slot === 1 ? playerRef.current : slot === 2 ? player2Ref.current : playersRef.current.find((runtime) => runtime.slot === slot)?.runtime;
      if (!player) return { x: CONFIG.canvasWidth * 0.24, y: CONFIG.canvasHeight * 0.3 };
      return { x: player.x + player.w / 2, y: player.y + player.h / 2 };
    }

    function spawnTokenBurst(x: number, y: number, targetSlot: PlayerSlot = 1, maxAmount = 6, dropChance = isLocalPvpMode() ? 0.74 : 0.66) {
      if (gameStateRef.current === "tutorial") return;
      if (onlineTogetherCoordenado() && !souAutoridadeMundoOnlineTogether()) return;
      if (onlineGameplayActiveRef.current && onlineServerAuthoritativeRef.current && !souHostOnline()) return;
      if (randomFloat() > dropChance) return;
      // v2.5.3: token burst travava por criar muitas moedas + explosão + áudio ao mesmo tempo.
      // Agora o burst é leve; o ganho principal vem das trilhas longas e espaçadas.
      const safeMax = mobileRuntimeRef.current ? Math.min(maxAmount, 2) : Math.min(maxAmount, isLocalPvpMode() ? 2 : 3);
      const amount = Math.max(1, Math.min(safeMax, Math.floor(rand(1, safeMax + 1))));
      const now = performance.now();
      const spawnedTokens: TokenPickup[] = [];
      for (let i = 0; i < amount; i++) {
        const angle = rand(-Math.PI * 0.72, Math.PI * 0.72);
        const speed = rand(isLocalPvpMode() ? 3.1 : 2.4, isLocalPvpMode() ? 6.6 : 5.8);
        const token: TokenPickup = {
          id: tokenIdRef.current++,
          x: x - 14 + rand(-10, 10),
          y: y - 14 + rand(-10, 10),
          w: mobileRuntimeRef.current ? 18 : (isLocalPvpMode() ? 20 : 22),
          h: mobileRuntimeRef.current ? 18 : (isLocalPvpMode() ? 20 : 22),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - rand(0.5, 1.4),
          age: 0,
          life: rand(isLocalPvpMode() ? 1500 : 1900, isLocalPvpMode() ? 2300 : 3000),
          wavePhase: rand(0, Math.PI * 2),
          bornAt: now,
          value: 1,
          frameOffset: Math.floor(rand(0, 4)),
          targetSlot,
          magnetDelay: rand(320, 620),
          burst: true,
          collectScale: 1,
          pattern: "burst",
          patternIndex: i,
        };
        tokensRef.current.push(token);
        spawnedTokens.push(token);
      }
      tokensRef.current = tokensRef.current.slice(-(mobileRuntimeRef.current ? 14 : 28));
      if (onlineTogetherCoordenado() && spawnedTokens.length > 0) {
        enviarOnline({ type: "coop_token_spawn", slot: slotLocalOnline(), tokens: spawnedTokens.map(tokenSnapshotParaSync), seq: Date.now() });
      }
      if (performance.now() - tokenUiPulseUntilRef.current > 180) {
        criarParticulasHit(x, y, "#ffd45a", mobileRuntimeRef.current ? 3 : 5);
        tocarSom(CONFIG.sounds.tokenBurst || CONFIG.sounds.powerUpSpawn, mobileRuntimeRef.current ? 0.08 : 0.12, "sfx");
      }
    }

    function agendarProximoToken(now = performance.now()) {
      nextTokenSpawnAtRef.current = now + rand(isLocalPvpMode() ? 8200 : 6800, isLocalPvpMode() ? 11200 : 10400);
    }

    function spawnTokenPattern(force = false) {
      if (gameStateRef.current === "tutorial") return;
      if (onlineTogetherCoordenado() && !souAutoridadeMundoOnlineTogether()) return;
      if (onlineGameplayActiveRef.current && !souHostOnline() && !onlineTogetherCoordenado()) return;
      const now = performance.now();
      if (!force && now < nextTokenSpawnAtRef.current) return;
      const maxTokens = mobileRuntimeRef.current ? 14 : 26;
      if (tokensRef.current.length > maxTokens) { agendarProximoToken(now); return; }

      const playerCenter = centroPlayerPorSlot((onlineSlotRef.current || 1) as PlayerSlot);
      const patterns: Array<"line" | "zigzag" | "arc" | "cluster"> = ["line", "line", "zigzag", "arc", "cluster"];
      const pattern = patterns[Math.floor(rand(0, patterns.length))] || "line";
      const startX = CONFIG.canvasWidth + 56;
      const baseY = clamp(playerCenter.y + rand(-92, 92), 92, CONFIG.canvasHeight - 104);
      const planned: Array<{ x: number; y: number; delay: number }> = [];
      const gap = mobileRuntimeRef.current ? 96 : 112;

      if (pattern === "line") {
        const count = mobileRuntimeRef.current ? 11 : 16;
        for (let i = 0; i < count; i++) planned.push({ x: startX + i * gap, y: baseY, delay: i });
      } else if (pattern === "zigzag") {
        const count = mobileRuntimeRef.current ? 10 : 14;
        for (let i = 0; i < count; i++) {
          const y = clamp(baseY + (i % 2 === 0 ? -74 : 74), 86, CONFIG.canvasHeight - 96);
          planned.push({ x: startX + i * gap, y, delay: i });
        }
      } else if (pattern === "arc") {
        const count = mobileRuntimeRef.current ? 11 : 16;
        for (let i = 0; i < count; i++) {
          const t = i / Math.max(1, count - 1);
          const y = clamp(baseY + Math.sin(t * Math.PI) * -118 + 44, 84, CONFIG.canvasHeight - 96);
          planned.push({ x: startX + i * (gap * .92), y, delay: i });
        }
      } else {
        // Encruzilhada: longa, separada e com risco/recompensa.
        const count = mobileRuntimeRef.current ? 11 : 16;
        for (let i = 0; i < count; i++) {
          const branch = i % 4;
          const y = branch === 0 ? baseY : branch === 1 ? baseY - 92 : branch === 2 ? baseY + 92 : baseY;
          planned.push({ x: startX + i * gap, y: clamp(y, 86, CONFIG.canvasHeight - 96), delay: i });
        }
      }

      const spawnedTokens: TokenPickup[] = [];
      for (let i = 0; i < planned.length; i++) {
        const point = planned[i];
        const token: TokenPickup = {
          id: tokenIdRef.current++,
          x: point.x,
          y: point.y,
          w: mobileRuntimeRef.current ? 20 : 23,
          h: mobileRuntimeRef.current ? 20 : 23,
          vx: -rand(1.02, 1.32),
          vy: pattern === "zigzag" ? (i % 2 === 0 ? 0.05 : -0.05) : 0,
          age: -point.delay * 28,
          life: rand(6800, 9200),
          wavePhase: rand(0, Math.PI * 2),
          bornAt: now,
          value: 1,
          frameOffset: i % 4,
          collectScale: 1,
          pattern,
          patternIndex: i,
        };
        tokensRef.current.push(token);
        spawnedTokens.push(token);
      }
      tokensRef.current = tokensRef.current.slice(-(mobileRuntimeRef.current ? 22 : 42));
      if (onlineTogetherCoordenado() && spawnedTokens.length > 0) {
        enviarOnline({ type: "coop_token_spawn", slot: slotLocalOnline(), tokens: spawnedTokens.map(tokenSnapshotParaSync), seq: Date.now() });
      }
      agendarProximoToken(now);
    }

    function atualizarTokens(delta: number, canvas: HTMLCanvasElement) {
      if (!nextTokenSpawnAtRef.current) agendarProximoToken();
      spawnTokenPattern(false);
      const speedFactor = delta / 16.67;
      tokensRef.current = tokensRef.current
        .map((token) => {
          let vx = token.vx;
          let vy = token.vy;
          const age = token.age + delta;
          if (token.targetSlot && age > (token.magnetDelay ?? 180)) {
            const target = centroPlayerPorSlot(token.targetSlot);
            const cx = token.x + token.w / 2;
            const cy = token.y + token.h / 2;
            const dx = target.x - cx;
            const dy = target.y - cy;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const magnet = clamp((age - (token.magnetDelay ?? 180)) / 650, 0.12, 0.82);
            vx = vx * (1 - magnet) + (dx / dist) * rand(5.4, 8.2) * magnet;
            vy = vy * (1 - magnet) + (dy / dist) * rand(5.4, 8.2) * magnet;
          } else {
            vy += token.burst ? 0.06 * speedFactor : 0;
          }
          return {
            ...token,
            vx,
            vy,
            age,
            life: token.life - delta,
            collectScale: 0.92 + Math.sin(age * 0.018 + token.frameOffset) * 0.08,
            x: token.x + vx * speedFactor,
            y: token.y + vy * speedFactor + (token.burst ? 0 : Math.sin(age * 0.006 + token.wavePhase) * 0.28 * speedFactor),
          };
        })
        .filter((token) => token.life > 0 && token.x > -100 && token.x < canvas.width + 180 && token.y > -100 && token.y < canvas.height + 110);
    }

    function desenharTokenFallback(ctx: CanvasRenderingContext2D, token: TokenPickup) {
      const cx = token.x + token.w / 2;
      const cy = token.y + token.h / 2;
      const frame = (Math.floor(token.age / 95) + token.frameOffset) % 4;
      const squash = (token.collectScale ?? 1) * ([1, 0.82, 0.58, 0.82][frame] ?? 1);
      const stretchY = 1 + (1 - squash) * 0.22;
      const glow = 0.55 + Math.sin(token.age * 0.014) * 0.16;
      const alpha = clamp(token.life / 450, 0, 1);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(squash, stretchY);
      ctx.globalAlpha = alpha;
      const frameImage = tokenFrameImagesRef.current[frame];
      if (frameImage && frameImage.complete && frameImage.naturalWidth > 0) {
        ctx.shadowColor = "#ffe28a";
        ctx.shadowBlur = 8 * glow;
        ctx.drawImage(frameImage, -token.w / 2, -token.h / 2, token.w, token.h);
        ctx.restore();
        return;
      }
      const sprite = tokenSpriteRef.current;
      if (sprite && tokenSpriteReadyRef.current && sprite.naturalWidth > 0) {
        const frameW = sprite.naturalWidth / 4;
        ctx.shadowColor = "#ffe28a";
        ctx.shadowBlur = 8 * glow;
        ctx.drawImage(sprite, frameW * frame, 0, frameW, sprite.naturalHeight, -token.w / 2, -token.h / 2, token.w, token.h);
        ctx.restore();
        return;
      }
      const gradient = ctx.createRadialGradient(-token.w * 0.18, -token.h * 0.22, 2, 0, 0, token.w * 0.52);
      gradient.addColorStop(0, "#fff7b8");
      gradient.addColorStop(0.45, "#f9c851");
      gradient.addColorStop(1, "#9b5d12");
      ctx.shadowColor = "#ffd166";
      ctx.shadowBlur = 10 * glow;
      ctx.fillStyle = gradient;
      ctx.strokeStyle = "rgba(255, 245, 180, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, token.w * 0.42, token.h * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(72, 43, 8, 0.58)";
      ctx.fillRect(-1.5, -token.h * 0.32, 3, token.h * 0.64);
      ctx.restore();
    }

    function desenharTokens(ctx: CanvasRenderingContext2D) {
      if (tokensRef.current.length === 0) return;
      for (const token of tokensRef.current) desenharTokenFallback(ctx, token);
    }

    function resolverTokens() {
      if (gameStateRef.current !== "playing") return;
      if (onlineGameplayActiveRef.current && onlineServerAuthoritativeRef.current && !souHostOnline()) return;
      if (tokensRef.current.length === 0) return;
      const collectors: Array<{ slot: PlayerSlot; player: Player | null }> = onlineTogetherCoordenado()
        ? [{ slot: slotLocalOnline(), player: playerRef.current }]
        : [
            { slot: 1, player: playerRef.current },
            { slot: 2, player: player2Ref.current },
            ...playersRef.current.filter((runtime) => runtime.slot >= 3).map((runtime) => ({ slot: runtime.slot, player: runtime.runtime })),
          ];
      const collected = new Set<number>();
      const collectedBySlot = new Map<PlayerSlot, number>();
      for (const token of tokensRef.current) {
        const tokenBox = { x: token.x + token.w * 0.12, y: token.y + token.h * 0.12, w: token.w * 0.76, h: token.h * 0.76 };
        for (const collector of collectors) {
          if (!collector.player || collector.player.hp <= 0) continue;
          if (rectsCollide(getPlayerHitbox(collector.player), tokenBox)) {
            collected.add(token.id);
            collectedBySlot.set(collector.slot, (collectedBySlot.get(collector.slot) || 0) + token.value);
            criarParticulasHit(token.x + token.w / 2, token.y + token.h / 2, "#ffd45a", mobileRuntimeRef.current ? 2 : 4);
            break;
          }
        }
      }
      if (collected.size > 0) {
        tokensRef.current = tokensRef.current.filter((token) => !collected.has(token.id));
        if (onlineTogetherCoordenado()) {
          const amount = collectedBySlot.get(slotLocalOnline()) || 0;
          if (amount > 0) {
            enviarOnline({ type: "coop_token_collect", slot: slotLocalOnline(), tokenIds: Array.from(collected), amount, seq: Date.now() });
          }
        }
        for (const [slot, amount] of collectedBySlot.entries()) {
          if (!onlineGameplayActiveRef.current || slot === onlineSlotRef.current) {
            adicionarTokensPerfil(amount);
          } else if (souHostOnline()) {
            enviarOnline({ type: "token_collect", slot, amount });
          }
        }
        tocarSom(CONFIG.sounds.powerUpPickup || CONFIG.sounds.menuConfirm, 0.22, "sfx");
      }
    }

    function atualizarPowerUps(delta: number, canvas: HTMLCanvasElement) {
      if (gameStateRef.current !== "playing") return;

      const speedFactor = delta / 16.67;
      const cfg = CONFIG.gameplay.powerups;
      const previousIds = new Set<number>(
        powerUpsRef.current.map((power) => power.id),
      );

      const updatedPowerUps = powerUpsRef.current
        .map((power) => ({
          ...power,
          age: power.age + delta,
          life: power.life - delta,
          x: power.x + power.vx * speedFactor,
          y:
            power.y +
            power.vy * speedFactor +
            Math.sin(
              (power.age + delta) * cfg.waveFrequency + power.wavePhase,
            ) *
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

      const currentIds = new Set<number>(
        updatedPowerUps.map((power) => power.id),
      );

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
                          ? "powerFlames"
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
        const visibleScale = clamp(
          0.38 + spawnProgress * 0.62 + spawnWobble + idleWobble,
          0.38,
          1.42,
        );
        const wobbleRotation =
          Math.sin(spawnProgress * Math.PI * 5) *
            Math.pow(1 - spawnProgress, 0.85) *
            0.28 +
          Math.sin(power.age * 0.007 + power.wavePhase) * 0.035;

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
        ctx.fillRect(
          -power.w / 2 - 8,
          -power.h / 2 - 8,
          power.w + 16,
          power.h + 16,
        );

        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = "#fff7e6";
        ctx.lineWidth = 3;
        ctx.strokeRect(
          -power.w / 2 - 7,
          -power.h / 2 - 7,
          power.w + 14,
          power.h + 14,
        );

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
            ctx.fillStyle =
              i % 3 === 0 ? "#ff2f00" : i % 3 === 1 ? "#facc15" : "#f97316";
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
          ctx.font = `26px "${CONFIG.fonts.ui}"`;
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

    function aplicarPowerUpPlayer2(kind: PowerUpKind) {
      const player = player2Ref.current;
      if (!player || player.hp <= 0) return;
      const now = performance.now();
      const glowColor = powerUpColor(kind);

      tocarSom(
        CONFIG.sounds.powerUpPickup || CONFIG.sounds.abilityReady,
        0.45,
        "ability",
      );
      criarParticulasHit(
        player.x + player.w / 2,
        player.y + player.h / 2,
        glowColor,
        12,
      );

      if (kind === "regen") {
        player.hp = Math.min(vidaMaximaLocal(), player.hp + (isLocalPvpMode() ? 12 : 1));
      } else if (kind === "tripleRegen") {
        player.hp = Math.min(vidaMaximaLocal(), player.hp + (isLocalPvpMode() ? 22 : 3));
      } else if (kind === "goldenHeart") {
        if (isLocalPvpMode()) {
          player.hp = Math.min(vidaMaximaLocal(), player.hp + 18);
        } else {
          player.goldenHp = Math.min(CONFIG.gameplay.powerups.goldenHeartMax, player.goldenHp + 1);
          setPlayer2GoldenHp(player.goldenHp);
          player.invincibleUntil = Math.max(player.invincibleUntil, now + 900);
        }
      } else if (kind === "shield") {
        player2ShieldUntilRef.current = now + 7200;
        if (!isLocalPvpMode()) player.invincibleUntil = Math.max(player.invincibleUntil, now + 7200);
      } else if (kind === "fireRate") {
        player.normalCooldown = 0;
        player2FireRateUntilRef.current = now + CONFIG.gameplay.powerups.fireRateDurationMs;
      } else if (kind === "powerShot") {
        player2PowerShotUntilRef.current = now + CONFIG.gameplay.powerups.powerShotDurationMs;
        player.strongReadyAt = 0;
        player2BoostReadyAtRef.current = Math.min(player2BoostReadyAtRef.current, now + 700);
      } else if (kind === "homingShot") {
        player2HomingShotUntilRef.current = now + CONFIG.gameplay.powerups.homingShotDurationMs;
        player.strongReadyAt = 0;
      } else if (kind === "flames") {
        player2FlamesUntilRef.current = now + Math.max(5200, CONFIG.gameplay.powerups.fireRateDurationMs * 0.78);
        player2FireRateUntilRef.current = now + Math.max(2800, CONFIG.gameplay.powerups.fireRateDurationMs * 0.55);
        player.strongReadyAt = 0;
      } else if (kind === "randomBox") {
        if (randomFloat() < 0.68) {
          player.hp = Math.min(CONFIG.gameplay.player.maxHp, player.hp + 1);
        } else {
          player2ShieldUntilRef.current = now + 4200;
          if (!isLocalPvpMode()) player.invincibleUntil = Math.max(player.invincibleUntil, now + 4200);
        }
      }

      setPlayer2Hp(player.hp);
    }

    function reviverJogadoresLocais() {
      if (!isLocalWaveMode() || gameStateRef.current !== "playing") return;
      const p1 = playerRef.current;
      const p2 = player2Ref.current;
      if (!p2) return;

      const now = performance.now();
      const reviveRef = localReviveHoldRef.current;
      const distancia = Math.hypot(
        p1.x + p1.w / 2 - (p2.x + p2.w / 2),
        p1.y + p1.h / 2 - (p2.y + p2.h / 2),
      );
      const inRange = distancia <= 112;

      const p1Interagiu =
        teclaControlePressionada("shot") ||
        teclaControlePressionada("boost") ||
        mobileShootRef.current;
      const p2Interagiu =
        keysRef.current["u"] ||
        keysRef.current["p"] ||
        p2Segurando("0", "1", "5", "7");

      let target = 0;
      let boosted = false;
      if (p1.hp <= 0 && p2.hp > 0 && inRange) {
        target = 1;
        boosted = Boolean(p2Interagiu);
      } else if (p2.hp <= 0 && p1.hp > 0 && inRange) {
        target = 2;
        boosted = Boolean(p1Interagiu);
      }

      if (!target) {
        reviveRef.target = 0;
        reviveRef.progress = Math.max(0, reviveRef.progress - 0.026);
        reviveRef.lastAt = now;
        return;
      }

      if (reviveRef.target !== target) reviveRef.progress = 0;
      reviveRef.target = target;
      const elapsed = reviveRef.lastAt ? now - reviveRef.lastAt : 16;
      reviveRef.lastAt = now;
      const duration = boosted ? 1900 : 3150;
      reviveRef.progress = clamp(reviveRef.progress + elapsed / duration, 0, 1);

      if (reviveRef.progress < 1) return;

      if (target === 1) {
        p1.hp = 2;
        p1.invincibleUntil = now + 2200;
        p1.x = clamp(p2.x - p1.w - 28, 0, CONFIG.canvasWidth - p1.w);
        p1.y = clamp(p2.y, 0, CONFIG.canvasHeight - p1.h);
        p1.vx = -2.2;
        p1.vy = 0;
        setPlayerHp(p1.hp);
        setIsLowHp(false);
        pararAlarmeLowHp(true);
        criarExplosao(p1.x + p1.w / 2, p1.y + p1.h / 2, LOCAL_PLAYER_COLORS[0], 18);
      } else if (target === 2) {
        p2.hp = 2;
        p2.invincibleUntil = now + 2200;
        p2.x = clamp(p1.x + p1.w + 28, 0, CONFIG.canvasWidth - p2.w);
        p2.y = clamp(p1.y, 0, CONFIG.canvasHeight - p2.h);
        p2.vx = 2.2;
        p2.vy = 0;
        setPlayer2Hp(p2.hp);
        criarExplosao(p2.x + p2.w / 2, p2.y + p2.h / 2, LOCAL_PLAYER_COLORS[1], 18);
      }

      if (onlineTogetherCoordenado()) enviarOnline({ type: "coop_revive", slot: target, seq: Date.now() });
      resetarReviveLocal();
      tocarSom(CONFIG.sounds.abilityReady || CONFIG.sounds.powerUpPickup, 0.55, "ability");
    }

    function desenharReviveLocal(ctx: CanvasRenderingContext2D) {
      if (!isLocalWaveMode()) return;
      const target = localReviveHoldRef.current.target;
      const progress = clamp(localReviveHoldRef.current.progress, 0, 1);
      const ghost = target === 1 ? playerRef.current : target === 2 ? player2Ref.current : null;
      if (!ghost || ghost.hp > 0) return;
      const cx = ghost.x + ghost.w / 2;
      const cy = Math.max(72, ghost.y - 34);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = "rgba(8, 5, 14, 0.82)";
      ctx.strokeStyle = target === 1 ? LOCAL_PLAYER_COLORS[0] : LOCAL_PLAYER_COLORS[1];
      ctx.lineWidth = 3;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(-86, -20, 172, 40, 10);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff7d6";
      ctx.font = `bold 13px "${CONFIG.fonts.ui}"`;
      ctx.textAlign = "center";
      ctx.fillText("SEGURE PARA REVIVER", 0, -4);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(-70, 8, 140, 8);
      ctx.fillStyle = target === 1 ? LOCAL_PLAYER_COLORS[0] : LOCAL_PLAYER_COLORS[1];
      ctx.fillRect(-70, 8, 140 * progress, 8);
      ctx.restore();
    }

    function resolverPowerUps() {
      const player = playerRef.current;
      const playerHitbox = getPlayerHitbox(player);
      const p2 = player2Ref.current;
      const p2Hitbox = p2 ? getPlayerHitbox(p2) : null;
      const collected = new Set<number>();

      for (const power of powerUpsRef.current) {
        const pickupBox = {
          x: power.x + power.w * 0.14,
          y: power.y + power.h * 0.14,
          w: power.w * 0.72,
          h: power.h * 0.72,
        };

        const nowPickup = performance.now();
        const p1Blocked = power.blockedPlayer === 1 && (power.blockedUntil ?? 0) > nowPickup;
        const p2Blocked = power.blockedPlayer === 2 && (power.blockedUntil ?? 0) > nowPickup;

        if (player.hp > 0 && !p1Blocked && rectsCollide(playerHitbox, pickupBox)) {
          collected.add(power.id);
          pararLoopPowerUpTrail(power.id);
          if (onlineTogetherCoordenado()) {
            aplicarPowerUpPorSlotSincronizado(slotLocalOnline(), power.kind, power.id);
            enviarOnline({ type: "coop_powerup_collect", slot: slotLocalOnline(), kind: power.kind, powerId: power.id, seq: Date.now() });
          } else {
            aplicarPowerUp(power.kind);
          }
          criarParticulasHit(
            power.x + power.w / 2,
            power.y + power.h / 2,
            powerUpColor(power.kind),
            12,
          );
          continue;
        }

        if (
          p2 &&
          p2.hp > 0 &&
          !p2Blocked &&
          p2Hitbox &&
          isLocalMode() &&
          !onlineTogetherCoordenado() &&
          rectsCollide(p2Hitbox, pickupBox)
        ) {
          collected.add(power.id);
          pararLoopPowerUpTrail(power.id);
          aplicarPowerUpPlayer2(power.kind);
          criarParticulasHit(
            power.x + power.w / 2,
            power.y + power.h / 2,
            powerUpColor(power.kind),
            12,
          );
        }
      }

      if (collected.size > 0) {
        powerUpsRef.current = powerUpsRef.current.filter(
          (power) => !collected.has(power.id),
        );
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
      const cap = onlineGameplayActiveRef.current ? (souHostOnline() ? 120 : 96) : (usarEfeitosReduzidos() ? 82 : 190);
      if (particlesRef.current.length > cap)
        particlesRef.current = particlesRef.current.slice(-cap);

      damageNumbersRef.current = damageNumbersRef.current
        .map((number) => ({
          ...number,
          x: number.x + number.vx * speedFactor,
          y: number.y + number.vy * speedFactor,
          vy: number.vy + 0.018 * speedFactor,
          life: number.life - delta,
        }))
        .filter((number) => number.life > 0);
    }

    function desenharNumerosDano(ctx: CanvasRenderingContext2D) {
      if (damageNumbersRef.current.length === 0) return;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const number of damageNumbersRef.current) {
        const alpha = clamp(number.life / number.maxLife, 0, 1);
        const scale = number.crit ? 1.18 : 1;
        ctx.globalAlpha = alpha;
        ctx.font = `${number.crit ? 28 : 22}px "${CONFIG.fonts.ui}"`;
        ctx.lineWidth = 4 * scale;
        ctx.strokeStyle = "rgba(15, 9, 0, .88)";
        ctx.fillStyle = number.color;
        ctx.strokeText(`${number.value}`, number.x, number.y);
        ctx.fillText(`${number.value}`, number.x, number.y);
      }
      ctx.restore();
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
      ctx.font = `24px "${CONFIG.fonts.ui}"`;
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
        renderCtx.arc(
          cx + dirX * length,
          cy + dirY * length,
          10,
          0,
          Math.PI * 2,
        );
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
          renderCtx.fillRect(
            bx + 2,
            by + 2,
            (barW - 4) * clamp(progress, 0, 1),
            barH - 4,
          );
        }

        renderCtx.font = `22px ${CONFIG.fonts.ui}`;
        renderCtx.fillStyle = color;
        renderCtx.fillText(label, cx + dirX * 70 + 12, cy + dirY * 70 - 12);
        renderCtx.restore();
      };

      const now = performance.now();

      if (boostAimRef.current.active && boostAimRef.current.variantActive) {
        const aim = boostAimRef.current;
        const alpha = clamp(
          (now - (aim.startAt + HOLD_VARIANT_MS)) / AIM_FADE_MS,
          0,
          0.92,
        );
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
            if (
              gameStateRef.current === "tutorial" &&
              tutorialStepRef.current === "strong" &&
              shot.type !== "strong"
            ) {
              shotsToRemove.add(shot.id);
              criarParticulasHit(
                shot.x + shot.w / 2,
                shot.y + shot.h / 2,
                "#93c5fd",
                4,
              );
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
            tocarSom(CONFIG.sounds.enemyHit, 0.2, "hit");
            tocarVozHitChocado();

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
              registrarAbate(enemy.kind, shot.ownerId ?? 1);
              if (gameStateRef.current !== "tutorial") spawnTokenBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, (shot.ownerId ?? 1) as PlayerSlot, enemy.kind === "asteroid" ? 4 : 7);
              if (gameStateRef.current !== "tutorial") {
                tentarSpawnPowerUp(
                  enemy.x + enemy.w / 2,
                  enemy.y + enemy.h / 2,
                );
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
            const danoAplicadoBoss = Math.min(
              shot.damage,
              Math.max(0, boss.hp),
            );
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

      if (
        boss.active &&
        !boss.intro &&
        boss.hp > 0 &&
        rectsCollide(playerHitbox, bossHitbox)
      ) {
        const hitCenterY = player.y + player.h / 2;
        const bossCenterY = bossHitbox.y + bossHitbox.h / 2;
        const bossLeft = bossHitbox.x;

        if (boosting && !boostHitEnemiesRef.current.has(-9999)) {
          boostHitEnemiesRef.current.add(-9999);
          const boostDamage =
            CONFIG.gameplay.boost.damage + bonusDanoInfinito();
          const danoBoostBoss = Math.min(boostDamage, Math.max(0, boss.hp));
          boss.hp -= boostDamage;
          carregarBoostPorDano(danoBoostBoss);
          tentarSpawnPowerUp(bossHitbox.x, hitCenterY, true);
          criarExplosao(bossHitbox.x, hitCenterY, "#fb8500", 18);
          tocarSom(CONFIG.sounds.boostHit, 0.45, "hit");
          aplicarShockwaveDeTiroForte(bossHitbox.x, hitCenterY);
        }

        // Barreira física: o jogador não entra no corpo do Chocado.
        player.x = Math.min(
          player.x,
          bossLeft - CONFIG.gameplay.player.hitboxOffsetX - player.w * 0.08,
        );
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
              CONFIG.gameplay.boost.damage + bonusDanoInfinito(),
              Math.max(0, enemy.hp),
            );
            enemy.hp -= CONFIG.gameplay.boost.damage + bonusDanoInfinito();
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
            player.y -=
              (dirY / len) * (CONFIG.gameplay.boost.hitBounceBack * 0.42);
            player.vx = -(dirX / len) * 5.2;
            player.vy = -(dirY / len) * 3.0;
            player.boostUntil = Math.min(player.boostUntil, now + 45);

            if (enemy.hp <= 0) {
              enemiesToRemove.add(enemy.id);
              registrarAbate(enemy.kind);
              if (gameStateRef.current !== "tutorial") spawnTokenBurst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 1, enemy.kind === "asteroid" ? 4 : 7);
              if (gameStateRef.current !== "tutorial") {
                tentarSpawnPowerUp(
                  enemy.x + enemy.w / 2,
                  enemy.y + enemy.h / 2,
                );
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
      const slowMultiplier =
        performance.now() < slowPlayerUntilRef.current
          ? CONFIG.gameplay.powerups.randomBadSlowMultiplier
          : 1;
      const equippedBuffs = buffsCosmeticosEquipados();
      let effectiveAcceleration =
        CONFIG.gameplay.player.acceleration * slowMultiplier;
      let effectiveMaxSpeedX =
        CONFIG.gameplay.player.maxSpeedX * slowMultiplier;
      let effectiveMaxSpeedY =
        CONFIG.gameplay.player.maxSpeedY * slowMultiplier;
      if (!isLocalPvpMode()) {
        const superSparkBonus = performance.now() < petSuperSparkUntilRef.current ? 0.15 : 0;
        effectiveAcceleration *= 1 + equippedBuffs.speed * 0.45 + superSparkBonus * 0.55;
        effectiveMaxSpeedX *= 1 + equippedBuffs.speed + superSparkBonus;
        effectiveMaxSpeedY *= 1 + equippedBuffs.speed * 0.82 + superSparkBonus * 0.72;
      }

      if (!isTutorialMode && !isLocalPvpMode() && equippedBuffs.regenSeconds > 0 && player.hp > 0) {
        const maxBuffHp = Math.max(1, CONFIG.gameplay.player.maxHp + equippedBuffs.maxHp);
        const nowRegen = performance.now();
        if (player.hp < maxBuffHp && nowRegen - lastPassiveRegenAtRef.current >= equippedBuffs.regenSeconds * 1000) {
          lastPassiveRegenAtRef.current = nowRegen;
          player.hp = Math.min(maxBuffHp, player.hp + 1);
          setPlayerHp(player.hp);
          criarParticulasHit(player.x + player.w * .5, player.y + player.h * .5, "#86efac", 10);
        }
      }
      executarHabilidadesPetAvancadas(delta, canvas);

      if (!isTutorialMode && bossIntroSequenceRef.current.active) {
        atualizarCutsceneChocado(delta);
        atualizarParticulas(delta);
        atualizarShockwaves(delta);
        atualizarPowerUpUi();
        setIsLowHp(false);
        return;
      }

      if (isTutorialMode && tutorialResetRef.current.active) {
        const reset = tutorialResetRef.current;
        const progress = clamp(
          (performance.now() - reset.startAt) / reset.durationMs,
          0,
          1,
        );
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

      if (onlineGameplayActiveRef.current && onlineServerAuthoritativeRef.current && gameStateRef.current === "playing") {
        // v2.3.3: servidor é a verdade, mas o player local recebe prediction curta para parecer o jogo base.
        const snapshotToRender = escolherSnapshotOnlineParaRender();
        if (snapshotToRender) aplicarSnapshotOnline(snapshotToRender);
        aplicarPredicaoOnlineLocal(delta, canvas);
        const sf = delta / 16.67;
        shotsRef.current = shotsRef.current
          .map((shot) => ({ ...shot, x: shot.x + (shot.vx ?? shot.speed) * sf, y: shot.y + (shot.vy ?? 0) * sf }))
          .filter((shot) => shot.x + shot.w > -80 && shot.x < canvas.width + 80 && shot.y + shot.h > -80 && shot.y < canvas.height + 80);
        powerUpsRef.current = powerUpsRef.current.map((p) => ({ ...p, age: p.age + delta, x: p.x + p.vx * sf })).filter((p) => p.x > -90 && p.life > 0);
        tokensRef.current = tokensRef.current.map((t) => ({ ...t, age: t.age + delta, x: t.x + t.vx * sf, y: t.y + Math.sin((t.age + delta) * 0.01 + t.wavePhase) * 0.14 })).filter((t) => t.x > -70 && t.life > 0);
        atualizarParticulas(delta);
        atualizarShockwaves(delta);
        atualizarPowerUpUi();
        setIsLowHp(false);
        return;
      }

      if (onlineGameplayActiveRef.current && !onlineTogetherCoordenado() && !souHostOnline() && gameStateRef.current === "playing") {
        // Cliente não-host usa buffer de snapshots; extrapola só o frame atual e prediz o próprio input.
        const snapshotToRender = escolherSnapshotOnlineParaRender();
        if (snapshotToRender) aplicarSnapshotOnline(snapshotToRender);
        extrapolarEstadoOnlineNaoHost(delta, canvas);
        aplicarPredicaoOnlineLocal(delta, canvas);
        if (!mobileRuntimeRef.current && !adaptivePerformanceRef.current.reduced) atualizarParticulas(delta);
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
        atualizarTokens(delta, canvas);
      if (isLocalPvpMode() && performance.now() - lastPvpPowerDropAtRef.current > 13500) {
        spawnPowerUpPvp(false);
      }
        resolverPowerUps();
        resolverTokens();
        atualizarParticulas(delta);
        atualizarPowerUpUi();
        atualizarShockwaves(delta);
        setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing");
        return;
      }

      const moveLayout = String(
        (CONFIG.settings as Record<string, unknown>).pcMoveLayout || "both",
      );
      const useWasd = moveLayout !== "arrows";
      const useArrows = moveLayout !== "wasd";

      const keyboardX =
        ((useArrows && keysRef.current["arrowright"]) ||
        (useWasd && keysRef.current["d"])
          ? 1
          : 0) -
        ((useArrows && keysRef.current["arrowleft"]) ||
        (useWasd && keysRef.current["a"])
          ? 1
          : 0);

      const keyboardY =
        ((useArrows && keysRef.current["arrowdown"]) ||
        (useWasd && keysRef.current["s"])
          ? 1
          : 0) -
        ((useArrows && keysRef.current["arrowup"]) ||
        (useWasd && keysRef.current["w"])
          ? 1
          : 0);

      const gamepadMove = isLocalMode() ? { x: 0, y: 0 } : gamepadAxesRef.current;
      let inputX = clamp(
        keyboardX + mobileMoveRef.current.x + gamepadMove.x,
        -1,
        1,
      );
      let inputY = clamp(
        keyboardY + mobileMoveRef.current.y + gamepadMove.y,
        -1,
        1,
      );

      const onlineRemoteP1Input =
        onlineTogetherCoordenado()
          ? null
          : (onlineGameplayActiveRef.current && !souHostOnline()
              ? onlineRemoteInputsRef.current[onlineHostSlotRef.current] || EMPTY_ONLINE_INPUT_STATE
              : null);
      if (onlineRemoteP1Input) {
        const remoteAxes = eixosDeInputOnline(onlineRemoteP1Input);
        inputX = remoteAxes.x;
        inputY = remoteAxes.y;
      }

      const nowForHold = performance.now();
      const player1ShotCommand = onlineRemoteP1Input
        ? onlineRemoteP1Input.shot
        : ((isLocalMode() ? teclaControlePressionada("shot") : controleAcaoSegurando("shot")) || mobileShootRef.current);
      const player1StrongCommand = onlineRemoteP1Input
        ? onlineRemoteP1Input.strong
        : (isLocalMode() ? teclaControlePressionada("strong") : controleAcaoSegurando("strong"));
      const player1DodgeCommand = onlineRemoteP1Input
        ? onlineRemoteP1Input.dodge
        : (isLocalMode() ? teclaControlePressionada("dodge") : controleAcaoAcionada("dodge"));
      const player1BoostHoldCommand = onlineRemoteP1Input
        ? onlineRemoteP1Input.boost
        : controleAcaoSegurando("boost");

      if (
        player1BoostHoldCommand &&
        player.hp > 0 &&
        (!isTutorialMode || tutorialStepRef.current === "boost")
      ) {
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
          aim.chargeRatio = clamp(
            (heldMs - HOLD_VARIANT_MS) / BOOST_HOLD_MAX_MS,
            0,
            1,
          );
        }

        inputX = 0;
        inputY = 0;
        player.vx *= 0.72;
        player.vy *= 0.72;

        if (aim.variantActive && aim.chargeRatio >= 1) {
          soltarMiraBoost(true);
        }
      }

      if (
        player1StrongCommand &&
        (!isTutorialMode || tutorialStepRef.current === "strong")
      ) {
        shootStrong(1, 0);
      }

      if (
        player1DodgeCommand &&
        (!isTutorialMode || tutorialStepRef.current === "dodge")
      ) {
        keysRef.current[
          normalizarTeclaConfig(
            (CONFIG.settings as Record<string, unknown>).pcDodgeKey,
          )
        ] = false;
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

      player.vx = clamp(player.vx, -effectiveMaxSpeedX, effectiveMaxSpeedX);
      player.vy = clamp(player.vy, -effectiveMaxSpeedY, effectiveMaxSpeedY);

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

      if (
        player1ShotCommand &&
        (!isTutorialMode || tutorialStepRef.current === "shot")
      ) {
        shootNormal();
      }

      atualizarPlayer2(delta, canvas);
      atualizarPlayersExtrasRuntime(delta, canvas);

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
        player.normalCooldown = Math.max(
          0,
          player.normalCooldown - speedFactor,
        );
      }

      shotsRef.current = shotsRef.current
        .map((shot) => {
          let vx = shot.vx ?? shot.speed;
          let vy = shot.vy ?? 0;

          if (shot.variant === "homing" || shot.variant === "powerHoming") {
            const homingAge = performance.now() - (shot.bornAt ?? performance.now());
            const homingAllowed = !isLocalPvpMode() || homingAge < 1150;
            const target = homingAllowed
              ? (isLocalPvpMode()
                  ? (() => {
                      const targetPlayer = shot.ownerId === 2 ? playerRef.current : player2Ref.current;
                      return targetPlayer && targetPlayer.hp > 0
                        ? { x: targetPlayer.x + targetPlayer.w / 2, y: targetPlayer.y + targetPlayer.h / 2, distance: Math.hypot(targetPlayer.x + targetPlayer.w / 2 - (shot.x + shot.w / 2), targetPlayer.y + targetPlayer.h / 2 - (shot.y + shot.h / 2)) }
                        : null;
                    })()
                  : encontrarAlvoMaisProximo(
                      shot.x + shot.w / 2,
                      shot.y + shot.h / 2,
                    ))
              : null;
            if (target) {
              const dx = target.x - (shot.x + shot.w / 2);
              const dy = target.y - (shot.y + shot.h / 2);
              const len = Math.max(0.001, Math.hypot(dx, dy));
              const desiredVx = (dx / len) * shot.speed;
              const desiredVy = (dy / len) * shot.speed;
              const turn = isLocalPvpMode()
                ? Math.min(0.045, CONFIG.gameplay.powerups.homingTurnRate * 0.42)
                : CONFIG.gameplay.powerups.homingTurnRate;
              vx += (desiredVx - vx) * turn;
              vy += (desiredVy - vy) * turn;
              const currentLen = Math.max(0.001, Math.hypot(vx, vy));
              vx = (vx / currentLen) * shot.speed;
              vy = (vy / currentLen) * shot.speed;
            }
          }

          if (isLocalPvpMode() && shot.type === "normal" && shot.variant !== "homing" && shot.variant !== "powerHoming") {
            const shotAge = performance.now() - (shot.bornAt ?? performance.now());
            const targetPlayer = shot.ownerId === 2 ? playerRef.current : player2Ref.current;
            if (targetPlayer && targetPlayer.hp > 0 && shotAge < 720) {
              const targetY = targetPlayer.y + targetPlayer.h / 2;
              const currentY = shot.y + shot.h / 2;
              const verticalError = targetY - currentY;
              if (Math.abs(verticalError) < 230) {
                const assistVy = clamp(verticalError * 0.018, -2.8, 2.8);
                vy += (assistVy - vy) * 0.055;
              }
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

        if (
          tutorialStepRef.current === "move" &&
          movingNow &&
          Math.hypot(player.vx, player.vy) > 0.22
        ) {
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
        if (
          tutorialStepRef.current === "boost" ||
          tutorialStepRef.current === "dodge"
        ) {
          resolverColisoes();
        }

        if (
          tutorialStepRef.current === "shot" ||
          tutorialStepRef.current === "strong"
        ) {
          resolverColisoes();

          const currentTutorialStep = tutorialStepRef.current;
          const targetsLeft = enemiesRef.current.filter((enemy) => {
            if (enemy.kind !== "purple") return false;
            if (enemy.tutorialStep !== currentTutorialStep) return false;

            if (currentTutorialStep === "strong") {
              return (
                enemy.hp > 0 &&
                !enemy.removedByStrong &&
                enemy.x > -enemy.w - 80
              );
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
                if (gameStateRef.current === "tutorial")
                  prepararPassoTutorial(tutorialStepRef.current);
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
            if (
              tutorialStepRef.current === "strong" &&
              enemy.tutorialStep === "strong"
            ) {
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
            y:
              enemy.waveBaseY -
              enemy.h / 2 +
              Math.sin((performance.now() + enemy.id * 97) * 0.003) * 12,
            rotation:
              (enemy.rotation ?? 0) + (enemy.rotationSpeed ?? 0) * delta,
          };
        });

        atualizarParticulas(delta);
        atualizarPowerUpUi();
        return;
      }

      if (!isLocalPvpMode()) {
        atualizarWavesInfinitas();
        atualizarInimigos(delta, canvas);
        atualizarBoss(delta);
        atualizarBossProjectiles(delta);
      } else if (performance.now() - lastPvpPowerDropAtRef.current > 8200) {
        spawnPowerUpPvp(false);
      }
      atualizarPowerUps(delta, canvas);
      atualizarTokens(delta, canvas);
      resolverColisoes();
      resolverColisoesPlayer2();
      reviverJogadoresLocais();
      resolverPowerUps();
      resolverPowerUpsExtrasRuntime();
      resolverTokens();
      atualizarParticulas(delta);
      atualizarPowerUpUi();
      atualizarShockwaves(delta);
      setIsLowHp(player.hp <= 1 && gameStateRef.current === "playing" && !isLocalMode());
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
          CONFIG.sounds.gameOverFinalExplosion ||
            CONFIG.sounds.gameOverExplosion ||
            CONFIG.sounds.explosion,
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
      const reducedNow = usarEfeitosReduzidos();
      const fpsLimitSetting = String(CONFIG.settings.fpsLimit ?? "unlimited");
      const fpsLimitValue =
        fpsLimitSetting === "unlimited"
          ? 0
          : Math.max(5, Number(fpsLimitSetting) || 0);
      const targetFrameMs = fpsLimitValue > 0 ? 1000 / fpsLimitValue : 0;
      if (targetFrameMs > 0 && time - lastRenderedAt < targetFrameMs) {
        animationFrame = window.requestAnimationFrame(loop);
        return;
      }
      lastRenderedAt = time;
      const elapsedCapMs = onlineTogetherCoordenado() ? 50 : 250;
      const elapsedSinceRender = Math.min(elapsedCapMs, Math.max(0, time - lastTime));
      lastTime = time;

      atualizarEstadoGamepad();
      if (time - lastDeviceRefreshAtRef.current > 850) {
        lastDeviceRefreshAtRef.current = time;
        atualizarDispositivosDisponiveis();
      }
      processarEntradaGamepadGlobal();
      if (botaoFisicoControleAcionado("10")) ativarHabilidadePetManual();
      enviarInputOnlineAtual();

      const fpsCounter = fpsCounterRef.current;
      fpsCounter.frames += 1;
      if (time - fpsCounter.lastAt >= 650) {
        fpsCounter.value = Math.max(
          1,
          Math.round(
            (fpsCounter.frames * 1000) / Math.max(1, time - fpsCounter.lastAt),
          ),
        );
        fpsCounter.frames = 0;
        fpsCounter.lastAt = time;

        if (String(CONFIG.settings.performanceMode) === "auto") {
          const adaptive = adaptivePerformanceRef.current;
          if (fpsCounter.value < 43) {
            adaptive.lowSamples += 1;
            adaptive.highSamples = 0;
          } else if (fpsCounter.value > 56) {
            adaptive.highSamples += 1;
            adaptive.lowSamples = 0;
          } else {
            adaptive.lowSamples = Math.max(0, adaptive.lowSamples - 1);
            adaptive.highSamples = Math.max(0, adaptive.highSamples - 1);
          }

          const lowThreshold = onlineGameplayActiveRef.current ? 1 : 2;
          const highThreshold = onlineGameplayActiveRef.current ? 3 : 4;
          if (adaptive.lowSamples >= lowThreshold) adaptive.reduced = true;
          if (adaptive.highSamples >= highThreshold) adaptive.reduced = false;
        }

        if (CONFIG.settings.showFps) setFpsUi(fpsCounter.value);
      }

      limitarObjetosPesados();
      aplicarPixelArt(renderCtx);
      if (!screenFadeRef.current) {
        let simulationRemaining = elapsedSinceRender;
        do {
          const simulationStep = onlineTogetherCoordenado() ? Math.min(16.67, simulationRemaining || 16.67) : Math.min(32, simulationRemaining || 16.67);
          atualizar(simulationStep, renderCanvas);
          simulationRemaining -= simulationStep;
        } while (simulationRemaining > 0.5);
        sincronizarGameplayOnline();
      }
      atualizarGameOverCutscene();
      const lowHpAlarmShouldPlay =
        CONFIG.settings.enableLowHpAlarm &&
        gameStateRef.current === "playing" &&
        playerRef.current.hp > 0 &&
        playerRef.current.hp <= 1;
      if (!lowHpAlarmShouldPlay) pararAlarmeLowHp(true);

      const shake = shakeRef.current;
      const shaking = performance.now() < shake.endAt;

      renderCtx.save();

      if (shaking) {
        const x = (randomFloat() - 0.5) * shake.intensity;
        const y = (randomFloat() - 0.5) * shake.intensity;
        renderCtx.translate(x, y);
      }

      desenharFundo(renderCtx, renderCanvas, elapsedSinceRender);

      const mirrorOnlinePvp = espelharOnlinePvpVisual();
      if (mirrorOnlinePvp) {
        renderCtx.save();
        renderCtx.translate(renderCanvas.width, 0);
        renderCtx.scale(-1, 1);
      }

      for (const shot of shotsRef.current) desenharTiro(renderCtx, shot);
      for (const enemy of enemiesRef.current) desenharEnemy(renderCtx, enemy);
      desenharBoss(renderCtx);
      for (const bullet of enemyProjectilesRef.current)
        desenharEnemyProjectile(renderCtx, bullet);
      for (const projectile of bossProjectilesRef.current)
        desenharBossProjectile(renderCtx, projectile);
      if (!mirrorOnlinePvp) {
        desenharPowerUps(renderCtx);
        desenharTokens(renderCtx);
      }
      if (!reducedNow || CONFIG.settings.enableParticles)
        desenharShockwaves(renderCtx);
      desenharIndicadorMira(renderCtx);
      if (CONFIG.settings.enableParticles || !reducedNow)
        desenharParticulas(renderCtx);
      desenharNumerosDano(renderCtx);

      if (
        gameStateRef.current === "playing" ||
        gameStateRef.current === "tutorial" ||
        gameStateRef.current === "paused" ||
        gameStateRef.current === "gameOverCutscene"
      ) {
        desenharPlayer(renderCtx, elapsedSinceRender);
        desenharPlayer2(renderCtx, elapsedSinceRender);
        desenharPlayersExtrasRuntime(renderCtx, elapsedSinceRender);
        const labelLocalP1 = onlineTogetherCoordenado()
          ? `P${slotLocalOnline()}`
          : (deveProjetarOnlinePvpLocal() ? `P${onlineSlotRef.current}` : "P1");
        const labelLocalP2 = onlineTogetherCoordenado()
          ? `P${slotVisualPlayer2Online()}`
          : (deveProjetarOnlinePvpLocal() ? `P${onlineHostSlotRef.current || 1}` : "P2");
        const colorLocalP1 = onlineTogetherCoordenado() ? (onlineProfileColorBySlotRef.current[slotLocalOnline()] || LOCAL_PLAYER_COLORS[(slotLocalOnline() - 1) % LOCAL_PLAYER_COLORS.length]) : LOCAL_PLAYER_COLORS[0];
        const colorLocalP2 = onlineTogetherCoordenado() ? (onlineProfileColorBySlotRef.current[slotVisualPlayer2Online()] || LOCAL_PLAYER_COLORS[(slotVisualPlayer2Online() - 1) % LOCAL_PLAYER_COLORS.length]) : LOCAL_PLAYER_COLORS[1];
        desenharIndicadorJogadorLocal(renderCtx, playerRef.current, labelLocalP1, colorLocalP1);
        desenharIndicadorJogadorLocal(renderCtx, player2Ref.current, labelLocalP2, colorLocalP2);
        desenharReviveLocal(renderCtx);
      }

      if (mirrorOnlinePvp) renderCtx.restore();

      if (mirrorOnlinePvp) {
        desenharPowerUps(renderCtx);
        desenharTokens(renderCtx);
      }
      renderCtx.restore();
      desenharHUD(renderCtx);

      animationFrame = window.requestAnimationFrame(loop);
    }

    function keyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (key === "tab") {
        e.preventDefault();
        setPingBoardOpen(true);
        return;
      }

      if (keyBindCaptureRef.current) {
        e.preventDefault();
        e.stopPropagation();
        if (key === "escape") {
          cancelarCapturaTecla();
          return;
        }
        const candidate =
          key === " " ? "space" : key === "ctrl" ? "control" : key;
        const settingKey = keyBindCaptureRef.current;
        setKeyBindPrompt((current) =>
          current
            ? { ...current, settingKey, candidate, kind: "keyboard" }
            : { settingKey, label: "CONTROLE", candidate, kind: "keyboard" },
        );
        keyBindCaptureRef.current = null;
        tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
        return;
      }

      if (keyBindDialogOpenRef.current) {
        e.preventDefault();
        e.stopPropagation();
        if (key === "escape") cancelarCapturaTecla();
        if (key === "enter") confirmarCapturaTecla();
        return;
      }

      keysRef.current[key] = true;
      if (onlineGameplayActiveRef.current) enviarInputOnlineAtual(true);

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

      if (gameStateRef.current === "multiplayerMenu") {
        if (key === "escape" || key === "q") {
          voltarDoMultiplayer();
          return;
        }
        if (["arrowup", "w", "arrowleft", "a"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.32, "menu");
          setIndiceMultiplayerBranch(multiplayerBranchIndexRef.current - 1);
          return;
        }
        if (["arrowdown", "s", "arrowright", "d"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.32, "menu");
          setIndiceMultiplayerBranch(multiplayerBranchIndexRef.current + 1);
          return;
        }
        if (key === "enter" || key === " ") {
          if (multiplayerBranchIndexRef.current === 0) abrirLobbyLocal();
          else abrirLobbyOnline();
          return;
        }
      }

      if (gameStateRef.current === "onlineLobby") {
        if (key === "escape" || key === "q") {
          fecharLobbyOnline();
          return;
        }
        if (["arrowleft", "a", "arrowup", "w"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
          setIndiceOnlineMenu(onlineMenuIndexRef.current - 1);
          return;
        }
        if (["arrowright", "d", "arrowdown", "s"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.28, "menu");
          setIndiceOnlineMenu(onlineMenuIndexRef.current + 1);
          return;
        }
        if (key === "r") {
          alternarReadyOnline();
          return;
        }
        if (key === "enter" || key === " ") {
          const index = onlineMenuIndexRef.current;
          if (!onlineConnected) {
            if (index === 0) setFluxoOnline("create");
            else if (index === 1) setFluxoOnline("join");
            else if (index === 2) setDispositivoOnline(onlineDeviceIndexRef.current + 1);
            else if (onlineFlowRef.current === "create") criarSalaOnline();
            else if (onlineFlowRef.current === "join") entrarSalaOnline();
            return;
          }
          if (index === 0) alternarReadyOnline();
          else if (index === 1) iniciarPartidaOnline();
          else if (index === 2) votarModoOnline("localCoop");
          else if (index === 3) copiarCodigoSalaOnline();
          else if (index === 4) copiarCodigoSalaOnline();
          else if (index === 5) sairSalaOnline();
          return;
        }
      }

      if (gameStateRef.current === "localLobby") {
        if (["u", "i", "j", "k", "l", "o", "p", "h"].includes(key)) {
          setIndiceLobbyLocal(1);
          if (!localPlayerSlotsRef.current[1]?.ready) alternarReadySlotLocal(1);
          return;
        }
        if (key === "escape" || key === "q") {
          setEstado("multiplayerMenu");
          return;
        }
        if (["arrowleft", "a", "arrowup", "w"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
          setIndiceLobbyLocal(localLobbyIndexRef.current - 1);
          return;
        }
        if (["arrowright", "d", "arrowdown", "s"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
          setIndiceLobbyLocal(localLobbyIndexRef.current + 1);
          return;
        }
        if (key === "enter" || key === " ") {
          setLocalModeNotice("Confirme cada player com o próprio input. Use TAB para avançar.");
          window.setTimeout(() => setLocalModeNotice(""), 1500);
          return;
        }
        if (key === "tab") {
          abrirSelecaoModoLocal();
          return;
        }
      }

      if (gameStateRef.current === "localModeSelect") {
        if (key === "escape" || key === "q") {
          setEstado("localLobby");
          return;
        }
        if (["arrowleft", "a", "arrowup", "w"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
          setIndiceModoLocal(localModeIndexRef.current - 1);
          return;
        }
        if (["arrowright", "d", "arrowdown", "s"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
          setIndiceModoLocal(localModeIndexRef.current + 1);
          return;
        }
        if (key === "enter" || key === " ") {
          iniciarJogo(LOCAL_MODE_OPTIONS[localModeIndexRef.current].mode);
          return;
        }
      }

      if (gameStateRef.current === "extras") {
        if (key === "escape" || key === "q") {
          voltarDosExtras();
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

      if (gameStateRef.current === "tutorialChoice") {
        if (["arrowleft", "a", "arrowup", "w"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
          setIndiceTutorialChoice(tutorialChoiceIndexRef.current - 1);
          return;
        }

        if (["arrowright", "d", "arrowdown", "s"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
          setIndiceTutorialChoice(tutorialChoiceIndexRef.current + 1);
          return;
        }

        if (key === "enter" || key === " ") {
          confirmarTutorialChoiceAtual();
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

        if (/^[0-9]$/.test(key)) {
          debugSequenceRef.current = `${debugSequenceRef.current}${key}`.slice(
            -DEBUG_SEQUENCE.length,
          );
          if (
            debugSequenceRef.current === DEBUG_SEQUENCE &&
            !debugUnlockedRef.current
          ) {
            debugUnlockedRef.current = true;
            debugUsedRef.current = true;
            setDebugNotice("MODO DE TESTE ATIVADO — RANKING DESABILITADO");
            tocarSom(
              CONFIG.sounds.abilityReady || CONFIG.sounds.menuConfirm,
              0.72,
              "ability",
            );
            window.setTimeout(() => setDebugNotice(""), 4200);
            return;
          }
        }

        if (debugUnlockedRef.current) {
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
          if (key === "1")
            spawnPowerUp(
              "goldenHeart",
              playerRef.current.x + playerRef.current.w,
              playerRef.current.y + playerRef.current.h / 2,
            );
          if (key === "2")
            spawnPowerUp(
              "randomBox",
              playerRef.current.x + playerRef.current.w,
              playerRef.current.y + playerRef.current.h / 2,
            );
        }
      }

      if (gameStateRef.current === "paused") {
        if (["arrowup", "w"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
          setIndicePause(pauseIndexRef.current - 1);
          return;
        }
        if (["arrowdown", "s"].includes(key)) {
          tocarSom(CONFIG.sounds.menuMove, 0.3, "menu");
          setIndicePause(pauseIndexRef.current + 1);
          return;
        }
        if (key === "enter" || key === " ") {
          executarOpcaoPauseAtual();
          return;
        }
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

      if (key === "c" && gameStateRef.current === "playing") {
        ativarHabilidadePetManual();
        return;
      }

      if (key === "p" || key === "escape") {
        pausarOuVoltar();
      }
    }

    function keyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      keysRef.current[key] = false;
      if (key === "tab") {
        setPingBoardOpen(false);
        return;
      }
      if (onlineGameplayActiveRef.current) enviarInputOnlineAtual(true);

      if (
        key ===
        normalizarTeclaConfig(
          (CONFIG.settings as Record<string, unknown>).pcBoostKey,
        )
      ) {
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

  const profileBuffsForHud = buffsCosmeticosEquipados(localProfile);
  const normalLifeSlots = Array.from({ length: Math.max(CONFIG.gameplay.player.maxHp, CONFIG.gameplay.player.maxHp + Math.max(0, profileBuffsForHud.maxHp)) });
  const goldenLifeSlots = Array.from({ length: goldenHp });

  const nowForVisualEffects = visualEffectNow;

  const flashWhiteDuration = Math.max(
    1,
    flashWhiteUntilRef.current - flashWhiteStartRef.current,
  );
  const flashWhiteProgress =
    flashWhiteStartRef.current > 0
      ? clamp(
          (nowForVisualEffects - flashWhiteStartRef.current) /
            flashWhiteDuration,
          0,
          1,
        )
      : 0;
  const flashWhiteOpacity =
    flashWhiteProgress <= 0
      ? 0
      : flashWhiteProgress < 0.78
        ? 1
        : Math.pow(1 - (flashWhiteProgress - 0.78) / 0.22, 1.35);

  const flashBlurDuration = Math.max(
    1,
    flashBlurUntilRef.current - flashBlurStartRef.current,
  );
  const flashBlurProgress =
    flashBlurStartRef.current > 0
      ? clamp(
          (nowForVisualEffects - flashBlurStartRef.current) / flashBlurDuration,
          0,
          1,
        )
      : 0;
  const flashBlurOpacity =
    flashBlurProgress <= 0
      ? 0
      : flashBlurProgress < 0.16
        ? flashBlurProgress / 0.16
        : Math.pow(1 - (flashBlurProgress - 0.16) / 0.84, 1.1);
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
    const body = document.body;
    const ios = isIOSLikeDevice();

    const atualizarViewportDoJogo = () => {
      const viewport = window.visualViewport;
      const width = Math.round(viewport?.width ?? window.innerWidth);
      const height = Math.round(viewport?.height ?? window.innerHeight);
      const top = Math.round(viewport?.offsetTop ?? 0);
      const left = Math.round(viewport?.offsetLeft ?? 0);

      root.style.setProperty("--sn-app-width", `${width}px`);
      root.style.setProperty("--sn-app-height", `${height}px`);
      root.style.setProperty("--sn-app-top", `${top}px`);
      root.style.setProperty("--sn-app-left", `${left}px`);
    };

    root.classList.add("sn-game-mounted");
    body.classList.add("sn-game-mounted");

    if (ios) {
      root.classList.add("sn-ios-game-active", "sn-pseudo-fullscreen");
      body.classList.add("sn-ios-game-active", "sn-pseudo-fullscreen");
    }

    atualizarViewportDoJogo();

    window.addEventListener("resize", atualizarViewportDoJogo, {
      passive: true,
    });
    window.addEventListener("orientationchange", atualizarViewportDoJogo, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", atualizarViewportDoJogo, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", atualizarViewportDoJogo, {
      passive: true,
    });

    const esconderBarrasDoSafari = () => {
      if (!ios) return;
      window.scrollTo(0, 1);
      window.setTimeout(atualizarViewportDoJogo, 80);
    };

    window.addEventListener("touchend", esconderBarrasDoSafari, {
      passive: true,
    });

    return () => {
      root.classList.remove(
        "sn-game-mounted",
        "sn-ios-game-active",
        "sn-pseudo-fullscreen",
      );
      body.classList.remove(
        "sn-game-mounted",
        "sn-ios-game-active",
        "sn-pseudo-fullscreen",
      );
      root.style.removeProperty("--sn-app-width");
      root.style.removeProperty("--sn-app-height");
      root.style.removeProperty("--sn-app-top");
      root.style.removeProperty("--sn-app-left");
      window.removeEventListener("resize", atualizarViewportDoJogo);
      window.removeEventListener("orientationchange", atualizarViewportDoJogo);
      window.visualViewport?.removeEventListener(
        "resize",
        atualizarViewportDoJogo,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        atualizarViewportDoJogo,
      );
      window.removeEventListener("touchend", esconderBarrasDoSafari);
    };
  }, []);

  useEffect(() => {
    return () => {
      limparConexaoOnline();
    };
  }, []);

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
      ".sn-local-panel button",
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

  const onlineReadyCount = onlinePlayers.filter((player) => player.ready).length;
  const onlineReadyForMode = onlineConnected && onlinePlayers.length >= 2 && onlineReadyCount === onlinePlayers.length;
  const onlineLobbyStage = !onlineConnected ? "connect" : onlineReadyForMode ? "vote" : "crew";
  const onlineMissingReadySlots = onlinePlayers.filter((player) => !player.ready).map((player) => player.slot);

  return (
    <main
      className={[
        "game-fullscreen-page",
        `game-state-${gameState}`,
        `game-mode-${(waveUi.mode ?? currentModeRef.current) ?? "none"}`,
        isLocalMode(waveUi.mode ?? currentModeRef.current) ? "is-local-multiplayer" : "",
        onlineGameplayActive ? "is-online-multiplayer" : "",
        onlineSlot ? `is-online-slot-${onlineSlot}` : "",
        tutorialLaunchZoom ? "game-tutorial-launch-zoom" : "",
        bossCinematicStage !== "idle" ? `sn-boss-cinematic sn-boss-cinematic-${bossCinematicStage}` : "",
        bossDefeatStage !== "idle" && bossDefeatStage !== "done" ? `sn-boss-defeat sn-boss-defeat-${bossDefeatStage}` : "",
        CONFIG.settings.enableFlashingLights ? "" : "no-flashing",
        randomVisualEffect.inverted ? "game-screen-rotated" : "",
      ].filter(Boolean).join(" ")}
      style={gameStyle}
      onContextMenu={(event) => event.preventDefault()}
    >
      <PWARegister />

      {assetLoadState.loading && (
        <section className="sn-asset-loader" role="status" aria-live="polite">
          <div className="sn-asset-loader-card">
            <p>CANAL SPACE NEWS</p>
            <h1>Preparando a transmissão</h1>
            <div className="sn-asset-loader-track" aria-hidden="true">
              <span
                style={{
                  width: `${Math.round(
                    (assetLoadState.loaded /
                      Math.max(1, assetLoadState.total)) *
                      100,
                  )}%`,
                }}
              />
            </div>
            <strong>
              {Math.round(
                (assetLoadState.loaded / Math.max(1, assetLoadState.total)) *
                  100,
              )}
              %
            </strong>
            <small>
              Carregando imagens essenciais. Depois disso, a partida pode
              continuar mesmo se a conexão cair.
            </small>
          </div>
        </section>
      )}

      {!assetLoadState.loading &&
        assetWarningVisible &&
        missingAssets.length > 0 && (
          <aside className="sn-asset-warning" role="alert">
            <div>
              <strong>Alguns assets não carregaram</strong>
              <span>
                {missingAssets.length} arquivo(s) usarão fallback. Verifique a
                conexão ou os diretórios.
              </span>
            </div>
            <button type="button" onClick={() => void carregarAssetsDoJogo()}>
              Tentar novamente
            </button>
            <button
              type="button"
              className="is-close"
              onClick={() => setAssetWarningVisible(false)}
              aria-label="Fechar aviso"
            >
              ×
            </button>
          </aside>
        )}

      <div
        ref={customCursorRef}
        className="game-custom-cursor"
        aria-hidden="true"
      />

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

      {bossCinematicStage !== "idle" && (
        <div className="sn-cinematic-overlay" aria-hidden="true">
          <span className="sn-cinematic-line top" />
          <span className="sn-cinematic-line bottom" />
          {bossCinematicStage === "drag" && <strong>IMPACTO DE ROTA</strong>}
        </div>
      )}
      {bossDefeatStage !== "idle" && bossDefeatStage !== "done" && (
        <div className="sn-boss-defeat-overlay" aria-hidden="true" />
      )}

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
        gameState === "extras" ||
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

      <div className="sn-version-badge">v{SPACE_NEWS_VERSION}</div>

      {achievementPopup && (
        <div className="sn-achievement-popup-v214" aria-live="polite">
          <span>CONQUISTA DESBLOQUEADA</span>
          <strong>{achievementPopup.title}</strong>
          <small>{achievementPopup.description}</small>
        </div>
      )}

      {pingBoardOpen && onlineConnected && (
        <div className="sn-ping-board-v222">
          <header>LINK SPACE NEWS</header>
          {onlinePlayers.map((player) => (
            <div key={player.slot} className={player.slot === onlineSlot ? "is-you" : ""}>
              <span>P{player.slot} · {player.name}</span>
              <b>{player.slot === onlineSlot ? `${onlinePing ?? "--"}ms` : player.connected === false ? "OFF" : "SYNC"}</b>
            </div>
          ))}
          <small>{onlineHostSlot === 0 ? "Servidor P0" : `Host: P${onlineHostSlot || 1}`} · Tab para ocultar</small>
        </div>
      )}

      {onlineEventOverlay && onlineEventOverlay.until > performance.now() && (
        <div className={`sn-online-event-overlay-v19 is-${onlineEventOverlay.kind}`}>
          <strong>{onlineEventOverlay.title}</strong>
          <span>{onlineEventOverlay.message}</span>
          {onlineEventOverlay.countdownUntil && (
            <em>{Math.max(0, Math.ceil((onlineEventOverlay.countdownUntil - performance.now()) / 1000))}s</em>
          )}
        </div>
      )}

      {onlineGameplayActive && isLocalPvpMode(waveUi.mode ?? currentModeRef.current) && (gameState === "playing" || gameState === "paused") && onlineMatchIntroUntil > Date.now() && (
        <div className="sn-online-vs-intro" aria-hidden="true">
          <div className="sn-online-vs-side is-p1">
            <span>{`P${onlineSlot || 1} · VOCÊ`}</span>
            <strong>{onlinePlayers.find((p) => p.slot === (onlineSlot || 1))?.name || `P${onlineSlot || 1}`}</strong>
          </div>
          <div className="sn-online-vs-core">VS</div>
          <div className="sn-online-vs-side is-p2">
            <span>{`P${(onlineSlot || 1) === 1 ? 2 : 1} · RIVAL`}</span>
            <strong>{onlinePlayers.find((p) => p.slot === ((onlineSlot || 1) === 1 ? 2 : 1))?.name || `P${(onlineSlot || 1) === 1 ? 2 : 1}`}</strong>
          </div>
        </div>
      )}

      {onlineGameplayActive && onlinePauseRequestedBy && gameState === "playing" && (
        <div className={`sn-online-pause-toast ${onlinePausePanelOpen ? "is-open" : ""}`}>
          <div className="sn-online-pause-toast-head">
            <strong>P{onlinePauseRequestedBy} pediu pause</strong>
            <span>{onlinePauseReadySlots.length}/{onlinePlayers.length || 1}</span>
          </div>
          <p>Pedido em fila. Confirme pause para sincronizar todos.</p>
          <div className="sn-online-pause-mini-slots">
            {[1, 2, 3, 4].filter((slot) => onlinePlayers.some((p) => p.slot === slot)).map((slot) => (
              <b key={slot} className={onlinePauseReadySlots.includes(slot) ? "is-ready" : ""}>P{slot}</b>
            ))}
          </div>
        </div>
      )}

      {isLowHp && gameState === "playing" && (
        <div className="game-low-hp-vignette" />
      )}

      {(gameState === "playing" || gameState === "paused") && !isLocalPvpMode(waveUi.mode ?? currentModeRef.current) && (
        <aside className="sn-player-hud" aria-label="Status do jogador">
          {isLocalMode() && (
            <div className="sn-player-hud-label sn-player-hud-label-p1">
              <strong>P1</strong>
              <span>{isLocalPvpMode(waveUi.mode ?? currentModeRef.current) ? `${playerHp}/100 HP` : playerHp > 0 ? "ATIVO" : "FANTASMA"}</span>
            </div>
          )}
          {isLocalPvpMode(waveUi.mode ?? currentModeRef.current) && (
            <div className="sn-pvp-hp-meter" aria-label="HP do player 1">
              <span style={{ width: `${clamp(playerHp / 100, 0, 1) * 100}%` }} />
            </div>
          )}
          <div className="sn-life-panel">
            <div className="sn-life-hearts">
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
                    className={heartIsFull ? "is-full" : "is-empty"}
                    src={assetUrl(heartSrc)}
                    alt={heartIsFull ? "vida" : "vida perdida"}
                    draggable={false}
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
                  className="is-golden"
                  src={assetUrl(CONFIG.uiImages.heartGolden)}
                  alt="vida dourada"
                  draggable={false}
                />
              ))}
            </div>
          </div>

          <div className="sn-hud-resource-row-v250" aria-label="Recursos do jogador">
            <div className={`sn-hud-resource-chip-v250 is-token ${tokensVisibleUntil > performance.now() ? "is-visible" : ""} ${tokenUiPulseUntilRef.current > performance.now() ? "is-pulsing" : ""}`}>
              <span className="sn-token-icon-v20" aria-hidden="true" />
              <strong>{localProfile.tokens}</strong>
              <small>TOKENS</small>
            </div>
            {petEquipadoAtual() && (
              <button type="button" className={`sn-hud-resource-chip-v250 is-pet ${petAbilityCooldownUi > 0 ? "is-cooling" : "is-ready"}`} onClick={ativarHabilidadePetManual} aria-label="Habilidade do pet">
                <img src={assetUrl(petEquipadoAtual()?.asset || CONFIG.uiImages.mobilePet)} alt="" draggable={false} />
                <strong>{petAbilityCooldownUi > 0 ? `${petAbilityCooldownUi}s` : "C"}</strong>
                <small>PET</small>
              </button>
            )}
          </div>

          <div className="sn-ability-stack">
            {[
              {
                id: "dodge",
                label: "DODGE",
                ratio: dodgeReadyRatio,
                color: "#f4f1de",
              },
              {
                id: "strong",
                label: "FORTE",
                ratio: strongReadyRatio,
                color: "#ffbf3f",
              },
              {
                id: "boost",
                label: "BOOST",
                ratio: boostCharge / CONFIG.gameplay.boost.maxCharge,
                color: "#42b9ff",
              },
            ].map((ability) => {
              const ratio = clamp(ability.ratio, 0, 1);
              const ready = ratio >= 0.999;
              return (
                <div
                  className={`sn-ability ${ability.id} ${ready ? "is-ready" : ""}`}
                  key={ability.id}
                >
                  <span className="sn-ability-label">{ability.label}</span>
                  <span className="sn-ability-track">
                    <span
                      style={{
                        width: `${ratio * 100}%`,
                        background: ability.color,
                      }}
                    />
                  </span>
                  <strong>
                    {ready ? "PRONTO" : `${Math.ceil(ratio * 100)}%`}
                  </strong>
                </div>
              );
            })}
          </div>

          {activePowerUpsUi.length > 0 && (
            <div className="sn-powerup-row" aria-label="Power-ups ativos">
              {activePowerUpsUi.map((power) => (
                <div
                  className="sn-powerup-slot"
                  data-kind={power.kind}
                  key={power.kind}
                  title={power.label}
                >
                  <img src={power.icon} alt={power.label} draggable={false} />
                  {power.remainingMs !== undefined && (
                    <span>{Math.ceil(power.remainingMs / 1000)}s</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      {isLocalMode() && !isLocalPvpMode(waveUi.mode ?? currentModeRef.current) && (gameState === "playing" || gameState === "paused") && (
        <aside
          className={`sn-player-hud sn-player-hud-p2 ${player2Hp <= 0 ? "is-ghost" : ""}`}
          aria-label="Status do player 2"
        >
          <div className="sn-player-hud-label">
            <strong>P2</strong>
            <span>{isLocalPvpMode(waveUi.mode ?? currentModeRef.current) ? `${player2Hp}/100 HP` : player2Hp > 0 ? "ATIVO" : "FANTASMA"}</span>
          </div>
          {isLocalPvpMode(waveUi.mode ?? currentModeRef.current) && (
            <div className="sn-pvp-hp-meter is-p2" aria-label="HP do player 2">
              <span style={{ width: `${clamp(player2Hp / 100, 0, 1) * 100}%` }} />
            </div>
          )}
          <div className="sn-life-panel">
            <div className="sn-life-hearts">
              {Array.from({ length: CONFIG.gameplay.player.maxHp }).map((_, index) => {
                const heartIsFull = index < player2Hp;
                const heartSrc = heartIsFull
                  ? CONFIG.uiImages.lifeFull
                  : CONFIG.uiImages.lifeEmpty;
                const heartFallback = heartIsFull
                  ? CONFIG.uiImages.lifeFullFallback
                  : CONFIG.uiImages.lifeEmptyFallback;
                return (
                  <img
                    key={`p2-normal-${index}-${heartIsFull ? "full" : "empty"}`}
                    className={heartIsFull ? "is-full" : "is-empty"}
                    src={assetUrl(heartSrc)}
                    alt={heartIsFull ? "vida do player 2" : "vida perdida do player 2"}
                    draggable={false}
                    onError={(event) => {
                      const img = event.currentTarget;
                      if (img.dataset.fallbackApplied === "true") return;
                      img.dataset.fallbackApplied = "true";
                      img.src = assetUrl(heartFallback);
                    }}
                  />
                );
              })}
              {Array.from({ length: player2GoldenHp }).map((_, index) => (
                <img
                  key={`p2-golden-${index}`}
                  className="is-golden"
                  src={assetUrl(CONFIG.uiImages.heartGolden)}
                  alt="vida dourada do player 2"
                  draggable={false}
                />
              ))}
            </div>
          </div>

          <div className="sn-ability-stack">
            {[
              { id: "dodge", label: "DODGE", ratio: player2DodgeReadyRatio, color: "#f4f1de" },
              { id: "strong", label: "FORTE", ratio: player2StrongReadyRatio, color: "#ffbf3f" },
              { id: "boost", label: "BOOST", ratio: player2BoostReadyRatio, color: "#42b9ff" },
            ].map((ability) => {
              const ratio = clamp(ability.ratio, 0, 1);
              const ready = ratio >= 0.999;
              return (
                <div
                  className={`sn-ability ${ability.id} ${ready ? "is-ready" : ""}`}
                  key={`p2-${ability.id}`}
                >
                  <span className="sn-ability-label">{ability.label}</span>
                  <span className="sn-ability-track">
                    <span
                      style={{
                        width: `${ratio * 100}%`,
                        background: ability.color,
                      }}
                    />
                  </span>
                  <strong>{ready ? "PRONTO" : `${Math.ceil(ratio * 100)}%`}</strong>
                </div>
              );
            })}
          </div>

          {player2ActivePowerUpsUi.length > 0 && (
            <div className="sn-powerup-row sn-powerup-row-p2" aria-label="Power-ups ativos do player 2">
              {player2ActivePowerUpsUi.map((power) => (
                <div className="sn-powerup-slot" data-kind={power.kind} key={`p2-${power.kind}`} title={power.label}>
                  <img src={power.icon} alt={power.label} draggable={false} />
                  {power.remainingMs !== undefined && <span>{Math.ceil(power.remainingMs / 1000)}s</span>}
                </div>
              ))}
            </div>
          )}
        </aside>
      )}

      {localModeNotice && (gameState === "playing" || gameState === "paused") && (
        <div className="sn-local-notice">{localModeNotice}</div>
      )}

      {(gameState === "playing" || gameState === "paused") &&
        (waveUi.mode === "infinite" || (isLocalMode(waveUi.mode) && !isLocalPvpMode(waveUi.mode ?? currentModeRef.current))) && (
          <div className={`sn-run-info ${isLocalMode(waveUi.mode) ? "is-local" : ""}`}>
            <span>{isLocalPvpMode(waveUi.mode ?? currentModeRef.current) ? "ARENA" : `WAVE ${waveUi.wave || 1}`}</span>
            {isLocalMode(waveUi.mode) ? (
              <strong>
                {isLocalPvpMode(waveUi.mode ?? currentModeRef.current) ? `R${localPvpRound} · ` : ""}
                P1 {localP1Score.toString().padStart(4, "0")} · P2 {localP2Score.toString().padStart(4, "0")}
              </strong>
            ) : (
              <strong>{score.toString().padStart(6, "0")}</strong>
            )}
          </div>
        )}

      {(gameState === "playing" || gameState === "paused") && onlineGameplayActive && onlineHostSlot === 0 && isLocalPvpMode(waveUi.mode ?? currentModeRef.current) && (
        <div className="sn-online-score-list-v232" aria-label="Pontuação online">
          {[...onlinePlayers].sort((a, b) => a.slot - b.slot).map((player) => {
            const active = onlineActiveSlots.length === 0 || onlineActiveSlots.includes(player.slot);
            const waiting = onlineWaitingSlots.includes(player.slot);
            return (
              <div key={`score-${player.slot}`} className={`${active ? "is-active" : ""} ${waiting ? "is-waiting" : ""}`}>
                <span style={{ "--profile-color": onlineProfileColorBySlotRef.current[player.slot as PlayerSlot] || LOCAL_PLAYER_COLORS[(player.slot - 1) % LOCAL_PLAYER_COLORS.length] } as CSSProperties}>{(player.name || `P${player.slot}`).slice(0, 1).toUpperCase()}</span>
                <strong>P{player.slot}</strong>
                <b>{onlineScoresBySlot[player.slot] || 0}</b>
                {waiting && <em>PRÓX. ROUND</em>}
              </div>
            );
          })}
        </div>
      )}

      {(gameState === "playing" || gameState === "paused") &&
        isLocalPvpMode(waveUi.mode ?? currentModeRef.current) && !(onlineGameplayActive && onlineHostSlot === 0) && (
          <div className="sn-pvp-scoreboard sn-pvp-scoreboard-v7" aria-label="Placar e vida do VERSUS">
            <div className="sn-pvp-fighter is-p1">
              <header><strong>{labelPvpVisual(1)}</strong><span>{hpPvpVisual(1)}/100</span></header>
              <div className="sn-pvp-life-track"><i style={{ width: `${clamp(hpPvpVisual(1) / 100, 0, 1) * 100}%` }} /></div>
              <div className="sn-pvp-ability-mini">
                <b>DODGE <i style={{ width: `${clamp(dodgeReadyRatio, 0, 1) * 100}%` }} /></b>
                <b>FORTE <i style={{ width: `${clamp(strongReadyRatio, 0, 1) * 100}%` }} /></b>
                <b>BOOST <i style={{ width: `${clamp(boostCharge / CONFIG.gameplay.boost.maxCharge, 0, 1) * 100}%` }} /></b>
              </div>
            </div>
            <div className="sn-pvp-round-core">
              <small>ROUND {localPvpRound}</small>
              <b>{localP1Score} × {localP2Score}</b>
              <span>melhor de 5</span>
              <div className="sn-pvp-power-row">
                <em className="is-p1tag">P1</em>
                {activePowerUpsUi.length ? activePowerUpsUi.slice(0, 3).map((power) => (
                  <em key={power.kind}><img src={power.icon} alt="" />{power.remainingMs ? `${Math.ceil(power.remainingMs / 1000)}s` : power.label}</em>
                )) : <em>sem power</em>}
                <em className="is-p2tag">P2</em>
                {player2ActivePowerUpsUi.length ? player2ActivePowerUpsUi.slice(0, 3).map((power) => (
                  <em key={`p2-${power.kind}`}><img src={power.icon} alt="" />{power.remainingMs ? `${Math.ceil(power.remainingMs / 1000)}s` : power.label}</em>
                )) : <em>sem power</em>}
              </div>
            </div>
            <div className="sn-pvp-fighter is-p2">
              <header><strong>{labelPvpVisual(2)}</strong><span>{hpPvpVisual(2)}/100</span></header>
              <div className="sn-pvp-life-track"><i style={{ width: `${clamp(hpPvpVisual(2) / 100, 0, 1) * 100}%` }} /></div>
              <div className="sn-pvp-ability-mini">
                <b>DODGE <i style={{ width: `${clamp(player2DodgeReadyRatio, 0, 1) * 100}%` }} /></b>
                <b>FORTE <i style={{ width: `${clamp(player2StrongReadyRatio, 0, 1) * 100}%` }} /></b>
                <b>BOOST <i style={{ width: `${clamp(player2BoostReadyRatio, 0, 1) * 100}%` }} /></b>
              </div>
            </div>
          </div>
        )}

      {waveUi.message &&
        (gameState === "playing" || gameState === "paused") &&
        !waveUi.bossWave && (
          <div className="game-wave-banner">{waveUi.message}</div>
        )}

      {Boolean(settingsSnapshot.showFps) &&
        (gameState === "playing" ||
          gameState === "tutorial" ||
          gameState === "paused") && (
          <div className={`sn-fps-counter ${fpsUi < 40 ? "is-low" : ""}`}>
            {fpsUi} FPS
          </div>
        )}

      {onlineSyncWarning && (gameState === "playing" || gameState === "paused") && (
        <div className="sn-online-sync-warning">{onlineSyncWarning}</div>
      )}
      {debugNotice && <div className="sn-debug-notice">{debugNotice}</div>}

      {bossTipVisible &&
        (gameState === "playing" || gameState === "paused") &&
        waveUi.bossWave && (
          <aside className="sn-boss-tip">
            <header>
              <div>
                <strong>CHOCADO</strong>
                <span>LEITURA TÁTICA</span>
              </div>
              <em>10s</em>
            </header>
            <div className="sn-boss-tip-icons" aria-hidden="true">
              <span>✦</span>
              <span>◎</span>
              <span>▥</span>
              <span>⌁</span>
              <span>⊙</span>
            </div>
            <p>
              <b>ORBITAIS:</b> mantenha distância média e atravesse os espaços.
            </p>
            <p>
              <b>LASERS:</b> siga o aviso luminoso e mude de faixa.
            </p>
            <p>
              <b>SERVOS:</b> destrua ou use Dodge no último instante.
            </p>
            <p>
              <b>FASE 2:</b> abaixo de 250 HP, ele entra na segunda fase.
            </p>
          </aside>
        )}

      {bossDanielLine.visible &&
        (gameState === "playing" || gameState === "paused") && (
          <div className="game-daniel-dialog game-daniel-boss-dialog sn-dialog">
            <img
              className="game-daniel-icon"
              src={assetUrl(
                getDanielIcon(bossDanielLine.expression, danielMouthOpen),
              )}
              alt="Daniel"
              draggable={false}
            />
            <div className="game-daniel-text">
              <strong>DANIEL</strong>
              <p>{bossDanielLine.text}</p>
            </div>
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
            <button
              type="button"
              className="sn-main-profile-card-v211"
              style={{ "--profile-color": localProfile.color } as CSSProperties}
              onClick={() => setProfileManagerOpen(true)}
              aria-label="Abrir perfil local"
            >
              <span>{inicialPerfil(localProfile)}</span>
              <div>
                <strong>{nomePerfilVisivel(localProfile)}</strong>
                <small><i className="sn-token-icon-v20" aria-hidden="true" /> X{localProfile.tokens} · {localProfile.friends.length} amigos</small>
              </div>
            </button>
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

                      if (option.action === "multiplayer") {
                        abrirMultiplayer();
                        return;
                      }

                      if (option.action === "extras") {
                        abrirExtras();
                        return;
                      }

                      if (option.action === "shop") {
                        tocarSom(CONFIG.sounds.menuConfirm, 0.32, "menu");
                        setShopTab("front");
                        setShopMode("store");
                        setShopManagerOpen(true);
                        return;
                      }

                      if (option.action === "profile") {
                        tocarSom(CONFIG.sounds.menuConfirm, 0.32, "menu");
                        setProfileManagerOpen(true);
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

            <a
              href="/"
              className="game-return-site-button"
              onClick={() => tocarSom(CONFIG.sounds.menuConfirm, 0.32, "menu")}
            >
              VOLTAR AO XÔ, FALSIANE!
            </a>
            <p className="game-menu-help">ESC/Q: voltar</p>
          </aside>

          <button
            type="button"
            className="sn-profile-orb-v20"
            style={{ "--profile-color": localProfile.color } as CSSProperties}
            onClick={() => setProfileManagerOpen(true)}
            aria-label="Abrir perfil local"
          >
            <span>{inicialPerfil(localProfile)}</span>
          </button>

          <div className="game-menu-logo">
            <strong>SPACE NEWS</strong>
          </div>
        </section>
      )}

      {gameState === "multiplayerMenu" && (
        <section className="game-screen sn-multiplayer-screen">
          <aside className="sn-local-panel">
            <p className="game-panel-label">MULTIPLAYER</p>
            <h2>ESCOLHA A CONEXÃO</h2>
            <div className="sn-multiplayer-options">
              {MULTIPLAYER_BRANCH_OPTIONS.map((option, index) => {
                const selected = multiplayerBranchIndex === index;
                return (
                  <button
                    key={option.label}
                    type="button"
                    className={`sn-multiplayer-option ${selected ? "is-selected" : ""} ${option.disabled ? "is-disabled" : ""}`}
                    onMouseEnter={() => setIndiceMultiplayerBranch(index)}
                    onFocus={() => setIndiceMultiplayerBranch(index)}
                    onClick={() => {
                      if (option.disabled) {
                        tocarSom(CONFIG.sounds.menuBack, 0.35, "menu");
                        setLocalModeNotice("Online bloqueado nesta build.");
                        window.setTimeout(() => setLocalModeNotice(""), 2000);
                        return;
                      }
                      if (index === 0) abrirLobbyLocal();
                      else abrirLobbyOnline();
                    }}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </button>
                );
              })}
            </div>
            {localModeNotice && <p className="sn-local-help">{localModeNotice}</p>}
            <button type="button" className="sn-local-back" onClick={voltarDoMultiplayer}>VOLTAR</button>
            <p className="game-menu-help">ENTER/A: confirmar · ESC/B: voltar</p>
          </aside>
        </section>
      )}

      {gameState === "localLobby" && (
        <section className="game-screen sn-local-lobby-screen">
          <aside className="sn-local-panel is-lobby">
            <p className="game-panel-label">MULTIPLAYER LOCAL</p>
            <h2>ARCADE LINK</h2>
            <p className="sn-local-subtitle">
              Selecione dispositivos, confirme jogadores e vote no modo. Local e online agora seguem a mesma vibe party/arcade.
            </p>
            <div className="sn-local-join-banner">
              <strong>APERTE INPUT PARA ENTRAR</strong>
              <span>U/I/J/K/L/O/P/H para P2 · controles extras entram como P3/P4 · TAB/START para escolher modo</span>
            </div>
            <div className="sn-local-slots">
              {localPlayerSlots.map((slot, index) => {
                const selected = localLobbyIndex === index;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    className={`sn-local-slot ${selected ? "is-selected" : ""} ${slot.ready ? "is-ready" : ""}`}
                    style={{ "--player-color": slot.color } as CSSProperties}
                    onMouseEnter={() => setIndiceLobbyLocal(index)}
                    onFocus={() => setIndiceLobbyLocal(index)}
                    onClick={() => {
                      if (index === 0) return;
                      setIndiceLobbyLocal(index);
                      setLocalModeNotice("Use o teclado/controle do jogador para confirmar. Mouse não registra player.");
                      window.setTimeout(() => setLocalModeNotice(""), 1700);
                    }}
                  >
                    <span className="sn-slot-badge">P{slot.id}</span>
                    <span className="sn-slot-name">{slot.name}</span>
                    <strong>{slot.ready ? "READY" : index === 0 ? "FIXO" : "JOIN"}</strong>
                    <small>{slot.input}</small>
                  </button>
                );
              })}
            </div>
            <div className="sn-local-lobby-actions">
              <button
                type="button"
                className={totalJogadoresLocaisProntos() < 2 ? "is-disabled" : ""}
                onClick={abrirSelecaoModoLocal}
              >
                COMEÇAR COM {totalJogadoresLocaisProntos()}P
              </button>
              <button type="button" onClick={() => setEstado("multiplayerMenu")}>VOLTAR</button>
            </div>
            {localModeNotice && <p className="sn-local-help">{localModeNotice}</p>}
            <p className="game-menu-help">O modo só libera com 2+ players. Online será a próxima fase.</p>
          </aside>
        </section>
      )}

      {gameState === "localModeSelect" && (
        <section className="game-screen sn-local-mode-screen">
          <aside className="sn-local-panel">
            <p className="game-panel-label">LOCAL READY</p>
            <h2 className="sn-wobble-title">VOTAÇÃO DE MODO</h2>
            <p className="sn-local-subtitle">Escolha o modo como se fosse uma votação arcade. ENTER/A inicia o card selecionado.</p>
            <div className="sn-mode-vote-grid-v3 is-local-vote">
              {LOCAL_MODE_OPTIONS.map((option, index) => {
                const selected = localModeIndex === index;
                return (
                  <button
                    key={option.label}
                    type="button"
                    className={`sn-mode-vote-card-v3 sn-squish-ui ${selected ? "is-selected" : ""}`}
                    style={{ "--vote-color": LOCAL_PLAYER_COLORS[index] } as CSSProperties}
                    onMouseEnter={() => setIndiceModoLocal(index)}
                    onFocus={() => setIndiceModoLocal(index)}
                    onClick={() => iniciarJogo(option.mode)}
                  >
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                    <span className="sn-vote-dots-v3">
                      {localPlayerSlots.filter((slot) => slot.ready).map((slot) => (
                        <b key={slot.id} style={{ backgroundColor: slot.color }}>P{slot.id}</b>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
            <button type="button" className="sn-local-back sn-squish-ui" onClick={() => setEstado("localLobby")}>VOLTAR AO LOBBY</button>
            <p className="game-menu-help">Players prontos: {totalJogadoresLocaisProntos()} · o modo selecionado vira a arena inicial.</p>
          </aside>
        </section>
      )}

      {gameState === "onlineLobby" && (
        <section className="game-screen sn-online-lobby-screen sn-online-lobby-screen-v15">
          <aside className={`sn-online-party-shell-v15 sn-online-party-shell-v16 is-${onlineConnected ? "room" : "connect"} is-stage-${onlineLobbyStage} is-${onlineFlow} is-${onlineFeedback}`}>
            <button
              type="button"
              className="sn-online-close-v15 sn-squish-ui"
              onClick={fecharLobbyOnline}
              aria-label="Fechar multiplayer online"
              title="Voltar"
            >
              ×
            </button>

            <header className="sn-online-party-header-v15">
              <div className="sn-online-title-stack-v15">
                <span>PARTY ONLINE</span>
                <h2 className="sn-online-link-title-v16">SPACE LINK</h2>
                <p>
                  Conecte, confirme READY e só então vote no modo. Sem bagunçar a tela do mobile.
                </p>
              </div>
              <div className={`sn-online-signal-v15 ${onlineConnected ? "is-on" : "is-off"}`}>
                <i />
                <strong>{onlineConnected ? "LINK ATIVO" : "SEM LINK"}</strong>
                <small>{onlinePing === null ? "PING --" : `${onlinePing}ms`}</small>
              </div>
            </header>

            <div className="sn-online-progress-v15" aria-hidden="true">
              {[
                ["1", "LINK", onlineLobbyStage === "connect"],
                ["2", "SALA", onlineLobbyStage === "crew" && onlinePlayers.length < 2],
                ["3", "READY", onlineLobbyStage === "crew" && onlinePlayers.length >= 2],
                ["4", "VOTAÇÃO", onlineLobbyStage === "vote"],
              ].map(([step, label, lit]) => (
                <span key={String(step)} className={lit ? "is-lit" : ""}>
                  <b>{step}</b>
                  <em>{label}</em>
                </span>
              ))}
            </div>

            <div className={`sn-online-toast-v15 is-${onlineFeedback}`} aria-live="polite">
              <span />
              <div>
                <strong>{onlineFeedback === "loading" ? "Processando" : onlineFeedback === "success" ? "Tudo certo" : onlineFeedback === "error" ? "Atenção" : onlineConnected ? `Sala ${onlineRoomCode}` : "Pronto para conectar"}</strong>
                <p>{onlineStatus}</p>
              </div>
            </div>

            {!onlineConnected ? (
              <div className="sn-online-connect-layout-v15">
                <section className="sn-online-connect-card-v15 is-main">
                  <div className="sn-online-choice-row-v15" role="tablist" aria-label="Criar ou entrar em sala">
                    <button
                      type="button"
                      className={`sn-online-choice-pill-v15 sn-squish-ui ${onlineFlow === "create" ? "is-active" : ""} ${onlineMenuIndex === 0 ? "is-gamepad-selected" : ""}`}
                      onMouseEnter={() => setIndiceOnlineMenu(0)}
                      onFocus={() => setIndiceOnlineMenu(0)}
                      onClick={() => { setFluxoOnline("create"); feedbackOnline("idle", "Vou criar uma sala nova para mandar o código."); }}
                    >
                      <span>HOST</span>
                      <strong>Vou criar</strong>
                    </button>
                    <button
                      type="button"
                      className={`sn-online-choice-pill-v15 sn-squish-ui ${onlineFlow === "join" ? "is-active" : ""} ${onlineMenuIndex === 1 ? "is-gamepad-selected" : ""}`}
                      onMouseEnter={() => setIndiceOnlineMenu(1)}
                      onFocus={() => setIndiceOnlineMenu(1)}
                      onClick={() => { setFluxoOnline("join"); feedbackOnline("idle", "Digite o código da sala do seu amigo."); }}
                    >
                      <span>GUEST</span>
                      <strong>Vou entrar</strong>
                    </button>
                  </div>

                  <div className="sn-online-preflight-v15">
                    <label className="sn-online-field-v15">
                      <span>Seu nome</span>
                      <input
                        value={onlinePlayerName}
                        maxLength={16}
                        onChange={(event) => atualizarNomePerfilLocal(event.target.value.toUpperCase().slice(0, 16))}
                        placeholder="PLAYER"
                      />
                    </label>

                    <div className="sn-online-device-card-v15">
                      <span>Dispositivo</span>
                      <div>
                        <button type="button" onClick={() => setDispositivoOnline(onlineDeviceIndex - 1)} aria-label="Dispositivo anterior">‹</button>
                        <strong>{dispositivoOnlineAtual().icon} {dispositivoOnlineAtual().label}</strong>
                        <button type="button" onClick={() => setDispositivoOnline(onlineDeviceIndex + 1)} aria-label="Próximo dispositivo">›</button>
                      </div>
                      <small>{dispositivoOnlineAtual().description}</small>
                    </div>
                  </div>

                  <div className="sn-online-action-stage-v15">
                    {onlineFlow === "choose" && (
                      <div className="sn-online-empty-action-v15">
                        <b>Escolha uma rota acima</b>
                        <span>Criar mostra o código automaticamente. Entrar libera o campo do código.</span>
                      </div>
                    )}

                    {onlineFlow === "create" && (
                      <div className="sn-online-create-box-v15">
                        <div>
                          <span>Código será gerado</span>
                          <strong>{onlineRoomCode || "------"}</strong>
                        </div>
                        <button
                          type="button"
                          className={`sn-online-primary-v15 sn-squish-ui ${onlineMenuIndex === 3 ? "is-gamepad-selected" : ""}`}
                          onMouseEnter={() => setIndiceOnlineMenu(3)}
                          onFocus={() => setIndiceOnlineMenu(3)}
                          onClick={criarSalaOnline}
                          disabled={onlineCheckingRoom}
                        >
                          {onlineCheckingRoom ? "CRIANDO..." : "CRIAR SALA"}
                        </button>
                      </div>
                    )}

                    {onlineFlow === "join" && (
                      <div className="sn-online-join-box-v15">
                        <label className="sn-online-field-v15 is-code">
                          <span>Código da sala</span>
                          <input
                            value={onlineJoinCode}
                            maxLength={12}
                            onChange={(event) => setOnlineJoinCode(limparCodigoSalaOnline(event.target.value))}
                            placeholder="ABC123"
                            inputMode="text"
                          />
                        </label>
                        <button
                          type="button"
                          className={`sn-online-primary-v15 sn-squish-ui ${onlineMenuIndex === 3 ? "is-gamepad-selected" : ""}`}
                          onMouseEnter={() => setIndiceOnlineMenu(3)}
                          onFocus={() => setIndiceOnlineMenu(3)}
                          onClick={() => void entrarSalaOnline()}
                          disabled={onlineCheckingRoom}
                        >
                          {onlineCheckingRoom ? "PROCURANDO..." : "ENTRAR"}
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                <section className="sn-online-connect-card-v15 is-side">
                  <strong>Como funciona</strong>
                  <p>Modo v2: inputs por tick no Worker e correção leve. O snapshot agora serve mais como segurança do que como “puxão” visual.</p>
                  <ul>
                    <li>Sem mouse para confirmar player</li>
                    <li>Touch aparece uma vez</li>
                    <li>Gamepad navega a UI</li>
                  </ul>
                  <div className="sn-local-profile-card-v19">
                    <span>PERFIL LOCAL</span>
                    <strong>{nomePerfilVisivel(localProfile)}</strong>
                    <small>{localProfile.tokens} tokens · {localProfile.friends.length} amigos · {localProfile.friendRequests.length} pedidos</small>
                  </div>
                </section>
              </div>
            ) : (
              <div className={`sn-online-room-layout-v15 sn-online-room-layout-v16 is-${onlineLobbyStage}`}>
                <section className="sn-online-room-code-v15 sn-online-room-code-v16">
                  <span>CÓDIGO DA SALA</span>
                  <strong>{onlineRoomCode}</strong>
                  <small>{onlineReadyForMode ? "Tripulação pronta: votação liberada." : "Compartilhe o código e confirme READY."}</small>
                  <div>
                    <button
                      type="button"
                      className="sn-squish-ui"
                      onMouseEnter={() => setIndiceOnlineMenu(4)}
                      onFocus={() => setIndiceOnlineMenu(4)}
                      onClick={copiarCodigoSalaOnline}
                    >
                      COPIAR
                    </button>
                    <button
                      type="button"
                      className="sn-squish-ui"
                      onClick={abrirConvitesAmigosOnline}
                    >
                      CONVIDAR
                    </button>
                    <button
                      type="button"
                      className="sn-squish-ui"
                      onClick={salvarAmigosDaSalaOnline}
                    >
                      + AMIGOS
                    </button>
                    <button
                      type="button"
                      className="sn-squish-ui sn-online-danger-v15"
                      onMouseEnter={() => setIndiceOnlineMenu(5)}
                      onFocus={() => setIndiceOnlineMenu(5)}
                      onClick={sairSalaOnline}
                    >
                      SAIR
                    </button>
                  </div>
                </section>

                <section className="sn-online-crew-v15 sn-online-crew-v16">
                  <header>
                    <strong>TRIPULAÇÃO</strong>
                    <span>{onlineReadyCount}/{onlinePlayers.length || 1} READY · {onlinePlayers.length}/4 online</span>
                  </header>
                  <div className="sn-online-crew-grid-v15 sn-online-crew-grid-v16">
                    {[1, 2, 3, 4].map((slot) => {
                      const player = onlinePlayers.find((item) => item.slot === slot);
                      return (
                        <article
                          key={slot}
                          className={`sn-online-crew-member-v15 sn-online-crew-member-v16 ${player ? "is-online" : ""} ${player?.ready ? "is-ready" : ""} ${onlineSlot === slot ? "is-you" : ""} ${onlineHostSlot === slot ? "is-host" : ""}`}
                          style={{ "--player-color": player?.profileColor || player?.profileSummary?.color || LOCAL_PLAYER_COLORS[slot - 1] } as CSSProperties}
                          role={player ? "button" : undefined}
                          tabIndex={player ? 0 : undefined}
                          title={player ? "Ver perfil do player" : "Slot vazio"}
                          onClick={() => { if (player) setSelectedOnlineProfileSlot(slot); }}
                          onKeyDown={(event) => { if (player && (event.key === "Enter" || event.key === " ")) setSelectedOnlineProfileSlot(slot); }}
                        >
                          <b>P{slot}</b>
                          <div>
                            <strong>{player?.name || "VAZIO"}</strong>
                            <span>{player ? (player.ready ? "READY" : "AGUARDANDO") : "LIVRE"}</span>
                          </div>
                          <small>{player ? `${player.device || "dispositivo"}${onlineHostSlot === slot ? " · HOST" : ""}${onlineSlot === slot ? " · VOCÊ" : ""}` : "aguardando conexão"}</small>
                          <i className="sn-online-ready-ring-v16" aria-hidden="true" />
                        </article>
                      );
                    })}
                  </div>
                </section>

                {!onlineReadyForMode ? (
                  <section className="sn-online-command-v15 sn-online-command-v16 is-crew-step">
                    <div className="sn-online-stage-copy-v16">
                      <strong>ETAPA 2 · CONFIRMAR PLAYERS</strong>
                      <p>
                        A votação só aparece quando todos da sala estiverem READY.
                        {onlinePlayers.length < 2
                          ? " Espere pelo menos mais um jogador."
                          : onlineMissingReadySlots.length
                            ? ` Falta: ${onlineMissingReadySlots.map((slot) => `P${slot}`).join(" · ")}.`
                            : " Tudo quase pronto."}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`sn-online-ready-v15 sn-online-ready-v16 sn-squish-ui ${onlineIsReady ? "is-ready" : ""} ${onlineMenuIndex === 0 ? "is-gamepad-selected" : ""}`}
                      onMouseEnter={() => setIndiceOnlineMenu(0)}
                      onFocus={() => setIndiceOnlineMenu(0)}
                      onClick={alternarReadyOnline}
                    >
                      {onlineIsReady ? "TIRAR READY" : "FICAR READY"}
                    </button>
                  </section>
                ) : (
                  <>
                    <section className="sn-online-vote-v15 sn-online-vote-v16">
                      <header>
                        <strong>ETAPA 3 · MODO LIBERADO</strong>
                        <span>selecionado: {labelModoMultiplayer(onlineSelectedMode)}</span>
                      </header>
                      <div className="sn-online-vote-grid-v15 sn-online-vote-grid-v16">
                        {LOCAL_MODE_OPTIONS.map((option, index) => {
                          const votes = Object.entries(onlineModeVotes).filter(([, mode]) => mode === option.mode);
                          const selected = onlineSelectedMode === option.mode;
                          const isTogether = option.mode === "localCoop";
                          return (
                            <button
                              key={option.mode}
                              type="button"
                              className={`sn-online-mode-card-v15 sn-online-mode-card-v16 sn-squish-ui ${isTogether ? "is-together" : "is-versus"} ${selected ? "is-selected" : ""} ${onlineMenuIndex === index + 2 ? "is-gamepad-selected" : ""}`}
                              style={{ "--vote-color": isTogether ? "#22c55e" : "#f97316" } as CSSProperties}
                              onMouseEnter={() => setIndiceOnlineMenu(index + 2)}
                              onFocus={() => setIndiceOnlineMenu(index + 2)}
                              onClick={() => votarModoOnline(option.mode)}
                            >
                              <span className="sn-online-mode-art-v16" aria-hidden="true">
                                <b>{isTogether ? "🤝" : "⚔"}</b>
                              </span>
                              <strong>{option.label}</strong>
                              <small>{isTogether ? "Sobrevivência cooperativa, revive e waves." : "Arena curta, power-ups no centro e rounds."}</small>
                              <em>{votes.length ? votes.map(([slot]) => `P${slot}`).join(" · ") : "aguardando votos"}</em>
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="sn-online-command-v15 sn-online-command-v16 is-vote-step">
                      <button
                        type="button"
                        className={`sn-online-ready-v15 sn-online-ready-v16 sn-squish-ui ${onlineIsReady ? "is-ready" : ""} ${onlineMenuIndex === 0 ? "is-gamepad-selected" : ""}`}
                        onMouseEnter={() => setIndiceOnlineMenu(0)}
                        onFocus={() => setIndiceOnlineMenu(0)}
                        onClick={alternarReadyOnline}
                      >
                        {onlineIsReady ? "TIRAR READY" : "READY OK"}
                      </button>
                      <button
                        type="button"
                        className={`sn-online-start-v15 sn-online-start-v16 sn-squish-ui ${onlineCanStart ? "is-ready" : "is-disabled"} ${onlineMenuIndex === 1 ? "is-gamepad-selected" : ""}`}
                        onMouseEnter={() => setIndiceOnlineMenu(1)}
                        onFocus={() => setIndiceOnlineMenu(1)}
                        onClick={iniciarPartidaOnline}
                        disabled={!onlineCanStart}
                      >
                        INICIAR TOGETHER
                      </button>
                    </section>
                  </>
                )}
              </div>
            )}

            <footer className="sn-online-footer-v15">
              <span>Gamepad: D-Pad/analógico navega · A confirma · B volta</span>
              <strong>{onlineConnected ? `Host atual: P${onlineHostSlot}` : "Crie ou entre sem bagunçar a tela"}</strong>
            </footer>
          </aside>
        </section>
      )}

      {gameState === "extras" && (
        <section className="game-screen sn-extras-screen">
          <aside className="sn-extras-panel">
            <header className="sn-extras-header">
              <div>
                <span>ARQUIVO SPACE NEWS</span>
                <h2>EXTRA</h2>
              </div>
              <button
                type="button"
                onClick={voltarDosExtras}
                aria-label="Fechar extras"
              >
                X
              </button>
            </header>

            <nav className="sn-extras-tabs">
              {[
                ["home", "CENTRAL"],
                ["credits", "CRÉDITOS"],
                ["wiki", "ARQUIVOS"],
                ["records", "RANKING"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={extrasSection === id ? "is-active" : ""}
                  onClick={() => setExtrasSection(id as ExtraSection)}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="sn-extras-content">
              {extrasSection === "home" && (
                <div className="sn-extra-home">
                  <div className="sn-extra-feature">
                    <small>TRANSMISSÃO RECUPERADA</small>
                    <h3>BASTIDORES DA MISSÃO</h3>
                    <p>
                      Conheça a equipe, consulte os arquivos dos personagens e
                      veja os melhores resultados do modo Infinito.
                    </p>
                  </div>
                  <div className="sn-extra-shortcuts">
                    <button onClick={() => setExtrasSection("credits")}>
                      <b>EQUIPE</b>
                      <span>
                        Quem construiu o Xô, falsiane! e o Space News.
                      </span>
                    </button>
                    <button onClick={() => setExtrasSection("wiki")}>
                      <b>ARQUIVOS</b>
                      <span>Personagens, nave e ameaça principal.</span>
                    </button>
                    <button onClick={() => setExtrasSection("records")}>
                      <b>RANKING</b>
                      <span>Ranking online do modo Infinito.</span>
                    </button>
                  </div>
                </div>
              )}

              {extrasSection === "credits" && (
                <div className="sn-credits-grid">
                  {EXTRA_CREATORS.map((creator) => (
                    <article key={creator.name}>
                      <span className="sn-credit-avatar">
                        <span>{creator.initials}</span>
                        <img
                          src={assetUrl(creator.image)}
                          alt={creator.name}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      </span>
                      <div>
                        <strong>{creator.name}</strong>
                        <p>{creator.role}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {extrasSection === "wiki" && (
                <div className="sn-wiki-layout">
                  <div className="sn-wiki-grid">
                    {EXTRA_WIKI.map((entry, index) => (
                      <button
                        type="button"
                        key={entry.name}
                        className={
                          selectedWikiCharacter === index ? "is-active" : ""
                        }
                        onClick={() => setSelectedWikiCharacter(index)}
                      >
                        <small>{entry.tag}</small>
                        <h3>{entry.name}</h3>
                        <p>{entry.text}</p>
                      </button>
                    ))}
                  </div>
                  <article className="sn-wiki-preview">
                    <div className="sn-wiki-image-wrap">
                      <img
                        src={assetUrl(EXTRA_WIKI[selectedWikiCharacter].image)}
                        alt={EXTRA_WIKI[selectedWikiCharacter].name}
                        onError={(event) => {
                          event.currentTarget.style.opacity = "0";
                        }}
                      />
                    </div>
                    <div>
                      <small>{EXTRA_WIKI[selectedWikiCharacter].tag}</small>
                      <h3>{EXTRA_WIKI[selectedWikiCharacter].name}</h3>
                      <p>{EXTRA_WIKI[selectedWikiCharacter].text}</p>
                    </div>
                  </article>
                </div>
              )}

              {extrasSection === "records" && (
                <div className="sn-ranking-panel">
                  <header>
                    <span>TOP 10 · CONECTADO - ONLINE</span>
                    <small>
                      {leaderboardStatus === "online"
                        ? "Arcade global · 3 letras"
                        : leaderboardStatus === "loading"
                          ? "Conectando..."
                          : "Modo offline · dados locais"}
                    </small>
                  </header>
                  <div className="sn-ranking-columns">
                    <span>POS</span>
                    <span>PILOTO</span>
                    <span>PONTOS</span>
                    <span>WAVE</span>
                  </div>
                  {leaderboard.length === 0 ? (
                    <p className="sn-ranking-empty">
                      O ranking está vazio. Entre no modo Infinito e registre as
                      primeiras iniciais.
                    </p>
                  ) : (
                    <ol>
                      {leaderboard.map((entry, index) => (
                        <li className={`sn-rank-${index + 1}`} key={entry.id}>
                          <b>#{index + 1}</b>
                          <strong>{entry.name}</strong>
                          <span>{entry.score.toString().padStart(6, "0")}</span>
                          <em>W{entry.wave}</em>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </aside>
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

            <nav
              className="game-settings-tabs"
              aria-label="Categorias de configurações"
            >
              {SETTINGS_SECTIONS.map((section) => (
                <button
                  type="button"
                  key={section}
                  className={settingsSection === section ? "is-active" : ""}
                  onClick={() => selecionarSecaoConfiguracoes(section)}
                >
                  {section}
                </button>
              ))}
            </nav>

            {settingsSection === "CONTROLES" && (
              <div className="sn-gamepad-status" role="status">
                <span>🎮</span>
                <div>
                  <strong>{gamepadStatus}</strong>
                  <p>
                    Use o analógico ou D-Pad para navegar. Selecione uma ação de
                    controle para capturar o próximo botão pressionado.
                  </p>
                </div>
              </div>
            )}

            <div className="game-settings-list">
              {[settingsSection].map((section) => {
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
                          <div
                            key={option.key}
                            className={`game-setting-row ${selected ? "is-selected" : ""}`}
                            onMouseEnter={() => {
                              if (settingsIndex !== index) {
                                tocarSom(CONFIG.sounds.menuMove, 0.22, "menu");
                              }
                              setIndiceConfiguracao(index);
                            }}
                          >
                            <button
                              type="button"
                              className="game-setting-main-action"
                              onClick={() => {
                                setIndiceConfiguracao(index);
                                if (option.kind === "keybind")
                                  iniciarCapturaTecla(option.key, option.label);
                                else if (option.kind === "padbind")
                                  iniciarCapturaBotaoControle(
                                    option.key,
                                    option.label,
                                  );
                                else if (option.kind === "toggle")
                                  alterarConfiguracaoAtual(1);
                              }}
                            >
                              <span className="game-setting-label">
                                {option.label}
                              </span>
                              {(option.kind === "toggle" ||
                                option.kind === "keybind" ||
                                option.kind === "padbind") && (
                                <span className="game-setting-control">
                                  {option.kind === "toggle" ? (
                                    <strong
                                      className={`game-setting-toggle ${value ? "is-on" : "is-off"}`}
                                    >
                                      {value ? "✓ CORRETO" : "✕ ERRADO"}
                                    </strong>
                                  ) : (
                                    <strong className="sn-keybind-value">
                                      {formatarConfiguracao(option)}
                                    </strong>
                                  )}
                                </span>
                              )}
                            </button>

                            {(option.kind === "range" ||
                              option.kind === "select") && (
                              <div className="sn-setting-stepper">
                                <button
                                  type="button"
                                  aria-label={`Diminuir ${option.label}`}
                                  onClick={() => {
                                    setIndiceConfiguracao(index);
                                    alterarConfiguracaoAtual(-1);
                                  }}
                                >
                                  −
                                </button>
                                <div className="sn-setting-stepper-value">
                                  {option.kind === "range" && (
                                    <span className="game-setting-bar">
                                      <span
                                        style={{ width: `${ratio * 100}%` }}
                                      />
                                    </span>
                                  )}
                                  <strong>
                                    {formatarConfiguracao(option)}
                                  </strong>
                                </div>
                                <button
                                  type="button"
                                  aria-label={`Aumentar ${option.label}`}
                                  onClick={() => {
                                    setIndiceConfiguracao(index);
                                    alterarConfiguracaoAtual(1);
                                  }}
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {section === "MOBILE" && (
                      <button
                        type="button"
                        className="sn-mobile-editor-open"
                        onClick={() => setMobileEditorOpen(true)}
                      >
                        PERSONALIZAR POSIÇÃO E ESCALA
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      )}


      {inviteFriendsOpen && (
        <div className="sn-profile-backdrop-v20 sn-invite-backdrop-v211" role="dialog" aria-modal="true">
          <section className="sn-invite-panel-v211">
            <header>
              <div>
                <span>CONVIDAR AMIGOS</span>
                <h2>SALA {onlineRoomCode || "------"}</h2>
                <p>Escolha um amigo salvo. O link abre direto no lobby online e tenta entrar na sala automaticamente.</p>
              </div>
              <button type="button" onClick={() => setInviteFriendsOpen(false)} aria-label="Fechar convites">×</button>
            </header>
            <div className="sn-invite-list-v211">
              {localProfile.friends.length > 0 ? localProfile.friends.map((friend) => (
                <button type="button" key={friend.id} onClick={() => void convidarAmigoOnline(friend)}>
                  <span style={{ "--profile-color": localProfile.color } as CSSProperties}>{friend.name.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{friend.name}</strong>
                    <small>{friend.code || friend.id}</small>
                  </div>
                  <em>CONVIDAR</em>
                </button>
              )) : (
                <article className="sn-invite-empty-v211">
                  <strong>Nenhum amigo salvo ainda</strong>
                  <p>Adicione amigos pelo código no Perfil. Por enquanto você ainda pode copiar um convite geral.</p>
                </article>
              )}
            </div>
            <footer>
              <button type="button" onClick={() => void copiarConviteOnline()}>COPIAR CONVITE GERAL</button>
              <button type="button" onClick={() => { setInviteFriendsOpen(false); setProfileManagerOpen(true); }}>GERENCIAR AMIGOS</button>
            </footer>
          </section>
        </div>
      )}

      {shopManagerOpen && (
        <div className="sn-profile-backdrop-v20 sn-shop-backdrop-v250" role="dialog" aria-modal="true">
          <section className="sn-shop-manager-v250">
            <header className="sn-shop-header-v250">
              <div className="sn-shop-brand-v250">
                <span>SPACE NEWS ARMORY</span>
                <h2>SHOP ORBITAL</h2>
                <p>Cosméticos, pets e recolors organizados sem apagar inventário antigo.</p>
              </div>
              <div className="sn-shop-wallet-v250" aria-label="Tokens disponíveis">
                <span className="sn-token-icon-v20" />
                <strong>{localProfile.tokens}</strong>
                <small>TOKENS</small>
              </div>
              <button type="button" className="sn-shop-close-v250" onClick={() => setShopManagerOpen(false)} aria-label="Fechar Shop">×</button>
            </header>

            <div className="sn-shop-layout-v250">
              {(() => {
                const equipped = localProfile.equipped || {};
                const hovered = itemShopPorId(shopPreviewItemId);
                const previewEquipped = hovered ? { ...equipped, [hovered.slot]: hovered.id } : equipped;
                const previewItems = [
                  itemShopPorId(previewEquipped.recolor),
                  itemShopPorId(previewEquipped.middle),
                  itemShopPorId(previewEquipped.front),
                ].filter(Boolean) as ShopItem[];
                const pet = itemShopPorId(previewEquipped.pet);
                const ownedCount = SHOP_ITEMS.filter((item) => localProfile.inventory.includes(item.id)).length;
                const equippedCount = Object.values(equipped).filter(Boolean).length;
                return (
                  <aside className="sn-shop-preview-panel-v250">
                    <div className="sn-shop-orbit-stage-v250">
                      <div className="sn-shop-orbit-ring-v250" />
                      <div className="sn-shop-ship-preview-v250" aria-label="Preview da nave customizada">
                        <div className="sn-shop-preview-glow-v221" />
                        <img className="sn-shop-preview-base-v221" src={assetUrl("/game/player/ship-idle.png")} alt="" />
                        {previewItems.map((item) => item.id !== "recolor-classic" && (
                          <img key={item.id} className="sn-shop-preview-layer-v221" src={assetUrl(item.asset)} alt="" />
                        ))}
                        {pet && <img className="sn-shop-preview-pet-v250" src={assetUrl(pet.asset)} alt="" />}
                      </div>
                    </div>
                    <div className="sn-shop-preview-copy-v250">
                      <span>LOADOUT ATUAL</span>
                      <strong>{hovered ? hovered.name : pet ? pet.name : "Nave padrão"}</strong>
                      <small>{ownedCount}/{SHOP_ITEMS.length} itens · {equippedCount} equipados</small>
                    </div>
                    <div className="sn-shop-stat-grid-v250">
                      <span><b>{Math.round(profileBuffsForHud.speed * 100)}%</b><small>vel</small></span>
                      <span><b>{Math.round(profileBuffsForHud.shotSpeed * 100)}%</b><small>tiro</small></span>
                      <span><b>{Math.round(profileBuffsForHud.damage * 100)}%</b><small>dano</small></span>
                      <span><b>+{Math.round(profileBuffsForHud.tokenBonus * 100)}%</b><small>tokens</small></span>
                    </div>
                    <div className="sn-shop-equipped-v250">
                      {SHOP_SLOTS.map((slot) => {
                        const equippedItem = itemShopPorId(localProfile.equipped?.[slot]);
                        return (
                          <article key={slot}>
                            <span>{SHOP_SLOT_LABEL[slot]}</span>
                            <strong>{equippedItem?.name || "VAZIO"}</strong>
                            {slot !== "recolor" && equippedItem && (
                              <button type="button" onClick={() => desequiparSlotShop(slot)}>tirar</button>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </aside>
                );
              })()}

              <main className="sn-shop-store-panel-v250">
                <div className="sn-shop-toolbar-v250">
                  <div className="sn-shop-mode-tabs-v250">
                    <button type="button" className={shopMode === "store" ? "is-active" : ""} onClick={() => setShopMode("store")}>LOJA</button>
                    <button type="button" className={shopMode === "inventory" ? "is-active" : ""} onClick={() => setShopMode("inventory")}>INVENTÁRIO</button>
                  </div>
                  <label className="sn-shop-search-v250">
                    <span>BUSCAR</span>
                    <input value={shopSearch} onChange={(event) => setShopSearch(event.target.value)} placeholder="pet, asa, recolor..." />
                  </label>
                  <label className="sn-shop-filter-v250">
                    <span>RARIDADE</span>
                    <select value={shopRarityFilter} onChange={(event) => setShopRarityFilter(event.target.value as ShopRarityFilter)}>
                      <option value="all">Todas</option>
                      <option value="basic">Basic</option>
                      <option value="rare">Rare</option>
                      <option value="epic">Epic</option>
                      <option value="event">Event</option>
                      <option value="legendary">Legendary</option>
                    </select>
                  </label>
                </div>

                <div className="sn-shop-tabs-v250">
                  {SHOP_SLOTS.filter((slot) => slot !== "middle").map((slot) => (
                    <button type="button" key={slot} className={shopTab === slot ? "is-active" : ""} onClick={() => setShopTab(slot)}>
                      <span>{tituloAbaShop(slot)}</span>
                      {shopMode === "inventory" && <small>{SHOP_ITEMS.filter((item) => itemPertenceAbaShop(item, slot) && localProfile.inventory.includes(item.id)).length}</small>}
                    </button>
                  ))}
                </div>

                <div className="sn-shop-grid-v250">
                  {SHOP_ITEMS
                    .filter((item) => itemPertenceAbaShop(item, shopTab))
                    .filter((item) => shopMode === "store" || localProfile.inventory.includes(item.id))
                    .filter((item) => shopRarityFilter === "all" || item.rarity === shopRarityFilter)
                    .filter((item) => {
                      const q = shopSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${item.name} ${item.description} ${item.rarity} ${descricaoBuffs(item)}`.toLowerCase().includes(q);
                    })
                    .map((item) => {
                      const owned = localProfile.inventory.includes(item.id);
                      const equipped = localProfile.equipped?.[item.slot] === item.id;
                      const affordable = owned || localProfile.tokens >= item.price;
                      return (
                        <article
                          key={item.id}
                          className={`sn-shop-card-v250 is-${item.rarity} ${owned ? "is-owned" : ""} ${equipped ? "is-equipped" : ""} ${affordable ? "" : "is-locked"} ${shopPreviewItemId === item.id ? "is-previewing" : ""}`}
                          onMouseEnter={() => setShopPreviewItemId(item.id)}
                          onFocus={() => setShopPreviewItemId(item.id)}
                          onClick={() => setShopPreviewItemId(item.id)}
                        >
                          <div className="sn-shop-card-art-v250">
                            <img src={assetUrl(shopIconSrc(item, shopPreviewItemId === item.id))} alt="" onError={(event) => { event.currentTarget.src = assetUrl(item.asset); }} />
                            <i>{item.rarity.toUpperCase()}</i>
                            {equipped && <b>EQUIPADO</b>}
                          </div>
                          <div className="sn-shop-card-info-v250">
                            <strong>{item.name}</strong>
                            <p>{item.description}</p>
                            <em>{descricaoBuffs(item)}</em>
                            {item.slot === "pet" && (
                              <div className="sn-shop-pet-info-v253">
                                <span><b>PASSIVA</b>{item.passive || descricaoBuffs(item)}</span>
                                <span><b>ESPECIAL</b>{item.special || item.description}</span>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={item.disabled || (!owned && shopMode === "inventory")}
                            onClick={(event) => { event.stopPropagation(); owned ? equiparItemShop(item) : comprarItemShop(item); }}
                          >
                            {equipped ? "USANDO" : owned ? "EQUIPAR" : affordable ? `COMPRAR · ${item.price}` : `FALTAM ${item.price - localProfile.tokens}`}
                          </button>
                        </article>
                      );
                    })}
                  {SHOP_ITEMS
                    .filter((item) => itemPertenceAbaShop(item, shopTab))
                    .filter((item) => shopMode === "store" || localProfile.inventory.includes(item.id))
                    .filter((item) => shopRarityFilter === "all" || item.rarity === shopRarityFilter)
                    .filter((item) => {
                      const q = shopSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${item.name} ${item.description} ${item.rarity} ${descricaoBuffs(item)}`.toLowerCase().includes(q);
                    }).length === 0 && (
                    <article className="sn-shop-empty-v250">
                      <strong>Nenhum item encontrado.</strong>
                      <p>Limpe a busca/filtro ou troque de aba.</p>
                    </article>
                  )}
                </div>
              </main>
            </div>
          </section>
        </div>
      )}

      {profileManagerOpen && (
        <div className="sn-profile-backdrop-v20 sn-profile-backdrop-v250" role="dialog" aria-modal="true">
          <section className="sn-profile-manager-v250">
            <header className="sn-profile-header-v250">
              <div className="sn-profile-avatar-v250" style={{ "--profile-color": localProfile.color } as CSSProperties}>{inicialPerfil(localProfile)}</div>
              <div>
                <span>PERFIL LOCAL</span>
                <h2>{nomePerfilVisivel(localProfile)}</h2>
                <p>Código: <strong>{localProfile.friendCode}</strong></p>
              </div>
              <div className="sn-profile-header-stats-v250">
                <span><b>{localProfile.tokens}</b><small>tokens</small></span>
                <span><b>{localProfile.friends.length}</b><small>amigos</small></span>
                <span><b>{normalizarNotificacoesPerfil(localProfile.notifications).filter((item) => !item.readAt).length}</b><small>novas</small></span>
              </div>
              <button type="button" onClick={() => setProfileManagerOpen(false)} aria-label="Fechar perfil">×</button>
            </header>

            <nav className="sn-profile-tabs-v250" aria-label="Abas do perfil">
              {([
                ["overview", "VISÃO GERAL"],
                ["stats", "ESTATÍSTICAS"],
                ["achievements", "CONQUISTAS"],
                ["friends", "AMIGOS"],
                ["messages", "CAIXA"],
              ] as Array<[ProfileTab, string]>).map(([tab, label]) => (
                <button key={tab} type="button" className={profileActiveTab === tab ? "is-active" : ""} onClick={() => { setProfileActiveTab(tab); if (tab === "messages") marcarNotificacoesPerfilComoLidas(); }}>
                  {label}
                </button>
              ))}
            </nav>

            <div className="sn-profile-body-v250">
              {profileActiveTab === "overview" && (
                <div className="sn-profile-overview-v250">
                  <article className="sn-profile-card-v250 is-identity">
                    <h3>IDENTIDADE</h3>
                    <label>
                      Nome
                      <input value={localProfile.name} maxLength={16} onChange={(event) => atualizarNomePerfilLocal(event.target.value)} aria-describedby="sn-profile-name-help" />
                      <small id="sn-profile-name-help" className="sn-profile-name-help-v253">Nomes são únicos neste navegador e na sala online. Se aparecer aviso, escolha outro.</small>
                    </label>
                    <div className="sn-profile-colors-v250" aria-label="Cores do perfil">
                      {PROFILE_COLOR_OPTIONS.map((color) => (
                        <button key={color} type="button" className={localProfile.color === color ? "is-selected" : ""} style={{ "--profile-color": color } as CSSProperties} onClick={() => atualizarCorPerfilLocal(color)} aria-label={`Usar cor ${color}`} />
                      ))}
                    </div>
                  </article>

                  <article className="sn-profile-card-v250 is-ship">
                    <h3>NAVE E PET</h3>
                    {(() => {
                      const equipped = localProfile.equipped || {};
                      const previewItems = [itemShopPorId(equipped.recolor), itemShopPorId(equipped.middle), itemShopPorId(equipped.front)].filter(Boolean) as ShopItem[];
                      const pet = itemShopPorId(equipped.pet);
                      return (
                        <div className="sn-profile-loadout-grid-v250">
                          <div className="sn-profile-ship-preview-v250">
                            <img className="sn-shop-preview-base-v221" src={assetUrl("/game/player/ship-idle.png")} alt="" />
                            {previewItems.map((item) => item.id !== "recolor-classic" && <img key={item.id} className="sn-shop-preview-layer-v221" src={assetUrl(item.asset)} alt="" />)}
                            {pet && <img className="sn-shop-preview-pet-v250" src={assetUrl(pet.asset)} alt="" />}
                          </div>
                          <div>
                            <strong>{pet ? pet.name : "Sem pet equipado"}</strong>
                            <small>Vel {Math.round(profileBuffsForHud.speed * 100)}% · Tiro {Math.round(profileBuffsForHud.shotSpeed * 100)}% · Dano {Math.round(profileBuffsForHud.damage * 100)}% · Tokens +{Math.round(profileBuffsForHud.tokenBonus * 100)}%</small>
                            {pet?.passive && <small><b>Passiva:</b> {pet.passive}</small>}
                            {pet?.special && <small><b>Especial:</b> {pet.special}</small>}
                            <button type="button" onClick={() => { setShopTab("front"); setShopManagerOpen(true); }}>ABRIR SHOP</button>
                          </div>
                        </div>
                      );
                    })()}
                  </article>

                  <article className="sn-profile-card-v250 is-summary">
                    <h3>RESUMO</h3>
                    <div className="sn-profile-stat-grid-v250">
                      <span><b>{Math.floor(localProfile.stats.playTimeMs / 60000)}</b><small>min</small></span>
                      <span><b>{localProfile.stats.runsStarted}</b><small>runs</small></span>
                      <span><b>{localProfile.stats.enemiesKilled}</b><small>kills</small></span>
                      <span><b>{localProfile.stats.bestInfiniteWave}</b><small>recorde wave</small></span>
                    </div>
                  </article>
                </div>
              )}

              {profileActiveTab === "stats" && (
                <article className="sn-profile-card-v250 is-wide">
                  <h3>ESTATÍSTICAS DE MISSÃO</h3>
                  <div className="sn-profile-stat-grid-v250 is-large">
                    <span><b>{Math.floor(localProfile.stats.playTimeMs / 60000)}</b><small>min jogados</small></span>
                    <span><b>{localProfile.stats.runsStarted}</b><small>runs</small></span>
                    <span><b>{localProfile.stats.enemiesKilled}</b><small>inimigos</small></span>
                    <span><b>{localProfile.stats.deaths}</b><small>mortes</small></span>
                    <span><b>{localProfile.stats.chocadosKilled}</b><small>Chocado</small></span>
                    <span><b>{localProfile.stats.tokensCollected}</b><small>tokens coletados</small></span>
                    <span><b>{localProfile.stats.bestInfiniteWave}</b><small>recorde wave</small></span>
                    <span><b>{localProfile.stats.bestInfiniteScore}</b><small>recorde score</small></span>
                  </div>
                </article>
              )}

              {profileActiveTab === "achievements" && (
                <article className="sn-profile-card-v250 is-wide">
                  <h3>CONQUISTAS</h3>
                  <div className="sn-achievements-v250">
                    {normalizarConquistasPerfil(localProfile.achievements).map((achievement) => (
                      <div key={achievement.id} className={achievement.unlockedAt ? "is-unlocked" : "is-locked"}>
                        <strong>{achievement.unlockedAt ? "★" : "☆"} {achievement.title}</strong>
                        <small>{achievement.description}</small>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {profileActiveTab === "friends" && (
                <article className="sn-profile-card-v250 is-wide">
                  <h3>AMIGOS E PEDIDOS</h3>
                  <p className="sn-profile-muted-v20">Gerencie pedidos recebidos/enviados e convide amigos para o lobby online.</p>
                  <div className="sn-profile-friend-add-v250">
                    <input value={profileFriendCodeInput} onChange={(event) => setProfileFriendCodeInput(formatarCodigoAmizadeInput(event.target.value))} placeholder="SN-ABC123" />
                    <button type="button" onClick={() => adicionarPedidoAmizadeLocal(profileFriendCodeInput)}>ADICIONAR</button>
                  </div>
                  <div className="sn-profile-list-v250">
                    {localProfile.friendRequests.length === 0 && localProfile.friends.length === 0 && <em>Nenhum pedido ou amigo ainda.</em>}
                    {localProfile.friendRequests.map((request) => (
                      <div key={request.id} className="is-request">
                        <span>{request.name}</span>
                        <small>{request.direction === "sent" ? "pedido enviado" : "pedido recebido"} · {request.code}</small>
                        <div>
                          {request.direction === "received" && <button type="button" onClick={() => aceitarPedidoAmizadeLocal(request.id)}>ACEITAR</button>}
                          <button type="button" onClick={() => mostrarToastPerfil(`${request.name}: ${request.code}`)}>VER</button>
                          <button type="button" onClick={() => removerAmizadeOuPedidoLocal(request.id)}>REMOVER</button>
                        </div>
                      </div>
                    ))}
                    {localProfile.friends.map((friend) => (
                      <div key={friend.id} className="is-friend">
                        <span>{friend.name}</span>
                        <small>{friend.code || friend.id}</small>
                        <div>
                          <button type="button" onClick={() => mostrarToastPerfil(`${friend.name}: ${friend.code || friend.id}`)}>VER PERFIL</button>
                          <button type="button" onClick={() => removerAmizadeOuPedidoLocal(friend.id)}>APAGAR</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {profileActiveTab === "messages" && (
                <article className="sn-profile-card-v250 is-wide">
                  <header className="sn-profile-card-header-v250">
                    <div>
                      <h3>CAIXA DE MENSAGEM</h3>
                      <p>Atualizações, conquistas, shop e pedidos de amizade.</p>
                    </div>
                    <button type="button" onClick={limparNotificacoesPerfil}>LIMPAR</button>
                  </header>
                  <div className="sn-profile-notifications-v250">
                    {normalizarNotificacoesPerfil(localProfile.notifications).length === 0 && <em>Nenhuma notificação.</em>}
                    {normalizarNotificacoesPerfil(localProfile.notifications).map((notice) => (
                      <button key={notice.id} type="button" className={`is-${notice.kind} ${notice.readAt ? "is-read" : "is-unread"}`} onClick={() => { if (notice.action === "shop") setShopManagerOpen(true); if (notice.action === "friends") setProfileActiveTab("friends"); if (notice.action === "achievements") setProfileActiveTab("achievements"); }}>
                        <span>{notice.kind.toUpperCase()}</span>
                        <strong>{notice.title}</strong>
                        <small>{notice.message}</small>
                      </button>
                    ))}
                  </div>
                </article>
              )}
            </div>

            <footer className="sn-profile-footer-v250">
              {profileToast && <span>{profileToast}</span>}
              <button type="button" onClick={deletarPerfilLocal}>DELETAR CONTA LOCAL</button>
            </footer>
          </section>
        </div>
      )}

      {selectedOnlineProfileSlot !== null && (() => {
        const player = onlinePlayers.find((item) => item.slot === selectedOnlineProfileSlot);
        const summary = player?.profileSummary;
        const equipped = summary?.equipped || player?.cosmetics || {};
        const previewItems = [itemShopPorId(equipped.recolor), itemShopPorId(equipped.middle), itemShopPorId(equipped.front)].filter(Boolean) as ShopItem[];
        const pet = itemShopPorId(equipped.pet);
        return player ? (
          <div className="sn-profile-backdrop-v20 sn-online-profile-backdrop-v250" role="dialog" aria-modal="true">
            <section className="sn-online-profile-card-v250">
              <header>
                <div className="sn-profile-avatar-v250" style={{ "--profile-color": summary?.color || player.profileColor || LOCAL_PLAYER_COLORS[(player.slot - 1) % LOCAL_PLAYER_COLORS.length] } as CSSProperties}>{(summary?.name || player.name || `P${player.slot}`).slice(0, 1).toUpperCase()}</div>
                <div>
                  <span>PERFIL DO PLAYER</span>
                  <h2>{summary?.name || player.name || `P${player.slot}`}</h2>
                  <p>P{player.slot} · {player.device || "dispositivo"} {onlineHostSlot === player.slot ? "· HOST" : ""}</p>
                </div>
                <button type="button" onClick={() => setSelectedOnlineProfileSlot(null)} aria-label="Fechar perfil online">×</button>
              </header>
              <div className="sn-online-profile-body-v250">
                <div className="sn-profile-ship-preview-v250">
                  <img className="sn-shop-preview-base-v221" src={assetUrl("/game/player/ship-idle.png")} alt="" />
                  {previewItems.map((item) => item.id !== "recolor-classic" && <img key={item.id} className="sn-shop-preview-layer-v221" src={assetUrl(item.asset)} alt="" />)}
                  {pet && <img className="sn-shop-preview-pet-v250" src={assetUrl(pet.asset)} alt="" />}
                </div>
                <div className="sn-profile-stat-grid-v250">
                  <span><b>{summary?.tokens ?? "--"}</b><small>tokens</small></span>
                  <span><b>{summary?.friendsCount ?? "--"}</b><small>amigos</small></span>
                  <span><b>{summary?.achievementsUnlocked ?? "--"}/{summary?.achievementsTotal ?? "--"}</b><small>conquistas</small></span>
                  <span><b>{summary?.stats?.bestInfiniteWave ?? "--"}</b><small>recorde wave</small></span>
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => { salvarAmigosDaSalaOnline(); setSelectedOnlineProfileSlot(null); }}>SALVAR COMO AMIGO</button>
                <button type="button" onClick={() => setSelectedOnlineProfileSlot(null)}>FECHAR</button>
              </footer>
            </section>
          </div>
        ) : null;
      })()}

      {keyBindPrompt && (
        <div className="sn-modal-backdrop">
          <section className="sn-confirm-card">
            <span>CONFIGURAR CONTROLE</span>
            {keyBindPrompt.candidate ? (
              <>
                <h2>
                  {keyBindPrompt.kind === "gamepad"
                    ? labelBotaoControle(keyBindPrompt.candidate)
                    : labelTecla(keyBindPrompt.candidate)}
                </h2>
                <p>
                  Deseja atribuir{" "}
                  {keyBindPrompt.kind === "gamepad"
                    ? "este botão"
                    : "esta tecla"}{" "}
                  para <strong>{keyBindPrompt.label}</strong>?
                </p>
                <div>
                  <button type="button" onClick={confirmarCapturaTecla}>
                    CONFIRMAR
                  </button>
                  <button type="button" onClick={cancelarCapturaTecla}>
                    CANCELAR
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>
                  {keyBindPrompt.kind === "gamepad"
                    ? "PRESSIONE UM BOTÃO"
                    : "PRESSIONE UMA TECLA"}
                </h2>
                <p>
                  {keyBindPrompt.kind === "gamepad"
                    ? "Pressione qualquer botão do controle. B/Voltar cancela."
                    : "ESC cancela. Qualquer outra tecla será mostrada antes de confirmar."}
                </p>
                <button type="button" onClick={cancelarCapturaTecla}>
                  CANCELAR
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {mobileEditorOpen && (
        <div className="sn-modal-backdrop sn-mobile-editor-backdrop">
          <section className="sn-mobile-editor-card">
            <header>
              <div>
                <span>CONTROLES MOBILE</span>
                <h2>ARRASTE E REDIMENSIONE</h2>
              </div>
              <button type="button" onClick={() => setMobileEditorOpen(false)}>
                X
              </button>
            </header>
            <div className="sn-mobile-editor-stage">
              {(Object.keys(mobileControlLayout) as MobileControlId[]).map(
                (id) => {
                  const placement = mobileControlLayout[id];
                  return (
                    <button
                      type="button"
                      key={id}
                      className={`sn-editor-control ${selectedMobileControl === id ? "is-selected" : ""}`}
                      style={{
                        left: `${placement.x}%`,
                        top: `${placement.y}%`,
                        transform: `translate(-50%, -50%) scale(${placement.scale})`,
                      }}
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setSelectedMobileControl(id);
                        moverControleMobile(id, event);
                      }}
                      onPointerMove={(event) => {
                        if (
                          event.currentTarget.hasPointerCapture(event.pointerId)
                        )
                          moverControleMobile(id, event);
                      }}
                      onPointerUp={(event) => {
                        if (
                          event.currentTarget.hasPointerCapture(event.pointerId)
                        )
                          event.currentTarget.releasePointerCapture(
                            event.pointerId,
                          );
                      }}
                    >
                      {id !== "joystick" && (
                        <img
                          src={assetUrl(
                            id === "shot"
                              ? CONFIG.uiImages.mobileShot
                              : id === "strong"
                                ? CONFIG.uiImages.mobileStrong
                                : id === "boost"
                                  ? CONFIG.uiImages.mobileBoost
                                  : id === "dodge"
                                    ? CONFIG.uiImages.mobileDodge
                                    : id === "pause"
                                      ? CONFIG.uiImages.mobilePause
                                      : CONFIG.uiImages.mobileFullscreen,
                          )}
                          alt={MOBILE_CONTROL_LABELS[id]}
                          draggable={false}
                        />
                      )}
                      <span className="sn-editor-control-label">
                        {MOBILE_CONTROL_LABELS[id]}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
            <footer>
              <strong>{MOBILE_CONTROL_LABELS[selectedMobileControl]}</strong>
              <button
                type="button"
                onClick={() =>
                  atualizarControleMobile(selectedMobileControl, {
                    scale: clamp(
                      mobileControlLayout[selectedMobileControl].scale - 0.08,
                      0.42,
                      1.35,
                    ),
                  })
                }
              >
                −
              </button>
              <span>
                {Math.round(
                  mobileControlLayout[selectedMobileControl].scale * 100,
                )}
                %
              </span>
              <button
                type="button"
                onClick={() =>
                  atualizarControleMobile(selectedMobileControl, {
                    scale: clamp(
                      mobileControlLayout[selectedMobileControl].scale + 0.08,
                      0.42,
                      1.35,
                    ),
                  })
                }
              >
                +
              </button>
              <button
                type="button"
                onClick={() =>
                  persistirLayoutMobile(DEFAULT_MOBILE_CONTROL_LAYOUT)
                }
              >
                RESTAURAR
              </button>
              <button type="button" onClick={() => setMobileEditorOpen(false)}>
                SALVAR E FECHAR
              </button>
            </footer>
          </section>
        </div>
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
            <div className="game-daniel-dialog is-choice sn-dialog">
              <img
                className="game-daniel-icon"
                src={assetUrl(getDanielIcon("normal", danielMouthOpen))}
                alt="Daniel"
                draggable={false}
              />
              <div className="game-daniel-text">
                <strong>DANIEL</strong>
                <p>
                  Cleber, Daniel na escuta! Antes de encarar os robôs da
                  desinformação, quer fazer um tutorial rápido?
                </p>
              </div>
            </div>

            <div className="game-tutorial-choice-buttons">
              <button
                type="button"
                className={tutorialChoiceIndex === 0 ? "is-selected" : ""}
                onMouseEnter={() => setIndiceTutorialChoice(0)}
                onFocus={() => setIndiceTutorialChoice(0)}
                onClick={iniciarTutorialInterativo}
              >
                FAZER TUTORIAL
              </button>
              <button
                type="button"
                className={tutorialChoiceIndex === 1 ? "is-selected" : ""}
                onMouseEnter={() => setIndiceTutorialChoice(1)}
                onFocus={() => setIndiceTutorialChoice(1)}
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
            <span>
              PASSO{" "}
              {Math.min(
                TUTORIAL_ORDER.indexOf(tutorialStep) + 1,
                TUTORIAL_ORDER.length - 1,
              )}
              /{TUTORIAL_ORDER.length - 1}
            </span>
            <strong>
              {tutorialStep === "move" && "MOVIMENTE A NAVE"}
              {tutorialStep === "shot" && "DISPARE O TIRO NORMAL"}
              {tutorialStep === "strong" && "USE O TIRO FORTE"}
              {tutorialStep === "boost" && "TESTE O BOOST"}
              {tutorialStep === "dodge" && "FAÇA UMA ESQUIVA"}
              {tutorialStep === "done" && "TUTORIAL CONCLUÍDO"}
            </strong>
          </div>

          <div className="game-daniel-dialog game-daniel-tutorial-dialog sn-dialog">
            <img
              className="game-daniel-icon"
              src={assetUrl(
                getDanielIcon(
                  TUTORIAL_DANIEL_TEXT[tutorialStep].expression,
                  danielMouthOpen,
                ),
              )}
              alt="Daniel"
              draggable={false}
            />
            <div className="game-daniel-text">
              <strong>DANIEL</strong>
              <p>{textoTutorialDaniel(tutorialStep)}</p>
              {tutorialStep === "done" && (
                <span className="game-tutorial-auto-start">
                  Rota de combate liberada.
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      {gameState === "paused" && (
        <section className="game-screen game-pause-screen">
          <div
            className={`game-pause-card ${resumeCountdown !== null ? "is-counting" : ""}`}
          >
            {resumeCountdown === null ? (
              <>
                <p className="game-panel-label">JOGO PAUSADO</p>
                <h2>PAUSADO</h2>
                <button className={pauseIndex === 0 ? "is-selected" : ""} onMouseEnter={() => setIndicePause(0)} onFocus={() => setIndicePause(0)} onClick={pausarOuVoltar}>CONTINUAR</button>
                {onlineGameplayActive && onlinePauseRequestedBy && (
                  <div className="sn-online-unpause-strip">
                    <span>Votação para despausar</span>
                    {[1, 2, 3, 4].filter((slot) => onlinePlayers.some((p) => p.slot === slot)).map((slot) => (
                      <b key={slot} className={onlinePauseReadySlots.includes(slot) ? "is-ready" : ""}>P{slot} {onlinePauseReadySlots.includes(slot) ? "READY" : "UNREADY"}</b>
                    ))}
                  </div>
                )}
                <button className={pauseIndex === 1 ? "is-selected" : ""} onMouseEnter={() => setIndicePause(1)} onFocus={() => setIndicePause(1)} onClick={abrirConfiguracoes}>CONFIGURAÇÕES</button>
                {onlineGameplayActive && <button onClick={() => { enviarOnline({ type: "lobby_return_request" }); encerrarGameplayOnline(); limparCombate(); setEstado("onlineLobby"); }}>VOLTAR AO LOBBY ONLINE</button>}
                <button className={pauseIndex === 2 ? "is-selected" : ""} onMouseEnter={() => setIndicePause(2)} onFocus={() => setIndicePause(2)} onClick={voltarAoMenuPrincipal}>VOLTAR AO MENU</button>
              </>
            ) : (
              <div className="sn-resume-countdown" aria-live="assertive">
                <small>RETOMANDO TRANSMISSÃO</small>
                <strong key={resumeCountdown}>
                  {resumeCountdown > 0 ? resumeCountdown : "VAI!"}
                </strong>
                <span>Prepare a nave</span>
              </div>
            )}
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
            <span className="game-over-wave">
              VOCÊ CAIU NA WAVE {gameOverWave}
            </span>
            <h1>GAME OVER</h1>
            {currentModeRef.current === "infinite" && (
              <div
                className={`sn-run-status ${debugUsedRef.current ? "is-debug" : ""}`}
              >
                {debugUsedRef.current
                  ? "PARTIDA DE TESTE — PONTUAÇÃO FORA DO RANKING"
                  : `PONTUAÇÃO ${score.toString().padStart(6, "0")}`}
              </div>
            )}
            <button
              onClick={() => iniciarJogo(currentModeRef.current ?? "infinite")}
            >
              TENTAR NOVAMENTE
            </button>
            {currentModeRef.current === "infinite" && (
              <button
                onClick={() => {
                  setLeaderboardOpen(true);
                  carregarLeaderboardOnline().catch(() => {});
                }}
              >
                VER RANKING
              </button>
            )}
            {onlineGameplayActive && <button onClick={() => { enviarOnline({ type: "lobby_return_request" }); encerrarGameplayOnline(); limparCombate(); setEstado("onlineLobby"); }}>VOLTAR AO LOBBY ONLINE</button>}
            <button onClick={voltarAoMenuPrincipal}>VOLTAR AO MENU</button>
          </div>
        </section>
      )}

      {recordPromptOpen && gameState === "gameOver" && (
        <div className="sn-modal-backdrop">
          <section
            className="sn-record-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-title"
          >
            <small>CONECTADO - ONLINE</small>
            <h2 id="record-title">GRAVE SUAS INICIAIS</h2>
            <p>
              Seu sinal entrou no Top 10. Use exatamente três letras, como nos
              arcades clássicos.
            </p>
            <div className="sn-record-stats">
              <span>
                <b>{score.toString().padStart(6, "0")}</b>
                <small>PONTOS</small>
              </span>
              <span>
                <b>W{gameOverWave}</b>
                <small>WAVE</small>
              </span>
            </div>
            <label className="sn-arcade-initials-label">
              INICIAIS DO PILOTO
              <input
                className="sn-arcade-initials-input"
                value={recordName}
                onChange={(event) => {
                  setRecordName(normalizeArcadeInitials(event.target.value));
                  setRecordError("");
                }}
                maxLength={3}
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                placeholder="AAA"
                aria-describedby="record-initials-help"
              />
              <small id="record-initials-help">
                3 LETRAS · A–Z · filtro anti-ofensas ativo
              </small>
            </label>
            {recordError && (
              <p className="sn-record-error" role="alert">
                {recordError}
              </p>
            )}
            <div>
              <button
                onClick={registrarRecordeAtual}
                disabled={recordName.length !== 3}
              >
                REGISTRAR
              </button>
              <button
                onClick={() => {
                  setRecordPromptOpen(false);
                  setRecordError("");
                }}
              >
                AGORA NÃO
              </button>
            </div>
          </section>
        </div>
      )}

      {leaderboardOpen && (
        <div className="sn-modal-backdrop">
          <section
            className="sn-leaderboard-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <small>
                  {leaderboardStatus === "online"
                    ? "CONECTADO - ONLINE"
                    : "ARQUIVO LOCAL"}
                </small>
                <h2>TOP 10 INFINITO</h2>
              </div>
              <button onClick={() => setLeaderboardOpen(false)}>X</button>
            </header>
            <div className="sn-ranking-columns">
              <span>POS</span>
              <span>PILOTO</span>
              <span>PONTOS</span>
              <span>WAVE</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="sn-ranking-empty">
                O ranking está vazio. Seja o primeiro piloto a registrar um
                recorde.
              </p>
            ) : (
              <ol>
                {leaderboard.map((entry, index) => (
                  <li className={`sn-rank-${index + 1}`} key={entry.id}>
                    <b>#{index + 1}</b>
                    <strong>{entry.name}</strong>
                    <span>{entry.score.toString().padStart(6, "0")}</span>
                    <em>W{entry.wave}</em>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}

      {gameState === "victory" && (
        <section
          className={`game-screen sn-victory-screen victory-step-${victoryStep}`}
        >
          <div className="sn-victory-stars" />
          <div className="sn-victory-burst" />
          <div className="sn-victory-scanlines" />
          <div className="sn-victory-earth" />
          <div className="sn-victory-ship" />
          <div className="sn-victory-shell">
            <div className="sn-victory-broadcast">
              <span>CANAL SPACE NEWS</span>
              <strong>
                {victoryStep === 0
                  ? "SINCRONIZANDO SINAL"
                  : "TRANSMISSÃO RESTAURADA"}
              </strong>
            </div>
            {victoryStep >= 1 && (
              <div className="sn-victory-title">
                <small>MISSÃO CONCLUÍDA</small>
                <h1>VITÓRIA!</h1>
                <span>A TERRA FOI SALVA DA DESINFORMAÇÃO</span>
              </div>
            )}
            <div className="sn-victory-dialog sn-dialog">
              <img
                src={assetUrl(getDanielIcon("happy", danielMouthOpen))}
                alt="Daniel"
                draggable={false}
              />
              <div>
                <strong>DANIEL</strong>
                <p>
                  {victoryStep === 0 &&
                    "Cleber... os sensores estão voltando. Mantém a nave estável."}
                  {victoryStep === 1 &&
                    "Confirmado! O núcleo do Chocado foi destruído. Os portais estão fechando."}
                  {victoryStep === 2 &&
                    "Espera. Um último pacote de desinformação escapou do núcleo."}
                  {victoryStep >= 3 &&
                    "Interceptamos a mensagem. Agora termina o trabalho no Xô, falsiane!."}
                </p>
              </div>
            </div>
            {victoryStep >= 2 && (
              <article className="sn-victory-fake-news">
                <header>
                  <span>SINAL RESIDUAL INTERCEPTADO</span>
                  <b>
                    ARQUIVO #
                    {String(
                      Math.abs(
                        victoryFakeNews
                          .split("")
                          .reduce((acc, char) => acc + char.charCodeAt(0), 0),
                      ) % 9999,
                    ).padStart(4, "0")}
                  </b>
                </header>
                <blockquote>{victoryFakeNews}</blockquote>
                <p>
                  Envie esta mensagem para o detector e descubra por que ela não
                  é confiável.
                </p>
                <div>
                  <button type="button" onClick={enviarFakeNewsAoSite}>
                    ANALISAR NO XÔ, FALSIANE!
                  </button>
                  <button type="button" onClick={copiarFakeNewsFinal}>
                    {victoryFakeNewsCopied ? "COPIADO!" : "COPIAR MENSAGEM"}
                  </button>
                </div>
              </article>
            )}
            {victoryStep >= 3 && (
              <div className="sn-victory-actions">
                <button onClick={() => iniciarJogo("story")}>
                  JOGAR NOVAMENTE
                </button>
                <button onClick={voltarAoMenuPrincipal}>VOLTAR AO MENU</button>
              </div>
            )}
          </div>
        </section>
      )}

      {(gameState === "playing" || gameState === "tutorial") && (
        <button
          type="button"
          className="sn-pause-button"
          onClick={pausarOuVoltar}
          aria-label="Pausar jogo"
        >
          <img
            src={assetUrl(CONFIG.uiImages.mobilePause)}
            alt="pause"
            draggable={false}
          />
          <span>P / ESC</span>
        </button>
      )}

      {(gameState === "playing" || gameState === "tutorial") && (
        <div
          className="sn-mobile-controls"
          onContextMenu={(event) => event.preventDefault()}
        >
          <div
            className="sn-mobile-joystick"
            style={mobileControlStyle("joystick")}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              joystickGeometryRef.current = null;
              atualizarJoystick(event);
            }}
            onPointerMove={(event) => {
              event.preventDefault();
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                atualizarJoystick(event);
            }}
            onPointerUp={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
              resetarJoystick();
            }}
            onPointerCancel={resetarJoystick}
          >
            <div
              ref={mobileStickKnobRef}
              className="sn-mobile-joystick-knob"
              style={{ transform: "translate(-50%, -50%)" }}
            />
          </div>

          <button
            className="sn-mobile-button shot"
            style={mobileControlStyle("shot")}
            onPointerDown={(event) => {
              event.preventDefault();
              mobileShootRef.current = true;
            }}
            onPointerUp={() => {
              mobileShootRef.current = false;
            }}
            onPointerCancel={() => {
              mobileShootRef.current = false;
            }}
            disabled={gameState === "tutorial" && tutorialStep !== "shot"}
            aria-label="tiro normal"
          >
            <img
              src={CONFIG.uiImages.mobileShot}
              alt="tiro normal"
              draggable={false}
            />
          </button>

          <button
            className="sn-mobile-button strong"
            style={mobileControlStyle("strong")}
            onPointerDown={(event) => {
              event.preventDefault();
              keysRef.current[
                normalizarTeclaConfig(CONFIG.settings.pcStrongKey)
              ] = true;
            }}
            onPointerUp={() => {
              keysRef.current[
                normalizarTeclaConfig(CONFIG.settings.pcStrongKey)
              ] = false;
            }}
            onPointerCancel={() => {
              keysRef.current[
                normalizarTeclaConfig(CONFIG.settings.pcStrongKey)
              ] = false;
            }}
            disabled={
              strongCooldown > 0 ||
              (gameState === "tutorial" && tutorialStep !== "strong")
            }
            aria-label="tiro forte"
          >
            {strongCooldown > 0 ? (
              <span>{strongCooldown}s</span>
            ) : (
              <img
                src={CONFIG.uiImages.mobileStrong}
                alt="tiro forte"
                draggable={false}
              />
            )}
          </button>

          <button
            className="sn-mobile-button boost"
            style={mobileControlStyle("boost")}
            onPointerDown={(event) => {
              event.preventDefault();
              keysRef.current[
                normalizarTeclaConfig(CONFIG.settings.pcBoostKey)
              ] = true;
            }}
            onPointerUp={() => {
              keysRef.current[
                normalizarTeclaConfig(CONFIG.settings.pcBoostKey)
              ] = false;
            }}
            onPointerCancel={() => {
              keysRef.current[
                normalizarTeclaConfig(CONFIG.settings.pcBoostKey)
              ] = false;
            }}
            disabled={
              boostCharge < CONFIG.gameplay.boost.maxCharge ||
              (gameState === "tutorial" && tutorialStep !== "boost")
            }
            aria-label="boost"
          >
            <img
              src={CONFIG.uiImages.mobileBoost}
              alt="boost"
              draggable={false}
            />
          </button>

          <button
            className="sn-mobile-button dodge"
            style={mobileControlStyle("dodge")}
            onPointerDown={(event) => {
              event.preventDefault();
              executarEsquiva();
            }}
            disabled={gameState === "tutorial" && tutorialStep !== "dodge"}
            aria-label="dodge"
          >
            <img
              src={CONFIG.uiImages.mobileDodge}
              alt="dodge"
              draggable={false}
            />
          </button>

          {petEquipadoAtual() && (
            <button
              className={`sn-mobile-button pet is-pet-button-v250 ${petAbilityCooldownUi > 0 ? "is-cooling" : "is-ready"}`}
              style={mobileControlStyle("pet")}
              onPointerDown={(event) => {
                event.preventDefault();
                mobilePetPressedRef.current = true;
                ativarHabilidadePetManual();
                window.setTimeout(() => { mobilePetPressedRef.current = false; }, 120);
              }}
              disabled={petAbilityCooldownUi > 0}
              aria-label="habilidade do pet"
            >
              {petAbilityCooldownUi > 0 ? <span>{petAbilityCooldownUi}s</span> : <img src={assetUrl(petEquipadoAtual()?.asset || CONFIG.uiImages.mobilePet)} alt="pet" draggable={false} />}
            </button>
          )}

          <button
            className="sn-mobile-button system fullscreen"
            style={mobileControlStyle("fullscreen")}
            onPointerDown={(event) => {
              event.preventDefault();
              solicitarFullscreen();
            }}
            aria-label="tela cheia"
          >
            <img
              src={CONFIG.uiImages.mobileFullscreen}
              alt="tela cheia"
              draggable={false}
            />
          </button>

          <button
            className="sn-mobile-button system pause"
            style={mobileControlStyle("pause")}
            onPointerDown={(event) => {
              event.preventDefault();
              pausarOuVoltar();
            }}
            aria-label="pause"
          >
            <img
              src={CONFIG.uiImages.mobilePause}
              alt="pause"
              draggable={false}
            />
          </button>
        </div>
      )}

      {[
        "title",
        "mainMenu",
        "settings",
        "extras",
        "paused",
        "gameOver",
        "victory",
      ].includes(gameState) && (
        <FeedbackButton contexto="Space News" compacto />
      )}
    </main>
  );
}
