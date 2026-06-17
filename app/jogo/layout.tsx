import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Space News | Batalha contra a Desinformação",
  description:
    "Um shoot'em up retro-futurista do projeto Xô, falsiane!, com modo história, infinito, chefes e ranking online.",
  icons: {
    icon: "/game-icon.png",
    shortcut: "/game-icon.png",
    apple: "/game-icon.png",
  },
};

type JogoLayoutProps = {
  children: ReactNode;
};

export default function JogoLayout({ children }: JogoLayoutProps) {
  return children;
}
