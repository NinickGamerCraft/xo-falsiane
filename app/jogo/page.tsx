"use client";

import { useEffect, useRef, useState } from "react";

type Shot = {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  damage: number;
  color: string;
};

export default function JogoPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const mobileShoot = useRef(false);

  const [tiroForteCooldown, setTiroForteCooldown] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1280;
    canvas.height = 720;

    const player = {
      x: 100,
      y: 300,
      speed: 5,
      cooldown: 0,
      strongCooldown: 0,
    };

    let shots: Shot[] = [];
    let animationFrame: number;

    function tiroNormal() {
      if (player.cooldown > 0) return;

      shots.push({
        x: player.x + 42,
        y: player.y + 17,
        w: 22,
        h: 6,
        speed: 11,
        damage: 1,
        color: "#60a5fa",
      });

      player.cooldown = 8;
    }

    function tiroForte() {
      if (player.strongCooldown > 0) return;

      shots.push({
        x: player.x + 42,
        y: player.y + 10,
        w: 42,
        h: 18,
        speed: 9,
        damage: 5,
        color: "#facc15",
      });

      player.strongCooldown = 480;
      setTiroForteCooldown(8);
    }

    const intervaloCooldown = setInterval(() => {
      setTiroForteCooldown((valor) => Math.max(0, valor - 1));
    }, 1000);

    function gameLoop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (keys.current["ArrowUp"] || keys.current["w"]) player.y -= player.speed;
      if (keys.current["ArrowDown"] || keys.current["s"]) player.y += player.speed;
      if (keys.current["ArrowLeft"] || keys.current["a"]) player.x -= player.speed;
      if (keys.current["ArrowRight"] || keys.current["d"]) player.x += player.speed;

      if (keys.current["z"] || mobileShoot.current) tiroNormal();
      if (keys.current["x"]) tiroForte();

      player.x = Math.max(0, Math.min(canvas.width - 40, player.x));
      player.y = Math.max(0, Math.min(canvas.height - 40, player.y));

      if (player.cooldown > 0) player.cooldown--;
      if (player.strongCooldown > 0) player.strongCooldown--;

      shots = shots
        .map((shot) => ({
          ...shot,
          x: shot.x + shot.speed,
        }))
        .filter((shot) => shot.x < canvas.width + 60);

      ctx.fillStyle = "#60a5fa";
      ctx.fillRect(player.x, player.y, 44, 36);

      ctx.fillStyle = "#dbeafe";
      ctx.fillRect(player.x + 30, player.y + 10, 12, 12);

      for (const shot of shots) {
        ctx.fillStyle = shot.color;
        ctx.fillRect(shot.x, shot.y, shot.w, shot.h);
      }

      ctx.fillStyle = "white";
      ctx.font = "24px monospace";
      ctx.fillText("Z: tiro normal", 24, 38);
      ctx.fillText(
        player.strongCooldown > 0
          ? `X: tiro forte carregando...`
          : "X: tiro forte pronto!",
        24,
        70
      );

      animationFrame = requestAnimationFrame(gameLoop);
    }

    const down = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };

    const up = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(intervaloCooldown);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  function atirarForteMobile() {
    const evento = new KeyboardEvent("keydown", { key: "x" });
    window.dispatchEvent(evento);

    setTimeout(() => {
      const soltar = new KeyboardEvent("keyup", { key: "x" });
      window.dispatchEvent(soltar);
    }, 80);
  }

  return (
    <main className="game-page">
      <div className="game-wrapper">
        <h1>🚀 Space News</h1>

        <canvas ref={canvasRef} className="game-canvas" />

        <div className="game-controls-mobile">
          <button
            onTouchStart={() => {
              mobileShoot.current = true;
            }}
            onTouchEnd={() => {
              mobileShoot.current = false;
            }}
            onMouseDown={() => {
              mobileShoot.current = true;
            }}
            onMouseUp={() => {
              mobileShoot.current = false;
            }}
          >
            🔫 Tiro
          </button>

          <button
            onClick={atirarForteMobile}
            disabled={tiroForteCooldown > 0}
          >
            💥 Forte {tiroForteCooldown > 0 ? `${tiroForteCooldown}s` : ""}
          </button>
        </div>

        <p>
          WASD ou Setas para mover • Z para tiro normal • X para tiro forte
        </p>
      </div>
    </main>
  );
}