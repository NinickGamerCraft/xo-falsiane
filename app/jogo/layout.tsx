import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Space News | Combate à Desinformação",
  description:
    "Um shoot'em up retrofuturista com história, chefes, modo infinito e ranking online.",
  icons: {
    icon: [
      {
        url: "/icons/space-news.png?v=2",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/icons/space-news.png?v=2",
    apple: "/icons/space-news.png?v=2",
  },
};

export default function JogoLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}